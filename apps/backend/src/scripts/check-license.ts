import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkLicense() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB');

    const db = mongoose.connection.db!;

    const licencia = await db.collection('licencias').findOne({
      empresaId: new mongoose.Types.ObjectId('694bd3fc7f6a83048b1889b2')
    });

    if (!licencia) {
      console.log('No se encontro licencia');
      return;
    }

    console.log('');
    console.log('=== LICENCIA ===');
    console.log('  Estado:', licencia.estado);
    console.log('  Es trial:', licencia.esTrial);
    console.log('  Plan ID:', licencia.planId?.toString());

    if (licencia.planId) {
      const plan = await db.collection('plans').findOne({ _id: licencia.planId });

      if (plan) {
        console.log('');
        console.log('=== PLAN ===');
        console.log('  Nombre:', plan.nombre);
        console.log('  Slug:', plan.slug);
        console.log('  Activo:', plan.activo);
        console.log('  Modulos:', plan.modulosIncluidos?.length, 'modulos');
        console.log('  Lista:', plan.modulosIncluidos?.join(', '));
      } else {
        console.log('');
        console.log('ERROR: Plan no encontrado con ID:', licencia.planId?.toString());

        // Mostrar todos los planes disponibles
        const planes = await db.collection('plans').find({}).toArray();
        console.log('');
        console.log('Planes disponibles:');
        planes.forEach(p => {
          console.log(`  - ${p.nombre} (${p.slug}): ${p._id.toString()}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkLicense();
