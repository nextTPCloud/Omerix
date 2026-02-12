/**
 * Script para probar el informe de Resumen de Márgenes
 * Ejecutar: npx tsx src/scripts/test-informe-margenes.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { databaseManager } from '../services/database-manager.service';
import { informesService } from '../modules/informes/informes.service';
import { IDatabaseConfig } from '../modules/empresa/Empresa';

async function main() {
  console.log('='.repeat(60));
  console.log('PRUEBA INFORME RESUMEN DE MÁRGENES');
  console.log('='.repeat(60));
  console.log('');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';

  try {
    await mongoose.connect(mongoUri);
    console.log('Conexión establecida\n');

    // Obtener primera empresa con datos
    const db = mongoose.connection.db!;
    const empresas = await db.collection('empresas').find({ activo: { $ne: false } }).toArray();

    if (empresas.length === 0) {
      console.log('No hay empresas');
      process.exit(0);
    }

    // Buscar empresa con facturas (empezar por la última que suele tener datos de prueba)
    let empresa = null;
    for (const e of empresas.reverse()) {
      if (e.databaseConfig?.name) {
        const tempConn = await databaseManager.getEmpresaConnection(String(e._id), e.databaseConfig);
        const facturaCount = await tempConn.collection('facturas').countDocuments({});
        console.log(`${e.nombre}: ${facturaCount} facturas`);
        if (facturaCount > 0) {
          empresa = e;
          break;
        }
      }
    }

    if (!empresa) {
      console.log('\nNo hay empresas con facturas para probar');
      process.exit(0);
    }
    console.log('');

    const empresaId = String(empresa._id);
    const dbConfig = empresa.databaseConfig as IDatabaseConfig;

    console.log(`Empresa: ${empresa.nombre}`);
    console.log(`Database: ${dbConfig.name}\n`);

    // Buscar el informe "Resumen de Márgenes"
    const connection = await databaseManager.getEmpresaConnection(empresaId, dbConfig);
    const informes = await connection.collection('informes').find({
      nombre: 'Resumen de Márgenes',
      esPlantilla: true
    }).toArray();

    if (informes.length === 0) {
      console.log('No se encontró el informe "Resumen de Márgenes"');
      process.exit(0);
    }

    const informe = informes[0];
    console.log('Informe encontrado:', informe.nombre);
    console.log('Campos:', informe.campos.map((c: any) => c.etiqueta).join(', '));
    console.log('');

    // Consultar facturas directamente para ver los márgenes
    console.log('Consultando facturas con márgenes...\n');

    const facturas = await connection.collection('facturas').find({
      activo: true,
      'totales.margenPorcentaje': { $exists: true, $ne: 0 }
    }).sort({ fecha: -1 }).limit(10).toArray();

    if (facturas.length === 0) {
      console.log('No hay facturas con márgenes calculados.');

      // Ver si hay alguna factura
      const totalFacturas = await connection.collection('facturas').countDocuments({});
      console.log(`Total de facturas en BD: ${totalFacturas}`);

      if (totalFacturas > 0) {
        const primeraFactura = await connection.collection('facturas').findOne({});
        console.log('\nEjemplo de factura (totales):');
        console.log(JSON.stringify(primeraFactura?.totales, null, 2));
      }
    } else {
      console.log(`Facturas encontradas: ${facturas.length}\n`);
      console.log('-'.repeat(120));
      console.log(
        'Factura'.padEnd(18) +
        'Fecha'.padEnd(12) +
        'Cliente'.padEnd(25) +
        'Venta'.padStart(12) +
        'Coste'.padStart(12) +
        'Margen €'.padStart(12) +
        'Margen %'.padStart(12)
      );
      console.log('-'.repeat(120));

      for (const factura of facturas) {
        const fecha = factura.fecha ? new Date(factura.fecha).toLocaleDateString('es-ES') : '-';
        const venta = factura.totales?.totalFactura?.toFixed(2) || '0.00';
        const coste = factura.totales?.costeTotal?.toFixed(2) || '0.00';
        const margenEur = factura.totales?.margenBruto?.toFixed(2) || '0.00';
        const margenPct = factura.totales?.margenPorcentaje?.toFixed(2) || '0.00';

        console.log(
          (factura.codigo || '-').toString().padEnd(18) +
          fecha.padEnd(12) +
          (factura.clienteNombre || '-').toString().substring(0, 23).padEnd(25) +
          (venta + ' €').padStart(12) +
          (coste + ' €').padStart(12) +
          (margenEur + ' €').padStart(12) +
          (margenPct + ' %').padStart(12)
        );
      }

      console.log('-'.repeat(120));

      // Mostrar cómo se formatea el porcentaje en el informe
      console.log('\n📊 VERIFICACIÓN DEL FORMATEO DE PORCENTAJE:');
      console.log('-'.repeat(50));
      for (const factura of facturas.slice(0, 3)) {
        const valorBD = factura.totales?.margenPorcentaje;
        // Simulación del formateo ANTERIOR (incorrecto)
        const formateoAnterior = valorBD ? `${(valorBD * 100).toFixed(2)}%` : '-';
        // Simulación del formateo NUEVO (correcto)
        const formateoNuevo = valorBD ? `${Number(valorBD).toFixed(2)}%` : '-';

        console.log(`${factura.codigo}:`);
        console.log(`  Valor en BD: ${valorBD}`);
        console.log(`  Formateo ANTERIOR (incorrecto): ${formateoAnterior}`);
        console.log(`  Formateo NUEVO (correcto): ${formateoNuevo}`);
        console.log('');
      }
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
