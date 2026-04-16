import { IsString, IsNotEmpty } from 'class-validator';

export class ChatSymptomDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
