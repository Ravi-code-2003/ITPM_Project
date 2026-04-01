class AIServiceError extends Error {
  constructor(message, code = "AI_SERVICE_ERROR", status = 500) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.status = status;
  }
}

module.exports = AIServiceError;
