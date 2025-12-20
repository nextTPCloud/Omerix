import { Types } from 'mongoose';
import { IDatabaseConfig } from '../empresa/Empresa';
import {
  getVencimientoModel,
  getPagareModel,
  getReciboModel,
} from '../../utils/dynamic-models.helper';
import { EstadoVencimiento, TipoVencimiento } from '../../models/Vencimiento';
import { EstadoPagare, TipoPagare } from './Pagare';
import { EstadoRecibo } from './Recibo';

// ============================================
// TIPOS
// ============================================

export interface EstadisticasTesoreria {
  // Resumen general
  saldoPendienteCobro: number;
  saldoPendientePago: number;
  saldoNeto: number;

  // Por periodos
  vencimientosSemana: { cobros: number; pagos: number };
  vencimientosMes: { cobros: number; pagos: number };
  vencimientosTrimestre: { cobros: number; pagos: number };

  // Documentos pendientes
  pagaresPendientesRecibidos: number;
  pagaresPendientesEmitidos: number;
  recibosPendientes: number;

  // Devoluciones (último mes)
  devolucionesMes: number;
  importeDevuelto: number;
  tasaDevolucion: number;

  // Top morosos
  clientesMorosos: Array<{
    clienteId: string;
    nombre: string;
    importePendiente: number;
    diasMoraProm: number;
    documentosPendientes: number;
  }>;

  // Vencimientos próximos
  vencimientosProximosDias: Array<{
    fecha: string;
    cobros: number;
    pagos: number;
  }>;
}

export interface PrevisionCaja {
  saldoInicial: number;
  prevision: Array<{
    fecha: string;
    cobros: number;
    pagos: number;
    saldoDia: number;
    saldoAcumulado: number;
  }>;
  totales: {
    totalCobros: number;
    totalPagos: number;
    saldoFinal: number;
  };
}

// ============================================
// SERVICIO
// ============================================

