import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [ChatController],
})
export class ChatModule { }
