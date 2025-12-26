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
