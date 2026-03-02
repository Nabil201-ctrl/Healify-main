import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { formatNotification } from './notification-formatter.util';

@Injectable()
export class NotificationProcessorService {
    private readonly logger = new Logger(NotificationProcessorService.name);

    constructor(private readonly usersService: UsersService) { }

    /**
     * Process and persist a notification for a user.
     * Replaces the entire NotificationMicroservice.
     * Previously this went: Main -> RabbitMQ -> NotificationMicroservice -> HTTP POST back to Main
     * Now it's just a direct service call.
     */
    async processNotification(payload: {
        userId: string;
        type?: string;
        title?: string;
        message?: string;
        data?: any;
    }): Promise<void> {
        const { userId, type, data } = payload;

        if (!userId) {
            this.logger.warn(
                'Missing userId — cannot persist notification',
            );
            return;
        }

        // Build notification title/message from type + payload
        const formatted = formatNotification(type || 'generic', {
            ...(data ?? {}),
            message: payload.message,
            title: payload.title,
        });

        const title = formatted.title ?? payload.title ?? 'Healify';
        const message =
            formatted.body ?? payload.message ?? 'You have a new notification';

        try {
            await this.usersService.createNotification(
                userId,
                type ?? 'GENERAL',
                title,
                message,
            );
            this.logger.log(`Notification persisted → userId: ${userId}, type: ${type}`);
        } catch (err) {
            this.logger.error('Failed to persist notification:', err);
        }
    }
}
