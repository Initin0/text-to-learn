import { getProvider } from './index.js';
import { parseJsonLoose } from './json.js';
import { SYSTEM_PROMPT, generateCoursePrompt, generateLessonPrompt, hinglishPrompt } from './prompts.js';
import { outlineSchema, outlineJsonSchema, lessonSchema, lessonJsonSchema, validateBlock } from './schemas.js';
import { AppError } from '../../utils/AppError.js';

const MAX_ATTEMPTS = 2;

const zodSummary = (err) =>
  err.issues
    .slice(0, 5)
    .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
    .join('; ');

// Ask, parse, validate. On a bad answer, retry once and tell the model what was wrong.
async function generateValidated({ task, vars, prompt, jsonSchema, validate }) {
  const provider = getProvider();
  let lastError;
  let feedback = '';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let raw;
    try {
      raw = await provider.generateText({ task, vars, system: SYSTEM_PROMPT, prompt: prompt + feedback, jsonSchema });
    } catch (err) {
      throw AppError.upstream('The AI service did not respond. Try again in a moment.', err.message);
    }
    try {
      return { data: validate(parseJsonLoose(raw)), model: provider.name };
    } catch (err) {
      lastError = err;
      feedback = `\n\nYour previous reply was rejected (${err.message.slice(0, 300)}). Return corrected raw JSON only.`;
    }
  }
  throw AppError.upstream('The AI returned content we could not use. Please try again.', lastError?.message);
}

// ---------- Course outline ----------

export function normalizeOutline(json) {
  const parsed = outlineSchema.safeParse(json);
  if (!parsed.success) throw new Error(zodSummary(parsed.error));
  const o = parsed.data;
  return {
    title: o.title,
    description: o.description,
    tags: [...new Set(o.tags.map((t) => t.toLowerCase()))].slice(0, 8),
    modules: o.modules.slice(0, 6).map((m) => ({
      title: m.title,
      summary: m.summary || '',
      lessons: m.lessons.slice(0, 5).map((l) => ({ title: l.title, keyTopics: (l.keyTopics || []).slice(0, 4) })),
    })),
  };
}

export function generateCourseOutline(topic, level) {
  return generateValidated({
    task: 'outline',
    vars: { topic, level },
    prompt: generateCoursePrompt(topic, level),
    jsonSchema: outlineJsonSchema,
    validate: normalizeOutline,
  });
}

// ---------- Lesson content ----------

const safeUrl = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

export function normalizeLesson(json, fallbackTitle = 'Lesson') {
  const parsed = lessonSchema.safeParse(json);
  if (!parsed.success) throw new Error(zodSummary(parsed.error));
  const l = parsed.data;

  const blocks = l.content.map(validateBlock).filter(Boolean);
  const teaching = [];
  const mcqs = [];
  let hasVideo = false;
  for (const b of blocks) {
    if (b.type === 'mcq') mcqs.push(b);
    else if (b.type === 'video') {
      if (!hasVideo) teaching.push(b);
      hasVideo = true;
    } else teaching.push(b);
  }
  if (teaching.filter((b) => b.type === 'paragraph').length < 1) throw new Error('lesson has no paragraph content');
  if (mcqs.length < 3) throw new Error(`lesson needs 4-5 mcq blocks, got ${mcqs.length}`);
  if (!hasVideo) teaching.push({ type: 'video', query: `${l.title || fallbackTitle} tutorial` });

  return {
    title: l.title,
    objectives: l.objectives.slice(0, 5),
    keyTopics: l.keyTopics.slice(0, 6),
    readings: l.readings.map((r) => ({ title: r.title, url: safeUrl(r.url), note: r.note })).slice(0, 5),
    content: [...teaching, ...mcqs.slice(0, 5)], // quiz always at the end
  };
}

export function generateLessonContent(ctx) {
  return generateValidated({
    task: 'lesson',
    vars: ctx,
    prompt: generateLessonPrompt(ctx),
    jsonSchema: lessonJsonSchema,
    validate: (json) => normalizeLesson(json, ctx.lessonTitle),
  });
}

// ---------- Hinglish narration ----------

export async function generateHinglishScript({ lessonTitle, englishText }) {
  const provider = getProvider();
  let text;
  try {
    text = await provider.generateText({
      task: 'hinglish',
      vars: { lessonTitle },
      system: 'You are a friendly Indian teacher who explains things in natural Hinglish.',
      prompt: hinglishPrompt(englishText),
      temperature: 0.6,
    });
  } catch (err) {
    throw AppError.upstream('Could not create the Hinglish explanation.', err.message);
  }
  const clean = String(text || '')
    .replace(/[*#`_>]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, 2200);
  if (!clean) throw AppError.upstream('Hinglish explanation came back empty.');
  return clean;
}
