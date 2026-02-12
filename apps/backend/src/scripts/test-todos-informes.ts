/**
 * Script para probar TODOS los informes predefinidos
 * Ejecutar: npx tsx src/scripts/test-todos-informes.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { databaseManager } from '../services/database-manager.service';
import { IDatabaseConfig } from '../modules/empresa/Empresa';

interface ResultadoPrueba {
  nombre: string;
  modulo: string;
  estado: 'OK' | 'SIN_DATOS' | 'ERROR';
  registros: number;
  mensaje?: string;
}

async function probarInforme(
  connection: mongoose.Connection,
  informe: any
): Promise<ResultadoPrueba> {
  const resultado: ResultadoPrueba = {
    nombre: informe.nombre,
    modulo: informe.modulo,
    estado: 'OK',
    registros: 0
  };

  try {
    const coleccion = informe.fuente?.coleccion;
    if (!coleccion) {
      resultado.estado = 'ERROR';
      resultado.mensaje = 'Sin colección definida';
      return resultado;
    }

    // Construir pipeline básico
    const pipeline: any[] = [];

    // Match inicial con filtros
    const matchStage: any = {};
    if (informe.filtros) {
      for (const filtro of informe.filtros) {
        if (filtro.operador === 'igual') {
          matchStage[filtro.campo] = filtro.valor;
        } else if (filtro.operador === 'mayor') {
          matchStage[filtro.campo] = { $gt: filtro.valor };
        } else if (filtro.operador === 'en') {
          matchStage[filtro.campo] = { $in: filtro.valor };
        }
      }
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Unwind si existe
    if (informe.fuente?.unwindArray) {
      pipeline.push({
        $unwind: {
          path: `$${informe.fuente.unwindArray}`,
          preserveNullAndEmptyArrays: false
        }
      });
    }

    // Limit para prueba
    pipeline.push({ $limit: 100 });

    // Ejecutar
    const datos = await connection.collection(coleccion).aggregate(pipeline).toArray();
    resultado.registros = datos.length;

    if (datos.length === 0) {
      resultado.estado = 'SIN_DATOS';
      resultado.mensaje = 'No hay datos';
    }

  } catch (error: any) {
    resultado.estado = 'ERROR';
    resultado.mensaje = error.message;
  }

  return resultado;
}

async function main() {
  console.log('='.repeat(70));
  console.log('PRUEBA DE TODOS LOS INFORMES PREDEFINIDOS');
  console.log('='.repeat(70));
  console.log('');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';

  try {
    await mongoose.connect(mongoUri);
    console.log('Conexión establecida\n');

    const db = mongoose.connection.db!;
    const empresas = await db.collection('empresas').find({ activo: { $ne: false } }).toArray();

    // Buscar empresa con más datos
    let empresa = null;
    let maxFacturas = 0;

    for (const e of empresas) {
      if (e.databaseConfig?.name) {
        const tempConn = await databaseManager.getEmpresaConnection(String(e._id), e.databaseConfig);
        const facturaCount = await tempConn.collection('facturas').countDocuments({});
        if (facturaCount > maxFacturas) {
          maxFacturas = facturaCount;
          empresa = e;
        }
      }
    }

    if (!empresa) {
      console.log('No hay empresas con configuración de BD');
      process.exit(0);
    }

    const empresaId = String(empresa._id);
    const dbConfig = empresa.databaseConfig as IDatabaseConfig;

    console.log(`Empresa: ${empresa.nombre}`);
    console.log(`Database: ${dbConfig.name}\n`);

    const connection = await databaseManager.getEmpresaConnection(empresaId, dbConfig);

    // Obtener todos los informes predefinidos
    const informes = await connection.collection('informes').find({
      esPlantilla: true
    }).sort({ modulo: 1, orden: 1 }).toArray();

    console.log(`Total informes predefinidos: ${informes.length}\n`);

    // Agrupar por módulo
    const modulosMap = new Map<string, any[]>();
    for (const informe of informes) {
      const modulo = informe.modulo || 'SIN_MODULO';
      if (!modulosMap.has(modulo)) {
        modulosMap.set(modulo, []);
      }
      modulosMap.get(modulo)!.push(informe);
    }

    const resultados: ResultadoPrueba[] = [];
    let totalOk = 0;
    let totalSinDatos = 0;
    let totalError = 0;

    // Probar cada módulo
    for (const [modulo, informesModulo] of modulosMap) {
      console.log('─'.repeat(70));
      console.log(`📁 MÓDULO: ${modulo.toUpperCase()}`);
      console.log('─'.repeat(70));

      for (const informe of informesModulo) {
        const resultado = await probarInforme(connection, informe);
        resultados.push(resultado);

        let icono = '✅';
        let color = '';
        if (resultado.estado === 'SIN_DATOS') {
          icono = '⚠️';
          totalSinDatos++;
        } else if (resultado.estado === 'ERROR') {
          icono = '❌';
          totalError++;
        } else {
          totalOk++;
        }

        const registrosStr = resultado.registros > 0 ? `(${resultado.registros} reg.)` : '';
        const mensajeStr = resultado.mensaje ? ` - ${resultado.mensaje}` : '';

        console.log(`  ${icono} ${informe.nombre.padEnd(40)} ${registrosStr.padEnd(12)} ${mensajeStr}`);
      }

      console.log('');
    }

    // Resumen
    console.log('═'.repeat(70));
    console.log('RESUMEN');
    console.log('═'.repeat(70));
    console.log(`✅ Funcionando correctamente: ${totalOk}`);
    console.log(`⚠️  Sin datos (pero funciona):  ${totalSinDatos}`);
    console.log(`❌ Con errores:                 ${totalError}`);
    console.log(`📊 Total informes:              ${informes.length}`);

    // Mostrar errores si los hay
    const errores = resultados.filter(r => r.estado === 'ERROR');
    if (errores.length > 0) {
      console.log('\n🔴 INFORMES CON ERRORES:');
      for (const error of errores) {
        console.log(`   - ${error.nombre}: ${error.mensaje}`);
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
