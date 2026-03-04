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

    // ─── Public Doctor List (no auth required) ───────────────────────────────────

    @Get('list')
    @ApiOperation({ summary: 'Get list of available doctors (public)' })
    async getDoctorList(@Res() res: Response) {
        try {
            const doctors = await this.doctorService.getAvailableDoctors();
            return res.json({ success: true, doctors });
        } catch (err: any) {
            return res
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ success: false, error: err.message });
        }
    }

    // ─── User-side Live Chat ──────────────────────────────────────────────────────

    @Post('live-chat/request')
    @ApiOperation({ summary: 'User requests a live chat with a specific doctor' })
    async requestLiveChat(
        @Req() req: Request,
        @Body() body: { userId: string; doctorId: string },
        @Res() res: Response,
    ) {
        try {
            const session = await this.doctorService.requestLiveChat(
                body.userId,
                body.doctorId,
            );
            return res.json({ success: true, session });
        } catch (err: any) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .json({ success: false, error: err.message });
        }
    }

    @Get('live-chat/session/:sessionId')
    @ApiOperation({ summary: 'Poll live chat session (user side)' })
    async getLiveChatSession(
        @Req() req: Request,
        @Param('sessionId') sessionId: string,
        @Body() body: { userId: string },
        @Res() res: Response,
    ) {
        // userId passed as query param for GET
        const userId = (req as any).query?.userId || body.userId;
        const result = await this.doctorService.getLiveChatSession(sessionId, userId);
        if (!result)
            return res
                .status(HttpStatus.NOT_FOUND)
                .json({ success: false, message: 'Session not found' });

        return res.json({ success: true, ...result });
    }

    @Post('live-chat/session/:sessionId/message')
    @ApiOperation({ summary: 'User sends message in a live chat' })
    async userSendLiveChatMessage(
        @Param('sessionId') sessionId: string,
        @Body() body: { userId: string; text: string },
        @Res() res: Response,
    ) {
        try {
            await this.doctorService.addUserMessageToLiveChat(
                sessionId,
                body.userId,
                body.text,
            );
            return res.json({ success: true });
        } catch (err: any) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .json({ success: false, error: err.message });
        }
    }

    // ─── Doctor-side Live Chat ────────────────────────────────────────────────────

    @Get('live-chats')
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get doctor's incoming live chat requests" })
    async getDoctorLiveChats(@Req() req: Request, @Res() res: Response) {
        const doctor = await this.authenticateDoctor(req);
        if (!doctor)
            return res
                .status(HttpStatus.UNAUTHORIZED)
                .json({ success: false, message: 'Unauthorized' });

        const chats = await this.doctorService.getDoctorLiveChats(doctor.doctorId);
        return res.json({ success: true, chats });
    }

    @Post('live-chats/:sessionId/accept')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Doctor accepts a live chat request' })
    async acceptLiveChat(
        @Req() req: Request,
        @Param('sessionId') sessionId: string,
        @Res() res: Response,
    ) {
        const doctor = await this.authenticateDoctor(req);
        if (!doctor)
            return res
                .status(HttpStatus.UNAUTHORIZED)
                .json({ success: false, message: 'Unauthorized' });

        try {
            const result = await this.doctorService.acceptLiveChat(sessionId, doctor.doctorId);
            return res.json({ success: true, session: result });
        } catch (err: any) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .json({ success: false, error: err.message });
        }
    }

    @Get('live-chats/:sessionId/messages')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get messages in a live chat (doctor side)' })
    async getLiveChatMessages(
        @Req() req: Request,
        @Param('sessionId') sessionId: string,
        @Res() res: Response,
    ) {
        const doctor = await this.authenticateDoctor(req);
        if (!doctor)
            return res
                .status(HttpStatus.UNAUTHORIZED)
                .json({ success: false, message: 'Unauthorized' });

        // Reuse getLiveChatSession with doctor's userId substituted
        const session = await this.doctorService.getDoctorLiveChats(doctor.doctorId);
        const target = session.find(s => s.sessionId === sessionId);
        if (!target)
            return res
                .status(HttpStatus.NOT_FOUND)
                .json({ success: false, message: 'Session not found' });

        // Fetch messages directly
        const result = await this.doctorService.getSessionMessagesAnonymized(sessionId);
        return res.json({ success: true, messages: result?.messages || [] });
    }

    @Post('live-chats/:sessionId/message')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Doctor sends a message in a live chat' })
    async doctorSendLiveChatMessage(
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

        try {
            await this.doctorService.addDoctorMessageToLiveChat(
                sessionId,
                doctor.doctorId,
                body.text,
            );
            return res.json({ success: true });
        } catch (err: any) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .json({ success: false, error: err.message });
        }
    }

    @Post('live-chats/:sessionId/end')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Doctor ends a live chat' })
    async endLiveChat(
        @Req() req: Request,
        @Param('sessionId') sessionId: string,
        @Res() res: Response,
    ) {
        const doctor = await this.authenticateDoctor(req);
        if (!doctor)
            return res
                .status(HttpStatus.UNAUTHORIZED)
                .json({ success: false, message: 'Unauthorized' });

        await this.doctorService.endLiveChat(sessionId, doctor.doctorId);
        return res.json({ success: true });
    }
}
