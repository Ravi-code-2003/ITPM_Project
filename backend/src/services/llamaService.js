const MODEL = process.env.OLLAMA_MODEL || "llama3:latest";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS, 10) || 120000;
const NUM_PREDICT = parseInt(process.env.OLLAMA_NUM_PREDICT, 10) || 150;
const TEMPERATURE = Number(process.env.OLLAMA_TEMPERATURE || 0.7);

const SYSTEM_PROMPT = `You are an AI campus assistant integrated into a MERN stack university platform.

Rules:
- Maintain continuity using recent context.
- Respect role-based permissions.
- Prioritize internal backend context over assumptions.
- Never expose sensitive data.
- Never calculate GPA.
- Never reveal system architecture.
- Use clear headings and concise bullet points when helpful.
- Avoid filler text and unnecessary emojis.`;

const ROLE_NAME_MAP = {
  student: "Student",
  "shop-owner": "Shop Owner",
  "house-owner": "House Owner",
  "education-path": "Education Path",
  admin: "Admin",
};

class LlamaServiceError extends Error {
  constructor(message, code = "LLAMA_ERROR", status = 500, details = null) {
    super(message);
    this.name = "LlamaServiceError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const fetchWithFallback = (...args) => {
  if (typeof fetch === "function") {
    return fetch(...args);
  }

  return import("node-fetch").then(({ default: nodeFetch }) => nodeFetch(...args));
};

const buildInternalContext = (user) => {
  const roleName = ROLE_NAME_MAP[user.role] || user.role;
  const internalContext = {
    role: roleName,
    profile: {
      fullName: user.fullName,
      email: user.email,
      status: user.status,
      isApproved: user.isApproved,
    },
  };

  if (user.role === "shop-owner") {
    internalContext.profile.shopName = user.shopName || "";
    internalContext.profile.location = user.location || "";
  }

  if (user.role === "house-owner") {
    internalContext.profile.address = user.address || "";
  }

  if (user.role === "education-path") {
    internalContext.profile.organizationName = user.organizationName || "";
    internalContext.profile.organizationType = user.organizationType || "";
    internalContext.profile.organizationEmail = user.organizationEmail || "";
  }

  return internalContext;
};

const buildLlamaPrompt = ({ user, contextMessages, userMessage }) => {
  const internalContext = buildInternalContext(user);
  const promptSections = [
    `SYSTEM: ${SYSTEM_PROMPT}`,
    `SYSTEM: Current role is ${internalContext.role}. Tailor guidance accordingly.`,
    `SYSTEM: Internal profile context: ${JSON.stringify(internalContext.profile)}`,
  ];

  for (const msg of contextMessages) {
    if (msg.sender === "user") {
      promptSections.push(`USER: ${msg.content}`);
    } else {
      promptSections.push(`ASSISTANT: ${msg.content}`);
    }
  }

  promptSections.push(`USER: ${userMessage}`);
  promptSections.push("ASSISTANT:");

  return promptSections.join("\n");
};

const parseOllamaChunk = (line) => {
  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch (error) {
    throw new LlamaServiceError("Invalid streaming JSON from Ollama", "OLLAMA_BAD_JSON", 502, {
      rawLine: line.slice(0, 200),
    });
  }

  if (parsed.error) {
    throw new LlamaServiceError(parsed.error, "OLLAMA_UPSTREAM_ERROR", 502, parsed);
  }

  return parsed;
};

const streamLlamaResponse = async ({ prompt, onToken }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  const requestStartTime = Date.now();

  let response;
  try {
    response = await fetchWithFallback(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: true,
        options: {
          num_predict: NUM_PREDICT,
          temperature: TEMPERATURE,
        },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      throw new LlamaServiceError("Ollama request timed out", "OLLAMA_TIMEOUT", 504);
    }

    throw new LlamaServiceError(
      "Ollama is not reachable. Ensure Ollama is running locally.",
      "OLLAMA_UNREACHABLE",
      503,
      { cause: error.message }
    );
  }

  if (!response.ok) {
    clearTimeout(timeout);
    let body = null;
    try {
      body = await response.json();
    } catch (error) {
      body = null;
    }

    throw new LlamaServiceError(
      body?.error || `Ollama request failed with status ${response.status}`,
      "OLLAMA_HTTP_ERROR",
      502,
      body
    );
  }

  if (!response.body) {
    clearTimeout(timeout);
    throw new LlamaServiceError("Ollama returned no stream body", "OLLAMA_NO_STREAM", 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let generatedTokens = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }

        const parsed = parseOllamaChunk(trimmed);
        const token = parsed.response || "";

        if (token) {
          fullText += token;
          generatedTokens += 1;
          await onToken(token);
        }

        if (parsed.done) {
          break;
        }
      }
    }

    if (buffer.trim()) {
      const parsed = parseOllamaChunk(buffer.trim());
      const token = parsed.response || "";
      if (token) {
        fullText += token;
        generatedTokens += 1;
        await onToken(token);
      }
    }
  } catch (error) {
    if (error instanceof LlamaServiceError) {
      throw error;
    }

    throw new LlamaServiceError(
      "Failed while reading Ollama stream",
      "OLLAMA_STREAM_READ_ERROR",
      502,
      { cause: error.message }
    );
  } finally {
    clearTimeout(timeout);
    reader.releaseLock();
  }

  const responseEndTime = Date.now();
  const durationMs = responseEndTime - requestStartTime;
  const tokensPerSecond = durationMs > 0 ? (generatedTokens / durationMs) * 1000 : 0;

  return {
    text: fullText.trim(),
    metrics: {
      requestStartTime,
      responseEndTime,
      durationMs,
      generatedTokens,
      tokensPerSecond,
    },
  };
};

module.exports = {
  LlamaServiceError,
  buildLlamaPrompt,
  streamLlamaResponse,
};
