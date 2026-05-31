const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => Date.now().toString() },
  userId: String,
  url: String,
  summary: {
    currentScore: Number,
    totalElements: Number,
    issuesFound: Number,
    totalIssues: Number,
    bySeverity: Object,
    byType: Object
  },
  issues: [
    {
      element: String,
      issue: String,
      fix: String,
      type: { type: String },
      severity: String,
      ruleId: String,
      id: String,
      className: String,
      text: String,
      accepted: { type: Boolean, default: null }
    }
  ],
  fixedHtml: String,
  styleOverlay: Object,
  duration: Number,
  timestamp: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: { expireAfterSeconds: 0 } // Auto-delete after expiration
  }
});

const Audit = mongoose.model('Audit', auditSchema);

module.exports = {
  save: async (id, data) => {
    // If saving an existing audit using the same method, we might want to use findOneAndUpdate 
    // but the guide specifies creating a new one. Let's use findOneAndUpdate with upsert
    // to match the original in-memory Map behaviour (Map.set(id, data))
    const auditData = { id, ...data };
    await Audit.findOneAndUpdate({ id }, auditData, { upsert: true, new: true });
    return id;
  },
  
  get: async (id) => {
    return await Audit.findOne({ id }).lean();
  },
  
  getByUserId: async (userId) => {
    return await Audit.find({ userId }).sort({ timestamp: -1 }).limit(10).lean();
  },
  
  delete: async (id) => {
    return await Audit.deleteOne({ id });
  },
  
  getAll: async () => {
    return await Audit.find({}).lean();
  },

  setIssueAccepted: async (auditId, ruleId, accepted) => {
    return await Audit.findOneAndUpdate(
      { id: auditId, 'issues.ruleId': ruleId },
      { $set: { 'issues.$.accepted': accepted } },
      { new: true }
    ).lean();
  }
};
