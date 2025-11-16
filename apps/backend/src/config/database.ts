import mongoose from 'mongoose';
import { config } from './env';
import { logger } from './logger';
import { databaseManager } from '../services/database-manager.service';

/**
 * Conectar a MongoDB Principal (usuarios, empresas, licencias, planes, pagos)
 * con reintentos automáticos
 */
export const connectDB = async (): Promise<void> => {
  const maxRetries = 5;
  let retries = 0;

  const connect = async (): Promise<void> => {
    try {
      // Conectar a la base de datos PRINCIPAL
      const conn = await mongoose.connect(config.database.uri);

      logger.info('✅ MongoDB PRINCIPAL conectado correctamente', {
        host: conn.connection.host,
        database: conn.connection.name,
      });

      // Registrar la conexión principal en el DatabaseManager
      databaseManager.setMainConnection(conn.connection);

      // Eventos de conexión
      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️  MongoDB PRINCIPAL desconectado');
      });

      mongoose.connection.on('error', (error) => {
        logger.error('❌ Error en MongoDB PRINCIPAL:', error);
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 MongoDB PRINCIPAL reconectado');
      });

    } catch (error) {
      retries++;
      logger.error(`❌ Error conectando a MongoDB PRINCIPAL (intento ${retries}/${maxRetries}):`, error);

      if (retries < maxRetries) {
        logger.info(`🔄 Reintentando conexión en 5 segundos...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return connect();
      } else {
        logger.error('❌ No se pudo conectar a MongoDB PRINCIPAL después de múltiples intentos');
        process.exit(1);
      }
    }
  };

  await connect();
};

/**
 * Desconectar de MongoDB (principal y todas las empresas)
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    // Primero cerrar todas las conexiones de empresas
    await databaseManager.closeAllEmpresaConnections();

    // Luego cerrar la conexión principal
    await mongoose.connection.close();
    logger.info('✅ MongoDB PRINCIPAL desconectado correctamente');
  } catch (error) {
    logger.error('❌ Error desconectando MongoDB:', error);
    throw error;
  }
};

// Cerrar conexión cuando la app se cierra
process.on('SIGINT', async () => {
  await disconnectDB();
  console.log('🛑 Todas las conexiones MongoDB cerradas por terminación de app');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  console.log('🛑 Todas las conexiones MongoDB cerradas por SIGTERM');
  process.exit(0);
});

export default { connectDB, disconnectDB };