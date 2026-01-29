import { Redis } from '@upstash/redis';
import dotenv from "dotenv";
dotenv.config();

// Initialize Upstash Redis client immediately (stateless HTTP)
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

console.log("Upstash Redis client initialized");

// No-op for compatibility with existing code calling this
async function createRedisConnection() {
  return redisClient;
}

function getRedisClient() {
  return redisClient;
}

async function cacheResponse(sessionId, response, ttl = 3600) {
  // Upstash setex: key, seconds, value
  await redisClient.setex(`chat:session:${sessionId}`, ttl, JSON.stringify(response));
}

async function getCachedResponse(sessionId) {
  const cached = await redisClient.get(`chat:session:${sessionId}`);
  // Upstash returns the value directly if it's a string/object
  if (!cached) return null;
  try {
    return typeof cached === 'string' ? JSON.parse(cached) : cached;
  } catch (e) {
    return cached;
  }
}

export { createRedisConnection, getRedisClient, cacheResponse, getCachedResponse };
