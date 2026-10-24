import { Course, Module, Lesson } from '../models/index.js';
import { generateCourseOutline } from '../services/ai/generators.js';
import { enrichLesson } from '../services/lessonEnrichment.service.js';
import { AppError } from '../utils/AppError.js';

const LESSON_SUMMARY_FIELDS = 'title order keyTopics isEnriched isCompleted';

export function serializeCourse(course) {
  const c = course.toObject ? course.toObject() : course;
  let total = 0;
  let completed = 0;
  const modules = (c.modules || [])
    .sort((a, b) => a.order - b.order)
    .map((m) => {
      const lessons = (m.lessons || []).sort((a, b) => a.order - b.order);
      total += lessons.length;
      completed += lessons.filter((l) => l.isCompleted).length;
      return { _id: m._id, title: m.title, summary: m.summary, order: m.order, lessons };
    });
  return {
    _id: c._id,
    title: c.title,
    description: c.description,
    topic: c.topic,
    level: c.level,
    tags: c.tags,
    generatedBy: c.generatedBy,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    modules,
    progress: { completed, total },
  };
}

const populateTree = (query) =>
  query.populate({ path: 'modules', select: 'title summary order lessons', populate: { path: 'lessons', select: LESSON_SUMMARY_FIELDS } });

async function findOwnedCourse(id, sub) {
  const course = await populateTree(Course.findOne({ _id: id, creator: sub }));
  if (!course) throw AppError.notFound('Course not found');
  return course;
}

// POST /api/courses/generate  { topic, level }
export async function generateCourse(req, res) {
  const { topic, level } = req.valid.body;
  const { data: outline, model } = await generateCourseOutline(topic, level);

  const course = await Course.create({
    title: outline.title,
    description: outline.description,
    tags: outline.tags,
    topic,
    level,
    creator: req.user.sub,
    generatedBy: model,
  });

  const moduleDocs = await Module.insertMany(
    outline.modules.map((m, i) => ({ title: m.title, summary: m.summary, order: i, course: course._id }))
  );

  const lessonDocs = await Lesson.insertMany(
    outline.modules.flatMap((m, mi) =>
      m.lessons.map((l, li) => ({
        title: l.title,
        keyTopics: l.keyTopics,
        order: li,
        module: moduleDocs[mi]._id,
        course: course._id,
      }))
    )
  );

  // Link children to parents (two-way refs, as in the schema design).
  const byModule = new Map(moduleDocs.map((m) => [String(m._id), []]));
  for (const l of lessonDocs) byModule.get(String(l.module)).push(l._id);
  await Module.bulkWrite(
    moduleDocs.map((m) => ({ updateOne: { filter: { _id: m._id }, update: { $set: { lessons: byModule.get(String(m._id)) } } } }))
  );
  course.modules = moduleDocs.map((m) => m._id);
  await course.save();

  // Warm up the first lesson in the background so the first click feels instant.
  enrichLesson(lessonDocs[0]._id).catch((err) => console.warn('Background lesson warm-up failed:', err.message));

  const full = await findOwnedCourse(course._id, req.user.sub);
  res.status(201).json(serializeCourse(full));
}

// GET /api/courses
export async function listCourses(req, res) {
  const courses = await populateTree(Course.find({ creator: req.user.sub }).sort({ createdAt: -1 }).limit(100));
  res.json(
    courses.map((c) => {
      const s = serializeCourse(c);
      return {
        _id: s._id,
        title: s.title,
        description: s.description,
        level: s.level,
        tags: s.tags,
        createdAt: s.createdAt,
        moduleCount: s.modules.length,
        firstLessonId: s.modules[0]?.lessons[0]?._id,
        progress: s.progress,
      };
    })
  );
}

// GET /api/courses/:id
export async function getCourse(req, res) {
  const course = await findOwnedCourse(req.params.id, req.user.sub);
  res.json(serializeCourse(course));
}

// DELETE /api/courses/:id
export async function deleteCourse(req, res) {
  const course = await Course.findOne({ _id: req.params.id, creator: req.user.sub });
  if (!course) throw AppError.notFound('Course not found');
  await Promise.all([Lesson.deleteMany({ course: course._id }), Module.deleteMany({ course: course._id })]);
  await course.deleteOne();
  res.status(204).end();
}
