const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => Date.now().toString() },
  userId: { type: String, index: true },
  action: { type: String, required: true },
  meta: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
});
module.exports = mongoose.model('ActivityLog', schema);
