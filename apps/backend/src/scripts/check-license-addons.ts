import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkLicenseAddons() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB\n');

    const db = mongoose.connection.db!;

    // Buscar todas las licencias
    const licencias = await db.collection('licencias').find({}).toArray();

    console.log(`Total licencias: ${licencias.length}\n`);

    for (const licencia of licencias) {
      // Obtener empresa
      const empresa = await db.collection('empresas').findOne({ _id: licencia.empresaId });

      console.log('='.repeat(60));
      console.log(`Empresa: ${empresa?.nombre || 'Desconocida'}`);
      console.log(`Estado: ${licencia.estado}`);
      console.log(`Es Trial: ${licencia.esTrial}`);

      // Obtener plan
      if (licencia.planId) {
        const plan = await db.collection('plans').findOne({ _id: licencia.planId });
        console.log(`Plan: ${plan?.nombre || 'No encontrado'} (${plan?.slug})`);
        console.log(`Modulos del plan: ${plan?.modulosIncluidos?.join(', ') || 'Ninguno'}`);
      }

      // Mostrar add-ons activos
      console.log('\n--- ADD-ONS ACTIVOS ---');
      if (licencia.addOns && licencia.addOns.length > 0) {
        for (const addon of licencia.addOns) {
          console.log(`  - ${addon.nombre} (${addon.slug})`);
          console.log(`    Activo: ${addon.activo}`);
          console.log(`    Precio: ${addon.precioMensual}€/mes`);
          console.log(`    Activado: ${addon.fechaActivacion}`);
        }
      } else {
        console.log('  (ninguno)');
      }

      // Mostrar add-ons pendientes
      console.log('\n--- ADD-ONS PENDIENTES ---');
      if (licencia.addOnsPendientes && licencia.addOnsPendientes.length > 0) {
        console.log(`  ${licencia.addOnsPendientes.join(', ')}`);
      } else {
        console.log('  (ninguno)');
      }

      // Mostrar paypalOrderId si existe
      if (licencia.paypalOrderId) {
        console.log(`\nPayPal Order ID pendiente: ${licencia.paypalOrderId}`);
      }

      console.log('\n');
    }

    // Mostrar pagos recientes de PayPal
    console.log('='.repeat(60));
    console.log('PAGOS PAYPAL RECIENTES');
    console.log('='.repeat(60));

    const pagos = await db.collection('pagos')
      .find({ pasarela: 'paypal' })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    for (const pago of pagos) {
      console.log(`\nConcepto: ${pago.concepto}`);
      console.log(`Descripcion: ${pago.descripcion}`);
      console.log(`Estado: ${pago.estado}`);
      console.log(`Total: ${pago.total}€`);
      console.log(`Order ID: ${pago.transaccionExternaId}`);
      console.log(`Metadata: ${JSON.stringify(pago.metadata, null, 2)}`);
      console.log(`Fecha: ${pago.createdAt}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkLicenseAddons();
