import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SymptomSessionRepository } from '../../domain/repositories/symptom-session.repository.js';
import { SymptomSession } from '../../domain/aggregates/symptom-session.aggregate.js';
import { SymptomConversation } from '../../domain/entities/symptom-conversation.entity.js';
import { ConversationMessage } from '../../domain/value-objects/conversation-message.vo.js';
import { SymptomContext } from '../../domain/value-objects/symptom-context.vo.js';
import {
  SymptomSessionDoc,
  SymptomSessionDocument,
} from '../schemas/symptom-session.schema.js';

@Injectable()
export class SymptomSessionRepositoryImpl extends SymptomSessionRepository {
  constructor(
    @InjectModel(SymptomSessionDoc.name)
    private readonly model: Model<SymptomSessionDocument>,
  ) {
    super();
  }

  async save(session: SymptomSession): Promise<void> {
    const context = session.getContext();

    await this.model.findOneAndUpdate(
      { sessionId: session.id },
      {
        sessionId: session.id,
        patientId: session.patientId,
        messages: session.getMessages().map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
        context: {
          stage: context.stage,
          symptoms: context.symptoms,
          age: context.age,
          gender: context.gender,
          duration: context.duration,
          severity: context.severity,
          medicalHistory: context.medicalHistory,
        },
        analysis: session.analysis ?? undefined,
      },
      { upsert: true, new: true },
    );
  }

  async findBySessionId(sessionId: string): Promise<SymptomSession | null> {
    const doc = await this.model.findOne({ sessionId }).exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByPatientId(patientId: string): Promise<SymptomSession[]> {
    const docs = await this.model
      .find({ patientId })
      .sort({ updatedAt: -1 })
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  private toDomain(doc: SymptomSessionDocument): SymptomSession {
    const messages = doc.messages.map(
      (m) => new ConversationMessage(m.role as 'user' | 'assistant', m.content, m.timestamp),
    );

    const context = new SymptomContext(
      doc.context.stage as any,
      doc.context.symptoms,
      doc.context.age,
      doc.context.gender,
      doc.context.duration,
      doc.context.severity,
      doc.context.medicalHistory,
    );

    const conversation = new SymptomConversation(messages, context);
    return new SymptomSession(doc.sessionId, doc.patientId, conversation, doc.analysis as any);
  }
}
