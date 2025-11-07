// backend/scripts/migrate-clientes-riesgo.ts
// Script para actualizar clientes existentes que no tienen riesgoActual

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Cliente } from '../src/models/Cliente';

dotenv.config();

async function migrateClientes() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Conectado a MongoDB');

    // Buscar clientes sin riesgoActual o con valor null/undefined
    const clientesSinRiesgo = await Cliente.find({
      $or: [
        { riesgoActual: { $exists: false } },
        { riesgoActual: null },
      ]
    });

    console.log(`📊 Encontrados ${clientesSinRiesgo.length} clientes sin riesgoActual`);

    if (clientesSinRiesgo.length === 0) {
      console.log('✅ No hay clientes para actualizar');
      process.exit(0);
    }

    // Actualizar en lote
    const bulkOps = clientesSinRiesgo.map(cliente => ({
      updateOne: {
        filter: { _id: cliente._id },
        update: { $set: { riesgoActual: 0 } }
      }
    }));

    const result = await Cliente.bulkWrite(bulkOps);
    
    console.log(`✅ Actualizados ${result.modifiedCount} clientes`);
    console.log('✅ Migración completada exitosamente');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateClientes();