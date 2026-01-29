# Chat Microservice - AI Processing Service

This microservice handles AI chat processing for the Healify platform using RabbitMQ for message queuing and Redis for caching.

## Architecture

- **Message Queue**: RabbitMQ (via amqplib)
- **Caching**: Redis
- **Framework**: Express.js
- **Language**: JavaScript (ES Modules)

## Features

- ✅ Consumes chat requests from RabbitMQ queue
- ✅ Processes messages with AI (Infermedica > OpenAI > safe fallback)
- ✅ Caches responses in Redis for performance
- ✅ Publishes AI responses back to Main Server via RabbitMQ
- ✅ Health check endpoint

## Setup

### Prerequisites

- Node.js 18+
- RabbitMQ server running
- Redis server running

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env` file with:

```env
PORT=3001
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379

# Add your AI API keys here
# INFERMEDICA_APP_ID=your-app-id
# INFERMEDICA_APP_KEY=your-app-key
# INFERMEDICA_MODEL=infermedica-en
# OPENAI_API_KEY=your-openai-key
# OPENAI_MODEL=gpt-4o-mini
```

### Running the Service

```bash
# Production
pnpm start

# Development (with hot reload)
pnpm dev
```

## Message Flow

1. **Receive**: Consumes messages from `chat_requests` queue
2. **Process**: Executes AI processing (placeholder for actual AI integration)
3. **Cache**: Stores response in Redis with TTL
4. **Publish**: Sends response to `chat_responses` queue
5. **Acknowledge**: Confirms message processing to RabbitMQ

## Message Format

### Incoming Request (from Main Server)

```json
{
  "userId": "user123",
  "message": "What are healthy eating habits?",
  "sessionId": "session_1234567890",
  "timestamp": "2025-12-05T10:30:00.000Z"
}
```

### Outgoing Response (to Main Server)

```json
{
  "sessionId": "session_1234567890",
  "userId": "user123",
  "originalMessage": "What are healthy eating habits?",
  "aiResponse": "Here are some healthy eating habits...",
  "metadata": {
    "confidence": 0.95,
    "processingTime": 1000,
    "model": "healify-ai-v1",
    "cached": false
  },
  "timestamp": "2025-12-05T10:30:01.000Z"
}
```

## API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "chat-microservice",
  "timestamp": "2025-12-05T10:30:00.000Z"
}
```

## AI Integration

AI orchestration now lives in `services/ai-provider.service.js` and follows this order:

1. **Infermedica** (if `INFERMEDICA_APP_ID`/`INFERMEDICA_APP_KEY` are set)
2. **OpenAI Chat Completions** (if `OPENAI_API_KEY` is set; defaults to `gpt-4o-mini`)
3. **Heuristic fallback** with safety-first messaging and doctor-review flagging

To adjust prompts or models, edit `services/ai-provider.service.js`. The `processAIRequest` function already consumes this provider and handles safety and review flagging.

## Redis Caching

Responses are cached with:
- **Key**: `ai:response:${sessionId}`
- **TTL**: 3600 seconds (1 hour)
- **Format**: JSON

## Error Handling

- Messages that fail processing are rejected and requeued
- Connection failures are logged and the service attempts reconnection
- All errors include detailed logging for debugging

## Monitoring

Monitor the service through:
- Console logs for message processing
- Health check endpoint
- RabbitMQ management UI
- Redis monitoring tools

## Development Notes

- Uses ES Modules (type: "module")
- Persistent message queues (durable: true)
- Manual message acknowledgment for reliability
- Connection pooling for Redis
- Graceful error handling and message requeuing
