import { Lesson, Module, Course } from '../models/index.js';
import { generateLessonContent } from './ai/generators.js';
import { AppError } from '../utils/AppError.js';

// One generation per lesson at a time. If the background warm-up and a user click race,
// both await the same promise instead of paying for two model calls.
const inFlight = new Map();

export function enrichLesson(lessonId, { force = false } = {}) {
  const key = String(lessonId);
  if (inFlight.has(key)) return inFlight.get(key);
  const job = run(lessonId, force).finally(() => inFlight.delete(key));
  inFlight.set(key, job);
  return job;
}

async function run(lessonId, force) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw AppError.notFound('Lesson not found');
  if (lesson.isEnriched && !force) return lesson;

  const [module, course] = await Promise.all([
    Module.findById(lesson.module).populate({ path: 'lessons', select: 'title' }),
    Course.findById(lesson.course).select('title level'),
  ]);

  const { data } = await generateLessonContent({
    courseTitle: course.title,
    moduleTitle: module.title,
    lessonTitle: lesson.title,
    level: course.level,
    siblings: module.lessons.filter((l) => !l._id.equals(lesson._id)).map((l) => l.title),
  });

  lesson.objectives = data.objectives;
  lesson.keyTopics = data.keyTopics.length ? data.keyTopics : lesson.keyTopics;
  lesson.readings = data.readings;
  lesson.content = data.content;
  lesson.isEnriched = true;
  lesson.hinglishScript = undefined; // content changed, old narration is stale
  await lesson.save();
  return lesson;
}
