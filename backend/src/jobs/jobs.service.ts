import { Injectable } from '@nestjs/common';
import { GroqService } from '../ai/groq.service';

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

/** Explicit filter params from the 4-field form (no LLM). */
export interface JobFilters {
  keywords?: string;
  postedWithinDays?: number;
  experienceMinYears?: number;
  experienceMaxYears?: number;
  compensationMin?: number;
}

export interface ScoredJob extends JobListing {
  score: number;
  reason: string;
}

const MOCK_JOBS: JobListing[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc',
    location: 'Remote',
    description: 'Build React applications with TypeScript. Experience with Tailwind, state management, and REST APIs required.',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'REST APIs'],
    applyLink: 'https://example.com/apply/1',
    postedAt: '2025-02-01',
    experienceRequired: '4+ years',
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'New York, NY',
    description: 'Node.js and React. NestJS backend, PostgreSQL. CI/CD and cloud experience a plus.',
    skills: ['Node.js', 'NestJS', 'React', 'PostgreSQL'],
    applyLink: 'https://example.com/apply/2',
    postedAt: '2025-02-03',
    experienceRequired: '3–5 years',
  },
  {
    id: '3',
    title: 'Junior Software Developer',
    company: 'DevShop',
    location: 'Remote',
    description: 'Entry-level role. JavaScript/TypeScript, HTML/CSS, willingness to learn React and Node.',
    skills: ['JavaScript', 'TypeScript', 'HTML', 'CSS'],
    applyLink: 'https://example.com/apply/3',
    postedAt: '2025-02-05',
    experienceRequired: '0–1 year',
  },
  {
    id: '4',
    title: 'Backend Developer',
    company: 'DataFlow',
    location: 'Austin, TX',
    description: 'Design and maintain APIs. Experience with NestJS, databases, and message queues.',
    skills: ['NestJS', 'Node.js', 'SQL', 'REST'],
    applyLink: 'https://example.com/apply/4',
    postedAt: '2025-02-04',
    experienceRequired: '2+ years',
  },
  {
    id: '5',
    title: 'UI/UX Developer',
    company: 'DesignFirst',
    location: 'San Francisco, CA',
    description: 'Implement designs with React and Tailwind. Accessibility and responsive design focus.',
    skills: ['React', 'Tailwind CSS', 'Figma', 'Accessibility'],
    applyLink: 'https://example.com/apply/5',
    postedAt: '2025-02-02',
    experienceRequired: '3+ years',
  },
  {
    id: '6',
    title: 'DevOps Engineer',
    company: 'CloudScale',
    location: 'Remote',
    description: 'CI/CD, Docker, Kubernetes. Support Node and React deployments.',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
    applyLink: 'https://example.com/apply/6',
    postedAt: '2025-02-06',
    experienceRequired: '5+ years',
  },
  {
    id: '7',
    title: 'React Developer',
    company: 'WebAgency',
    location: 'Chicago, IL',
    description: 'React, Redux, TypeScript. Build responsive web apps.',
    skills: ['React', 'TypeScript', 'Redux', 'CSS'],
    applyLink: 'https://example.com/apply/7',
    postedAt: '2025-02-05',
    experienceRequired: '2+ years',
  },
  {
    id: '8',
    title: 'Node.js Backend Engineer',
    company: 'API Labs',
    location: 'Remote',
    description: 'REST APIs, NestJS, MongoDB. Microservices experience preferred.',
    skills: ['Node.js', 'NestJS', 'MongoDB', 'REST'],
    applyLink: 'https://example.com/apply/8',
    postedAt: '2025-02-04',
    experienceRequired: '3+ years',
  },
  {
    id: '9',
    title: 'Frontend Engineer',
    company: 'SaaS Co',
    location: 'Boston, MA',
    description: 'React and Tailwind. Focus on performance and UX.',
    skills: ['React', 'Tailwind CSS', 'JavaScript', 'TypeScript'],
    applyLink: 'https://example.com/apply/9',
    postedAt: '2025-02-03',
    experienceRequired: '2–4 years',
  },
  {
    id: '10',
    title: 'Full Stack Developer',
    company: 'GrowthTech',
    location: 'Denver, CO',
    description: 'React frontend, Node backend. PostgreSQL and cloud deployment.',
    skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    applyLink: 'https://example.com/apply/10',
    postedAt: '2025-02-02',
    experienceRequired: '3+ years',
  },
  {
    id: '11',
    title: 'Software Engineer - Frontend',
    company: 'FinanceApp',
    location: 'Remote',
    description: 'Build dashboards with React. TypeScript and testing required.',
    skills: ['React', 'TypeScript', 'Jest', 'Tailwind CSS'],
    applyLink: 'https://example.com/apply/11',
    postedAt: '2025-02-01',
    experienceRequired: '1+ year',
  },
  {
    id: '12',
    title: 'Backend API Developer',
    company: 'DataSync',
    location: 'Seattle, WA',
    description: 'NestJS, Redis, message queues. Design scalable APIs.',
    skills: ['NestJS', 'Node.js', 'Redis', 'REST'],
    applyLink: 'https://example.com/apply/12',
    postedAt: '2025-01-31',
    experienceRequired: '4+ years',
  },
];

