import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ServicesModule } from '../services/services.module';

@Module({
    imports: [ServicesModule],
    controllers: [HealthController],
})
export class HealthModule { }
