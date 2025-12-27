import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import { config } from '../config';
import logger from '../utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function createSessionStore() {
  if (config.redis.useRedis && config.redis.url) {
    try {
      logger.info('Connecting to Redis...', { url: config.redis.url });

      redisClient = createClient({
        url: config.redis.url,
      });

      redisClient.on('error', (err) => {
        logger.error('Redis client error', { error: err });
      });

      await redisClient.connect();

      logger.info('Redis connected successfully');

      return new RedisStore({
        client: redisClient,
        prefix: 'session:',
      });
    } catch (error) {
      logger.error('Failed to connect to Redis, falling back to memory store', {
        error,
      });
      return undefined;
    }
  }

  logger.info('Using memory store for sessions');
  return undefined;
}

export function createSessionMiddleware(store?: any) {
  return session({
    store,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.session.secure,
      httpOnly: true,
      maxAge: config.session.maxAge,
      sameSite: config.session.sameSite,
    },
    name: 'homelab.sid',
  });
}

export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}
