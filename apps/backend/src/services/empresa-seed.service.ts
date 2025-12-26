/**
 * Servicio para inicializar datos maestros de una nueva empresa
 * Se ejecuta automáticamente al registrar una nueva empresa
 */

import { Connection } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';

// Schemas necesarios
import { TipoImpuesto } from '../modules/tipos-impuesto/TipoImpuesto';
import { FormaPago } from '../modules/formas-pago/FormaPago';
import { SerieDocumento } from '../modules/series-documentos/SerieDocumento';
import { Dashboard, PLANTILLAS_DASHBOARD, CATALOGO_WIDGETS, TamanoWidget, IWidget } from '../modules/dashboard/Dashboard';

/**
 * Datos iniciales de tipos de impuesto (España)
 */
const TIPOS_IMPUESTO_INICIALES = [
  {
    codigo: 'IVA21',
    nombre: 'IVA General 21%',
    descripcion: 'Tipo general del IVA en España',
    porcentaje: 21,
    tipo: 'IVA',
    recargoEquivalencia: false,
    activo: true,
    predeterminado: true,
  },
  {
    codigo: 'IVA10',
    nombre: 'IVA Reducido 10%',
    descripcion: 'Tipo reducido del IVA (hostelería, transporte, etc.)',
    porcentaje: 10,
    tipo: 'IVA',
    recargoEquivalencia: false,
    activo: true,
    predeterminado: false,
  },
  {
    codigo: 'IVA4',
    nombre: 'IVA Superreducido 4%',
    descripcion: 'Tipo superreducido del IVA (alimentos básicos, libros, etc.)',
    porcentaje: 4,
    tipo: 'IVA',
    recargoEquivalencia: false,
    activo: true,
    predeterminado: false,
  },
  {
    codigo: 'IVA0',
    nombre: 'Exento de IVA',
    descripcion: 'Operaciones exentas de IVA',
    porcentaje: 0,
    tipo: 'IVA',
    recargoEquivalencia: false,
    activo: true,
    predeterminado: false,
  },
  {
    codigo: 'IVA21RE',
    nombre: 'IVA 21% + RE 5.2%',
    descripcion: 'IVA General con recargo de equivalencia',
    porcentaje: 21,
    tipo: 'IVA',
    recargoEquivalencia: true,
    porcentajeRecargo: 5.2,
    activo: true,
    predeterminado: false,
  },
  {
    codigo: 'IVA10RE',
    nombre: 'IVA 10% + RE 1.4%',
    descripcion: 'IVA Reducido con recargo de equivalencia',
    porcentaje: 10,
    tipo: 'IVA',
    recargoEquivalencia: true,
    porcentajeRecargo: 1.4,
    activo: true,
    predeterminado: false,
  },
  {
    codigo: 'IVA4RE',
    nombre: 'IVA 4% + RE 0.5%',
    descripcion: 'IVA Superreducido con recargo de equivalencia',
    porcentaje: 4,
    tipo: 'IVA',
    recargoEquivalencia: true,
    porcentajeRecargo: 0.5,
    activo: true,
    predeterminado: false,
  },
];

/**
 * Datos iniciales de formas de pago
 */
const FORMAS_PAGO_INICIALES = [
  {
    codigo: 'EFECT',
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
    nombre: 'Tarjeta de crédito/débito',
    descripcion: 'Pago con tarjeta bancaria',
    tipo: 'tarjeta',
    icono: 'credit-card',
    color: '#3B82F6',
    requiereDatosBancarios: false,
    orden: 2,
    activo: true,
  },
  {
    codigo: 'TRANSF',
    nombre: 'Transferencia bancaria',
    descripcion: 'Pago por transferencia',
    tipo: 'transferencia',
    icono: 'building-2',
    color: '#6366F1',
    requiereDatosBancarios: true,
    orden: 3,
    activo: true,
  },
  {
    codigo: 'DOMICI',
    nombre: 'Domiciliación bancaria',
    descripcion: 'Pago mediante domiciliación SEPA',
    tipo: 'domiciliacion',
    icono: 'calendar-check',
    color: '#8B5CF6',
    requiereDatosBancarios: true,
    orden: 4,
    activo: true,
  },
  {
    codigo: 'CHEQUE',
    nombre: 'Cheque',
    descripcion: 'Pago con cheque bancario',
    tipo: 'cheque',
    icono: 'file-text',
    color: '#F59E0B',
    requiereDatosBancarios: false,
    orden: 5,
    activo: true,
  },
  {
    codigo: 'PAGARE',
    nombre: 'Pagaré',
    descripcion: 'Pago con pagaré',
    tipo: 'pagare',
    icono: 'file-signature',
    color: '#EF4444',
    requiereDatosBancarios: false,
    orden: 6,
    activo: true,
  },
];

