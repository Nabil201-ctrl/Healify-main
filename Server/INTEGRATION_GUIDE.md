# RabbitMQ and Redis Integration

This document describes the integration of RabbitMQ and Redis in the Healify platform.

## Architecture Overview

```
Client App → Main Server → RabbitMQ → Chat Microservice
                ↓             ↓              ↓
              Redis        Queue         Redis Cache
                           ↓
                    Chat Microservice
                           ↓
                      RabbitMQ
                           ↓
                    Main Server → Client App
```

## Main Server Setup

### Dependencies Installed

- `amqplib` - RabbitMQ client
- `@types/amqplib` - TypeScript types
- `redis` - Redis client

### Services Created

1. **RabbitMQService** (`src/services/rabbitmq.service.ts`)
   - Manages RabbitMQ connections and channels
   - Publishes chat requests to queue
   - Consumes AI responses from queue
   - Auto-initializes on module start

2. **CacheService** (`src/services/cache.service.ts`)
   - Redis connection management
   - Session storage and retrieval
   - Rate limiting support
   - TTL-based caching

3. **ChatController** (`src/chat/chat.controller.ts`)
   - POST `/chat/send` - Send message to AI
   - GET `/chat/session/:sessionId` - Check session status
   - GET `/chat/history/:userId` - Get chat history
   - Protected by JWT authentication

### Configuration

**Environment Variables** (`.env`):
```env
RABBITMQ_URL=amqps://your-rabbitmq-url
REDIS_URL=redis://localhost:6379
```

### Queue Names

- **Outgoing**: `chat_requests` - Messages sent to AI
- **Incoming**: `chat_responses` - AI responses

## Chat Microservice Setup

### Services

1. **MQ Configuration** (`config/Mq.js`)
   - RabbitMQ connection management
   - Queue assertion
   - Message publishing

2. **Redis Configuration** (`config/Redis.js`)
   - Redis connection
   - Response caching
   - Cache retrieval

3. **Main Server** (`server.js`)
   - Express server
   - Message consumer
   - AI processing pipeline
   - Health endpoint

### Features

- ✅ Message consumption from RabbitMQ
- ✅ AI processing (placeholder for integration)
- ✅ Response caching in Redis
- ✅ Response publishing back to Main Server
- ✅ Error handling and message requeuing

## Running the Services

### Start RabbitMQ (Docker)

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

### Start Redis (Docker)

```bash
docker run -d --name redis \
  -p 6379:6379 \
  redis:latest
```

### Start Main Server

```bash
cd Server/Main
pnpm install
pnpm start:dev
```

### Start Chat Microservice

```bash
cd Server/ChatMicroservice
pnpm install
pnpm start
```

## Testing the Integration

### 1. Authenticate and Get Token

```bash
# Register/Login to get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Send Chat Message

```bash
curl -X POST http://localhost:3000/chat/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are healthy eating habits?"
  }'
```

### 3. Check Session Status

```bash
curl -X GET http://localhost:3000/chat/session/SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Check Chat Microservice Health

```bash
curl http://localhost:3001/health
```

## Message Flow Example

1. **Client sends message** to Main Server (`/chat/send`)
2. **Main Server**:
   - Validates JWT token
   - Publishes message to `chat_requests` queue
   - Stores session in Redis
   - Returns `sessionId` to client

3. **Chat Microservice**:
   - Consumes message from `chat_requests`
   - Checks Redis cache for existing response
   - Processes with AI if not cached
   - Caches response in Redis
   - Publishes to `chat_responses` queue
   - Acknowledges message

4. **Main Server**:
   - Consumes from `chat_responses` queue
   - Updates session in Redis
   - (Optional) Notifies client via WebSocket

5. **Client polls** for session status or receives WebSocket event

## Redis Keys

- **Sessions**: `chat:session:{sessionId}`
- **Responses**: `ai:response:{sessionId}`
- **Rate Limiting**: `rate:{userId}:{endpoint}`

## Monitoring

### RabbitMQ Management UI
- URL: `http://localhost:15672`
- Default credentials: `guest` / `guest`

### Redis CLI
```bash
redis-cli
> KEYS chat:*
> GET chat:session:SESSION_ID
```

### Logs
- Main Server: Check NestJS console output
- Chat Microservice: Check Node.js console output

## Production Considerations

1. **Security**:
   - Use strong RabbitMQ credentials
   - Enable Redis AUTH
   - Use TLS for connections

2. **Scalability**:
   - Run multiple Chat Microservice instances
   - Use Redis Cluster for high availability
   - Configure RabbitMQ clustering

3. **Monitoring**:
   - Set up Prometheus metrics
   - Configure alerting for queue depth
   - Monitor Redis memory usage

4. **Error Handling**:
   - Configure dead letter queues
   - Implement circuit breakers
   - Set up retry policies

## Next Steps

1. Integrate actual AI model (OpenAI, Anthropic, etc.)
2. Implement WebSocket for real-time updates
3. Add chat history persistence to MongoDB
4. Implement rate limiting
5. Add user feedback mechanism
6. Set up monitoring and alerting
