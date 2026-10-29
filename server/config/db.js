const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kisanbazaar');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('Server is running without MongoDB connection. Please ensure MongoDB is running when models/auth are introduced.');
  }
};

module.exports = connectDB;
