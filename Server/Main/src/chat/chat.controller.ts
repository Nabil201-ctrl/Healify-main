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
  ) { }

  @Post('send')
  @ApiOperation({
    summary: 'Send message to AI chat bot',
    description: 'Send a message to the AI chat microservice for processing. Returns a session ID for tracking.'
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
      // Send request to chat microservice via RabbitMQ
      const newSessionId = await this.rabbitMQService.sendChatRequest(
        userId,
        message,
        sessionId,
      );

      // Store session info in cache
      await this.cacheService.storeChatSession(newSessionId, {
        userId,
        message,
        status: 'processing',
        createdAt: new Date().toISOString(),
      });

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
    description: 'Retrieve the current status and details of a chat session'
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
      const session = await this.cacheService.getChatSession(sessionId);

      if (!session) {
        return {
          success: false,
          message: 'Session not found or expired',
        };
      }

      return {
        success: true,
        session,
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
    description: 'Retrieve all chat history for a specific user. Users can only access their own history.'
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
    description: 'Forbidden - Cannot access another user\'s history',
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
}
