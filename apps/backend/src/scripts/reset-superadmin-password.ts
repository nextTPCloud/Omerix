import mongoose from 'mongoose';
import Usuario from '../modules/usuarios/Usuario';
import { config } from '../config/env';
import { logger } from '../config/logger';

/**
 * Script para resetear la contraseña del superadmin
 * Ejecutar: npx ts-node src/scripts/reset-superadmin-password.ts
 */
async function resetSuperadminPassword() {
  const NUEVA_PASSWORD = '123456'; // Cambiar después del primer login

  try {
    logger.info('🔐 Reseteando contraseña del superadmin...\n');

    // Conectar a DB principal
    await mongoose.connect(config.database.uri);
    logger.info('✅ Conectado a DB principal\n');

    // Buscar superadmin
    const superadmin = await Usuario.findOne({ rol: 'superadmin' });

    if (!superadmin) {
      logger.error('❌ No se encontró usuario superadmin');
      logger.info('   Ejecuta primero: npx ts-node src/scripts/seed-superadmin.ts');
      return;
    }

    logger.info(`📧 Usuario encontrado: ${superadmin.email}`);
    logger.info(`👤 Nombre: ${superadmin.nombre} ${superadmin.apellidos}`);

    // Actualizar contraseña (el modelo la hashea automáticamente)
    superadmin.password = NUEVA_PASSWORD;
    await superadmin.save();

    logger.info('\n✅ Contraseña reseteada exitosamente');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`   Email: ${superadmin.email}`);
    logger.info(`   Nueva contraseña: ${NUEVA_PASSWORD}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('\n⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');

  } catch (error: any) {
    logger.error('❌ Error reseteando contraseña:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('\n🔌 Conexión cerrada');
  }
}

// Ejecutar
if (require.main === module) {
  resetSuperadminPassword()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default resetSuperadminPassword;
