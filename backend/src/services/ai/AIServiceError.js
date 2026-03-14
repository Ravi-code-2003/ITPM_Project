class AIServiceError extends Error {
  constructor(
    message,
    code = "AI_SERVICE_ERROR",
    status = 500,
    details = null,
    retryable = false
  ) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryable = retryable;
  }
}

module.exports = AIServiceError;
