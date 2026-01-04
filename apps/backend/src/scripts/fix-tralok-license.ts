// apps/backend/src/scripts/fix-tralok-license.ts
// Corrige la licencia de TRALOK para asignarle el plan Demo
// Ejecutar: npx tsx src/scripts/fix-tralok-license.ts

import mongoose from 'mongoose';
import { config } from '../config/env';

// Registrar modelos
import '../modules/licencias/Plan';
import '../modules/licencias/AddOn';
import '../modules/empresa/Empresa';
import Licencia from '../modules/licencias/Licencia';
import Plan from '../modules/licencias/Plan';
import Empresa from '../modules/empresa/Empresa';

async function fixTralokLicense() {
  try {
    console.log('Conectando a BD...\n');
    await mongoose.connect(config.database.uri);

    // Buscar el plan Demo
    const planDemo = await Plan.findOne({ slug: 'demo' });
    if (!planDemo) {
      console.log('❌ Plan Demo no encontrado. Ejecuta npm run seed:plans primero.');
      return;
    }
    console.log(`✓ Plan Demo encontrado: ${planDemo._id}\n`);

    // Buscar empresa TRALOK
    const empresa = await Empresa.findOne({ nombre: /tralok/i });
    if (!empresa) {
      console.log('❌ Empresa TRALOK no encontrada.');
      return;
    }
    console.log(`✓ Empresa encontrada: ${empresa.nombre} (${empresa._id})\n`);

    // Buscar licencia
    const licencia = await Licencia.findOne({ empresaId: empresa._id });
    if (!licencia) {
      console.log('❌ Licencia no encontrada para TRALOK.');
      return;
    }

    console.log(`Licencia actual:`);
    console.log(`  - Estado: ${licencia.estado}`);
    console.log(`  - PlanId: ${licencia.planId || 'ninguno'}`);
    console.log(`  - AddOns: ${licencia.addOns?.length || 0}`);

    // Actualizar licencia con plan Demo
    licencia.planId = planDemo._id;
    licencia.estado = 'activa';
    await licencia.save();

    console.log(`\n✓ Licencia actualizada con plan Demo`);

    // Verificar
    const licenciaActualizada = await Licencia.findById(licencia._id)
      .populate('planId', 'nombre modulosIncluidos');

    const plan = licenciaActualizada?.planId as any;
    console.log(`\nLicencia después de actualizar:`);
    console.log(`  - Plan: ${plan?.nombre}`);
    console.log(`  - Módulos incluidos: ${plan?.modulosIncluidos?.join(', ')}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConexión cerrada.');
  }
}

fixTralokLicense();
