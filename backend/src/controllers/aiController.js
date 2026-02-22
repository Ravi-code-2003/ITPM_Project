const joi = require("joi");
const Chat = require("../models/Chat");
const {
  LlamaServiceError,
  buildLlamaPrompt,
  streamLlamaResponse,
} = require("../services/llamaService");

const CONTEXT_MESSAGE_LIMIT = 5;

const chatSchema = joi.object({
  message: joi.string().min(1).max(2000).required(),
});

const sanitizeInput = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
};

const hasBlockedPrompt = (value) => {
  const blockedPatterns = [
    /ignore\s+all\s+previous\s+instructions/i,
    /reveal\s+system\s+prompt/i,
    /show\s+hidden\s+prompt/i,
    /drop\s+database/i,
    /bypass\s+authentication/i,
  ];

  return blockedPatterns.some((pattern) => pattern.test(value));
};

const sendSSE = (res, payload) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const getChatHistory = async (req, res) => {
  try {
    const chat = await Chat.findOne({ userId: req.user._id }).lean();

    if (!chat) {
      return res.json({
        role: req.user.role,
        messages: [],
      });
    }

    return res.json({
      role: chat.role,
      messages: chat.messages,
      updatedAt: chat.updatedAt,
      createdAt: chat.createdAt,
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    return res.status(500).json({ message: "Server error while fetching chat history" });
  }
};

const chatWithAI = async (req, res) => {
  try {
    const { error, value } = chatSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const sanitizedMessage = sanitizeInput(value.message);
    if (!sanitizedMessage) {
      return res.status(400).json({ message: "Message cannot be empty after sanitization" });
    }

    if (hasBlockedPrompt(sanitizedMessage)) {
      return res.status(400).json({
        message: "Message blocked by moderation policy. Please rephrase your request.",
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let chat = await Chat.findOne({ userId: req.user._id });

    if (!chat) {
      chat = new Chat({
        userId: req.user._id,
        role: req.user.role,
        messages: [],
      });
    } else if (chat.role !== req.user.role) {
      chat.role = req.user.role;
    }

    const contextMessages = chat.messages.slice(-CONTEXT_MESSAGE_LIMIT);

    const prompt = buildLlamaPrompt({
      user: req.user,
      contextMessages,
      userMessage: sanitizedMessage,
    });

    const streamResult = await streamLlamaResponse({
      prompt,
      onToken: async (token) => {
        sendSSE(res, { type: "token", token });
      },
    });

    if (!streamResult.text) {
      throw new LlamaServiceError("Model returned empty response", "EMPTY_RESPONSE", 502);
    }

    const now = new Date();
    chat.messages.push({
      sender: "user",
      content: sanitizedMessage,
      timestamp: now,
    });
    chat.messages.push({
      sender: "ai",
      content: streamResult.text,
      timestamp: new Date(),
    });
    await chat.save();

    console.log(`[AI] Response time: ${streamResult.metrics.durationMs}ms`);
    console.log(`[AI] Approx tokens/sec: ${streamResult.metrics.tokensPerSecond.toFixed(1)}`);

    sendSSE(res, {
      type: "done",
      reply: streamResult.text,
      role: chat.role,
      metrics: {
        durationMs: streamResult.metrics.durationMs,
        tokensPerSecond: Number(streamResult.metrics.tokensPerSecond.toFixed(1)),
      },
    });

    return res.end();
  } catch (error) {
    console.error("AI chat error:", error);

    const status = error.status || 500;
    const payload = {
      error: {
        code: error.code || "AI_CHAT_ERROR",
        message: error.message || "Server error while generating AI response",
        details: error.details || null,
      },
    };

    if (res.headersSent) {
      sendSSE(res, { type: "error", ...payload });
      return res.end();
    }

    return res.status(status).json(payload);
  }
};

module.exports = {
  getChatHistory,
  chatWithAI,
};
