import { useEffect, useRef, useState } from 'react';

const LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const EXAMPLES = ['Intro to React Hooks', 'Basics of Copyright Law', 'Supervised learning with Python', 'How the stock market works'];

export default function PromptForm({ onSubmit, busy = false, initialTopic = '' }) {
  const [topic, setTopic] = useState(initialTopic || '');
  const [level, setLevel] = useState('beginner');
  const [touched, setTouched] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);

  // a topic typed before logging in is restored once, then forgotten
  useEffect(() => {
    if (!initialTopic) return;
    try {
      sessionStorage.removeItem('ttl-pending-topic');
    } catch {
      /* ignore */
    }
    ref.current?.focus();
  }, [initialTopic]);

  const trimmed = topic.trim();
  const invalid = trimmed.length < 3;

  useEffect(() => {
    if (!busy) return setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  const submit = (e) => {
    e?.preventDefault();
    setTouched(true);
    if (invalid || busy) return;
    onSubmit({ topic: trimmed, level });
  };

  return (
    <form onSubmit={submit} className="w-full" aria-busy={busy}>
      <label htmlFor="topic" className="sr-only">
        Topic you want to learn
      </label>
      <div className="ruled margin-line overflow-hidden rounded-xl border border-line shadow-[0_1px_0_var(--line),0_12px_32px_-20px_rgba(27,35,64,0.35)]">
        <textarea
          id="topic"
          ref={ref}
          rows={3}
          maxLength={300}
          value={topic}
          disabled={busy}
          onChange={(e) => setTopic(e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) submit(e);
          }}
          placeholder="e.g. Intro to React Hooks"
          aria-invalid={touched && invalid}
          aria-describedby="topic-help"
          className="block w-full resize-none bg-transparent pt-[0.55rem] pb-0 pl-[4.25rem] pr-5 font-display text-[1.6rem] font-medium text-ink placeholder:text-muted/60 focus:outline-none disabled:opacity-60 sm:text-[1.85rem]"
        />
      </div>

      <p id="topic-help" className={`mt-2 min-h-5 text-sm ${touched && invalid ? 'text-bad' : 'text-muted'}`}>
        {touched && invalid ? 'Write at least 3 characters.' : 'Press Enter to generate. Shift+Enter adds a new line.'}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-4">
        <fieldset className="flex items-center gap-1 rounded-lg border border-line bg-sheet p-1" disabled={busy}>
          <legend className="sr-only">Level</legend>
          {LEVELS.map((l) => (
            <label key={l.id} className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${level === l.id ? 'bg-pen text-on-pen' : 'text-muted hover:text-ink'}`}>
              <input type="radio" name="level" value={l.id} checked={level === l.id} onChange={() => setLevel(l.id)} className="sr-only" />
              {l.label}
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={busy}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-pen px-5 py-2.5 font-semibold text-on-pen shadow-sm hover:bg-pen-strong disabled:cursor-wait disabled:opacity-80"
        >
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />}
          {busy ? `Planning your course… ${elapsed}s` : 'Generate course'}
        </button>
      </div>

      {busy && (
        <p className="mt-4 text-sm text-muted" role="status">
          Writing module and lesson titles. This usually takes 10 to 30 seconds. Lesson content is written when you open each lesson.
        </p>
      )}

      {!busy && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setTopic(ex);
                ref.current?.focus();
              }}
              className="rounded-full border border-line bg-sheet px-3 py-1 text-ink hover:border-pen hover:text-pen"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
