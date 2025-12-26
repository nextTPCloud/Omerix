import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB');

    const db = mongoose.connection.db!;

    // Buscar la empresa
    const empresa = await db.collection('empresas').findOne({
      _id: new mongoose.Types.ObjectId('694bd3fc7f6a83048b1889b2')
    });

    if (!empresa) {
      console.log('Empresa no encontrada');
      return;
    }

    console.log('');
    console.log('=== EMPRESA ===');
    console.log('  Nombre:', empresa.nombre);
    console.log('  DB Config:', empresa.databaseConfig?.dbName);

    // Conectar a la BD del tenant para buscar usuarios
    const tenantDbName = empresa.databaseConfig?.dbName || `omerix_694bd3fc7f6a83048b1889b2`;
    console.log('  Conectando a:', tenantDbName);

    const tenantDb = mongoose.connection.useDb(tenantDbName);

    // Buscar usuarios
    const usuarios = await tenantDb.collection('usuarios').find({}).toArray();

    console.log('');
    console.log('=== USUARIOS ===');
    usuarios.forEach(u => {
      console.log(`  - ${u.email}`);
      console.log(`    Nombre: ${u.nombre} ${u.apellidos}`);
      console.log(`    Rol: ${u.rol}`);
      console.log(`    Activo: ${u.activo}`);
      if (u.permisos) {
        console.log('    Permisos especiales:');
        Object.entries(u.permisos).forEach(([key, value]) => {
          if (value) console.log(`      - ${key}: ${value}`);
        });
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUser();
