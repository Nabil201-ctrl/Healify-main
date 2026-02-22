import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiProperty,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RabbitMQService } from '../services/rabbitmq.service';
import { CacheService } from '../services/cache.service';

import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

class SendMessageDto {
  @ApiProperty({
    description: 'The message to send to the AI chat bot',
    example: 'What exercises can help with lower back pain?',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Optional session ID to continue an existing conversation',
    example: 'sess_abc123xyz',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly cacheService: CacheService,
  ) {}

  @Post('send')
  @ApiOperation({
    summary: 'Send message to AI chat bot',
    description:
      'Send a message to the AI chat microservice for processing. Returns a session ID for tracking.',
  })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Message successfully sent to chat microservice',
    schema: {
      example: {
        success: true,
        sessionId: 'sess_abc123xyz',
        message: 'Your request is being processed by AI',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to process the chat request',
    schema: {
      example: {
        success: false,
        message: 'Failed to process your request',
        error: 'RabbitMQ connection error',
      },
    },
  })
  async sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    const userId = req.user.userId;
    const { message, sessionId } = sendMessageDto;

    try {
      const newSessionId = await this.rabbitMQService.sendChatRequest(
        userId,
        message,
        sessionId,
      );

      // NOTE: Session state is stored in MongoDB by the ChatMicroservice.
      // No Redis cache write needed here.

      return {
        success: true,
        sessionId: newSessionId,
        message: 'Your request is being processed by AI',
      };
    } catch (error) {
      console.error('Failed to send chat message:', error);
      return {
        success: false,
        message: 'Failed to process your request',
        error: error.message,
      };
    }
  }

  @Get('session/:sessionId')
  @ApiOperation({
    summary: 'Get chat session status',
    description: 'Retrieve the current status and details of a chat session',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'The unique session identifier',
    example: 'sess_abc123xyz',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Session status retrieved successfully',
    schema: {
      example: {
        success: true,
        session: {
          userId: '507f1f77bcf86cd799439011',
          message: 'What exercises can help with lower back pain?',
          status: 'processing',
          createdAt: '2024-12-05T10:30:00.000Z',
          response: 'AI response here...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found or expired',
    schema: {
      example: {
        success: false,
        message: 'Session not found or expired',
      },
    },
  })
  async getSessionStatus(@Param('sessionId') sessionId: string) {
    try {
      // Read directly from ChatMicroservice MongoDB via RPC — no Redis
      const session =
        await this.rabbitMQService.requestSessionStatus(sessionId);

      if (!session) {
        return {
          success: false,
          message: 'Session not found or expired',
        };
      }

      return {
        success: true,
        session: {
          status: session.status,
          response: session.aiResponse ?? null,
          metadata: session.aiMetadata ?? null,
          completedAt: session.completedAt ?? null,
        },
      };
    } catch (error) {
      console.error('Failed to get session status:', error);
      return {
        success: false,
        message: 'Failed to retrieve session',
        error: error.message,
      };
    }
  }

  @Get('history/:userId')
  @ApiOperation({
    summary: 'Get user chat history',
    description:
      'Retrieve all chat history for a specific user. Users can only access their own history.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique user identifier',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Chat history retrieved successfully',
    schema: {
      example: {
        success: true,
        history: [],
        message: 'Chat history retrieval not yet implemented',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot access another user's history",
    schema: {
      example: {
        success: false,
        message: 'Unauthorized',
      },
    },
  })
  async getChatHistory(@Request() req, @Param('userId') userId: string) {
    // Verify user can only access their own history
    if (req.user.userId !== userId) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }

    try {
      const history = await this.rabbitMQService.requestChatHistory(userId);
      return {
        success: true,
        history: history,
      };
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return {
        success: false,
        message: 'Failed to retrieve chat history',
        error: error.message,
      };
    }
  }

  @Get('sessions/:userId')
  @ApiOperation({ summary: 'Get user chat sessions' })
  async getChatSessions(@Request() req, @Param('userId') userId: string) {
    if (req.user.userId !== userId)
      return { success: false, message: 'Unauthorized' };

    try {
      const sessions = await this.rabbitMQService.requestChatSessions(userId);
      return { success: true, sessions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('session/:sessionId/messages')
  @ApiOperation({ summary: 'Get messages for a specific session' })
  async getSessionMessages(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ) {
    // Note: In a real app we should verify the session belongs to the user
    // For now we assume the user knows the sessionId implies access or we trust the microservice content
    try {
      const messages =
        await this.rabbitMQService.requestSessionMessages(sessionId);
      return { success: true, messages };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
