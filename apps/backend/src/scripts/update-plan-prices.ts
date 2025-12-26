/**
 * Script para actualizar los precios de los planes (IVA incluido)
 *
 * Nuevos precios:
 * - Básico: 35€/mes, 349€/año
 * - Profesional: 99€/mes, 990€/año
 * - Enterprise: 249€/mes, 2490€/año
 *
 * Uso: npx ts-node src/scripts/update-plan-prices.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import Plan from '../modules/licencias/Plan';

const nuevosPrecios = [
  {
    slug: 'basico',
    precio: { mensual: 35, anual: 349 },
  },
  {
    slug: 'profesional',
    precio: { mensual: 99, anual: 990 },
  },
  {
    slug: 'enterprise',
    precio: { mensual: 249, anual: 2490 },
  },
];

async function updatePlanPrices() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    for (const nuevo of nuevosPrecios) {
      const plan = await Plan.findOne({ slug: nuevo.slug });

      if (plan) {
        const precioAnterior = { ...plan.precio };
        plan.precio = nuevo.precio;

        // Limpiar IDs de PayPal para forzar recreación con nuevos precios
        plan.paypalPlanId = undefined;
        plan.paypalPlanIdAnual = undefined;

        await plan.save();

        console.log(`✅ ${plan.nombre}:`);
        console.log(`   Anterior: ${precioAnterior.mensual}€/mes, ${precioAnterior.anual}€/año`);
        console.log(`   Nuevo:    ${nuevo.precio.mensual}€/mes, ${nuevo.precio.anual}€/año`);
      } else {
        console.log(`⚠️ Plan no encontrado: ${nuevo.slug}`);
      }
    }

    console.log('');
    console.log('✅ Precios actualizados correctamente');
    console.log('   Los precios ahora incluyen IVA (21%)');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

updatePlanPrices();
