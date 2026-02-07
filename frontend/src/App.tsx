import { useState } from 'react';
import { ResumeUpload } from './components/ResumeUpload';
import { JobDashboard } from './components/JobDashboard';
import type { ParsedResume } from './api';

export default function App() {
  const [profile, setProfile] = useState<ParsedResume | null>(null);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold text-white">
            AI Job Finder & Resume Matcher
          </h1>
          {profile && (
            <span className="text-sm text-slate-400">
              {profile.skills.length} skills · Ready to match
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <ResumeUpload onParsed={setProfile} />
        <JobDashboard profile={profile} />
      </main>
    </div>
  );
}
