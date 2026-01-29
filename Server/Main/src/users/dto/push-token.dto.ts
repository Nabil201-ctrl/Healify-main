import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PushTokenDto {
  @ApiProperty({
    description: 'Expo push token or FCM device token',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Platform (ios or android)',
    example: 'ios',
    required: false,
  })
  @IsString()
  @IsOptional()
  platform?: 'ios' | 'android';
}
