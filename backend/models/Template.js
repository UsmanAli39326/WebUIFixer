const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => Date.now().toString() },
  title: { type: String, required: true },
  url: { type: String, required: true },
  price: { type: Number, required: true },
  score: { type: Number, required: true },
  filePath: { type: String, required: false },
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  userId: { type: String, required: true }, // The user who uploaded it
  category: { type: String, default: '' },
  description: { type: String, default: '' },
  imagePath: { type: String, default: '' },
  issues: [Object],
  createdAt: { type: Date, default: Date.now }
});

templateSchema.statics.add = async function(templateData) {
  const newTemplate = new this(templateData);
  await newTemplate.save();
  return newTemplate.toObject();
};

templateSchema.statics.getAll = async function() {
  return await this.find({}).sort({ createdAt: -1 }).lean();
};

templateSchema.statics.findAllApproved = async function() {
  return await this.find({ status: 'approved' }).sort({ createdAt: -1 }).lean();
};

templateSchema.statics.findById = async function(id) {
  return await this.findOne({ id }).lean();
};

templateSchema.statics.deleteById = async function(id) {
  return await this.deleteOne({ id });
};

const Template = mongoose.model('Template', templateSchema);
module.exports = Template;
