import { IsArray, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export enum PatientGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export class CheckSymptomsDto {
  @IsArray()
  @IsString({ each: true })
  symptoms: string[];

  @IsOptional()
  @IsNumber()
  patientAge?: number;

  @IsOptional()
  @IsEnum(PatientGender)
  patientGender?: PatientGender;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicalHistory?: string[];
}