const RESULTS_PER_PAGE = 10;

/** Structured criteria applied to job list (from 4-field form or LLM). */
export interface StructuredFilter {
  keywords: string[];
  postedAfter: string | null;
  locationKeywords: string[];
  seniority: string | null;
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  compensationMin: number | null;
}

/** Split filter string into multiple keywords (comma or space separated), trimmed and deduped. */
function parseKeywords(textFilter?: string): string[] {
  if (!textFilter?.trim()) return [];
  const keywords = textFilter
    .split(/[\s,]+/)
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
  return [...new Set(keywords)];
}

/** Parse job's required experience into a single "max years" number (e.g. "4+ years" -> 4, "0-1 year" -> 1). Returns null if unknown. */
function getMaxRequiredYears(job: JobListing): number | null {
  const text = [job.experienceRequired, job.description, job.title].filter(Boolean).join(' ').toLowerCase();
  const match = text.match(/(\d+)\+?\s*years?|(\d+)\s*[-–]\s*(\d+)\s*years?|(\d+)\s*years?\s*experience|experience\s*[-–]\s*(\d+)/i);
  if (match) {
    if (match[1]) return parseInt(match[1], 10);
    if (match[2] && match[3]) return Math.max(parseInt(match[2], 10), parseInt(match[3], 10));
    if (match[4]) return parseInt(match[4], 10);
    if (match[5]) return parseInt(match[5], 10);
  }
  return null;
}

/** Parse job's required experience into a "min years" number (e.g. "3-5 years" -> 3, "4+ years" -> 4). Returns null if unknown. */
function getMinRequiredYears(job: JobListing): number | null {
  const text = [job.experienceRequired, job.description, job.title].filter(Boolean).join(' ').toLowerCase();
  const match = text.match(/(\d+)\+?\s*years?|(\d+)\s*[-–]\s*(\d+)\s*years?|(\d+)\s*years?\s*experience|experience\s*[-–]\s*(\d+)/i);
  if (match) {
    if (match[1]) return parseInt(match[1], 10);
    if (match[2] && match[3]) return Math.min(parseInt(match[2], 10), parseInt(match[3], 10));
    if (match[4]) return parseInt(match[4], 10);
    if (match[5]) return parseInt(match[5], 10);
  }
  return null;
}

/** Apply structured filter (postedAfter, location, seniority, experienceMaxYears) to a job list. */
function applyStructuredFilter(jobs: JobListing[], filter: StructuredFilter): JobListing[] {
  return jobs.filter((j) => {
    if (filter.postedAfter && j.postedAt) {
      if (j.postedAt < filter.postedAfter) return false;
    }
    if (filter.locationKeywords.length > 0) {
      const loc = j.location.toLowerCase();
      const match = filter.locationKeywords.some((kw) => loc.includes(kw.toLowerCase()));
      if (!match) return false;
    }
    if (filter.seniority) {
      const text = `${j.title} ${j.description}`.toLowerCase();
      const seniority = filter.seniority.toLowerCase();
      if (seniority === 'senior' && !/senior|lead|principal|staff/.test(text)) return false;
      if (seniority === 'junior' && !/junior|entry-level|entry level/.test(text)) return false;
      if (seniority === 'mid' && !/mid-level|mid level|medium|intermediate/.test(text)) return false;
    }
    if (filter.experienceMinYears != null) {
      const jobMin = getMinRequiredYears(j);
      if (jobMin != null && jobMin < filter.experienceMinYears) return false;
    }
    if (filter.experienceMaxYears != null) {
      const jobMax = getMaxRequiredYears(j);
      if (jobMax != null && jobMax > filter.experienceMaxYears) return false;
    }
    if (filter.compensationMin != null && filter.compensationMin > 0) {
      const jobMin = j.salaryMin ?? 0;
      if (jobMin < filter.compensationMin) return false;
    }
    return true;
  });
}

