/**
 * Script para generar datos de prueba completos para TPV
 *
 * Incluye:
 * - Formas de pago
 * - Familias de productos
 * - Variantes globales (Talla, Color)
 * - Productos simples
 * - Productos con variantes
 * - Productos tipo kit (compuestos)
 * - Clientes
 * - Tarifas
 * - Ofertas (3x2, 2a unidad, etc.)
 *
 * Uso: npx ts-node --transpile-only src/scripts/seed-full-test-data.ts [empresaId]
 */

import mongoose, { Types, Schema, Model } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde la ruta correcta
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Importar modelos base
import Licencia from '../modules/licencias/Licencia';
import Empresa from '../modules/empresa/Empresa';
import { databaseManager } from '../services/database-manager.service';
import { IDatabaseConfig } from '../modules/empresa/Empresa';

// Importar schemas de modelos
import { FormaPago } from '../modules/formas-pago/FormaPago';
import { Familia } from '../modules/familias/Familia';
import { Variante } from '../modules/variantes/Variante';
import { Producto } from '../modules/productos/Producto';
import { Cliente } from '../modules/clientes/Cliente';
import { Tarifa } from '../modules/tarifas/Tarifa';
import { Oferta } from '../modules/ofertas/Oferta';
import { Almacen } from '../modules/almacenes/Almacen';

// Helper para obtener modelos
async function getModel<T>(empresaId: string, dbConfig: IDatabaseConfig, name: string, schema: Schema): Promise<Model<T>> {
  return databaseManager.getModel<T>(empresaId, dbConfig, name, schema);
}

// ============================================
// DATOS DE FORMAS DE PAGO
// ============================================
const formasPagoData = [
  {
    codigo: 'EFEC',
    nombre: 'Efectivo',
    descripcion: 'Pago en efectivo',
    tipo: 'efectivo',
    icono: 'banknote',
    color: '#22C55E',
    requiereDatosBancarios: false,
    orden: 1,
    activo: true,
  },
  {
    codigo: 'TARJ',
    nombre: 'Tarjeta',
    descripcion: 'Pago con tarjeta de credito o debito',
    tipo: 'tarjeta',
    icono: 'credit-card',
    color: '#3B82F6',
    requiereDatosBancarios: false,
    comision: 0.5,
    orden: 2,
    activo: true,
  },
  {
    codigo: 'TRAN',
    nombre: 'Transferencia',
    descripcion: 'Transferencia bancaria',
    tipo: 'transferencia',
    icono: 'building-2',
    color: '#8B5CF6',
    requiereDatosBancarios: true,
    orden: 3,
    activo: true,
  },
  {
    codigo: 'DOMI',
    nombre: 'Domiciliacion',
    descripcion: 'Domiciliacion bancaria SEPA',
    tipo: 'domiciliacion',
    icono: 'file-text',
    color: '#F59E0B',
    requiereDatosBancarios: true,
    orden: 4,
    activo: true,
  },
  {
    codigo: 'CHQ',
    nombre: 'Cheque',
    descripcion: 'Pago con cheque',
    tipo: 'cheque',
    icono: 'file-check',
    color: '#6B7280',
    requiereDatosBancarios: false,
    orden: 5,
    activo: true,
  },
  {
    codigo: 'PAG30',
    nombre: 'Pago a 30 dias',
    descripcion: 'Pago aplazado a 30 dias',
    tipo: 'otro',
    icono: 'calendar',
    color: '#EC4899',
    requiereDatosBancarios: false,
    orden: 6,
    activo: true,
  },
];

// ============================================
// DATOS DE FAMILIAS
// ============================================
const familiasData = [
  { codigo: 'ELECTRO', nombre: 'Electronica', descripcion: 'Productos electronicos', color: '#3B82F6', usarEnTPV: true },
  { codigo: 'ROPA', nombre: 'Ropa y Textil', descripcion: 'Ropa y textiles', color: '#EC4899', usarEnTPV: true },
  { codigo: 'ALIMEN', nombre: 'Alimentacion', descripcion: 'Productos alimentarios', color: '#22C55E', usarEnTPV: true },
  { codigo: 'BEBIDAS', nombre: 'Bebidas', descripcion: 'Bebidas y refrescos', color: '#F59E0B', usarEnTPV: true },
  { codigo: 'HOGAR', nombre: 'Hogar', descripcion: 'Productos para el hogar', color: '#8B5CF6', usarEnTPV: true },
  { codigo: 'DEPORT', nombre: 'Deportes', descripcion: 'Articulos deportivos', color: '#EF4444', usarEnTPV: true },
  { codigo: 'OFICINA', nombre: 'Material Oficina', descripcion: 'Material de oficina', color: '#6B7280', usarEnTPV: true },
  { codigo: 'LIMPIEZA', nombre: 'Limpieza', descripcion: 'Productos de limpieza', color: '#06B6D4', usarEnTPV: true },
];

