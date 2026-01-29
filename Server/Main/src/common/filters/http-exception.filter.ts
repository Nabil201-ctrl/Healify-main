import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

interface ErrorResponse {
    success: false;
    statusCode: number;
    message: string;
    error?: string;
    path: string;
    timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string;
        let error: string | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse as Record<string, any>;
                message = responseObj.message || exception.message;
                error = responseObj.error;
            } else {
                message = exception.message;
            }
        } else if (exception instanceof Error) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            error = exception.message;

            // Log the full error for debugging
            this.logger.error(
                `Unhandled exception: ${exception.message}`,
                exception.stack,
            );
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'An unexpected error occurred';
        }

        const errorResponse: ErrorResponse = {
            success: false,
            statusCode: status,
            message: Array.isArray(message) ? message.join(', ') : message,
            ...(error && { error }),
            path: request.url,
            timestamp: new Date().toISOString(),
        };

        response.status(status).json(errorResponse);
    }
}
