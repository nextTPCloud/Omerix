// apps/backend/src/modules/dashboard/dashboard.service.ts

import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  Dashboard,
  IDashboard,
  IWidget,
  TipoWidget,
  TamanoWidget,
  CATALOGO_WIDGETS,
  PLANTILLAS_DASHBOARD,
} from './Dashboard';
import { AppError } from '../../middleware/errorHandler.middleware';
import { IDatabaseConfig } from '../../types/express';
import {
  getDashboardModel,
  getFacturaModel,
  getClienteModel,
  getProductoModel,
  getPresupuestoModel,
  getPedidoModel,
  getAlbaranModel,
  getFacturaCompraModel,
  getPersonalModel,
  getParteTrabajoModel,
  getVencimientoModel,
} from '../../utils/dynamic-models.helper';
import { getModeloFichaje } from '../fichajes/Fichaje';
import { tesoreriaDashboardService } from '../tesoreria/tesoreria-dashboard.service';

// ============================================
// INTERFACES
// ============================================

export interface CreateDashboardDTO {
  nombre: string;
  descripcion?: string;
  usuarioId?: string;
  rolId?: string;
  esPlantilla?: boolean;
  widgets?: Partial<IWidget>[];
  config?: Partial<IDashboard['config']>;
}

export interface UpdateDashboardDTO {
  nombre?: string;
  descripcion?: string;
  widgets?: IWidget[];
  config?: Partial<IDashboard['config']>;
}

export interface AddWidgetDTO {
  tipo: TipoWidget;
  tamano?: TamanoWidget;
  posicion?: { x: number; y: number; w: number; h: number };
  config?: Partial<IWidget['config']>;
}

export interface WidgetDataResult {
  tipo: TipoWidget;
  datos: any;
  error?: string;
  ultimaActualizacion: Date;
}

// ============================================
// SERVICIO
// ============================================