// ============================================
// DATOS DE VARIANTES GLOBALES
// ============================================
const variantesGlobalesData = [
  {
    nombre: 'Talla',
    codigo: 'TALLA',
    descripcion: 'Tallas de ropa',
    tipoVisualizacion: 'botones',
    obligatorio: true,
    aplicaA: 'familias',
    valores: [
      { valor: 'XS', orden: 1, activo: true },
      { valor: 'S', orden: 2, activo: true },
      { valor: 'M', orden: 3, activo: true },
      { valor: 'L', orden: 4, activo: true },
      { valor: 'XL', orden: 5, activo: true },
      { valor: 'XXL', orden: 6, activo: true },
    ],
    activo: true,
  },
  {
    nombre: 'Color',
    codigo: 'COLOR',
    descripcion: 'Colores disponibles',
    tipoVisualizacion: 'colores',
    obligatorio: true,
    aplicaA: 'productos',
    valores: [
      { valor: 'Negro', hexColor: '#000000', orden: 1, activo: true },
      { valor: 'Blanco', hexColor: '#FFFFFF', orden: 2, activo: true },
      { valor: 'Azul', hexColor: '#3B82F6', orden: 3, activo: true },
      { valor: 'Rojo', hexColor: '#EF4444', orden: 4, activo: true },
      { valor: 'Verde', hexColor: '#22C55E', orden: 5, activo: true },
      { valor: 'Gris', hexColor: '#6B7280', orden: 6, activo: true },
    ],
    activo: true,
  },
  {
    nombre: 'Capacidad',
    codigo: 'CAPACIDAD',
    descripcion: 'Capacidad de almacenamiento',
    tipoVisualizacion: 'dropdown',
    obligatorio: true,
    aplicaA: 'productos',
    valores: [
      { valor: '64GB', orden: 1, activo: true },
      { valor: '128GB', orden: 2, activo: true },
      { valor: '256GB', orden: 3, activo: true },
      { valor: '512GB', orden: 4, activo: true },
      { valor: '1TB', orden: 5, activo: true },
    ],
    activo: true,
  },
];

