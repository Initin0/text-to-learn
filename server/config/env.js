import 'dotenv/config';

const bool = (v, fallback = false) => {
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

const list = (v) =>
  String(v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const nodeEnv = process.env.NODE_ENV || 'development';

// MONGO_URI may contain a <password> (or YOURPASSWORD) placeholder that is filled from
// MONGO_PASSWORD, URL-encoded, so special characters in the password cannot break the link.
function buildMongoUri() {
  const uri = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/text-to-learn').trim();
  const pass = (process.env.MONGO_PASSWORD || '').trim();
  if (!pass) return uri;
  return uri.replace(/<password>|<db_password>|YOURPASSWORD/, encodeURIComponent(pass));
}

export const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5000,
  mongoUri: buildMongoUri(),
  corsOrigins: list(process.env.CORS_ORIGINS || 'http://localhost:5173'),

  auth0: {
    issuer: process.env.AUTH0_ISSUER || '',
    audience: process.env.AUTH0_AUDIENCE || '',
    // Local development only. Ignored when NODE_ENV=production.
    disabled: bool(process.env.AUTH_DISABLED) && nodeEnv !== 'production',
  },

  ai: {
    // "gemini" or "mock". Defaults to mock when no key is present so the app still runs.
    provider: process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : 'mock'),
    geminiKey: process.env.GEMINI_API_KEY || '',
    textModel: process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite',
    ttsModel: process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts',
    ttsVoice: process.env.GEMINI_TTS_VOICE || 'Kore',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 60000,
  },

  youtubeKey: process.env.YOUTUBE_API_KEY || '',
};
