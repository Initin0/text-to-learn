// Full API flow against a real MongoDB.
// CI provides one through a service container (MONGO_URI). Locally it falls back to
// mongodb-memory-server, and the suite is skipped if neither is available.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { Course, Lesson, User } from '../models/index.js';

let mongod;
let available = true;

beforeAll(async () => {
  let uri = process.env.MONGO_URI_TEST;
  if (!uri) {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server-core');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
    } catch (err) {
      available = false;
      console.warn('No MongoDB for integration tests, skipping:', err.message.split('\n')[0]);
      return;
    }
  }
  await mongoose.connect(uri, { dbName: `ttl_test_${Date.now()}` });
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongod) await mongod.stop();
});

const app = createApp();
const t = (name, fn) => it(name, async (ctx) => (available ? fn() : ctx.skip()));

describe('API', () => {
  let course;
  let lessonId;

  t('health reports mock AI provider', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', ai: 'mock', tts: false });
  });

  t('rejects a too-short topic', async () => {
    const res = await request(app).post('/api/courses/generate').send({ topic: 'a' }).expect(400);
    expect(res.body.error).toMatch(/at least 3/);
  });

  t('generates and persists a course from a prompt', async () => {
    const res = await request(app).post('/api/courses/generate').send({ topic: 'Intro to React Hooks', level: 'beginner' }).expect(201);
    course = res.body;
    expect(course.title).toBeTruthy();
    expect(course.modules.length).toBeGreaterThanOrEqual(3);
    expect(course.modules.length).toBeLessThanOrEqual(6);
    for (const m of course.modules) {
      expect(m.lessons.length).toBeGreaterThanOrEqual(3);
      expect(m.lessons.length).toBeLessThanOrEqual(5);
    }
    expect(course.progress.completed).toBe(0);
    lessonId = course.modules[0].lessons[1]._id;
    expect(await User.countDocuments({ sub: 'dev|local-user' })).toBe(1);
  });

  t('lists the user courses', async () => {
    const res = await request(app).get('/api/courses').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ _id: course._id, moduleCount: course.modules.length });
  });

  t('returns a lesson outline before content is generated', async () => {
    const res = await request(app).get(`/api/lessons/${lessonId}`).expect(200);
    expect(res.body.isEnriched).toBe(false);
    expect(res.body.context).toMatchObject({ courseId: course._id, moduleIndex: 0, lessonIndex: 1 });
    expect(res.body.context.prev).toBeTruthy();
  });

  t('refuses Hinglish before content exists', async () => {
    await request(app).post(`/api/lessons/${lessonId}/hinglish`).expect(400);
  });

  t('generates lesson content on demand', async () => {
    const res = await request(app).post(`/api/lessons/${lessonId}/generate`).send({}).expect(200);
    expect(res.body.isEnriched).toBe(true);
    expect(res.body.objectives.length).toBeGreaterThan(0);
    const types = res.body.content.map((b) => b.type);
    expect(types).toContain('video');
    expect(types.at(-1)).toBe('mcq');
    expect(res.body.readings[0].searchUrl).toMatch(/^https:\/\/www.google.com/);
  });

  t('concurrent generate calls do not duplicate work', async () => {
    const id = course.modules[1].lessons[0]._id;
    const [a, b] = await Promise.all([
      request(app).post(`/api/lessons/${id}/generate`).send({}),
      request(app).post(`/api/lessons/${id}/generate`).send({}),
    ]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(a.body.content).toEqual(b.body.content);
  });

  t('creates and caches a Hinglish script', async () => {
    const r1 = await request(app).post(`/api/lessons/${lessonId}/hinglish`).expect(200);
    expect(r1.body.text).toMatch(/aaj|hum|samajh/i);
    const saved = await Lesson.findById(lessonId);
    expect(saved.hinglishScript).toBe(r1.body.text);
  });

  t('audio endpoint reports 501 in mock mode so the client can fall back', async () => {
    await request(app).get(`/api/lessons/${lessonId}/audio`).expect(501);
  });

  t('tracks progress', async () => {
    await request(app).patch(`/api/lessons/${lessonId}/progress`).send({ completed: true }).expect(200);
    const res = await request(app).get(`/api/courses/${course._id}`).expect(200);
    expect(res.body.progress.completed).toBe(1);
  });

  t('youtube search returns a fallback link without an API key', async () => {
    const res = await request(app).get('/api/youtube').query({ query: 'react hooks explained' }).expect(200);
    expect(res.body.videos).toEqual([]);
    expect(res.body.fallbackUrl).toContain('youtube.com/results');
  });

  t('validates ids and hides other users courses', async () => {
    await request(app).get('/api/courses/not-an-id').expect(400);
    const other = await Course.create({ title: 'Theirs', topic: 'x y z', creator: 'auth0|someone-else' });
    await request(app).get(`/api/courses/${other._id}`).expect(404);
    await request(app).delete(`/api/courses/${other._id}`).expect(404);
  });

  t('deletes a course with its modules and lessons', async () => {
    await request(app).delete(`/api/courses/${course._id}`).expect(204);
    expect(await Lesson.countDocuments({ course: course._id })).toBe(0);
    await request(app).get(`/api/courses/${course._id}`).expect(404);
  });

  t('unknown routes return JSON 404', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
