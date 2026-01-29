import { Redis } from '@upstash/redis';
import { ConfigService } from '@nestjs/config';

export const redisClientFactory = {
  provide: 'UPSTASH_REDIS_CLIENT',
  useFactory: (configService: ConfigService) => {
    return new Redis({
      url: configService.get<string>('UPSTASH_REDIS_REST_URL'),
      token: configService.get<string>('UPSTASH_REDIS_REST_TOKEN'),
    });
  },
  inject: [ConfigService],
};
