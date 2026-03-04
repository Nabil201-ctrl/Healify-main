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
import { ChatProcessorService } from './services/chat-processor.service';
import { DoctorService } from './services/doctor.service';
import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

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
    private readonly chatProcessorService: ChatProcessorService,
    private readonly doctorService: DoctorService,
  ) { }

  @Post('send')
  @ApiOperation({
    summary: 'Send message to AI chat bot',
    description:
      'Send a message to the AI for processing. Returns the AI response directly.',
  })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Message processed and AI response returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendMessage(@Request() req: any, @Body() sendMessageDto: SendMessageDto) {
    const userId = req.user.userId;
    const { message, sessionId } = sendMessageDto;
    const resolvedSessionId = sessionId || `session_${Date.now()}`;

    try {
      const result = await this.chatProcessorService.processChat(
        userId,
        message,
        resolvedSessionId,
      );

      return {
        success: true,
        sessionId: result.sessionId,
        response: result.response,
        metadata: result.metadata,
        message: 'AI response generated',
      };
    } catch (error: any) {
      console.error('Failed to process chat message:', error);
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
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Session status retrieved' })
  async getSessionStatus(@Param('sessionId') sessionId: string) {
    try {
      const session =
        await this.chatProcessorService.getSessionStatus(sessionId);

      if (!session) {
        return { success: false, message: 'Session not found or expired' };
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
    } catch (error: any) {
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
    description: 'Retrieve all chat history for a specific user.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique user identifier',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Chat history retrieved' })
  async getChatHistory(@Request() req: any, @Param('userId') userId: string) {
    if (req.user.userId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }

    try {
      const history = await this.chatProcessorService.getChatHistory(userId);
      return { success: true, history };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to retrieve chat history',
        error: error.message,
      };
    }
  }

  @Get('sessions/:userId')
  @ApiOperation({ summary: 'Get user chat sessions' })
  async getChatSessions(@Request() req: any, @Param('userId') userId: string) {
    if (req.user.userId !== userId)
      return { success: false, message: 'Unauthorized' };

    try {
      const sessions =
        await this.chatProcessorService.getChatSessions(userId);
      return { success: true, sessions };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @Get('session/:sessionId/messages')
  @ApiOperation({ summary: 'Get messages for a specific session' })
  async getSessionMessages(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    try {
      const messages =
        await this.chatProcessorService.getSessionMessages(sessionId);
      return { success: true, messages };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ─── Bookmarks ──────────────────────────────────────────────────────────────

  @Post('bookmark/:sessionId')
  @ApiOperation({ summary: 'Bookmark or unbookmark a chat session' })
  @ApiResponse({ status: 200, description: 'Bookmark status updated' })
  async toggleBookmark(
    @Param('sessionId') sessionId: string,
    @Body() body: { isBookmarked: boolean },
  ) {
    try {
      const session = await this.chatProcessorService.toggleBookmark(
        sessionId,
        body.isBookmarked,
      );

      if (!session) {
        return { success: false, message: 'Session not found' };
      }

      return {
        success: true,
        message: body.isBookmarked
          ? 'Session bookmarked'
          : 'Bookmark removed',
        session: {
          sessionId: session.sessionId,
          isBookmarked: session.isBookmarked,
          bookmarkedAt: session.bookmarkedAt,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to update bookmark',
        error: error.message,
      };
    }
  }

  @Get('bookmarks/:userId')
  @ApiOperation({ summary: 'Get all bookmarked sessions for a user' })
  @ApiResponse({ status: 200, description: 'List of bookmarked sessions' })
  async getBookmarks(@Request() req: any, @Param('userId') userId: string) {
    if (req.user.userId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }

    try {
      const bookmarks =
        await this.chatProcessorService.getBookmarks(userId);
      return {
        success: true,
        bookmarks,
        count: bookmarks.length,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to fetch bookmarks',
        error: error.message,
      };
    }
  }

  // ─── Live Doctor Chat (User-side, JWT authenticated) ───────────────────────────

  @Get('doctors')
  @ApiOperation({ summary: 'Get list of available doctors' })
  async getAvailableDoctors() {
    try {
      const doctors = await this.doctorService.getAvailableDoctors();
      return { success: true, doctors };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Post('request-doctor')
  @ApiOperation({ summary: 'Request a live chat with a specific doctor' })
  async requestDoctor(
    @Request() req: any,
    @Body() body: { doctorId: string },
  ) {
    try {
      const session = await this.doctorService.requestLiveChat(
        req.user.userId,
        body.doctorId,
      );
      return { success: true, session };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Get('live-session/:sessionId')
  @ApiOperation({ summary: 'Poll live chat session status & messages' })
  async pollLiveSession(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    const result = await this.doctorService.getLiveChatSession(sessionId, req.user.userId);
    if (!result) return { success: false, message: 'Session not found' };
    return { success: true, ...result };
  }

  @Post('live-session/:sessionId/message')
  @ApiOperation({ summary: 'Send a message in a live chat session' })
  async sendLiveMessage(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() body: { text: string },
  ) {
    try {
      await this.doctorService.addUserMessageToLiveChat(
        sessionId,
        req.user.userId,
        body.text,
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
