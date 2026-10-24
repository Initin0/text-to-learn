// Flatten lesson blocks into plain text, used as the source for Hinglish narration.
export function lessonToPlainText(lesson, maxChars = 6000) {
  const parts = [lesson.title];
  if (lesson.objectives?.length) parts.push(`Objectives: ${lesson.objectives.join('; ')}`);
  for (const b of lesson.content || []) {
    if (b.type === 'heading' || b.type === 'paragraph') parts.push(b.text);
    if (b.type === 'list') parts.push((b.items || []).join('. '));
    if (b.type === 'callout') parts.push(b.text);
  }
  return parts.filter(Boolean).join('\n').slice(0, maxChars);
}

export const youtubeSearchUrl = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
export const webSearchUrl = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
