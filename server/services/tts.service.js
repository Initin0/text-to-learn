import { getProvider } from './ai/index.js';
import { TTLCache } from '../utils/ttlCache.js';
import { AppError } from '../utils/AppError.js';

// Audio is a few MB per lesson, so keep only a handful in memory. The Hinglish script itself
// is stored on the lesson, so a cache miss costs one TTS call, never a second translation.
const audioCache = new TTLCache({ max: 30, ttlMs: 6 * 60 * 60 * 1000 });

export async function synthesize(cacheKey, text) {
  const hit = audioCache.get(cacheKey);
  if (hit) return hit;
  const provider = getProvider();
  if (!provider.supportsTTS) {
    throw new AppError(501, 'Server-side TTS is off (no GEMINI_API_KEY). The browser voice will be used instead.');
  }
  let wav;
  try {
    wav = await provider.textToSpeech(text);
  } catch (err) {
    throw AppError.upstream('Text-to-speech failed. Try again shortly.', err.message);
  }
  audioCache.set(cacheKey, wav);
  return wav;
}
