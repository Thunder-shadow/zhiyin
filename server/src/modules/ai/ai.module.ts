import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { HrReportController } from './hr-report.controller';
import { HrReportService } from './hr-report.service';
import { HrCandidateController } from './hr-candidate.controller';
import { HrCandidateService } from './hr-candidate.service';

@Module({
  controllers: [AiController, HrReportController, HrCandidateController],
  providers: [AiService, HrReportService, HrCandidateService],
  exports: [AiService],
})
export class AiModule {}
