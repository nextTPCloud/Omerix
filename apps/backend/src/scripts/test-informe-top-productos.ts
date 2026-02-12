/**
 * Script para probar el informe de Top Productos Vendidos
 * Ejecutar: npx tsx src/scripts/test-informe-top-productos.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { databaseManager } from '../services/database-manager.service';
import { IDatabaseConfig } from '../modules/empresa/Empresa';

async function main() {
  console.log('='.repeat(60));
  console.log('PRUEBA INFORME TOP PRODUCTOS VENDIDOS');
  console.log('='.repeat(60));
  console.log('');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';

  try {
    await mongoose.connect(mongoUri);
    console.log('Conexión establecida\n');

    const db = mongoose.connection.db!;
    const empresas = await db.collection('empresas').find({ activo: { $ne: false } }).toArray();

    // Buscar empresa con facturas
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

    const connection = await databaseManager.getEmpresaConnection(empresaId, dbConfig);

    // Buscar el informe "Top Productos Vendidos"
    const informes = await connection.collection('informes').find({
      nombre: 'Top Productos Vendidos',
      esPlantilla: true
    }).toArray();

    if (informes.length === 0) {
      console.log('No se encontró el informe "Top Productos Vendidos"');
      process.exit(0);
    }

    const informe = informes[0];
    console.log('Informe encontrado:', informe.nombre);
    console.log('Descripción:', informe.descripcion);
    console.log('Fuente:', JSON.stringify(informe.fuente));
    console.log('Campos:', informe.campos.map((c: any) => c.etiqueta).join(', '));
    console.log('');

    // Simular la ejecución del pipeline del informe
    console.log('Ejecutando pipeline de agregación...\n');

    // Pipeline basado en la configuración del informe
    const pipeline: any[] = [
      // Match inicial
      {
        $match: {
          activo: true,
          'lineas.tipo': 'producto'
        }
      },
      // Unwind de líneas
      {
        $unwind: {
          path: '$lineas',
          preserveNullAndEmptyArrays: false
        }
      },
      // Filtrar solo productos
      {
        $match: {
          'lineas.tipo': 'producto'
        }
      },
      // Agrupar por producto
      {
        $group: {
          _id: '$lineas.nombre',
          codigo: { $first: '$lineas.codigo' },
          cantidadVendida: { $sum: '$lineas.cantidad' },
          totalVentas: { $sum: '$lineas.subtotal' },
          margenTotal: { $sum: '$lineas.margenTotalLinea' }
        }
      },
      // Ordenar por total de ventas
      {
        $sort: { totalVentas: -1 }
      },
      // Limitar a 50
      {
        $limit: 50
      }
    ];

    const resultados = await connection.collection('facturas').aggregate(pipeline).toArray();

    if (resultados.length === 0) {
      console.log('No hay productos vendidos en las facturas.');

      // Verificar si hay líneas en las facturas
      const facturasConLineas = await connection.collection('facturas').find({
        'lineas.0': { $exists: true }
      }).limit(1).toArray();

      if (facturasConLineas.length > 0) {
        console.log('\nEjemplo de líneas de factura:');
        const lineas = facturasConLineas[0].lineas?.slice(0, 3) || [];
        for (const linea of lineas) {
          console.log(`  - ${linea.nombre} (tipo: ${linea.tipo}, cantidad: ${linea.cantidad})`);
        }
      }
    } else {
      console.log(`Productos vendidos encontrados: ${resultados.length}\n`);
      console.log('-'.repeat(100));
      console.log(
        'SKU'.padEnd(15) +
        'Producto'.padEnd(35) +
        'Uds.'.padStart(10) +
        'Total Ventas'.padStart(15) +
        'Margen'.padStart(15)
      );
      console.log('-'.repeat(100));

      for (const producto of resultados) {
        console.log(
          (producto.codigo || '-').toString().substring(0, 13).padEnd(15) +
          (producto._id || '-').toString().substring(0, 33).padEnd(35) +
          producto.cantidadVendida.toString().padStart(10) +
          (producto.totalVentas?.toFixed(2) + ' €').padStart(15) +
          ((producto.margenTotal?.toFixed(2) || '0.00') + ' €').padStart(15)
        );
      }

      console.log('-'.repeat(100));

      // Totales
      const totalUnidades = resultados.reduce((sum, p) => sum + p.cantidadVendida, 0);
      const totalVentas = resultados.reduce((sum, p) => sum + (p.totalVentas || 0), 0);
      const totalMargen = resultados.reduce((sum, p) => sum + (p.margenTotal || 0), 0);

      console.log(
        'TOTALES'.padEnd(50) +
        totalUnidades.toString().padStart(10) +
        (totalVentas.toFixed(2) + ' €').padStart(15) +
        (totalMargen.toFixed(2) + ' €').padStart(15)
      );
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
