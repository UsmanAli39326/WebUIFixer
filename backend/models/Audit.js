const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => Date.now().toString() },
  userId: { type: String, index: true },
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
  timestamp: { type: Date, default: Date.now, index: true },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: { expireAfterSeconds: 0 } // Auto-delete after expiration
  }
});

auditSchema.index({ userId: 1, timestamp: -1 });

auditSchema.statics.saveAudit = async function(id, data) {
  const auditData = { id, ...data };
  await this.findOneAndUpdate({ id }, auditData, { upsert: true, new: true });
  return id;
};

auditSchema.statics.get = async function(id) {
  return await this.findOne({ id }).lean();
};

auditSchema.statics.getByUserId = async function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const total = await this.countDocuments({ userId });
  const audits = await this.find({ userId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return { audits, total, page, pages: Math.ceil(total / limit) };
};

auditSchema.statics.delete = async function(id) {
  return await this.deleteOne({ id });
};

auditSchema.statics.getAll = async function() {
  return await this.find({}).lean();
};

auditSchema.statics.setIssueAccepted = async function(auditId, ruleId, accepted) {
  return await this.findOneAndUpdate(
    { id: auditId, 'issues.ruleId': ruleId },
    { $set: { 'issues.$.accepted': accepted } },
    { new: true }
  ).lean();
};

const Audit = mongoose.model('Audit', auditSchema);
module.exports = Audit;
