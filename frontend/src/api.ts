const API = import.meta.env.VITE_API_URL ?? '/api';

export interface ParsedResume {
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
  rawText: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  applyLink: string;
  postedAt?: string;
  experienceRequired?: string;
  salaryMin?: number;
}

export interface JobFilters {
  keywords?: string;
  postedWithin?: number;
  experienceMin?: number;
  experienceMax?: number;
  compensationMin?: number;
}

export interface ScoredJob extends JobListing {
  score: number;
  reason: string;
}

export async function uploadResume(file: File): Promise<ParsedResume> {
  const form = new FormData();
  form.append('file', file);
  const r = await fetch(`${API}/resume/upload`, { method: 'POST', body: form });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || r.statusText || 'Upload failed');
  }
  return r.json();
}

export async function parseResumeText(text: string): Promise<ParsedResume> {
  const r = await fetch(`${API}/resume/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || r.statusText || 'Parse failed');
  }
  return r.json();
}

export interface JobsResponse {
  jobs: JobListing[];
  total: number;
}

export interface MatchResponse {
  jobs: ScoredJob[];
  total: number;
}

export async function getJobs(filters: JobFilters, page = 1): Promise<JobsResponse> {
  const params = new URLSearchParams();
  if (filters.keywords) params.set('q', filters.keywords);
  if (filters.postedWithin) params.set('postedWithin', String(filters.postedWithin));
  if (filters.experienceMin != null) params.set('experienceMin', String(filters.experienceMin));
  if (filters.experienceMax != null) params.set('experienceMax', String(filters.experienceMax));
  if (filters.compensationMin) params.set('compensationMin', String(filters.compensationMin));
  if (page > 1) params.set('page', String(page));
  const url = `${API}/jobs${params.toString() ? `?${params}` : ''}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Failed to fetch jobs');
  return r.json();
}

export async function matchJobs(
  profile: { skills: string[]; experience: string[]; summary: string },
  filters: JobFilters,
  page = 1
): Promise<MatchResponse> {
  const r = await fetch(`${API}/jobs/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...profile,
      keywords: filters.keywords || undefined,
      postedWithin: filters.postedWithin,
      experienceMin: filters.experienceMin,
      experienceMax: filters.experienceMax,
      compensationMin: filters.compensationMin,
      page,
    }),
  });
  if (!r.ok) throw new Error('Match failed');
  return r.json();
}
