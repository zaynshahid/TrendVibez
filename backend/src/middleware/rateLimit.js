import { createHash } from 'crypto';
import { getDb } from '../db.js';

const WINDOW_COLLECTION = 'api_rate_limits';
let ttlIndexPromise;

async function getRateLimitCollection() {
  const collection = (await getDb()).collection(WINDOW_COLLECTION);
  if (!ttlIndexPromise) {
    ttlIndexPromise = collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  }
  await ttlIndexPromise;
  return collection;
}

export function createRateLimiter({ scope, limit, windowMs, keyGenerator = req => req.ip || 'unknown' }) {
  if (!scope || !Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowMs) || windowMs < 1) {
    throw new Error('Rate limiter requires a scope, positive integer limit, and positive integer window.');
  }

  return async (req, res, next) => {
    try {
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const windowEnd = windowStart + windowMs;
      const collection = await getRateLimitCollection();
      const identities = [...new Set([keyGenerator(req)].flat().map(String))];
      let remaining = limit;

      for (const rawIdentity of identities) {
        const identity = createHash('sha256').update(rawIdentity).digest('hex');
        const bucketId = `${scope}:${windowStart}:${identity}`;
        const filter = { _id: bucketId, count: { $lt: limit } };
        let bucket = await collection.findOneAndUpdate(
          filter,
          { $inc: { count: 1 } },
          { returnDocument: 'after' }
        );

        if (!bucket) {
          try {
            await collection.insertOne({
              _id: bucketId,
              count: 1,
              expiresAt: new Date(windowEnd + windowMs)
            });
            bucket = { count: 1 };
          } catch (error) {
            if (error.code !== 11000) throw error;
            bucket = await collection.findOneAndUpdate(
              filter,
              { $inc: { count: 1 } },
              { returnDocument: 'after' }
            );
          }
        }

        if (!bucket) {
          res.set('Retry-After', String(Math.max(1, Math.ceil((windowEnd - now) / 1000))));
          return res.status(429).json({ message: 'Too many requests. Please try again later.' });
        }

        remaining = Math.min(remaining, limit - bucket.count);
      }

      res.set('RateLimit-Limit', String(limit));
      res.set('RateLimit-Remaining', String(Math.max(0, remaining)));
      res.set('RateLimit-Reset', String(Math.ceil(windowEnd / 1000)));
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
