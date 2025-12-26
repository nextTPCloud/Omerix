/**
 * Script para corregir la licencia de una empresa a plan Demo
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixLicenseToDemo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB\n');

    const db = mongoose.connection.db!;

    // Buscar el plan Demo
    const planDemo = await db.collection('plans').findOne({ slug: 'demo' });
    if (!planDemo) {
      console.log('ERROR: Plan Demo no encontrado');
      return;
    }

    console.log('Plan Demo encontrado:');
    console.log('  ID:', planDemo._id.toString());
    console.log('  Nombre:', planDemo.nombre);
    console.log('  Módulos:', planDemo.modulosIncluidos.length);
    console.log('');

    // Buscar la empresa más reciente
    const empresa = await db.collection('empresas')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    if (empresa.length === 0) {
      console.log('No hay empresas');
      return;
    }

    const emp = empresa[0];
    console.log('Empresa:', emp.nombre);

    // Actualizar la licencia
    const result = await db.collection('licencias').updateOne(
      { empresaId: emp._id },
      {
        $set: {
          planId: planDemo._id,
          estado: 'trial',
          esTrial: true,
          fechaInicioTrial: new Date(),
          fechaFinTrial: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }
    );

    // Añadir al historial
    await db.collection('licencias').updateOne(
      { empresaId: emp._id },
      {
        $push: {
          historial: {
            fecha: new Date(),
            accion: 'CORRECCION',
            planNuevo: planDemo.nombre,
            motivo: 'Corrección: asignar plan Demo para trial',
          } as any
        } as any
      }
    );

    console.log('');
    console.log('Resultado:', result.modifiedCount > 0 ? 'OK' : 'Sin cambios');
    console.log('');
    console.log('Licencia actualizada a plan Demo con todos los módulos.');
    console.log('El usuario debe cerrar sesión y volver a entrar.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixLicenseToDemo();
