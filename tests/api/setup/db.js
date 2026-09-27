import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

// Initialize JWT secret and environment for testing
process.env.JWT_SECRET = process.env.JWT_SECRET || 'bujang_test_jwt_secret_key_12345';
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';

export const connectTestDB = async () => {
  if (mongod) {
    return;
  }
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB = uri;

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
};

export const clearTestDB = async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
};
