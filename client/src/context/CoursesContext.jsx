import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';

const CoursesContext = createContext(null);

// Holds the course list (sidebar + home) and a cache of full course trees,
// so moving between lessons does not refetch the syllabus every time.
export function CoursesProvider({ children }) {
  const api = useApi();
  const { isAuthenticated } = useAuth();
  const [list, setList] = useState({ status: 'idle', data: [], error: null });
  const [details, setDetails] = useState({});
  const inflight = useRef(new Map());

  const refreshList = useCallback(async () => {
    setList((s) => ({ ...s, status: s.data.length ? 'refreshing' : 'loading', error: null }));
    try {
      setList({ status: 'ready', data: await api.listCourses(), error: null });
    } catch (error) {
      setList((s) => ({ ...s, status: 'error', error }));
    }
  }, [api]);

  useEffect(() => {
    if (isAuthenticated) refreshList();
  }, [isAuthenticated, refreshList]);

  const loadCourse = useCallback(
    async (id, { force = false } = {}) => {
      if (!force && details[id]) return details[id];
      if (inflight.current.has(id)) return inflight.current.get(id);
      const p = api
        .getCourse(id)
        .then((course) => {
          setDetails((d) => ({ ...d, [id]: course }));
          return course;
        })
        .finally(() => inflight.current.delete(id));
      inflight.current.set(id, p);
      return p;
    },
    [api, details]
  );

  const addCourse = useCallback((course) => {
    setDetails((d) => ({ ...d, [course._id]: course }));
    setList((s) => ({
      ...s,
      data: [
        {
          _id: course._id,
          title: course.title,
          description: course.description,
          level: course.level,
          tags: course.tags,
          createdAt: course.createdAt,
          moduleCount: course.modules.length,
          firstLessonId: course.modules[0]?.lessons[0]?._id,
          progress: course.progress,
        },
        ...s.data,
      ],
    }));
  }, []);

  const removeCourse = useCallback(
    async (id) => {
      await api.deleteCourse(id);
      setList((s) => ({ ...s, data: s.data.filter((c) => c._id !== id) }));
      setDetails(({ [id]: _gone, ...rest }) => rest);
    },
    [api]
  );

  // Keep sidebar badges and progress counts in step with lesson-level changes.
  const patchLesson = useCallback((courseId, lessonId, patch) => {
    setDetails((d) => {
      const course = d[courseId];
      if (!course) return d;
      let completed = 0;
      const modules = course.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => {
          const next = l._id === lessonId ? { ...l, ...patch } : l;
          if (next.isCompleted) completed++;
          return next;
        }),
      }));
      const progress = { ...course.progress, completed };
      setList((s) => ({ ...s, data: s.data.map((c) => (c._id === courseId ? { ...c, progress } : c)) }));
      return { ...d, [courseId]: { ...course, modules, progress } };
    });
  }, []);

  const value = useMemo(
    () => ({ list, refreshList, details, loadCourse, addCourse, removeCourse, patchLesson }),
    [list, refreshList, details, loadCourse, addCourse, removeCourse, patchLesson]
  );
  return <CoursesContext.Provider value={value}>{children}</CoursesContext.Provider>;
}

export function useCourses() {
  const ctx = useContext(CoursesContext);
  if (!ctx) throw new Error('useCourses must be used inside <CoursesProvider>');
  return ctx;
}

// Fetch (or read from cache) one course tree.
export function useCourse(courseId) {
  const { details, loadCourse } = useCourses();
  const [state, setState] = useState({ loading: !details[courseId], error: null });

  useEffect(() => {
    if (!courseId) return;
    let alive = true;
    setState({ loading: !details[courseId], error: null });
    loadCourse(courseId)
      .then(() => alive && setState({ loading: false, error: null }))
      .catch((error) => alive && setState({ loading: false, error }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  return { course: details[courseId], ...state, reload: () => loadCourse(courseId, { force: true }) };
}