// ============================================
// DATOS DE PRODUCTOS SIMPLES
// ============================================
const productosSimples = [
  // Electronica
  { sku: 'HDMI-2M', nombre: 'Cable HDMI 2 metros', familia: 'ELECTRO', precioCompra: 3, precioVenta: 8.99, iva: 21, stock: 50 },
  { sku: 'USB-C', nombre: 'Cable USB-C', familia: 'ELECTRO', precioCompra: 2, precioVenta: 6.99, iva: 21, stock: 100 },
  { sku: 'AURICULAR-BT', nombre: 'Auriculares Bluetooth', familia: 'ELECTRO', precioCompra: 15, precioVenta: 34.99, iva: 21, stock: 30 },
  { sku: 'CARGADOR-RAP', nombre: 'Cargador Rapido 65W', familia: 'ELECTRO', precioCompra: 12, precioVenta: 29.99, iva: 21, stock: 40 },
  { sku: 'POWERBANK', nombre: 'Power Bank 10000mAh', familia: 'ELECTRO', precioCompra: 10, precioVenta: 24.99, iva: 21, stock: 25 },

  // Alimentacion
  { sku: 'AGUA-1.5L', nombre: 'Agua Mineral 1.5L', familia: 'BEBIDAS', precioCompra: 0.20, precioVenta: 0.60, iva: 10, stock: 200 },
  { sku: 'COCA-33CL', nombre: 'Coca-Cola 33cl', familia: 'BEBIDAS', precioCompra: 0.35, precioVenta: 1.20, iva: 10, stock: 150 },
  { sku: 'CAFE-CAPS', nombre: 'Capsulas Cafe x10', familia: 'ALIMEN', precioCompra: 2.50, precioVenta: 4.99, iva: 10, stock: 80 },
  { sku: 'PAN-MOLDE', nombre: 'Pan de Molde', familia: 'ALIMEN', precioCompra: 0.80, precioVenta: 1.49, iva: 4, stock: 30 },
  { sku: 'GALLETAS', nombre: 'Galletas Chocolate', familia: 'ALIMEN', precioCompra: 1.20, precioVenta: 2.49, iva: 10, stock: 60 },

  // Hogar
  { sku: 'BOMBILLA-LED', nombre: 'Bombilla LED 10W', familia: 'HOGAR', precioCompra: 1.50, precioVenta: 3.99, iva: 21, stock: 100 },
  { sku: 'PILAS-AA', nombre: 'Pilas AA x4', familia: 'HOGAR', precioCompra: 1, precioVenta: 2.99, iva: 21, stock: 80 },
  { sku: 'ENCHUFE-MULT', nombre: 'Regleta 4 Enchufes', familia: 'HOGAR', precioCompra: 5, precioVenta: 12.99, iva: 21, stock: 35 },

  // Limpieza
  { sku: 'DETERG-1L', nombre: 'Detergente Liquido 1L', familia: 'LIMPIEZA', precioCompra: 2.50, precioVenta: 5.99, iva: 21, stock: 40 },
  { sku: 'LEJIA-1L', nombre: 'Lejia 1L', familia: 'LIMPIEZA', precioCompra: 0.80, precioVenta: 1.49, iva: 21, stock: 50 },
  { sku: 'PAPEL-12R', nombre: 'Papel Higienico x12', familia: 'LIMPIEZA', precioCompra: 3, precioVenta: 6.99, iva: 21, stock: 60 },

  // Oficina
  { sku: 'BOLI-PACK', nombre: 'Boligrafos Pack 10', familia: 'OFICINA', precioCompra: 1.50, precioVenta: 3.99, iva: 21, stock: 70 },
  { sku: 'CUADERNO-A4', nombre: 'Cuaderno A4 80 hojas', familia: 'OFICINA', precioCompra: 1, precioVenta: 2.49, iva: 21, stock: 90 },
  { sku: 'POST-IT', nombre: 'Post-It Pack', familia: 'OFICINA', precioCompra: 2, precioVenta: 4.99, iva: 21, stock: 55 },
];

// ============================================
// DATOS DE PRODUCTOS CON VARIANTES
// ============================================
const productosConVariantes = [
  {
    sku: 'CAMISA-BASIC',
    nombre: 'Camisa Basica',
    familia: 'ROPA',
    precioCompra: 8,
    precioVenta: 24.99,
    iva: 21,
    atributos: [
      { nombre: 'Talla', valores: ['S', 'M', 'L', 'XL'], tipoVisualizacion: 'botones' },
      { nombre: 'Color', valores: ['Blanco', 'Negro', 'Azul'], tipoVisualizacion: 'colores' },
    ],
  },
  {
    sku: 'PANTALON-JEAN',
    nombre: 'Pantalon Vaquero',
    familia: 'ROPA',
    precioCompra: 15,
    precioVenta: 39.99,
    iva: 21,
    atributos: [
      { nombre: 'Talla', valores: ['38', '40', '42', '44', '46'], tipoVisualizacion: 'botones' },
      { nombre: 'Color', valores: ['Azul Oscuro', 'Azul Claro', 'Negro'], tipoVisualizacion: 'colores' },
    ],
  },
  {
    sku: 'CAMISETA-SPORT',
    nombre: 'Camiseta Deportiva',
    familia: 'DEPORT',
    precioCompra: 6,
    precioVenta: 19.99,
    iva: 21,
    atributos: [
      { nombre: 'Talla', valores: ['S', 'M', 'L', 'XL'], tipoVisualizacion: 'botones' },
      { nombre: 'Color', valores: ['Rojo', 'Verde', 'Negro'], tipoVisualizacion: 'colores' },
    ],
  },
  {
    sku: 'ZAPATILLA-RUN',
    nombre: 'Zapatilla Running',
    familia: 'DEPORT',
    precioCompra: 35,
    precioVenta: 79.99,
    iva: 21,
    atributos: [
      { nombre: 'Talla', valores: ['39', '40', '41', '42', '43', '44'], tipoVisualizacion: 'botones' },
      { nombre: 'Color', valores: ['Negro', 'Blanco', 'Gris'], tipoVisualizacion: 'colores' },
    ],
  },
];

