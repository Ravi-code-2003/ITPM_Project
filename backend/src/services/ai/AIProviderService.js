const AIServiceError = require("./AIServiceError");
const GroqProvider = require("./providers/GroqProvider");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseIntWithDefault = (value, defaultValue) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

class AIProviderService {
  constructor({
    providerName = process.env.AI_PROVIDER || "groq",
    model = process.env.AI_MODEL,
    retryAttempts = parseIntWithDefault(process.env.AI_RETRY_ATTEMPTS, 1),
    retryDelayMs = parseIntWithDefault(process.env.AI_RETRY_DELAY_MS, 600),
    logger = console,
  } = {}) {
    this.providerName = providerName;
    this.model = model;
    this.retryAttempts = retryAttempts;
    this.retryDelayMs = retryDelayMs;
    this.logger = logger;
    this.providers = {
      groq: new GroqProvider({ logger }),
    };
  }

  getProvider() {
    const provider = this.providers[this.providerName];
    if (!provider) {
      throw new AIServiceError(
        `Unsupported AI provider: ${this.providerName}`,
        "UNSUPPORTED_AI_PROVIDER",
        500,
        { provider: this.providerName }
      );
    }
    return provider;
  }

  async generateResponse({ messages, model, temperature }) {
    const provider = this.getProvider();
    const resolvedModel = model || this.model;
    if (!resolvedModel) {
      throw new AIServiceError(
        "Missing AI_MODEL configuration",
        "AI_PROVIDER_MISCONFIGURED",
        500,
        { provider: provider.name }
      );
    }

    const totalAttempts = Math.max(1, this.retryAttempts + 1);
    let lastError;

    for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
      try {
        return await provider.generate({
          messages,
          model: resolvedModel,
          temperature,
          attempt,
        });
      } catch (error) {
        lastError = error;
        const shouldRetry = attempt < totalAttempts && error.retryable;
        this.logger.error(
          `[AI] Provider attempt failed`,
          JSON.stringify({
            provider: provider.name,
            attempt,
            code: error.code || "AI_PROVIDER_ERROR",
            status: error.status || 500,
            message: error.message,
            retryable: Boolean(error.retryable),
            willRetry: shouldRetry,
          })
        );

        if (!shouldRetry) {
          break;
        }

        await sleep(this.retryDelayMs * attempt);
      }
    }

    throw lastError || new AIServiceError("AI generation failed", "AI_SERVICE_ERROR", 500);
  }
}

module.exports = AIProviderService;
