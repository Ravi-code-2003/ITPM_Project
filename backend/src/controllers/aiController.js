const joi = require("joi");
const Chat = require("../models/Chat");
const { buildLlamaPrompt, generateLlamaResponse } = require("../services/llamaService");

const parsedMaxChatCharacters = parseInt(process.env.AI_MAX_CHAT_CHARACTERS, 10);
const MAX_CHAT_CHARACTERS = Number.isFinite(parsedMaxChatCharacters)
  ? parsedMaxChatCharacters
  : Number.MAX_SAFE_INTEGER;

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

const estimateCharUsage = (messages) => {
  return messages.reduce((total, msg) => total + (msg.content?.length || 0), 0);
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

    const contextMessages = chat.messages;

    const projectedMessages = [
      ...chat.messages,
      {
        sender: "user",
        content: sanitizedMessage,
        timestamp: new Date(),
      },
    ];

    if (estimateCharUsage(projectedMessages) > MAX_CHAT_CHARACTERS) {
      return res.status(400).json({
        message: "Chat history is too long. Please start a new topic with shorter context.",
      });
    }

    const prompt = buildLlamaPrompt({
      user: req.user,
      contextMessages,
      userMessage: sanitizedMessage,
    });
    const reply = await generateLlamaResponse(prompt);

    const now = new Date();
    chat.messages.push(
      {
        sender: "user",
        content: sanitizedMessage,
        timestamp: now,
      },
      {
        sender: "ai",
        content: reply,
        timestamp: new Date(),
      }
    );

    await chat.save();

    return res.json({
      reply,
      role: chat.role,
      usage: null,
      messages: chat.messages,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({
      message: error.message || "Server error while generating AI response",
    });
  }
};

module.exports = {
  getChatHistory,
  chatWithAI,
};
