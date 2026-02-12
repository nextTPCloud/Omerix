/**
 * Script para actualizar informes predefinidos en todas las empresas
 * Elimina los informes plantilla existentes y los vuelve a crear con las nuevas configuraciones
 *
 * Ejecutar: npx tsx src/scripts/actualizar-informes-predefinidos.ts
 * O: npm run actualizar:informes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { obtenerInformesPredefinidos } from '../modules/informes/informes-predefinidos';
import { databaseManager } from '../services/database-manager.service';
import { IDatabaseConfig } from '../modules/empresa/Empresa';

// Schema de Informe simplificado para el script
const InformeSchema = new mongoose.Schema({
  empresaId: String,
  nombre: String,
  descripcion: String,
  modulo: String,
  tipo: String,
  icono: String,
  fuente: mongoose.Schema.Types.Mixed,
  campos: [mongoose.Schema.Types.Mixed],
  filtros: [mongoose.Schema.Types.Mixed],
  parametros: [mongoose.Schema.Types.Mixed],
  agrupaciones: [mongoose.Schema.Types.Mixed],
  ordenamiento: [mongoose.Schema.Types.Mixed],
  grafico: mongoose.Schema.Types.Mixed,
  config: mongoose.Schema.Types.Mixed,
  esPlantilla: { type: Boolean, default: false },
  compartido: { type: Boolean, default: false },
  orden: Number,
  activo: { type: Boolean, default: true },
  creadoPor: mongoose.Schema.Types.ObjectId,
  actualizadoPor: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

async function actualizarInformesEmpresa(
  empresaId: string,
  empresaNombre: string,
  dbConfig: IDatabaseConfig
): Promise<{ eliminados: number; creados: number }> {
  try {
    // Obtener conexión a la base de datos de la empresa
    const empresaConnection = await databaseManager.getEmpresaConnection(empresaId, dbConfig);

    // Obtener modelo de Informe para esta conexión
    const InformeModel = empresaConnection.models['Informe'] ||
      empresaConnection.model('Informe', InformeSchema);

    // 1. Eliminar informes plantilla existentes
    const resultadoEliminacion = await InformeModel.deleteMany({ esPlantilla: true });
    const eliminados = resultadoEliminacion.deletedCount || 0;

    // 2. Obtener informes predefinidos actualizados
    const informesPredefinidos = obtenerInformesPredefinidos();

    // 3. Crear nuevos informes
    const informesParaCrear = informesPredefinidos.map(informe => ({
      ...informe,
      empresaId,
      esPlantilla: true,
      compartido: true,
      activo: true,
    }));

    const informesCreados = await InformeModel.insertMany(informesParaCrear);

    console.log(`  [${empresaNombre}] Eliminados: ${eliminados}, Creados: ${informesCreados.length}`);

    return { eliminados, creados: informesCreados.length };
  } catch (error: any) {
    console.error(`  [${empresaNombre}] Error: ${error.message}`);
    return { eliminados: 0, creados: 0 };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('ACTUALIZACIÓN DE INFORMES PREDEFINIDOS');
  console.log('='.repeat(60));
  console.log('');

  // Conectar a MongoDB principal (plataforma) - usar 'omerix' como fallback
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';
  console.log(`Conectando a: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri);
    console.log('Conexión establecida\n');

    // Obtener empresas directamente de la colección
    const db = mongoose.connection.db!;
    const empresas = await db.collection('empresas').find({ activo: { $ne: false } }).toArray();

    console.log(`Empresas encontradas: ${empresas.length}\n`);

    if (empresas.length === 0) {
      console.log('No hay empresas para procesar.');
      process.exit(0);
    }

    let totalEliminados = 0;
    let totalCreados = 0;
    let empresasProcesadas = 0;
    let empresasConError = 0;

    // Procesar cada empresa
    for (const empresa of empresas) {
      const empresaId = String(empresa._id);
      const empresaNombre = empresa.nombre || empresaId;
      const dbConfig = empresa.databaseConfig as IDatabaseConfig;

      if (!dbConfig || !dbConfig.name) {
        console.log(`  [${empresaNombre}] Sin configuración de BD, omitiendo...`);
        continue;
      }

      try {
        const resultado = await actualizarInformesEmpresa(empresaId, empresaNombre, dbConfig);
        totalEliminados += resultado.eliminados;
        totalCreados += resultado.creados;
        empresasProcesadas++;
      } catch (error: any) {
        console.error(`  [${empresaNombre}] Error procesando: ${error.message}`);
        empresasConError++;
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN');
    console.log('='.repeat(60));
    console.log(`Empresas procesadas: ${empresasProcesadas}`);
    console.log(`Empresas con error: ${empresasConError}`);
    console.log(`Total informes eliminados: ${totalEliminados}`);
    console.log(`Total informes creados: ${totalCreados}`);
    console.log('');
    console.log('Actualización completada.');

  } catch (error: any) {
    console.error('Error fatal:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Ejecutar
main();
