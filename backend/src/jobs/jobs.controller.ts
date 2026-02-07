import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { JobsService, JobListing, ScoredJob } from './jobs.service';

export interface JobsListResponse {
  jobs: JobListing[];
  total: number;
}

export interface MatchResponse {
  jobs: ScoredJob[];
  total: number;
}

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('page') page?: string,
  ): Promise<JobsListResponse> {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    return this.jobsService.getJobs(q, pageNum);
  }

  @Post('match')
  async match(
    @Body() body: {
      skills: string[];
      experience: string[];
      summary: string;
      textFilter?: string;
      page?: number;
    },
    @Query('q') q?: string,
  ): Promise<MatchResponse> {
    const textFilter = body.textFilter ?? q;
    const page = Math.max(1, body.page ?? 1);
    return this.jobsService.matchAndScoreJobs(
      {
        skills: body.skills ?? [],
        experience: body.experience ?? [],
        summary: body.summary ?? '',
      },
      textFilter,
      page,
    );
  }
}
