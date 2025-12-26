import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkEmails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB\n');

    const db = mongoose.connection.db!;

    console.log('=== EMAILS DE USUARIOS ===');
    const usuarios = await db.collection('usuarios').find({}).toArray();
    console.log('Total:', usuarios.length);
    usuarios.forEach(u => {
      console.log(`  - ${u.email} | rol: ${u.rol} | empresaId: ${u.empresaId?.toString()}`);
    });

    console.log('\n=== EMAILS DE EMPRESAS ===');
    const empresas = await db.collection('empresas').find({}).toArray();
    console.log('Total:', empresas.length);
    empresas.forEach(e => {
      console.log(`  - ${e.email} | ${e.nombre}`);
    });

    // También buscar en refresh tokens por si hay tokens huérfanos
    console.log('\n=== REFRESH TOKENS ===');
    const tokens = await db.collection('refreshtokens').find({}).toArray();
    console.log('Total tokens:', tokens.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkEmails();
