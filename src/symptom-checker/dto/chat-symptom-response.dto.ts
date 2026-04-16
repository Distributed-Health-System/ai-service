import { SymptomCheckResponseDto } from './symptom-check-response.dto.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSymptomResponseDto {
  sessionId?: string;
  response: string;
  conversation: ChatMessage[];
  analysis?: SymptomCheckResponseDto;
}
