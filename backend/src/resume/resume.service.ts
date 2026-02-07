import { Injectable } from '@nestjs/common';
import { GroqService } from '../ai/groq.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface ParsedResume {
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
  rawText: string;
}

@Injectable()
export class ResumeService {
  constructor(private readonly groq: GroqService) {}

  async extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text || '';
    }
    return buffer.toString('utf-8');
  }

  async parseResume(text: string): Promise<ParsedResume> {
    const system = `You are a resume parser. Extract structured data from the resume text.
Respond with valid JSON only, no markdown or extra text. Use this exact structure:
{
  "skills": ["skill1", "skill2"],
  "experience": ["role at company - brief"],
  "education": ["degree, institution"],
  "summary": "2-3 sentence professional summary"
}`;
    const user = `Parse this resume:\n\n${text.slice(0, 12000)}`;
    const raw = await this.groq.chat(system, user);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    let parsed: { skills?: string[]; experience?: string[]; education?: string[]; summary?: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { skills: [], experience: [], education: [], summary: '' };
    }
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      rawText: text.slice(0, 2000),
    };
  }
}
