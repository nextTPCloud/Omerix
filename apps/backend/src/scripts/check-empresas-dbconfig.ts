import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
  const db = mongoose.connection.db!;
  const empresas = await db.collection('empresas').find({}).toArray();
  for (const e of empresas) {
    console.log('---', e.nombre, '---');
    console.log('dbConfig:', JSON.stringify(e.dbConfig, null, 2));
    console.log('databaseConfig:', JSON.stringify(e.databaseConfig, null, 2));
  }
  await mongoose.disconnect();
  process.exit(0);
}
check();
