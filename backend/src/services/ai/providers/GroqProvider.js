const AIServiceError = require("../AIServiceError");

const parseIntWithDefault = (value, defaultValue) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

const safeParseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

class GroqProvider {
  constructor({
    apiKey = process.env.GROQ_API_KEY,
    baseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    chatEndpoint = process.env.GROQ_CHAT_ENDPOINT || "/chat/completions",
    timeoutMs = parseIntWithDefault(process.env.AI_REQUEST_TIMEOUT_MS, 30000),
    logger = console,
  } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.chatEndpoint = chatEndpoint;
    this.timeoutMs = timeoutMs;
    this.logger = logger;
    this.name = "groq";
  }

  getChatUrl() {
    const normalizedBase = this.baseUrl.replace(/\/+$/, "");
    const normalizedEndpoint = this.chatEndpoint.startsWith("/")
      ? this.chatEndpoint
      : `/${this.chatEndpoint}`;
    return `${normalizedBase}${normalizedEndpoint}`;
  }

  ensureConfig() {
    if (!this.apiKey) {
      throw new AIServiceError(
        "Missing GROQ_API_KEY for Groq provider",
        "AI_PROVIDER_MISCONFIGURED",
        500,
        { provider: this.name }
      );
    }
  }

  async generate({ messages, model, temperature, attempt }) {
    this.ensureConfig();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await fetch(this.getChatUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          stream: false,
        }),
        signal: controller.signal,
      });

      const durationMs = Date.now() - startedAt;

      if (!response.ok) {
        const body = await safeParseJson(response);
        const upstreamMessage =
          body?.error?.message || body?.message || `Groq request failed with status ${response.status}`;
        const retryable = response.status >= 500 || response.status === 429;
        throw new AIServiceError(
          upstreamMessage,
          response.status >= 500 ? "GROQ_UPSTREAM_ERROR" : "GROQ_BAD_REQUEST",
          retryable ? 502 : response.status,
          { provider: this.name, status: response.status, body, attempt },
          retryable
        );
      }

      const data = await safeParseJson(response);
      const text = data?.choices?.[0]?.message?.content?.trim() || "";
      if (!text) {
        throw new AIServiceError(
          "Model returned empty response",
          "EMPTY_RESPONSE",
          502,
          { provider: this.name, response: data, attempt }
        );
      }

      this.logger.log(
        `[AI] Groq request succeeded`,
        JSON.stringify({ provider: this.name, durationMs, attempt, model })
      );

      return {
        text,
        metrics: {
          provider: this.name,
          durationMs,
          attempt,
          model,
        },
      };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new AIServiceError(
          "Groq request timed out",
          "GROQ_TIMEOUT",
          504,
          { provider: this.name, timeoutMs: this.timeoutMs, attempt },
          true
        );
      }

      if (error instanceof AIServiceError) {
        throw error;
      }

      throw new AIServiceError(
        "Failed to reach Groq API",
        "GROQ_UNREACHABLE",
        503,
        { provider: this.name, cause: error.message, attempt },
        true
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = GroqProvider;
