import { Link, useParams } from 'react-router-dom';
import { useCourse } from '../context/CoursesContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { firstUnfinished, lessonPath } from '../utils/paths.js';

export default function CoursePage() {
  const { id } = useParams();
  const { course, loading, error, reload } = useCourse(id);

  if (loading) return <LoadingSpinner label="Opening course" className="p-10" />;
  if (error) return <ErrorMessage error={error} onRetry={reload} title="Could not open this course" className="m-8" />;
  if (!course) return null;

  const { completed, total } = course.progress;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const resume = firstUnfinished(course);
  const started = completed > 0;

  return (
    <article className="mx-auto w-full max-w-3xl px-5 pt-12 pb-20">
      <p className="text-sm text-muted">
        <span className="capitalize">{course.level}</span> course, made from “{course.topic}”
      </p>
      <h1 className="mt-2 font-display text-4xl leading-tight font-extrabold sm:text-5xl">{course.title}</h1>
      <p className="mt-4 max-w-[64ch] text-lg leading-relaxed text-muted">{course.description}</p>

      {course.tags?.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
          {course.tags.map((t) => (
            <li key={t} className="rounded-full bg-pen-soft px-3 py-0.5 text-sm text-pen-strong">
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Link to={lessonPath(course._id, resume.moduleIndex, resume.lessonIndex)} className="rounded-lg bg-pen px-5 py-2.5 font-semibold text-on-pen hover:bg-pen-strong">
          {completed === total ? 'Review course' : started ? 'Continue where you left off' : 'Start the first lesson'}
        </Link>
        <div className="min-w-48 flex-1">
          <p className="text-sm text-muted">
            {completed} of {total} lessons done
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
            <div className="h-full rounded-full bg-pen transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <h2 className="mt-14 mb-2 font-display text-2xl font-bold">Syllabus</h2>
      <ol className="space-y-10">
        {course.modules.map((m, mi) => (
          <li key={m._id} className="grid gap-x-6 sm:grid-cols-[4.5rem_1fr]">
            <p className="font-display text-5xl leading-none font-extrabold text-rule select-none sm:pt-1" aria-hidden="true">
              {String(mi + 1).padStart(2, '0')}
            </p>
            <div>
              <h3 className="font-display text-xl font-bold">
                <span className="sr-only">Module {mi + 1}: </span>
                {m.title}
              </h3>
              {m.summary && <p className="mt-1 text-muted">{m.summary}</p>}
              <ol className="mt-4 border-l-2 border-margin/70">
                {m.lessons.map((l, li) => (
                  <li key={l._id}>
                    <Link to={lessonPath(course._id, mi, li)} className="group -ml-0.5 flex gap-3 border-l-2 border-transparent py-2.5 pl-4 hover:border-pen">
                      <span className="w-8 shrink-0 pt-0.5 text-sm text-muted">
                        {mi + 1}.{li + 1}
                      </span>
                      <span className="flex-1">
                        <span className="font-semibold group-hover:text-pen">{l.title}</span>
                        {l.keyTopics?.length > 0 && <span className="mt-0.5 block text-sm text-muted">{l.keyTopics.join(', ')}</span>}
                      </span>
                      {l.isCompleted && <span className="pt-0.5 text-sm font-semibold text-ok">Done</span>}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
