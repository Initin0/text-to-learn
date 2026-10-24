import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useCourse, useCourses } from '../context/CoursesContext.jsx';
import LessonRenderer from '../components/LessonRenderer.jsx';
import LessonPDFExporter from '../components/LessonPDFExporter.jsx';
import HinglishAudio from '../components/HinglishAudio.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { lessonPath } from '../utils/paths.js';

function useLesson(lessonId) {
  const api = useApi();
  const [state, setState] = useState({ lesson: null, phase: 'loading', error: null });
  const reqId = useRef(0);

  const load = useCallback(
    async ({ force = false } = {}) => {
      const my = ++reqId.current;
      const alive = () => my === reqId.current;
      setState((s) => ({ lesson: force ? s.lesson : null, phase: force ? 'writing' : 'loading', error: null }));
      try {
        let lesson = force ? null : await api.getLesson(lessonId);
        if (!alive()) return;
        if (!lesson?.isEnriched) {
          if (lesson) setState({ lesson, phase: 'writing', error: null });
          lesson = await api.generateLesson(lessonId, force);
        }
        if (alive()) setState({ lesson, phase: 'ready', error: null });
      } catch (error) {
        if (alive()) setState((s) => ({ ...s, phase: 'error', error }));
      }
    },
    [api, lessonId]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load, setLesson: (fn) => setState((s) => ({ ...s, lesson: fn(s.lesson) })) };
}

