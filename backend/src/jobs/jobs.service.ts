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

/** Split filter string into multiple keywords (comma or space separated), trimmed and deduped. */
function parseKeywords(textFilter?: string): string[] {
  if (!textFilter?.trim()) return [];
  const keywords = textFilter
    .split(/[\s,]+/)
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
  return [...new Set(keywords)];
}

@Injectable()
export class JobsService {
  constructor(private readonly groq: GroqService) {}

  private isAdzunaConfigured(): boolean {
    return !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
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
    }));
    const total = data.count ?? (jobs.length < RESULTS_PER_PAGE ? (page - 1) * RESULTS_PER_PAGE + jobs.length : page * RESULTS_PER_PAGE + 1);
    return { jobs, total };
  }

  async getJobs(textFilter?: string, page = 1): Promise<{ jobs: JobListing[]; total: number }> {
    const keywords = parseKeywords(textFilter);
    if (this.isAdzunaConfigured()) {
      const what = keywords.length > 0 ? keywords.join(' ') : 'developer';
      return this.fetchAdzunaJobs(what, page);
    }
    let list = [...MOCK_JOBS];
    if (keywords.length > 0) {
      list = list.filter((j) => {
        const title = j.title.toLowerCase();
        const company = j.company.toLowerCase();
        const location = j.location.toLowerCase();
        const description = j.description.toLowerCase();
        const skillStr = j.skills.map((s) => s.toLowerCase()).join(' ');
        return keywords.some(
          (kw) =>
            title.includes(kw) ||
            company.includes(kw) ||
            location.includes(kw) ||
            description.includes(kw) ||
            skillStr.includes(kw),
        );
      });
    }
    const start = (page - 1) * RESULTS_PER_PAGE;
    const jobs = list.slice(start, start + RESULTS_PER_PAGE);
    return { jobs, total: list.length };
  }

  async matchAndScoreJobs(
    resumeProfile: { skills: string[]; experience: string[]; summary: string },
    textFilter?: string,
    page = 1,
  ): Promise<{ jobs: ScoredJob[]; total: number }> {
    const { jobs, total } = await this.getJobs(textFilter, page);
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
