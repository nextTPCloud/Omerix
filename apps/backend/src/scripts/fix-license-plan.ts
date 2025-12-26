/**
 * Script para verificar y corregir licencias que apuntan al plan incorrecto
 *
 * Uso: npx ts-node src/scripts/fix-license-plan.ts
 *
 * Opciones:
 *   --empresa=<nombreONif>  Buscar empresa específica
 *   --fix                   Aplicar correcciones (sin esto solo muestra info)
 *   --plan=<slug>           Plan destino para la corrección
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde el directorio del backend
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function fixLicensePlan() {
  try {
    const args = process.argv.slice(2);
    const empresaFilter = args.find(a => a.startsWith('--empresa='))?.split('=')[1];
    const planDestino = args.find(a => a.startsWith('--plan='))?.split('=')[1];
    const applyFix = args.includes('--fix');

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';
    console.log(`Conectando a: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

    await mongoose.connect(mongoUri);
    console.log('Conectado a MongoDB\n');

    const db = mongoose.connection.db!;

    // Listar colecciones para debug
    const collections = await db.listCollections().toArray();
    console.log('Colecciones disponibles:', collections.map(c => c.name).join(', '), '\n');

    // Obtener todos los planes
    const planes = await db.collection('plans').find({}).toArray();
    console.log('Planes disponibles:');
    planes.forEach(p => {
      console.log(`  - ${p.nombre} (${p.slug}): ${p.modulosIncluidos?.length || 0} modulos`);
    });
    console.log('');

    // Buscar licencias
    let licenciaFilter: any = {};
    if (empresaFilter) {
      // Buscar empresa por nombre o NIF
      const empresa = await db.collection('empresas').findOne({
        $or: [
          { nombre: { $regex: empresaFilter, $options: 'i' } },
          { nif: empresaFilter.toUpperCase() },
        ]
      });
      if (empresa) {
        licenciaFilter.empresaId = empresa._id;
        console.log(`Empresa encontrada: ${empresa.nombre} (${empresa.nif})\n`);
      } else {
        console.log(`No se encontro empresa con: ${empresaFilter}\n`);
        return;
      }
    }

    const licencias = await db.collection('licencias').find(licenciaFilter).toArray();
    console.log(`Encontradas ${licencias.length} licencias:\n`);

    for (const licencia of licencias) {
      const empresa = await db.collection('empresas').findOne({ _id: licencia.empresaId });
      const planActual = planes.find(p => p._id.toString() === licencia.planId?.toString());

      console.log(`-------------------------------------------`);
      console.log(`Empresa: ${empresa?.nombre || 'N/A'} (${empresa?.nif || 'N/A'})`);
      console.log(`Estado licencia: ${licencia.estado}`);
      console.log(`Es trial: ${licencia.esTrial ? 'Si' : 'No'}`);
      console.log(`Plan actual: ${planActual?.nombre || 'NO ENCONTRADO'} (${planActual?.slug || 'N/A'})`);
      console.log(`PlanId en licencia: ${licencia.planId?.toString() || 'N/A'}`);

      if (planActual) {
        console.log(`Modulos del plan: ${planActual.modulosIncluidos?.join(', ') || 'ninguno'}`);
      }

      // Si el plan NO existe (planId huerfano)
      if (!planActual && licencia.planId) {
        console.log(`\n[!] PROBLEMA CRITICO: Plan no encontrado - planId huerfano`);

        if (applyFix && planDestino) {
          const nuevoPlan = planes.find(p => p.slug === planDestino);
          if (nuevoPlan) {
            await db.collection('licencias').updateOne(
              { _id: licencia._id },
              {
                $set: {
                  planId: nuevoPlan._id,
                  updatedAt: new Date(),
                },
                $push: {
                  historial: {
                    fecha: new Date(),
                    accion: 'CAMBIO_PLAN',
                    planAnterior: `ID huerfano: ${licencia.planId}`,
                    planNuevo: nuevoPlan.nombre,
                    motivo: 'Correccion manual - planId apuntaba a plan inexistente',
                  }
                } as any
              }
            );
            console.log(`[OK] CORREGIDO: Asignado plan ${nuevoPlan.nombre}`);
          } else {
            console.log(`[ERROR] Plan destino "${planDestino}" no encontrado`);
          }
        } else if (!applyFix) {
          console.log(`   Para corregir, ejecuta:`);
          console.log(`   npx ts-node src/scripts/fix-license-plan.ts --empresa="${empresa?.nif}" --plan=starter --fix`);
        }
      }

      // Si es plan Demo y no deberia serlo
      if (planActual?.slug === 'demo' && !licencia.esTrial) {
        console.log(`\n[!] PROBLEMA: Licencia activa con plan Demo (deberia ser un plan de pago)`);

        if (applyFix && planDestino) {
          const nuevoPlan = planes.find(p => p.slug === planDestino);
          if (nuevoPlan) {
            await db.collection('licencias').updateOne(
              { _id: licencia._id },
              {
                $set: {
                  planId: nuevoPlan._id,
                  updatedAt: new Date(),
                },
                $push: {
                  historial: {
                    fecha: new Date(),
                    accion: 'CAMBIO_PLAN',
                    planAnterior: planActual.nombre,
                    planNuevo: nuevoPlan.nombre,
                    motivo: 'Correccion manual - licencia apuntaba a plan Demo',
                  }
                } as any
              }
            );
            console.log(`[OK] CORREGIDO: Cambiado a plan ${nuevoPlan.nombre}`);
          } else {
            console.log(`[ERROR] Plan destino "${planDestino}" no encontrado`);
          }
        } else if (!applyFix) {
          console.log(`   Para corregir, ejecuta:`);
          console.log(`   npx ts-node src/scripts/fix-license-plan.ts --empresa="${empresa?.nif}" --plan=solo-fichaje --fix`);
        }
      }
      console.log('');
    }

    if (!applyFix) {
      console.log('-------------------------------------------');
      console.log('MODO LECTURA - No se aplicaron cambios');
      console.log('Usa --fix para aplicar correcciones');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB');
  }
}

fixLicensePlan();
