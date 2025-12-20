import mongoose from 'mongoose';
import Empresa from '../modules/empresa/Empresa';
import { Cliente } from '../modules/clientes/Cliente';
import { databaseManager } from '../services/database-manager.service';
import { DatabaseManagerService } from '../services/database-manager.service';
import { config } from '../config/env';
import { logger } from '../config/logger';

/**
 * Script de migración de arquitectura multi-tenant (una DB con empresaId)
 * a arquitectura multi-base de datos (una DB por empresa)
 */
async function migrateToMultiDB() {
  try {
    logger.info('🚀 Iniciando migración a arquitectura multi-base de datos...\n');

    // 1. Conectar a DB principal
    await mongoose.connect(config.database.uri);
    logger.info('✅ Conectado a DB principal');

    // Registrar conexión principal
    databaseManager.setMainConnection(mongoose.connection);

    // 2. Obtener todas las empresas
    const empresas = await Empresa.find({});
    logger.info(`📊 Encontradas ${empresas.length} empresas para migrar\n`);

    if (empresas.length === 0) {
      logger.warn('⚠️  No se encontraron empresas para migrar');
      return;
    }

    let empresasMigradas = 0;
    let clientesTotalesMigrados = 0;

    for (const empresa of empresas) {
      try {
        logger.info(`\n${'='.repeat(60)}`);
        logger.info(`🏢 Procesando empresa: ${empresa.nombre}`);
        logger.info(`   ID: ${empresa._id}`);
        logger.info(`   Estado: ${empresa.estado}`);
        logger.info(`${'='.repeat(60)}\n`);

        // 3. Verificar si ya tiene configuración de DB
        if (empresa.databaseConfig && empresa.databaseConfig.name) {
          logger.warn(`⏭️  Empresa ${empresa.nombre} ya tiene configuración de DB, saltando...`);
          continue;
        }

        // 4. Generar configuración de DB para esta empresa
        const dbConfig = DatabaseManagerService.generateDatabaseConfig(
          String(empresa._id),
          {
            host: process.env.MONGODB_HOST || 'localhost',
            port: parseInt(process.env.MONGODB_PORT || '27017'),
            user: process.env.MONGODB_USER,
            password: process.env.MONGODB_PASSWORD,
          }
        );

        logger.info(`🔧 Configuración de DB generada:`);
        logger.info(`   Nombre: ${dbConfig.name}`);
        logger.info(`   Host: ${dbConfig.host}:${dbConfig.port}`);

        // 5. Guardar dbConfig en la empresa
        empresa.databaseConfig = dbConfig;
        await empresa.save();
        logger.info(`💾 Configuración guardada en el modelo Empresa\n`);

        // 6. Inicializar DB de la empresa (crea la conexión)
        await databaseManager.initializeEmpresaDatabase(
          String(empresa._id),
          dbConfig
        );

        // 7. MIGRAR CLIENTES
        logger.info(`📦 Migrando clientes...`);
        const clientesAntiguos = await Cliente.find({ empresaId: empresa._id }).lean();
        logger.info(`   Encontrados: ${clientesAntiguos.length} clientes`);

        if (clientesAntiguos.length > 0) {
          const ClienteModel = await databaseManager.getModel(
            String(empresa._id),
            dbConfig,
            'Cliente',
            Cliente.schema
          );

          // Limpiar cualquier dato existente en la nueva DB (por si se ejecutó antes)
          await ClienteModel.deleteMany({});

          // Insertar en la nueva DB
          await ClienteModel.insertMany(clientesAntiguos);
          logger.info(`   ✅ ${clientesAntiguos.length} clientes migrados correctamente`);

          clientesTotalesMigrados += clientesAntiguos.length;
        }

        // 8. MIGRAR CONFIGURACIÓN DE USUARIO
        // (Si existe el modelo)
        try {
          const ConfiguracionUsuario = require('../modules/configuracion-usuario/ConfiguracionUsuario').default;
          if (ConfiguracionUsuario) {
            logger.info(`📦 Migrando configuraciones de usuario...`);
            const configsAntiguas = await ConfiguracionUsuario.find({ empresaId: empresa._id }).lean();
            logger.info(`   Encontrados: ${configsAntiguas.length} configuraciones`);

            if (configsAntiguas.length > 0) {
              const ConfigModel = await databaseManager.getModel(
                String(empresa._id),
                dbConfig,
                'ConfiguracionUsuario',
                ConfiguracionUsuario.schema
              );

              await ConfigModel.deleteMany({});
              await ConfigModel.insertMany(configsAntiguas);
              logger.info(`   ✅ ${configsAntiguas.length} configuraciones migradas`);
            }
          }
        } catch (err) {
          logger.warn(`   ⚠️  No se pudo migrar ConfiguracionUsuario (puede no existir)`);
        }

        // 9. MIGRAR VISTAS GUARDADAS
        // (Si existe el modelo)
        try {
          const VistaGuardada = require('../modules/vistasGuardadas/VistaGuardada').default;
          if (VistaGuardada) {
            logger.info(`📦 Migrando vistas guardadas...`);
            const vistasAntiguas = await VistaGuardada.find({ empresaId: empresa._id }).lean();
            logger.info(`   Encontrados: ${vistasAntiguas.length} vistas`);

            if (vistasAntiguas.length > 0) {
              const VistaModel = await databaseManager.getModel(
                String(empresa._id),
                dbConfig,
                'VistaGuardada',
                VistaGuardada.schema
              );

              await VistaModel.deleteMany({});
              await VistaModel.insertMany(vistasAntiguas);
              logger.info(`   ✅ ${vistasAntiguas.length} vistas migradas`);
            }
          }
        } catch (err) {
          logger.warn(`   ⚠️  No se pudo migrar VistaGuardada (puede no existir)`);
        }

        // 10. MIGRAR PRODUCTOS
        // (Si existe el modelo)
        try {
          const Producto = require('../models/Producto').default;
          if (Producto) {
            logger.info(`📦 Migrando productos...`);
            const productosAntiguos = await Producto.find({ empresaId: empresa._id }).lean();
            logger.info(`   Encontrados: ${productosAntiguos.length} productos`);

            if (productosAntiguos.length > 0) {
              const ProductoModel = await databaseManager.getModel(
                String(empresa._id),
                dbConfig,
                'Producto',
                Producto.schema
              );

              await ProductoModel.deleteMany({});
              await ProductoModel.insertMany(productosAntiguos);
              logger.info(`   ✅ ${productosAntiguos.length} productos migrados`);
            }
          }
        } catch (err) {
          logger.warn(`   ⚠️  No se pudo migrar Producto (puede no existir)`);
        }

        // NOTA: Añade aquí más modelos que necesites migrar
        // siguiendo el mismo patrón que arriba

        empresasMigradas++;
        logger.info(`\n✅ Empresa ${empresa.nombre} migrada completamente\n`);

        // Cerrar conexión de esta empresa para liberar recursos
        await databaseManager.closeEmpresaConnection(String(empresa._id));

      } catch (error: any) {
        logger.error(`\n❌ Error migrando empresa ${empresa.nombre}:`, error.message);
        logger.error(error.stack);
        // Continuar con la siguiente empresa
      }
    }

    // Resumen final
    logger.info(`\n\n${'='.repeat(60)}`);
    logger.info(`🎉 ¡MIGRACIÓN COMPLETADA!`);
    logger.info(`${'='.repeat(60)}`);
    logger.info(`📊 Empresas migradas: ${empresasMigradas}/${empresas.length}`);
    logger.info(`👥 Clientes migrados: ${clientesTotalesMigrados}`);
    logger.info(`${'='.repeat(60)}\n`);

    logger.info(`⚠️  IMPORTANTE:`);
    logger.info(`   1. Verifica que los datos se migraron correctamente`);
    logger.info(`   2. Haz un backup de la base de datos antigua`);
    logger.info(`   3. Actualiza los controladores para usar req.empresaDbConfig`);
    logger.info(`   4. Prueba la aplicación con varias empresas`);
    logger.info(`   5. Solo después, puedes eliminar los datos antiguos\n`);

    // Mostrar info de conexiones
    const connectionsInfo = databaseManager.getConnectionsInfo();
    logger.info(`🔌 Conexiones activas: ${connectionsInfo.total}`);

  } catch (error: any) {
    logger.error('\n❌ Error CRÍTICO en migración:', error.message);
    logger.error(error.stack);
    throw error;
  } finally {
    // Cerrar todas las conexiones
    logger.info('\n🔌 Cerrando conexiones...');
    await mongoose.connection.close();
    await databaseManager.closeAllEmpresaConnections();
    logger.info('✅ Todas las conexiones cerradas');
  }
}

// Ejecutar con manejo de errores
if (require.main === module) {
  migrateToMultiDB()
    .then(() => {
      logger.info('\n✅ Script finalizado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n❌ Script finalizado con errores');
      console.error(error);
      process.exit(1);
    });
}

export default migrateToMultiDB;