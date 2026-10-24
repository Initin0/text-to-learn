import { Lesson, Course } from '../models/index.js';
import { enrichLesson } from '../services/lessonEnrichment.service.js';
import { generateHinglishScript } from '../services/ai/generators.js';
import { synthesize } from '../services/tts.service.js';
import { lessonToPlainText, webSearchUrl } from '../utils/lessonText.js';
import { AppError } from '../utils/AppError.js';

async function loadOwned(id, sub) {
  const lesson = await Lesson.findById(id);
  if (!lesson) throw AppError.notFound('Lesson not found');
  const course = await Course.findOne({ _id: lesson.course, creator: sub }).populate({
    path: 'modules',
    select: 'title order lessons',
    populate: { path: 'lessons', select: 'title order isEnriched isCompleted' },
  });
  // 404 rather than 403 so ids of other users' lessons are not confirmed to exist.
  if (!course) throw AppError.notFound('Lesson not found');
  return { lesson, course };
}

// Where this lesson sits in the course, for breadcrumbs and prev/next buttons.
function locate(course, lessonId) {
  const modules = [...course.modules].sort((a, b) => a.order - b.order);
  const flat = modules.flatMap((m, mi) =>
    [...m.lessons].sort((a, b) => a.order - b.order).map((l, li) => ({ id: l._id, title: l.title, moduleIndex: mi, lessonIndex: li, moduleTitle: m.title }))
  );
  const i = flat.findIndex((x) => x.id.equals(lessonId));
  const here = flat[i];
  const ref = (x) => x && { _id: x.id, title: x.title, moduleIndex: x.moduleIndex, lessonIndex: x.lessonIndex };
  return {
    courseId: course._id,
    courseTitle: course.title,
    moduleTitle: here.moduleTitle,
    moduleIndex: here.moduleIndex,
    lessonIndex: here.lessonIndex,
    position: i + 1,
    total: flat.length,
    prev: ref(flat[i - 1]) || null,
    next: ref(flat[i + 1]) || null,
  };
}

function serializeLesson(lesson, course) {
  const l = lesson.toObject();
  return {
    _id: l._id,
    title: l.title,
    objectives: l.objectives,
    keyTopics: l.keyTopics,
    readings: (l.readings || []).map((r) => ({ ...r, searchUrl: webSearchUrl(r.title) })),
    content: l.content,
    isEnriched: l.isEnriched,
    isCompleted: l.isCompleted,
    hasHinglish: Boolean(l.hinglishScript),
    updatedAt: l.updatedAt,
    context: locate(course, lesson._id),
  };
}

// GET /api/lessons/:id
export async function getLesson(req, res) {
  const { lesson, course } = await loadOwned(req.params.id, req.user.sub);
  res.json(serializeLesson(lesson, course));
}

// POST /api/lessons/:id/generate  { force?: boolean }
export async function generateLesson(req, res) {
  const { course } = await loadOwned(req.params.id, req.user.sub);
  const lesson = await enrichLesson(req.params.id, { force: req.valid.body.force });
  res.json(serializeLesson(lesson, course));
}

// PATCH /api/lessons/:id/progress  { completed: boolean }
export async function setProgress(req, res) {
  const { lesson } = await loadOwned(req.params.id, req.user.sub);
  lesson.isCompleted = req.valid.body.completed;
  await lesson.save();
  res.json({ _id: lesson._id, isCompleted: lesson.isCompleted });
}

async function ensureHinglish(lesson) {
  if (!lesson.isEnriched) throw AppError.badRequest('Generate the lesson content first.');
  if (!lesson.hinglishScript) {
    lesson.hinglishScript = await generateHinglishScript({ lessonTitle: lesson.title, englishText: lessonToPlainText(lesson) });
    await lesson.save();
  }
  return lesson.hinglishScript;
}

// POST /api/lessons/:id/hinglish  -> { text }
export async function getHinglish(req, res) {
  const { lesson } = await loadOwned(req.params.id, req.user.sub);
  res.json({ text: await ensureHinglish(lesson) });
}

// GET /api/lessons/:id/audio  -> audio/wav
export async function getAudio(req, res) {
  const { lesson } = await loadOwned(req.params.id, req.user.sub);
  const text = await ensureHinglish(lesson);
  const wav = await synthesize(`${lesson._id}:${lesson.updatedAt?.getTime()}`, text);
  res.set({
    'Content-Type': 'audio/wav',
    'Content-Length': wav.length,
    'Content-Disposition': `inline; filename="lesson-${lesson._id}-hinglish.wav"`,
    'Cache-Control': 'private, max-age=3600',
  });
  res.send(wav);
}
