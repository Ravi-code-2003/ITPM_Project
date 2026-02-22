# ITPM Project - AI Chatbot Integration

## Overview
This project now includes a secure AI chatbot for your MERN platform with:

- JWT-protected AI endpoints
- Role-aware responses
- Persistent per-user chat threads in MongoDB
- Context-aware replies using the last 20 messages
- Backend-controlled internal context (no direct DB access from model)
- Basic moderation, rate limiting, and input sanitization

## Backend Changes
### New files
- `backend/src/models/Chat.js`
- `backend/src/controllers/aiController.js`
- `backend/src/routes/aiRoutes.js`
- `backend/src/services/openaiService.js`
- `backend/src/middleware/aiRateLimiter.js`
- `backend/.env.example`

### Updated files
- `backend/src/server.js`

### API Endpoints
- `GET /api/ai/chat` - fetch authenticated user's chat history
- `POST /api/ai/chat` - send a message and receive AI response

Both endpoints require:
- `Authorization: Bearer <JWT>`
- valid role in: `student`, `shop-owner`, `house-owner`, `education-path`, `admin`

## Frontend Changes
### New files
- `frontend/src/components/chat/AIChat.js`
- `frontend/src/pages/AIChatPage.js`

### Updated files
- `frontend/src/services/api.js`
- `frontend/src/App.js`
- `frontend/src/components/layout/Header.js`

### Frontend route
- `/ai-chat` (protected route)

## Setup
1. Copy env template:
```bash
cp backend/.env.example backend/.env
```

2. Fill required values in `backend/.env`:
- `MONGO_URI`
- `JWT_SECRET`
- `OPENAI_API_KEY`

3. Run backend:
```bash
cd backend
npm install
npm run dev
```

4. Run frontend:
```bash
cd frontend
npm install
npm start
```

## Security Rules Implemented
- JWT required for all AI requests
- Role middleware applied to AI routes
- Rate limiting per user/IP for AI endpoint
- Joi input length validation
- Input sanitization before model call
- Backend-only internal data injection
- AI never receives direct database query access

## Memory Rules Implemented
- One chat thread per user (`userId` unique in `Chat`)
- Chat stored in MongoDB (`user` + `ai` messages)
- Last 20 messages sent as context to model
- Messages kept in chronological order

## Optional Advanced Items Included
- Basic moderation filter (prompt-injection style patterns)
- Character-based token budget guard for large chats
