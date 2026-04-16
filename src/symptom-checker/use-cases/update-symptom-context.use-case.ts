import { Injectable, Logger } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { SymptomSession } from '../domain/aggregates/symptom-session.aggregate.js';

const extractedSchema = z.object({
  symptoms: z.array(z.string()),
  age: z.number().nullable().transform((v) => v ?? undefined),
  gender: z.string().nullable().transform((v) => v ?? undefined),
  duration: z.string().nullable().transform((v) => v ?? undefined),
  severity: z.string().nullable().transform((v) => v ?? undefined),
  medicalHistory: z.array(z.string()),
  hasEnoughInfo: z.boolean(),
  isFollowUp: z.boolean(),
});

@Injectable()
export class UpdateSymptomContextUseCase {
  private readonly logger = new Logger(UpdateSymptomContextUseCase.name);

  private llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    temperature: 0.1,
  });

  private readonly extractPrompt = PromptTemplate.fromTemplate(`
    Extract medical information from the patient's message based on the current conversation context.

    Current context: {context}
    Conversation history: {history}
    Patient message: "{message}"

    You must respond with ONLY a valid JSON object with these exact fields:
    {{
      "symptoms": ["array of symptoms mentioned across the entire conversation — carry over existing ones"],
      "age": number or null,
      "gender": "male" | "female" | "other" or null,
      "duration": "how long symptoms have been present, e.g. '2 days', '1 week'" or null,
      "severity": "mild" | "moderate" | "severe" or null,
      "medicalHistory": ["array of pre-existing conditions mentioned, e.g. 'diabetes', 'asthma'"],
      "hasEnoughInfo": true if symptoms, duration, AND severity are all known,
      "isFollowUp": true if the patient is asking a follow-up question about a previous analysis rather than reporting new symptoms
    }}

    Do not include markdown, code blocks, or any text outside the JSON object.
  `);

  async execute(message: string, session: SymptomSession): Promise<void> {
    this.logger.log('Extracting symptom context from message...');

    try {
      const chain = this.extractPrompt.pipe(this.llm);
      const result = await chain.invoke({
        message,
        context: JSON.stringify(session.getContext()),
        history: session
          .getMessages()
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n'),
      });

      const rawContent =
        typeof result.content === 'string'
          ? result.content
          : JSON.stringify(result.content);

      let cleanJson = rawContent.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const extracted = extractedSchema.parse(JSON.parse(cleanJson));

      const stage = (() => {
        if (extracted.isFollowUp && session.analysis) return 'following-up';
        if (extracted.hasEnoughInfo) return 'analyzing';
        if (extracted.symptoms.length > 0) return 'gathering';
        return 'initial';
      })();

      session.updateContext({
        stage,
        symptoms: extracted.symptoms.length ? extracted.symptoms : undefined,
        age: extracted.age,
        gender: extracted.gender,
        duration: extracted.duration,
        severity: extracted.severity,
        medicalHistory: extracted.medicalHistory.length
          ? extracted.medicalHistory
          : undefined,
      });
    } catch (error) {
      this.logger.error('Error extracting symptom context:', error);
      // Fallback: keep existing context, don't crash the session
    }
  }
}
