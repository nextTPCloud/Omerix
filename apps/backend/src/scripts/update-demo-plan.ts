import mongoose from 'mongoose';
import Plan from '../modules/licencias/Plan';
import { config } from '../config/env';
import { logger } from '../config/logger';

/**
 * Script para actualizar el plan Demo existente
 * Ejecutar: npx ts-node src/scripts/update-demo-plan.ts
 */
async function updateDemoPlan() {
  try {
    logger.info('🔄 Actualizando plan Demo...\n');

    // Conectar a DB principal
    await mongoose.connect(config.database.uri);
    logger.info('✅ Conectado a DB principal\n');

    // Buscar el plan Demo
    const demoPlan = await Plan.findOne({ slug: 'demo' });

    if (!demoPlan) {
      logger.error('❌ No se encontró el plan Demo');
      return;
    }

    logger.info(`📝 Plan Demo encontrado: ${demoPlan._id}`);
    logger.info(`   Módulos actuales: ${demoPlan.modulosIncluidos.join(', ')}\n`);

    // Nuevos módulos - TODOS para evaluación completa
    const nuevosModulos = [
      'clientes',
      'productos',
      'ventas',
      'compras',
      'inventario',
      'informes',
      'contabilidad',
      'proyectos',
      'crm',
      'tpv',
      'rrhh',
      'restauracion',
      'tesoreria',
      'calendarios',
    ];

    // Nuevos límites más generosos
    const nuevosLimites = {
      usuariosSimultaneos: 5,
      usuariosTotales: 10,
      facturasMes: 100,
      productosCatalogo: 500,
      almacenes: 3,
      clientes: 500,
      tpvsActivos: 2,
      almacenamientoGB: 2,
      llamadasAPIDia: 1000,
      emailsMes: 200,
      smsMes: 20,
      whatsappMes: 20,
    };

    // Actualizar
    demoPlan.modulosIncluidos = nuevosModulos;
    demoPlan.limites = nuevosLimites;
    demoPlan.descripcion = 'Plan de prueba gratuito de 30 días con acceso completo';
    await demoPlan.save();

    logger.info('✅ Plan Demo actualizado correctamente');
    logger.info(`   Nuevos módulos: ${nuevosModulos.join(', ')}`);
    logger.info(`   Nuevos límites:`);
    logger.info(`     - Usuarios: ${nuevosLimites.usuariosTotales}`);
    logger.info(`     - Facturas/mes: ${nuevosLimites.facturasMes}`);
    logger.info(`     - Productos: ${nuevosLimites.productosCatalogo}`);

  } catch (error: any) {
    logger.error('❌ Error actualizando plan Demo:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('\n🔌 Conexión cerrada');
  }
}

// Ejecutar
if (require.main === module) {
  updateDemoPlan()
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

export default updateDemoPlan;
