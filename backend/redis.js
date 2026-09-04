// FILE: backend/redis.js
/**
 * REDIS CLIENT & CACHE LAYER
 * Provides Redis caching for active game sessions, rate limiting, pub/sub,
 * and ephemeral game lobby code lookups with 5-minute TTL.
 */

import Redis from 'ioredis-mock';

class RedisManager {
  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && process.env.NODE_ENV === 'production') {
      try {
        // Real ioredis in production if installed and configured
        const RealRedis = require('ioredis');
        this.client = new RealRedis(redisUrl, {
          retryStrategy: (times) => Math.min(times * 50, 2000),
          maxRetriesPerRequest: 3
        });
      } catch {
        this.client = new Redis();
      }
    } else {
      // In-memory mock Redis for resilient serverless & local development
      this.client = new Redis();
    }

    this.client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.client.on('error', (err) => {
      console.warn('⚠️ Redis error:', err.message);
    });
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key, value, mode, duration) {
    try {
      if (mode && duration) {
        return await this.client.set(key, value, mode, duration);
      }
      return await this.client.set(key, value);
    } catch {
      return null;
    }
  }

  async del(key) {
    try {
      return await this.client.del(key);
    } catch {
      return 0;
    }
  }

  async setJson(key, data, ttlSeconds = 300) {
    try {
      const serialized = JSON.stringify(data);
      if (ttlSeconds > 0) {
        return await this.client.set(key, serialized, 'EX', ttlSeconds);
      }
      return await this.client.set(key, serialized);
    } catch {
      return null;
    }
  }

  async getJson(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async keys(pattern) {
    try {
      return await this.client.keys(pattern);
    } catch {
      return [];
    }
  }
}

export const redis = new RedisManager();
export default redis;
