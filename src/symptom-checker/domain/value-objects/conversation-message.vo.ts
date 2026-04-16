export class ConversationMessage {
  constructor(
    public readonly role: 'user' | 'assistant',
    public readonly content: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
