// apps/backend/src/scripts/check-license-modules.ts
// Ejecutar: npx tsx src/scripts/check-license-modules.ts

import mongoose from 'mongoose';
import { config } from '../config/env';

// Registrar modelos antes de usar populate
import '../modules/licencias/Plan';
import '../modules/licencias/AddOn';
import '../modules/empresa/Empresa';
import Licencia from '../modules/licencias/Licencia';
import AddOn from '../modules/licencias/AddOn';

async function checkLicenseModules() {
  try {
    console.log('Conectando a BD...\n');
    await mongoose.connect(config.database.uri);

    // Buscar todas las licencias activas
    const licencias = await Licencia.find({ estado: { $in: ['activa', 'trial'] } })
      .populate('planId')
      .populate('empresaId', 'nombre')
      .lean();

    console.log(`Encontradas ${licencias.length} licencia(s) activa(s):\n`);

    for (const licencia of licencias) {
      const plan = licencia.planId as any;
      const empresa = licencia.empresaId as any;

      console.log('='.repeat(60));
      console.log(`Empresa: ${empresa?.nombre || 'Sin nombre'}`);
      console.log(`Plan: ${plan?.nombre || 'Sin plan'} (${plan?.slug || '-'})`);
      console.log(`Estado: ${licencia.estado}`);
      console.log('');

      // Módulos del plan
      const modulosPlan = plan?.modulosIncluidos || [];
      console.log('Módulos del plan:');
      modulosPlan.forEach((m: string) => console.log(`  - ${m}`));

      // Add-ons
      console.log('\nAdd-ons contratados:');
      if (!licencia.addOns?.length) {
        console.log('  (ninguno)');
      } else {
        for (const addon of licencia.addOns) {
          // Buscar el addon completo para ver sus módulos
          const addonCompleto = await AddOn.findById(addon.addOnId).lean();
          console.log(`  - ${addon.nombre} (${addon.slug})`);
          console.log(`    Activo: ${addon.activo}`);
          console.log(`    AddOnId: ${addon.addOnId}`);
          if (addonCompleto) {
            console.log(`    modulosIncluidos: ${addonCompleto.modulosIncluidos?.join(', ') || 'ninguno'}`);
          } else {
            console.log('    [!] AddOn no encontrado en BD - necesita actualizar referencia');
          }
        }
      }

      // Calcular módulos totales
      console.log('\nMódulos TOTALES disponibles:');
      const todosModulos = new Set(modulosPlan);
      for (const addon of (licencia.addOns || [])) {
        if (addon.activo) {
          todosModulos.add(addon.slug);
          const addonCompleto = await AddOn.findById(addon.addOnId).lean();
          if (addonCompleto?.modulosIncluidos) {
            addonCompleto.modulosIncluidos.forEach((m: string) => todosModulos.add(m));
          }
        }
      }
      Array.from(todosModulos).sort().forEach(m => console.log(`  - ${m}`));

      // Verificar si tiene RRHH
      const tieneRRHH = todosModulos.has('rrhh');
      console.log(`\n¿Tiene módulo RRHH? ${tieneRRHH ? 'SÍ' : 'NO'}`);

      if (!tieneRRHH) {
        console.log('\n[!] Para añadir RRHH, puedes:');
        console.log('    1. Cambiar al plan Demo, Profesional o Enterprise');
        console.log('    2. Contratar el addon de RRHH');
      }

      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConexión cerrada.');
  }
}

checkLicenseModules();
