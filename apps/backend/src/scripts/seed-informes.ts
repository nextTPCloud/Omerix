/**
 * Script para inicializar informes predefinidos
 * Ejecutar: npx ts-node src/scripts/seed-informes.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import InformeModel, {
  ModuloInforme,
  TipoInforme,
  TipoCampo,
  TipoAgregacion,
  OperadorFiltro,
  TipoGraficoInforme,
  IInforme,
} from '../modules/informes/Informe';

// ============================================
// DEFINICIÓN DE INFORMES PREDEFINIDOS
// ============================================

const informesPredefinidos: Partial<IInforme>[] = [
  // ============================================
  // VENTAS
  // ============================================
  {
    nombre: 'Ventas por Cliente',
    descripcion: 'Ranking de clientes por volumen de facturación',
    modulo: ModuloInforme.VENTAS,
    tipo: TipoInforme.MIXTO,
    icono: 'Users',
    fuente: { coleccion: 'facturas' },
    campos: [
      { campo: 'clienteNombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'numFacturas', etiqueta: 'Nº Facturas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.CONTEO, orden: 2 },
      { campo: 'baseImponible', etiqueta: 'Base Imponible', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 3 },
      { campo: 'totalIva', etiqueta: 'IVA', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'total', etiqueta: 'Total Facturado', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
    ],
    agrupaciones: [{ campo: 'clienteId', etiqueta: 'Cliente', orden: 'asc' }],
    ordenamiento: [{ campo: 'total', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA_HORIZONTAL,
      ejeX: 'clienteNombre',
      ejeY: ['total'],
      mostrarLeyenda: false,
      mostrarEtiquetas: true,
    },
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 1,
  },
  {
    nombre: 'ABC de Productos',
    descripcion: 'Análisis ABC de productos por ventas (Pareto 80/20)',
    modulo: ModuloInforme.VENTAS,
    tipo: TipoInforme.MIXTO,
    icono: 'Package',
    fuente: { coleccion: 'lineas_factura' },
    campos: [
      { campo: 'productoNombre', etiqueta: 'Producto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'sku', etiqueta: 'SKU', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'cantidadVendida', etiqueta: 'Uds. Vendidas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 3 },
      { campo: 'totalVentas', etiqueta: 'Total Ventas', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'porcentajeAcumulado', etiqueta: '% Acumulado', tipo: TipoCampo.PORCENTAJE, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 5 },
      { campo: 'clasificacionABC', etiqueta: 'Clasificación', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
    ],
    agrupaciones: [{ campo: 'productoId', etiqueta: 'Producto', orden: 'asc' }],
    ordenamiento: [{ campo: 'totalVentas', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.CIRCULAR,
      ejeX: 'clasificacionABC',
      ejeY: ['totalVentas'],
      mostrarLeyenda: true,
      mostrarEtiquetas: true,
    },
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 2,
  },
  {
    nombre: 'Ventas Mensuales',
    descripcion: 'Evolución de ventas mes a mes',
    modulo: ModuloInforme.VENTAS,
    tipo: TipoInforme.MIXTO,
    icono: 'TrendingUp',
    fuente: { coleccion: 'facturas' },
    campos: [
      { campo: 'mes', etiqueta: 'Mes', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'numFacturas', etiqueta: 'Nº Facturas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.CONTEO, orden: 2 },
      { campo: 'baseImponible', etiqueta: 'Base Imponible', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 3 },
      { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'año', etiqueta: 'Año', tipo: 'numero', valorDefecto: new Date().getFullYear(), requerido: true },
    ],
    agrupaciones: [{ campo: 'mesNumero', etiqueta: 'Mes', orden: 'asc' }],
    ordenamiento: [{ campo: 'mesNumero', direccion: 'asc' }],
    grafico: {
      tipo: TipoGraficoInforme.LINEA,
      ejeX: 'mes',
      ejeY: ['total'],
      mostrarLeyenda: false,
      mostrarEtiquetas: true,
    },
    config: { paginacion: false, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 3,
  },
  {
    nombre: 'Facturas Pendientes de Cobro',
    descripcion: 'Facturas emitidas pendientes de cobrar',
    modulo: ModuloInforme.VENTAS,
    tipo: TipoInforme.TABLA,
    icono: 'Receipt',
    fuente: { coleccion: 'facturas' },
    campos: [
      { campo: 'numero', etiqueta: 'Número', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'clienteNombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'pendiente', etiqueta: 'Pendiente', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'diasVencida', etiqueta: 'Días', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
    ],
    filtros: [
      { campo: 'pendiente', operador: OperadorFiltro.MAYOR, valor: 0 },
    ],
    parametros: [],
    agrupaciones: [],
    ordenamiento: [{ campo: 'fecha', direccion: 'asc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 4,
  },

  // ============================================
  // COMPRAS
  // ============================================
  {
    nombre: 'Compras por Proveedor',
    descripcion: 'Ranking de proveedores por volumen de compras',
    modulo: ModuloInforme.COMPRAS,
    tipo: TipoInforme.MIXTO,
    icono: 'Building2',
    fuente: { coleccion: 'facturas_compra' },
    campos: [
      { campo: 'proveedorNombre', etiqueta: 'Proveedor', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'numFacturas', etiqueta: 'Nº Facturas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.CONTEO, orden: 2 },
      { campo: 'baseImponible', etiqueta: 'Base Imponible', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 3 },
      { campo: 'total', etiqueta: 'Total Comprado', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
    ],
    agrupaciones: [{ campo: 'proveedorId', etiqueta: 'Proveedor', orden: 'asc' }],
    ordenamiento: [{ campo: 'total', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA_HORIZONTAL,
      ejeX: 'proveedorNombre',
      ejeY: ['total'],
      mostrarLeyenda: false,
    },
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 1,
  },
  {
    nombre: 'Facturas Pendientes de Pago',
    descripcion: 'Facturas de compra pendientes de pagar',
    modulo: ModuloInforme.COMPRAS,
    tipo: TipoInforme.TABLA,
    icono: 'Receipt',
    fuente: { coleccion: 'facturas_compra' },
    campos: [
      { campo: 'numero', etiqueta: 'Número', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'proveedorNombre', etiqueta: 'Proveedor', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'pendiente', etiqueta: 'Pendiente', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'fechaVencimiento', etiqueta: 'Vencimiento', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
    ],
    filtros: [
      { campo: 'pendiente', operador: OperadorFiltro.MAYOR, valor: 0 },
    ],
    parametros: [],
    agrupaciones: [],
    ordenamiento: [{ campo: 'fechaVencimiento', direccion: 'asc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 2,
  },

  // ============================================
  // STOCK
  // ============================================
  {
    nombre: 'Productos Bajo Mínimo',
    descripcion: 'Productos con stock por debajo del mínimo establecido',
    modulo: ModuloInforme.STOCK,
    tipo: TipoInforme.TABLA,
    icono: 'AlertTriangle',
    fuente: { coleccion: 'productos' },
    campos: [
      { campo: 'sku', etiqueta: 'SKU', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Producto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'familia', etiqueta: 'Familia', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'stockActual', etiqueta: 'Stock Actual', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'stockMinimo', etiqueta: 'Stock Mínimo', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 5 },
      { campo: 'diferencia', etiqueta: 'Diferencia', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
      { campo: 'precioCoste', etiqueta: 'Precio Coste', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 7 },
    ],
    filtros: [
      { campo: 'stockBajoMinimo', operador: OperadorFiltro.IGUAL, valor: true },
    ],
    parametros: [
      { nombre: 'almacen', etiqueta: 'Almacén', tipo: 'select', requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'diferencia', direccion: 'asc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 1,
  },
  {
    nombre: 'Valoración de Inventario',
    descripcion: 'Valor del stock actual valorado a precio de coste',
    modulo: ModuloInforme.STOCK,
    tipo: TipoInforme.MIXTO,
    icono: 'Warehouse',
    fuente: { coleccion: 'productos' },
    campos: [
      { campo: 'familia', etiqueta: 'Familia', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'numProductos', etiqueta: 'Productos', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.CONTEO, orden: 2 },
      { campo: 'unidadesStock', etiqueta: 'Unidades', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 3 },
      { campo: 'valorStock', etiqueta: 'Valor Stock', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
    ],
    filtros: [
      { campo: 'stockActual', operador: OperadorFiltro.MAYOR, valor: 0 },
    ],
    parametros: [
      { nombre: 'almacen', etiqueta: 'Almacén', tipo: 'select', requerido: false },
    ],
    agrupaciones: [{ campo: 'familiaId', etiqueta: 'Familia', orden: 'asc' }],
    ordenamiento: [{ campo: 'valorStock', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.CIRCULAR,
      ejeX: 'familia',
      ejeY: ['valorStock'],
      mostrarLeyenda: true,
      mostrarEtiquetas: true,
    },
    config: { paginacion: false, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 2,
  },
  {
    nombre: 'Inventario Completo',
    descripcion: 'Listado completo de productos con stock y valoración',
    modulo: ModuloInforme.STOCK,
    tipo: TipoInforme.TABLA,
    icono: 'Package',
    fuente: { coleccion: 'productos' },
    campos: [
      { campo: 'sku', etiqueta: 'SKU', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Producto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'familia', etiqueta: 'Familia', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'stockActual', etiqueta: 'Stock', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'precioCoste', etiqueta: 'P. Coste', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 5 },
      { campo: 'precioVenta', etiqueta: 'P. Venta', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
      { campo: 'valorStock', etiqueta: 'Valor Stock', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 7 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'almacen', etiqueta: 'Almacén', tipo: 'select', requerido: false },
      { nombre: 'familia', etiqueta: 'Familia', tipo: 'select', requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'nombre', direccion: 'asc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf', 'csv'] },
    esPlantilla: true,
    orden: 3,
  },

  // ============================================
  // TESORERÍA
  // ============================================
  {
    nombre: 'Vencimientos Pendientes de Cobro',
    descripcion: 'Vencimientos de clientes pendientes de cobrar',
    modulo: ModuloInforme.TESORERIA,
    tipo: TipoInforme.TABLA,
    icono: 'Calendar',
    fuente: { coleccion: 'vencimientos' },
    campos: [
      { campo: 'fecha', etiqueta: 'Vencimiento', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'tercero', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'documento', etiqueta: 'Documento', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'importe', etiqueta: 'Importe', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'diasVencido', etiqueta: 'Días', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 5 },
    ],
    filtros: [
      { campo: 'tipo', operador: OperadorFiltro.IGUAL, valor: 'cobro' },
      { campo: 'estado', operador: OperadorFiltro.IGUAL, valor: 'pendiente' },
    ],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'fecha', direccion: 'asc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 1,
  },
  {
    nombre: 'Vencimientos Pendientes de Pago',
    descripcion: 'Vencimientos a proveedores pendientes de pagar',
    modulo: ModuloInforme.TESORERIA,
    tipo: TipoInforme.TABLA,
    icono: 'Calendar',
    fuente: { coleccion: 'vencimientos' },
    campos: [
      { campo: 'fecha', etiqueta: 'Vencimiento', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'tercero', etiqueta: 'Proveedor', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'documento', etiqueta: 'Documento', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'importe', etiqueta: 'Importe', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'diasVencido', etiqueta: 'Días', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 5 },
    ],
    filtros: [
      { campo: 'tipo', operador: OperadorFiltro.IGUAL, valor: 'pago' },
      { campo: 'estado', operador: OperadorFiltro.IGUAL, valor: 'pendiente' },
    ],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'fecha', direccion: 'asc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 2,
  },
  {
    nombre: 'Previsión de Tesorería',
    descripcion: 'Previsión de cobros y pagos por semana',
    modulo: ModuloInforme.TESORERIA,
    tipo: TipoInforme.MIXTO,
    icono: 'TrendingUp',
    fuente: { coleccion: 'vencimientos' },
    campos: [
      { campo: 'semana', etiqueta: 'Semana', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'cobros', etiqueta: 'Cobros', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 2 },
      { campo: 'pagos', etiqueta: 'Pagos', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 3 },
      { campo: 'saldo', etiqueta: 'Saldo', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
    ],
    filtros: [
      { campo: 'estado', operador: OperadorFiltro.IGUAL, valor: 'pendiente' },
    ],
    parametros: [
      { nombre: 'semanas', etiqueta: 'Semanas a mostrar', tipo: 'numero', valorDefecto: 8, requerido: true },
    ],
    agrupaciones: [{ campo: 'semana', etiqueta: 'Semana', orden: 'asc' }],
    ordenamiento: [{ campo: 'semana', direccion: 'asc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA,
      ejeX: 'semana',
      ejeY: ['cobros', 'pagos'],
      colores: ['#22c55e', '#ef4444'],
      mostrarLeyenda: true,
    },
    config: { paginacion: false, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 3,
  },

  // ============================================
  // PERSONAL / RRHH
  // ============================================
  {
    nombre: 'Listado de Personal',
    descripcion: 'Listado completo del personal activo',
    modulo: ModuloInforme.PERSONAL,
    tipo: TipoInforme.TABLA,
    icono: 'Users',
    fuente: { coleccion: 'personal' },
    campos: [
      { campo: 'codigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Nombre', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'apellidos', etiqueta: 'Apellidos', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'departamento', etiqueta: 'Departamento', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 4 },
      { campo: 'puesto', etiqueta: 'Puesto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 5 },
      { campo: 'fechaAlta', etiqueta: 'Fecha Alta', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
      { campo: 'email', etiqueta: 'Email', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 7 },
    ],
    filtros: [
      { campo: 'activo', operador: OperadorFiltro.IGUAL, valor: true },
    ],
    parametros: [
      { nombre: 'departamento', etiqueta: 'Departamento', tipo: 'select', requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'apellidos', direccion: 'asc' }],
    config: { paginacion: true, mostrarTotales: false, exportable: true, formatos: ['excel', 'pdf', 'csv'] },
    esPlantilla: true,
    orden: 1,
  },
  {
    nombre: 'Control de Fichajes',
    descripcion: 'Registro de fichajes de entrada y salida',
    modulo: ModuloInforme.PERSONAL,
    tipo: TipoInforme.TABLA,
    icono: 'Fingerprint',
    fuente: { coleccion: 'fichajes' },
    campos: [
      { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'empleadoNombre', etiqueta: 'Empleado', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'horaEntrada', etiqueta: 'Entrada', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'horaSalida', etiqueta: 'Salida', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 4 },
      { campo: 'horasTrabajadas', etiqueta: 'Horas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'incidencia', etiqueta: 'Incidencia', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: true },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: true },
      { nombre: 'empleado', etiqueta: 'Empleado', tipo: 'select', requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'fecha', direccion: 'desc' }, { campo: 'empleadoNombre', direccion: 'asc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 2,
  },
  {
    nombre: 'Horas por Empleado',
    descripcion: 'Resumen de horas trabajadas por empleado',
    modulo: ModuloInforme.PERSONAL,
    tipo: TipoInforme.MIXTO,
    icono: 'Clock',
    fuente: { coleccion: 'fichajes' },
    campos: [
      { campo: 'empleadoNombre', etiqueta: 'Empleado', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'diasTrabajados', etiqueta: 'Días', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.CONTEO, orden: 2 },
      { campo: 'horasTrabajadas', etiqueta: 'Horas Totales', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 3 },
      { campo: 'horasExtra', etiqueta: 'Horas Extra', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'promedioHoras', etiqueta: 'Promedio/Día', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.PROMEDIO, orden: 5 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: true },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: true },
      { nombre: 'departamento', etiqueta: 'Departamento', tipo: 'select', requerido: false },
    ],
    agrupaciones: [{ campo: 'empleadoId', etiqueta: 'Empleado', orden: 'asc' }],
    ordenamiento: [{ campo: 'horasTrabajadas', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA_HORIZONTAL,
      ejeX: 'empleadoNombre',
      ejeY: ['horasTrabajadas'],
      mostrarLeyenda: false,
    },
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 3,
  },
  {
    nombre: 'Horas por Proyecto',
    descripcion: 'Horas imputadas a cada proyecto',
    modulo: ModuloInforme.PERSONAL,
    tipo: TipoInforme.MIXTO,
    icono: 'FolderKanban',
    fuente: { coleccion: 'partes_trabajo' },
    campos: [
      { campo: 'proyecto', etiqueta: 'Proyecto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'cliente', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'numPartes', etiqueta: 'Partes', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.CONTEO, orden: 3 },
      { campo: 'horas', etiqueta: 'Horas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'coste', etiqueta: 'Coste', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
    ],
    agrupaciones: [{ campo: 'proyectoId', etiqueta: 'Proyecto', orden: 'asc' }],
    ordenamiento: [{ campo: 'horas', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA,
      ejeX: 'proyecto',
      ejeY: ['horas'],
      mostrarLeyenda: false,
    },
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 4,
  },

  // ============================================
  // CLIENTES
  // ============================================
  {
    nombre: 'Ranking de Clientes',
    descripcion: 'Clientes ordenados por facturación total',
    modulo: ModuloInforme.CLIENTES,
    tipo: TipoInforme.MIXTO,
    icono: 'Users',
    fuente: { coleccion: 'clientes' },
    campos: [
      { campo: 'codigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'ciudad', etiqueta: 'Ciudad', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'numFacturas', etiqueta: 'Facturas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 4 },
      { campo: 'totalFacturado', etiqueta: 'Total Facturado', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
    ],
    filtros: [
      { campo: 'activo', operador: OperadorFiltro.IGUAL, valor: true },
    ],
    parametros: [
      { nombre: 'limite', etiqueta: 'Top N', tipo: 'numero', valorDefecto: 20, requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'totalFacturado', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA_HORIZONTAL,
      ejeX: 'nombre',
      ejeY: ['totalFacturado'],
      mostrarLeyenda: false,
    },
    config: { limite: 20, paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 1,
  },
  {
    nombre: 'Clientes con Saldo Pendiente',
    descripcion: 'Clientes con facturas pendientes de cobro',
    modulo: ModuloInforme.CLIENTES,
    tipo: TipoInforme.TABLA,
    icono: 'AlertTriangle',
    fuente: { coleccion: 'clientes' },
    campos: [
      { campo: 'codigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'telefono', etiqueta: 'Teléfono', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'facturasPendientes', etiqueta: 'Fact. Pend.', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'saldoPendiente', etiqueta: 'Saldo Pendiente', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'diasMoroso', etiqueta: 'Días Máx.', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
    ],
    filtros: [
      { campo: 'saldoPendiente', operador: OperadorFiltro.MAYOR, valor: 0 },
    ],
    parametros: [],
    agrupaciones: [],
    ordenamiento: [{ campo: 'saldoPendiente', direccion: 'desc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 2,
  },

  // ============================================
  // PROYECTOS
  // ============================================
  {
    nombre: 'Estado de Proyectos',
    descripcion: 'Resumen del estado de todos los proyectos',
    modulo: ModuloInforme.PROYECTOS,
    tipo: TipoInforme.TABLA,
    icono: 'FolderKanban',
    fuente: { coleccion: 'proyectos' },
    campos: [
      { campo: 'codigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Proyecto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'cliente', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'estado', etiqueta: 'Estado', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 4 },
      { campo: 'presupuesto', etiqueta: 'Presupuesto', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'horasEstimadas', etiqueta: 'H. Estimadas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 6 },
      { campo: 'horasReales', etiqueta: 'H. Reales', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 7 },
      { campo: 'avance', etiqueta: '% Avance', tipo: TipoCampo.PORCENTAJE, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 8 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: [
        { valor: 'pendiente', etiqueta: 'Pendiente' },
        { valor: 'en_curso', etiqueta: 'En Curso' },
        { valor: 'pausado', etiqueta: 'Pausado' },
        { valor: 'finalizado', etiqueta: 'Finalizado' },
      ], requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'fechaInicio', direccion: 'desc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 1,
  },
  {
    nombre: 'Rentabilidad de Proyectos',
    descripcion: 'Análisis de rentabilidad por proyecto',
    modulo: ModuloInforme.PROYECTOS,
    tipo: TipoInforme.MIXTO,
    icono: 'TrendingUp',
    fuente: { coleccion: 'proyectos' },
    campos: [
      { campo: 'nombre', etiqueta: 'Proyecto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'cliente', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'presupuesto', etiqueta: 'Presupuesto', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 3 },
      { campo: 'costeReal', etiqueta: 'Coste Real', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'margen', etiqueta: 'Margen', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'rentabilidad', etiqueta: '% Rentab.', tipo: TipoCampo.PORCENTAJE, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
    ],
    filtros: [
      { campo: 'estado', operador: OperadorFiltro.EN, valor: ['en_curso', 'finalizado'] },
    ],
    parametros: [],
    agrupaciones: [],
    ordenamiento: [{ campo: 'rentabilidad', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA,
      ejeX: 'nombre',
      ejeY: ['presupuesto', 'costeReal'],
      colores: ['#22c55e', '#ef4444'],
      mostrarLeyenda: true,
    },
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 2,
  },

  // ============================================
  // INFORMES FISCALES ESPAÑOLES
  // ============================================
  {
    nombre: 'Modelo 347 - Operaciones con Terceros',
    descripcion: 'Declaración anual de operaciones con terceros superiores a 3.005,06€ (clientes y proveedores)',
    modulo: ModuloInforme.GENERAL,
    tipo: TipoInforme.TABLA,
    icono: 'FileText',
    fuente: { coleccion: 'facturas' },
    campos: [
      { campo: 'nif', etiqueta: 'NIF/CIF', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Razón Social', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'provincia', etiqueta: 'Provincia', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'pais', etiqueta: 'País', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 4 },
      { campo: 'claveOperacion', etiqueta: 'Clave', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 5 },
      { campo: 'importeAnual', etiqueta: 'Importe Anual', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 6 },
      { campo: 'importe1T', etiqueta: '1T', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 7 },
      { campo: 'importe2T', etiqueta: '2T', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 8 },
      { campo: 'importe3T', etiqueta: '3T', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 9 },
      { campo: 'importe4T', etiqueta: '4T', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 10 },
    ],
    filtros: [
      { campo: 'importeAnual', operador: OperadorFiltro.MAYOR_IGUAL, valor: 3005.06 },
    ],
    parametros: [
      { nombre: 'año', etiqueta: 'Ejercicio', tipo: 'numero', valorDefecto: new Date().getFullYear() - 1, requerido: true },
      { nombre: 'tipoTercero', etiqueta: 'Tipo', tipo: 'select', opciones: [
        { valor: 'todos', etiqueta: 'Todos' },
        { valor: 'clientes', etiqueta: 'Solo Clientes' },
        { valor: 'proveedores', etiqueta: 'Solo Proveedores' },
      ], requerido: false },
    ],
    agrupaciones: [{ campo: 'nif', etiqueta: 'NIF/CIF', orden: 'asc' }],
    ordenamiento: [{ campo: 'importeAnual', direccion: 'desc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf', 'csv'] },
    esPlantilla: true,
    orden: 1,
  },
  {
    nombre: 'Listado IVA Repercutido',
    descripcion: 'Desglose de IVA repercutido en facturas emitidas para declaración de IVA',
    modulo: ModuloInforme.VENTAS,
    tipo: TipoInforme.TABLA,
    icono: 'Receipt',
    fuente: { coleccion: 'facturas' },
    campos: [
      { campo: 'numero', etiqueta: 'Nº Factura', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'clienteNif', etiqueta: 'NIF Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'clienteNombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 4 },
      { campo: 'baseImponible', etiqueta: 'Base Imponible', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'tipoIva', etiqueta: '% IVA', tipo: TipoCampo.PORCENTAJE, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
      { campo: 'cuotaIva', etiqueta: 'Cuota IVA', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 7 },
      { campo: 'recargoEquiv', etiqueta: 'Rec. Equiv.', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 8 },
      { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 9 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: true },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: true },
      { nombre: 'tipoIva', etiqueta: 'Tipo IVA', tipo: 'select', opciones: [
        { valor: 'todos', etiqueta: 'Todos' },
        { valor: '21', etiqueta: '21% General' },
        { valor: '10', etiqueta: '10% Reducido' },
        { valor: '4', etiqueta: '4% Superreducido' },
        { valor: '0', etiqueta: '0% Exento' },
      ], requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'fecha', direccion: 'asc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf', 'csv'] },
    esPlantilla: true,
    orden: 5,
  },
  {
    nombre: 'Listado IVA Soportado',
    descripcion: 'Desglose de IVA soportado en facturas recibidas para declaración de IVA',
    modulo: ModuloInforme.COMPRAS,
    tipo: TipoInforme.TABLA,
    icono: 'Receipt',
    fuente: { coleccion: 'facturas_compra' },
    campos: [
      { campo: 'numero', etiqueta: 'Nº Factura', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'proveedorNif', etiqueta: 'NIF Proveedor', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'proveedorNombre', etiqueta: 'Proveedor', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 4 },
      { campo: 'baseImponible', etiqueta: 'Base Imponible', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'tipoIva', etiqueta: '% IVA', tipo: TipoCampo.PORCENTAJE, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
      { campo: 'cuotaIva', etiqueta: 'Cuota IVA', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 7 },
      { campo: 'ivaDeducible', etiqueta: 'IVA Deducible', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 8 },
      { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 9 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: true },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: true },
      { nombre: 'tipoIva', etiqueta: 'Tipo IVA', tipo: 'select', opciones: [
        { valor: 'todos', etiqueta: 'Todos' },
        { valor: '21', etiqueta: '21% General' },
        { valor: '10', etiqueta: '10% Reducido' },
        { valor: '4', etiqueta: '4% Superreducido' },
      ], requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'fecha', direccion: 'asc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf', 'csv'] },
    esPlantilla: true,
    orden: 3,
  },
  {
    nombre: 'Resumen IVA Trimestral',
    descripcion: 'Resumen de bases imponibles e IVA por tipos para modelo 303',
    modulo: ModuloInforme.GENERAL,
    tipo: TipoInforme.TABLA,
    icono: 'Calculator',
    fuente: { coleccion: 'facturas' },
    campos: [
      { campo: 'concepto', etiqueta: 'Concepto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'base21', etiqueta: 'Base 21%', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 2 },
      { campo: 'cuota21', etiqueta: 'Cuota 21%', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 3 },
      { campo: 'base10', etiqueta: 'Base 10%', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'cuota10', etiqueta: 'Cuota 10%', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'base4', etiqueta: 'Base 4%', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 6 },
      { campo: 'cuota4', etiqueta: 'Cuota 4%', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 7 },
      { campo: 'totalBase', etiqueta: 'Total Base', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 8 },
      { campo: 'totalCuota', etiqueta: 'Total Cuota', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 9 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'año', etiqueta: 'Año', tipo: 'numero', valorDefecto: new Date().getFullYear(), requerido: true },
      { nombre: 'trimestre', etiqueta: 'Trimestre', tipo: 'select', opciones: [
        { valor: '1', etiqueta: '1T (Ene-Mar)' },
        { valor: '2', etiqueta: '2T (Abr-Jun)' },
        { valor: '3', etiqueta: '3T (Jul-Sep)' },
        { valor: '4', etiqueta: '4T (Oct-Dic)' },
      ], requerido: true },
    ],
    agrupaciones: [{ campo: 'concepto', etiqueta: 'Concepto', orden: 'asc' }],
    ordenamiento: [{ campo: 'concepto', direccion: 'asc' }],
    config: { paginacion: false, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 2,
  },
  {
    nombre: 'Listado Retenciones IRPF',
    descripcion: 'Retenciones practicadas a profesionales y proveedores para modelo 111/190',
    modulo: ModuloInforme.COMPRAS,
    tipo: TipoInforme.TABLA,
    icono: 'FileText',
    fuente: { coleccion: 'facturas_compra' },
    campos: [
      { campo: 'numero', etiqueta: 'Nº Factura', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'proveedorNif', etiqueta: 'NIF', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'proveedorNombre', etiqueta: 'Proveedor', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 4 },
      { campo: 'baseRetencion', etiqueta: 'Base Retención', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'tipoRetencion', etiqueta: '% Ret.', tipo: TipoCampo.PORCENTAJE, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
      { campo: 'importeRetencion', etiqueta: 'Retención', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 7 },
      { campo: 'clavePercepcion', etiqueta: 'Clave', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 8 },
    ],
    filtros: [
      { campo: 'tieneRetencion', operador: OperadorFiltro.IGUAL, valor: true },
    ],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: true },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: true },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'fecha', direccion: 'asc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf', 'csv'] },
    esPlantilla: true,
    orden: 4,
  },

  // ============================================
  // INFORMES OPERATIVOS ADICIONALES
  // ============================================
  {
    nombre: 'Rotación de Stock',
    descripcion: 'Análisis de rotación de inventario por producto',
    modulo: ModuloInforme.STOCK,
    tipo: TipoInforme.MIXTO,
    icono: 'RefreshCw',
    fuente: { coleccion: 'productos' },
    campos: [
      { campo: 'sku', etiqueta: 'SKU', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Producto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'familia', etiqueta: 'Familia', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'stockActual', etiqueta: 'Stock Actual', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'unidadesVendidas', etiqueta: 'Uds. Vendidas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'indiceRotacion', etiqueta: 'Índice Rotación', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.PROMEDIO, orden: 6 },
      { campo: 'diasStock', etiqueta: 'Días Stock', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.PROMEDIO, orden: 7 },
      { campo: 'clasificacion', etiqueta: 'Clasificación', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 8 },
    ],
    filtros: [
      { campo: 'stockActual', operador: OperadorFiltro.MAYOR, valor: 0 },
    ],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: true },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: true },
      { nombre: 'familia', etiqueta: 'Familia', tipo: 'select', requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'indiceRotacion', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA_HORIZONTAL,
      ejeX: 'nombre',
      ejeY: ['indiceRotacion'],
      mostrarLeyenda: false,
      mostrarEtiquetas: true,
    },
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 4,
  },
  {
    nombre: 'Productos Sin Movimiento',
    descripcion: 'Productos que no han tenido ventas en el período seleccionado',
    modulo: ModuloInforme.STOCK,
    tipo: TipoInforme.TABLA,
    icono: 'PackageX',
    fuente: { coleccion: 'productos' },
    campos: [
      { campo: 'sku', etiqueta: 'SKU', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Producto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'familia', etiqueta: 'Familia', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'stockActual', etiqueta: 'Stock', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'precioCoste', etiqueta: 'Coste Unit.', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 5 },
      { campo: 'valorInmovilizado', etiqueta: 'Valor Inmov.', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 6 },
      { campo: 'ultimaVenta', etiqueta: 'Última Venta', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 7 },
      { campo: 'diasSinMovimiento', etiqueta: 'Días s/Mov.', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 8 },
    ],
    filtros: [
      { campo: 'stockActual', operador: OperadorFiltro.MAYOR, valor: 0 },
      { campo: 'ventasEnPeriodo', operador: OperadorFiltro.IGUAL, valor: 0 },
    ],
    parametros: [
      { nombre: 'diasSinMovimiento', etiqueta: 'Días sin movimiento', tipo: 'numero', valorDefecto: 90, requerido: true },
      { nombre: 'familia', etiqueta: 'Familia', tipo: 'select', requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'valorInmovilizado', direccion: 'desc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 5,
  },
  {
    nombre: 'Margen por Producto',
    descripcion: 'Análisis de rentabilidad y margen por producto',
    modulo: ModuloInforme.VENTAS,
    tipo: TipoInforme.MIXTO,
    icono: 'TrendingUp',
    fuente: { coleccion: 'lineas_factura' },
    campos: [
      { campo: 'sku', etiqueta: 'SKU', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'productoNombre', etiqueta: 'Producto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'unidadesVendidas', etiqueta: 'Uds. Vendidas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 3 },
      { campo: 'totalVentas', etiqueta: 'Ventas', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'totalCoste', etiqueta: 'Coste', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'margenBruto', etiqueta: 'Margen', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 6 },
      { campo: 'porcentajeMargen', etiqueta: '% Margen', tipo: TipoCampo.PORCENTAJE, visible: true, agregacion: TipoAgregacion.PROMEDIO, orden: 7 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
      { nombre: 'familia', etiqueta: 'Familia', tipo: 'select', requerido: false },
    ],
    agrupaciones: [{ campo: 'productoId', etiqueta: 'Producto', orden: 'asc' }],
    ordenamiento: [{ campo: 'margenBruto', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA,
      ejeX: 'productoNombre',
      ejeY: ['totalVentas', 'totalCoste'],
      colores: ['#22c55e', '#ef4444'],
      mostrarLeyenda: true,
    },
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 6,
  },
  {
    nombre: 'Margen por Cliente',
    descripcion: 'Análisis de rentabilidad y margen por cliente',
    modulo: ModuloInforme.CLIENTES,
    tipo: TipoInforme.MIXTO,
    icono: 'TrendingUp',
    fuente: { coleccion: 'facturas' },
    campos: [
      { campo: 'clienteCodigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'clienteNombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'numFacturas', etiqueta: 'Facturas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.CONTEO, orden: 3 },
      { campo: 'totalVentas', etiqueta: 'Ventas', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'totalCoste', etiqueta: 'Coste', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'margenBruto', etiqueta: 'Margen', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 6 },
      { campo: 'porcentajeMargen', etiqueta: '% Margen', tipo: TipoCampo.PORCENTAJE, visible: true, agregacion: TipoAgregacion.PROMEDIO, orden: 7 },
      { campo: 'ticketMedio', etiqueta: 'Ticket Medio', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.PROMEDIO, orden: 8 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
    ],
    agrupaciones: [{ campo: 'clienteId', etiqueta: 'Cliente', orden: 'asc' }],
    ordenamiento: [{ campo: 'margenBruto', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA_HORIZONTAL,
      ejeX: 'clienteNombre',
      ejeY: ['margenBruto'],
      mostrarLeyenda: false,
    },
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 3,
  },
  {
    nombre: 'Evolución Compras vs Ventas',
    descripcion: 'Comparativa mensual de compras y ventas',
    modulo: ModuloInforme.GENERAL,
    tipo: TipoInforme.MIXTO,
    icono: 'BarChart3',
    fuente: { coleccion: 'facturas' },
    campos: [
      { campo: 'mes', etiqueta: 'Mes', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'totalVentas', etiqueta: 'Ventas', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 2 },
      { campo: 'totalCompras', etiqueta: 'Compras', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 3 },
      { campo: 'diferencia', etiqueta: 'Diferencia', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'margenOperativo', etiqueta: '% Margen', tipo: TipoCampo.PORCENTAJE, visible: true, agregacion: TipoAgregacion.PROMEDIO, orden: 5 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'año', etiqueta: 'Año', tipo: 'numero', valorDefecto: new Date().getFullYear(), requerido: true },
    ],
    agrupaciones: [{ campo: 'mesNumero', etiqueta: 'Mes', orden: 'asc' }],
    ordenamiento: [{ campo: 'mesNumero', direccion: 'asc' }],
    grafico: {
      tipo: TipoGraficoInforme.COMBINADO,
      ejeX: 'mes',
      ejeY: ['totalVentas', 'totalCompras'],
      colores: ['#22c55e', '#ef4444'],
      mostrarLeyenda: true,
    },
    config: { paginacion: false, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 3,
  },
  {
    nombre: 'Análisis de Morosos',
    descripcion: 'Clientes con deuda vencida por antigüedad',
    modulo: ModuloInforme.CLIENTES,
    tipo: TipoInforme.TABLA,
    icono: 'UserX',
    fuente: { coleccion: 'clientes' },
    campos: [
      { campo: 'codigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'telefono', etiqueta: 'Teléfono', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'deuda0_30', etiqueta: '0-30 días', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'deuda31_60', etiqueta: '31-60 días', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'deuda61_90', etiqueta: '61-90 días', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 6 },
      { campo: 'deudaMas90', etiqueta: '>90 días', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 7 },
      { campo: 'totalDeuda', etiqueta: 'Total Deuda', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 8 },
      { campo: 'diasMaxMora', etiqueta: 'Días Máx.', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.MAX, orden: 9 },
    ],
    filtros: [
      { campo: 'saldoPendiente', operador: OperadorFiltro.MAYOR, valor: 0 },
    ],
    parametros: [
      { nombre: 'diasMinimos', etiqueta: 'Días mínimos mora', tipo: 'numero', valorDefecto: 0, requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'diasMaxMora', direccion: 'desc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 4,
  },
  {
    nombre: 'Cumplimiento de Presupuestos',
    descripcion: 'Comparativa de presupuestos aprobados vs ejecutados',
    modulo: ModuloInforme.VENTAS,
    tipo: TipoInforme.MIXTO,
    icono: 'Target',
    fuente: { coleccion: 'presupuestos' },
    campos: [
      { campo: 'numero', etiqueta: 'Nº Ppto.', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'clienteNombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'importePresupuesto', etiqueta: 'Presupuestado', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'importeFacturado', etiqueta: 'Facturado', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'desviacion', etiqueta: 'Desviación', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 6 },
      { campo: 'porcentajeCumplimiento', etiqueta: '% Cumpl.', tipo: TipoCampo.PORCENTAJE, visible: true, agregacion: TipoAgregacion.PROMEDIO, orden: 7 },
      { campo: 'estado', etiqueta: 'Estado', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 8 },
    ],
    filtros: [
      { campo: 'estado', operador: OperadorFiltro.EN, valor: ['aceptado', 'convertido'] },
    ],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
    ],
    agrupaciones: [],
    ordenamiento: [{ campo: 'porcentajeCumplimiento', direccion: 'asc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA,
      ejeX: 'clienteNombre',
      ejeY: ['importePresupuesto', 'importeFacturado'],
      colores: ['#3b82f6', '#22c55e'],
      mostrarLeyenda: true,
    },
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 7,
  },
  {
    nombre: 'Ventas por Vendedor',
    descripcion: 'Rendimiento de ventas por comercial/vendedor',
    modulo: ModuloInforme.VENTAS,
    tipo: TipoInforme.MIXTO,
    icono: 'UserCheck',
    fuente: { coleccion: 'facturas' },
    campos: [
      { campo: 'vendedorNombre', etiqueta: 'Vendedor', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'numFacturas', etiqueta: 'Facturas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.CONTEO, orden: 2 },
      { campo: 'numClientes', etiqueta: 'Clientes', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.CONTEO, orden: 3 },
      { campo: 'totalVentas', etiqueta: 'Total Ventas', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'margenBruto', etiqueta: 'Margen', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'ticketMedio', etiqueta: 'Ticket Medio', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.PROMEDIO, orden: 6 },
      { campo: 'porcentajeMargen', etiqueta: '% Margen', tipo: TipoCampo.PORCENTAJE, visible: true, agregacion: TipoAgregacion.PROMEDIO, orden: 7 },
    ],
    filtros: [],
    parametros: [
      { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
      { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
    ],
    agrupaciones: [{ campo: 'vendedorId', etiqueta: 'Vendedor', orden: 'asc' }],
    ordenamiento: [{ campo: 'totalVentas', direccion: 'desc' }],
    grafico: {
      tipo: TipoGraficoInforme.BARRA_HORIZONTAL,
      ejeX: 'vendedorNombre',
      ejeY: ['totalVentas'],
      mostrarLeyenda: false,
    },
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 8,
  },
  {
    nombre: 'Listado de Proveedores',
    descripcion: 'Ranking de proveedores con estadísticas de compra',
    modulo: ModuloInforme.PROVEEDORES,
    tipo: TipoInforme.TABLA,
    icono: 'Building2',
    fuente: { coleccion: 'proveedores' },
    campos: [
      { campo: 'codigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Proveedor', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'nif', etiqueta: 'NIF', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'email', etiqueta: 'Email', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 4 },
      { campo: 'telefono', etiqueta: 'Teléfono', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 5 },
      { campo: 'totalComprado', etiqueta: 'Total Comprado', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 6 },
      { campo: 'saldoPendiente', etiqueta: 'Saldo Pend.', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 7 },
    ],
    filtros: [
      { campo: 'activo', operador: OperadorFiltro.IGUAL, valor: true },
    ],
    parametros: [],
    agrupaciones: [],
    ordenamiento: [{ campo: 'totalComprado', direccion: 'desc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf', 'csv'] },
    esPlantilla: true,
    orden: 1,
  },
  {
    nombre: 'Proveedores con Saldo Pendiente',
    descripcion: 'Proveedores con facturas pendientes de pago',
    modulo: ModuloInforme.PROVEEDORES,
    tipo: TipoInforme.TABLA,
    icono: 'AlertTriangle',
    fuente: { coleccion: 'proveedores' },
    campos: [
      { campo: 'codigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 1 },
      { campo: 'nombre', etiqueta: 'Proveedor', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 2 },
      { campo: 'telefono', etiqueta: 'Teléfono', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 3 },
      { campo: 'facturasPendientes', etiqueta: 'Fact. Pend.', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA, orden: 4 },
      { campo: 'saldoPendiente', etiqueta: 'Saldo Pendiente', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA, orden: 5 },
      { campo: 'proximoVencimiento', etiqueta: 'Próx. Vto.', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA, orden: 6 },
    ],
    filtros: [
      { campo: 'saldoPendiente', operador: OperadorFiltro.MAYOR, valor: 0 },
    ],
    parametros: [],
    agrupaciones: [],
    ordenamiento: [{ campo: 'saldoPendiente', direccion: 'desc' }],
    config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['excel', 'pdf'] },
    esPlantilla: true,
    orden: 2,
  },
];

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function seedInformes() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tralok-dev';

  console.log('🚀 Iniciando seed de informes predefinidos...');
  console.log(`📦 Conectando a: ${MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener empresaId del primer usuario superadmin o de argumentos
    const empresaId = process.argv[2] || 'SISTEMA';

    console.log(`📊 Empresa ID: ${empresaId}`);
    console.log(`📝 Insertando ${informesPredefinidos.length} informes...`);

    let insertados = 0;
    let actualizados = 0;
    let errores = 0;

    for (const informe of informesPredefinidos) {
      try {
        // Buscar si ya existe
        const existente = await InformeModel.findOne({
          empresaId,
          nombre: informe.nombre,
        });

        if (existente) {
          // Actualizar si existe
          await InformeModel.updateOne(
            { _id: existente._id },
            { $set: { ...informe, empresaId } }
          );
          actualizados++;
          console.log(`   ↻ Actualizado: ${informe.nombre}`);
        } else {
          // Crear nuevo
          await InformeModel.create({
            ...informe,
            empresaId,
          });
          insertados++;
          console.log(`   ✓ Creado: ${informe.nombre}`);
        }
      } catch (err: any) {
        errores++;
        console.error(`   ✗ Error en "${informe.nombre}": ${err.message}`);
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   - Insertados: ${insertados}`);
    console.log(`   - Actualizados: ${actualizados}`);
    console.log(`   - Errores: ${errores}`);
    console.log('\n✅ Seed completado!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
seedInformes();
