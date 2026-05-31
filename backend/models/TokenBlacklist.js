const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }
});
const TokenBlacklist = mongoose.model('TokenBlacklist', schema);
module.exports = TokenBlacklist;
