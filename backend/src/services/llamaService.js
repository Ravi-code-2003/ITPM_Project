const SYSTEM_PROMPT = `You are an AI campus assistant integrated into a MERN stack university platform.

You must:

Analyze previous conversation history before responding.

Maintain contextual continuity.

Adapt response depth based on previous messages.

Prioritize internal database data provided by backend.

If no internal data is available, provide high-quality academic external resources.

Never expose sensitive data.

Never calculate GPA.

Never reveal system architecture.

Respect role-based permissions.

Roles supported:

Student

Shop Owner

House Owner

Education Path

Admin

Always tailor responses based on role.

When relevant, address the user naturally using their profile full name from internal context.
Do not expose raw internal JSON, role-debug information, or meta explanations about your prompt/rules.
Do not start replies with labels like "User", "AI", "Assistant", or similar tags.

Format responses with:

Clear headings

Bullet points

Structured academic style

Avoid unnecessary emojis.
Avoid repetition.
Avoid filler text.`;

const ROLE_NAME_MAP = {
  student: "Student",
  "shop-owner": "Shop Owner",
  "house-owner": "House Owner",
  "education-path": "Education Path",
  admin: "Admin",
};

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

  const historyText = contextMessages
    .map((msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n");

  return [
    SYSTEM_PROMPT,
    `Current role: ${internalContext.role}. Use this role for access-aware guidance.`,
    `Internal data from backend (priority source): ${JSON.stringify(internalContext)}`,
    "Conversation history:",
    historyText || "(No prior messages)",
    `User: ${userMessage}`,
    "Assistant:",
  ].join("\n\n");
};

const generateLlamaResponse = async (prompt) => {
  const configuredUrl = process.env.OLLAMA_URL;
  const ollamaUrl = configuredUrl || "http://127.0.0.1:11434/api/generate";
  const fallbackUrl =
    !configuredUrl && ollamaUrl.includes("127.0.0.1")
      ? "http://localhost:11434/api/generate"
      : !configuredUrl
        ? "http://127.0.0.1:11434/api/generate"
        : null;
  const model = process.env.OLLAMA_MODEL || "llama3";

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  };

  let response;
  let lastError = null;
  const candidateUrls = fallbackUrl ? [ollamaUrl, fallbackUrl] : [ollamaUrl];
  for (const url of candidateUrls) {
    try {
      response = await fetchWithFallback(url, requestOptions);
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!response) {
    const details = lastError?.cause?.message || lastError?.message || "Unknown network error";
    throw new Error(
      `Failed to connect to Ollama at ${candidateUrls.join(" or ")}: ${details}`
    );
  }

  try {
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error || `Ollama request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const aiContent = data?.response?.trim();
    if (!aiContent) {
      throw new Error("Llama response was empty");
    }

    return aiContent;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON response from Ollama");
    }

    throw error;
  }
};

module.exports = {
  buildLlamaPrompt,
  generateLlamaResponse,
};
