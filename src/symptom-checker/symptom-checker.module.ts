import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SymptomCheckerController } from './symptom-checker.controller.js';
import { SymptomCheckerService } from './symptom-checker.service.js';
import { AnalyzeSymptomsUseCase } from './use-cases/analyze-symptoms.use-case.js';
import { UpdateSymptomContextUseCase } from './use-cases/update-symptom-context.use-case.js';
import { HandleClarificationUseCase } from './use-cases/handle-clarification.use-case.js';
import { HandleFollowUpUseCase } from './use-cases/handle-followup.use-case.js';
import { SymptomSessionRepository } from './domain/repositories/symptom-session.repository.js';
import { SymptomSessionRepositoryImpl } from './infrastructure/repositories/symptom-session.repository.impl.js';
import { SymptomSessionDoc, SymptomSessionSchema } from './infrastructure/schemas/symptom-session.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SymptomSessionDoc.name, schema: SymptomSessionSchema },
    ]),
  ],
  controllers: [SymptomCheckerController],
  providers: [
    SymptomCheckerService,
    AnalyzeSymptomsUseCase,
    UpdateSymptomContextUseCase,
    HandleClarificationUseCase,
    HandleFollowUpUseCase,
    {
      provide: SymptomSessionRepository,
      useClass: SymptomSessionRepositoryImpl,
    },
  ],
})
export class SymptomCheckerModule {}
