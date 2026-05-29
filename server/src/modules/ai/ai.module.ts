import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { HrReportController } from './hr-report.controller';
import { HrReportService } from './hr-report.service';

@Module({
  controllers: [AiController, HrReportController],
  providers: [AiService, HrReportService],
  exports: [AiService],
})
export class AiModule {}
