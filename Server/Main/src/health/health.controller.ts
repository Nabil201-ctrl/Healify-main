import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RabbitMQService } from '../services/rabbitmq.service';
import { CacheService } from '../services/cache.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      service: 'healify-main',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('activity')
  @ApiOperation({ summary: 'Get user activity data with caching' })
  @ApiResponse({
    status: 200,
    description: 'Activity data retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActivity(@Request() req) {
    const userId = req.user.userId;

    try {
      const cached = await this.cacheService.getHealthData(userId, 'activity');
      if (cached) {
        console.log(`[Health] Cache HIT for activity data, userId: ${userId}`);
        return { ...cached, fromCache: true };
      }

      console.log(`[Health] Cache MISS for activity data, userId: ${userId}`);
      const data = await this.rabbitMQService.fetchHealthData(
        'activity',
        userId,
      );
      await this.cacheService.cacheHealthData(userId, 'activity', data, 300);
      return { ...data, fromCache: false };
    } catch (error) {
      console.error('[Health] Failed to fetch activity data:', error);
      throw new HttpException(
        'Failed to fetch activity data',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('heart-rate')
  @ApiOperation({ summary: 'Get user heart rate data with caching' })
  @ApiResponse({
    status: 200,
    description: 'Heart rate data retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHeartRate(@Request() req) {
    const userId = req.user.userId;

    try {
      const cached = await this.cacheService.getHealthData(
        userId,
        'heart-rate',
      );
      if (cached) {
        console.log(
          `[Health] Cache HIT for heart-rate data, userId: ${userId}`,
        );
        return { ...cached, fromCache: true };
      }

      console.log(`[Health] Cache MISS for heart-rate data, userId: ${userId}`);
      const data = await this.rabbitMQService.fetchHealthData(
        'heart-rate',
        userId,
      );
      await this.cacheService.cacheHealthData(userId, 'heart-rate', data, 300);
      return { ...data, fromCache: false };
    } catch (error) {
      console.error('[Health] Failed to fetch heart rate data:', error);
      throw new HttpException(
        'Failed to fetch heart rate data',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('sleep')
  @ApiOperation({ summary: 'Get user sleep data with caching' })
  @ApiResponse({
    status: 200,
    description: 'Sleep data retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSleep(@Request() req) {
    const userId = req.user.userId;

    try {
      const cached = await this.cacheService.getHealthData(userId, 'sleep');
      if (cached) {
        console.log(`[Health] Cache HIT for sleep data, userId: ${userId}`);
        return { ...cached, fromCache: true };
      }

      console.log(`[Health] Cache MISS for sleep data, userId: ${userId}`);
      const data = await this.rabbitMQService.fetchHealthData('sleep', userId);
      await this.cacheService.cacheHealthData(userId, 'sleep', data, 300);
      return { ...data, fromCache: false };
    } catch (error) {
      console.error('[Health] Failed to fetch sleep data:', error);
      throw new HttpException(
        'Failed to fetch sleep data',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('quick-stats')
  @ApiOperation({ summary: 'Get user quick stats (distance, floors, etc.)' })
  @ApiResponse({
    status: 200,
    description: 'Quick stats retrieved successfully',
  })
  async getQuickStats(@Request() req) {
    const userId = req.user.userId;

    try {
      const cached = await this.cacheService.getHealthData(
        userId,
        'quick-stats',
      );
      if (cached) {
        return { ...cached, fromCache: true };
      }

      const data = await this.rabbitMQService.fetchHealthData(
        'quick-stats',
        userId,
      );
      await this.cacheService.cacheHealthData(userId, 'quick-stats', data, 300);
      return { ...data, fromCache: false };
    } catch (error) {
      console.error('[Health] Failed to fetch quick stats:', error);
      throw new HttpException(
        'Failed to fetch quick stats',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('insights')
  @ApiOperation({ summary: 'Get user health insights' })
  @ApiResponse({ status: 200, description: 'Insights retrieved successfully' })
  async getInsights(@Request() req) {
    const userId = req.user.userId;

    try {
      const cached = await this.cacheService.getHealthData(userId, 'insights');
      if (cached) {
        return { insights: cached, fromCache: true };
      }

      const data = await this.rabbitMQService.fetchHealthData(
        'insights',
        userId,
      );
      await this.cacheService.cacheHealthData(userId, 'insights', data, 300);
      return { insights: data, fromCache: false };
    } catch (error) {
      console.error('[Health] Failed to fetch insights:', error);
      throw new HttpException(
        'Failed to fetch insights',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync health data from mobile device' })
  @ApiResponse({ status: 200, description: 'Health data synced successfully' })
  async syncHealthData(@Body() data: any) {
    console.log('[Health] Received health sync data:', data);

    try {
      await this.rabbitMQService.sendHealthSync(data);

      // Invalidate cache on sync to ensure fresh data
      if (data.userId) {
        await this.cacheService.invalidateHealthCache(data.userId);
      }

      return {
        success: true,
        message: 'Health data synced successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Health] Failed to sync health data:', error);
      throw new HttpException(
        'Failed to sync health data',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('google-fit/connect')
  @ApiOperation({ summary: 'Log Google Fit connection status from mobile app' })
  @ApiResponse({
    status: 200,
    description: 'Connection status logged successfully',
  })
  async logGoogleFitConnection(
    @Body() data: { userId?: string; platform: string; status: string },
  ) {
    console.log('========================================');
    console.log('[Health/GoogleFit] CONNECTION EVENT');
    console.log(`[Health/GoogleFit] User ID: ${data.userId || 'anonymous'}`);
    console.log(`[Health/GoogleFit] Platform: ${data.platform}`);
    console.log(`[Health/GoogleFit] Status: ${data.status}`);
    console.log(`[Health/GoogleFit] Timestamp: ${new Date().toISOString()}`);
    console.log('========================================');

    return {
      success: true,
      message: 'Google Fit connection status logged',
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('google-fit/sync')
  @ApiOperation({
    summary:
      'Trigger a server-side sync with Google Fit using an OAuth access token',
  })
  @ApiResponse({ status: 200, description: 'Google Fit sync initiated' })
  async syncGoogleFit(@Request() req, @Body() data: { accessToken: string }) {
    if (!data.accessToken) {
      throw new HttpException(
        'accessToken is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const userId = req.user.userId;
    console.log(`[Health] Initiating Google Fit sync for user: ${userId}`);

    try {
      await this.rabbitMQService.sendHealthSync({
        type: 'GOOGLE_FIT_SYNC',
        userId,
        accessToken: data.accessToken,
      });

      // Optionally invalidate cache so next fetch gets fresh data
      await this.cacheService.invalidateHealthCache(userId);

      return {
        success: true,
        message: 'Google Fit data sync initiated',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Health] Failed to initiate Google Fit sync:', error);
      throw new HttpException(
        'Failed to initiate Google Fit sync',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
