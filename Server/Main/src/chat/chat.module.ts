import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { DoctorController } from './doctor.controller';
import { ChatProcessorService } from './services/chat-processor.service';
import { AiProviderService } from './services/ai-provider.service';
import { DoctorService } from './services/doctor.service';
import {
  ChatSession,
  ChatSessionSchema,
} from './entities/chat-session.entity';
import {
  ChatMessage,
  ChatMessageSchema,
} from './entities/chat-message.entity';
import { Doctor, DoctorSchema } from './entities/doctor.entity';
import {
  DoctorMessage,
  DoctorMessageSchema,
} from './entities/doctor-message.entity';
import { HealthModule } from '../health/health.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: DoctorMessage.name, schema: DoctorMessageSchema },
    ]),
    forwardRef(() => HealthModule),
    ServicesModule,
    UsersModule,
  ],
  controllers: [ChatController, DoctorController],
  providers: [ChatProcessorService, AiProviderService, DoctorService],
  exports: [ChatProcessorService, DoctorService],
})
export class ChatModule { }
