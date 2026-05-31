const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => Date.now().toString() },
  templateId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  downloadedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Download', schema);
