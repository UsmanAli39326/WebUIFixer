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
  createdAt: { type: Date, default: Date.now }
});

const Template = mongoose.model('Template', templateSchema);

module.exports = {
  add: async (templateData) => {
    const newTemplate = new Template(templateData);
    await newTemplate.save();
    return newTemplate.toObject();
  },
  
  getAll: async () => {
    return await Template.find({}).sort({ createdAt: -1 }).lean();
  },

  findAllApproved: async () => {
    return await Template.find({ status: 'approved' }).sort({ createdAt: -1 }).lean();
  },
  
  findById: async (id) => {
    return await Template.findOne({ id }).lean();
  },
  
  deleteById: async (id) => {
    return await Template.deleteOne({ id });
  }
};
