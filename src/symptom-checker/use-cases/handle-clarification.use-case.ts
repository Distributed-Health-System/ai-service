import { Injectable } from '@nestjs/common';
import { SymptomContext } from '../domain/value-objects/symptom-context.vo.js';

@Injectable()
export class HandleClarificationUseCase {
  execute(context: SymptomContext): string {
    if (!context.symptoms?.length) {
      return "Hello! I'm your AI symptom checker. Please describe the symptoms you're experiencing and I'll help assess them.";
    }

    const missing: string[] = [];
    if (!context.duration) missing.push('how long you have had these symptoms');
    if (!context.severity) missing.push('the severity (mild, moderate, or severe)');

    const symptomList = context.symptoms.join(', ');

    if (missing.length === 0) {
      return `Got it — ${symptomList}. Let me analyse these for you.`;
    }

    return `I can see you're experiencing: ${symptomList}. To give you a better assessment, could you also tell me ${missing.join(' and ')}?`;
  }
}