function LessonView({ lessonId, courseId }) {
  const api = useApi();
  const { patchLesson } = useCourses();
  const { lesson, phase, error, reload, setLesson } = useLesson(lessonId);
  const [saving, setSaving] = useState(false);
  const top = useRef(null);

  useEffect(() => {
    top.current?.scrollIntoView?.({ block: 'start' });
    window.scrollTo?.(0, 0);
  }, [lessonId]);

  useEffect(() => {
    if (lesson?.isEnriched) patchLesson(courseId, lesson._id, { isEnriched: true });
  }, [lesson?.isEnriched, lesson?._id, courseId, patchLesson]);

  const toggleComplete = async () => {
    const completed = !lesson.isCompleted;
    setSaving(true);
    setLesson((l) => ({ ...l, isCompleted: completed }));
    patchLesson(courseId, lesson._id, { isCompleted: completed });
    try {
      await api.setProgress(lesson._id, completed);
    } catch {
      setLesson((l) => ({ ...l, isCompleted: !completed }));
      patchLesson(courseId, lesson._id, { isCompleted: !completed });
    } finally {
      setSaving(false);
    }
  };

  const ctx = lesson?.context;

  return (
    <article ref={top} className="mx-auto w-full max-w-3xl px-5 pt-10 pb-24">
      {ctx && (
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link to={`/course/${ctx.courseId}`} className="hover:text-ink">
            {ctx.courseTitle}
          </Link>
          <span aria-hidden="true"> / </span>
          <span>
            Module {ctx.moduleIndex + 1}: {ctx.moduleTitle}
          </span>
        </nav>
      )}

      {lesson && (
        <>
          <h1 className="mt-3 font-display text-4xl leading-tight font-extrabold">{lesson.title}</h1>
          {ctx && (
            <p className="mt-2 text-sm text-muted">
              Lesson {ctx.position} of {ctx.total}
            </p>
          )}
        </>
      )}

      {phase === 'loading' && <LoadingSpinner label="Opening lesson" className="mt-10" />}

      {phase === 'writing' && (
        <div className="mt-8 rounded-xl border border-line bg-sheet p-6">
          <LoadingSpinner label="Writing this lesson for you" hint="Explanations, an example, a video and a short quiz. About 10 to 30 seconds, only the first time you open it." />
          {lesson?.keyTopics?.length > 0 && <p className="mt-4 text-sm text-muted">Covering: {lesson.keyTopics.join(', ')}</p>}
        </div>
      )}

      {phase === 'error' && <ErrorMessage error={error} onRetry={() => reload()} title="Could not load this lesson" className="mt-8" />}

      {phase === 'ready' && lesson && (
        <>
          <div className="mt-6 flex flex-wrap items-start gap-3">
            <HinglishAudio lessonId={lesson._id} />
            <LessonPDFExporter lesson={lesson} />
            <button
              onClick={() => window.confirm('Rewrite this lesson? The current content will be replaced.') && reload({ force: true })}
              className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-pen-soft hover:text-ink"
            >
              Rewrite lesson
            </button>
          </div>

          {lesson.objectives?.length > 0 && (
            <section className="mt-8 rounded-xl bg-pen-soft px-6 py-5" aria-labelledby="objectives">
              <h2 id="objectives" className="font-display text-lg font-bold text-pen-strong">
                By the end of this lesson you can
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-pen">
                {lesson.objectives.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
              {lesson.keyTopics?.length > 0 && <p className="mt-3 text-sm text-muted">Key topics: {lesson.keyTopics.join(', ')}</p>}
            </section>
          )}

          <div className="mt-4">
            <LessonRenderer content={lesson.content} />
          </div>

          {lesson.readings?.length > 0 && (
            <section className="mt-12" aria-labelledby="readings">
              <h2 id="readings" className="font-display text-2xl font-bold">
                Suggested readings
              </h2>
              <ul className="mt-4 space-y-3">
                {lesson.readings.map((r, i) => (
                  <li key={i}>
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-pen hover:underline">
                        {r.title}
                      </a>
                    ) : (
                      <span className="font-semibold">{r.title}</span>
                    )}
                    {r.note && <span className="text-muted">. {r.note}</span>}{' '}
                    <a href={r.searchUrl} target="_blank" rel="noreferrer" className="text-sm text-muted underline decoration-dotted hover:text-ink">
                      search
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="mt-14 border-t border-line pt-6">
            <button
              onClick={toggleComplete}
              disabled={saving}
              className={`w-full rounded-lg px-5 py-3 font-semibold sm:w-auto ${lesson.isCompleted ? 'border border-ok bg-ok-soft text-ok' : 'bg-ink text-paper hover:opacity-90'}`}
              aria-pressed={lesson.isCompleted}
            >
              {lesson.isCompleted ? '✓ Marked as done' : 'Mark lesson as done'}
            </button>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {ctx?.prev ? (
                <Link to={lessonPath(ctx.courseId, ctx.prev.moduleIndex, ctx.prev.lessonIndex)} className="rounded-lg border border-line p-4 hover:border-pen">
                  <span className="text-sm text-muted">Previous</span>
                  <span className="mt-1 block font-semibold">{ctx.prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {ctx?.next ? (
                <Link to={lessonPath(ctx.courseId, ctx.next.moduleIndex, ctx.next.lessonIndex)} className="rounded-lg border border-line p-4 text-right hover:border-pen">
                  <span className="text-sm text-muted">Next</span>
                  <span className="mt-1 block font-semibold">{ctx.next.title}</span>
                </Link>
              ) : (
                ctx && (
                  <Link to={`/course/${ctx.courseId}`} className="rounded-lg border border-line p-4 text-right hover:border-pen">
                    <span className="text-sm text-muted">Finished the last lesson</span>
                    <span className="mt-1 block font-semibold">Back to the syllabus</span>
                  </Link>
                )
              )}
            </div>
          </footer>
        </>
      )}
    </article>
  );
}

// /courses/:courseId/module/:moduleIndex/lesson/:lessonIndex
export default function LessonPage() {
  const { courseId, moduleIndex, lessonIndex } = useParams();
  const { course, loading, error, reload } = useCourse(courseId);

  if (loading) return <LoadingSpinner label="Opening lesson" className="p-10" />;
  if (error) return <ErrorMessage error={error} onRetry={reload} title="Could not open this course" className="m-8" />;
  const lesson = course?.modules[Number(moduleIndex)]?.lessons[Number(lessonIndex)];
  if (!lesson) return <ErrorMessage error="This lesson does not exist in the course." title="Lesson not found" className="m-8" />;
  return <LessonView key={lesson._id} lessonId={lesson._id} courseId={courseId} />;
}

// /lesson/:id  (short link) -> canonical course/module/lesson URL
export function LessonByIdPage() {
  const { id } = useParams();
  const api = useApi();
  const [target, setTarget] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getLesson(id)
      .then((l) => setTarget(lessonPath(l.context.courseId, l.context.moduleIndex, l.context.lessonIndex)))
      .catch(setError);
  }, [api, id]);

  if (error) return <ErrorMessage error={error} title="Lesson not found" className="m-8" />;
  if (target) return <Navigate to={target} replace />;
  return <LoadingSpinner label="Opening lesson" className="p-10" />;
}
