import mongoose from 'mongoose';

// Auth0-identified user. `sub` is the stable Auth0 user id (e.g. "google-oauth2|123").
const userSchema = new mongoose.Schema(
  {
    sub: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    name: { type: String, trim: true },
    picture: String,
    lastLoginAt: Date,
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
