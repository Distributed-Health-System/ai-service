import { SymptomConversation } from '../entities/symptom-conversation.entity.js';
import { SymptomContext } from '../value-objects/symptom-context.vo.js';
import { SymptomCheckResponseDto } from '../../dto/symptom-check-response.dto.js';

export class SymptomSession {
  public conversation: SymptomConversation;
  public analysis?: SymptomCheckResponseDto;

  constructor(
    public readonly id: string,
    public readonly patientId: string,
    conversation?: SymptomConversation,
    analysis?: SymptomCheckResponseDto,
  ) {
    this.conversation = conversation ?? new SymptomConversation();
    this.analysis = analysis;
  }

  addUserMessage(message: string): void {
    this.conversation.addMessage('user', message);
  }

  addAssistantMessage(message: string): void {
    this.conversation.addMessage('assistant', message);
  }

  getContext(): SymptomContext {
    return this.conversation.getContext();
  }

  updateContext(updates: Partial<SymptomContext> & { stage?: any }): void {
    this.conversation.updateContext(updates);
  }

  setAnalysis(result: SymptomCheckResponseDto): void {
    this.analysis = result;
    this.updateContext({ stage: 'following-up' });
  }

  getMessages() {
    return this.conversation.messages;
  }

  // --- State machine ---

  needsMoreInfo(): boolean {
    const stage = this.getContext().stage;
    return stage === 'initial' || stage === 'gathering';
  }

  isReadyForAnalysis(): boolean {
    return this.getContext().stage === 'analyzing';
  }

  isInFollowUp(): boolean {
    return this.getContext().stage === 'following-up';
  }
}
