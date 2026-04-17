import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SymptomCheckerService } from './symptom-checker.service.js';
import { ChatSymptomDto } from './dto/chat-symptom.dto.js';
import { ChatSymptomResponseDto } from './dto/chat-symptom-response.dto.js';
import { GatewayAuthGuard } from '../shared/guards/gateway-auth.guard.js';
import { RolesGuard } from '../shared/guards/roles.guard.js';
import { Roles } from '../shared/decorators/roles.decorator.js';

@UseGuards(GatewayAuthGuard, RolesGuard)
@Roles('patient')
@Controller('symptom-checker')
export class SymptomCheckerController {
  constructor(private readonly symptomCheckerService: SymptomCheckerService) {}

  // Start or continue a conversation
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(
    @Body() dto: ChatSymptomDto,
    @Req() req: any,
  ): Promise<ChatSymptomResponseDto> {
    const patientId = req['userId'] as string;
    if (!patientId) throw new UnauthorizedException();
    return this.symptomCheckerService.chat(patientId, dto);
  }

  // Get all sessions for the authenticated patient
  @Get('sessions')
  async getMySessions(@Req() req: Request): Promise<ChatSymptomResponseDto[]> {
    const patientId = req['userId'] as string;
    if (!patientId) throw new UnauthorizedException();
    return this.symptomCheckerService.getPatientSessions(patientId);
  }

  // Get a specific session
  @Get('sessions/:sessionId')
  async getSession(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ): Promise<ChatSymptomResponseDto> {
    const patientId = req['userId'] as string;
    if (!patientId) throw new UnauthorizedException();
    const session = await this.symptomCheckerService.getSession(
      patientId,
      sessionId,
    );
    if (!session) throw new UnauthorizedException('Session not found');
    return session;
  }
}
