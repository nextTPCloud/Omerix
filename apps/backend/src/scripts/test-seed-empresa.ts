import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { empresaSeedService } from '../services/empresa-seed.service';

dotenv.config();

async function testSeedEmpresa() {
  try {
    // 1. Conectar a la BD principal
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB principal\n');

    const db = mongoose.connection.db!;

    // 2. Obtener "Empresa 1" que no tiene seed
    const empresa = await db.collection('empresas').findOne({ nombre: 'Empresa 1' });
    if (!empresa) {
      console.log('❌ No se encontró Empresa 1');
      return;
    }

    console.log(`🏢 Empresa encontrada: ${empresa.nombre}`);
    console.log(`   ID: ${empresa._id}`);
    console.log(`   Database: ${empresa.databaseConfig?.name}`);

    // 3. Crear conexión a la BD de la empresa
    const empresaDbName = empresa.databaseConfig?.name;
    if (!empresaDbName) {
      console.log('❌ No tiene databaseConfig');
      return;
    }

    const empresaUri = `mongodb://localhost:27017/${empresaDbName}`;
    console.log(`\n📡 Conectando a: ${empresaUri}`);

    const empresaConnection = await mongoose.createConnection(empresaUri).asPromise();
    console.log('✅ Conexión creada\n');

    // 4. Ejecutar seed
    console.log('🌱 Ejecutando seed de datos...\n');
    await empresaSeedService.seedEmpresaData(empresaConnection, String(empresa._id));

    // 5. Verificar resultados
    console.log('\n📊 VERIFICANDO RESULTADOS...\n');

    const empresaDb = empresaConnection.db!;
    const collections = await empresaDb.listCollections().toArray();
    console.log(`Colecciones: ${collections.map(c => c.name).join(', ')}`);

    // Verificar cada colección
    for (const col of ['tipoimpuestos', 'formapagos', 'seriedocumentos', 'dashboards']) {
      try {
        const count = await empresaDb.collection(col).countDocuments();
        console.log(`  ${col}: ${count} documentos`);
      } catch (e) {
        console.log(`  ${col}: no existe`);
      }
    }

    await empresaConnection.close();
    console.log('\n✅ Test completado');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testSeedEmpresa();
