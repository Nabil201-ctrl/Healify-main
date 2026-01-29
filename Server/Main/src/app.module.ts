// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
// import { NotificationModule } from './notification/notification.module';
// import { NotificationController } from './notification/notification.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/healify',
        serverSelectionTimeoutMS: 10000, // 10s - faster failure detection
        connectTimeoutMS: 10000, // 10s
        socketTimeoutMS: 45000, // 45s for long queries
        maxPoolSize: 50, // Connection pooling for scalability
        minPoolSize: 10, // Keep connections warm
        retryWrites: true, // Auto-retry failed writes
        retryReads: true, // Auto-retry failed reads
      }),
    }),
    AuthModule,
    UsersModule,
    ChatModule,
    RedisModule,
    // NotifcationModule,
    HealthModule,
  ],
  controllers: [AppController /*, NotificationController */],
  providers: [AppService],
})
export class AppModule { }
