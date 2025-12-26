import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkEmpresaData() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
  const db = mongoose.connection.db!;

  // 1. Obtener empresas
  const empresas = await db.collection('empresas').find({}).toArray();

  for (const empresa of empresas) {
    console.log(`\n========================================`);
    console.log(`🏢 EMPRESA: ${empresa.nombre}`);
    console.log(`   ID: ${empresa._id}`);
    console.log(`   esPlatforma: ${empresa.esPlatforma}`);
    console.log(`   databaseConfig:`, empresa.databaseConfig);
    console.log(`========================================`);

    // Si tiene databaseConfig, conectar a su BD
    if (empresa.databaseConfig && !empresa.esPlatforma) {
      const dbConfig = empresa.databaseConfig;
      const uri = `mongodb://localhost:27017/${dbConfig.name}`;

      console.log(`\n   Conectando a: ${uri}`);

      try {
        const empresaConn = await mongoose.createConnection(uri).asPromise();
        const empresaDb = empresaConn.db!;

        // Verificar colecciones
        const collections = await empresaDb.listCollections().toArray();
        console.log(`\n   📦 Colecciones: ${collections.map(c => c.name).join(', ')}`);

        // Verificar tipos de impuesto
        const tiposImpuesto = await empresaDb.collection('tipoimpuestos').countDocuments();
        console.log(`   💰 Tipos de Impuesto: ${tiposImpuesto}`);

        // Verificar formas de pago
        const formasPago = await empresaDb.collection('formapagos').countDocuments();
        console.log(`   💳 Formas de Pago: ${formasPago}`);

        // Verificar series de documentos
        const series = await empresaDb.collection('seriedocumentos').countDocuments();
        console.log(`   📄 Series de Documentos: ${series}`);

        // Verificar dashboards
        const dashboards = await empresaDb.collection('dashboards').countDocuments();
        console.log(`   📊 Dashboards: ${dashboards}`);

        await empresaConn.close();
      } catch (error: any) {
        console.log(`   ❌ Error conectando a BD de empresa: ${error.message}`);
      }
    }
  }

  await mongoose.disconnect();
}

checkEmpresaData();
