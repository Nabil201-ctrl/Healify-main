// backend/src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'THIS_IS_A_SECRET_KEY',
    });
  }

  async validate(payload: any) {
    // The payload is the decoded JWT.
    // We can add more validation here if needed, e.g., check if user exists.
    return { userId: payload.sub, email: payload.email };
  }
}
