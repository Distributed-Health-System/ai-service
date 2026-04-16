export type ConditionLikelihood = 'high' | 'medium' | 'low';
export type UrgencyLevel = 'emergency' | 'urgent' | 'routine' | 'self-care';

export interface PossibleCondition {
  name: string;
  likelihood: ConditionLikelihood;
  description: string;
}

export interface SymptomCheckResponseDto {
  possibleConditions: PossibleCondition[];
  recommendedSpecialties: string[];
  urgencyLevel: UrgencyLevel;
  generalAdvice: string;
  disclaimer: string;
}
