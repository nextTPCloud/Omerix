/**
 * Script de migración para recalcular fichajes existentes
 *
 * Este script:
 * 1. Obtiene todos los fichajes cerrados/aprobados
 * 2. Para cada fichaje, recalcula los campos de validación:
 *    - turnoId y turnoNombre
 *    - horasTeoricas
 *    - minutosRetraso
 *    - minutosAnticipacion
 *    - esFestivoTrabajado y festivoNombre
 *    - horasExtra
 *    - incidenciaTipo
 *    - validado
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register src/scripts/migrateFichajesValidacion.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Empresa, { IDatabaseConfig } from '../models/Empresa';
import { getModeloFichaje, IFichaje } from '../modules/fichajes/Fichaje';
import { ValidacionFichajeService } from '../modules/fichajes/validacion-fichaje.service';
import { getModeloTurno } from '../modules/turnos/Turno';

// ============================================
// CONEXIÓN A MONGODB
// ============================================

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';

  await mongoose.connect(mongoUri);
  console.log('✓ Conectado a MongoDB:', mongoUri);
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function migrateFichajes() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MIGRACIÓN DE FICHAJES - VALIDACIÓN');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    await connectDB();

    // Obtener todas las empresas
    const empresas = await Empresa.find({ estado: 'activa' });
    console.log(`Empresas encontradas: ${empresas.length}`);
    console.log('');

    for (const empresa of empresas) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`  Empresa: ${empresa.nombre} (${empresa.nif})`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      const empresaId = empresa._id as mongoose.Types.ObjectId;
      const dbConfig: IDatabaseConfig = empresa.databaseConfig;

      try {
        const Fichaje = await getModeloFichaje(empresaId, dbConfig);
        const Turno = await getModeloTurno(empresaId, dbConfig);
        const validacionService = new ValidacionFichajeService(empresaId, dbConfig);

        // Obtener fichajes que no están validados o sin turnoId
        const fichajes = await Fichaje.find({
          $or: [
            { validado: { $ne: true } },
            { turnoId: { $exists: false } },
            { horasTeoricas: { $exists: false } }
          ],
          estado: { $in: ['cerrado', 'aprobado'] }
        });

        console.log(`  Fichajes a procesar: ${fichajes.length}`);

        if (fichajes.length === 0) {
          console.log('  ✓ No hay fichajes pendientes de migrar');
          continue;
        }

        let procesados = 0;
        let errores = 0;

        for (const fichaje of fichajes) {
          try {
            const personalId = fichaje.personalId.toString();
            const fecha = fichaje.fecha;

            // Obtener turno aplicable
            const { turno, origen } = await validacionService.obtenerTurnoAplicable(personalId, fecha);

            // Verificar festivo
            const festivoInfo = await validacionService.esFestivoParaEmpleado(personalId, fecha);

            // Calcular campos de validación
            let horasTeoricas = 0;
            let minutosRetraso = 0;
            let minutosAnticipacion = 0;
            let incidenciaTipo: string | undefined;

            if (turno) {
              fichaje.turnoId = turno._id;
              fichaje.turnoNombre = turno.nombre;

              const esDiaLaboral = validacionService.esDiaLaboral(turno, fecha);

              if (!festivoInfo.esFestivo && esDiaLaboral) {
                horasTeoricas = turno.horasTeoricas;

                // Calcular retraso
                if (fichaje.horaEntrada) {
                  const tolerancia = await validacionService.obtenerToleranciaRetraso(personalId);
                  minutosRetraso = validacionService.calcularRetraso(
                    fichaje.horaEntrada,
                    turno.horaEntrada,
                    tolerancia
                  );
                  if (minutosRetraso > 0) {
                    incidenciaTipo = 'retraso';
                  }
                }

                // Calcular anticipación
                if (fichaje.horaSalida) {
                  minutosAnticipacion = validacionService.calcularAnticipacion(
                    fichaje.horaSalida,
                    turno.horaSalida
                  );
                  if (minutosAnticipacion > 0 && !incidenciaTipo) {
                    incidenciaTipo = 'salida_anticipada';
                  }
                }
              }
            }

            // Actualizar campos de festivo
            fichaje.esFestivoTrabajado = festivoInfo.esFestivo;
            if (festivoInfo.esFestivo && festivoInfo.festivo) {
              fichaje.festivoNombre = festivoInfo.festivo.nombre;
              incidenciaTipo = incidenciaTipo || 'festivo';
            }

            // Actualizar campos de validación
            fichaje.horasTeoricas = horasTeoricas;
            fichaje.minutosRetraso = minutosRetraso;
            fichaje.minutosAnticipacion = minutosAnticipacion;
            fichaje.incidenciaTipo = incidenciaTipo as any;
            fichaje.validado = !!turno;

            // Recalcular horas extra
            if (fichaje.horasTrabajadas) {
              if (fichaje.esFestivoTrabajado) {
                // Festivo: 100% de las horas son extra
                fichaje.horasExtra = fichaje.horasTrabajadas;
              } else if (horasTeoricas > 0) {
                // Normal: solo el exceso
                const diferencia = fichaje.horasTrabajadas - horasTeoricas;
                fichaje.horasExtra = diferencia > 0 ? Math.round(diferencia * 100) / 100 : 0;
              }
            }

            await fichaje.save();
            procesados++;

            // Mostrar progreso cada 100 fichajes
            if (procesados % 100 === 0) {
              console.log(`    Procesados: ${procesados}/${fichajes.length}`);
            }
          } catch (err) {
            errores++;
            console.error(`    ✗ Error en fichaje ${fichaje._id}:`, err);
          }
        }

        console.log('');
        console.log(`  ✓ Procesados: ${procesados}`);
        if (errores > 0) {
          console.log(`  ✗ Errores: ${errores}`);
        }
      } catch (err) {
        console.error(`  ✗ Error procesando empresa:`, err);
      }
    }

    console.log('\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('  MIGRACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('Error fatal en migración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Desconectado de MongoDB');
  }
}

// ============================================
// EJECUTAR
// ============================================

migrateFichajes()
  .then(() => {
    console.log('\nMigración finalizada.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en migración:', err);
    process.exit(1);
  });
