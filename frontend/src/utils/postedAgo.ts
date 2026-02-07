/**
 * Returns human-readable relative time from a date string (YYYY-MM-DD or ISO), e.g. "2 days ago".
 */
export function getPostedAgo(postedAt: string | undefined): string | null {
  if (!postedAt?.trim()) return null;
  const date = new Date(postedAt.trim());
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffDays < 0) return 'Today';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;
  const years = Math.floor(diffMonths / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}
