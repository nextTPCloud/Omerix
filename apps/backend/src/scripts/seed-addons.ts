import mongoose from 'mongoose';
import AddOn from '../modules/licencias/AddOn';
import { config } from '../config/env';
import { logger } from '../config/logger';

/**
 * Script para poblar la base de datos con add-ons
 * Ejecutar: npm run seed:addons
 */
async function seedAddOns() {
  try {
    logger.info('Iniciando seed de add-ons...\n');

    // Conectar a DB principal
    await mongoose.connect(config.database.uri);
    logger.info('Conectado a DB principal\n');

    // Definir add-ons disponibles
    const addons = [
      {
        nombre: 'Redes Sociales',
        slug: 'redes-sociales',
        descripcion: 'Publica en Facebook e Instagram, programa contenido y analiza metricas',
        precio: {
          mensual: 15,
          anual: 150,
        },
        modulosIncluidos: ['redes-sociales'],
        tieneCantidad: false,
        tipo: 'modulo',
        esRecurrente: true,
        caracteristicas: [
          'Conecta Facebook e Instagram',
          'Programa publicaciones',
          'Analiza metricas',
          'Responde comentarios',
        ],
        activo: true,
        visible: true,
        orden: 1,
      },
      {
        nombre: 'Google Calendar',
        slug: 'google-calendar',
        descripcion: 'Sincronizacion bidireccional con Google Calendar',
        precio: {
          mensual: 5,
          anual: 50,
        },
        modulosIncluidos: ['google-calendar'],
        tieneCantidad: false,
        tipo: 'modulo',
        esRecurrente: true,
        caracteristicas: [
          'Sincroniza citas y eventos',
          'Bidireccional',
          'Recordatorios automaticos',
        ],
        activo: true,
        visible: true,
        orden: 2,
      },
      // Módulos adicionales para planes Básico
      {
        nombre: 'Contabilidad',
        slug: 'contabilidad',
        descripcion: 'Gestion contable completa con balances, asientos y libros',
        precio: {
          mensual: 15,
          anual: 150,
        },
        modulosIncluidos: ['contabilidad'],
        tieneCantidad: false,
        tipo: 'modulo',
        esRecurrente: true,
        caracteristicas: [
          'Plan General Contable',
          'Asientos automaticos',
          'Balances y cuentas',
          'Libros contables',
          'Modelo 303/390',
        ],
        activo: true,
        visible: true,
        orden: 3,
      },
      {
        nombre: 'CRM',
        slug: 'crm',
        descripcion: 'Gestion de relaciones con clientes y oportunidades',
        precio: {
          mensual: 12,
          anual: 120,
        },
        modulosIncluidos: ['crm'],
        tieneCantidad: false,
        tipo: 'modulo',
        esRecurrente: true,
        caracteristicas: [
          'Pipeline de ventas',
          'Seguimiento de leads',
          'Actividades y tareas',
          'Informes de ventas',
        ],
        activo: true,
        visible: true,
        orden: 4,
      },
      {
        nombre: 'Proyectos',
        slug: 'proyectos',
        descripcion: 'Gestion de proyectos con tareas, tiempos y recursos',
        precio: {
          mensual: 10,
          anual: 100,
        },
        modulosIncluidos: ['proyectos'],
        tieneCantidad: false,
        tipo: 'modulo',
        esRecurrente: true,
        caracteristicas: [
          'Kanban y Gantt',
          'Control de tiempos',
          'Asignacion de recursos',
          'Facturacion por proyecto',
        ],
        activo: true,
        visible: true,
        orden: 5,
      },
      {
        nombre: 'RRHH',
        slug: 'rrhh',
        descripcion: 'Gestion de recursos humanos, nominas y fichajes',
        precio: {
          mensual: 12,
          anual: 120,
        },
        modulosIncluidos: ['rrhh'],
        tieneCantidad: false,
        tipo: 'modulo',
        esRecurrente: true,
        caracteristicas: [
          'Fichajes y horarios',
          'Vacaciones y ausencias',
          'Expedientes de empleados',
          'Evaluaciones',
        ],
        activo: true,
        visible: true,
        orden: 6,
      },
      {
        nombre: 'TPV',
        slug: 'tpv',
        descripcion: 'Terminal punto de venta para tiendas fisicas',
        precio: {
          mensual: 15,
          anual: 150,
        },
        modulosIncluidos: ['tpv'],
        tieneCantidad: false,
        tipo: 'modulo',
        esRecurrente: true,
        caracteristicas: [
          'Ventas rapidas',
          'Gestion de caja',
          'Tickets y facturas',
          'Multiples cajas',
        ],
        activo: true,
        visible: true,
        orden: 7,
      },
      {
        nombre: 'Tesoreria',
        slug: 'tesoreria',
        descripcion: 'Control de tesoreria, cobros y pagos',
        precio: {
          mensual: 8,
          anual: 80,
        },
        modulosIncluidos: ['tesoreria'],
        tieneCantidad: false,
        tipo: 'modulo',
        esRecurrente: true,
        caracteristicas: [
          'Control de cobros',
          'Gestion de pagos',
          'Remesas bancarias',
          'Conciliacion',
        ],
        activo: true,
        visible: true,
        orden: 8,
      },
      {
        nombre: 'Tokens IA 5000',
        slug: 'tokens-ia-5000',
        descripcion: '5.000 tokens de IA adicionales por mes',
        precio: {
          mensual: 5,
          anual: 50,
        },
        modulosIncluidos: ['ia'],
        tieneCantidad: true,
        unidad: 'tokens',
        cantidadMinima: 5000,
        cantidadMaxima: 5000,
        precioPorUnidad: 0.001,
        tipo: 'tokens',
        esRecurrente: true,
        limitesExtra: {
          tokensIA: 5000,
        },
        caracteristicas: ['5.000 tokens/mes', 'Asistente IA', 'Generacion de textos'],
        activo: true,
        visible: true,
        orden: 10,
      },
      {
        nombre: 'Tokens IA 20000',
        slug: 'tokens-ia-20000',
        descripcion: '20.000 tokens de IA adicionales por mes',
        precio: {
          mensual: 15,
          anual: 150,
        },
        modulosIncluidos: ['ia'],
        tieneCantidad: true,
        unidad: 'tokens',
        cantidadMinima: 20000,
        cantidadMaxima: 20000,
        precioPorUnidad: 0.00075,
        tipo: 'tokens',
        esRecurrente: true,
        limitesExtra: {
          tokensIA: 20000,
        },
        caracteristicas: ['20.000 tokens/mes', 'Asistente IA avanzado', '25% descuento'],
        activo: true,
        visible: true,
        orden: 11,
      },
      {
        nombre: 'Tokens IA 50000',
        slug: 'tokens-ia-50000',
        descripcion: '50.000 tokens de IA adicionales por mes',
        precio: {
          mensual: 30,
          anual: 300,
        },
        modulosIncluidos: ['ia'],
        tieneCantidad: true,
        unidad: 'tokens',
        cantidadMinima: 50000,
        cantidadMaxima: 50000,
        precioPorUnidad: 0.0006,
        tipo: 'tokens',
        esRecurrente: true,
        limitesExtra: {
          tokensIA: 50000,
        },
        caracteristicas: ['50.000 tokens/mes', 'IA sin limites practicos', '40% descuento'],
        activo: true,
        visible: true,
        orden: 12,
      },
      {
        nombre: 'Tokens IA Ilimitados',
        slug: 'tokens-ia-ilimitados',
        descripcion: 'Tokens de IA ilimitados por mes',
        precio: {
          mensual: 99,
          anual: 990,
        },
        modulosIncluidos: ['ia'],
        tieneCantidad: true,
        unidad: 'tokens',
        cantidadMinima: -1,
        cantidadMaxima: -1,
        tipo: 'tokens',
        esRecurrente: true,
        limitesExtra: {
          tokensIA: -1,
        },
        caracteristicas: ['Tokens ilimitados', 'IA empresarial', 'Soporte prioritario'],
        activo: true,
        visible: true,
        orden: 13,
      },
      {
        nombre: 'Usuarios Extra (5)',
        slug: 'usuarios-extra-5',
        descripcion: '5 usuarios adicionales',
        precio: {
          mensual: 10,
          anual: 100,
        },
        modulosIncluidos: [],
        tieneCantidad: true,
        unidad: 'usuarios',
        cantidadMinima: 5,
        cantidadMaxima: 5,
        precioPorUnidad: 2,
        tipo: 'usuarios',
        esRecurrente: true,
        limitesExtra: {
          usuariosTotales: 5,
        },
        caracteristicas: ['5 usuarios extra', 'Roles personalizados'],
        activo: true,
        visible: true,
        orden: 20,
      },
      {
        nombre: 'Usuarios Extra (10)',
        slug: 'usuarios-extra-10',
        descripcion: '10 usuarios adicionales',
        precio: {
          mensual: 18,
          anual: 180,
        },
        modulosIncluidos: [],
        tieneCantidad: true,
        unidad: 'usuarios',
        cantidadMinima: 10,
        cantidadMaxima: 10,
        precioPorUnidad: 1.8,
        tipo: 'usuarios',
        esRecurrente: true,
        limitesExtra: {
          usuariosTotales: 10,
        },
        caracteristicas: ['10 usuarios extra', '10% descuento', 'Roles personalizados'],
        activo: true,
        visible: true,
        orden: 21,
      },
      {
        nombre: 'Almacenamiento Extra (10GB)',
        slug: 'almacenamiento-extra-10gb',
        descripcion: '10GB de almacenamiento adicional',
        precio: {
          mensual: 5,
          anual: 50,
        },
        modulosIncluidos: [],
        tieneCantidad: true,
        unidad: 'GB',
        cantidadMinima: 10,
        cantidadMaxima: 10,
        precioPorUnidad: 0.5,
        tipo: 'almacenamiento',
        esRecurrente: true,
        limitesExtra: {
          almacenamientoGB: 10,
        },
        caracteristicas: ['10GB extra', 'Archivos y documentos'],
        activo: true,
        visible: true,
        orden: 30,
      },
      {
        nombre: 'TPV Extra',
        slug: 'tpv-extra',
        descripcion: 'Terminal punto de venta adicional para tu negocio',
        precio: {
          mensual: 10,
          anual: 100,
        },
        modulosIncluidos: ['tpv'],
        tieneCantidad: true,
        unidad: 'TPV',
        cantidadMinima: 1,
        cantidadMaxima: 20,
        precioPorUnidad: 10,
        tipo: 'otro',
        esRecurrente: true,
        limitesExtra: {
          tpvs: 1,
        },
        caracteristicas: ['1 TPV adicional', 'Sincronizacion en tiempo real', 'Gestion centralizada'],
        activo: true,
        visible: true,
        orden: 25,
        // Flag para indicar que este addon permite seleccionar cantidad
        permiteMultiples: true,
      },
      {
        nombre: 'Kiosko Extra',
        slug: 'kiosko-extra',
        descripcion: 'Terminal de autoservicio adicional (totem, tablet, QR)',
        precio: {
          mensual: 10,
          anual: 100,
        },
        modulosIncluidos: ['kiosko'],
        tieneCantidad: true,
        unidad: 'Kiosko',
        cantidadMinima: 1,
        cantidadMaxima: 20,
        precioPorUnidad: 10,
        tipo: 'otro',
        esRecurrente: true,
        limitesExtra: {
          kioskos: 1,
        },
        caracteristicas: [
          '1 kiosko adicional',
          'Totem, tablet o QR mesa',
          'Pedidos directos a cocina',
          'Pago opcional integrado',
        ],
        activo: true,
        visible: true,
        orden: 26,
        permiteMultiples: true,
        // Nota: Requiere modulo restauracion activo (se valida en checkout)
      },
      {
        nombre: 'E-commerce',
        slug: 'ecommerce',
        descripcion: 'Sincroniza tu tienda online con PrestaShop o WooCommerce',
        precio: {
          mensual: 15,
          anual: 150,
        },
        modulosIncluidos: ['ecommerce'],
        tieneCantidad: false,
        tipo: 'modulo',
        esRecurrente: true,
        caracteristicas: [
          'Conector PrestaShop',
          'Conector WooCommerce',
          'Sync productos y categorias',
          'Sync stock bidireccional',
          'Sync precios',
          'Importacion de pedidos',
        ],
        activo: true,
        visible: true,
        orden: 8.5,
      },
      {
        nombre: 'Firmas Digitales',
        slug: 'firmas-digitales',
        descripcion: 'Firma digital de documentos con validez legal',
        precio: {
          mensual: 8,
          anual: 80,
        },
        modulosIncluidos: ['firmas'],
        tieneCantidad: false,
        tipo: 'modulo',
        esRecurrente: true,
        caracteristicas: [
          'Firma digital de documentos',
          'Solicitudes de firma a terceros',
          'Firma en dispositivo movil',
          'Historial y auditoria',
          'Enlace publico para firmar',
        ],
        activo: true,
        visible: true,
        orden: 8.7,
      },
      {
        nombre: 'Restauracion',
        slug: 'restauracion',
        descripcion: 'Modulo completo para restaurantes, bares y hosteleria',
        precio: {
          mensual: 25,
          anual: 250,
        },
        modulosIncluidos: ['restauracion'],
        tieneCantidad: false,
        tipo: 'modulo',
        esRecurrente: true,
        caracteristicas: [
          'Gestion de salones y mesas',
          'Comandas de cocina (KDS)',
          'Comandero digital para camareros',
          'Impresoras de cocina',
          'Modificadores de productos',
          'Alergenos y fichas tecnicas',
          'Propinas y divisiones de cuenta',
          'Reservas de mesas',
          'Integracion Restoo.me (reservas online)',
          'Kioskos de autoservicio',
          'Sugerencias del dia',
          'Carta digital',
        ],
        activo: true,
        visible: true,
        orden: 9,
      },
    ];

    // Upsert add-ons (actualizar si existen, crear si no)
    logger.info('Creando/actualizando add-ons...\n');
    
    for (const addon of addons) {
      await AddOn.findOneAndUpdate(
        { slug: addon.slug },
        addon,
        { upsert: true, new: true }
      );
      logger.info('   Procesado: ' + addon.nombre + ' (' + addon.slug + ')');
    }

    const totalAddons = await AddOn.countDocuments({ activo: true });
    logger.info('\nSeed completado: ' + totalAddons + ' add-ons activos en la base de datos\n');

  } catch (error: any) {
    logger.error('Error en seed de add-ons:', error.message);
    logger.error(error.stack);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('Conexion cerrada');
  }
}

// Ejecutar
if (require.main === module) {
  seedAddOns()
    .then(() => {
      logger.info('\nScript finalizado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\nScript finalizado con errores');
      console.error(error);
      process.exit(1);
    });
}

export default seedAddOns;
