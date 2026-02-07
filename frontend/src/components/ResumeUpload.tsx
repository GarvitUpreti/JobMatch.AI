import { useState } from 'react';
import { uploadResume, parseResumeText, type ParsedResume } from '../api';

type Props = { onParsed: (p: ParsedResume) => void };

export function ResumeUpload({ onParsed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const parsed = await uploadResume(file);
      onParsed(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  async function handlePaste() {
    if (!pasteText.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const parsed = await parseResumeText(pasteText);
      onParsed(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="font-display text-lg font-semibold text-white mb-4">Upload your resume</h2>
      <div className="flex flex-wrap gap-4 items-end">
        <label className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition">
          <input
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={handleFile}
            disabled={loading}
          />
          {loading ? 'Processing…' : 'Choose PDF or TXT'}
        </label>
        <div className="flex-1 min-w-[200px] flex gap-2">
          <input
            type="text"
            placeholder="Or paste resume text and click Parse"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePaste()}
            disabled={loading}
          />
          <button
            type="button"
            onClick={handlePaste}
            disabled={loading || !pasteText.trim()}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:pointer-events-none"
          >
            Parse
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </section>
  );
}
