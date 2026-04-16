import { ConversationMessage } from '../value-objects/conversation-message.vo.js';
import {
  SymptomContext,
  SymptomStage,
} from '../value-objects/symptom-context.vo.js';

export class SymptomConversation {
  constructor(
    public messages: ConversationMessage[] = [],
    public context: SymptomContext = new SymptomContext('initial'),
  ) {}

  addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.push(new ConversationMessage(role, content));
  }

  getContext(): SymptomContext {
    return this.context;
  }

  updateContext(
    updates: Partial<Omit<SymptomContext, 'stage'>> & { stage?: SymptomStage },
  ): void {
    this.context = this.context.update(updates);
  }

  getLastUserMessage(): ConversationMessage | undefined {
    return this.messages
      .slice()
      .reverse()
      .find((msg) => msg.role === 'user');
  }
}
