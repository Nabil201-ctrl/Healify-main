import { Module, Global } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { CacheService } from './cache.service';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
    imports: [RedisModule],
    providers: [RabbitMQService, CacheService],
    exports: [RabbitMQService, CacheService],
})
export class ServicesModule { }
