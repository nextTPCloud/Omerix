/**
 * Script para eliminar una empresa y todos sus datos relacionados
 *
 * Uso: npx ts-node src/scripts/delete-empresa.ts <empresaId|email>
 * Ejemplo: npx ts-node src/scripts/delete-empresa.ts tallertpcomputer@gmail.com
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function deleteEmpresa() {
  const searchParam = process.argv[2];

  if (!searchParam) {
    console.error('Uso: npx ts-node src/scripts/delete-empresa.ts <empresaId|email>');
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db!;

    // Buscar empresa por ID o por email del usuario
    let empresa: any = null;
    let usuario: any = null;

    // Primero intentar buscar por ObjectId
    if (mongoose.Types.ObjectId.isValid(searchParam)) {
      empresa = await db.collection('empresas').findOne({
        _id: new mongoose.Types.ObjectId(searchParam)
      });
    }

    // Si no encontró, buscar por email del usuario
    if (!empresa) {
      usuario = await db.collection('usuarios').findOne({ email: searchParam });
      if (usuario && usuario.empresaId) {
        empresa = await db.collection('empresas').findOne({
          _id: usuario.empresaId
        });
      }
    }

    if (!empresa) {
      console.error('❌ No se encontró la empresa');
      process.exit(1);
    }

    console.log('');
    console.log('=== EMPRESA A ELIMINAR ===');
    console.log('  ID:', empresa._id.toString());
    console.log('  Nombre:', empresa.nombre);
    console.log('  NIF:', empresa.nif);
    console.log('  DB Config:', empresa.databaseConfig?.name);
    console.log('');

    // Buscar usuarios de esta empresa
    const usuarios = await db.collection('usuarios').find({
      empresaId: empresa._id
    }).toArray();

    console.log('=== USUARIOS A ELIMINAR ===');
    usuarios.forEach(u => {
      console.log(`  - ${u.email} (${u.rol})`);
    });
    console.log('');

    // Preguntar confirmación (en un script real, esto sería interactivo)
    console.log('🔴 ELIMINANDO DATOS...');
    console.log('');

    // 1. Eliminar base de datos del tenant
    const tenantDbName = empresa.databaseConfig?.name || `tralok_empresa_${empresa._id}`;
    try {
      const tenantDb = mongoose.connection.useDb(tenantDbName);
      await tenantDb.dropDatabase();
      console.log(`✅ Base de datos del tenant eliminada: ${tenantDbName}`);
    } catch (error) {
      console.log(`⚠️ No se pudo eliminar la base de datos del tenant: ${tenantDbName}`);
    }

    // 2. Eliminar licencia
    const licenciaResult = await db.collection('licencias').deleteMany({
      empresaId: empresa._id
    });
    console.log(`✅ Licencias eliminadas: ${licenciaResult.deletedCount}`);

    // 3. Eliminar pagos
    const pagosResult = await db.collection('pagos').deleteMany({
      empresaId: empresa._id
    });
    console.log(`✅ Pagos eliminados: ${pagosResult.deletedCount}`);

    // 4. Eliminar relaciones usuario-empresa
    const relacionesResult = await db.collection('usuarioempresas').deleteMany({
      empresaId: empresa._id
    });
    console.log(`✅ Relaciones usuario-empresa eliminadas: ${relacionesResult.deletedCount}`);

    // 5. Eliminar refresh tokens de los usuarios
    for (const u of usuarios) {
      await db.collection('refreshtokens').deleteMany({
        userId: u._id
      });
    }
    console.log(`✅ Refresh tokens eliminados`);

    // 6. Eliminar usuarios
    const usuariosResult = await db.collection('usuarios').deleteMany({
      empresaId: empresa._id
    });
    console.log(`✅ Usuarios eliminados: ${usuariosResult.deletedCount}`);

    // 7. Eliminar empresa
    await db.collection('empresas').deleteOne({
      _id: empresa._id
    });
    console.log(`✅ Empresa eliminada: ${empresa.nombre}`);

    console.log('');
    console.log('🎉 Eliminación completada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

deleteEmpresa();
