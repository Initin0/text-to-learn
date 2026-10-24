import { searchVideos } from '../services/youtube.service.js';

// GET /api/youtube?query=...&max=3
export async function search(req, res) {
  const { query, max } = req.valid.query;
  res.set('Cache-Control', 'private, max-age=3600');
  res.json(await searchVideos(query, max));
}
