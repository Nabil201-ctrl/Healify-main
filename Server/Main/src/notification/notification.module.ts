import { Module, forwardRef } from '@nestjs/common';
import { NotificationProcessorService } from './notification-processor.service';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [forwardRef(() => UsersModule)],
    providers: [NotificationProcessorService],
    exports: [NotificationProcessorService],
})
export class NotificationModule { }
