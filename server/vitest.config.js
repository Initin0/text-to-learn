import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 120000,
    env: {
      NODE_ENV: 'test',
      AUTH_DISABLED: 'true',
      AI_PROVIDER: 'mock',
      GEMINI_API_KEY: '',
      YOUTUBE_API_KEY: '',
    },
  },
});
