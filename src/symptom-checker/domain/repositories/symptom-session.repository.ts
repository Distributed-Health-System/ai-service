import { SymptomSession } from '../aggregates/symptom-session.aggregate.js';

export abstract class SymptomSessionRepository {
  abstract save(session: SymptomSession): Promise<void>;
  abstract findBySessionId(sessionId: string): Promise<SymptomSession | null>;
  abstract findByPatientId(patientId: string): Promise<SymptomSession[]>;
}
