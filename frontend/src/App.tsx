import { useState } from 'react';
import { ResumeUpload } from './components/ResumeUpload';
import { JobDashboard } from './components/JobDashboard';
import type { ParsedResume } from './api';

export default function App() {
  const [profile, setProfile] = useState<ParsedResume | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);

  function handleParsed(p: ParsedResume, name: string) {
    setProfile(p);
    setResumeName(name);
  }

  function handleClearResume() {
    setProfile(null);
    setResumeName(null);
  }

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur safe-area-padding">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="font-display text-base sm:text-xl font-semibold text-white truncate">
            JobMatch.AI
          </h1>
          {profile && resumeName && (
            <span className="text-xs sm:text-sm text-slate-400 shrink-0 truncate max-w-[200px] sm:max-w-none" title={resumeName}>
              {resumeName} · {profile.skills.length} skills
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-5 sm:py-8">
        <ResumeUpload
          onParsed={handleParsed}
          onClearResume={handleClearResume}
          resumeName={resumeName}
        />
        <JobDashboard profile={profile} />
      </main>
    </div>
  );
}
