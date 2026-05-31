const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => Date.now().toString() },
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
  lastLogin: Date
});

// Hide password in responses
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = {
  create: async (userData) => {
    const newUser = new User(userData);
    await newUser.save();
    return newUser;
  },
  
  findByEmail: async (email) => {
    return await User.findOne({ email });
  },
  
  findById: async (id) => {
    return await User.findOne({ id });
  },
  
  findAll: async () => {
    return await User.find({}).select('-password');
  },
  
  updateProfile: async (id, profileData) => {
    return await User.findOneAndUpdate(
      { id },
      { profile: profileData },
      { new: true }
    );
  },
  
  deleteById: async (id) => {
    return await User.deleteOne({ id });
  }
};
