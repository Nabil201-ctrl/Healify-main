// backend/src/auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'SecurePass123!',
    minLength: 8,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
