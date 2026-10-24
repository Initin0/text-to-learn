import { describe, it, expect } from 'vitest';
import { parseJsonLoose } from '../services/ai/json.js';
import { normalizeOutline, normalizeLesson } from '../services/ai/generators.js';
import { validateBlock } from '../services/ai/schemas.js';
import { createMockProvider } from '../services/ai/mockProvider.js';
import { generateCoursePrompt, generateLessonPrompt } from '../services/ai/prompts.js';
import { pcmToWav, ensureWav, isWav } from '../utils/wav.js';
import { TTLCache } from '../utils/ttlCache.js';

const mod = (n, lessons = 4) => ({ title: `Module ${n}`, lessons: Array.from({ length: lessons }, (_, i) => ({ title: `Lesson ${n}.${i}` })) });
const mcq = (i) => ({ type: 'mcq', question: `Q${i}?`, options: ['a', 'b', 'c'], answer: 1, explanation: 'because' });

describe('parseJsonLoose', () => {
  it('parses plain JSON', () => expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 }));
  it('strips markdown fences', () => expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 }));
  it('extracts JSON surrounded by prose', () => expect(parseJsonLoose('Sure! {"a":{"b":2}} hope this helps')).toEqual({ a: { b: 2 } }));
  it('throws when there is no object', () => expect(() => parseJsonLoose('nope')).toThrow());
});

describe('normalizeOutline', () => {
  it('accepts a valid outline and trims to 6 modules x 5 lessons', () => {
    const out = normalizeOutline({ title: 'React Hooks', description: 'Learn hooks from scratch.', tags: ['React', 'react', 'hooks'], modules: Array.from({ length: 8 }, (_, i) => mod(i, 7)) });
    expect(out.modules).toHaveLength(6);
    out.modules.forEach((m) => expect(m.lessons).toHaveLength(5));
    expect(out.tags).toEqual(['react', 'hooks']);
  });
  it('rejects fewer than 3 modules', () => {
    expect(() => normalizeOutline({ title: 'X course', description: 'A description here', modules: [mod(1), mod(2)] })).toThrow(/modules/);
  });
  it('rejects modules with fewer than 3 lessons', () => {
    expect(() => normalizeOutline({ title: 'X course', description: 'A description here', modules: [mod(1), mod(2), mod(3, 2)] })).toThrow();
  });
});

describe('validateBlock', () => {
  it('keeps valid blocks and drops unknown ones', () => {
    expect(validateBlock({ type: 'paragraph', text: 'hi' })).toEqual({ type: 'paragraph', text: 'hi' });
    expect(validateBlock({ type: 'iframe', src: 'x' })).toBeNull();
    expect(validateBlock(null)).toBeNull();
  });
  it('rejects mcq with out-of-range answer', () => {
    expect(validateBlock({ type: 'mcq', question: 'Why is it?', options: ['a', 'b'], answer: 5 })).toBeNull();
  });
  it('coerces string answer index', () => {
    expect(validateBlock({ type: 'mcq', question: 'Why is it?', options: ['a', 'b'], answer: '1' }).answer).toBe(1);
  });
  it('accepts the roadmap video shape that uses "url" for the query', () => {
    expect(validateBlock({ type: 'video', url: 'AI Explained' })).toMatchObject({ type: 'video', query: 'AI Explained' });
  });
});

describe('normalizeLesson', () => {
  const base = {
    title: 'Hooks',
    objectives: ['Understand useState'],
    readings: [{ title: 'React docs', url: 'https://react.dev' }, { title: 'Bad', url: 'javascript:alert(1)' }],
  };
  it('moves quizzes to the end, keeps one video and sanitises reading URLs', () => {
    const out = normalizeLesson({
      ...base,
      content: [mcq(1), { type: 'paragraph', text: 'p' }, { type: 'video', query: 'a b c' }, mcq(2), { type: 'video', query: 'd e f' }, mcq(3), mcq(4), { type: 'bogus' }],
    });
    const types = out.content.map((b) => b.type);
    expect(types).toEqual(['paragraph', 'video', 'mcq', 'mcq', 'mcq', 'mcq']);
    expect(out.readings[0].url).toBe('https://react.dev/');
    expect(out.readings[1].url).toBeUndefined();
  });
  it('adds a video block when the model forgot one', () => {
    const out = normalizeLesson({ ...base, content: [{ type: 'paragraph', text: 'p' }, mcq(1), mcq(2), mcq(3)] });
    expect(out.content.find((b) => b.type === 'video')).toBeTruthy();
  });
  it('rejects a lesson with too few quiz questions', () => {
    expect(() => normalizeLesson({ ...base, content: [{ type: 'paragraph', text: 'p' }, mcq(1)] })).toThrow(/mcq/);
  });
  it('caps quizzes at 5', () => {
    const out = normalizeLesson({ ...base, content: [{ type: 'paragraph', text: 'p' }, ...[1, 2, 3, 4, 5, 6, 7].map(mcq)] });
    expect(out.content.filter((b) => b.type === 'mcq')).toHaveLength(5);
  });
});

describe('mock provider (template engine)', () => {
  const p = createMockProvider();
  it('produces an outline that passes validation', async () => {
    const out = normalizeOutline(JSON.parse(await p.generateText({ task: 'outline', vars: { topic: 'intro to react hooks', level: 'beginner' } })));
    expect(out.modules.length).toBeGreaterThanOrEqual(3);
    out.modules.forEach((m) => expect(m.lessons.length).toBeGreaterThanOrEqual(3));
  });
  it('produces a lesson that passes validation', async () => {
    const raw = await p.generateText({ task: 'lesson', vars: { courseTitle: 'React', moduleTitle: 'Basics', lessonTitle: 'What is JSX' } });
    const out = normalizeLesson(JSON.parse(raw));
    expect(out.content.filter((b) => b.type === 'mcq').length).toBeGreaterThanOrEqual(4);
  });
});

describe('prompts', () => {
  it('course prompt carries the topic and the module/lesson limits', () => {
    const s = generateCoursePrompt('Basics of Copyright Law', 'beginner');
    expect(s).toContain('Basics of Copyright Law');
    expect(s).toMatch(/3 to 6 modules/);
    expect(s).toMatch(/3 to 5 lessons/);
  });
  it('lesson prompt asks for video queries, not links, and 4-5 MCQs', () => {
    const s = generateLessonPrompt({ courseTitle: 'ML', moduleTitle: 'Basics', lessonTitle: 'Supervised learning' });
    expect(s).toMatch(/never a URL/);
    expect(s).toMatch(/4 to 5 mcq/);
  });
});

describe('wav + cache utils', () => {
  it('wraps PCM in a valid header', () => {
    const wav = pcmToWav(Buffer.alloc(480));
    expect(isWav(wav)).toBe(true);
    expect(wav.length).toBe(524);
    expect(wav.readUInt32LE(24)).toBe(24000);
  });
  it('leaves WAV input untouched and reads the sample rate from mime', () => {
    const wav = pcmToWav(Buffer.alloc(10));
    expect(ensureWav(wav)).toBe(wav);
    expect(ensureWav(Buffer.alloc(10), 'audio/L16;rate=16000').readUInt32LE(24)).toBe(16000);
  });
  it('TTLCache evicts least recently used', () => {
    const c = new TTLCache({ max: 2 });
    c.set('a', 1);
    c.set('b', 2);
    c.get('a');
    c.set('c', 3);
    expect(c.get('b')).toBeUndefined();
    expect(c.get('a')).toBe(1);
  });
});
