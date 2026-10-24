import axios from 'axios';
import { auth } from 'express-oauth2-jwt-bearer';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { TTLCache } from '../utils/ttlCache.js';

const profileCache = new TTLCache({ max: 2000, ttlMs: 15 * 60 * 1000 });

// 1) Verify the Bearer access token (signature via Auth0 JWKS, issuer, audience, expiry).
function buildJwtCheck() {
  if (env.auth0.disabled) {
    console.warn('AUTH_DISABLED=true: every request is treated as a local dev user. Never use this in production.');
    return (req, _res, next) => {
      req.auth = { payload: { sub: 'dev|local-user' }, token: null };
      next();
    };
  }
  if (!env.auth0.issuer || !env.auth0.audience) {
    return (_req, res) => res.status(500).json({ error: 'Auth0 is not configured on the server (AUTH0_ISSUER / AUTH0_AUDIENCE).' });
  }
  return auth({ issuerBaseURL: env.auth0.issuer, audience: env.auth0.audience, tokenSigningAlg: 'RS256' });
}

// 2) Resolve the profile from /userinfo (cached) and upsert the User document.
async function fetchProfile(sub, token) {
  const cached = profileCache.get(sub);
  if (cached) return cached;
  let profile = { sub };
  if (token) {
    try {
      const { data } = await axios.get(new URL('userinfo', env.auth0.issuer).toString(), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      profile = { sub, email: data.email, name: data.name || data.nickname, picture: data.picture };
    } catch (err) {
      // /userinfo is rate limited; the request is already authenticated, so continue with sub only.
      console.warn('Auth0 /userinfo failed:', err.response?.status || err.message);
    }
  } else {
    profile = { sub, email: 'dev@localhost', name: 'Local Dev User' };
  }
  profileCache.set(sub, profile);
  await User.updateOne(
    { sub },
    { $set: { ...(profile.email && { email: profile.email }), ...(profile.name && { name: profile.name }), ...(profile.picture && { picture: profile.picture }), lastLoginAt: new Date() } },
    { upsert: true }
  );
  return profile;
}

async function attachUser(req, _res, next) {
  try {
    const sub = req.auth?.payload?.sub;
    if (!sub) return next(Object.assign(new Error('Token has no subject'), { status: 401 }));
    req.user = await fetchProfile(sub, req.auth.token);
    next();
  } catch (err) {
    next(err);
  }
}

export const requireAuth = [buildJwtCheck(), attachUser];
