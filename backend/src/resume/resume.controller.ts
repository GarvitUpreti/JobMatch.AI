import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeService, ParsedResume } from './resume.service';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File): Promise<ParsedResume> {
    if (!file?.buffer) throw new BadRequestException('No file uploaded');
    const text = await this.resumeService.extractTextFromBuffer(
      file.buffer,
      file.mimetype || 'application/octet-stream',
    );
    if (!text.trim()) throw new BadRequestException('Could not extract text from file');
    return this.resumeService.parseResume(text);
  }

  @Post('parse')
  async parse(@Body('text') text: string): Promise<ParsedResume> {
    if (!text?.trim()) throw new BadRequestException('text is required');
    return this.resumeService.parseResume(text);
  }
}
