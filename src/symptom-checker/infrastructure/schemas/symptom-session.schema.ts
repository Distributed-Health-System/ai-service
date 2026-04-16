import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SymptomSessionDocument = SymptomSessionDoc & Document;

@Schema({ _id: false })
class MessageSubdoc {
  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: () => new Date() })
  timestamp: Date;
}

const MessageSubdocSchema = SchemaFactory.createForClass(MessageSubdoc);

@Schema({ _id: false })
class SymptomContextSubdoc {
  @Prop({
    required: true,
    enum: ['initial', 'gathering', 'analyzing', 'following-up'],
  })
  stage: string;

  @Prop({ type: [String] })
  symptoms?: string[];

  @Prop({ type: Number })
  age?: number;

  @Prop({ type: String })
  gender?: string;

  @Prop({ type: String })
  duration?: string;

  @Prop({ type: String })
  severity?: string;

  @Prop({ type: [String] })
  medicalHistory?: string[];
}

const SymptomContextSubdocSchema =
  SchemaFactory.createForClass(SymptomContextSubdoc);

@Schema({ _id: false })
class PossibleConditionSubdoc {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['high', 'medium', 'low'] })
  likelihood: string;

  @Prop({ required: true })
  description: string;
}

const PossibleConditionSubdocSchema = SchemaFactory.createForClass(
  PossibleConditionSubdoc,
);

@Schema({ _id: false })
class AnalysisSubdoc {
  @Prop({ required: true, type: [PossibleConditionSubdocSchema] })
  possibleConditions: PossibleConditionSubdoc[];

  @Prop({ required: true, type: [String] })
  recommendedSpecialties: string[];

  @Prop({
    required: true,
    enum: ['emergency', 'urgent', 'routine', 'self-care'],
  })
  urgencyLevel: string;

  @Prop({ required: true })
  generalAdvice: string;

  @Prop({ required: true })
  disclaimer: string;
}

const AnalysisSubdocSchema = SchemaFactory.createForClass(AnalysisSubdoc);

@Schema({ timestamps: true, collection: 'symptom_sessions' })
export class SymptomSessionDoc {
  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ required: true, index: true })
  patientId: string;

  @Prop({ required: true, type: [MessageSubdocSchema], default: [] })
  messages: MessageSubdoc[];

  @Prop({ required: true, type: SymptomContextSubdocSchema })
  context: SymptomContextSubdoc;

  @Prop({ type: AnalysisSubdocSchema })
  analysis?: AnalysisSubdoc;
}

export const SymptomSessionSchema =
  SchemaFactory.createForClass(SymptomSessionDoc);
