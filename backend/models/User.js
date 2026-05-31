const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  profile: {
    bio: String,
    website: String
  },
  emailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  passwordResetOtp: String,
  passwordResetExpires: Date
});

// Hide password in responses
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};

userSchema.statics.findById = function(id) {
  return this.findOne({ id });
};

userSchema.statics.findAll = function() {
  return this.find({}).select('-password');
};

userSchema.statics.updateProfile = function(id, data) {
  const allowed = {};
  if (data.name) allowed.name = data.name;
  if (data.profile) allowed.profile = data.profile;
  return this.findOneAndUpdate({ id }, allowed, { new: true });
};

userSchema.statics.deleteById = function(id) {
  return this.deleteOne({ id });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
