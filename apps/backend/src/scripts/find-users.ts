import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB');

    const db = mongoose.connection.db!;

    // Buscar en la base principal
    console.log('');
    console.log('=== BASE PRINCIPAL (omerix) ===');
    const collections = await db.listCollections().toArray();
    console.log('Colecciones:', collections.map(c => c.name).join(', '));

    // Buscar usuarios en la base principal
    const mainUsers = await db.collection('usuarios').find({}).toArray();
    console.log('');
    console.log('Usuarios en base principal:', mainUsers.length);
    mainUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.rol}) - Empresa: ${u.empresaId}`);
    });

    // Buscar empresas
    const empresas = await db.collection('empresas').find({}).toArray();
    console.log('');
    console.log('Empresas:', empresas.length);
    for (const emp of empresas) {
      console.log(`  - ${emp.nombre} (${emp._id})`);
      console.log(`    databaseConfig: ${JSON.stringify(emp.databaseConfig)}`);

      // Buscar usuarios en la base del tenant
      const tenantDbName = emp.databaseConfig?.dbName;
      if (tenantDbName) {
        const tenantDb = mongoose.connection.useDb(tenantDbName);
        const tenantUsers = await tenantDb.collection('usuarios').find({}).toArray();
        console.log(`    Usuarios en ${tenantDbName}:`, tenantUsers.length);
        tenantUsers.forEach(u => {
          console.log(`      - ${u.email} (${u.rol})`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findUsers();
