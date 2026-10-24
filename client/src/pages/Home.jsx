import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PromptForm from '../components/PromptForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCourses } from '../context/CoursesContext.jsx';

const PENDING_KEY = 'ttl-pending-topic';

function Hero({ children }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 pt-14 pb-10 sm:pt-20">
      <h1 className="ink-in font-display text-[2.6rem] leading-[1.05] font-extrabold sm:text-6xl">Write a topic. Get a course.</h1>
      <p className="mt-5 max-w-[60ch] text-lg text-muted">
        Anything from React hooks to copyright law. You get 3 to 6 modules of short lessons, each with objectives, a video, readings and a quiz. Download any lesson as a PDF or hear it explained in Hinglish.
      </p>
      <div className="mt-10">{children}</div>
    </section>
  );
}

function CourseList() {
  const { list, refreshList, removeCourse } = useCourses();
  const [deleting, setDeleting] = useState(null);

  if (list.status === 'loading') return <LoadingSpinner label="Loading your courses" className="py-6" />;
  if (list.status === 'error') return <ErrorMessage error={list.error} onRetry={refreshList} title="Could not load your courses" />;
  if (!list.data.length) return <p className="text-muted">No courses yet. Your first one will show up here.</p>;

  const onDelete = async (c) => {
    if (!window.confirm(`Delete “${c.title}”? This removes all its lessons.`)) return;
    setDeleting(c._id);
    try {
      await removeCourse(c._id);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <ul className="divide-y divide-line border-y border-line">
      {list.data.map((c) => {
        const pct = c.progress.total ? Math.round((c.progress.completed / c.progress.total) * 100) : 0;
        return (
          <li key={c._id} className="group flex items-center gap-4 py-4">
            <Link to={`/course/${c._id}`} className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold leading-snug group-hover:text-pen">{c.title}</p>
              <p className="mt-1 text-sm text-muted">
                <span className="capitalize">{c.level}</span>, {c.moduleCount} modules, {c.progress.completed} of {c.progress.total} lessons done
              </p>
              <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-full bg-line" aria-hidden="true">
                <div className="h-full bg-pen" style={{ width: `${pct}%` }} />
              </div>
            </Link>
            <button
              onClick={() => onDelete(c)}
              disabled={deleting === c._id}
              className="rounded-md px-2 py-1 text-sm text-muted opacity-100 hover:bg-bad-soft hover:text-bad sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              aria-label={`Delete ${c.title}`}
            >
              {deleting === c._id ? 'Deleting…' : 'Delete'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function Home() {
  const api = useApi();
  const navigate = useNavigate();
  const { addCourse } = useCourses();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [pendingTopic] = useState(() => {
    try {
      return sessionStorage.getItem(PENDING_KEY);
    } catch {
      return null;
    }
  });

  const generate = async ({ topic, level }) => {
    setBusy(true);
    setError(null);
    try {
      const course = await api.generateCourse(topic, level);
      addCourse(course);
      navigate(`/course/${course._id}`);
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <>
      <Hero>
        <PromptForm onSubmit={generate} busy={busy} initialTopic={pendingTopic} />
        <ErrorMessage error={error} title="Could not generate the course" className="mt-6" />
      </Hero>
      <section className="mx-auto w-full max-w-3xl px-5 pb-20">
        <h2 className="mb-4 font-display text-2xl font-bold">Your courses</h2>
        <CourseList />
      </section>
    </>
  );
}

// Signed-out home: same prompt, but submitting signs you in first and keeps the topic.
export function Landing() {
  const { login } = useAuth();
  return (
    <Hero>
      <PromptForm
        onSubmit={({ topic }) => {
          try {
            sessionStorage.setItem(PENDING_KEY, topic);
          } catch {
            /* ignore */
          }
          login('/');
        }}
      />
      <p className="mt-8 text-sm text-muted">
        You will be asked to log in or sign up so your courses are saved.{' '}
        <button onClick={() => login('/', true)} className="font-semibold text-pen hover:underline">
          Create an account
        </button>{' '}
        or{' '}
        <button onClick={() => login('/')} className="font-semibold text-pen hover:underline">
          log in
        </button>
        .
      </p>
    </Hero>
  );
}

export { PENDING_KEY };
