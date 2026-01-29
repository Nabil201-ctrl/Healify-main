import { IsString, IsOptional, IsNumber, IsEnum, IsArray, IsBoolean } from 'class-validator';

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
    @IsEnum(['Slim', 'Lean', 'Fat', 'Average'])
    bodyType?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    healthIssues?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    allergies?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    medications?: string[];

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
    @IsBoolean()
    isProfileComplete?: boolean;

    @IsOptional()
    @IsEnum(['PENDING', 'PROFILE_SETUP', 'COMPLETED'])
    onboardingStatus?: string;

    @IsOptional()
    @IsString()
    location?: string;
}
