import mongoose from 'mongoose';
import Plan from '../modules/licencias/Plan';
import AddOn from '../modules/licencias/AddOn';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tralok-dev';

const planes = [
  {
    nombre: 'Demo',
    slug: 'demo',
    descripcion: 'Plan de prueba gratuito por 30 días',
    precio: {
      mensual: 0,
      anual: 0,
    },
    limites: {
      usuariosSimultaneos: 2,
      usuariosTotales: 5,
      facturasMes: 100,
      productosCatalogo: 500,
      almacenes: 1,
      clientes: 100,
      tpvsActivos: 1,
      almacenamientoGB: 0.5,
      llamadasAPIDia: 100,
      emailsMes: 50,
      smsMes: 0,
      whatsappMes: 0,
    },
    modulosIncluidos: [
      'clientes',
      'productos',
      'ventas',
      'compras',
      'inventario',
      'reportes-basicos',
    ],
    activo: true,
    visible: true,
  },
  {
    nombre: 'Starter',
    slug: 'starter',
    descripcion: 'Plan inicial para pequeños negocios',
    precio: {
      mensual: 29,
      anual: 290, // 2 meses gratis
    },
    limites: {
      usuariosSimultaneos: 3,
      usuariosTotales: 5,
      facturasMes: 500,
      productosCatalogo: 1000,
      almacenes: 1,
      clientes: 500,
      tpvsActivos: 1,
      almacenamientoGB: 2,
      llamadasAPIDia: 1000,
      emailsMes: 500,
      smsMes: 100,
      whatsappMes: 0,
    },
    modulosIncluidos: [
      'clientes',
      'productos',
      'ventas',
      'compras',
      'inventario',
      'tpv',
      'reportes-basicos',
      'portal-cliente',
    ],
    activo: true,
    visible: true,
  },
  {
    nombre: 'Professional',
    slug: 'professional',
    descripcion: 'Plan completo para empresas en crecimiento',
    precio: {
      mensual: 79,
      anual: 790,
    },
    limites: {
      usuariosSimultaneos: 10,
      usuariosTotales: 20,
      facturasMes: 2000,
      productosCatalogo: 10000,
      almacenes: 3,
      clientes: 5000,
      tpvsActivos: 3,
      almacenamientoGB: 10,
      llamadasAPIDia: 5000,
      emailsMes: 2000,
      smsMes: 500,
      whatsappMes: 200,
    },
    modulosIncluidos: [
      'clientes',
      'productos',
      'ventas',
      'compras',
      'inventario',
      'inventario-avanzado',
      'multi-almacen',
      'tpv',
      'crm',
      'proyectos',
      'rrhh',
      'chat-interno',
      'reportes-avanzados',
      'api-rest',
      'integraciones',
      'portal-cliente',
      'multi-idioma',
    ],
    activo: true,
    visible: true,
  },
  {
    nombre: 'Business',
    slug: 'business',
    descripcion: 'Plan avanzado para grandes empresas',
    precio: {
      mensual: 149,
      anual: 1490,
    },
    limites: {
      usuariosSimultaneos: 25,
      usuariosTotales: 50,
      facturasMes: -1, // Ilimitado
      productosCatalogo: -1,
      almacenes: -1,
      clientes: -1,
      tpvsActivos: 10,
      almacenamientoGB: 50,
      llamadasAPIDia: 20000,
      emailsMes: 10000,
      smsMes: 2000,
      whatsappMes: 1000,
    },
    modulosIncluidos: [
      'clientes',
      'productos',
      'ventas',
      'compras',
      'inventario',
      'inventario-avanzado',
      'multi-almacen',
      'tpv',
      'crm',
      'crm-avanzado',
      'proyectos',
      'proyectos-avanzado',
      'rrhh',
      'rrhh-avanzado',
      'chat-interno',
      'reportes-avanzados',
      'bi-analytics',
      'api-rest',
      'api-avanzada',
      'integraciones',
      'integraciones-avanzadas',
      'portal-cliente',
      'multi-idioma',
      'modulo-taller',
      'modulo-informatica',
      'modulo-restauracion',
    ],
    activo: true,
    visible: true,
  },
  {
    nombre: 'Enterprise',
    slug: 'enterprise',
    descripcion: 'Plan personalizado para grandes corporaciones',
    precio: {
      mensual: 0, // Precio personalizado
      anual: 0,
    },
    limites: {
      usuariosSimultaneos: -1,
      usuariosTotales: -1,
      facturasMes: -1,
      productosCatalogo: -1,
      almacenes: -1,
      clientes: -1,
      tpvsActivos: -1,
      almacenamientoGB: -1,
      llamadasAPIDia: -1,
      emailsMes: -1,
      smsMes: -1,
      whatsappMes: -1,
    },
    modulosIncluidos: ['*'], // Todos los módulos
    activo: true,
    visible: true,
  },
];

