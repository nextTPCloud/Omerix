import mongoose from 'mongoose';
import { config } from '../config/env';

async function updatePlanBasico() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(config.database.uri);

    const result = await mongoose.connection.db.collection('plans').updateOne(
      { slug: 'basico' },
      { $addToSet: { modulosIncluidos: 'tesoreria' } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Plan Básico actualizado: tesoreria añadida');
    } else {
      console.log('ℹ️  Sin cambios (el plan ya tenía tesoreria o no existe)');
    }

    // Verificar
    const plan = await mongoose.connection.db.collection('plans').findOne({ slug: 'basico' });
    console.log('Módulos del plan Básico:', plan?.modulosIncluidos);

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Conexión cerrada');
  }
}

updatePlanBasico();
