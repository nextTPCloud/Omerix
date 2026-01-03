import mongoose from 'mongoose';
import { config } from '../config/env';

async function updateRolesTesoreria() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(config.database.uri);

    // Obtener todas las empresas
    const empresas = await mongoose.connection.db.collection('empresas').find({}).toArray();
    console.log(`Encontradas ${empresas.length} empresas\n`);

    for (const empresa of empresas) {
      console.log(`\n📦 Empresa: ${empresa.nombre}`);

      try {
        // Obtener la URI de la BD de la empresa
        const dbUri = empresa.databaseConfig?.mongoUri || config.database.uri;
        const dbName = empresa.databaseConfig?.dbName || `omerix_${empresa._id}`;

        // Conectar a la BD de la empresa
        const conn = await mongoose.createConnection(dbUri, { dbName }).asPromise();

        // Actualizar roles en esta empresa
        const result = await conn.db.collection('roles').updateMany(
          {
            $or: [
              { 'permisos.accesoContabilidad': true },
              { 'permisos.accesoCompras': true },
              { 'permisos.accesoVentas': true }
            ]
          },
          { $set: { 'permisos.accesoTesoreria': true } }
        );

        console.log(`   Roles actualizados: ${result.modifiedCount}`);

        // Mostrar roles
        const roles = await conn.db.collection('roles').find({}).toArray();
        console.log(`   Total roles: ${roles.length}`);
        roles.forEach(r => {
          const tiene = r.permisos?.accesoTesoreria ? '✅' : '❌';
          console.log(`     ${tiene} ${r.nombre}`);
        });

        await conn.close();

      } catch (err: any) {
        console.log(`   ⚠️ Error: ${err.message}`);
      }
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Conexión cerrada');
  }
}

updateRolesTesoreria();