// ============================================
// DATOS DE PRODUCTOS KIT (COMPUESTOS)
// ============================================
const productosKit = [
  {
    sku: 'KIT-OFICINA',
    nombre: 'Kit Material Oficina',
    descripcion: 'Pack completo con cuaderno, boligrafos y post-it',
    familia: 'OFICINA',
    precioVenta: 9.99,
    iva: 21,
    componentes: ['BOLI-PACK', 'CUADERNO-A4', 'POST-IT'],
  },
  {
    sku: 'PACK-LIMPIEZA',
    nombre: 'Pack Limpieza Hogar',
    descripcion: 'Pack basico de limpieza con detergente, lejia y papel',
    familia: 'LIMPIEZA',
    precioVenta: 12.99,
    iva: 21,
    componentes: ['DETERG-1L', 'LEJIA-1L', 'PAPEL-12R'],
  },
  {
    sku: 'KIT-MOVIL',
    nombre: 'Kit Accesorios Movil',
    descripcion: 'Cargador rapido, cable USB-C y power bank',
    familia: 'ELECTRO',
    precioVenta: 54.99,
    iva: 21,
    componentes: ['CARGADOR-RAP', 'USB-C', 'POWERBANK'],
  },
];

// ============================================
// DATOS DE CLIENTES
// ============================================
const clientesData = [
  {
    tipoCliente: 'empresa',
    codigo: 'CLI-001',
    nombre: 'Tecnologias Avanzadas SL',
    nombreComercial: 'TechAdvanced',
    nif: 'B12345678',
    email: 'info@techadvanced.es',
    telefono: '912345678',
    direccion: { calle: 'Calle Tecnologia', numero: '15', codigoPostal: '28001', ciudad: 'Madrid', provincia: 'Madrid', pais: 'Espana' },
    usarEnTPV: true,
    descuentoGeneral: 10,
  },
  {
    tipoCliente: 'empresa',
    codigo: 'CLI-002',
    nombre: 'Distribuciones Garcia SA',
    nombreComercial: 'DistGarcia',
    nif: 'A87654321',
    email: 'pedidos@distgarcia.com',
    telefono: '913456789',
    direccion: { calle: 'Avenida Industria', numero: '42', codigoPostal: '28020', ciudad: 'Madrid', provincia: 'Madrid', pais: 'Espana' },
    usarEnTPV: true,
    descuentoGeneral: 15,
  },
  {
    tipoCliente: 'particular',
    codigo: 'CLI-003',
    nombre: 'Juan Martinez Lopez',
    nif: '12345678A',
    email: 'juan.martinez@gmail.com',
    telefono: '600123456',
    usarEnTPV: true,
  },
  {
    tipoCliente: 'particular',
    codigo: 'CLI-004',
    nombre: 'Maria Garcia Fernandez',
    nif: '87654321B',
    email: 'maria.garcia@hotmail.com',
    telefono: '600654321',
    usarEnTPV: true,
  },
  {
    tipoCliente: 'empresa',
    codigo: 'CLI-005',
    nombre: 'Restaurante El Buen Sabor SL',
    nombreComercial: 'El Buen Sabor',
    nif: 'B11223344',
    email: 'contacto@elbuensabor.es',
    telefono: '914567890',
    direccion: { calle: 'Plaza Mayor', numero: '5', codigoPostal: '28005', ciudad: 'Madrid', provincia: 'Madrid', pais: 'Espana' },
    usarEnTPV: true,
    descuentoGeneral: 5,
  },
  {
    tipoCliente: 'empresa',
    codigo: 'CLI-006',
    nombre: 'Gimnasio Fitness Plus SL',
    nombreComercial: 'Fitness Plus',
    nif: 'B55667788',
    email: 'info@fitnessplus.es',
    telefono: '915678901',
    usarEnTPV: true,
  },
  {
    tipoCliente: 'particular',
    codigo: 'CLI-007',
    nombre: 'Carlos Rodriguez Perez',
    nif: '11223344C',
    email: 'carlos.rodriguez@yahoo.es',
    telefono: '600111222',
    usarEnTPV: true,
  },
  {
    tipoCliente: 'empresa',
    codigo: 'CLI-008',
    nombre: 'Hotel Sol y Mar SA',
    nombreComercial: 'Sol y Mar',
    nif: 'A99887766',
    email: 'reservas@solymar.com',
    telefono: '916789012',
    direccion: { calle: 'Paseo Maritimo', numero: '100', codigoPostal: '29001', ciudad: 'Malaga', provincia: 'Malaga', pais: 'Espana' },
    usarEnTPV: true,
    descuentoGeneral: 20,
  },
];

