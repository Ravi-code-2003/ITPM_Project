# 🚀 Groq API Migration & Humanized Chatbot Integration

## Overview

This project has been successfully migrated from Ollama to **Groq API** with enhanced humanization features for a more natural and friendly chatbot experience.

---

## ✨ Features Implemented

### 1. **Groq API Integration**
- ✅ Removed Ollama dependency
- ✅ Integrated official Groq SDK
- ✅ Groq models: `llama-3.1-8b-instant`
- ✅ Production-ready error handling
- ✅ Rate limiting with friendly messages

### 2. **Humanization Features**
- 🎭 **Personality-driven responses** - Warm, friendly, and engaging tone
- 😊 **Emoji support** - Contextual emojis for better visual appeal
- 🎯 **Sentiment analysis** - Detects user emotion and responds empathetically
- 📝 **Response formatting** - Readable paragraphs with proper spacing
- 🌈 **Role-based customization** - Different response styles for student, shop-owner, etc.
- 💬 **Natural language** - Conversational style, not robotic
- 🤝 **Empathy-first approach** - Validates feelings before providing solutions

### 3. **Smart Context Awareness**
- User role-based system prompts
- Database context integration (food items, accommodations, academics)
- Last 5 messages for conversation continuity
- User profile context for personalized responses

### 4. **Error Handling**
- Friendly error messages for all scenarios
- Proper HTTP status codes
- Network failure handling
- Rate limit responses with humor

---

## 📋 Setup Instructions

### 1. Install Groq SDK

```bash
cd backend
npm install groq-sdk
```

### 2. Configure Environment Variables

Add/update these in `backend/.env`:

```env
# AI Provider Configuration
AI_PROVIDER=groq
AI_MODEL=llama-3.1-8b-instant
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

# Temperature affects response creativity (0.0-1.0)
# Higher = more creative, Lower = more focused
AI_TEMPERATURE=0.7  # Increased from 0.2 for more personality

# Context and limits
AI_CONTEXT_LIMIT=5
AI_REQUEST_TIMEOUT_MS=30000
AI_DB_CONTEXT_MAX_ITEMS=20

# Rate limiting
AI_RATE_LIMIT_WINDOW_MS=60000
AI_RATE_LIMIT_MAX=10
```

### 3. Verify Installation

```bash
npm start
```

You should see the backend running on `http://localhost:5000` with Groq configured.

---

## 🏗️ Architecture

### Service Structure

```
backend/src/
├── services/
│   ├── groqService.js              ← NEW: Humanized Groq integration
│   ├── aiService.js                ← Updated to use groqService
│   ├── ai/
│   │   ├── AIProviderService.js
│   │   └── AIServiceError.js
│   └── databaseContextService.js
├── controllers/
│   └── aiController.js             ← Uses groqService for humanization
├── middleware/
│   └── aiRateLimiter.js           ← Updated with friendly messages
├── routes/
│   └── aiRoutes.js
└── models/
    └── Chat.js
```

### Data Flow

```
User Message
    ↓
aiController.js (validation, sanitization)
    ↓
groqService.js (humanization, sentiment analysis)
    ↓
Groq API (llama-3.1-8b-instant)
    ↓
Response formatting & emoji injection
    ↓
User receives friendly response
```

---

## 🎯 Usage Examples

### Example 1: Chat Request

**Request:**
```bash
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer {token}

{
  "message": "I'm stressed about my exams and budget is tight"
}
```

**Response:**
```json
{
  "reply": "I understand that can be frustrating. 😟 Let me help: Here are some budget-friendly tips for exam prep...🎓",
  "sentiment": "negative",
  "usage": {
    "promptTokens": 256,
    "completionTokens": 128,
    "totalTokens": 384
  }
}
```

### Example 2: Meal Plan Request

**Response includes humanized message:**
```
🍽️ Your Personalized Meal Plan for 3/2026

I've put together a meal plan tailored to your LKR 5000 monthly budget! 💰

**Breakfast Ideas:** 🥐
• Rice & Curry (LKR 80)
• Hoppers (LKR 120)
...

💡 **Pro Tip:** Mix and match these meals throughout the month to keep things interesting!
```

### Example 3: Rate Limit Response

```json
{
  "message": "⏸️ Whoa! I need a quick breather! 😅 You've sent a lot of messages recently. Please wait a moment before sending another. I'll be right back! ⏱️"
}
```

---

