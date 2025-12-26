/**
 * Script simplificado para generar datos de prueba
 * Usa MongoDB directamente sin importar modelos complejos
 *
 * Uso: npx ts-node src/scripts/seed-test-data-simple.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const nombresClientes = [
  'Tecnologías Avanzadas SL', 'Construcciones García', 'Servicios Martínez',
  'Distribuciones López', 'Consultora Innovación', 'Transportes Rápidos',
  'Alimentación Natural', 'Electrónica Digital', 'Moda Contemporánea',
  'Deportes Extremos', 'Farmacia Central', 'Restaurante El Buen Sabor',
  'Clínica Dental Sonrisa', 'Taller Mecánico Auto', 'Inmobiliaria Costa',
];

const categoriasProductos = ['Electrónica', 'Ropa', 'Alimentación', 'Hogar', 'Deportes'];
const productosBase = ['Widget', 'Gadget', 'Componente', 'Accesorio', 'Kit'];

function generarCIF(): string {
  const letras = 'ABCDEFGHJNPQRSUVW';
  const letra = letras[Math.floor(Math.random() * letras.length)];
  const numero = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return letra + numero + Math.floor(Math.random() * 10);
}

async function seedTestData() {
  const empresaIdArg = process.argv[2];

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db!;

    // Buscar licencia
    let licencia;
    if (empresaIdArg) {
      const { ObjectId } = mongoose.Types;
      licencia = await db.collection('licencias').findOne({ empresaId: new ObjectId(empresaIdArg) });
    } else {
      licencia = await db.collection('licencias').findOne({});
    }
    if (!licencia) {
      console.error('❌ No se encontró ninguna licencia');
      process.exit(1);
    }

    const empresaId = licencia.empresaId.toString();
    console.log(`📋 Empresa ID: ${empresaId}`);

    // Buscar empresa para obtener nombre de BD
    const empresa = await db.collection('empresas').findOne({ _id: licencia.empresaId });
    if (!empresa) {
      console.error('❌ Empresa no encontrada');
      process.exit(1);
    }

    console.log(`📋 Empresa: ${empresa.nombre}`);

    // Obtener nombre de la BD del tenant
    const tenantDbName = empresa.databaseConfig?.dbName || `omerix_${empresaId}`;
    console.log(`📋 Base de datos tenant: ${tenantDbName}`);

    // Conectar a la BD del tenant
    const tenantDb = mongoose.connection.useDb(tenantDbName);

    // Contar datos existentes
    const clientesExistentes = await tenantDb.collection('clientes').countDocuments();
    const productosExistentes = await tenantDb.collection('productos').countDocuments();
    const facturasExistentes = await tenantDb.collection('facturas').countDocuments();

    console.log('');
    console.log('📊 Datos existentes:');
    console.log(`   Clientes: ${clientesExistentes}`);
    console.log(`   Productos: ${productosExistentes}`);
    console.log(`   Facturas: ${facturasExistentes}`);

    // Calcular cuántos crear (2/3 del límite)
    const LIMITE_CLIENTES = 500;
    const LIMITE_PRODUCTOS = 500;
    const LIMITE_FACTURAS = 200;

    const clientesACrear = Math.max(0, Math.floor(LIMITE_CLIENTES * 0.67) - clientesExistentes);
    const productosACrear = Math.max(0, Math.floor(LIMITE_PRODUCTOS * 0.67) - productosExistentes);
    const facturasACrear = Math.max(0, Math.floor(LIMITE_FACTURAS * 0.67) - facturasExistentes);

    console.log('');
    console.log('🎯 Objetivo (2/3 de límites):');
    console.log(`   Clientes: crear ${clientesACrear}`);
    console.log(`   Productos: crear ${productosACrear}`);
    console.log(`   Facturas: crear ${facturasACrear}`);
    console.log('');

    // ====== CREAR CLIENTES ======
    if (clientesACrear > 0) {
      console.log(`📝 Creando ${clientesACrear} clientes...`);
      const clientes: any[] = [];

      for (let i = 0; i < clientesACrear; i++) {
        const nombreBase = nombresClientes[i % nombresClientes.length];
        const nombre = i < nombresClientes.length ? nombreBase : `${nombreBase} ${Math.floor(i / nombresClientes.length) + 1}`;

        clientes.push({
          codigo: `CLI${(clientesExistentes + i + 1).toString().padStart(5, '0')}`,
          nombre,
          nombreComercial: nombre,
          tipoDocumento: 'CIF',
          numeroDocumento: generarCIF(),
          email: `cliente${clientesExistentes + i + 1}@ejemplo.com`,
          telefono: '9' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
          direccion: `Calle Principal ${Math.floor(Math.random() * 200) + 1}`,
          ciudad: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'][Math.floor(Math.random() * 4)],
          pais: 'España',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await tenantDb.collection('clientes').insertMany(clientes);
      console.log('   ✅ Clientes creados');
    }

    // ====== CREAR PRODUCTOS ======
    if (productosACrear > 0) {
      console.log(`📝 Creando ${productosACrear} productos...`);
      const productos: any[] = [];

      for (let i = 0; i < productosACrear; i++) {
        const categoria = categoriasProductos[i % categoriasProductos.length];
        const base = productosBase[Math.floor(i / categoriasProductos.length) % productosBase.length];
        const nombre = `${base} ${categoria} ${Math.floor(i / 25) + 1}`;
        const precioCoste = Math.floor(Math.random() * 100) + 5;

        productos.push({
          codigo: `PROD${(productosExistentes + i + 1).toString().padStart(5, '0')}`,
          nombre,
          descripcion: `${nombre} de alta calidad`,
          categoria,
          tipo: 'producto',
          precioCoste,
          precioVenta: Math.round(precioCoste * 1.4 * 100) / 100,
          iva: 21,
          stockActual: Math.floor(Math.random() * 100) + 10,
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await tenantDb.collection('productos').insertMany(productos);
      console.log('   ✅ Productos creados');
    }

    // ====== CREAR FACTURAS ======
    if (facturasACrear > 0) {
      console.log(`📝 Creando ${facturasACrear} facturas...`);

      const clientes = await tenantDb.collection('clientes').find().limit(50).toArray();
      const productos = await tenantDb.collection('productos').find().limit(20).toArray();

      if (clientes.length === 0 || productos.length === 0) {
        console.log('   ⚠️ No hay clientes o productos');
      } else {
        const facturas: any[] = [];
        const ahora = new Date();

        for (let i = 0; i < facturasACrear; i++) {
          const cliente = clientes[Math.floor(Math.random() * clientes.length)];
          const producto = productos[Math.floor(Math.random() * productos.length)];
          const cantidad = Math.floor(Math.random() * 5) + 1;
          const precioUnitario = producto.precioVenta || 50;
          const baseImponible = cantidad * precioUnitario;
          const totalIva = baseImponible * 0.21;

          facturas.push({
            serie: 'F',
            numero: facturasExistentes + i + 1,
            codigo: `F${ahora.getFullYear()}-${(facturasExistentes + i + 1).toString().padStart(6, '0')}`,
            fecha: ahora,
            clienteId: cliente._id,
            clienteNombre: cliente.nombre,
            lineas: [{
              productoId: producto._id,
              descripcion: producto.nombre,
              cantidad,
              precioUnitario,
              iva: 21,
              subtotal: baseImponible,
            }],
            baseImponible,
            totalIva,
            total: baseImponible + totalIva,
            estado: ['borrador', 'emitida', 'pagada'][Math.floor(Math.random() * 3)],
            createdAt: ahora,
            updatedAt: ahora,
          });
        }

        await tenantDb.collection('facturas').insertMany(facturas);
        console.log('   ✅ Facturas creadas');
      }
    }

    // ====== ACTUALIZAR USO EN LICENCIA ======
    console.log('');
    console.log('📊 Actualizando uso en licencia...');

    const clientesFinales = await tenantDb.collection('clientes').countDocuments();
    const productosFinales = await tenantDb.collection('productos').countDocuments();
    const facturasFinales = await tenantDb.collection('facturas').countDocuments();

    await db.collection('licencias').updateOne(
      { _id: licencia._id },
      {
        $set: {
          'usoActual.clientesActuales': clientesFinales,
          'usoActual.productosActuales': productosFinales,
          'usoActual.facturasEsteMes': facturasFinales,
        }
      }
    );

    console.log('');
    console.log('✅ Datos de prueba generados:');
    console.log(`   Clientes: ${clientesFinales}`);
    console.log(`   Productos: ${productosFinales}`);
    console.log(`   Facturas: ${facturasFinales}`);
    console.log('');
    console.log('🎯 Los avisos de límite deberían aparecer en el header.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedTestData();
