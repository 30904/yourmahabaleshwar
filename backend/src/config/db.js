import dns from 'node:dns/promises';
import mongoose from 'mongoose';

dns.setServers(['1.1.1.1', '8.8.8.8']);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment');
  }
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

export default connectDB;
