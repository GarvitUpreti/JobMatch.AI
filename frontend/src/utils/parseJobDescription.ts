/**
 * Parses Adzuna-style job descriptions that contain "Job Title - X", "Experience - X", "Location - X", etc.
 * Returns structured fields for display with bold labels and separate lines.
 */
export interface ParsedJobDetails {
  /** Extracted job title (e.g. "Sitecore Developer Experience") or null to use API title */
  jobTitle: string | null;
  /** Experience line (e.g. "5 years") */
  experience: string | null;
  /** Location line (e.g. "Chennai, Tamil Nadu") */
  location: string | null;
  /** Job requirements as array of points */
  requirements: string[];
  /** Key responsibilities as array of points */
  responsibilities: string[];
  /** Any remaining description text not parsed into sections */
  remaining: string;
}

/** Generic API titles we should replace with parsed/description title when possible */
const GENERIC_TITLES = /^(developer|engineer|software engineer|job|position)$/i;

export function parseJobDescription(
  description: string,
  apiTitle?: string
): ParsedJobDetails {
  const result: ParsedJobDetails = {
    jobTitle: null,
    experience: null,
    location: null,
    requirements: [],
    responsibilities: [],
    remaining: '',
  };
  if (!description?.trim()) return result;

  const text = description.trim();

  // 1) Explicit "Job Title - Actual Role - X years" or "Job Title - Actual Role"
  const jobTitleMatch = text.match(/Job Title\s*[-–]\s*([^L]+?)(?=\s+Location\s*[-–]|\s*$)/i);
  if (jobTitleMatch) {
    const raw = jobTitleMatch[1].trim();
    const expAtEnd = raw.match(/^(.+?)\s*[-–]\s*(\d+\+?\s*years?)\s*$/i);
    if (expAtEnd) {
      result.jobTitle = expAtEnd[1].trim();
      result.experience = expAtEnd[2].trim();
    } else {
      result.jobTitle = raw;
    }
  }

  // 2) If still no title and API gave a generic one, use first meaningful part of description as role
  if (!result.jobTitle && apiTitle && GENERIC_TITLES.test(apiTitle.trim())) {
    const beforeLocation = text.match(/^(.+?)(?=\s+Location\s*[-–]|\s+Job Requirements|\s+Experience\s*[-–]|$)/is);
    if (beforeLocation) {
      const first = beforeLocation[1].trim();
      const withoutJobTitlePrefix = first.replace(/^Job Title\s*[-–]\s*/i, '').trim();
      const candidate = withoutJobTitlePrefix.split(/\s*[-–]\s*/)[0]?.trim();
      if (candidate && candidate.length > 3 && candidate.length < 120) {
        result.jobTitle = candidate;
        const yearsInFirst = first.match(/(\d+\+?\s*years?)\s*$/i);
        if (yearsInFirst && !result.experience) result.experience = yearsInFirst[1].trim();
      }
    }
  }

  // Extract Location - "Location - Chennai" or "Location - Mumbai, Maharashtra"
  const locationMatch = text.match(/Location\s*[-–]\s*([^J]+?)(?=\s*Job Requirements|\s*Key Responsibilities|$)/i);
  if (locationMatch) {
    result.location = locationMatch[1].trim();
  }

  // Extract Job Requirements (often comma-separated: "Sitecore, Sitecore XM Cloud MVC.Net ...")
  const reqMatch = text.match(/Job Requirements\s*([\s\S]+?)(?=Key Responsibilities|$)/i);
  if (reqMatch) {
    const block = reqMatch[1].trim();
    result.requirements = block
      .split(/[,;]|\s+\.\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // Extract Key Responsibilities (sentence fragments often start with capital: "Component design... Template design...")
  const respMatch = text.match(/Key Responsibilities\s*([\s\S]+?)$/i);
  if (respMatch) {
    const block = respMatch[1].trim();
    result.responsibilities = block
      .split(/\s+(?=[A-Z][a-z][a-z])|\.\s+/)
      .map((s) => s.trim().replace(/^\.\s*/, ''))
      .filter((s) => s.length > 4);
  }

  // If we didn't find Experience in the title block, try "Experience - X years"
  if (!result.experience) {
    const expMatch = text.match(/Experience\s*[-–]\s*(\d+\+?\s*years?|[^\n]+?)(?=\s+Location|\s*Job Requirements|$)/i);
    if (expMatch) result.experience = expMatch[1].trim();
  }

  return result;
}
