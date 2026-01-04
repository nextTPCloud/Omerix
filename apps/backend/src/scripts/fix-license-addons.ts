// apps/backend/src/scripts/fix-license-addons.ts
// Corrige los addons de las licencias para que apunten a los AddOns actualizados
// Ejecutar: npx tsx src/scripts/fix-license-addons.ts

import mongoose from 'mongoose';
import { config } from '../config/env';

// Registrar modelos
import '../modules/licencias/Plan';
import '../modules/licencias/AddOn';
import '../modules/empresa/Empresa';
import Licencia from '../modules/licencias/Licencia';
import AddOn from '../modules/licencias/AddOn';

// Mapeo de slugs antiguos a nuevos
const SLUG_MAPPING: Record<string, string> = {
  'rrhh-fichaje': 'rrhh',
  'rrhh-personal': 'rrhh',
  'fichaje': 'rrhh',
  // Añadir más mappings si es necesario
};

async function fixLicenseAddons() {
  try {
    console.log('Conectando a BD...\n');
    await mongoose.connect(config.database.uri);

    // 1. Obtener todos los AddOns actuales
    const addons = await AddOn.find({}).lean();
    console.log(`Encontrados ${addons.length} AddOns en la BD\n`);

    const addonsBySlug = new Map();
    for (const addon of addons) {
      addonsBySlug.set(addon.slug, addon);
      console.log(`  - ${addon.slug}: ${addon.modulosIncluidos?.join(', ') || 'sin módulos'}`);
    }

    // 2. Buscar licencias con addOns
    const licencias = await Licencia.find({
      'addOns.0': { $exists: true }
    });

    console.log(`\nEncontradas ${licencias.length} licencia(s) con addOns\n`);

    let actualizadas = 0;
    for (const licencia of licencias) {
      let modificada = false;

      for (let i = 0; i < licencia.addOns.length; i++) {
        const addonLic = licencia.addOns[i];
        let targetSlug = addonLic.slug;

        // Verificar si necesita mapeo
        if (SLUG_MAPPING[addonLic.slug]) {
          targetSlug = SLUG_MAPPING[addonLic.slug];
          console.log(`  Mapeando slug: ${addonLic.slug} -> ${targetSlug}`);
        }

        // Buscar el AddOn correcto
        const addonCorrect = addonsBySlug.get(targetSlug);

        if (addonCorrect) {
          // Verificar si el addOnId necesita actualizarse
          const currentId = addonLic.addOnId?.toString();
          const correctId = addonCorrect._id.toString();

          if (currentId !== correctId || addonLic.slug !== targetSlug) {
            console.log(`  Actualizando addon "${addonLic.nombre}":`);
            console.log(`    - addOnId: ${currentId} -> ${correctId}`);
            console.log(`    - slug: ${addonLic.slug} -> ${targetSlug}`);
            console.log(`    - modulosIncluidos del AddOn: ${addonCorrect.modulosIncluidos?.join(', ')}`);

            licencia.addOns[i].addOnId = addonCorrect._id;
            licencia.addOns[i].slug = targetSlug;
            licencia.addOns[i].nombre = addonCorrect.nombre;
            modificada = true;
          }
        } else {
          console.log(`  [!] No se encontró AddOn con slug "${targetSlug}" para "${addonLic.nombre}"`);
        }
      }

      if (modificada) {
        await licencia.save();
        actualizadas++;
        console.log(`  ✓ Licencia actualizada\n`);
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Licencias actualizadas: ${actualizadas}`);
    console.log(`${'='.repeat(50)}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión cerrada.');
  }
}

fixLicenseAddons();
