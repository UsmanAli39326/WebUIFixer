const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => Date.now().toString() },
  userId: { type: String, required: true },
  templateId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'completed', 'failed'] },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Payment', schema);
