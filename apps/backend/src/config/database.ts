import mongoose from 'mongoose';
import { config } from './env';
import { logger } from './logger';

/**
 * Conectar a MongoDB con reintentos automáticos
 */
export const connectDB = async (): Promise<void> => {
  const maxRetries = 5;
  let retries = 0;

  const connect = async (): Promise<void> => {
    try {
      const conn = await mongoose.connect(config.database.uri);
      
      logger.info('✅ MongoDB conectado correctamente', {
        host: conn.connection.host,
        database: conn.connection.name,
      });

      // Eventos de conexión
      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️  MongoDB desconectado');
      });

      mongoose.connection.on('error', (error) => {
        logger.error('❌ Error en MongoDB:', error);
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 MongoDB reconectado');
      });

    } catch (error) {
      retries++;
      logger.error(`❌ Error conectando a MongoDB (intento ${retries}/${maxRetries}):`, error);

      if (retries < maxRetries) {
        logger.info(`🔄 Reintentando conexión en 5 segundos...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return connect();
      } else {
        logger.error('❌ No se pudo conectar a MongoDB después de múltiples intentos');
        process.exit(1);
      }
    }
  };

  await connect();
};

/**
 * Desconectar de MongoDB
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('✅ MongoDB desconectado correctamente');
  } catch (error) {
    logger.error('❌ Error desconectando MongoDB:', error);
    throw error;
  }
};

// Cerrar conexión cuando la app se cierra
process.on('SIGINT', async () => {
  await disconnectDB();
  console.log('🛑 Conexión MongoDB cerrada por terminación de app');
  process.exit(0);
});

export default { connectDB, disconnectDB };