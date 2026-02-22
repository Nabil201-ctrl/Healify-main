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
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

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
      const { password, refreshTokens, ...userWithoutSensitiveData } = user as any;
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
        refreshTokens: __,
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
    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
      throw new ForbiddenException('Access Denied');
    }

    let isMatch = false;
    let oldHashedToken: string | null = null;
    for (const rt of user.refreshTokens) {
      if (await bcrypt.compare(refreshToken, rt)) {
        isMatch = true;
        oldHashedToken = rt;
        break;
      }
    }

    if (!isMatch || !oldHashedToken) {
      throw new ForbiddenException('Access Denied');
    }
    const tokens = await this.getTokens(user.id, user.email);
    const hashedNewToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.replaceRefreshToken(user.id, oldHashedToken, hashedNewToken);
    return tokens;
  }

  getGoogleAuthUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URI;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=email%20profile`;
    return { url: authUrl };
  }

  async googleSignIn(token: string) {
    let email: string, firstName: string, lastName: string;

    try {
      const response = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      email = response.data.email;
      firstName = response.data.given_name || 'Google';
      lastName = response.data.family_name || 'User';

      if (!email) {
        throw new Error('No email returned from Google');
      }
    } catch (error) {
      throw new UnauthorizedException(
        'Failed to authenticate with Google: Invalid or expired token',
      );
    }

    let user = await this.usersService.findOneByEmail(email);
    if (!user) {
      // Auto-register Google User
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await this.usersService.create({
        email,
        firstName,
        lastName,
        password: hashedPassword,
      });
    }

    const userId = (user as any)._id?.toString() || (user as any).id;
    const tokens = await this.getTokens(userId, user!.email);
    await this.updateRefreshToken(userId, tokens.refreshToken);

    const userObj =
      typeof (user as any).toObject === 'function'
        ? (user as any).toObject()
        : user;
    const {
      password: _,
      refreshTokens: __,
      _id,
      __v,
      ...userWithoutSensitiveData
    } = userObj as any;

    return {
      ...tokens,
      user: {
        ...userWithoutSensitiveData,
        id: userId,
      },
    };
  }

  private async getTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_SECRET, expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '30d' },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }
}
