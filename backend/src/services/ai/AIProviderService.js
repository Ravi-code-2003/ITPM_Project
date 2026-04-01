const Groq = require('groq-sdk');

class AIProviderService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || "groq";
    this.model = process.env.AI_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    this.apiKey = process.env.GROQ_API_KEY;
    this.timeout = parseInt(process.env.AI_REQUEST_TIMEOUT_MS, 10) || 30000;
    this.client = this.apiKey ? new Groq({ apiKey: this.apiKey }) : null;
  }

  async generateResponse({ messages, model, temperature }) {
    if (this.provider === "groq" && this.client) {
      try {
        const completion = await this.client.chat.completions.create({
          model: model || this.model,
          messages: Array.isArray(messages) ? messages : [{ role: "user", content: String(messages) }],
          temperature: temperature || 0.2,
          max_tokens: 1000,
        });

        return completion.choices[0]?.message?.content || "No response from AI.";
      } catch (error) {
        console.error("Groq API error:", error.message);
        throw new Error(`AI service error: ${error.message}`);
      }
    }

    // Fallback stub
    const prompts = Array.isArray(messages)
      ? messages.map((m) => `${m.role}: ${m.content}`).join("\n")
      : String(messages);

    const preview = prompts.length > 350 ? `${prompts.slice(0, 347)}...` : prompts;
    return `AI stub reply (provider=${this.provider}, model=${model || this.model}, temperature=${temperature || 0.2}) based on input:\n${preview}`;
  }
}

module.exports = AIProviderService;
