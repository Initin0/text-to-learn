export const lessonPath = (courseId, moduleIndex, lessonIndex) => `/courses/${courseId}/module/${moduleIndex}/lesson/${lessonIndex}`;

export function findLessonIndex(course, lessonId) {
  for (let mi = 0; mi < course.modules.length; mi++) {
    const li = course.modules[mi].lessons.findIndex((l) => l._id === lessonId);
    if (li !== -1) return { moduleIndex: mi, lessonIndex: li };
  }
  return null;
}

export function firstUnfinished(course) {
  for (let mi = 0; mi < course.modules.length; mi++) {
    const li = course.modules[mi].lessons.findIndex((l) => !l.isCompleted);
    if (li !== -1) return { moduleIndex: mi, lessonIndex: li };
  }
  return { moduleIndex: 0, lessonIndex: 0 };
}
