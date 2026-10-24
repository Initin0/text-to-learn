import axios from 'axios';
import { env } from '../config/env.js';
import { TTLCache } from '../utils/ttlCache.js';
import { youtubeSearchUrl } from '../utils/lessonText.js';

// search.list costs 100 quota units per call (daily default is 10,000), so cache aggressively.
// YouTube returns HTML-escaped titles; decode the common entities so clients can render plain text.
const decode = (s = '') =>
  s.replace(/&(amp|quot|#39|lt|gt);/g, (m) => ({ '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>' })[m]);

const cache = new TTLCache({ max: 1000, ttlMs: 24 * 60 * 60 * 1000 });

export async function searchVideos(query, max = 3) {
  const q = query.trim().toLowerCase();
  const key = `${q}|${max}`;
  const cached = cache.get(key);
  if (cached) return { ...cached, cached: true };

  const fallbackUrl = youtubeSearchUrl(query);
  if (!env.youtubeKey) return { videos: [], fallbackUrl, reason: 'no_api_key' };

  try {
    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      timeout: 8000,
      params: {
        key: env.youtubeKey,
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: max,
        videoEmbeddable: 'true',
        safeSearch: 'strict',
        relevanceLanguage: 'en',
      },
    });
    const videos = (data.items || [])
      .filter((i) => i.id?.videoId)
      .map((i) => ({
        id: i.id.videoId,
        title: decode(i.snippet.title),
        channel: decode(i.snippet.channelTitle),
        thumbnail: i.snippet.thumbnails?.medium?.url,
        embedUrl: `https://www.youtube-nocookie.com/embed/${i.id.videoId}`,
      }));
    const result = { videos, fallbackUrl };
    cache.set(key, result);
    return result;
  } catch (err) {
    // Quota exhausted or network issue: the UI still shows a search link.
    console.warn('YouTube search failed:', err.response?.status || err.message);
    return { videos: [], fallbackUrl, reason: 'upstream_error' };
  }
}

export const _youtubeCache = cache;
