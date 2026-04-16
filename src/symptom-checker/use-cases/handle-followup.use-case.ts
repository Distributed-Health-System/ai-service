import { Injectable, Logger } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { SymptomSession } from '../domain/aggregates/symptom-session.aggregate.js';

@Injectable()
export class HandleFollowUpUseCase {
  private readonly logger = new Logger(HandleFollowUpUseCase.name);

  private llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    temperature: 0.3,
  });

  private readonly followUpPrompt = PromptTemplate.fromTemplate(`
    You are a medical triage assistant. The patient has already received a preliminary symptom analysis and is now asking a follow-up question.

    Previous analysis: {analysis}

    Conversation history:
    {history}

    Patient's follow-up question: "{message}"

    Answer the patient's question clearly and helpfully based on the analysis and conversation so far.
    Always remind the patient that this is AI guidance only and not a substitute for professional medical advice.
    Keep the response concise and easy to understand.
  `);

  async execute(message: string, session: SymptomSession): Promise<string> {
    this.logger.log('Handling follow-up question...');

    const chain = this.followUpPrompt.pipe(this.llm);

    const result = await chain.invoke({
      message,
      analysis: JSON.stringify(session.analysis),
      history: session
        .getMessages()
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n'),
    });

    return typeof result.content === 'string'
      ? result.content
      : JSON.stringify(result.content);
  }
}
