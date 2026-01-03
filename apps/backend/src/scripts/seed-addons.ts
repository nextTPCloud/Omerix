/**
 * Script para crear los add-ons disponibles
 *
 * Precios (IVA incluido):
 * - Módulo RRHH/Fichaje: 6€/mes (como add-on, standalone es 15€)
 * - Módulo TPV: 25€/mes
 * - Módulo Servicios: 15€/mes (proyectos, partes de trabajo, maquinaria)
 * - Usuario extra: 5€/mes
 * - 10 GB extra: 3€/mes
 * - 50 GB extra: 10€/mes
 * - 1.000 tokens IA: 2€ (pago único)
 * - 5.000 tokens IA: 8€ (pago único)
 * - 20.000 tokens IA: 25€ (pago único)
 *
 * Uso: npx ts-node src/scripts/seed-addons.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function seedAddOns() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';
    await mongoose.connect(mongoUri);
    console.log('Conectado a MongoDB');

    const db = mongoose.connection.db!;
    const addOnsCollection = db.collection('addons');

    // Borrar add-ons existentes
    await addOnsCollection.deleteMany({});
    console.log('Add-ons anteriores eliminados');

    const addOns = [
      // === MÓDULOS ===
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: 'Módulo RRHH/Fichaje',
        slug: 'rrhh-fichaje',
        descripcion: 'Control horario, fichajes, turnos y gestión de personal',
        icono: 'Clock',
        tipo: 'modulo',
        precioMensual: 6,
        precioAnual: 60, // 2 meses gratis
        esRecurrente: true,
        caracteristicas: [
          'Control de fichajes',
          'Gestión de turnos',
          'Calendario de personal',
          'Informes de horas',
          'App móvil de fichaje',
        ],
        orden: 1,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: 'Módulo TPV',
        slug: 'tpv',
        descripcion: 'Terminal punto de venta para tiendas y hostelería',
        icono: 'CreditCard',
        tipo: 'modulo',
        precioMensual: 25,
        precioAnual: 250, // 2 meses gratis
        esRecurrente: true,
        caracteristicas: [
          'Gestión de caja',
          'Tickets y facturas',
          'Control de turnos',
          'Múltiples terminales',
          'Integración con cocina',
        ],
        limitesExtra: {
          tpvs: 2,
        },
        orden: 2,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: 'Módulo Servicios',
        slug: 'proyectos',
        descripcion: 'Proyectos, partes de trabajo, maquinaria y tipos de gasto',
        icono: 'Wrench',
        tipo: 'modulo',
        precioMensual: 15,
        precioAnual: 150, // 2 meses gratis
        esRecurrente: true,
        caracteristicas: [
          'Gestión de proyectos',
          'Partes de trabajo',
          'Control de maquinaria',
          'Tipos de gasto',
          'Informes de rentabilidad',
        ],
        orden: 3,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: 'Módulo Contabilidad',
        slug: 'contabilidad',
        descripcion: 'Gestión contable completa, asientos, balances y cuentas anuales',
        icono: 'Calculator',
        tipo: 'modulo',
        precioMensual: 20,
        precioAnual: 200, // 2 meses gratis
        esRecurrente: true,
        caracteristicas: [
          'Plan General Contable',
          'Asientos automáticos',
          'Libro diario y mayor',
          'Balance y cuenta de resultados',
          'Cuentas anuales',
        ],
        orden: 4,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: 'CRM Completo',
        slug: 'crm',
        descripcion: 'Gestión de clientes, oportunidades, pipeline de ventas y seguimiento',
        icono: 'Users',
        tipo: 'modulo',
        precioMensual: 15,
        precioAnual: 150, // 2 meses gratis
        esRecurrente: true,
        caracteristicas: [
          'Pipeline de ventas',
          'Gestión de oportunidades',
          'Seguimiento de clientes',
          'Automatizaciones',
          'Informes de ventas',
        ],
        orden: 5,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // === USUARIOS ===
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: 'Usuario Extra',
        slug: 'usuario-extra',
        descripcion: 'Añade un usuario adicional (simultáneo) a tu cuenta',
        icono: 'UserPlus',
        tipo: 'usuarios',
        precioMensual: 5,
        precioAnual: 50,
        unidad: 'usuario',
        cantidad: 1,
        esRecurrente: true,
        limitesExtra: {
          usuariosSimultaneos: 1, // +1 sesión simultánea
          usuariosTotales: 1,     // +1 usuario total
        },
        orden: 10,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: 'Pack 5 Usuarios',
        slug: 'pack-5-usuarios',
        descripcion: 'Añade 5 usuarios adicionales (ahorra 20%)',
        icono: 'Users',
        tipo: 'usuarios',
        precioMensual: 20, // 4€/usuario en lugar de 5€
        precioAnual: 200,
        unidad: 'usuarios',
        cantidad: 5,
        esRecurrente: true,
        limitesExtra: {
          usuariosSimultaneos: 5,
          usuariosTotales: 5,
        },
        orden: 11,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // === ALMACENAMIENTO ===
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: '10 GB Extra',
        slug: 'storage-10gb',
        descripcion: 'Amplía tu almacenamiento en 10 GB',
        icono: 'HardDrive',
        tipo: 'almacenamiento',
        precioMensual: 3,
        precioAnual: 30,
        unidad: 'GB',
        cantidad: 10,
        esRecurrente: true,
        limitesExtra: {
          almacenamientoGB: 10,
        },
        orden: 20,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: '50 GB Extra',
        slug: 'storage-50gb',
        descripcion: 'Amplía tu almacenamiento en 50 GB',
        icono: 'HardDrive',
        tipo: 'almacenamiento',
        precioMensual: 10,
        precioAnual: 100,
        unidad: 'GB',
        cantidad: 50,
        esRecurrente: true,
        limitesExtra: {
          almacenamientoGB: 50,
        },
        orden: 21,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // === TOKENS IA (pago único) ===
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: '1.000 Tokens IA',
        slug: 'tokens-1000',
        descripcion: 'Pack de 1.000 tokens para asistente IA',
        icono: 'Sparkles',
        tipo: 'tokens',
        precioMensual: 2, // Pago único, no mensual
        unidad: 'tokens',
        cantidad: 1000,
        esRecurrente: false,
        limitesExtra: {
          tokensIA: 1000,
        },
        orden: 30,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: '5.000 Tokens IA',
        slug: 'tokens-5000',
        descripcion: 'Pack de 5.000 tokens para asistente IA (ahorra 20%)',
        icono: 'Sparkles',
        tipo: 'tokens',
        precioMensual: 8,
        unidad: 'tokens',
        cantidad: 5000,
        esRecurrente: false,
        limitesExtra: {
          tokensIA: 5000,
        },
        orden: 31,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        nombre: '20.000 Tokens IA',
        slug: 'tokens-20000',
        descripcion: 'Pack de 20.000 tokens para asistente IA (ahorra 38%)',
        icono: 'Sparkles',
        tipo: 'tokens',
        precioMensual: 25,
        unidad: 'tokens',
        cantidad: 20000,
        esRecurrente: false,
        limitesExtra: {
          tokensIA: 20000,
        },
        orden: 32,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await addOnsCollection.insertMany(addOns);

    console.log('');
    console.log('Add-ons creados:');
    console.log('================');
    addOns.forEach(addon => {
      const precio = addon.esRecurrente
        ? `${addon.precioMensual}€/mes`
        : `${addon.precioMensual}€`;
      console.log(`  - ${addon.nombre}: ${precio}`);
    });
    console.log('');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

seedAddOns();
