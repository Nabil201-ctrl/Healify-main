import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetLocationDto {
  @ApiProperty({
    description: 'User location (city, state, country)',
    example: 'New York, NY, USA',
  })
  @IsString()
  @IsNotEmpty()
  location: string;
}
