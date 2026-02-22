import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MedicationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  sleepHours?: number;

  @IsOptional()
  @IsEnum(['Slim', 'Lean', 'Average', 'Athletic', 'Overweight'])
  bodyType?: string;

  @IsOptional()
  @IsEnum(['Male', 'Female', 'Non-binary', 'Prefer not to say'])
  gender?: string;

  @IsOptional()
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'])
  bloodType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  healthIssues?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications?: MedicationDto[];

  @IsOptional()
  @IsNumber()
  averageSteps?: number;

  @IsOptional()
  @IsEnum(['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'])
  activityLevel?: string;

  @IsOptional()
  @IsEnum(['Active', 'Office', 'Mixed'])
  jobType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  daysLessActive?: string[];

  @IsOptional()
  @IsEnum(['Never', 'Former', 'Current'])
  smokingStatus?: string;

  @IsOptional()
  @IsEnum(['None', 'Occasional', 'Moderate', 'Heavy'])
  alcoholUse?: string;

  @IsOptional()
  @IsEnum(['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'])
  maritalStatus?: string;

  @IsOptional()
  @IsBoolean()
  hasChildren?: boolean;

  @IsOptional()
  @IsNumber()
  numberOfChildren?: number;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsBoolean()
  isProfileComplete?: boolean;

  @IsOptional()
  @IsEnum(['PENDING', 'PROFILE_SETUP', 'COMPLETED'])
  onboardingStatus?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
