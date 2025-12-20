import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/omerix');
  console.log('Conectado a:', process.env.MONGO_URI);
  const empresas = await mongoose.connection.db.collection('empresas').find({}).toArray();
  console.log('Empresas:', empresas.length);
  for (const e of empresas) {
    console.log('-', e.nombre, '| estado:', e.estado);
  }
  await mongoose.disconnect();
}
check().catch(console.error);
