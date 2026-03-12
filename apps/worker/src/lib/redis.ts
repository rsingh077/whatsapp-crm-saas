import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const createRedisConnection = () =>
  new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });
