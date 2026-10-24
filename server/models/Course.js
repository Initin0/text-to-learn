import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    topic: { type: String, required: true, trim: true }, // the original prompt
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    creator: { type: String, required: true, index: true }, // Auth0 `sub`
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    tags: [{ type: String, trim: true }],
    generatedBy: String, // model id or "mock"
  },
  { timestamps: true }
);

courseSchema.index({ creator: 1, createdAt: -1 });

export const Course = mongoose.model('Course', courseSchema);
