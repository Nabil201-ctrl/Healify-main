import { Injectable, Inject } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class CacheService {
  constructor(
    @Inject('UPSTASH_REDIS_CLIENT') private readonly redisClient: Redis,
  ) { }

  private isAvailable(): boolean {
    return this.redisClient !== null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isAvailable()) {
      console.debug(`[Cache] Redis unavailable, skipping SET for key: ${key}`);
      return;
    }

    try {
      const serialized = JSON.stringify(value);

      if (ttl) {
        await this.redisClient.setex(key, ttl, serialized);
      } else {
        await this.redisClient.set(key, serialized);
      }
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      console.debug(
        `[Cache] Redis unavailable, returning null for key: ${key}`,
      );
      return null;
    }

    try {
      const data = await this.redisClient.get(key);

      if (!data) return null;

      try {
        // Upstash might return the object directly if it was stored as JSON, 
        // or string if stored as string. 
        // Our 'set' stores JSON.stringify(value).
        // So 'get' returns the stringified JSON.
        return JSON.parse(data as string) as T;
      } catch {
        return data as T;
      }
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async setWithExpiry(key: string, value: any, seconds: number): Promise<void> {
    await this.set(key, value, seconds);
  }

  // For rate limiting
  async increment(key: string, ttl?: number): Promise<number> {
    if (!this.isAvailable()) {
      console.debug(
        `[Cache] Redis unavailable, returning 0 for increment of key: ${key}`,
      );
      return 0;
    }

    try {
      const value = await this.redisClient.incr(key);

      if (ttl && value === 1) {
        await this.redisClient.expire(key, ttl);
      }

      return value;
    } catch (error) {
      console.error(`[Cache] Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  // Store chat session
  async storeChatSession(
    sessionId: string,
    data: any,
    ttl = 3600,
  ): Promise<void> {
    await this.set(`chat:session:${sessionId}`, data, ttl);
  }

  async getChatSession(sessionId: string): Promise<any> {
    return await this.get(`chat:session:${sessionId}`);
  }

  // Health data caching with 5-minute default TTL
  async cacheHealthData(
    userId: string,
    dataType: string,
    data: any,
    ttl = 300, // 5 minutes for health data
  ): Promise<void> {
    await this.set(`health:${userId}:${dataType}`, data, ttl);
  }

  async getHealthData(userId: string, dataType: string): Promise<any> {
    return await this.get(`health:${userId}:${dataType}`);
  }

  // Rate limiting helper
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const count = await this.increment(`ratelimit:${key}`, windowSeconds);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  }

  // Invalidate all health cache for a user
  async invalidateHealthCache(userId: string): Promise<void> {
    const dataTypes = ['activity', 'heart-rate', 'sleep'];
    for (const type of dataTypes) {
      await this.delete(`health:${userId}:${type}`);
    }
  }
}
