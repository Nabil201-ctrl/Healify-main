import {
  Controller,
  Get,
  Patch,
  Body,
  NotFoundException,
  Req,
  UseGuards,
  Post,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import { PushTokenDto } from './dto/push-token.dto';
import { SetLocationDto } from './dto/set-location.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Profile ──────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMe(@Req() req: Request) {
    const user = req.user as { userId: string };
    const currentUser = await this.usersService.findOneById(user.userId);
    if (!currentUser) throw new NotFoundException('User not found');
    const userObj = currentUser.toObject ? currentUser.toObject() : currentUser;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, _id, __v, ...result } = userObj as any;
    return { ...result, id: _id.toString() };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  async updateMe(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    const user = req.user as { userId: string };
    const updatedUser = await this.usersService.update(
      user.userId,
      updateUserDto,
    );
    if (!updatedUser) throw new NotFoundException('User not found');
    const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, _id, __v, ...result } = userObj as any;
    return { ...result, id: _id.toString() };
  }

  @UseGuards(JwtAuthGuard)
  @Post('push-token')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Register push notification token' })
  @ApiBody({ type: PushTokenDto })
  @ApiResponse({ status: 200, description: 'Push token registered' })
  async registerPushToken(@Req() req: Request, @Body() body: PushTokenDto) {
    const user = req.user as { userId: string };
    const updated = await this.usersService.addPushToken(
      user.userId,
      body.token,
    );
    return {
      success: true,
      message: 'Push token registered',
      tokenCount: updated?.pushTokens?.length ?? 0,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('location')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Set user location' })
  @ApiBody({ type: SetLocationDto })
  @ApiResponse({ status: 200, description: 'Location saved' })
  async setLocation(@Req() req: Request, @Body() body: SetLocationDto) {
    const user = req.user as { userId: string };
    const updated = await this.usersService.setLocation(
      user.userId,
      body.location,
    );
    return {
      success: true,
      message: 'Location updated',
      location: updated?.location,
    };
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get supported locations' })
  getLocations() {
    return {
      locations: [
        { id: 'nyc', city: 'New York', state: 'NY', country: 'USA' },
        { id: 'sf', city: 'San Francisco', state: 'CA', country: 'USA' },
        { id: 'lag', city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
        { id: 'abj', city: 'Abuja', state: 'FCT', country: 'Nigeria' },
        { id: 'ldn', city: 'London', state: 'London', country: 'UK' },
        { id: 'blr', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
        { id: 'dub', city: 'Dubai', state: 'Dubai', country: 'UAE' },
        { id: 'tor', city: 'Toronto', state: 'ON', country: 'Canada' },
        { id: 'bru', city: 'Brussels', state: 'Brussels', country: 'Belgium' },
        { id: 'par', city: 'Paris', state: 'Île-de-France', country: 'France' },
      ],
    };
  }

  // ── In-App Notifications ──────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get in-app notifications for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of notifications, newest first',
  })
  async getNotifications(@Req() req: Request) {
    const user = req.user as { userId: string };
    const notifications = await this.usersService.getNotifications(user.userId);

    return {
      notifications: notifications.map((n: any) => {
        const obj = n.toObject ? n.toObject() : n;
        return {
          id: obj._id?.toString() ?? obj.id,
          userId: obj.userId,
          type: obj.type,
          title: obj.title,
          message: obj.message,
          read: obj.read,
          timestamp: obj.timestamp ?? obj.createdAt,
          createdAt: obj.createdAt,
        };
      }),
      unreadCount: notifications.filter((n: any) => !n.read).length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('notifications/:id/read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markRead(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { userId: string };
    const updated = await this.usersService.markNotificationRead(
      id,
      user.userId,
    );
    if (!updated) throw new NotFoundException('Notification not found');
    return { success: true, id };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('notifications/read-all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllRead(@Req() req: Request) {
    const user = req.user as { userId: string };
    await this.usersService.markAllNotificationsRead(user.userId);
    return { success: true };
  }

  /**
   * Internal endpoint — called by the NotificationMicroservice to store a
   * notification in MongoDB. Protected by a shared secret header instead of JWT.
   */
  @Post('notifications/internal')
  @ApiOperation({
    summary: '[Internal] Persist a notification from a microservice',
  })
  @ApiResponse({ status: 201, description: 'Notification stored' })
  async internalCreateNotification(
    @Req() req: Request,
    @Body()
    body: {
      userId: string;
      type: string;
      title: string;
      message: string;
      secret: string;
    },
  ) {
    const expectedSecret =
      process.env.INTERNAL_SECRET || 'healify-internal-secret';
    if (body.secret !== expectedSecret) {
      throw new NotFoundException('Not found'); // Deliberately vague
    }
    const n = await this.usersService.createNotification(
      body.userId,
      body.type,
      body.title,
      body.message,
    );
    return { success: true, id: (n as any)._id?.toString() };
  }

  @Post('admin/notifications')
  @ApiOperation({
    summary:
      '[Admin] Send a notification to specific users or broadcast to all',
  })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async adminSendNotification(
    @Req() req: Request,
    @Body()
    body: {
      secret: string;
      title: string;
      message: string;
      type?: string;
      userIds?: string[];
    },
  ) {
    const expectedSecret =
      process.env.INTERNAL_SECRET || 'healify-internal-secret';
    if (body.secret !== expectedSecret) {
      throw new NotFoundException('Not found'); // Deliberately vague
    }

    if (
      body.userIds &&
      Array.isArray(body.userIds) &&
      body.userIds.length > 0
    ) {
      await this.usersService.sendNotificationsToUsers(
        body.userIds,
        body.type ?? 'GENERAL',
        body.title,
        body.message,
      );
    } else {
      await this.usersService.broadcastNotification(
        body.type ?? 'GENERAL',
        body.title,
        body.message,
      );
    }

    return { success: true };
  }

  @Post('admin/users/count')
  @ApiOperation({ summary: '[Admin] Get total number of users' })
  @ApiResponse({ status: 200, description: 'Total users count' })
  async adminGetUsersCount(
    @Req() req: Request,
    @Body() body: { secret: string },
  ) {
    const expectedSecret =
      process.env.INTERNAL_SECRET || 'healify-internal-secret';
    if (body.secret !== expectedSecret) {
      throw new NotFoundException('Not found'); // Deliberately vague
    }

    const count = await this.usersService.countAllUsers();
    return { success: true, count };
  }
}