// ============================================
// DATOS DE TARIFAS
// ============================================
const tarifasData = [
  {
    codigo: 'TAR-MAYORISTA',
    nombre: 'Tarifa Mayorista',
    descripcion: 'Precios especiales para mayoristas',
    tipo: 'porcentaje',
    basePrecio: 'venta',
    porcentajeGeneral: 20,
    prioridad: 10,
  },
  {
    codigo: 'TAR-VIP',
    nombre: 'Tarifa VIP',
    descripcion: 'Descuento especial para clientes VIP',
    tipo: 'porcentaje',
    basePrecio: 'venta',
    porcentajeGeneral: 10,
    prioridad: 5,
  },
  {
    codigo: 'TAR-HOSTELERIA',
    nombre: 'Tarifa Hosteleria',
    descripcion: 'Precios para hoteles y restaurantes',
    tipo: 'porcentaje',
    basePrecio: 'venta',
    porcentajeGeneral: 15,
    prioridad: 8,
  },
];

// ============================================
// DATOS DE OFERTAS
// ============================================
const ofertasData = [
  {
    codigo: 'OFE-3X2',
    nombre: 'Promocion 3x2',
    descripcion: 'Lleva 3 unidades y paga solo 2',
    tipo: 'nxm',
    configuracion: {
      cantidadLleva: 3,
      cantidadCompra: 2,
    },
    aplicaATodos: false,
    aplicaATodosClientes: true,
    etiqueta: '3x2',
    color: '#EF4444',
    prioridad: 10,
  },
  {
    codigo: 'OFE-2X1',
    nombre: 'Promocion 2x1',
    descripcion: 'Lleva 2 unidades y paga solo 1',
    tipo: 'nxm',
    configuracion: {
      cantidadLleva: 2,
      cantidadCompra: 1,
    },
    aplicaATodos: false,
    aplicaATodosClientes: true,
    etiqueta: '2x1',
    color: '#F59E0B',
    prioridad: 15,
  },
  {
    codigo: 'OFE-2UD50',
    nombre: 'Segunda unidad al 50%',
    descripcion: 'Segunda unidad con 50% de descuento',
    tipo: 'segunda_unidad',
    configuracion: {
      descuentoSegundaUnidad: 50,
    },
    aplicaATodos: false,
    aplicaATodosClientes: true,
    etiqueta: '2a -50%',
    color: '#8B5CF6',
    prioridad: 8,
  },
  {
    codigo: 'OFE-2UD70',
    nombre: 'Segunda unidad al 70%',
    descripcion: 'Segunda unidad con 70% de descuento',
    tipo: 'segunda_unidad',
    configuracion: {
      descuentoSegundaUnidad: 70,
    },
    aplicaATodos: false,
    aplicaATodosClientes: true,
    etiqueta: '2a -70%',
    color: '#06B6D4',
    prioridad: 12,
  },
  {
    codigo: 'OFE-10OFF',
    nombre: '10% de descuento',
    descripcion: 'Descuento del 10% en productos seleccionados',
    tipo: 'descuento_porcentaje',
    configuracion: {
      descuento: 10,
    },
    aplicaATodos: false,
    aplicaATodosClientes: true,
    etiqueta: '-10%',
    color: '#22C55E',
    prioridad: 5,
  },
  {
    codigo: 'OFE-ESCALADO',
    nombre: 'Descuento por volumen',
    descripcion: 'Mas compras, mas descuento',
    tipo: 'escalado',
    configuracion: {
      escalas: [
        { cantidadDesde: 5, cantidadHasta: 9, descuento: 5 },
        { cantidadDesde: 10, cantidadHasta: 19, descuento: 10 },
        { cantidadDesde: 20, cantidadHasta: 49, descuento: 15 },
        { cantidadDesde: 50, descuento: 20 },
      ],
    },
    aplicaATodos: false,
    aplicaATodosClientes: true,
    etiqueta: 'Vol.',
    color: '#3B82F6',
    prioridad: 3,
  },
];

