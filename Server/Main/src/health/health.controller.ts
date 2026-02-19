import { Controller, Get, Post, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { RabbitMQService } from '../services/rabbitmq.service';
import { CacheService } from '../services/cache.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly cacheService: CacheService,
  ) { }

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
  @ApiResponse({ status: 200, description: 'Activity data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActivity(@Request() req) {
    const userId = req.user.userId;

    try {
      // Check cache first for faster response
      const cached = await this.cacheService.getHealthData(userId, 'activity');
      if (cached) {
        console.log(`[Health] Cache HIT for activity data, userId: ${userId}`);
        return { ...cached, fromCache: true };
      }

      console.log(`[Health] Cache MISS for activity data, userId: ${userId}`);
      // Fetch from microservice via RabbitMQ
      const data = await this.rabbitMQService.fetchHealthData('activity');

      // Cache for 5 minutes
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
  @ApiResponse({ status: 200, description: 'Heart rate data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHeartRate(@Request() req) {
    const userId = req.user.userId;

    try {
      // Check cache first
      const cached = await this.cacheService.getHealthData(userId, 'heart-rate');
      if (cached) {
        console.log(`[Health] Cache HIT for heart-rate data, userId: ${userId}`);
        return { ...cached, fromCache: true };
      }

      console.log(`[Health] Cache MISS for heart-rate data, userId: ${userId}`);
      const data = await this.rabbitMQService.fetchHealthData('heart-rate');

      // Cache for 5 minutes
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
  @ApiResponse({ status: 200, description: 'Sleep data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSleep(@Request() req) {
    const userId = req.user.userId;

    try {
      // Check cache first
      const cached = await this.cacheService.getHealthData(userId, 'sleep');
      if (cached) {
        console.log(`[Health] Cache HIT for sleep data, userId: ${userId}`);
        return { ...cached, fromCache: true };
      }

      console.log(`[Health] Cache MISS for sleep data, userId: ${userId}`);
      const data = await this.rabbitMQService.fetchHealthData('sleep');

      // Cache for 5 minutes
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
  123:
    124: @UseGuards(JwtAuthGuard)
  125:   @ApiBearerAuth('JWT-auth')
  126:   @Get('quick-stats')
  127:   @ApiOperation({ summary: 'Get user quick stats (distance, floors, etc.)' })
  128:   @ApiResponse({ status: 200, description: 'Quick stats retrieved successfully' })
  129: async getQuickStats(@Request() req) {
    130: const userId = req.user.userId;
    131:
    132: try {
      133: const cached = await this.cacheService.getHealthData(userId, 'quick-stats');
      134: if (cached) {
        135: return { ...cached, fromCache: true };
        136:
      }
      137:
      138: const data = await this.rabbitMQService.fetchHealthData('quick-stats');
      139: await this.cacheService.cacheHealthData(userId, 'quick-stats', data, 300);
      140: return { ...data, fromCache: false };
      141:
    } catch (error) {
      142: console.error('[Health] Failed to fetch quick stats:', error);
      143: throw new HttpException('Failed to fetch quick stats', HttpStatus.SERVICE_UNAVAILABLE);
      144:
    }
    145:
  }
  146:
    147: @UseGuards(JwtAuthGuard)
  148:   @ApiBearerAuth('JWT-auth')
  149:   @Get('insights')
  150:   @ApiOperation({ summary: 'Get user health insights' })
  151:   @ApiResponse({ status: 200, description: 'Insights retrieved successfully' })
  152: async getInsights(@Request() req) {
    153: const userId = req.user.userId;
    154:
    155: try {
      156: const cached = await this.cacheService.getHealthData(userId, 'insights');
      157: if (cached) {
        158: return { insights: cached, fromCache: true };
        159:
      }
      160:
      161: const data = await this.rabbitMQService.fetchHealthData('insights');
      162: await this.cacheService.cacheHealthData(userId, 'insights', data, 300);
      163: return { insights: data, fromCache: false };
      164:
    } catch (error) {
      165: console.error('[Health] Failed to fetch insights:', error);
      166: throw new HttpException('Failed to fetch insights', HttpStatus.SERVICE_UNAVAILABLE);
      167:
    }
    168:
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
  @ApiResponse({ status: 200, description: 'Connection status logged successfully' })
  async logGoogleFitConnection(@Body() data: { userId?: string; platform: string; status: string }) {
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
}
