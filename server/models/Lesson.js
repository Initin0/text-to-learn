import mongoose from 'mongoose';

const readingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: String,
    note: String,
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    objectives: [String],
    keyTopics: [String],
    readings: [readingSchema],
    // Flexible structured blocks: heading, paragraph, code, video, mcq, list, callout.
    // Empty until the lesson is generated on first open (saves tokens on unread lessons).
    content: { type: [mongoose.Schema.Types.Mixed], default: [] },
    isEnriched: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    hinglishScript: String, // cached translation used for TTS
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  },
  { timestamps: true }
);

export const Lesson = mongoose.model('Lesson', lessonSchema);
