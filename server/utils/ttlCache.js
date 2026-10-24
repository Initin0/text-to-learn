// Small in-memory LRU cache with per-entry TTL. Good enough for one Render instance.
export class TTLCache {
  constructor({ max = 500, ttlMs = 60 * 60 * 1000 } = {}) {
    this.max = max;
    this.ttlMs = ttlMs;
    this.map = new Map();
  }

  get(key) {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    // refresh LRU position
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.value;
  }

  set(key, value, ttlMs = this.ttlMs) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expires: Date.now() + ttlMs });
    while (this.map.size > this.max) {
      this.map.delete(this.map.keys().next().value);
    }
  }

  clear() {
    this.map.clear();
  }
}
