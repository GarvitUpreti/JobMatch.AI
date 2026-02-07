import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

@Module({
  imports: [
    MulterModule.register({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  ],
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
