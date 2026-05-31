const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const logger = require('../logger');

let store;

if (process.env.REDIS_URL) {
  const client = redis.createClient({
    url: process.env.REDIS_URL
  });

  client.connect().catch(err => {
    logger.error('Redis connection error:', err);
  });

  store = new RedisStore({
    sendCommand: (...args) => client.sendCommand(args),
    prefix: 'rl:',
  });
  
  logger.info('Using Redis store for rate limiting');
} else {
  // Fallback to memory store if REDIS_URL is not provided
  store = undefined; // express-rate-limit uses MemoryStore by default when undefined
  logger.info('Using Memory store for rate limiting (no REDIS_URL provided)');
}

const apiLimiter = rateLimit({
  store: store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  store: store,
  windowMs: 15 * 60 * 1000,
  max: 15, // 15 attempts per 15 minutes (bumped slightly for testing)
  message: { error: 'Too many login attempts, please try again later' },
  skipSuccessfulRequests: true,
});

const auditLimiter = rateLimit({
  store: store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 analyses per hour
  message: { error: 'Analysis limit reached, try again later' },
});

module.exports = {
  apiLimiter,
  authLimiter,
  auditLimiter
};
