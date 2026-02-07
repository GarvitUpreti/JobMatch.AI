import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';

const MODEL = 'llama-3.3-70b-versatile';

@Injectable()
export class GroqService {
  private client: Groq | null = null;

  private getClient(): Groq {
    if (!this.client) {
      const key = process.env.GROQ_API_KEY;
      if (!key) throw new Error('GROQ_API_KEY is not set in environment');
      this.client = new Groq({ apiKey: key });
    }
    return this.client;
  }

  async chat(system: string, user: string): Promise<string> {
    const completion = await this.getClient().chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });
    const content = completion.choices[0]?.message?.content;
    if (content == null) throw new Error('Empty Groq response');
    return content;
  }
}
