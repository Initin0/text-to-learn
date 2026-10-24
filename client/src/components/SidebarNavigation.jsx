import { Link, NavLink, useMatch } from 'react-router-dom';
import { useCourses, useCourse } from '../context/CoursesContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../hooks/useTheme.js';
import { lessonPath } from '../utils/paths.js';

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight text-ink">
      <img src="/favicon.svg" alt="" className="h-7 w-7" />
      Text-to-Learn
    </Link>
  );
}

function LessonStatus({ lesson }) {
  if (lesson.isCompleted)
    return (
      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-ok text-[10px] font-bold text-white" title="Completed">
        ✓
      </span>
    );
  return <span className={`block h-4 w-4 shrink-0 rounded-full border-2 ${lesson.isEnriched ? 'border-pen' : 'border-line'}`} title={lesson.isEnriched ? 'Written' : 'Not opened yet'} />;
}

function CourseTree({ courseId }) {
  const { course, loading } = useCourse(courseId);
  if (loading || !course) return <p className="px-3 py-2 text-sm text-muted">Loading syllabus…</p>;
  return (
    <div>
      <NavLink to={`/course/${course._id}`} end className={({ isActive }) => `block rounded-md px-3 py-2 font-display font-bold leading-snug ${isActive ? 'bg-pen-soft text-pen-strong' : 'text-ink hover:bg-pen-soft/60'}`}>
        {course.title}
      </NavLink>
      <p className="px-3 pb-3 text-xs text-muted">
        {course.progress.completed} of {course.progress.total} lessons done
      </p>
      <ol className="space-y-4">
        {course.modules.map((m, mi) => (
          <li key={m._id}>
            <p className="px-3 pb-1 text-xs font-semibold text-muted">
              Module {mi + 1}. {m.title}
            </p>
            <ul>
              {m.lessons.map((l, li) => (
                <li key={l._id}>
                  <NavLink
                    to={lessonPath(course._id, mi, li)}
                    className={({ isActive }) => `flex items-start gap-2 rounded-md px-3 py-1.5 text-sm leading-snug ${isActive ? 'bg-pen-soft font-semibold text-pen-strong' : 'text-ink hover:bg-pen-soft/60'}`}
                  >
                    <span className="mt-0.5">
                      <LessonStatus lesson={l} />
                    </span>
                    <span>{l.title}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function SidebarNavigation({ onNavigate }) {
  const { list } = useCourses();
  const { user, logout, mode } = useAuth();
  const { theme, toggle } = useTheme();
  const onCoursePage = useMatch('/course/:courseId');
  const onLessonPage = useMatch('/courses/:courseId/*');
  const courseId = (onCoursePage || onLessonPage)?.params.courseId;

  return (
    <nav aria-label="Main" className="flex h-full flex-col" onClick={(e) => e.target.closest('a') && onNavigate?.()}>
      <div className="px-5 pt-5 pb-4">
        <Wordmark />
      </div>

      <div className="px-3">
        <Link to="/" className="flex items-center justify-center gap-2 rounded-lg border border-pen/40 px-3 py-2 font-semibold text-pen hover:bg-pen-soft">
          <span aria-hidden="true" className="text-lg leading-none">
            +
          </span>
          New course
        </Link>
      </div>

      <div className="mt-5 flex-1 overflow-y-auto px-2 pb-4">
        {courseId ? (
          <>
            <Link to="/" className="mb-2 block px-3 text-sm text-muted hover:text-ink">
              ← All courses
            </Link>
            <CourseTree courseId={courseId} />
          </>
        ) : (
          <>
            <p className="px-3 pb-2 text-xs font-semibold text-muted">Your courses</p>
            {list.status === 'loading' && <p className="px-3 text-sm text-muted">Loading…</p>}
            {list.status === 'error' && <p className="px-3 text-sm text-bad">Could not load courses.</p>}
            {list.status === 'ready' && list.data.length === 0 && <p className="px-3 text-sm text-muted">Courses you generate appear here.</p>}
            <ul>
              {list.data.map((c) => (
                <li key={c._id}>
                  <NavLink to={`/course/${c._id}`} className="block rounded-md px-3 py-2 text-sm leading-snug text-ink hover:bg-pen-soft/60">
                    <span className="line-clamp-2">{c.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {c.progress.completed}/{c.progress.total} lessons
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-line px-4 py-3">
        {user?.picture ? (
          <img src={user.picture} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-pen-soft font-bold text-pen-strong">{(user?.name || '?')[0]}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          {mode === 'auth0' ? (
            <button onClick={logout} className="text-xs text-muted hover:text-ink">
              Log out
            </button>
          ) : (
            <p className="text-xs text-muted">Dev mode, no login</p>
          )}
        </div>
        <button onClick={toggle} className="rounded-md p-2 text-muted hover:bg-pen-soft hover:text-ink" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