/**
 * Datos iniciales de series de documentos
 */
const SERIES_DOCUMENTOS_INICIALES = [
  // Presupuestos
  {
    codigo: 'P',
    nombre: 'Serie principal de presupuestos',
    descripcion: 'Serie por defecto para presupuestos',
    tipoDocumento: 'presupuesto',
    prefijo: 'PRES-',
    longitudNumero: 5,
    siguienteNumero: 1,
    incluirAnio: true,
    separadorAnio: '/',
    reiniciarAnualmente: true,
    activo: true,
    predeterminada: true,
  },
  // Pedidos cliente
  {
    codigo: 'PC',
    nombre: 'Serie principal de pedidos',
    descripcion: 'Serie por defecto para pedidos de cliente',
    tipoDocumento: 'pedido',
    prefijo: 'PED-',
    longitudNumero: 5,
    siguienteNumero: 1,
    incluirAnio: true,
    separadorAnio: '/',
    reiniciarAnualmente: true,
    activo: true,
    predeterminada: true,
  },
  // Albaranes
  {
    codigo: 'A',
    nombre: 'Serie principal de albaranes',
    descripcion: 'Serie por defecto para albaranes de venta',
    tipoDocumento: 'albaran',
    prefijo: 'ALB-',
    longitudNumero: 5,
    siguienteNumero: 1,
    incluirAnio: true,
    separadorAnio: '/',
    reiniciarAnualmente: true,
    activo: true,
    predeterminada: true,
  },
  // Facturas
  {
    codigo: 'F',
    nombre: 'Serie principal de facturas',
    descripcion: 'Serie por defecto para facturas de venta',
    tipoDocumento: 'factura',
    prefijo: 'FAC-',
    longitudNumero: 5,
    siguienteNumero: 1,
    incluirAnio: true,
    separadorAnio: '/',
    reiniciarAnualmente: true,
    activo: true,
    predeterminada: true,
  },
  // Facturas rectificativas
  {
    codigo: 'R',
    nombre: 'Serie de facturas rectificativas',
    descripcion: 'Serie por defecto para facturas rectificativas',
    tipoDocumento: 'factura_rectificativa',
    prefijo: 'RECT-',
    longitudNumero: 5,
    siguienteNumero: 1,
    incluirAnio: true,
    separadorAnio: '/',
    reiniciarAnualmente: true,
    activo: true,
    predeterminada: true,
  },
  // Pedidos a proveedor
  {
    codigo: 'PP',
    nombre: 'Serie principal de pedidos a proveedor',
    descripcion: 'Serie por defecto para pedidos a proveedores',
    tipoDocumento: 'pedido_proveedor',
    prefijo: 'PEDP-',
    longitudNumero: 5,
    siguienteNumero: 1,
    incluirAnio: true,
    separadorAnio: '/',
    reiniciarAnualmente: true,
    activo: true,
    predeterminada: true,
  },
  // Albaranes de proveedor
  {
    codigo: 'AP',
    nombre: 'Serie principal de albaranes de proveedor',
    descripcion: 'Serie por defecto para albaranes de compra',
    tipoDocumento: 'albaran_proveedor',
    prefijo: 'ALBP-',
    longitudNumero: 5,
    siguienteNumero: 1,
    incluirAnio: true,
    separadorAnio: '/',
    reiniciarAnualmente: true,
    activo: true,
    predeterminada: true,
  },
  // Facturas de proveedor
  {
    codigo: 'FP',
    nombre: 'Serie principal de facturas de proveedor',
    descripcion: 'Serie por defecto para facturas de compra',
    tipoDocumento: 'factura_proveedor',
    prefijo: 'FACP-',
    longitudNumero: 5,
    siguienteNumero: 1,
    incluirAnio: true,
    separadorAnio: '/',
    reiniciarAnualmente: true,
    activo: true,
    predeterminada: true,
  },
];

/**
 * Clase principal del servicio de seed
 */
