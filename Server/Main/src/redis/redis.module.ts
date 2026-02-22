import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisClientFactory } from './redis.provider';

@Global() // Make the Redis client available globally
@Module({
  imports: [ConfigModule],
  providers: [redisClientFactory],
  exports: ['UPSTASH_REDIS_CLIENT'],
})
export class RedisModule {}
