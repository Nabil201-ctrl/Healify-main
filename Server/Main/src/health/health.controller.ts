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
import { HealthProcessorService } from './services/health-processor.service';
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
    private readonly healthProcessorService: HealthProcessorService,
    private readonly cacheService: CacheService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      service: 'healify-monolith',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('activity')
  @ApiOperation({ summary: 'Get user activity data' })
  @ApiResponse({ status: 200, description: 'Activity data retrieved' })
  async getActivity(@Request() req: any) {
    const userId = req.user.userId;

    try {
      const cached = await this.cacheService.getHealthData(userId, 'activity');
      if (cached) {
        return { ...cached, fromCache: true };
      }

      const data = await this.healthProcessorService.buildActivityData(userId);
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
  @ApiOperation({ summary: 'Get user heart rate data' })
  @ApiResponse({ status: 200, description: 'Heart rate data retrieved' })
  async getHeartRate(@Request() req: any) {
    const userId = req.user.userId;

    try {
      const cached = await this.cacheService.getHealthData(
        userId,
        'heart-rate',
      );
      if (cached) {
        return { ...cached, fromCache: true };
      }

      const data =
        await this.healthProcessorService.buildHeartRateData(userId);
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
  @ApiOperation({ summary: 'Get user sleep data' })
  @ApiResponse({ status: 200, description: 'Sleep data retrieved' })
  async getSleep(@Request() req: any) {
    const userId = req.user.userId;

    try {
      const cached = await this.cacheService.getHealthData(userId, 'sleep');
      if (cached) {
        return { ...cached, fromCache: true };
      }

      const data = await this.healthProcessorService.buildSleepData(userId);
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
  @ApiOperation({ summary: 'Get user quick stats' })
  @ApiResponse({ status: 200, description: 'Quick stats retrieved' })
  async getQuickStats(@Request() req: any) {
    const userId = req.user.userId;

    try {
      const cached = await this.cacheService.getHealthData(
        userId,
        'quick-stats',
      );
      if (cached) {
        return { ...cached, fromCache: true };
      }

      const data =
        await this.healthProcessorService.buildQuickStats(userId);
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
  @ApiResponse({ status: 200, description: 'Insights retrieved' })
  async getInsights(@Request() req: any) {
    const userId = req.user.userId;

    try {
      const cached = await this.cacheService.getHealthData(userId, 'insights');
      if (cached) {
        return { insights: cached, fromCache: true };
      }

      const data =
        await this.healthProcessorService.buildInsights(userId);
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
  @ApiResponse({ status: 200, description: 'Health data synced' })
  async syncHealthData(@Body() data: any) {
    console.log('[Health] Received health sync data:', data);

    try {
      await this.healthProcessorService.analyzeAndStore(data);

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
  @ApiResponse({ status: 200, description: 'Connection status logged' })
  async logGoogleFitConnection(
    @Body() data: { userId?: string; platform: string; status: string },
  ) {
    console.log('========================================');
    console.log('[Health/GoogleFit] CONNECTION EVENT');
    console.log(`[Health/GoogleFit] User ID: ${data.userId || 'anonymous'}`);
    console.log(`[Health/GoogleFit] Platform: ${data.platform}`);
    console.log(`[Health/GoogleFit] Status: ${data.status}`);
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
  @ApiOperation({ summary: 'Trigger a server-side sync with Google Fit' })
  @ApiResponse({ status: 200, description: 'Google Fit sync initiated' })
  async syncGoogleFit(
    @Request() req: any,
    @Body() data: { accessToken: string },
  ) {
    if (!data.accessToken) {
      throw new HttpException(
        'accessToken is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const userId = req.user.userId;
    console.log(`[Health] Initiating Google Fit sync for user: ${userId}`);

    try {
      await this.healthProcessorService.processGoogleFitSync(
        userId,
        data.accessToken,
      );

      await this.cacheService.invalidateHealthCache(userId);

      return {
        success: true,
        message: 'Google Fit data sync completed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Health] Failed to sync Google Fit:', error);
      throw new HttpException(
        'Failed to sync Google Fit data',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
