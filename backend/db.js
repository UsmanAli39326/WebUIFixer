const mongoose = require('mongoose');

async function connectDatabase() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/webfixer';

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ Connected to MongoDB');

    // Attempt to create unique indexes just in case they aren't created by models
    try {
      await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    } catch (indexError) {
      // Ignore if collection doesn't exist yet
    }

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