## 🔄 Migration Checklist

- ✅ Remove Ollama references
- ✅ Install Groq SDK
- ✅ Configure Groq API key in .env
- ✅ Create groqService.js with humanization
- ✅ Update aiService.js to use groqService
- ✅ Update aiController.js for better error handling
- ✅ Update rate limiter with friendly messages
- ✅ Test all endpoints
- ✅ Verify chat history storage
- ✅ Document API responses

---

## 📊 Model Information

### Current Model: `llama-3.1-8b-instant`

**Specs:**
- Context window: 8192 tokens
- Fine-tuned for: General conversation
- Speed: Optimized for instant responses
- Cost-effective: Groq's free tier available

**Alternative models:**
- `mixtral-8x7b-32768` (Higher quality, more context)
- `gemma-7b-it` (Lighter, faster)

To switch models, update `GROQ_MODEL` in `.env`

---

## 🛡️ Security & Best Practices

### ✅ Input Sanitization
```javascript
// Removes HTML tags and control characters
const sanitizedMessage = sanitizeInput(userMessage);
```

### ✅ Prompt Injection Prevention
```javascript
// Blocks common injection patterns
if (hasBlockedPrompt(message)) {
  return "Message blocked by moderation";
}
```

### ✅ Rate Limiting
```javascript
// Max 10 requests per 60 seconds per user
AI_RATE_LIMIT_MAX=10
AI_RATE_LIMIT_WINDOW_MS=60000
```

### ✅ API Key Security
- Store `GROQ_API_KEY` in `.env` (never commit to git)
- Use environment-based configuration
- Rotate keys regularly

---

## 🚀 Performance Optimization

### Token Optimization
- Context limited to last 5 messages
- System prompt kept concise
- Database context summarized
- Max tokens set to 1024

### Caching
- Meal plans cached by userId and month
- Reduces redundant API calls
- Cache cleared on monthly update

### Response Times
- Average: 0.5-2 seconds
- Max timeout: 30 seconds
- Retry logic: 1 attempt with 600ms delay

---

## 📈 Monitoring & Debugging

### Check Groq API Status
```bash
curl https://api.groq.com/health
```

### Enable Debug Logging
```javascript
// In groqService.js
console.log('🚨 Groq API error:', error.message);
```

### Monitor Token Usage
Each response returns:
```json
{
  "usage": {
    "promptTokens": 256,
    "completionTokens": 128,
    "totalTokens": 384
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "GROQ_API_KEY is not defined"
**Solution:** Add `GROQ_API_KEY` to `.env`

### Issue: "Rate limit exceeded"
**Solution:** Wait 60 seconds or adjust `AI_RATE_LIMIT_MAX` in `.env`

### Issue: "Timeout after 30s"
**Solution:** Increase `AI_REQUEST_TIMEOUT_MS` or check network

### Issue: Poor response quality
**Solution:** Adjust `AI_TEMPERATURE` (higher = more creative, 0.7 recommended)

---

## 📚 API Reference

### GET `/api/ai/chat`
Fetch chat history

**Response:**
```json
{
  "role": "student",
  "messages": [
    { "sender": "user", "content": "...", "timestamp": "..." },
    { "sender": "ai", "content": "...", "timestamp": "..." }
  ]
}
```

### POST `/api/ai/chat`
Send message and get AI response

**Request:**
```json
{
  "message": "Your message here"
}
```

**Response:**
```json
{
  "reply": "AI response with personality 🎯",
  "sentiment": "neutral|positive|negative",
  "usage": { ... }
}
```

---

## 🎓 Learning Resources

- [Groq API Documentation](https://console.groq.com/docs)
- [Groq SDK GitHub](https://github.com/groq/groq-sdk-js)
- [Model Performance Benchmarks](https://www.groq.com/benchmarks)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

## 📝 Future Enhancements

- [ ] Streaming responses for longer texts
- [ ] Function calling for tool integration
- [ ] Fine-tuned model for university domain
- [ ] Multi-language support
- [ ] Voice interaction
- [ ] Real-time sentiment dashboard
- [ ] A/B testing for response styles
- [ ] User feedback collection for improvement

---

## 👥 Support

For issues or questions:
1. Check troubleshooting section
2. Review .env configuration
3. Check Groq API status
4. Review logs for error details

---

**Last Updated:** April 2, 2026  
**Status:** ✅ Production Ready  
**Groq Model:** llama-3.1-8b-instant
