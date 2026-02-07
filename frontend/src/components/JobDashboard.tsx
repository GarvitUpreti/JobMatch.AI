import { useState, useEffect } from 'react';
import { matchJobs, getJobs, type ParsedResume, type ScoredJob } from '../api';
import { parseJobDescription } from '../utils/parseJobDescription';
import { getPostedAgo } from '../utils/postedAgo';

type Props = { profile: ParsedResume | null };

export function JobDashboard({ profile }: Props) {
  const [filter, setFilter] = useState('');
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMatch, setUseMatch] = useState(true);

  async function load(reset = true) {
    if (reset) setPage(1);
    setError(null);
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      if (useMatch && profile) {
        const { jobs: scored, total: t } = await matchJobs(
          {
            skills: profile.skills,
            experience: profile.experience,
            summary: profile.summary,
          },
          filter.trim() || undefined,
          currentPage
        );
        setJobs(reset ? scored : (prev) => prev.concat(scored));
        setTotal(t);
        if (!reset) setPage((p) => p + 1);
      } else {
        const { jobs: list, total: t } = await getJobs(filter.trim() || undefined, currentPage);
        const withScore = list.map((j) => ({ ...j, score: 0, reason: '' }));
        setJobs(reset ? withScore : (prev) => prev.concat(withScore));
        setTotal(t);
        if (!reset) setPage((p) => p + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      if (reset) setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      if (useMatch && profile) {
        const { jobs: scored, total: t } = await matchJobs(
          {
            skills: profile.skills,
            experience: profile.experience,
            summary: profile.summary,
          },
          filter.trim() || undefined,
          nextPage
        );
        setJobs((prev) => prev.concat(scored));
        setTotal(t);
        setPage(nextPage);
      } else {
        const { jobs: list, total: t } = await getJobs(filter.trim() || undefined, nextPage);
        const withScore = list.map((j) => ({ ...j, score: 0, reason: '' }));
        setJobs((prev) => prev.concat(withScore));
        setTotal(t);
        setPage(nextPage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load(true);
  }, [profile?.summary, useMatch]);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    load(true);
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h2 className="font-display text-lg font-semibold text-white">Jobs</h2>
        {profile && (
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={useMatch}
              onChange={(e) => setUseMatch(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            AI match & score
          </label>
        )}
        <form onSubmit={handleFilterSubmit} className="flex-1 flex gap-2 min-w-[200px]">
          <input
            type="text"
            placeholder="Filter jobs by text (title, company, skills, location…)"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? '…' : 'Search'}
          </button>
        </form>
      </div>

      {!profile && (
        <p className="text-slate-500 text-sm mb-4">
          Upload or paste your resume above to get AI-matched jobs and compatibility scores.
        </p>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <ul className="space-y-5">
        {jobs.map((job) => {
          const parsed = parseJobDescription(job.description, job.title);
          const displayTitle = parsed.jobTitle || job.title;
          const hasStructured = parsed.experience || parsed.location || parsed.requirements.length > 0 || parsed.responsibilities.length > 0;
          const displayLocation = parsed.location || job.location;

          return (
            <li
              key={job.id}
              className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-5 shadow-lg shadow-slate-900/50 hover:border-slate-600 hover:bg-slate-800 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-white tracking-tight">
                    {displayTitle}
                  </h3>
                  <p className="mt-2 text-sm">
                    <span className="font-bold text-slate-300">Company:</span>
                    <br />
                    <span className="text-slate-200">{job.company}</span>
                  </p>
                </div>
                {job.score > 0 && (
                  <span className="shrink-0 rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-400">
                    {job.score}% match
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-3 border-t border-slate-700/80 pt-4">
                {getPostedAgo(job.postedAt) && (
                  <p className="text-sm block">
                    <span className="font-bold text-slate-300">Posted:</span>
                    <br />
                    <span className="text-slate-200">{getPostedAgo(job.postedAt)}</span>
                  </p>
                )}
                {(parsed.experience || job.experienceRequired) && (
                  <p className="text-sm block">
                    <span className="font-bold text-slate-300">Experience:</span>
                    <br />
                    <span className="text-white">{parsed.experience || job.experienceRequired}</span>
                  </p>
                )}
                {(parsed.location || job.location) && (
                  <p className="text-sm block">
                    <span className="font-bold text-slate-300">Location:</span>
                    <br />
                    <span className="text-white">{parsed.location || job.location}</span>
                  </p>
                )}
                {parsed.requirements.length > 0 && (
                  <div className="text-sm block">
                    <span className="font-bold text-slate-300">Job Requirements:</span>
                    <ul className="list-disc list-inside text-slate-200 space-y-1 mt-1 ml-1">
                      {parsed.requirements.slice(0, 8).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {parsed.responsibilities.length > 0 && (
                  <div className="text-sm block">
                    <span className="font-bold text-slate-300">Key Responsibilities:</span>
                    <ul className="list-disc list-inside text-slate-200 space-y-1 mt-1 ml-1">
                      {parsed.responsibilities.slice(0, 6).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!hasStructured && job.description && (
                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                    {job.description}
                  </p>
                )}
              </div>

              {job.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.skills.slice(0, 5).map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-slate-700/90 px-2.5 py-1 text-xs font-medium text-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {job.reason && (
                <p className="mt-3 text-slate-500 text-xs leading-snug italic border-l-2 border-slate-600 pl-3">
                  {job.reason}
                </p>
              )}
              <a
                href={job.applyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition"
              >
                Apply →
              </a>
            </li>
          );
        })}
      </ul>

      {!loading && jobs.length < total && total > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:border-slate-500 transition disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : `Show more (${total - jobs.length} remaining)`}
          </button>
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <p className="text-slate-500 text-sm">No jobs found. Try changing the filter.</p>
      )}
    </section>
  );
}
