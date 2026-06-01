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

const isTest = process.env.NODE_ENV === 'test';

const apiLimiter = rateLimit({
  store: store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 1000 : 100, // 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  store: store,
  windowMs: 15 * 60 * 1000,
  max: isTest ? 100 : 15, // 15 attempts per 15 minutes
  message: { error: 'Too many login attempts, please try again later' },
  skipSuccessfulRequests: true,
});

const auditLimiter = rateLimit({
  store: store,
  windowMs: 60 * 1000, // 1 minute
  max: isTest ? 500 : 1, // 1 scan per minute
  message: { error: 'Analysis limit reached, try again later' },
});

module.exports = {
  apiLimiter,
  authLimiter,
  auditLimiter
};
