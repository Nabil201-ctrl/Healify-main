import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Req,
    Res,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { DoctorService } from './services/doctor.service';
import { UsersService } from '../users/users.service';
import type { Request, Response } from 'express';

/**
 * Inline doctor auth guard — extracts Bearer token and validates via DoctorService.
 * We use a simple middleware-style approach inside each handler rather than
 * a NestJS guard to keep it self-contained in one controller.
 */
@ApiTags('doctor')
@Controller('doctor')
export class DoctorController {
    constructor(
        private readonly doctorService: DoctorService,
        private readonly usersService: UsersService,
    ) { }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private async authenticateDoctor(req: Request): Promise<any | null> {
        const token = (req.headers.authorization as string)?.replace(
            'Bearer ',
            '',
        );
        if (!token) return null;
        return this.doctorService.verifyToken(token);
    }

    // ─── Auth ───────────────────────────────────────────────────────────────────

    @Post('login')
    @ApiOperation({ summary: 'Doctor login' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() body: { email: string; password: string }) {
        const result = await this.doctorService.login(body.email, body.password);
        return result;
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new doctor' })
    @ApiResponse({ status: 200, description: 'Registration successful' })
    async register(
        @Body()
        body: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            specialization?: string;
            licenseNumber: string;
        },
    ) {
        const result = await this.doctorService.register(body);
        return result;
    }

    @Post('push-token')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Register push token for doctor' })
    async registerPushToken(
        @Req() req: Request,
        @Body() body: { token: string },
        @Res() res: Response,
    ) {
        const doctor = await this.authenticateDoctor(req);
        if (!doctor)
            return res
                .status(HttpStatus.UNAUTHORIZED)
                .json({ success: false, message: 'Unauthorized' });

        const result = await this.doctorService.registerPushToken(
            doctor.doctorId,
            body.token,
        );
        return res.json(result);
    }

    // ─── Review Queue ───────────────────────────────────────────────────────────

    @Get('review-queue')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get anonymized review queue' })
    async getReviewQueue(@Req() req: Request, @Res() res: Response) {
        const doctor = await this.authenticateDoctor(req);
        if (!doctor)
            return res
                .status(HttpStatus.UNAUTHORIZED)
                .json({ success: false, message: 'Unauthorized' });

        try {
            const sessions = await this.doctorService.getReviewQueue();
            return res.json({ success: true, sessions });
        } catch (error: any) {
            return res
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ success: false, error: error.message });
        }
    }

    @Post('assign/:sessionId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Assign a session to the authenticated doctor' })
    async assignSession(
        @Req() req: Request,
        @Param('sessionId') sessionId: string,
        @Res() res: Response,
    ) {
        const doctor = await this.authenticateDoctor(req);
        if (!doctor)
            return res
                .status(HttpStatus.UNAUTHORIZED)
                .json({ success: false, message: 'Unauthorized' });

        const session = await this.doctorService.assignSession(
            sessionId,
            doctor.doctorId,
        );
        if (!session)
            return res
                .status(HttpStatus.NOT_FOUND)
                .json({ success: false, message: 'Session not found' });

        return res.json({ success: true, session });
    }

    @Post('message/:sessionId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Send a message as a doctor' })
    async sendMessage(
        @Req() req: Request,
        @Param('sessionId') sessionId: string,
        @Body() body: { text: string },
        @Res() res: Response,
    ) {
        const doctor = await this.authenticateDoctor(req);
        if (!doctor)
            return res
                .status(HttpStatus.UNAUTHORIZED)
                .json({ success: false, message: 'Unauthorized' });

        const message = await this.doctorService.sendDoctorMessage(
            sessionId,
            doctor.doctorId,
            doctor.lastName,
            body.text,
        );

        if (!message)
            return res
                .status(HttpStatus.NOT_FOUND)
                .json({ success: false, message: 'Session not found' });

        return res.json({ success: true, message });
    }

    @Post('complete-review/:sessionId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete a review for a session' })
    async completeReview(
        @Req() req: Request,
        @Param('sessionId') sessionId: string,
        @Body() body: { notes: string },
        @Res() res: Response,
    ) {
        const doctor = await this.authenticateDoctor(req);
        if (!doctor)
            return res
                .status(HttpStatus.UNAUTHORIZED)
                .json({ success: false, message: 'Unauthorized' });

        const session = await this.doctorService.completeReview(
            sessionId,
            body.notes,
        );
        if (!session)
            return res
                .status(HttpStatus.NOT_FOUND)
                .json({ success: false, message: 'Session not found' });

        return res.json({ success: true, session });
    }

    @Get('session-messages/:sessionId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get anonymized messages for a session' })
    async getSessionMessages(
        @Req() req: Request,
        @Param('sessionId') sessionId: string,
        @Res() res: Response,
    ) {
        const doctor = await this.authenticateDoctor(req);
        if (!doctor)
            return res
                .status(HttpStatus.UNAUTHORIZED)
                .json({ success: false, message: 'Unauthorized' });

        const result =
            await this.doctorService.getSessionMessagesAnonymized(sessionId);
        if (!result)
            return res
                .status(HttpStatus.NOT_FOUND)
                .json({ success: false, message: 'Session not found' });

        return res.json({ success: true, ...result });
    }

    @Get('patient-health/:sessionId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get anonymized patient health data' })
    async getPatientHealth(
        @Req() req: Request,
        @Param('sessionId') sessionId: string,
        @Res() res: Response,
    ) {
        const doctor = await this.authenticateDoctor(req);
        if (!doctor)
            return res
                .status(HttpStatus.UNAUTHORIZED)
                .json({ success: false, message: 'Unauthorized' });

        const healthData =
            await this.doctorService.getPatientHealthAnonymized(
                sessionId,
                (userId) => this.usersService.findOneById(userId),
            );

        if (!healthData)
            return res
                .status(HttpStatus.NOT_FOUND)
                .json({ success: false, message: 'Not found' });

        return res.json({ success: true, healthData });
    }
}
