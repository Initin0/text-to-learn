// Prompt builders. Kept short on purpose: every extra sentence is billed on every call.

export const SYSTEM_PROMPT =
  'You are an expert curriculum designer and teacher. You write accurate, practical, well-structured learning material. ' +
  'You always reply with raw JSON only: no markdown fences, no commentary.';

export function generateCoursePrompt(topic, level = 'beginner') {
  return `Design an online course for this request: "${topic}".
Learner level: ${level}.

Rules:
- 3 to 6 modules. Each module has 3 to 5 lessons.
- Order content from foundations to advanced, with no gaps and no repeated lessons.
- Lesson titles are specific and teachable in 10 to 15 minutes.
- Each lesson gets 2 to 4 short keyTopics.
- description is 2 to 3 sentences on what the learner will be able to do.
- tags: 3 to 6 lowercase keywords.

Return JSON:
{"title": string, "description": string, "tags": string[],
 "modules": [{"title": string, "summary": string,
   "lessons": [{"title": string, "keyTopics": string[]}]}]}`;
}

export function generateLessonPrompt({ courseTitle, moduleTitle, lessonTitle, level = 'beginner', siblings = [] }) {
  const context = siblings.length ? `\nOther lessons in this module (do not repeat them): ${siblings.join(' | ')}` : '';
  return `Write the full lesson "${lessonTitle}".
Course: "${courseTitle}". Module: "${moduleTitle}". Learner level: ${level}.${context}

Rules:
- objectives: 2 to 4 measurable outcomes starting with a verb (Understand, Identify, Build...).
- keyTopics: 3 to 5 short phrases.
- content is an ordered array of blocks. Allowed blocks:
  {"type":"heading","text":string}
  {"type":"paragraph","text":string}
  {"type":"list","items":string[],"ordered":boolean}
  {"type":"code","language":string,"text":string}   (only if code genuinely helps this topic)
  {"type":"callout","variant":"tip"|"note"|"warning","text":string}
  {"type":"video","query":string}   (a YouTube search query, never a URL; exactly one)
  {"type":"mcq","question":string,"options":string[],"answer":number,"explanation":string}
- Teach with 3 to 5 headings, clear paragraphs, at least one concrete example, and one video block.
- End with 4 to 5 mcq blocks. answer is the 0-based index of the correct option. Explain why it is correct.
- readings: 2 to 4 well-known references (official docs, Wikipedia, reputable tutorials) with real https URLs.
- Plain text inside strings. Use \\n for line breaks inside code.

Return JSON: {"title": string, "objectives": string[], "keyTopics": string[],
 "readings": [{"title": string, "url": string, "note": string}], "content": [blocks]}`;
}

export function hinglishPrompt(englishText) {
  return `Convert this lesson into a spoken Hinglish explanation for an Indian student who is more comfortable in Hindi than English.

Rules:
- Hinglish means natural Hindi sentence structure written in Roman script, keeping technical terms in English.
- Sound like a friendly teacher talking, not a translation. Short sentences.
- 150 to 250 words. Cover the key ideas only. No code, no symbols, no markdown, no lists.

Lesson:
${englishText}`;
}
