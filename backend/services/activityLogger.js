const ActivityLog = require('../models/ActivityLog');
async function log(userId, action, meta = {}) {
  try { await ActivityLog.create({ userId, action, meta }); } catch (_) {}
}
module.exports = { log };
