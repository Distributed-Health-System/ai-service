import { Injectable, Logger } from '@nestjs/common';
import { SymptomSession } from './domain/aggregates/symptom-session.aggregate.js';
import { SymptomSessionRepository } from './domain/repositories/symptom-session.repository.js';
import { AnalyzeSymptomsUseCase } from './use-cases/analyze-symptoms.use-case.js';
import { UpdateSymptomContextUseCase } from './use-cases/update-symptom-context.use-case.js';
import { HandleClarificationUseCase } from './use-cases/handle-clarification.use-case.js';
import { HandleFollowUpUseCase } from './use-cases/handle-followup.use-case.js';
import { ChatSymptomDto } from './dto/chat-symptom.dto.js';
import { ChatSymptomResponseDto } from './dto/chat-symptom-response.dto.js';

@Injectable()
export class SymptomCheckerService {
  private readonly logger = new Logger(SymptomCheckerService.name);

  // In-memory cache — same pattern as itinerary service
  private readonly sessions: Map<string, SymptomSession> = new Map();

  constructor(
    private readonly updateSymptomContextUseCase: UpdateSymptomContextUseCase,
    private readonly handleClarificationUseCase: HandleClarificationUseCase,
    private readonly analyzeSymptomsUseCase: AnalyzeSymptomsUseCase,
    private readonly handleFollowUpUseCase: HandleFollowUpUseCase,
    private readonly sessionRepository: SymptomSessionRepository,
  ) {}

  async chat(
    patientId: string,
    dto: ChatSymptomDto,
  ): Promise<ChatSymptomResponseDto> {
    this.logger.log(
      `Patient ${patientId} | Session ${dto.sessionId}: "${dto.message}"`,
    );

    // Memory → DB → new session
    let session = this.sessions.get(dto.sessionId);
    if (!session) {
      session =
        (await this.sessionRepository.findBySessionId(dto.sessionId)) ??
        new SymptomSession(dto.sessionId, patientId);
      this.sessions.set(dto.sessionId, session);
    }

    session.addUserMessage(dto.message);
    await this.updateSymptomContextUseCase.execute(dto.message, session);

    let response: string;

    if (session.isInFollowUp()) {
      response = await this.handleFollowUpUseCase.execute(dto.message, session);
    } else if (session.isReadyForAnalysis()) {
      response = await this.runAnalysis(session);
    } else {
      response = this.handleClarificationUseCase.execute(session.getContext());
    }

    session.addAssistantMessage(response);
    this.sessions.set(dto.sessionId, session);

    await this.sessionRepository.save(session);

    return {
      response,
      conversation: session.getMessages().map((m) => ({
        role: m.role,
        content: m.content,
      })),
      analysis: session.analysis,
    };
  }

  async getPatientSessions(
    patientId: string,
  ): Promise<ChatSymptomResponseDto[]> {
    const sessions = await this.sessionRepository.findByPatientId(patientId);
    return sessions.map((session) => ({
      sessionId: session.id,
      response: session.getMessages().at(-1)?.content ?? '',
      conversation: session.getMessages().map((m) => ({
        role: m.role,
        content: m.content,
      })),
      analysis: session.analysis,
    }));
  }

  async getSession(
    patientId: string,
    sessionId: string,
  ): Promise<ChatSymptomResponseDto | null> {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session =
        (await this.sessionRepository.findBySessionId(sessionId)) ?? undefined;
    }
    if (!session || session.patientId !== patientId) return null;

    return {
      sessionId: session.id,
      response: session.getMessages().at(-1)?.content ?? '',
      conversation: session.getMessages().map((m) => ({
        role: m.role,
        content: m.content,
      })),
      analysis: session.analysis,
    };
  }

  private async runAnalysis(session: SymptomSession): Promise<string> {
    const analysis = await this.analyzeSymptomsUseCase.execute(
      session.getContext(),
    );
    session.setAnalysis(analysis);

    const urgencyMessages: Record<string, string> = {
      emergency: 'Please seek emergency medical care immediately.',
      urgent: 'Please see a doctor within the next 24 hours.',
      routine: "I'd recommend scheduling an appointment with your doctor soon.",
      'self-care': 'This can likely be managed at home for now.',
    };

    return (
      `Based on your symptoms I've completed a preliminary assessment. ` +
      `${urgencyMessages[analysis.urgencyLevel]} ` +
      `Feel free to ask me any follow-up questions about the findings.`
    );
  }
}
