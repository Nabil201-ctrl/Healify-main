// backend/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findOneByEmail(
        createUserDto.email,
      );
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.usersService.create({
        ...createUserDto,
        password: hashedPassword,
      });
      const tokens = await this.getTokens(user.id, user.email);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      // Return tokens and user data (excluding sensitive fields)
      const { password, refreshToken, ...userWithoutSensitiveData } = user;
      return {
        ...tokens,
        user: userWithoutSensitiveData,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async signIn(email: string, pass: string) {
    try {
      const user = await this.usersService.findOneByEmail(email);
      console.log('[AuthService] Sign in attempt for:', email);

      if (!user || !user.password) {
        console.log('[AuthService] User not found or no password');
        throw new UnauthorizedException('Invalid credentials');
      }

      console.log('[AuthService] User found, comparing password');
      const isMatch = await bcrypt.compare(pass, user.password);
      if (!isMatch) {
        console.log('[AuthService] Password mismatch');
        throw new UnauthorizedException('Invalid credentials');
      }

      console.log('[AuthService] Password matched, generating tokens');
      const userId = user._id?.toString() || user.id;
      const tokens = await this.getTokens(userId, user.email);
      await this.updateRefreshToken(userId, tokens.refreshToken);

      // Return tokens and user data (excluding sensitive fields)
      const userObj = user.toObject ? user.toObject() : user;
      const {
        password: _,
        refreshToken: __,
        _id,
        __v,
        ...userWithoutSensitiveData
      } = userObj as any;

      console.log(
        '[AuthService] Sign in successful, returning tokens and user',
      );
      return {
        ...tokens,
        user: {
          ...userWithoutSensitiveData,
          id: userId,
        },
      };
    } catch (error) {
      console.error('[AuthService] Sign in error:', error);
      throw error;
    }
  }

  async logout(userId: string) {
    return this.usersService.updateRefreshToken(userId, null);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access Denied');
    }
    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      throw new ForbiddenException('Access Denied');
    }
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  private async getTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_SECRET, expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }
}
