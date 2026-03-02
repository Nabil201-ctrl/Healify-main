import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { HealthProcessorService } from './services/health-processor.service';
import { HealthLog, HealthLogSchema } from './entities/health-log.entity';
import { Insight, InsightSchema } from './entities/insight.entity';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HealthLog.name, schema: HealthLogSchema },
      { name: Insight.name, schema: InsightSchema },
    ]),
    ServicesModule,
  ],
  controllers: [HealthController],
  providers: [HealthProcessorService],
  exports: [HealthProcessorService],
})
export class HealthModule { }
