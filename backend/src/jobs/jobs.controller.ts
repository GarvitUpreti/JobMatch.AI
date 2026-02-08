import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { JobsService, JobListing, ScoredJob, JobFilters } from './jobs.service';

export interface JobsListResponse {
  jobs: JobListing[];
  total: number;
}

export interface MatchResponse {
  jobs: ScoredJob[];
  total: number;
}

const POSTED_DAYS_MIN = 1;
const POSTED_DAYS_MAX = 365;
const EXPERIENCE_YEARS_MAX = 30;

function toFilters(
  q?: string,
  postedWithin?: string,
  experienceMin?: string,
  experienceMax?: string,
  compensationMin?: string,
): JobFilters {
  const filters: JobFilters = { keywords: q?.trim() || undefined };
  const days = postedWithin ? parseInt(postedWithin, 10) : undefined;
  if (days != null && !Number.isNaN(days) && days >= POSTED_DAYS_MIN && days <= POSTED_DAYS_MAX)
    filters.postedWithinDays = days;
  const expMin = experienceMin ? parseInt(experienceMin, 10) : undefined;
  if (expMin != null && !Number.isNaN(expMin) && expMin >= 0 && expMin <= EXPERIENCE_YEARS_MAX)
    filters.experienceMinYears = expMin;
  const expMax = experienceMax ? parseInt(experienceMax, 10) : undefined;
  if (expMax != null && !Number.isNaN(expMax) && expMax >= 0 && expMax <= EXPERIENCE_YEARS_MAX)
    filters.experienceMaxYears = expMax;
  const min = compensationMin ? parseInt(compensationMin, 10) : undefined;
  if (min != null && !Number.isNaN(min) && min > 0) filters.compensationMin = min;
  return filters;
}

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('postedWithin') postedWithin?: string,
    @Query('experienceMin') experienceMin?: string,
    @Query('experienceMax') experienceMax?: string,
    @Query('compensationMin') compensationMin?: string,
    @Query('page') page?: string,
  ): Promise<JobsListResponse> {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    return this.jobsService.getJobs(toFilters(q, postedWithin, experienceMin, experienceMax, compensationMin), pageNum);
  }

  @Post('match')
  async match(
    @Body() body: {
      skills: string[];
      experience: string[];
      summary: string;
      keywords?: string;
      postedWithin?: number;
      experienceMin?: number;
      experienceMax?: number;
      compensationMin?: number;
      page?: number;
    },
  ): Promise<MatchResponse> {
    const days = body.postedWithin;
    const postedWithinDays =
      days != null && !Number.isNaN(days) && days >= POSTED_DAYS_MIN && days <= POSTED_DAYS_MAX ? days : undefined;
    const expMin = body.experienceMin;
    const experienceMinYears =
      expMin != null && !Number.isNaN(expMin) && expMin >= 0 && expMin <= EXPERIENCE_YEARS_MAX ? expMin : undefined;
    const expMax = body.experienceMax;
    const experienceMaxYears =
      expMax != null && !Number.isNaN(expMax) && expMax >= 0 && expMax <= EXPERIENCE_YEARS_MAX ? expMax : undefined;
    const filters: JobFilters = {
      keywords: body.keywords?.trim() || undefined,
      postedWithinDays,
      experienceMinYears,
      experienceMaxYears,
      compensationMin: body.compensationMin != null && body.compensationMin > 0 ? body.compensationMin : undefined,
    };
    const page = Math.max(1, body.page ?? 1);
    return this.jobsService.matchAndScoreJobs(
      {
        skills: body.skills ?? [],
        experience: body.experience ?? [],
        summary: body.summary ?? '',
      },
      filters,
      page,
    );
  }
}
