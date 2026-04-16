export type SymptomStage = 'initial' | 'gathering' | 'analyzing' | 'following-up';

export class SymptomContext {
  constructor(
    public readonly stage: SymptomStage,
    public readonly symptoms?: string[],
    public readonly age?: number,
    public readonly gender?: string,
    public readonly duration?: string,
    public readonly severity?: string,
    public readonly medicalHistory?: string[],
  ) {}

  hasEnoughInfo(): boolean {
    return !!(this.symptoms?.length && this.duration && this.severity);
  }

  update(
    updates: Partial<Omit<SymptomContext, 'stage'>> & { stage?: SymptomStage },
  ): SymptomContext {
    return new SymptomContext(
      updates.stage ?? this.stage,
      updates.symptoms ?? this.symptoms,
      updates.age ?? this.age,
      updates.gender ?? this.gender,
      updates.duration ?? this.duration,
      updates.severity ?? this.severity,
      updates.medicalHistory ?? this.medicalHistory,
    );
  }
}