const addOns = [
  {
    nombre: 'Módulo Taller Mecánico',
    slug: 'modulo-taller',
    descripcion: 'Gestión completa de talleres mecánicos con órdenes de trabajo',
    precioMensual: 20,
    categoria: 'modulo',
    activo: true,
  },
  {
    nombre: 'Módulo Informática/Tickets',
    slug: 'modulo-informatica',
    descripcion: 'Sistema de tickets y gestión de servicios informáticos',
    precioMensual: 20,
    categoria: 'modulo',
    activo: true,
  },
  {
    nombre: 'Módulo Restauración',
    slug: 'modulo-restauracion',
    descripcion: 'Gestión de restaurantes, bares y hostelería',
    precioMensual: 30,
    categoria: 'modulo',
    activo: true,
  },
  {
    nombre: 'Módulo Proyectos Avanzado',
    slug: 'proyectos-avanzado',
    descripcion: 'Gestión avanzada de proyectos con Gantt y seguimiento',
    precioMensual: 20,
    categoria: 'modulo',
    activo: true,
  },
  {
    nombre: 'TPV Adicional',
    slug: 'tpv-adicional',
    descripcion: 'Punto de venta adicional',
    precioMensual: 10,
    categoria: 'recurso',
    activo: true,
  },
  {
    nombre: 'Usuario Adicional',
    slug: 'usuario-adicional',
    descripcion: 'Usuario adicional sobre el límite del plan',
    precioMensual: 5,
    categoria: 'recurso',
    activo: true,
  },
  {
    nombre: 'Almacenamiento Extra (10GB)',
    slug: 'almacenamiento-extra',
    descripcion: '10GB adicionales de almacenamiento',
    precioMensual: 5,
    categoria: 'recurso',
    activo: true,
  },
  {
    nombre: 'API Avanzada',
    slug: 'api-avanzada',
    descripcion: 'Acceso a endpoints avanzados de la API',
    precioMensual: 30,
    categoria: 'integracion',
    activo: true,
  },
  {
    nombre: 'White Label',
    slug: 'white-label',
    descripcion: 'Marca blanca personalizada',
    precioMensual: 100,
    categoria: 'otro',
    activo: true,
  },
];

async function seedDatabase() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar colecciones existentes
    await Plan.deleteMany({});
    await AddOn.deleteMany({});
    console.log('🗑️  Colecciones limpiadas');

    // Insertar planes
    const planesCreados = await Plan.insertMany(planes);
    console.log(`✅ ${planesCreados.length} planes creados`);

    // Insertar add-ons
    const addOnsCreados = await AddOn.insertMany(addOns);
    console.log(`✅ ${addOnsCreados.length} add-ons creados`);

    console.log('\n📊 Planes creados:');
    planesCreados.forEach((plan) => {
      console.log(`  - ${plan.nombre} (${plan.slug}): €${plan.precio.mensual}/mes`);
    });

    console.log('\n🔌 Add-ons creados:');
    addOnsCreados.forEach((addon) => {
      console.log(`  - ${addon.nombre}: €${addon.precio?.mensual || 0}/mes`);
    });

    console.log('\n✅ Seed completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seedDatabase();