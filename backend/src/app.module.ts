import { Module } from '@nestjs/common';
import { ResumeModule } from './resume/resume.module';
import { JobsModule } from './jobs/jobs.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [AiModule, ResumeModule, JobsModule],
})
export class AppModule {}
