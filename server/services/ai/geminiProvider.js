import { GoogleGenAI } from '@google/genai';
import { ensureWav } from '../../utils/wav.js';

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);

// Errors where retrying through the legacy endpoint will not help.
const isFatal = (err) => [401, 403, 429].includes(err?.status) || /api key|quota|permission/i.test(err?.message || '');

export function createGeminiProvider({ apiKey, textModel, ttsModel, ttsVoice, timeoutMs }) {
  const client = new GoogleGenAI({ apiKey });

  async function generateText({ system, prompt, jsonSchema, temperature = 0.7 }) {
    try {
      // Interactions API (current Gemini API surface).
      const res = await withTimeout(
        client.interactions.create({
          model: textModel,
          system_instruction: system,
          input: prompt,
          generation_config: { temperature },
          ...(jsonSchema && {
            response_format: { type: 'text', mime_type: 'application/json', schema: jsonSchema },
          }),
        }),
        timeoutMs,
        'Gemini'
      );
      return res.output_text;
    } catch (err) {
      if (isFatal(err)) throw err;
      // Fallback: legacy generateContent, still served for most models.
      const res = await withTimeout(
        client.models.generateContent({
          model: textModel,
          contents: prompt,
          config: {
            systemInstruction: system,
            temperature,
            ...(jsonSchema && { responseMimeType: 'application/json', responseJsonSchema: jsonSchema }),
          },
        }),
        timeoutMs,
        'Gemini'
      );
      return res.text;
    }
  }

  async function textToSpeech(text) {
    try {
      const res = await withTimeout(
        client.interactions.create({
          model: ttsModel,
          input: [
            {
              type: 'user_input',
              content: [
                {
                  type: 'text',
                  text,
                  annotations: [{ type: 'speech_metadata', style: 'warm, clear teacher explaining to a student' }],
                },
              ],
            },
          ],
          response_format: { type: 'audio' },
          generation_config: { speech_config: [{ voice: ttsVoice }] },
        }),
        timeoutMs * 2,
        'Gemini TTS'
      );
      const audio = res.output_audio;
      if (!audio?.data) throw new Error('TTS returned no audio');
      return ensureWav(Buffer.from(audio.data, 'base64'), `${audio.mime_type || ''};rate=${audio.sample_rate || 24000}`);
    } catch (err) {
      if (isFatal(err)) throw err;
      const res = await withTimeout(
        client.models.generateContent({
          model: ttsModel,
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: ttsVoice } } },
          },
        }),
        timeoutMs * 2,
        'Gemini TTS'
      );
      const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!part) throw new Error('TTS returned no audio');
      return ensureWav(Buffer.from(part.inlineData.data, 'base64'), part.inlineData.mimeType);
    }
  }

  return { name: textModel, generateText, textToSpeech, supportsTTS: true };
}
