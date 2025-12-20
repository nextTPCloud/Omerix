import mongoose from 'mongoose';
import Empresa from '../models/Empresa';
import { databaseManager } from '../services/database-manager.service';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { getModeloFichaje } from '../modules/fichajes/Fichaje';
import { getPersonalModel } from '../utils/dynamic-models.helper';
import { getModeloDepartamento } from '../modules/departamentos/Departamento';

/**
 * Script de migración para poblar campos desnormalizados en fichajes existentes
 * (personalNombre, personalCodigo, departamentoId, departamentoNombre)
 */
async function migrateFichajesPersonalData() {
  try {
    logger.info('🚀 Iniciando migración de datos de personal en fichajes...\n');

    // 1. Conectar a DB principal
    await mongoose.connect(config.database.uri);
    logger.info('✅ Conectado a DB principal');

    // Registrar conexión principal
    databaseManager.setMainConnection(mongoose.connection);

    // 2. Obtener todas las empresas activas
    const empresas = await Empresa.find({ estado: 'activa' });
    logger.info(`📊 Encontradas ${empresas.length} empresas activas\n`);

    if (empresas.length === 0) {
      logger.warn('⚠️  No se encontraron empresas activas');
      return;
    }

    let totalFichajesActualizados = 0;

    for (const empresa of empresas) {
      try {
        logger.info(`\n${'='.repeat(60)}`);
        logger.info(`🏢 Procesando empresa: ${empresa.nombre}`);
        logger.info(`   ID: ${empresa._id}`);
        logger.info(`${'='.repeat(60)}\n`);

        if (!empresa.databaseConfig) {
          logger.warn(`⏭️  Empresa ${empresa.nombre} no tiene configuración de DB, saltando...`);
          continue;
        }

        // Obtener modelos
        const Fichaje = await getModeloFichaje(empresa._id, empresa.databaseConfig);
        const Personal = await getPersonalModel(empresa._id.toString(), empresa.databaseConfig);
        const Departamento = await getModeloDepartamento(empresa._id, empresa.databaseConfig);

        // Buscar fichajes sin personalNombre
        const fichajesSinNombre = await Fichaje.find({
          $or: [
            { personalNombre: { $exists: false } },
            { personalNombre: null },
            { personalNombre: '' },
          ],
        });

        logger.info(`📋 Encontrados ${fichajesSinNombre.length} fichajes sin nombre de personal`);

        if (fichajesSinNombre.length === 0) {
          logger.info(`✅ Todos los fichajes ya tienen datos de personal`);
          continue;
        }

        // Crear cache de personal y departamentos para evitar queries repetidas
        const personalCache = new Map<string, any>();
        const departamentoCache = new Map<string, any>();

        let fichajesActualizados = 0;
        let fichajesError = 0;

        for (const fichaje of fichajesSinNombre) {
          try {
            const personalIdStr = fichaje.personalId.toString();

            // Buscar personal en cache o en BD
            let personal = personalCache.get(personalIdStr);
            if (!personal) {
              personal = await Personal.findById(fichaje.personalId);
              if (personal) {
                personalCache.set(personalIdStr, personal);
              }
            }

            if (!personal) {
              logger.warn(`   ⚠️ Personal no encontrado para fichaje ${fichaje._id}`);
              fichajesError++;
              continue;
            }

            // Preparar datos de actualización
            const updateData: any = {
              personalNombre: `${personal.nombre} ${personal.apellidos}`,
              personalCodigo: personal.codigo,
            };

            // Obtener departamento si existe
            const departamentoId = personal.datosLaborales?.departamentoId;
            if (departamentoId) {
              const deptoIdStr = departamentoId.toString();
              let depto = departamentoCache.get(deptoIdStr);
              if (!depto) {
                depto = await Departamento.findById(departamentoId);
                if (depto) {
                  departamentoCache.set(deptoIdStr, depto);
                }
              }

              if (depto) {
                updateData.departamentoId = departamentoId;
                updateData.departamentoNombre = depto.nombre;
              }
            }

            // Actualizar fichaje
            await Fichaje.findByIdAndUpdate(fichaje._id, updateData);
            fichajesActualizados++;

            if (fichajesActualizados % 100 === 0) {
              logger.info(`   📊 Progreso: ${fichajesActualizados}/${fichajesSinNombre.length}`);
            }
          } catch (error: any) {
            logger.error(`   ❌ Error actualizando fichaje ${fichaje._id}: ${error.message}`);
            fichajesError++;
          }
        }

        logger.info(`\n   ✅ Fichajes actualizados: ${fichajesActualizados}`);
        if (fichajesError > 0) {
          logger.warn(`   ⚠️ Fichajes con error: ${fichajesError}`);
        }

        totalFichajesActualizados += fichajesActualizados;
      } catch (error: any) {
        logger.error(`❌ Error procesando empresa ${empresa.nombre}: ${error.message}`);
      }
    }

    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`🎉 Migración completada`);
    logger.info(`📊 Total fichajes actualizados: ${totalFichajesActualizados}`);
    logger.info(`${'='.repeat(60)}\n`);
  } catch (error: any) {
    logger.error(`❌ Error fatal en migración: ${error.message}`);
    throw error;
  } finally {
    // Cerrar conexiones
    await databaseManager.closeAllEmpresaConnections();
    await mongoose.disconnect();
    logger.info('🔌 Conexiones cerradas');
  }
}

// Ejecutar script
migrateFichajesPersonalData()
  .then(() => {
    logger.info('✅ Script finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Script finalizado con errores:', error);
    process.exit(1);
  });