/** Build StructuredFilter from the 4 explicit form fields (no LLM). */
function buildStructuredFilterFromForm(filters: JobFilters): StructuredFilter {
  const keywords = parseKeywords(filters.keywords);
  let postedAfter: string | null = null;
  if (filters.postedWithinDays != null && filters.postedWithinDays > 0) {
    postedAfter = new Date(Date.now() - filters.postedWithinDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }
  return {
    keywords,
    postedAfter,
    locationKeywords: [],
    seniority: null,
    experienceMinYears: filters.experienceMinYears ?? null,
    experienceMaxYears: filters.experienceMaxYears ?? null,
    compensationMin: filters.compensationMin ?? null,
  };
}

@Injectable()
export class JobsService {
  constructor(private readonly groq: GroqService) {}

  private isAdzunaConfigured(): boolean {
    return !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
  }

  /** Use LLM to parse natural-language filter into structured criteria. */
  private async parseFilterPrompt(userText: string): Promise<StructuredFilter> {
    const today = new Date().toISOString().slice(0, 10);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const system = `You are a job search filter parser. The user typed a natural language filter for job listings. Extract structured criteria. Today is ${today}. Reply with ONLY valid JSON, no markdown or explanation. Use this exact schema:
{ "keywords": ["word1", "word2"], "postedAfter": "YYYY-MM-DD" or null, "locationKeywords": ["remote", "city name"], "seniority": "senior" or "junior" or "mid" or null, "experienceMaxYears": number or null }
Rules:
- "past 2 weeks", "last 2 weeks", "recent", "posted in last 2 weeks" -> set postedAfter to "${twoWeeksAgo}" (exactly this date).
- "remote" or "work from home" -> add "remote" to locationKeywords.
- "senior" or "lead" -> seniority "senior". "junior" or "entry" -> seniority "junior".
- "required experience less than 1 year", "less than 1 year experience", "entry level", "0-1 year" -> experienceMaxYears: 1. "less than 2 years" -> 2. "less than 3 years" -> 3. If no experience filter, use null.
- Put ONLY job/role/tech keywords in "keywords" (e.g. react, node, developer). Do NOT put filter words like "posted", "weeks", "experience", "year" in keywords. If no job keywords, use empty array [].`;
    const user = `User input: ${userText}`;
    const raw = await this.groq.chat(system, user);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    let result: StructuredFilter;
    try {
      const parsed = JSON.parse(cleaned);
      const postedAfter = typeof parsed.postedAfter === 'string' ? parsed.postedAfter : null;
      result = {
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        postedAfter,
        locationKeywords: Array.isArray(parsed.locationKeywords) ? parsed.locationKeywords : [],
        seniority: typeof parsed.seniority === 'string' ? parsed.seniority : null,
        experienceMinYears: typeof parsed.experienceMinYears === 'number' ? parsed.experienceMinYears : null,
        experienceMaxYears: typeof parsed.experienceMaxYears === 'number' ? parsed.experienceMaxYears : null,
        compensationMin: null,
      };
    } catch {
      result = {
        keywords: parseKeywords(userText),
        postedAfter: null,
        locationKeywords: [],
        seniority: null,
        experienceMinYears: null,
        experienceMaxYears: null,
        compensationMin: null,
      };
    }
    const lower = userText.toLowerCase();
    if (/last\s*2\s*weeks|past\s*2\s*weeks|2\s*weeks\s*ago|posted\s*in\s*last\s*2\s*weeks/.test(lower)) {
      result.postedAfter = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }
    return result;
  }

  private async fetchAdzunaJobs(
    what: string,
    page: number,
  ): Promise<{ jobs: JobListing[]; total: number }> {
    const appId = process.env.ADZUNA_APP_ID!;
    const appKey = process.env.ADZUNA_APP_KEY!;
    const country = (process.env.ADZUNA_COUNTRY || 'gb').toLowerCase();
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: String(RESULTS_PER_PAGE),
      what: what || 'developer',
      'content-type': 'application/json',
    });
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Adzuna API error: ${res.status}`);
    // Adzuna job object attributes: id, title, description, redirect_url, created,
    // location { display_name, area[] }, company { display_name }, category { label, tag },
    // contract_type, contract_time, salary_min, salary_max, salary_is_predicted, latitude, longitude
    const data = (await res.json()) as {
      results?: Array<{
        id: string;
        title?: string;
        description?: string;
        redirect_url?: string;
        created?: string;
        location?: { display_name?: string };
        company?: { display_name?: string };
        salary_min?: number;
      }>;
      count?: number;
    };
    const results = data.results ?? [];
    const jobs: JobListing[] = results.map((r) => ({
      id: String(r.id),
      title: r.title ?? 'Job',
      company: r.company?.display_name ?? 'Company',
      location: r.location?.display_name ?? 'N/A',
      description: r.description ?? '',
      skills: [],
      applyLink: r.redirect_url ?? '#',
      postedAt: r.created?.slice(0, 10),
      salaryMin: r.salary_min ?? undefined,
    }));
    const total = data.count ?? (jobs.length < RESULTS_PER_PAGE ? (page - 1) * RESULTS_PER_PAGE + jobs.length : page * RESULTS_PER_PAGE + 1);
    return { jobs, total };
  }

  async getJobs(filters: JobFilters, page = 1): Promise<{ jobs: JobListing[]; total: number }> {
    const structured = buildStructuredFilterFromForm(filters);

    if (this.isAdzunaConfigured()) {
      const what = structured.keywords.length > 0 ? structured.keywords.join(' ') : 'developer';
      const { jobs: fetched, total: rawTotal } = await this.fetchAdzunaJobs(what, page);
      const filtered = applyStructuredFilter(fetched, structured);
      const total = filtered.length >= RESULTS_PER_PAGE ? Math.max(rawTotal, filtered.length + 1) : filtered.length;
      return { jobs: filtered, total };
    }

    let list = [...MOCK_JOBS];
    if (structured.keywords.length > 0) {
      list = list.filter((j) => {
        const title = j.title.toLowerCase();
        const company = j.company.toLowerCase();
        const location = j.location.toLowerCase();
        const description = j.description.toLowerCase();
        const skillStr = j.skills.map((s) => s.toLowerCase()).join(' ');
        return structured.keywords.some(
          (kw) =>
            title.includes(kw.toLowerCase()) ||
            company.includes(kw.toLowerCase()) ||
            location.includes(kw.toLowerCase()) ||
            description.includes(kw.toLowerCase()) ||
            skillStr.includes(kw.toLowerCase()),
        );
      });
    }
    list = applyStructuredFilter(list, structured);
    const start = (page - 1) * RESULTS_PER_PAGE;
    const jobs = list.slice(start, start + RESULTS_PER_PAGE);
    return { jobs, total: list.length };
  }

  async matchAndScoreJobs(
    resumeProfile: { skills: string[]; experience: string[]; summary: string },
    filters: JobFilters,
    page = 1,
  ): Promise<{ jobs: ScoredJob[]; total: number }> {
    const { jobs, total } = await this.getJobs(filters, page);
    if (jobs.length === 0) return { jobs: [], total };

    const system = `You are a job matching expert. Given a candidate profile and a list of jobs, score each job from 0-100 and give a short reason (1-2 sentences) why it fits or doesn't.
Respond with valid JSON only. Format:
{ "scores": [ { "id": "jobId", "score": number, "reason": "string" }, ... ] }
Score based on skills overlap, experience relevance, and role seniority fit.`;

    const jobsJson = JSON.stringify(
      jobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        skills: j.skills,
        description: j.description.slice(0, 300),
      })),
    );
    const user = `Candidate profile:\nSkills: ${resumeProfile.skills.join(', ')}\nExperience: ${resumeProfile.experience.join('; ')}\nSummary: ${resumeProfile.summary}\n\nJobs:\n${jobsJson}`;

    const raw = await this.groq.chat(system, user);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    let scores: { id: string; score: number; reason: string }[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      scores = Array.isArray(parsed.scores) ? parsed.scores : [];
    } catch {
      // fallback: assign 50 to all
      scores = jobs.map((j) => ({ id: j.id, score: 50, reason: 'Unable to score.' }));
    }

    const byId = new Map(scores.map((s) => [s.id, s]));
    const scored = jobs
      .map((j) => {
        const s = byId.get(j.id) ?? { score: 50, reason: 'No score.' };
        return { ...j, score: Math.min(100, Math.max(0, s.score)), reason: s.reason };
      })
      .sort((a, b) => b.score - a.score); // Highest match score first
    return { jobs: scored, total };
  }
}
