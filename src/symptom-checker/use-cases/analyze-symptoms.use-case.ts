import { Injectable, Logger } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { SymptomContext } from '../domain/value-objects/symptom-context.vo.js';
import { SymptomCheckResponseDto } from '../dto/symptom-check-response.dto.js';

const symptomCheckSchema = z.object({
  possibleConditions: z.array(
    z.object({
      name: z.string(),
      likelihood: z.enum(['high', 'medium', 'low']),
      description: z.string(),
    }),
  ),
  recommendedSpecialties: z.array(z.string()),
  urgencyLevel: z.enum(['emergency', 'urgent', 'routine', 'self-care']),
  generalAdvice: z.string(),
  disclaimer: z.string(),
});

@Injectable()
export class AnalyzeSymptomsUseCase {
  private readonly logger = new Logger(AnalyzeSymptomsUseCase.name);

  private llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    temperature: 0.3,
  });

  private readonly symptomPrompt = PromptTemplate.fromTemplate(`
    You are a medical triage assistant. Analyze the patient's symptoms and provide preliminary health guidance.

    Patient Information:
    - Symptoms: {symptoms}
    - Age: {age}
    - Gender: {gender}
    - Duration: {duration}
    - Severity: {severity}
    - Medical History: {medicalHistory}

    Based on these symptoms, provide a structured assessment. Be thorough but conservative — always err on the side of caution.

    Urgency levels:
    - "emergency": Seek emergency care immediately (e.g., chest pain, stroke symptoms, severe difficulty breathing)
    - "urgent": See a doctor within 24 hours
    - "routine": Schedule a doctor's appointment within a few days
    - "self-care": Can be managed at home with rest and OTC remedies

    Return ONLY a valid JSON object with this exact structure:
    {{
      "possibleConditions": [
        {{
          "name": "Condition name",
          "likelihood": "high" | "medium" | "low",
          "description": "Brief explanation of why this condition matches the symptoms"
        }}
      ],
      "recommendedSpecialties": ["List of medical specialties to consult, e.g. General Physician, Cardiologist"],
      "urgencyLevel": "emergency" | "urgent" | "routine" | "self-care",
      "generalAdvice": "Practical advice for managing symptoms right now",
      "disclaimer": "Always include: This is a preliminary AI assessment only and not a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment."
    }}

    Do not include markdown, code blocks, or any text outside the JSON object.
  `);

  async execute(context: SymptomContext): Promise<SymptomCheckResponseDto> {
    this.logger.log(`Analyzing symptoms: ${context.symptoms?.join(', ')}`);

    const chain = this.symptomPrompt.pipe(this.llm);

    const result = await chain.invoke({
      symptoms: context.symptoms?.join(', ') ?? 'Not specified',
      age: context.age ? `${context.age} years old` : 'Not specified',
      gender: context.gender ?? 'Not specified',
      duration: context.duration ?? 'Not specified',
      severity: context.severity ?? 'Not specified',
      medicalHistory: context.medicalHistory?.length
        ? context.medicalHistory.join(', ')
        : 'None provided',
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

    const parsed: unknown = JSON.parse(cleanJson);
    const validated = symptomCheckSchema.parse(parsed);

    this.logger.log(
      `Analysis complete. Urgency: ${validated.urgencyLevel}, Conditions: ${validated.possibleConditions.length}`,
    );

    return validated;
  }
}
