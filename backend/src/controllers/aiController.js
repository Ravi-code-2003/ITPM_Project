const joi = require("joi");
const Chat = require("../models/Chat");
const { callOpenAIChat } = require("../services/openaiService");

const CONTEXT_MESSAGE_LIMIT = 20;
const RETURN_HISTORY_LIMIT = 100;
const STORED_MESSAGE_LIMIT = 500;
const MAX_CHAT_CHARACTERS = parseInt(process.env.AI_MAX_CHAT_CHARACTERS, 10) || 150000;

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
      messages: chat.messages.slice(-RETURN_HISTORY_LIMIT),
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

    const contextMessages = chat.messages.slice(-CONTEXT_MESSAGE_LIMIT);

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

    const { reply, usage } = await callOpenAIChat({
      user: req.user,
      contextMessages,
      userMessage: sanitizedMessage,
    });

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

    if (chat.messages.length > STORED_MESSAGE_LIMIT) {
      chat.messages = chat.messages.slice(-STORED_MESSAGE_LIMIT);
    }

    await chat.save();

    return res.json({
      reply,
      role: chat.role,
      usage,
      messages: chat.messages.slice(-RETURN_HISTORY_LIMIT),
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