export class DashboardService {
  /**
   * Obtener modelo Dashboard para una empresa
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IDashboard>> {
    return await getDashboardModel(empresaId, dbConfig);
  }

  /**
   * Obtener dashboard de un usuario
   */
  async getDashboardUsuario(
    usuarioId: string,
    rolCodigo: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IDashboard> {
    const DashboardModel = await this.getModelo(empresaId, dbConfig);

    // 1. Buscar dashboard del usuario
    let dashboard = await DashboardModel.findOne({
      usuarioId: new Types.ObjectId(usuarioId),
    }).lean();

    if (dashboard) return dashboard;

    // 2. Buscar plantilla del rol
    dashboard = await DashboardModel.findOne({
      rolId: { $exists: true },
      esPlantilla: true,
    }).lean();

    // 3. Si no existe, crear dashboard por defecto basado en plantilla del rol
    if (!dashboard) {
      const plantilla = PLANTILLAS_DASHBOARD[rolCodigo] || PLANTILLAS_DASHBOARD['vendedor'];
      dashboard = await this.crearDashboardDesdeRol(usuarioId, rolCodigo, plantilla, empresaId, dbConfig);
    } else {
      // Clonar plantilla para el usuario
      dashboard = await this.clonarDashboard(dashboard._id.toString(), usuarioId, empresaId, dbConfig);
    }

    return dashboard;
  }

  /**
   * Crear dashboard desde plantilla de rol
   */
  private async crearDashboardDesdeRol(
    usuarioId: string,
    rolCodigo: string,
    plantilla: { widgets: Partial<IWidget>[] },
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IDashboard> {
    const DashboardModel = await this.getModelo(empresaId, dbConfig);

    const widgets: IWidget[] = plantilla.widgets.map((w) => ({
      id: uuidv4(),
      tipo: w.tipo!,
      tamano: w.tamano || TamanoWidget.MEDIANO,
      posicion: w.posicion || { x: 0, y: 0, w: 2, h: 1 },
      config: w.config || CATALOGO_WIDGETS[w.tipo!]?.configDefault || {},
      visible: true,
    }));

    const dashboard = new DashboardModel({
      nombre: `Dashboard de ${rolCodigo}`,
      usuarioId: new Types.ObjectId(usuarioId),
      esPlantilla: false,
      widgets,
      config: {
        columnas: 12,
        espaciado: 16,
        intervalorRefreshGlobal: 60,
      },
    });

    await dashboard.save();
    return dashboard.toObject();
  }

  /**
   * Clonar dashboard para usuario
   */
  private async clonarDashboard(
    dashboardId: string,
    usuarioId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IDashboard> {
    const DashboardModel = await this.getModelo(empresaId, dbConfig);
    const original = await DashboardModel.findById(dashboardId);

    if (!original) {
      throw new AppError('Dashboard no encontrado', 404);
    }

    const clone = new DashboardModel({
      nombre: original.nombre,
      descripcion: original.descripcion,
      usuarioId: new Types.ObjectId(usuarioId),
      esPlantilla: false,
      widgets: original.widgets.map((w) => ({ ...w, id: uuidv4() })),
      config: original.config,
    });

    await clone.save();
    return clone.toObject();
  }

  /**
   * Actualizar dashboard
   */
  async update(
    dashboardId: string,
    data: UpdateDashboardDTO,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IDashboard> {
    const DashboardModel = await this.getModelo(empresaId, dbConfig);
    const dashboard = await DashboardModel.findById(dashboardId);

    if (!dashboard) {
      throw new AppError('Dashboard no encontrado', 404);
    }

    if (data.nombre) dashboard.nombre = data.nombre;
    if (data.descripcion !== undefined) dashboard.descripcion = data.descripcion;
    if (data.widgets) dashboard.widgets = data.widgets;
    if (data.config) {
      dashboard.config = { ...dashboard.config, ...data.config };
    }

    await dashboard.save();
    return dashboard.toObject();
  }

  /**
   * Añadir widget a dashboard
   */
  async addWidget(
    dashboardId: string,
    data: AddWidgetDTO,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IDashboard> {
    const DashboardModel = await this.getModelo(empresaId, dbConfig);
    const dashboard = await DashboardModel.findById(dashboardId);

    if (!dashboard) {
      throw new AppError('Dashboard no encontrado', 404);
    }

    const catalogoWidget = CATALOGO_WIDGETS[data.tipo];
    if (!catalogoWidget) {
      throw new AppError('Tipo de widget no válido', 400);
    }

    const nuevoWidget: IWidget = {
      id: uuidv4(),
      tipo: data.tipo,
      tamano: data.tamano || TamanoWidget.MEDIANO,
      posicion: data.posicion || { x: 0, y: 0, w: 2, h: 1 },
      config: { ...catalogoWidget.configDefault, ...data.config },
      visible: true,
    };

    dashboard.widgets.push(nuevoWidget);
    await dashboard.save();
    return dashboard.toObject();
  }

  /**
   * Actualizar widget
   */
  async updateWidget(
    dashboardId: string,
    widgetId: string,
    updates: Partial<IWidget>,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IDashboard> {
    const DashboardModel = await this.getModelo(empresaId, dbConfig);
    const dashboard = await DashboardModel.findById(dashboardId);

    if (!dashboard) {
      throw new AppError('Dashboard no encontrado', 404);
    }

    const widgetIndex = dashboard.widgets.findIndex((w) => w.id === widgetId);
    if (widgetIndex === -1) {
      throw new AppError('Widget no encontrado', 404);
    }

    // Actualizar campos del widget
    const widget = dashboard.widgets[widgetIndex];
    if (updates.posicion) widget.posicion = updates.posicion;
    if (updates.tamano) widget.tamano = updates.tamano;
    if (updates.config) widget.config = { ...widget.config, ...updates.config };
    if (updates.visible !== undefined) widget.visible = updates.visible;

    await dashboard.save();
    return dashboard.toObject();
  }

  /**
   * Eliminar widget
   */
  async removeWidget(
    dashboardId: string,
    widgetId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IDashboard> {
    const DashboardModel = await this.getModelo(empresaId, dbConfig);
    const dashboard = await DashboardModel.findById(dashboardId);

    if (!dashboard) {
      throw new AppError('Dashboard no encontrado', 404);
    }

    dashboard.widgets = dashboard.widgets.filter((w) => w.id !== widgetId);
    await dashboard.save();
    return dashboard.toObject();
  }

  /**
   * Obtener datos de un widget
   */
  async getWidgetData(
    widget: IWidget,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<WidgetDataResult> {
    try {
      let datos: any = null;

      switch (widget.tipo) {
        case TipoWidget.RESUMEN_VENTAS:
          datos = await this.getResumenVentas(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.RESUMEN_COMPRAS:
          datos = await this.getResumenCompras(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.RESUMEN_TESORERIA:
          datos = await tesoreriaDashboardService.getEstadisticas(empresaId, dbConfig);
          break;
        case TipoWidget.RESUMEN_FACTURACION:
          datos = await this.getResumenFacturacion(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.GRAFICA_VENTAS_PERIODO:
          datos = await this.getGraficaVentasPeriodo(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.GRAFICA_VENTAS_FAMILIA:
          datos = await this.getGraficaVentasFamilia(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.GRAFICA_VENTAS_CLIENTE:
          datos = await this.getGraficaVentasCliente(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.GRAFICA_COMPRAS_PERIODO:
          datos = await this.getGraficaComprasPeriodo(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.GRAFICA_TESORERIA_FLUJO:
          datos = await tesoreriaDashboardService.getPrevisionCaja(30, 0, empresaId, dbConfig);
          break;
        case TipoWidget.GRAFICA_COMPARATIVA_ANUAL:
          datos = await this.getGraficaComparativaAnual(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.GRAFICA_CIRCULAR:
          datos = await this.getGraficaCircular(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.CLIENTES_MOROSOS:
          const estadisticas = await tesoreriaDashboardService.getEstadisticas(empresaId, dbConfig);
          datos = estadisticas.clientesMorosos || [];
          break;
        case TipoWidget.PRODUCTOS_MAS_VENDIDOS:
          datos = await this.getProductosMasVendidos(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.ULTIMOS_DOCUMENTOS:
          datos = await this.getUltimosDocumentos(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.DOCUMENTOS_PENDIENTES:
          datos = await this.getDocumentosPendientes(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.ACCESOS_RAPIDOS:
          datos = widget.config.enlaces || [];
          break;
        case TipoWidget.ALERTAS:
          datos = await this.getAlertas(empresaId, dbConfig);
          break;
        case TipoWidget.PARTES_TRABAJO_HOY:
          datos = await this.getPartesTrabajoHoy(empresaId, dbConfig);
          break;
        case TipoWidget.FICHAJES_HOY:
          datos = await this.getFichajesHoy(empresaId, dbConfig);
          break;
        case TipoWidget.RESUMEN_PERSONAL:
          datos = await this.getResumenPersonal(empresaId, dbConfig);
          break;
        case TipoWidget.RESUMEN_TPV:
        case TipoWidget.VENTAS_TPV_HOY:
          datos = await this.getVentasTPV(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.CALENDARIO:
          datos = await this.getEventosCalendario(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.TAREAS_PENDIENTES:
          datos = await this.getTareasPendientes(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.RECORDATORIOS:
          datos = await this.getRecordatorios(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.KPI_SIMPLE:
        case TipoWidget.KPI_COMPARATIVO:
          datos = await this.getKPIData(widget.config, empresaId, dbConfig);
          break;
        case TipoWidget.CONTADOR:
          datos = await this.getContador(widget.config, empresaId, dbConfig);
          break;
        default:
          datos = { mensaje: 'Widget en desarrollo' };
      }

      return {
        tipo: widget.tipo,
        datos,
        ultimaActualizacion: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return {
        tipo: widget.tipo,
        datos: null,
        error: message,
        ultimaActualizacion: new Date(),
      };
    }
  }

  /**
   * Obtener datos de todos los widgets de un dashboard
   */
  async getAllWidgetsData(
    dashboardId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Record<string, WidgetDataResult>> {
    const DashboardModel = await this.getModelo(empresaId, dbConfig);
    const dashboard = await DashboardModel.findById(dashboardId);

    if (!dashboard) {
      throw new AppError('Dashboard no encontrado', 404);
    }

    const results: Record<string, WidgetDataResult> = {};

    // Ejecutar en paralelo para mejor rendimiento
    await Promise.all(
      dashboard.widgets.filter((w) => w.visible).map(async (widget) => {
        results[widget.id] = await this.getWidgetData(widget, empresaId, dbConfig);
      })
    );

    return results;
  }

  /**
   * Obtener catálogo de widgets disponibles
   */
  getCatalogoWidgets(permisos: string[]): typeof CATALOGO_WIDGETS {
    // Filtrar widgets según permisos del usuario
    const catalogo: typeof CATALOGO_WIDGETS = {} as any;

    for (const [tipo, config] of Object.entries(CATALOGO_WIDGETS)) {
      // Si no requiere permisos o el usuario tiene todos los permisos requeridos
      if (
        !config.permisosRequeridos ||
        config.permisosRequeridos.every((p) => permisos.includes(p))
      ) {
        (catalogo as any)[tipo] = config;
      }
    }

    return catalogo;
  }

  /**
   * Restablecer dashboard a plantilla por defecto
   */
  async resetToDefault(
    dashboardId: string,
    rolCodigo: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IDashboard> {
    const DashboardModel = await this.getModelo(empresaId, dbConfig);
    const dashboard = await DashboardModel.findById(dashboardId);

    if (!dashboard) {
      throw new AppError('Dashboard no encontrado', 404);
    }

    const plantilla = PLANTILLAS_DASHBOARD[rolCodigo] || PLANTILLAS_DASHBOARD['vendedor'];

    dashboard.widgets = plantilla.widgets.map((w) => ({
      id: uuidv4(),
      tipo: w.tipo!,
      tamano: w.tamano || TamanoWidget.MEDIANO,
      posicion: w.posicion || { x: 0, y: 0, w: 2, h: 1 },
      config: w.config || CATALOGO_WIDGETS[w.tipo!]?.configDefault || {},
      visible: true,
    }));

    await dashboard.save();
    return dashboard.toObject();
  }

  // ============================================
  // MÉTODOS PRIVADOS - OBTENCIÓN DE DATOS
  // ============================================

  private async getResumenVentas(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const Factura = await getFacturaModel(empresaId, dbConfig);
    const { fechaDesde, fechaHasta } = this.getFechasFromPeriodo(config.periodo);

    const [actual, anterior] = await Promise.all([
      Factura.aggregate([
        {
          $match: {
            fecha: { $gte: fechaDesde, $lte: fechaHasta },
            estado: { $nin: ['anulada', 'borrador'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totales.totalFactura' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.getPeriodoAnterior(config.periodo, Factura),
    ]);

    const totalActual = actual[0]?.total || 0;
    const totalAnterior = anterior[0]?.total || 0;
    const variacion = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior) * 100 : 0;

    return {
      total: totalActual,
      count: actual[0]?.count || 0,
      variacion,
      tendencia: variacion >= 0 ? 'up' : 'down',
      periodo: config.periodo,
    };
  }

  private async getResumenCompras(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    // Similar a getResumenVentas pero para facturas de compra
    return {
      total: 0,
      count: 0,
      variacion: 0,
      tendencia: 'stable',
      periodo: config.periodo,
    };
  }

  private async getGraficaVentasPeriodo(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const Factura = await getFacturaModel(empresaId, dbConfig);
    const { fechaDesde, fechaHasta } = this.getFechasFromPeriodo(config.periodo);

    const datos = await Factura.aggregate([
      {
        $match: {
          fecha: { $gte: fechaDesde, $lte: fechaHasta },
          estado: { $nin: ['anulada', 'borrador'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$fecha' } },
          total: { $sum: '$totales.totalFactura' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return datos.map((d) => ({
      fecha: d._id,
      total: d.total,
      count: d.count,
    }));
  }

  private async getProductosMasVendidos(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const Factura = await getFacturaModel(empresaId, dbConfig);
    const { fechaDesde, fechaHasta } = this.getFechasFromPeriodo(config.periodo);
    const limite = config.limite || 10;

    const datos = await Factura.aggregate([
      {
        $match: {
          fecha: { $gte: fechaDesde, $lte: fechaHasta },
          estado: { $nin: ['anulada', 'borrador'] },
        },
      },
      { $unwind: '$lineas' },
      {
        $group: {
          _id: '$lineas.productoId',
          nombre: { $first: '$lineas.nombre' },
          cantidad: { $sum: '$lineas.cantidad' },
          total: { $sum: '$lineas.subtotal' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: limite },
    ]);

    return datos;
  }

  private async getUltimosDocumentos(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const Factura = await getFacturaModel(empresaId, dbConfig);
    const limite = config.limite || 10;

    const documentos = await Factura.find()
      .sort({ createdAt: -1 })
      .limit(limite)
      .select('codigo clienteNombre totales.totalFactura estado fecha tipo')
      .lean();

    return documentos;
  }

  private async getPeriodoAnterior(periodo: string | undefined, Factura: Model<any>): Promise<any> {
    const { fechaDesde: fechaDesdeAnterior, fechaHasta: fechaHastaAnterior } = this.getFechasFromPeriodo(
      periodo,
      true
    );

    return Factura.aggregate([
      {
        $match: {
          fecha: { $gte: fechaDesdeAnterior, $lte: fechaHastaAnterior },
          estado: { $nin: ['anulada', 'borrador'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totales.totalFactura' },
        },
      },
    ]);
  }

  private getFechasFromPeriodo(
    periodo: string | undefined,
    anterior: boolean = false
  ): { fechaDesde: Date; fechaHasta: Date } {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let fechaDesde = new Date(hoy);
    let fechaHasta = new Date(hoy);
    fechaHasta.setHours(23, 59, 59, 999);

    switch (periodo) {
      case 'hoy':
        break;
      case 'semana':
        fechaDesde.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        fechaDesde.setMonth(hoy.getMonth(), 1);
        break;
      case 'trimestre':
        const trimestre = Math.floor(hoy.getMonth() / 3);
        fechaDesde.setMonth(trimestre * 3, 1);
        break;
      case 'anio':
        fechaDesde.setMonth(0, 1);
        break;
      default:
        fechaDesde.setMonth(hoy.getMonth(), 1);
    }

    if (anterior) {
      const diff = fechaHasta.getTime() - fechaDesde.getTime();
      fechaHasta = new Date(fechaDesde.getTime() - 1);
      fechaDesde = new Date(fechaDesde.getTime() - diff - 1);
    }

    return { fechaDesde, fechaHasta };
  }

  // ============================================
  // NUEVOS MÉTODOS DE WIDGETS
  // ============================================

  /**
   * Resumen de facturación (presupuestos, pedidos, albaranes, facturas)
   */
  private async getResumenFacturacion(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const { fechaDesde, fechaHasta } = this.getFechasFromPeriodo(config.periodo);

    const [Presupuesto, Pedido, Albaran, Factura] = await Promise.all([
      getPresupuestoModel(empresaId, dbConfig),
      getPedidoModel(empresaId, dbConfig),
      getAlbaranModel(empresaId, dbConfig),
      getFacturaModel(empresaId, dbConfig),
    ]);

    const [presupuestos, pedidos, albaranes, facturas] = await Promise.all([
      Presupuesto.countDocuments({ fecha: { $gte: fechaDesde, $lte: fechaHasta } }),
      Pedido.countDocuments({ fecha: { $gte: fechaDesde, $lte: fechaHasta } }),
      Albaran.countDocuments({ fecha: { $gte: fechaDesde, $lte: fechaHasta } }),
      Factura.aggregate([
        {
          $match: {
            fecha: { $gte: fechaDesde, $lte: fechaHasta },
            estado: { $nin: ['anulada', 'borrador'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totales.totalFactura' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      presupuestos,
      pedidos,
      albaranes,
      facturas: facturas[0]?.count || 0,
      totalFacturado: facturas[0]?.total || 0,
      periodo: config.periodo,
    };
  }

  /**
   * Ventas por familia de productos
   */
  private async getGraficaVentasFamilia(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const Factura = await getFacturaModel(empresaId, dbConfig);
    const { fechaDesde, fechaHasta } = this.getFechasFromPeriodo(config.periodo);
    const limite = config.limite || 10;

    const datos = await Factura.aggregate([
      {
        $match: {
          fecha: { $gte: fechaDesde, $lte: fechaHasta },
          estado: { $nin: ['anulada', 'borrador'] },
        },
      },
      { $unwind: '$lineas' },
      {
        $group: {
          _id: '$lineas.familiaId',
          nombre: { $first: '$lineas.familiaNombre' },
          total: { $sum: '$lineas.subtotal' },
          cantidad: { $sum: '$lineas.cantidad' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: limite },
    ]);

    return datos.map((d) => ({
      nombre: d.nombre || 'Sin familia',
      total: d.total,
      cantidad: d.cantidad,
    }));
  }

  /**
   * Ventas por cliente
   */
  private async getGraficaVentasCliente(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const Factura = await getFacturaModel(empresaId, dbConfig);
    const { fechaDesde, fechaHasta } = this.getFechasFromPeriodo(config.periodo);
    const limite = config.limite || 10;

    const datos = await Factura.aggregate([
      {
        $match: {
          fecha: { $gte: fechaDesde, $lte: fechaHasta },
          estado: { $nin: ['anulada', 'borrador'] },
        },
      },
      {
        $group: {
          _id: '$clienteId',
          nombre: { $first: '$clienteNombre' },
          total: { $sum: '$totales.totalFactura' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: limite },
    ]);

    return datos.map((d) => ({
      nombre: d.nombre || 'Sin cliente',
      total: d.total,
      facturas: d.count,
    }));
  }

  /**
   * Compras por periodo
   */
  private async getGraficaComprasPeriodo(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const FacturaCompra = await getFacturaCompraModel(empresaId, dbConfig);
    const { fechaDesde, fechaHasta } = this.getFechasFromPeriodo(config.periodo);

    const datos = await FacturaCompra.aggregate([
      {
        $match: {
          fecha: { $gte: fechaDesde, $lte: fechaHasta },
          estado: { $nin: ['anulada', 'borrador'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$fecha' } },
          total: { $sum: '$totales.totalFactura' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return datos.map((d) => ({
      fecha: d._id,
      total: d.total,
      count: d.count,
    }));
  }

  /**
   * Comparativa anual (año actual vs año anterior)
   */
  private async getGraficaComparativaAnual(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const Factura = await getFacturaModel(empresaId, dbConfig);
    const anioActual = new Date().getFullYear();
    const anioAnterior = anioActual - 1;

    const [datosActual, datosAnterior] = await Promise.all([
      Factura.aggregate([
        {
          $match: {
            fecha: {
              $gte: new Date(`${anioActual}-01-01`),
              $lte: new Date(`${anioActual}-12-31`),
            },
            estado: { $nin: ['anulada', 'borrador'] },
          },
        },
        {
          $group: {
            _id: { $month: '$fecha' },
            total: { $sum: '$totales.totalFactura' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Factura.aggregate([
        {
          $match: {
            fecha: {
              $gte: new Date(`${anioAnterior}-01-01`),
              $lte: new Date(`${anioAnterior}-12-31`),
            },
            estado: { $nin: ['anulada', 'borrador'] },
          },
        },
        {
          $group: {
            _id: { $month: '$fecha' },
            total: { $sum: '$totales.totalFactura' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return meses.map((mes, i) => ({
      mes,
      [`${anioActual}`]: datosActual.find((d) => d._id === i + 1)?.total || 0,
      [`${anioAnterior}`]: datosAnterior.find((d) => d._id === i + 1)?.total || 0,
    }));
  }

  /**
   * Gráfica circular genérica
   */
  private async getGraficaCircular(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    // Por defecto, muestra distribución de ventas por estado
    const Factura = await getFacturaModel(empresaId, dbConfig);
    const { fechaDesde, fechaHasta } = this.getFechasFromPeriodo(config.periodo);

    const datos = await Factura.aggregate([
      {
        $match: {
          fecha: { $gte: fechaDesde, $lte: fechaHasta },
        },
      },
      {
        $group: {
          _id: '$estado',
          value: { $sum: '$totales.totalFactura' },
          count: { $sum: 1 },
        },
      },
    ]);

    const colores: Record<string, string> = {
      emitida: '#10b981',
      cobrada: '#3b82f6',
      pendiente: '#f59e0b',
      anulada: '#ef4444',
      borrador: '#6b7280',
    };

    return datos.map((d) => ({
      name: d._id || 'Sin estado',
      value: d.value,
      count: d.count,
      color: colores[d._id] || '#6b7280',
    }));
  }

  /**
   * Documentos pendientes (presupuestos, pedidos, albaranes sin facturar)
   */
  private async getDocumentosPendientes(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const [Presupuesto, Pedido, Albaran] = await Promise.all([
      getPresupuestoModel(empresaId, dbConfig),
      getPedidoModel(empresaId, dbConfig),
      getAlbaranModel(empresaId, dbConfig),
    ]);

    const limite = config.limite || 5;

    const [presupuestosPendientes, pedidosPendientes, albaranesPendientes] = await Promise.all([
      Presupuesto.find({
        estado: { $in: ['pendiente', 'enviado'] },
      })
        .sort({ fecha: -1 })
        .limit(limite)
        .select('codigo clienteNombre totales.total fecha estado')
        .lean(),
      Pedido.find({
        estado: { $in: ['pendiente', 'parcial'] },
      })
        .sort({ fecha: -1 })
        .limit(limite)
        .select('codigo clienteNombre totales.total fecha estado')
        .lean(),
      Albaran.find({
        facturado: false,
      })
        .sort({ fecha: -1 })
        .limit(limite)
        .select('codigo clienteNombre totales.total fecha')
        .lean(),
    ]);

    return {
      presupuestos: presupuestosPendientes,
      pedidos: pedidosPendientes,
      albaranes: albaranesPendientes,
    };
  }

  /**
   * Alertas del sistema
   */
  private async getAlertas(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const alertas: any[] = [];

    // Normalizar fechas para comparaciones correctas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en7Dias = new Date(hoy);
    en7Dias.setDate(en7Dias.getDate() + 7);

    // Vencimientos próximos a vencer
    const Vencimiento = await getVencimientoModel(empresaId, dbConfig);

    const vencimientosProximos = await Vencimiento.countDocuments({
      fechaVencimiento: { $gte: hoy, $lte: en7Dias },
      estado: 'pendiente',
    });

    if (vencimientosProximos > 0) {
      alertas.push({
        id: 'venc-proximos',
        titulo: 'Vencimientos próximos',
        descripcion: `${vencimientosProximos} vencimiento(s) en los próximos 7 días`,
        prioridad: 'alta',
        tipo: 'tesoreria',
        url: '/tesoreria',
      });
    }

    // Vencimientos vencidos
    const vencimientosVencidos = await Vencimiento.countDocuments({
      fechaVencimiento: { $lt: hoy },
      estado: 'pendiente',
    });

    if (vencimientosVencidos > 0) {
      alertas.push({
        id: 'venc-vencidos',
        titulo: 'Vencimientos vencidos',
        descripcion: `${vencimientosVencidos} vencimiento(s) impagados`,
        prioridad: 'urgente',
        tipo: 'tesoreria',
        url: '/tesoreria',
      });
    }

    // Presupuestos ya caducados (fechaValidez en el pasado)
    const Presupuesto = await getPresupuestoModel(empresaId, dbConfig);
    const presupuestosCaducados = await Presupuesto.countDocuments({
      fechaValidez: { $lt: hoy },
      estado: { $in: ['pendiente', 'enviado'] },
    });

    if (presupuestosCaducados > 0) {
      alertas.push({
        id: 'presu-caducados',
        titulo: 'Presupuestos caducados',
        descripcion: `${presupuestosCaducados} presupuesto(s) han caducado`,
        prioridad: 'urgente',
        tipo: 'ventas',
        url: '/presupuestos?caducado=si',
      });
    }

    // Presupuestos próximos a caducar (en los próximos 7 días)
    const presupuestosPorCaducar = await Presupuesto.countDocuments({
      fechaValidez: { $gte: hoy, $lte: en7Dias },
      estado: { $in: ['pendiente', 'enviado'] },
    });

    if (presupuestosPorCaducar > 0) {
      alertas.push({
        id: 'presu-caducar',
        titulo: 'Presupuestos por caducar',
        descripcion: `${presupuestosPorCaducar} presupuesto(s) caducan pronto`,
        prioridad: 'media',
        tipo: 'ventas',
        url: '/presupuestos?caducado=pronto',
      });
    }

    return alertas;
  }

  /**
   * Partes de trabajo del día
   */
  private async getPartesTrabajoHoy(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const ParteTrabajo = await getParteTrabajoModel(empresaId, dbConfig);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const [partes, resumen] = await Promise.all([
      ParteTrabajo.find({
        fecha: { $gte: hoy, $lt: manana },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('codigo titulo tipo estado prioridad clienteNombre proyectoNombre responsableNombre horasTrabajadas totales.ventaTotal')
        .lean(),
      ParteTrabajo.aggregate([
        {
          $match: {
            fecha: { $gte: hoy, $lt: manana },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            horasTotales: { $sum: '$horasTrabajadas' },
            pendientes: {
              $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] },
            },
            validados: {
              $sum: { $cond: [{ $eq: ['$estado', 'validado'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    return {
      partes,
      resumen: resumen[0] || { total: 0, horasTotales: 0, pendientes: 0, validados: 0 },
    };
  }

  /**
   * Fichajes del día
   */
  private async getFichajesHoy(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const Fichaje = await getModeloFichaje(new Types.ObjectId(empresaId), dbConfig);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const [fichajes, resumen] = await Promise.all([
      Fichaje.find({
        fecha: { $gte: hoy, $lt: manana },
      })
        .sort({ horaEntrada: -1 })
        .limit(15)
        .select('personalNombre horaEntrada horaSalida estado tipo horasTrabajadas')
        .lean(),
      Fichaje.aggregate([
        {
          $match: {
            fecha: { $gte: hoy, $lt: manana },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            abiertos: {
              $sum: { $cond: [{ $eq: ['$estado', 'abierto'] }, 1, 0] },
            },
            cerrados: {
              $sum: { $cond: [{ $eq: ['$estado', 'cerrado'] }, 1, 0] },
            },
            horasTotales: { $sum: '$horasTrabajadas' },
          },
        },
      ]),
    ]);

    return {
      fichajes: fichajes.map((f: any) => ({
        ...f,
        horaEntrada: f.horaEntrada?.toISOString(),
        horaSalida: f.horaSalida?.toISOString(),
      })),
      resumen: resumen[0] || { total: 0, abiertos: 0, cerrados: 0, horasTotales: 0 },
    };
  }

  /**
   * Resumen de personal
   */
  private async getResumenPersonal(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const [Personal, Fichaje] = await Promise.all([
      getPersonalModel(empresaId, dbConfig),
      getModeloFichaje(new Types.ObjectId(empresaId), dbConfig),
    ]);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const [totalPersonal, personalActivo, fichajesHoy] = await Promise.all([
      Personal.countDocuments({}),
      Personal.countDocuments({ activo: true }),
      Fichaje.countDocuments({ fecha: { $gte: hoy, $lt: manana } }),
    ]);

    return {
      totalPersonal,
      personalActivo,
      fichajesHoy,
      porcentajeAsistencia: personalActivo > 0
        ? Math.round((fichajesHoy / personalActivo) * 100)
        : 0,
    };
  }

  /**
   * Ventas TPV
   */
  private async getVentasTPV(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const Factura = await getFacturaModel(empresaId, dbConfig);
    const { fechaDesde, fechaHasta } = this.getFechasFromPeriodo(config.periodo || 'hoy');

    const datos = await Factura.aggregate([
      {
        $match: {
          fecha: { $gte: fechaDesde, $lte: fechaHasta },
          tipo: 'tpv',
          estado: { $nin: ['anulada', 'borrador'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totales.totalFactura' },
          count: { $sum: 1 },
          efectivo: {
            $sum: {
              $cond: [{ $eq: ['$formaPago', 'efectivo'] }, '$totales.totalFactura', 0],
            },
          },
          tarjeta: {
            $sum: {
              $cond: [{ $eq: ['$formaPago', 'tarjeta'] }, '$totales.totalFactura', 0],
            },
          },
        },
      },
    ]);

    const resumen = datos[0] || { total: 0, count: 0, efectivo: 0, tarjeta: 0 };

    return {
      total: resumen.total,
      tickets: resumen.count,
      ticketMedio: resumen.count > 0 ? resumen.total / resumen.count : 0,
      efectivo: resumen.efectivo,
      tarjeta: resumen.tarjeta,
      periodo: config.periodo || 'hoy',
    };
  }

  /**
   * Eventos del calendario
   */
  private async getEventosCalendario(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const enUnMes = new Date(hoy);
    enUnMes.setMonth(enUnMes.getMonth() + 1);

    // Obtener vencimientos como eventos
    const Vencimiento = await getVencimientoModel(empresaId, dbConfig);
    const vencimientos = await Vencimiento.find({
      fechaVencimiento: { $gte: hoy, $lte: enUnMes },
      estado: 'pendiente',
    })
      .limit(20)
      .select('clienteNombre importe fechaVencimiento tipo')
      .lean();

    // Obtener presupuestos con fecha de validez
    const Presupuesto = await getPresupuestoModel(empresaId, dbConfig);
    const presupuestos = await Presupuesto.find({
      fechaValidez: { $gte: hoy, $lte: enUnMes },
      estado: { $in: ['pendiente', 'enviado'] },
    })
      .limit(10)
      .select('codigo clienteNombre fechaValidez totales.total')
      .lean();

    const eventos = [
      ...vencimientos.map((v: any) => ({
        id: v._id.toString(),
        titulo: `Vencimiento: ${v.clienteNombre}`,
        fecha: v.fechaVencimiento,
        tipo: 'vencimiento',
        importe: v.importe,
      })),
      ...presupuestos.map((p: any) => ({
        id: p._id.toString(),
        titulo: `Caduca presupuesto: ${p.codigo}`,
        fecha: p.fechaValidez,
        tipo: 'presupuesto',
        importe: p.totales?.total,
      })),
    ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return eventos.slice(0, config.limite || 10);
  }

  /**
   * Tareas pendientes
   */
  private async getTareasPendientes(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    // Las tareas pueden venir de presupuestos pendientes de respuesta,
    // pedidos pendientes de servir, etc.
    const [Presupuesto, Pedido] = await Promise.all([
      getPresupuestoModel(empresaId, dbConfig),
      getPedidoModel(empresaId, dbConfig),
    ]);

    const limite = config.limite || 10;

    const [presupuestosPendientes, pedidosPendientes] = await Promise.all([
      Presupuesto.find({ estado: 'pendiente' })
        .sort({ fecha: -1 })
        .limit(limite)
        .select('codigo clienteNombre fecha totales.total')
        .lean(),
      Pedido.find({ estado: { $in: ['pendiente', 'parcial'] } })
        .sort({ fecha: -1 })
        .limit(limite)
        .select('codigo clienteNombre fecha totales.total')
        .lean(),
    ]);

    return [
      ...presupuestosPendientes.map((p: any) => ({
        id: p._id.toString(),
        titulo: `Seguimiento presupuesto ${p.codigo}`,
        subtitulo: p.clienteNombre,
        tipo: 'presupuesto',
        fecha: p.fecha,
        url: `/presupuestos/${p._id}`,
      })),
      ...pedidosPendientes.map((p: any) => ({
        id: p._id.toString(),
        titulo: `Servir pedido ${p.codigo}`,
        subtitulo: p.clienteNombre,
        tipo: 'pedido',
        fecha: p.fecha,
        url: `/pedidos/${p._id}`,
      })),
    ].slice(0, limite);
  }

  /**
   * Recordatorios
   */
  private async getRecordatorios(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    // Los recordatorios pueden incluir seguimiento de presupuestos
    const Presupuesto = await getPresupuestoModel(empresaId, dbConfig);
    const limite = config.limite || 10;

    // Buscar presupuestos con recordatorio activo
    const presupuestosConRecordatorio = await Presupuesto.find({
      'seguimiento.proximoContacto': { $lte: new Date() },
      estado: { $in: ['pendiente', 'enviado'] },
    })
      .sort({ 'seguimiento.proximoContacto': 1 })
      .limit(limite)
      .select('codigo clienteNombre seguimiento.proximoContacto seguimiento.notas')
      .lean();

    return presupuestosConRecordatorio.map((p: any) => ({
      id: p._id.toString(),
      titulo: `Contactar: ${p.clienteNombre}`,
      subtitulo: `Presupuesto ${p.codigo}`,
      fecha: p.seguimiento?.proximoContacto,
      notas: p.seguimiento?.notas,
      url: `/presupuestos/${p._id}`,
    }));
  }

  /**
   * KPI personalizable
   */
  private async getKPIData(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    // KPI genérico basado en configuración
    const { fechaDesde, fechaHasta } = this.getFechasFromPeriodo(config.periodo);
    const Factura = await getFacturaModel(empresaId, dbConfig);

    const datos = await Factura.aggregate([
      {
        $match: {
          fecha: { $gte: fechaDesde, $lte: fechaHasta },
          estado: { $nin: ['anulada', 'borrador'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totales.totalFactura' },
          count: { $sum: 1 },
          margen: { $avg: '$margen' },
        },
      },
    ]);

    const resumen = datos[0] || { total: 0, count: 0, margen: 0 };

    return {
      total: resumen.total,
      count: resumen.count,
      margen: resumen.margen,
      ticketMedio: resumen.count > 0 ? resumen.total / resumen.count : 0,
    };
  }

  /**
   * Contador genérico
   */
  private async getContador(
    config: IWidget['config'],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const { fechaDesde, fechaHasta } = this.getFechasFromPeriodo(config.periodo);

    // Contador de documentos según tipo configurado
    const tipoDocumento = config.filtros?.tipoDocumento || 'facturas';

    let Model: any;
    switch (tipoDocumento) {
      case 'presupuestos':
        Model = await getPresupuestoModel(empresaId, dbConfig);
        break;
      case 'pedidos':
        Model = await getPedidoModel(empresaId, dbConfig);
        break;
      case 'albaranes':
        Model = await getAlbaranModel(empresaId, dbConfig);
        break;
      default:
        Model = await getFacturaModel(empresaId, dbConfig);
    }

    const count = await Model.countDocuments({
      fecha: { $gte: fechaDesde, $lte: fechaHasta },
    });

    return {
      total: count,
      tipoDocumento,
      periodo: config.periodo,
    };
  }
}

export const dashboardService = new DashboardService();
