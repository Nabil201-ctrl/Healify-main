// backend/src/auth/strategies/jwt-refresh.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_REFRESH_SECRET || 'THIS_IS_A_REFRESH_SECRET_KEY',
      passReqToCallback: true, // We need the request to get the refresh token
    });
  }

  validate(req: Request, payload: any) {
    const authHeader = req.get('authorization');
    const refreshToken = authHeader
      ? authHeader.replace('Bearer ', '').trim()
      : '';
    return { ...payload, refreshToken };
  }
}
