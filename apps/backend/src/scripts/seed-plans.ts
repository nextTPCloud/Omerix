import mongoose from 'mongoose';
import Plan from '../modules/licencias/Plan';
import { config } from '../config/env';
import { logger } from '../config/logger';

/**
 * Script para poblar la base de datos con planes iniciales
 * Ejecutar: npm run seed:plans
 */
async function seedPlans() {
  try {
    logger.info('🌱 Iniciando seed de planes...\n');

    // Conectar a DB principal
    await mongoose.connect(config.database.uri);
    logger.info('✅ Conectado a DB principal\n');

    // Eliminar planes existentes (solo en desarrollo)
    const count = await Plan.countDocuments();
    if (count > 0) {
      logger.warn(`⚠️  Existen ${count} planes en la base de datos`);
      logger.info('🗑️  Eliminando planes existentes...');
      await Plan.deleteMany({});
      logger.info('✅ Planes eliminados\n');
    }

    // Definir planes (precios IVA incluido)
    const planes = [
      {
        nombre: 'Demo',
        slug: 'demo',
        descripcion: 'Plan de prueba gratuito de 30 días con acceso completo',
        precio: {
          mensual: 0,
          anual: 0,
        },
        limites: {
          usuariosSimultaneos: 3, // Suficiente para probar multiusuario
          usuariosTotales: 5,
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
        },
        modulosIncluidos: [
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
          'redes-sociales', // Para poder probar el módulo
          'google-calendar', // Para poder probar el módulo
        ],
        activo: true,
        visible: false,
      },
      // Plan Solo Fichaje - standalone RRHH
      {
        nombre: 'Solo Fichaje',
        slug: 'solo-fichaje',
        descripcion: 'Control horario y fichajes para tu equipo',
        precio: {
          mensual: 15,
          anual: 150, // 2 meses gratis
        },
        limites: {
          usuariosSimultaneos: 5, // Equipo pequeño
          usuariosTotales: 10,
          facturasMes: 0, // Sin facturación
          productosCatalogo: 0,
          almacenes: 0,
          clientes: 0,
          tpvsActivos: 0,
          almacenamientoGB: 1,
          llamadasAPIDia: 500,
          emailsMes: 100,
          smsMes: 0,
          whatsappMes: 0,
        },
        modulosIncluidos: [
          'rrhh',
          'calendarios',
        ],
        activo: true,
        visible: true,
      },
      // Plan Starter - Para autónomos que empiezan
      {
        nombre: 'Starter',
        slug: 'starter',
        descripcion: 'Plan económico para autónomos que empiezan',
        precio: {
          mensual: 19,
          anual: 190, // 2 meses gratis
        },
        limites: {
          usuariosSimultaneos: 1,
          usuariosTotales: 2,
          facturasMes: 100,
          productosCatalogo: 200,
          almacenes: 1,
          clientes: 200,
          tpvsActivos: 0,
          almacenamientoGB: 2,
          llamadasAPIDia: 1000,
          emailsMes: 200,
          smsMes: 20,
          whatsappMes: 20,
        },
        modulosIncluidos: [
          'clientes',
          'productos',
          'ventas',
          'informes',
        ],
        activo: true,
        visible: true,
      },
      {
        nombre: 'Básico',
        slug: 'basico',
        descripcion: 'Plan ideal para autónomos y microempresas',
        precio: {
          mensual: 35,
          anual: 349, // 2 meses gratis
        },
        limites: {
          usuariosSimultaneos: 2, // 2 sesiones simultáneas
          usuariosTotales: 10,   // 10 usuarios totales
          facturasMes: 200,
          productosCatalogo: 500,
          almacenes: 2,
          clientes: 500,
          tpvsActivos: 1,
          almacenamientoGB: 5,
          llamadasAPIDia: 2000,
          emailsMes: 500,
          smsMes: 50,
          whatsappMes: 50,
        },
        modulosIncluidos: [
          'clientes',
          'productos',
          'ventas',
          'compras',
          'inventario',
          'informes',
          'tesoreria',
        ],
        activo: true,
        visible: true,
      },
      {
        nombre: 'Profesional',
        slug: 'profesional',
        descripcion: 'Plan completo para negocios en crecimiento',
        precio: {
          mensual: 99,
          anual: 990, // 2 meses gratis
        },
        limites: {
          usuariosSimultaneos: 15,
          usuariosTotales: 30,
          facturasMes: 1000,
          productosCatalogo: 5000,
          almacenes: 5,
          clientes: 5000,
          tpvsActivos: 5,
          almacenamientoGB: 20,
          llamadasAPIDia: 10000,
          emailsMes: 2000,
          smsMes: 200,
          whatsappMes: 200,
        },
        modulosIncluidos: [
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
          'tesoreria',
          'calendarios',
          'api', // Acceso a documentación API
        ],
        activo: true,
        visible: true,
      },
      {
        nombre: 'Enterprise',
        slug: 'enterprise',
        descripcion: 'Plan sin límites para grandes empresas',
        precio: {
          mensual: 249,
          anual: 2490, // 2 meses gratis
        },
        limites: {
          usuariosSimultaneos: -1,
          usuariosTotales: -1,
          facturasMes: -1,
          productosCatalogo: -1,
          almacenes: -1,
          clientes: -1,
          tpvsActivos: -1,
          almacenamientoGB: 100,
          llamadasAPIDia: 100000,
          emailsMes: 10000,
          smsMes: 1000,
          whatsappMes: 1000,
        },
        modulosIncluidos: [
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
          'api',
          'integraciones',
          'soporte-prioritario',
          'redes-sociales',
          'google-calendar',
        ],
        activo: true,
        visible: true,
      },
    ];

    // Definir addons disponibles
    const addons = [
      {
        nombre: 'Redes Sociales',
        slug: 'redes-sociales',
        descripcion: 'Publica en Facebook e Instagram, programa contenido y analiza métricas',
        precio: {
          mensual: 15,
          anual: 150,
        },
        modulosIncluidos: ['redes-sociales'],
        activo: true,
        visible: true,
      },
      {
        nombre: 'Google Calendar',
        slug: 'google-calendar',
        descripcion: 'Sincronización bidireccional con Google Calendar',
        precio: {
          mensual: 5,
          anual: 50,
        },
        modulosIncluidos: ['google-calendar'],
        activo: true,
        visible: true,
      },
    ];

    logger.info('\n📝 Addons disponibles para contratar:\n');
    addons.forEach((addon) => {
      logger.info(`   • ${addon.nombre} (${addon.slug}) - ${addon.precio.mensual}€/mes`);
    });

    // Insertar planes
    logger.info('📝 Creando planes...\n');
    const createdPlans = await Plan.insertMany(planes);

    logger.info('✅ Planes creados exitosamente:\n');
    createdPlans.forEach((plan) => {
      logger.info(`   • ${plan.nombre} (${plan.slug})`);
      logger.info(`     - Precio: ${plan.precio.mensual}€/mes | ${plan.precio.anual}€/año`);
      logger.info(`     - Usuarios: ${plan.limites.usuariosTotales === -1 ? 'Ilimitados' : plan.limites.usuariosTotales}`);
      logger.info(`     - Facturas/mes: ${plan.limites.facturasMes === -1 ? 'Ilimitadas' : plan.limites.facturasMes}`);
      logger.info(`     - Visible: ${plan.visible ? 'Sí' : 'No (solo trials)'}\n`);
    });

    logger.info(`\n🎉 Seed completado: ${createdPlans.length} planes creados\n`);
    logger.info('✅ Ahora puedes registrar empresas en el sistema\n');

  } catch (error: any) {
    logger.error('❌ Error en seed de planes:', error.message);
    logger.error(error.stack);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('🔌 Conexión cerrada');
  }
}

// Ejecutar
if (require.main === module) {
  seedPlans()
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

export default seedPlans;