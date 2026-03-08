import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const getMongoUri = () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is required for MongoDB connection');
  }
  return uri;
};

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = getMongoUri();

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });

    isConnected = true;
    console.log('✅ Connected to MongoDB via Mongoose');
    console.log(`📦 Database name: ${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
};

export default connectDB;
export { connectDB };