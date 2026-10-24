// Models sometimes wrap JSON in ```json fences or add a sentence around it.
// Pull out the outermost object and parse it.
export function parseJsonLoose(text) {
  if (typeof text !== 'string') throw new Error('Model returned no text');
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(s);
  } catch {
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('No JSON object found in model output');
    return JSON.parse(s.slice(start, end + 1));
  }
}
