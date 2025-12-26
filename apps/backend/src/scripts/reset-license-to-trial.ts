/**
 * Script para resetear una licencia a estado trial (para pruebas)
 *
 * Uso: npx ts-node src/scripts/reset-license-to-trial.ts [empresaId]
 * Si no se pasa empresaId, resetea la primera licencia encontrada
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import Licencia from '../modules/licencias/Licencia';
import Plan from '../modules/licencias/Plan';
// Importar Empresa para que Mongoose registre el schema
import '../modules/empresa/Empresa';

async function resetLicenseToTrial() {
  const empresaIdArg = process.argv[2];

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Buscar plan demo (tiene todos los módulos para trial)
    let planDemo = await Plan.findOne({ slug: 'demo', activo: true });

    // Si no existe el demo, buscar el básico
    if (!planDemo) {
      planDemo = await Plan.findOne({ slug: 'basico', activo: true });
    }

    if (!planDemo) {
      console.error('❌ No se encontró plan demo ni básico');

      // Mostrar planes disponibles
      const planes = await Plan.find({ activo: true });
      console.log('Planes disponibles:');
      planes.forEach(p => console.log(`  - ${p.slug}: ${p.nombre}`));
      process.exit(1);
    }

    const planBasico = planDemo; // Para mantener compatibilidad con el resto del código

    // Buscar licencia
    let licencia;
    if (empresaIdArg) {
      licencia = await Licencia.findOne({ empresaId: empresaIdArg }).populate('planId');
    } else {
      licencia = await Licencia.findOne().populate('planId');
    }

    if (!licencia) {
      console.error('❌ No se encontró ninguna licencia');
      process.exit(1);
    }

    const planAnterior = licencia.planId as any;

    console.log('');
    console.log('📋 Licencia encontrada:');
    console.log(`   Empresa ID: ${licencia.empresaId}`);
    console.log(`   Plan actual: ${planAnterior?.nombre || 'Sin plan'}`);
    console.log(`   Estado: ${licencia.estado}`);
    console.log(`   Es trial: ${licencia.esTrial}`);
    console.log('');

    // Resetear a trial
    licencia.planId = planBasico._id as any;
    licencia.estado = 'trial';
    licencia.esTrial = true;
    licencia.fechaInicioTrial = new Date();
    licencia.fechaFinTrial = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
    licencia.paypalSubscriptionId = undefined;
    licencia.stripeSubscriptionId = undefined;

    // Añadir al historial
    licencia.historial.push({
      fecha: new Date(),
      accion: 'RESET_TRIAL',
      planAnterior: planAnterior?.nombre,
      planNuevo: planBasico.nombre,
      motivo: 'Reset a trial para pruebas',
    });

    await licencia.save();

    console.log('✅ Licencia reseteada a trial');
    console.log(`   Plan: ${planBasico.nombre}`);
    console.log(`   Estado: trial`);
    console.log(`   Días restantes: 30`);
    console.log('');
    console.log('Ahora puedes probar el flujo de pago completo.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

resetLicenseToTrial();
