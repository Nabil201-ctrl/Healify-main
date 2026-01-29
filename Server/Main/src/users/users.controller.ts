import {
  Controller,
  Get,
  Patch,
  Body,
  NotFoundException,
  Req,
  UseGuards,
  Post,
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
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile information of the currently authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: '507f1f77bcf86cd799439011',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2024-12-01T10:30:00.000Z',
        updatedAt: '2024-12-05T14:20:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getMe(@Req() req: Request) {
    const user = req.user as { userId: string };
    const currentUser = await this.usersService.findOneById(user.userId);
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    // Convert to plain object and map _id to id
    const userObj = currentUser.toObject ? currentUser.toObject() : currentUser;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, _id, __v, ...result } = userObj as any;
    return {
      ...result,
      id: _id.toString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update the profile information of the currently authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  async updateMe(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    const user = req.user as { userId: string };
    const updatedUser = await this.usersService.update(user.userId, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, _id, __v, ...result } = userObj as any;
    return {
      ...result,
      id: _id.toString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('push-token')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Register push notification token for the current user' })
  @ApiBody({ type: PushTokenDto })
  @ApiResponse({ status: 200, description: 'Push token registered' })
  async registerPushToken(@Req() req: Request, @Body() body: PushTokenDto) {
    const user = req.user as { userId: string };
    const updated = await this.usersService.addPushToken(user.userId, body.token);
    const tokens = updated?.pushTokens || [];
    return {
      success: true,
      message: 'Push token registered',
      tokenCount: tokens.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('location')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Set user location from dropdown selection' })
  @ApiBody({ type: SetLocationDto })
  @ApiResponse({ status: 200, description: 'Location saved' })
  async setLocation(@Req() req: Request, @Body() body: SetLocationDto) {
    const user = req.user as { userId: string };
    const updated = await this.usersService.setLocation(user.userId, body.location);
    return {
      success: true,
      message: 'Location updated',
      location: updated?.location,
    };
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get supported locations for dropdown' })
  @ApiResponse({ status: 200, description: 'List of supported locations' })
  getLocations() {
    // Minimal curated list; front-end can render as dropdown
    const locations = [
      { id: 'nyc', city: 'New York', state: 'NY', country: 'USA' },
      { id: 'sf', city: 'San Francisco', state: 'CA', country: 'USA' },
      { id: 'ldn', city: 'London', state: 'London', country: 'UK' },
      { id: 'blr', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
      { id: 'dub', city: 'Dubai', state: 'Dubai', country: 'UAE' },
      { id: 'tor', city: 'Toronto', state: 'ON', country: 'Canada' },
    ];

    return { locations };
  }
}
