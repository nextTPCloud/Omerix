/**
 * Script para verificar la licencia del registro más reciente
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkNewLicense() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB\n');

    const db = mongoose.connection.db!;

    // Buscar la empresa más reciente
    const empresas = await db.collection('empresas')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    if (empresas.length === 0) {
      console.log('No hay empresas registradas');
      return;
    }

    const empresa = empresas[0];
    console.log('=== EMPRESA ===');
    console.log('  ID:', empresa._id.toString());
    console.log('  Nombre:', empresa.nombre);
    console.log('  NIF:', empresa.nif);
    console.log('  DB:', empresa.databaseConfig?.name);
    console.log('');

    // Buscar usuario admin
    const usuarios = await db.collection('usuarios')
      .find({ empresaId: empresa._id })
      .toArray();

    console.log('=== USUARIOS ===');
    usuarios.forEach(u => {
      console.log(`  - ${u.email} (rol: ${u.rol})`);
    });
    console.log('');

    // Buscar licencia
    const licencia = await db.collection('licencias')
      .findOne({ empresaId: empresa._id });

    if (!licencia) {
      console.log('ERROR: No se encontró licencia para esta empresa');
      return;
    }

    console.log('=== LICENCIA ===');
    console.log('  ID:', licencia._id.toString());
    console.log('  Estado:', licencia.estado);
    console.log('  Es trial:', licencia.esTrial);
    console.log('  Plan ID:', licencia.planId?.toString());
    console.log('');

    // Buscar el plan
    if (licencia.planId) {
      const plan = await db.collection('plans')
        .findOne({ _id: licencia.planId });

      if (plan) {
        console.log('=== PLAN ===');
        console.log('  Nombre:', plan.nombre);
        console.log('  Slug:', plan.slug);
        console.log('  Activo:', plan.activo);
        console.log('  Visible:', plan.visible);
        console.log('');
        console.log('  Módulos incluidos:');
        plan.modulosIncluidos.forEach((m: string) => {
          console.log(`    - ${m}`);
        });
        console.log('');
        console.log('  Total módulos:', plan.modulosIncluidos.length);
      } else {
        console.log('ERROR: Plan no encontrado con ID:', licencia.planId.toString());

        // Mostrar todos los planes
        const planes = await db.collection('plans').find({}).toArray();
        console.log('\nPlanes disponibles:');
        planes.forEach(p => {
          console.log(`  - ${p.nombre} (${p.slug}): ${p._id.toString()}`);
          console.log(`    Módulos: ${p.modulosIncluidos?.length || 0}`);
        });
      }
    }

    // Verificar datos en la base de datos del tenant
    const tenantDbName = empresa.databaseConfig?.name;
    if (tenantDbName) {
      console.log('\n=== DATOS INICIALES (Tenant DB) ===');
      const tenantDb = mongoose.connection.useDb(tenantDbName);

      const tiposImpuesto = await tenantDb.collection('tipoimpuestos').countDocuments();
      const formasPago = await tenantDb.collection('formapagos').countDocuments();
      const seriesDoc = await tenantDb.collection('seriedocumentos').countDocuments();

      console.log('  Tipos de impuesto:', tiposImpuesto);
      console.log('  Formas de pago:', formasPago);
      console.log('  Series de documentos:', seriesDoc);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkNewLicense();