export class TesoreriaDashboardService {
  /**
   * Obtener estadísticas generales de tesorería
   */
  async getEstadisticas(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<EstadisticasTesoreria> {
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);
    const PagareModel = await getPagareModel(empresaId, dbConfig);
    const ReciboModel = await getReciboModel(empresaId, dbConfig);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const unaSemana = new Date(hoy);
    unaSemana.setDate(unaSemana.getDate() + 7);

    const unMes = new Date(hoy);
    unMes.setMonth(unMes.getMonth() + 1);

    const unTrimestre = new Date(hoy);
    unTrimestre.setMonth(unTrimestre.getMonth() + 3);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // Ejecutar consultas en paralelo
    const [
      resumenVencimientos,
      vencimientosSemana,
      vencimientosMes,
      vencimientosTrimestre,
      pagaresPendientes,
      recibosPendientes,
      devolucionesMes,
      clientesMorosos,
      vencimientosProximos,
    ] = await Promise.all([
      // Resumen general vencimientos
      VencimientoModel.aggregate([
        {
          $match: {
            estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
          },
        },
        {
          $group: {
            _id: '$tipo',
            total: { $sum: '$importePendiente' },
          },
        },
      ]),

      // Vencimientos próxima semana
      VencimientoModel.aggregate([
        {
          $match: {
            estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
            fechaVencimiento: { $gte: hoy, $lt: unaSemana },
          },
        },
        {
          $group: {
            _id: '$tipo',
            total: { $sum: '$importePendiente' },
          },
        },
      ]),

      // Vencimientos próximo mes
      VencimientoModel.aggregate([
        {
          $match: {
            estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
            fechaVencimiento: { $gte: hoy, $lt: unMes },
          },
        },
        {
          $group: {
            _id: '$tipo',
            total: { $sum: '$importePendiente' },
          },
        },
      ]),

      // Vencimientos próximo trimestre
      VencimientoModel.aggregate([
        {
          $match: {
            estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
            fechaVencimiento: { $gte: hoy, $lt: unTrimestre },
          },
        },
        {
          $group: {
            _id: '$tipo',
            total: { $sum: '$importePendiente' },
          },
        },
      ]),

      // Pagarés pendientes
      PagareModel.aggregate([
        {
          $match: {
            empresaId: new Types.ObjectId(empresaId),
            estado: { $in: [EstadoPagare.PENDIENTE, EstadoPagare.EN_CARTERA] },
          },
        },
        {
          $group: {
            _id: '$tipo',
            total: { $sum: '$importe' },
          },
        },
      ]),

      // Recibos pendientes
      ReciboModel.countDocuments({
        empresaId: new Types.ObjectId(empresaId),
        estado: { $in: [EstadoRecibo.EMITIDO, EstadoRecibo.ENVIADO] },
      }),

      // Devoluciones del mes
      VencimientoModel.aggregate([
        {
          $match: {
            estado: EstadoVencimiento.DEVUELTO,
            'devolucion.fecha': { $gte: inicioMes },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: '$importe' },
          },
        },
      ]),

      // Top clientes morosos
      VencimientoModel.aggregate([
        {
          $match: {
            tipo: TipoVencimiento.COBRO,
            estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
            fechaVencimiento: { $lt: hoy },
          },
        },
        {
          $group: {
            _id: '$clienteId',
            nombre: { $first: '$terceroNombre' },
            importePendiente: { $sum: '$importePendiente' },
            documentosPendientes: { $sum: 1 },
            fechaVencimientoMin: { $min: '$fechaVencimiento' },
          },
        },
        {
          $project: {
            nombre: 1,
            importePendiente: 1,
            documentosPendientes: 1,
            diasMoraProm: {
              $divide: [
                { $subtract: [hoy, '$fechaVencimientoMin'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
        { $sort: { importePendiente: -1 } },
        { $limit: 10 },
      ]),

      // Vencimientos próximos 30 días agrupados por fecha
      VencimientoModel.aggregate([
        {
          $match: {
            estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
            fechaVencimiento: { $gte: hoy, $lt: unMes },
          },
        },
        {
          $group: {
            _id: {
              fecha: { $dateToString: { format: '%Y-%m-%d', date: '$fechaVencimiento' } },
              tipo: '$tipo',
            },
            total: { $sum: '$importePendiente' },
          },
        },
        { $sort: { '_id.fecha': 1 } },
      ]),
    ]);

    // Procesar resultados
    const cobros = resumenVencimientos.find(r => r._id === TipoVencimiento.COBRO);
    const pagos = resumenVencimientos.find(r => r._id === TipoVencimiento.PAGO);

    const semCobros = vencimientosSemana.find(r => r._id === TipoVencimiento.COBRO);
    const semPagos = vencimientosSemana.find(r => r._id === TipoVencimiento.PAGO);

    const mesCobros = vencimientosMes.find(r => r._id === TipoVencimiento.COBRO);
    const mesPagos = vencimientosMes.find(r => r._id === TipoVencimiento.PAGO);

    const trimCobros = vencimientosTrimestre.find(r => r._id === TipoVencimiento.COBRO);
    const trimPagos = vencimientosTrimestre.find(r => r._id === TipoVencimiento.PAGO);

    const pagaresRecibidos = pagaresPendientes.find(p => p._id === TipoPagare.RECIBIDO);
    const pagaresEmitidos = pagaresPendientes.find(p => p._id === TipoPagare.EMITIDO);

    // Procesar vencimientos próximos por fecha
    const vencimientosPorFecha: Record<string, { cobros: number; pagos: number }> = {};
    for (const v of vencimientosProximos) {
      const fecha = v._id.fecha;
      if (!vencimientosPorFecha[fecha]) {
        vencimientosPorFecha[fecha] = { cobros: 0, pagos: 0 };
      }
      if (v._id.tipo === TipoVencimiento.COBRO) {
        vencimientosPorFecha[fecha].cobros = v.total;
      } else {
        vencimientosPorFecha[fecha].pagos = v.total;
      }
    }

    const vencimientosProximosDias = Object.entries(vencimientosPorFecha).map(
      ([fecha, valores]) => ({
        fecha,
        cobros: valores.cobros,
        pagos: valores.pagos,
      })
    );

    // Calcular tasa de devolución
    const totalEmitidoMes = await VencimientoModel.countDocuments({
      tipo: TipoVencimiento.COBRO,
      fechaEmision: { $gte: inicioMes },
    });
    const tasaDevolucion =
      totalEmitidoMes > 0
        ? ((devolucionesMes[0]?.count || 0) / totalEmitidoMes) * 100
        : 0;

    return {
      saldoPendienteCobro: cobros?.total || 0,
      saldoPendientePago: pagos?.total || 0,
      saldoNeto: (cobros?.total || 0) - (pagos?.total || 0),

      vencimientosSemana: {
        cobros: semCobros?.total || 0,
        pagos: semPagos?.total || 0,
      },
      vencimientosMes: {
        cobros: mesCobros?.total || 0,
        pagos: mesPagos?.total || 0,
      },
      vencimientosTrimestre: {
        cobros: trimCobros?.total || 0,
        pagos: trimPagos?.total || 0,
      },

      pagaresPendientesRecibidos: pagaresRecibidos?.total || 0,
      pagaresPendientesEmitidos: pagaresEmitidos?.total || 0,
      recibosPendientes,

      devolucionesMes: devolucionesMes[0]?.count || 0,
      importeDevuelto: devolucionesMes[0]?.total || 0,
      tasaDevolucion: Math.round(tasaDevolucion * 100) / 100,

      clientesMorosos: clientesMorosos.map(c => ({
        clienteId: c._id?.toString() || '',
        nombre: c.nombre || 'Sin nombre',
        importePendiente: c.importePendiente,
        diasMoraProm: Math.round(c.diasMoraProm || 0),
        documentosPendientes: c.documentosPendientes,
      })),

      vencimientosProximosDias,
    };
  }

  /**
   * Obtener previsión de caja para los próximos X días
   */
  async getPrevisionCaja(
    empresaId: string,
    dias: number,
    saldoInicial: number,
    dbConfig: IDatabaseConfig
  ): Promise<PrevisionCaja> {
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaFin = new Date(hoy);
    fechaFin.setDate(fechaFin.getDate() + dias);

    // Obtener vencimientos pendientes en el periodo
    const vencimientos = await VencimientoModel.aggregate([
      {
        $match: {
          estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
          fechaVencimiento: { $gte: hoy, $lte: fechaFin },
        },
      },
      {
        $group: {
          _id: {
            fecha: { $dateToString: { format: '%Y-%m-%d', date: '$fechaVencimiento' } },
            tipo: '$tipo',
          },
          total: { $sum: '$importePendiente' },
        },
      },
      { $sort: { '_id.fecha': 1 } },
    ]);

    // Construir mapa de previsión por fecha
    const previsionPorFecha: Record<string, { cobros: number; pagos: number }> = {};

    // Inicializar todas las fechas del periodo
    for (let i = 0; i <= dias; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + i);
      const fechaStr = fecha.toISOString().slice(0, 10);
      previsionPorFecha[fechaStr] = { cobros: 0, pagos: 0 };
    }

    // Llenar con datos reales
    for (const v of vencimientos) {
      const fecha = v._id.fecha;
      if (previsionPorFecha[fecha]) {
        if (v._id.tipo === TipoVencimiento.COBRO) {
          previsionPorFecha[fecha].cobros = v.total;
        } else {
          previsionPorFecha[fecha].pagos = v.total;
        }
      }
    }

    // Construir array de previsión con saldos
    let saldoAcumulado = saldoInicial;
    let totalCobros = 0;
    let totalPagos = 0;

    const prevision = Object.entries(previsionPorFecha).map(([fecha, valores]) => {
      const saldoDia = valores.cobros - valores.pagos;
      saldoAcumulado += saldoDia;
      totalCobros += valores.cobros;
      totalPagos += valores.pagos;

      return {
        fecha,
        cobros: valores.cobros,
        pagos: valores.pagos,
        saldoDia,
        saldoAcumulado,
      };
    });

    return {
      saldoInicial,
      prevision,
      totales: {
        totalCobros,
        totalPagos,
        saldoFinal: saldoAcumulado,
      },
    };
  }

  /**
   * Obtener resumen por cliente
   */
  async getResumenPorCliente(
    empresaId: string,
    clienteId: string,
    dbConfig: IDatabaseConfig
  ) {
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);
    const PagareModel = await getPagareModel(empresaId, dbConfig);
    const ReciboModel = await getReciboModel(empresaId, dbConfig);

    const hoy = new Date();

    const [vencimientos, pagares, recibos] = await Promise.all([
      // Vencimientos del cliente
      VencimientoModel.aggregate([
        {
          $match: {
            clienteId: new Types.ObjectId(clienteId),
            tipo: TipoVencimiento.COBRO,
          },
        },
        {
          $group: {
            _id: '$estado',
            total: { $sum: '$importePendiente' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Pagarés del cliente
      PagareModel.aggregate([
        {
          $match: {
            empresaId: new Types.ObjectId(empresaId),
            terceroId: new Types.ObjectId(clienteId),
            terceroTipo: 'cliente',
          },
        },
        {
          $group: {
            _id: '$estado',
            total: { $sum: '$importe' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Recibos del cliente
      ReciboModel.aggregate([
        {
          $match: {
            empresaId: new Types.ObjectId(empresaId),
            clienteId: new Types.ObjectId(clienteId),
          },
        },
        {
          $group: {
            _id: '$estado',
            total: { $sum: '$importe' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Obtener vencimientos pendientes del cliente con detalle
    const vencimientosPendientes = await VencimientoModel.find({
      clienteId: new Types.ObjectId(clienteId),
      tipo: TipoVencimiento.COBRO,
      estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
    })
      .sort({ fechaVencimiento: 1 })
      .lean();

    // Calcular totales y métricas
    const pendientes = vencimientos.filter(v =>
      [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL].includes(v._id)
    );
    const totalPendiente = pendientes.reduce((sum, v) => sum + v.total, 0);
    const countPendientes = pendientes.reduce((sum, v) => sum + v.count, 0);

    const vencidos = vencimientosPendientes.filter(
      v => new Date(v.fechaVencimiento) < hoy
    );
    const totalVencido = vencidos.reduce((sum, v) => sum + v.importePendiente, 0);

    // Calcular días promedio de mora
    let diasMoraProm = 0;
    if (vencidos.length > 0) {
      const sumaDias = vencidos.reduce((sum, v) => {
        const dias = Math.floor(
          (hoy.getTime() - new Date(v.fechaVencimiento).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + dias;
      }, 0);
      diasMoraProm = Math.round(sumaDias / vencidos.length);
    }

    return {
      vencimientos: {
        pendiente: totalPendiente,
        vencido: totalVencido,
        countPendientes,
        countVencidos: vencidos.length,
        diasMoraProm,
        detalle: vencimientosPendientes,
      },
      pagares: {
        porEstado: pagares,
      },
      recibos: {
        porEstado: recibos,
      },
    };
  }
}

export const tesoreriaDashboardService = new TesoreriaDashboardService();
