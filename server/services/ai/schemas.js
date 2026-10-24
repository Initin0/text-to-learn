import { z } from 'zod';

// ---------- Zod validators (source of truth for what we persist) ----------

const str = (min = 1, max = 2000) => z.string().trim().min(min).max(max);

export const outlineSchema = z.object({
  title: str(3, 140),
  description: str(10, 1200),
  tags: z.array(str(1, 40)).max(10).default([]),
  modules: z
    .array(
      z.object({
        title: str(3, 140),
        summary: z.string().trim().max(500).optional(),
        lessons: z
          .array(
            z.object({
              title: str(3, 160),
              keyTopics: z.array(str(1, 80)).max(6).optional(),
            })
          )
          .min(3),
      })
    )
    .min(3),
});

const blockSchemas = {
  heading: z.object({ type: z.literal('heading'), text: str(1, 200), level: z.number().int().min(2).max(4).optional() }),
  paragraph: z.object({ type: z.literal('paragraph'), text: str(1, 5000) }),
  list: z.object({ type: z.literal('list'), items: z.array(str(1, 600)).min(1).max(15), ordered: z.boolean().optional() }),
  code: z.object({ type: z.literal('code'), language: z.string().trim().max(30).default('text'), text: str(1, 6000) }),
  callout: z.object({ type: z.literal('callout'), variant: z.enum(['tip', 'note', 'warning']).default('note'), text: str(1, 1500) }),
  video: z.object({ type: z.literal('video'), query: str(3, 150) }),
  mcq: z
    .object({
      type: z.literal('mcq'),
      question: str(3, 600),
      options: z.array(str(1, 300)).min(2).max(6),
      answer: z.coerce.number().int().min(0),
      explanation: z.string().trim().max(1200).default(''),
    })
    .refine((b) => b.answer < b.options.length, { message: 'answer index out of range' }),
};

export const BLOCK_TYPES = Object.keys(blockSchemas);

export const lessonSchema = z.object({
  title: str(3, 160),
  objectives: z.array(str(3, 300)).min(1).max(8),
  keyTopics: z.array(str(1, 80)).max(8).default([]),
  readings: z
    .array(z.object({ title: str(2, 200), url: z.string().trim().optional(), note: z.string().trim().max(300).optional() }))
    .max(6)
    .default([]),
  content: z.array(z.any()).min(1),
});

export function validateBlock(raw) {
  if (!raw || typeof raw !== 'object') return null;
  // tolerate the model calling the field "url" for video queries, as in the roadmap example
  if (raw.type === 'video' && !raw.query && raw.url) raw = { ...raw, query: raw.url };
  const schema = blockSchemas[raw.type];
  if (!schema) return null;
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

// ---------- JSON Schemas sent to the model (kept flat so Gemini accepts them) ----------

export const outlineJsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    modules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          lessons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                keyTopics: { type: 'array', items: { type: 'string' } },
              },
              required: ['title'],
            },
          },
        },
        required: ['title', 'lessons'],
      },
    },
  },
  required: ['title', 'description', 'modules'],
};

export const lessonJsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    objectives: { type: 'array', items: { type: 'string' } },
    keyTopics: { type: 'array', items: { type: 'string' } },
    readings: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, url: { type: 'string' }, note: { type: 'string' } },
        required: ['title'],
      },
    },
    content: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: BLOCK_TYPES },
          text: { type: 'string' },
          level: { type: 'integer' },
          items: { type: 'array', items: { type: 'string' } },
          ordered: { type: 'boolean' },
          language: { type: 'string' },
          variant: { type: 'string', enum: ['tip', 'note', 'warning'] },
          query: { type: 'string' },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answer: { type: 'integer' },
          explanation: { type: 'string' },
        },
        required: ['type'],
      },
    },
  },
  required: ['title', 'objectives', 'content'],
};