class EmpresaSeedService {
  /**
   * Inicializar todos los datos maestros de una empresa
   */
  async seedEmpresaData(connection: Connection, empresaId: string): Promise<void> {
    logger.info(`🌱 Iniciando seed de datos para empresa ${empresaId}...`);

    try {
      // Obtener modelos de la conexión de la empresa
      const TipoImpuestoModel = connection.model('TipoImpuesto', TipoImpuesto.schema);
      const FormaPagoModel = connection.model('FormaPago', FormaPago.schema);
      const SerieDocumentoModel = connection.model('SerieDocumento', SerieDocumento.schema);

      // Seed en paralelo para mejor rendimiento
      await Promise.all([
        this.seedTiposImpuesto(TipoImpuestoModel, empresaId),
        this.seedFormasPago(FormaPagoModel, empresaId),
        this.seedSeriesDocumentos(SerieDocumentoModel, empresaId),
      ]);

      // Dashboard inicial (se crea aparte porque depende del usuario)
      await this.seedDashboard(connection, empresaId);

      logger.info(`✅ Seed de datos completado para empresa ${empresaId}`);
    } catch (error) {
      logger.error(`❌ Error en seed de datos para empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Seed de tipos de impuesto
   */
  private async seedTiposImpuesto(Model: any, empresaId: string): Promise<void> {
    const count = await Model.countDocuments();
    if (count > 0) {
      logger.info(`⏭️  Tipos de impuesto ya existen para empresa ${empresaId}`);
      return;
    }

    await Model.insertMany(TIPOS_IMPUESTO_INICIALES);
    logger.info(`✅ ${TIPOS_IMPUESTO_INICIALES.length} tipos de impuesto creados para empresa ${empresaId}`);
  }

  /**
   * Seed de formas de pago
   */
  private async seedFormasPago(Model: any, empresaId: string): Promise<void> {
    const count = await Model.countDocuments();
    if (count > 0) {
      logger.info(`⏭️  Formas de pago ya existen para empresa ${empresaId}`);
      return;
    }

    await Model.insertMany(FORMAS_PAGO_INICIALES);
    logger.info(`✅ ${FORMAS_PAGO_INICIALES.length} formas de pago creadas para empresa ${empresaId}`);
  }

  /**
   * Seed de series de documentos
   */
  private async seedSeriesDocumentos(Model: any, empresaId: string): Promise<void> {
    const count = await Model.countDocuments();
    if (count > 0) {
      logger.info(`⏭️  Series de documentos ya existen para empresa ${empresaId}`);
      return;
    }

    await Model.insertMany(SERIES_DOCUMENTOS_INICIALES);
    logger.info(`✅ ${SERIES_DOCUMENTOS_INICIALES.length} series de documentos creadas para empresa ${empresaId}`);
  }

  /**
   * Seed del dashboard por defecto
   */
  private async seedDashboard(connection: Connection, empresaId: string): Promise<void> {
    const DashboardModel = connection.model('Dashboard', Dashboard.schema);

    const count = await DashboardModel.countDocuments();
    if (count > 0) {
      logger.info(`⏭️  Dashboard ya existe para empresa ${empresaId}`);
      return;
    }

    // Usar plantilla de admin como default (tiene todos los widgets)
    const plantilla = PLANTILLAS_DASHBOARD['admin'];

    const widgets: IWidget[] = plantilla.widgets.map((w) => ({
      id: uuidv4(),
      tipo: w.tipo!,
      tamano: w.tamano || TamanoWidget.MEDIANO,
      posicion: w.posicion || { x: 0, y: 0, w: 3, h: 2 },
      config: w.config || CATALOGO_WIDGETS[w.tipo!]?.configDefault || {},
      visible: true,
    }));

    const dashboardPorDefecto = new DashboardModel({
      nombre: 'Dashboard Principal',
      descripcion: 'Panel de control por defecto',
      esPlantilla: true,
      esPorDefecto: true,
      widgets,
      config: {
        columnas: 12,
        espaciado: 12,
        intervalorRefreshGlobal: 60,
        tema: 'system',
      },
    });

    await dashboardPorDefecto.save();
    logger.info(`✅ Dashboard por defecto creado para empresa ${empresaId}`);
  }
}

// Exportar instancia singleton
export const empresaSeedService = new EmpresaSeedService();
