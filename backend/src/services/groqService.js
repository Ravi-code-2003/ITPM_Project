const Groq = require("groq-sdk");

class GroqServiceError extends Error {
  constructor(message, code = "GROQ_SERVICE_ERROR", status = 500, details = null) {
    super(message);
    this.name = "GroqServiceError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const GROQ_MODEL = process.env.GROQ_MODEL || process.env.AI_MODEL;
const GROQ_TEMPERATURE = Number(process.env.GROQ_TEMPERATURE ?? process.env.AI_TEMPERATURE ?? 0.2);

const normalizeBaseUrl = (value) => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/openai/v1")) {
    return trimmed.slice(0, -"/openai/v1".length);
  }

  return trimmed;
};

const createClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqServiceError(
      "Missing GROQ_API_KEY for Groq API access",
      "GROQ_API_KEY_MISSING",
      500
    );
  }

  const baseURL = normalizeBaseUrl(process.env.GROQ_BASE_URL);
  return new Groq({ apiKey, ...(baseURL ? { baseURL } : {}) });
};

const generateChatResponse = async (messages, { model = GROQ_MODEL, temperature = GROQ_TEMPERATURE } = {}) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new GroqServiceError("Messages array is required", "INVALID_MESSAGES", 400, { messages });
  }

  if (!model) {
    throw new GroqServiceError("Missing GROQ_MODEL configuration", "GROQ_MODEL_MISSING", 500);
  }

  const groq = createClient();

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages,
      temperature,
    });

    const text = completion?.choices?.[0]?.message?.content?.trim() || "";
    if (!text) {
      throw new GroqServiceError("Groq returned an empty response", "EMPTY_RESPONSE", 502, {
        completion,
      });
    }

    return text;
  } catch (error) {
    if (error instanceof GroqServiceError) {
      throw error;
    }

    const status = error?.status || error?.statusCode || 502;
    const code = error?.code || "GROQ_API_ERROR";
    throw new GroqServiceError(error?.message || "Groq API request failed", code, status, {
      name: error?.name,
      cause: error?.cause,
      details: error?.response?.data || error?.response || null,
    });
  }
};

module.exports = {
  GroqServiceError,
  generateChatResponse,
};
