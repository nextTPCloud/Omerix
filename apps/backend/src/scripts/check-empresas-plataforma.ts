import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
  const db = mongoose.connection.db!;

  const empresas = await db.collection('empresas').find({}).toArray();
  console.log('=== EMPRESAS ===');
  for (const e of empresas) {
    console.log(`${e.nombre} | esPlatforma: ${e.esPlatforma} | _id: ${e._id.toString()}`);
  }

  await mongoose.disconnect();
}
check();
