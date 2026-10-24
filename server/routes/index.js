import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth } from '../middlewares/auth.js';
import { validate, validObjectId } from '../middlewares/validate.js';
import { aiLimiter } from '../middlewares/rateLimit.js';
import * as courses from '../controllers/course.controller.js';
import * as lessons from '../controllers/lesson.controller.js';
import * as youtube from '../controllers/youtube.controller.js';
import { env } from '../config/env.js';
import { getProvider } from '../services/ai/index.js';

const router = Router();

// ---- public ----
router.get('/health', (_req, res) =>
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ai: getProvider().name,
    tts: getProvider().supportsTTS,
    youtube: Boolean(env.youtubeKey),
    uptime: Math.round(process.uptime()),
  })
);

// ---- everything below needs a valid Auth0 access token ----
router.use(requireAuth);

router.get('/me', (req, res) => res.json(req.user));

const generateCourseBody = z.object({
  topic: z.string().trim().min(3, 'Describe the topic in at least 3 characters').max(300, 'Keep the topic under 300 characters'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
});

router.post('/courses/generate', aiLimiter, validate({ body: generateCourseBody }), courses.generateCourse);
router.get('/courses', courses.listCourses);
router.get('/courses/:id', validObjectId(), courses.getCourse);
router.delete('/courses/:id', validObjectId(), courses.deleteCourse);

router.get('/lessons/:id', validObjectId(), lessons.getLesson);
router.post('/lessons/:id/generate', validObjectId(), aiLimiter, validate({ body: z.object({ force: z.boolean().default(false) }) }), lessons.generateLesson);
router.patch('/lessons/:id/progress', validObjectId(), validate({ body: z.object({ completed: z.boolean() }) }), lessons.setProgress);
router.post('/lessons/:id/hinglish', validObjectId(), aiLimiter, lessons.getHinglish);
router.get('/lessons/:id/audio', validObjectId(), aiLimiter, lessons.getAudio);

router.get(
  '/youtube',
  validate({ query: z.object({ query: z.string().trim().min(2).max(150), max: z.coerce.number().int().min(1).max(3).default(3) }) }),
  youtube.search
);

export default router;
