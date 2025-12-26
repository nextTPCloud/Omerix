/**
 * Script para generar datos de prueba que llenen 2/3 de los límites del plan
 *
 * Límites del Plan Básico:
 * - facturas/mes: 200 → generamos 133
 * - productos: 500 → generamos 333
 * - clientes: 500 → generamos 333
 *
 * Uso: npx ts-node src/scripts/seed-test-data.ts [empresaId]
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Importar modelos
import Licencia from '../modules/licencias/Licencia';
import Empresa from '../modules/empresa/Empresa';
import {
  getClienteModel,
  getProductoModel,
  getFacturaModel,
  getAlmacenModel,
} from '../utils/dynamic-models.helper';

// Datos de ejemplo
const nombresClientes = [
  'Tecnologías Avanzadas SL', 'Construcciones García', 'Servicios Martínez',
  'Distribuciones López', 'Consultora Innovación', 'Transportes Rápidos',
  'Alimentación Natural', 'Electrónica Digital', 'Moda Contemporánea',
  'Deportes Extremos', 'Farmacia Central', 'Restaurante El Buen Sabor',
  'Clínica Dental Sonrisa', 'Taller Mecánico Auto', 'Inmobiliaria Costa',
  'Librería Cultura', 'Floristería Jardín', 'Peluquería Estilo',
  'Gimnasio Fitness', 'Hotel Sol y Mar', 'Agencia Viajes', 'Seguros Confianza',
  'Asesoría Fiscal', 'Imprenta Gráfica', 'Ferretería Industrial'
];

const categoriasProductos = [
  'Electrónica', 'Ropa', 'Alimentación', 'Hogar', 'Deportes',
  'Oficina', 'Herramientas', 'Jardín', 'Automóvil', 'Salud'
];

const productosBase = [
  'Widget', 'Gadget', 'Componente', 'Accesorio', 'Kit',
  'Pack', 'Set', 'Módulo', 'Unidad', 'Sistema'
];

function generarCIF(): string {
  const letras = 'ABCDEFGHJNPQRSUVW';
  const letra = letras[Math.floor(Math.random() * letras.length)];
  const numero = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  const control = Math.floor(Math.random() * 10);
  return letra + numero + control;
}

function generarTelefono(): string {
  return '9' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
}

function generarEmail(nombre: string): string {
  const dominio = ['gmail.com', 'hotmail.com', 'empresa.es', 'outlook.com'][Math.floor(Math.random() * 4)];
  const nombreLimpio = nombre.toLowerCase()
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15);
  return `${nombreLimpio}@${dominio}`;
}

async function seedTestData() {
  const empresaIdArg = process.argv[2];

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Buscar licencia y empresa
    let licencia;
    if (empresaIdArg) {
      licencia = await Licencia.findOne({ empresaId: empresaIdArg });
    } else {
      licencia = await Licencia.findOne();
    }

    if (!licencia) {
      console.error('❌ No se encontró ninguna licencia');
      process.exit(1);
    }

    const empresaId = licencia.empresaId.toString();
    const empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      console.error('❌ Empresa no encontrada');
      process.exit(1);
    }

    console.log(`📋 Empresa: ${empresa.nombre} (${empresaId})`);

    // Obtener dbConfig de la empresa
    const dbConfig = (empresa as any).databaseConfig;
    if (!dbConfig) {
      console.error('❌ La empresa no tiene configuración de base de datos');
      process.exit(1);
    }

    // Obtener modelos dinámicos
    const Cliente = await getClienteModel(empresaId, dbConfig);
    const Producto = await getProductoModel(empresaId, dbConfig);
    const Factura = await getFacturaModel(empresaId, dbConfig);
    const Almacen = await getAlmacenModel(empresaId, dbConfig);

    // Contar datos existentes
    const clientesExistentes = await Cliente.countDocuments();
    const productosExistentes = await Producto.countDocuments();
    const facturasExistentes = await Factura.countDocuments();

    console.log('');
    console.log('📊 Datos existentes:');
    console.log(`   Clientes: ${clientesExistentes}`);
    console.log(`   Productos: ${productosExistentes}`);
    console.log(`   Facturas: ${facturasExistentes}`);
    console.log('');

    // Calcular cuántos crear (2/3 del límite - existentes)
    const LIMITE_CLIENTES = 500;
    const LIMITE_PRODUCTOS = 500;
    const LIMITE_FACTURAS = 200;

    const clientesACrear = Math.max(0, Math.floor(LIMITE_CLIENTES * 0.67) - clientesExistentes);
    const productosACrear = Math.max(0, Math.floor(LIMITE_PRODUCTOS * 0.67) - productosExistentes);
    const facturasACrear = Math.max(0, Math.floor(LIMITE_FACTURAS * 0.67) - facturasExistentes);

    console.log('🎯 Objetivo (2/3 de límites):');
    console.log(`   Clientes: ${Math.floor(LIMITE_CLIENTES * 0.67)} (crear ${clientesACrear})`);
    console.log(`   Productos: ${Math.floor(LIMITE_PRODUCTOS * 0.67)} (crear ${productosACrear})`);
    console.log(`   Facturas: ${Math.floor(LIMITE_FACTURAS * 0.67)} (crear ${facturasACrear})`);
    console.log('');

    // ====== CREAR CLIENTES ======
    if (clientesACrear > 0) {
      console.log(`📝 Creando ${clientesACrear} clientes...`);
      const clientesBatch: any[] = [];

      for (let i = 0; i < clientesACrear; i++) {
        const nombreBase = nombresClientes[i % nombresClientes.length];
        const nombre = i < nombresClientes.length ? nombreBase : `${nombreBase} ${Math.floor(i / nombresClientes.length) + 1}`;

        clientesBatch.push({
          codigo: `CLI${(clientesExistentes + i + 1).toString().padStart(5, '0')}`,
          nombre,
          nombreComercial: nombre,
          tipoDocumento: 'CIF',
          numeroDocumento: generarCIF(),
          email: generarEmail(nombre),
          telefono: generarTelefono(),
          direccion: `Calle Principal ${Math.floor(Math.random() * 200) + 1}`,
          codigoPostal: (Math.floor(Math.random() * 52000) + 1000).toString().padStart(5, '0'),
          ciudad: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'][Math.floor(Math.random() * 5)],
          provincia: 'España',
          pais: 'España',
          tipoCliente: ['particular', 'empresa', 'autonomo'][Math.floor(Math.random() * 3)],
          formaPago: ['contado', 'transferencia', '30dias', '60dias'][Math.floor(Math.random() * 4)],
          activo: true,
        });

        // Insertar en lotes de 100
        if (clientesBatch.length >= 100) {
          await Cliente.insertMany(clientesBatch);
          process.stdout.write('.');
          clientesBatch.length = 0;
        }
      }

      // Insertar resto
      if (clientesBatch.length > 0) {
        await Cliente.insertMany(clientesBatch);
      }
      console.log(' ✅');
    }

    // ====== CREAR PRODUCTOS ======
    if (productosACrear > 0) {
      console.log(`📝 Creando ${productosACrear} productos...`);
      const productosBatch: any[] = [];

      for (let i = 0; i < productosACrear; i++) {
        const categoria = categoriasProductos[i % categoriasProductos.length];
        const base = productosBase[Math.floor(i / categoriasProductos.length) % productosBase.length];
        const numero = Math.floor(i / (categoriasProductos.length * productosBase.length)) + 1;
        const nombre = `${base} ${categoria} ${numero > 1 ? numero : ''}`.trim();

        const precioCoste = Math.floor(Math.random() * 100) + 5;
        const margen = 0.2 + Math.random() * 0.5;

        productosBatch.push({
          codigo: `PROD${(productosExistentes + i + 1).toString().padStart(5, '0')}`,
          codigoBarras: `84${Math.floor(Math.random() * 10000000000).toString().padStart(11, '0')}`,
          nombre,
          descripcion: `${nombre} de alta calidad`,
          categoria,
          tipo: 'producto',
          precioCoste,
          precioVenta: Math.round(precioCoste * (1 + margen) * 100) / 100,
          iva: [4, 10, 21][Math.floor(Math.random() * 3)],
          unidadMedida: ['unidad', 'kg', 'litro', 'metro'][Math.floor(Math.random() * 4)],
          stockMinimo: Math.floor(Math.random() * 10) + 1,
          stockActual: Math.floor(Math.random() * 100) + 10,
          activo: true,
          gestionaStock: true,
        });

        if (productosBatch.length >= 100) {
          await Producto.insertMany(productosBatch);
          process.stdout.write('.');
          productosBatch.length = 0;
        }
      }

      if (productosBatch.length > 0) {
        await Producto.insertMany(productosBatch);
      }
      console.log(' ✅');
    }

    // ====== CREAR FACTURAS ======
    if (facturasACrear > 0) {
      console.log(`📝 Creando ${facturasACrear} facturas...`);

      const clientes = await Cliente.find().limit(100).lean();
      const productos = await Producto.find().limit(50).lean();

      if (clientes.length === 0 || productos.length === 0) {
        console.log('⚠️ No hay clientes o productos para crear facturas');
      } else {
        const facturasBatch: any[] = [];
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

        for (let i = 0; i < facturasACrear; i++) {
          const cliente = clientes[Math.floor(Math.random() * clientes.length)] as any;
          const numLineas = Math.floor(Math.random() * 5) + 1;
          const lineas: any[] = [];
          let baseImponible = 0;
          let totalIva = 0;

          for (let j = 0; j < numLineas; j++) {
            const producto = productos[Math.floor(Math.random() * productos.length)] as any;
            const cantidad = Math.floor(Math.random() * 10) + 1;
            const precioUnitario = producto.precioVenta || 10;
            const iva = producto.iva || 21;
            const subtotal = cantidad * precioUnitario;
            const ivaLinea = subtotal * (iva / 100);

            lineas.push({
              productoId: producto._id,
              codigo: producto.codigo,
              descripcion: producto.nombre,
              cantidad,
              precioUnitario,
              descuento: 0,
              iva,
              subtotal,
              total: subtotal + ivaLinea,
            });

            baseImponible += subtotal;
            totalIva += ivaLinea;
          }

          const diasDelMes = Math.floor((ahora.getTime() - inicioMes.getTime()) / (1000 * 60 * 60 * 24)) || 1;
          const fechaFactura = new Date(inicioMes.getTime() + Math.random() * diasDelMes * 24 * 60 * 60 * 1000);

          facturasBatch.push({
            serie: 'F',
            numero: facturasExistentes + i + 1,
            codigo: `F${ahora.getFullYear()}-${(facturasExistentes + i + 1).toString().padStart(6, '0')}`,
            fecha: fechaFactura,
            fechaVencimiento: new Date(fechaFactura.getTime() + 30 * 24 * 60 * 60 * 1000),
            clienteId: cliente._id,
            clienteNombre: cliente.nombre,
            clienteNIF: cliente.numeroDocumento,
            lineas,
            baseImponible,
            totalIva,
            total: baseImponible + totalIva,
            estado: ['borrador', 'emitida', 'pagada'][Math.floor(Math.random() * 3)],
            formaPago: cliente.formaPago || 'contado',
          });

          if (facturasBatch.length >= 50) {
            await Factura.insertMany(facturasBatch);
            process.stdout.write('.');
            facturasBatch.length = 0;
          }
        }

        if (facturasBatch.length > 0) {
          await Factura.insertMany(facturasBatch);
        }
        console.log(' ✅');
      }
    }

    // ====== ACTUALIZAR USO EN LICENCIA ======
    console.log('');
    console.log('📊 Actualizando uso en licencia...');

    const clientesFinales = await Cliente.countDocuments();
    const productosFinales = await Producto.countDocuments();
    const facturasFinales = await Factura.countDocuments();
    const almacenesFinales = await Almacen.countDocuments();

    // Actualizar campos individuales
    licencia.usoActual.clientesActuales = clientesFinales;
    licencia.usoActual.productosActuales = productosFinales;
    licencia.usoActual.facturasEsteMes = facturasFinales;
    licencia.usoActual.almacenesActuales = almacenesFinales || 1;

    await licencia.save();

    console.log('');
    console.log('✅ Datos de prueba generados:');
    console.log(`   Clientes: ${clientesFinales}`);
    console.log(`   Productos: ${productosFinales}`);
    console.log(`   Facturas: ${facturasFinales}`);
    console.log(`   Almacenes: ${almacenesFinales || 1}`);
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
