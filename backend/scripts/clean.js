import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB;

async function clean() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB connection string missing from .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  const ordersRes = await mongoose.connection.db.collection('orders').deleteMany({ isDummy: true });
  console.log(`Successfully removed ${ordersRes.deletedCount} dummy orders.`);

  const usersRes = await mongoose.connection.db.collection('users').deleteMany({ isDummy: true });
  console.log(`Successfully removed ${usersRes.deletedCount} dummy users.`);

  await mongoose.disconnect();
  console.log('Clean up complete. All dummy records safely purged.');
}

clean().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
