import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UserModule } from '@/modules/user/user.module';
import { ResumeModule } from '@/modules/resume/resume.module';
import { JobModule } from '@/modules/job/job.module';
import { InterviewModule } from '@/modules/interview/interview.module';
import { AiModule } from '@/modules/ai/ai.module';

@Module({
  imports: [UserModule, ResumeModule, JobModule, InterviewModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
