import { env } from '../../config/env.js';
import { createGeminiProvider } from './geminiProvider.js';
import { createMockProvider } from './mockProvider.js';

let provider;

export function getProvider() {
  if (!provider) {
    provider = env.ai.provider === 'gemini' && env.ai.geminiKey ? createGeminiProvider({ apiKey: env.ai.geminiKey, ...env.ai }) : createMockProvider();
  }
  return provider;
}

// Tests swap in a fake provider.
export function setProvider(p) {
  provider = p;
}
