const ActivityLog = require('../models/ActivityLog');
const logger = require('../logger');

async function log(userId, action, meta = {}) {
  try {
    await ActivityLog.create({ userId, action, meta });
  } catch (err) {
    logger.warn('Failed to log activity:', { userId, action, error: err.message });
  }
}

module.exports = { log };
