title Healify - AI-Powered Health & Wellness Platform
direction down

// Mobile Frontend
Mobile App [icon: smartphone, label: "React Native/Expo"] {
  Onboarding Flow [icon: user-plus]
  Authentication [icon: lock, label: "Sign In/Sign Up"]
  AI Chat Interface [icon: message-circle]
  Health Dashboard [icon: activity, label: "Metrics & Charts"]
  Settings [icon: settings]
}

// Backend Services
Backend Infrastructure [icon: server] {
  Main API Server [icon: node-dot-js, label: "NestJS + Express"] {
    Auth Module [icon: shield, label: "JWT + Passport"]
    Users Module [icon: users]
    Health Controller [icon: heart-pulse]
    Chat Controller [icon: message-square, label: "Chat/AI Requests"]
    API Gateway [icon: git-branch]
  }
  
  Chat Microservice [icon: cpu, label: "Node.js AI Service"] {
    Message Consumer [icon: inbox, label: "RabbitMQ Consumer"]
    AI Processing Engine [icon: cpu, label: "AI Model Integration"]
    Response Publisher [icon: send, label: "Publish Results"]
  }
  
  Health Microservice [icon: heart-pulse, label: "Node.js Health Service"] {
    Health Request Consumer [icon: inbox, label: "RabbitMQ Consumer"]
    Health Sync Consumer [icon: refresh-cw, label: "Sync Handler"]
    Vitals Analyzer [icon: activity, label: "Health Analytics"]
    Response Publisher [icon: send, label: "Publish Results"]
  }
  
  Notification Microservice [icon: bell, label: "Node.js Notification Service"] {
    Notification Consumer [icon: inbox, label: "RabbitMQ Consumer"]
    Alert Formatter [icon: alert-circle, label: "Format Alerts"]
    Push Sender [icon: send, label: "FCM Integration"]
  }
  
  Message Broker [icon: shuffle, label: "RabbitMQ (amqplib)"] {
    Chat Requests Queue [icon: inbox, label: "chat_requests"]
    Chat Response Queue [icon: send, label: "chat_responses"]
    Chat History Queue [icon: database, label: "chat_history_request"]
    Health Requests Queue [icon: inbox, label: "health_requests"]
    Health Response Queue [icon: send, label: "health_responses"]
    Health Sync Queue [icon: refresh-cw, label: "health_sync"]
    Notification Queue [icon: bell, label: "notification_queue"]
  }
}

// Caching Layer
Cache Layer [icon: zap, label: "Redis (Upstash)"] {
  Session Cache [icon: lock, label: "Chat Sessions"]
  Response Cache [icon: database, label: "AI Responses (TTL: 1hr)"]
  Rate Limiting [icon: activity, label: "Request Throttling"]
}

// Data Layer
Database [icon: database, label: "MongoDB"] {
  Users Collection [icon: user, label: "Auth & Profile"]
  Health Metrics [icon: activity, label: "Health Logs & Insights"]
  Chat History [icon: message-circle, label: "Chat Sessions & Messages"]
}

// External Services
External APIs [icon: cloud] {
  Health Data Sources [icon: stethoscope, label: "Health Kit/Google Fit"]
  AI/ML Services [icon: cpu, label: "OpenAI/Anthropic/Gemini"]
}

// Data Flow Connections
Mobile App > Main API Server: "REST API\n(Auth, Health, Chat)"
Main API Server <> Cache Layer: "Session & Response\nCaching (Redis)"
Main API Server <> Database: "Mongoose ODM\n(Users, Health, Chat)"
Main API Server > Message Broker: "Publish requests\n(chat_requests, health_sync)"
Message Broker > Chat Microservice: "Consume chat_requests\n(AI processing)"
Message Broker > Health Microservice: "Consume health_requests\n& health_sync"
Message Broker > Notification Microservice: "Consume notification_queue\n(Push alerts)"
Chat Microservice <> Cache Layer: "Cache AI responses"
Chat Microservice <> Database: "Store chat history\n(ChatSession, ChatMessage)"
Chat Microservice <> External APIs: "AI model inference"
Chat Microservice > Message Broker: "Publish chat_responses"
Health Microservice <> Database: "Store/Retrieve health data\n(HealthLog, Insight)"
Health Microservice > Message Broker: "Publish health_responses\n& notifications"
Message Broker > Main API Server: "Consume responses\n(RPC pattern)"
Main API Server > Mobile App: "Polling-based updates\n(GET /chat/session/:id)"
Main API Server <> External APIs: "Health data sync"

// Annotations
Mobile App [note: "Features: Activity tracking, sleep monitoring, heart rate charts, vital signs, AI chat"]
Main API Server [note: "Tech: TypeScript, NestJS, class-validator, bcrypt, JWT, amqplib, Passport strategies"]
Chat Microservice [note: "Async AI processing, message queuing, MongoDB persistence, response caching"]
Health Microservice [note: "Health data processing, vitals analysis, notification triggers on abnormal readings"]
Notification Microservice [note: "Push notifications via FCM, consumes notification_queue from Health service"]
Message Broker [note: "RabbitMQ: Decouples microservices, ensures reliable async message delivery, RPC pattern for health requests"]
Cache Layer [note: "Upstash Redis: Session management, AI response caching (1hr TTL), rate limiting"]
Database [note: "MongoDB: Stores user profiles, hashed refresh tokens, health metrics, chat history"]
External APIs [note: "Integration points for health APIs (HealthKit/Google Fit) and AI model providers"]