// ============================================
// FUNCION PRINCIPAL
// ============================================
async function seedFullTestData() {
  const empresaIdArg = process.argv[2];

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';
    console.log('🔌 Conectando a MongoDB...');
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
      console.error('❌ No se encontro ninguna licencia');
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
      console.error('❌ La empresa no tiene configuracion de base de datos');
      process.exit(1);
    }

    // Obtener modelos dinamicos
    const FormaPagoModel = await getModel<any>(empresaId, dbConfig, 'FormaPago', FormaPago.schema);
    const FamiliaModel = await getModel<any>(empresaId, dbConfig, 'Familia', Familia.schema);
    const VarianteModel = await getModel<any>(empresaId, dbConfig, 'Variante', Variante.schema);
    const ProductoModel = await getModel<any>(empresaId, dbConfig, 'Producto', Producto.schema);
    const ClienteModel = await getModel<any>(empresaId, dbConfig, 'Cliente', Cliente.schema);
    const TarifaModel = await getModel<any>(empresaId, dbConfig, 'Tarifa', Tarifa.schema);
    const OfertaModel = await getModel<any>(empresaId, dbConfig, 'Oferta', Oferta.schema);
    const AlmacenModel = await getModel<any>(empresaId, dbConfig, 'Almacen', Almacen.schema);

    // Obtener almacen principal
    let almacenPrincipal = await AlmacenModel.findOne({ esPrincipal: true });
    if (!almacenPrincipal) {
      almacenPrincipal = await AlmacenModel.findOne();
    }
    const almacenId = almacenPrincipal?._id;

    console.log('');
    console.log('🚀 Iniciando creacion de datos de prueba...');
    console.log('');

    // ========================================
    // 1. FORMAS DE PAGO
    // ========================================
    console.log('💳 Creando formas de pago...');
    const formasPagoCreadas: any = {};

    for (const fp of formasPagoData) {
      const existente = await FormaPagoModel.findOne({ codigo: fp.codigo });
      if (!existente) {
        const nueva = await FormaPagoModel.create(fp);
        formasPagoCreadas[fp.codigo] = nueva._id;
        console.log(`   ✓ ${fp.nombre}`);
      } else {
        formasPagoCreadas[fp.codigo] = existente._id;
        console.log(`   - ${fp.nombre} (ya existe)`);
      }
    }

    // ========================================
    // 2. FAMILIAS
    // ========================================
    console.log('');
    console.log('📂 Creando familias de productos...');
    const familiasCreadas: any = {};

    for (const fam of familiasData) {
      const existente = await FamiliaModel.findOne({ codigo: fam.codigo });
      if (!existente) {
        const nueva = await FamiliaModel.create({
          ...fam,
          empresaId,
          nivel: 0,
          ruta: [],
          orden: 0,
          estadisticas: { totalProductos: 0, totalSubfamilias: 0 },
        });
        familiasCreadas[fam.codigo] = nueva._id;
        console.log(`   ✓ ${fam.nombre}`);
      } else {
        familiasCreadas[fam.codigo] = existente._id;
        console.log(`   - ${fam.nombre} (ya existe)`);
      }
    }

    // ========================================
    // 3. VARIANTES GLOBALES
    // ========================================
    console.log('');
    console.log('🎨 Creando variantes globales...');

    for (const varData of variantesGlobalesData) {
      const existente = await VarianteModel.findOne({ nombre: varData.nombre });
      if (!existente) {
        await VarianteModel.create({
          ...varData,
          orden: 0,
        });
        console.log(`   ✓ ${varData.nombre}`);
      } else {
        console.log(`   - ${varData.nombre} (ya existe)`);
      }
    }

    // ========================================
    // 4. PRODUCTOS SIMPLES
    // ========================================
    console.log('');
    console.log('📦 Creando productos simples...');
    const productosCreados: any = {};

    for (const prod of productosSimples) {
      const existente = await ProductoModel.findOne({ sku: prod.sku });
      if (!existente) {
        const nuevo = await ProductoModel.create({
          empresaId,
          sku: prod.sku,
          nombre: prod.nombre,
          tipo: 'simple',
          familiaId: familiasCreadas[prod.familia],
          precios: {
            compra: prod.precioCompra,
            venta: prod.precioVenta,
            pvp: prod.precioVenta,
            margen: 0,
          },
          iva: prod.iva,
          stock: {
            cantidad: prod.stock,
            minimo: 5,
            maximo: 200,
            almacenId,
          },
          stockPorAlmacen: almacenId ? [{
            almacenId,
            cantidad: prod.stock,
            minimo: 5,
            maximo: 200,
            ultimaActualizacion: new Date(),
          }] : [],
          gestionaStock: true,
          activo: true,
          disponible: true,
          usarEnTPV: true,
          permiteDescuento: true,
        });
        productosCreados[prod.sku] = nuevo._id;
        console.log(`   ✓ ${prod.nombre}`);
      } else {
        productosCreados[prod.sku] = existente._id;
        console.log(`   - ${prod.nombre} (ya existe)`);
      }
    }

    // ========================================
    // 5. PRODUCTOS CON VARIANTES
    // ========================================
    console.log('');
    console.log('👕 Creando productos con variantes...');

    for (const prod of productosConVariantes) {
      const existente = await ProductoModel.findOne({ sku: prod.sku });
      if (!existente) {
        // Generar variantes combinando atributos
        const variantes: any[] = [];
        const atributos = prod.atributos.map(attr => ({
          nombre: attr.nombre,
          valores: attr.valores.map(v => ({ valor: v, activo: true })),
          tipoVisualizacion: attr.tipoVisualizacion,
          obligatorio: true,
        }));

        // Generar combinaciones
        let combinaciones: any[] = [{}];
        for (const attr of prod.atributos) {
          const nuevasCombinaciones: any[] = [];
          for (const combo of combinaciones) {
            for (const valor of attr.valores) {
              nuevasCombinaciones.push({
                ...combo,
                [attr.nombre.toLowerCase()]: valor,
              });
            }
          }
          combinaciones = nuevasCombinaciones;
        }

        // Crear variantes
        let idx = 1;
        for (const combo of combinaciones) {
          variantes.push({
            _id: new Types.ObjectId(),
            sku: `${prod.sku}-${String(idx).padStart(3, '0')}`,
            combinacion: combo,
            precios: {
              compra: prod.precioCompra,
              venta: prod.precioVenta,
              pvp: prod.precioVenta,
              margen: 0,
              usarPrecioBase: true,
            },
            stockPorAlmacen: almacenId ? [{
              almacenId,
              cantidad: Math.floor(Math.random() * 20) + 5,
              minimo: 2,
              maximo: 50,
              ultimaActualizacion: new Date(),
            }] : [],
            activo: true,
          });
          idx++;
        }

        await ProductoModel.create({
          empresaId,
          sku: prod.sku,
          nombre: prod.nombre,
          tipo: 'variantes',
          familiaId: familiasCreadas[prod.familia],
          tieneVariantes: true,
          atributos,
          variantes,
          precios: {
            compra: prod.precioCompra,
            venta: prod.precioVenta,
            pvp: prod.precioVenta,
            margen: 0,
          },
          iva: prod.iva,
          gestionaStock: true,
          activo: true,
          disponible: true,
          usarEnTPV: true,
          permiteDescuento: true,
        });
        console.log(`   ✓ ${prod.nombre} (${variantes.length} variantes)`);
      } else {
        console.log(`   - ${prod.nombre} (ya existe)`);
      }
    }

    // ========================================
    // 6. PRODUCTOS KIT (COMPUESTOS)
    // ========================================
    console.log('');
    console.log('📦 Creando productos kit (compuestos)...');

    for (const kit of productosKit) {
      const existente = await ProductoModel.findOne({ sku: kit.sku });
      if (!existente) {
        // Buscar los productos componentes
        const componentes: any[] = [];
        let orden = 1;
        for (const compSku of kit.componentes) {
          const productoComp = await ProductoModel.findOne({ sku: compSku });
          if (productoComp) {
            componentes.push({
              productoId: productoComp._id,
              cantidad: 1,
              opcional: false,
              orden: orden++,
              precioUnitarioOriginal: productoComp.precios.venta,
              precioUnitario: productoComp.precios.venta,
              descuentoPorcentaje: 0,
            });
          }
        }

        if (componentes.length > 0) {
          await ProductoModel.create({
            empresaId,
            sku: kit.sku,
            nombre: kit.nombre,
            descripcion: kit.descripcion,
            tipo: 'compuesto',
            familiaId: familiasCreadas[kit.familia],
            componentesKit: componentes,
            precios: {
              compra: 0,
              venta: kit.precioVenta,
              pvp: kit.precioVenta,
              margen: 0,
            },
            iva: kit.iva,
            gestionaStock: false,
            activo: true,
            disponible: true,
            usarEnTPV: true,
            permiteDescuento: true,
          });
          console.log(`   ✓ ${kit.nombre} (${componentes.length} componentes)`);
        } else {
          console.log(`   ⚠ ${kit.nombre} - Sin componentes encontrados`);
        }
      } else {
        console.log(`   - ${kit.nombre} (ya existe)`);
      }
    }

    // ========================================
    // 7. CLIENTES
    // ========================================
    console.log('');
    console.log('👥 Creando clientes...');
    const formaPagoEfectivo = formasPagoCreadas['EFEC'];

    for (const cliente of clientesData) {
      const existente = await ClienteModel.findOne({ nif: cliente.nif });
      if (!existente) {
        await ClienteModel.create({
          ...cliente,
          formaPagoId: formaPagoEfectivo,
          riesgoActual: 0,
          activo: true,
          creadoPor: new Types.ObjectId(),
          direcciones: cliente.direccion ? [{
            tipo: 'fiscal',
            ...cliente.direccion,
            predeterminada: true,
            activa: true,
          }] : [],
        });
        console.log(`   ✓ ${cliente.nombre}`);
      } else {
        console.log(`   - ${cliente.nombre} (ya existe)`);
      }
    }

    // ========================================
    // 8. TARIFAS
    // ========================================
    console.log('');
    console.log('📊 Creando tarifas...');

    for (const tarifa of tarifasData) {
      const existente = await TarifaModel.findOne({ codigo: tarifa.codigo });
      if (!existente) {
        await TarifaModel.create({
          ...tarifa,
          empresaId,
          precios: [],
          activo: true,
        });
        console.log(`   ✓ ${tarifa.nombre}`);
      } else {
        console.log(`   - ${tarifa.nombre} (ya existe)`);
      }
    }

    // ========================================
    // 9. OFERTAS
    // ========================================
    console.log('');
    console.log('🏷️ Creando ofertas y promociones...');

    // Obtener algunos productos para asignar a ofertas
    const productosParaOfertas = await ProductoModel.find({ tipo: 'simple' }).limit(10);

    for (const oferta of ofertasData) {
      const existente = await OfertaModel.findOne({ codigo: oferta.codigo });
      if (!existente) {
        // Asignar productos aleatorios a cada oferta
        const productosRandom = productosParaOfertas
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((p: any) => p._id);

        await OfertaModel.create({
          ...oferta,
          empresaId,
          productosIncluidos: productosRandom,
          fechaDesde: new Date(),
          fechaHasta: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          usosActuales: 0,
          acumulable: false,
          activo: true,
        });
        console.log(`   ✓ ${oferta.nombre}`);
      } else {
        console.log(`   - ${oferta.nombre} (ya existe)`);
      }
    }

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('');
    console.log('📊 Resumen de datos creados:');
    console.log(`   Formas de pago: ${await FormaPagoModel.countDocuments()}`);
    console.log(`   Familias: ${await FamiliaModel.countDocuments()}`);
    console.log(`   Variantes: ${await VarianteModel.countDocuments()}`);
    console.log(`   Productos: ${await ProductoModel.countDocuments()}`);
    console.log(`   Clientes: ${await ClienteModel.countDocuments()}`);
    console.log(`   Tarifas: ${await TarifaModel.countDocuments()}`);
    console.log(`   Ofertas: ${await OfertaModel.countDocuments()}`);
    console.log('');
    console.log('✅ Datos de prueba creados correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedFullTestData();
