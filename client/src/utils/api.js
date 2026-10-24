import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const http = axios.create({ baseURL: `${API_BASE_URL}/api`, timeout: 120000 });

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function readBlobError(data) {
  try {
    return JSON.parse(await data.text()).error;
  } catch {
    return null;
  }
}

async function toApiError(err) {
  if (err.code === 'ECONNABORTED') return new ApiError('The server took too long to respond. Try again.', 0);
  if (!err.response) return new ApiError('Cannot reach the server. Check your connection, or the API may be waking up (free tier) — retry in 30 seconds.', 0);
  const { status, data } = err.response;
  const msg = data instanceof Blob ? await readBlobError(data) : data?.error;
  if (status === 401) return new ApiError('Your session expired. Log in again.', 401);
  if (status === 429) return new ApiError(msg || 'Too many requests. Wait a minute and try again.', 429);
  return new ApiError(msg || `Request failed (${status})`, status);
}

// Every call takes a token getter so the Authorization header is always fresh.
export function createApi(getToken) {
  const call = async (config) => {
    const token = await getToken();
    try {
      const res = await http({ ...config, headers: { ...(token && { Authorization: `Bearer ${token}` }), ...config.headers } });
      return res.data;
    } catch (err) {
      throw await toApiError(err);
    }
  };

  return {
    generateCourse: (topic, level) => call({ method: 'post', url: '/courses/generate', data: { topic, level } }),
    listCourses: () => call({ url: '/courses' }),
    getCourse: (id) => call({ url: `/courses/${id}` }),
    deleteCourse: (id) => call({ method: 'delete', url: `/courses/${id}` }),
    getLesson: (id) => call({ url: `/lessons/${id}` }),
    generateLesson: (id, force = false) => call({ method: 'post', url: `/lessons/${id}/generate`, data: { force } }),
    setProgress: (id, completed) => call({ method: 'patch', url: `/lessons/${id}/progress`, data: { completed } }),
    getHinglish: (id) => call({ method: 'post', url: `/lessons/${id}/hinglish` }),
    getAudio: (id) => call({ url: `/lessons/${id}/audio`, responseType: 'blob', timeout: 180000 }),
    searchYouTube: (query) => call({ url: '/youtube', params: { query } }),
  };
}
