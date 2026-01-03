import mongoose, { Model } from 'mongoose';
import { getMovimientoBancarioModel, getFormaPagoModel, getCuentaBancariaModel } from '../../utils/dynamic-models.helper';
import {
  IMovimientoBancario,
  TipoMovimiento,
  OrigenMovimiento,
  MetodoMovimiento,
  EstadoMovimiento,
} from './models/MovimientoBancario';
import { IDatabaseConfig } from '../../types/database.types';
import { databaseManager } from '../../services/database-manager.service';
import Empresa from '../empresa/Empresa';

// Interface para crear movimiento
export interface ICrearMovimiento {
  tipo: TipoMovimiento;
  origen: OrigenMovimiento;
  metodo: MetodoMovimiento;
  importe: number;
  fecha: Date;
  concepto: string;
  fechaValor?: Date;
  cuentaBancariaId?: string;
  cuentaBancariaNombre?: string;
  terceroTipo?: 'cliente' | 'proveedor';
  terceroId?: string;
  terceroNombre?: string;
  terceroNif?: string;
  documentoOrigenTipo?: string;
  documentoOrigenId?: string;
  documentoOrigenNumero?: string;
  tpvId?: string;
  tpvNombre?: string;
  ticketId?: string;
  ticketNumero?: string;
  observaciones?: string;
  referenciaBancaria?: string;
  usuarioId: string;
}

// Interface para filtros de búsqueda
export interface IFiltrosMovimientos {
  tipo?: TipoMovimiento;
  origen?: OrigenMovimiento | OrigenMovimiento[];
  metodo?: MetodoMovimiento;
  estado?: EstadoMovimiento;
  cuentaBancariaId?: string;
  terceroId?: string;
  tpvId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  importeMin?: number;
  importeMax?: number;
  conciliado?: boolean;
  busqueda?: string;
}

class MovimientosBancariosService {
  /**
   * Obtiene la configuración de BD de una empresa
   */
  private async getDbConfig(empresaId: string): Promise<IDatabaseConfig> {
    const empresa = await Empresa.findById(empresaId).lean();
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }
    if (!empresa.databaseConfig) {
      throw new Error('Configuracion de base de datos no encontrada para esta empresa');
    }
    return empresa.databaseConfig;
  }

  /**
   * Obtiene la cuenta bancaria asociada a una forma de pago
   */
  async obtenerCuentaDesdFormaPago(
    empresaId: string,
    metodo: MetodoMovimiento | string,
    formaPagoId?: string
  ): Promise<{ cuentaBancariaId?: string; cuentaBancariaNombre?: string }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const FormaPago = await getFormaPagoModel(empresaId, dbConfig);

    let formaPago;
    if (formaPagoId) {
      // Buscar por ID específico
      formaPago = await FormaPago.findById(formaPagoId).lean();
    } else {
      // Buscar por tipo de método (mapeo)
      const tipoMap: Record<string, string> = {
        [MetodoMovimiento.EFECTIVO]: 'efectivo',
        [MetodoMovimiento.TARJETA]: 'tarjeta',
        [MetodoMovimiento.TRANSFERENCIA]: 'transferencia',
        [MetodoMovimiento.BIZUM]: 'otro', // Bizum se asocia a "otro" o a "tarjeta"
        [MetodoMovimiento.DOMICILIACION]: 'domiciliacion',
        [MetodoMovimiento.CHEQUE]: 'cheque',
        [MetodoMovimiento.PAGARE]: 'pagare',
        [MetodoMovimiento.OTRO]: 'otro',
      };
      const tipo = tipoMap[metodo] || 'efectivo';
      formaPago = await FormaPago.findOne({ tipo, activo: true }).lean();
    }

    if (formaPago?.cuentaBancariaId) {
      return {
        cuentaBancariaId: formaPago.cuentaBancariaId.toString(),
        cuentaBancariaNombre: formaPago.cuentaBancariaNombre || '',
      };
    }

    // Si no tiene cuenta configurada, intentar obtener la cuenta predeterminada
    const CuentaBancaria = await getCuentaBancariaModel(empresaId, dbConfig);
    const cuentaPredeterminada = await CuentaBancaria.findOne({
      activa: true,
      predeterminada: true,
    }).lean();

    if (cuentaPredeterminada) {
      return {
        cuentaBancariaId: cuentaPredeterminada._id.toString(),
        cuentaBancariaNombre: cuentaPredeterminada.alias || `${cuentaPredeterminada.banco} - ...${cuentaPredeterminada.iban.slice(-4)}`,
      };
    }

    return {};
  }

  /**
   * Genera número único de movimiento
   */
  private async generarNumero(MovimientoBancario: Model<IMovimientoBancario>): Promise<string> {
    const año = new Date().getFullYear();
    const prefijo = `MOV-${año}-`;

    const ultimo = await MovimientoBancario.findOne({
      numero: new RegExp(`^${prefijo}\\d+$`),
    })
      .sort({ numero: -1 })
      .lean();

    let siguienteNum = 1;
    if (ultimo?.numero) {
      const numStr = ultimo.numero.replace(prefijo, '');
      siguienteNum = parseInt(numStr, 10) + 1;
    }

    return `${prefijo}${siguienteNum.toString().padStart(5, '0')}`;
  }

  /**
   * Crear un nuevo movimiento bancario
   */
  async crear(empresaId: string, datos: ICrearMovimiento): Promise<IMovimientoBancario> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);

    const numero = await this.generarNumero(MovimientoBancario);

    const movimiento = new MovimientoBancario({
      _id: new mongoose.Types.ObjectId(),
      numero,
      tipo: datos.tipo,
      origen: datos.origen,
      metodo: datos.metodo,
      estado: EstadoMovimiento.CONFIRMADO,
      importe: datos.importe,
      fecha: datos.fecha,
      fechaValor: datos.fechaValor,
      concepto: datos.concepto,
      cuentaBancariaId: datos.cuentaBancariaId ? new mongoose.Types.ObjectId(datos.cuentaBancariaId) : undefined,
      cuentaBancariaNombre: datos.cuentaBancariaNombre,
      terceroTipo: datos.terceroTipo,
      terceroId: datos.terceroId ? new mongoose.Types.ObjectId(datos.terceroId) : undefined,
      terceroNombre: datos.terceroNombre,
      terceroNif: datos.terceroNif,
      documentoOrigenTipo: datos.documentoOrigenTipo,
      documentoOrigenId: datos.documentoOrigenId ? new mongoose.Types.ObjectId(datos.documentoOrigenId) : undefined,
      documentoOrigenNumero: datos.documentoOrigenNumero,
      tpvId: datos.tpvId ? new mongoose.Types.ObjectId(datos.tpvId) : undefined,
      tpvNombre: datos.tpvNombre,
      ticketId: datos.ticketId ? new mongoose.Types.ObjectId(datos.ticketId) : undefined,
      ticketNumero: datos.ticketNumero,
      observaciones: datos.observaciones,
      referenciaBancaria: datos.referenciaBancaria,
      conciliado: false,
      creadoPor: new mongoose.Types.ObjectId(datos.usuarioId),
      fechaCreacion: new Date(),
      activo: true,
    });

    await movimiento.save();
    return movimiento;
  }

  /**
   * Crear movimiento desde cobro de TPV
   */
  async crearDesdeTPV(
    empresaId: string,
    datos: {
      tpvId: string;
      tpvNombre: string;
      ticketId: string;
      ticketNumero: string;
      importe: number;
      metodo: 'efectivo' | 'tarjeta' | 'bizum' | 'transferencia';
      fecha: Date;
      clienteId?: string;
      clienteNombre?: string;
      clienteNif?: string;
      usuarioId: string;
      formaPagoId?: string;
      cuentaBancariaId?: string;
      cuentaBancariaNombre?: string;
      // Campos para movimientos de caja manual (entrada/salida de efectivo)
      esMovimientoCaja?: boolean;
      tipoMovimiento?: 'entrada' | 'salida';
      descripcion?: string;
    }
  ): Promise<IMovimientoBancario> {
    // Mapear método de pago
    let metodo: MetodoMovimiento;
    switch (datos.metodo) {
      case 'efectivo':
        metodo = MetodoMovimiento.EFECTIVO;
        break;
      case 'tarjeta':
        metodo = MetodoMovimiento.TARJETA;
        break;
      case 'bizum':
        metodo = MetodoMovimiento.BIZUM;
        break;
      case 'transferencia':
        metodo = MetodoMovimiento.TRANSFERENCIA;
        break;
      default:
        metodo = MetodoMovimiento.EFECTIVO;
    }

    // Obtener cuenta bancaria si no se proporciona
    let cuentaBancariaId = datos.cuentaBancariaId;
    let cuentaBancariaNombre = datos.cuentaBancariaNombre;

    if (!cuentaBancariaId) {
      const cuentaInfo = await this.obtenerCuentaDesdFormaPago(empresaId, metodo, datos.formaPagoId);
      cuentaBancariaId = cuentaInfo.cuentaBancariaId;
      cuentaBancariaNombre = cuentaInfo.cuentaBancariaNombre;
    }

    // Determinar tipo de movimiento y concepto
    let tipo: TipoMovimiento;
    let concepto: string;

    if (datos.esMovimientoCaja) {
      // Movimiento manual de caja (entrada o salida de efectivo)
      tipo = datos.tipoMovimiento === 'salida' ? TipoMovimiento.SALIDA : TipoMovimiento.ENTRADA;
      concepto = datos.descripcion || `Movimiento caja TPV - ${datos.tipoMovimiento === 'salida' ? 'Salida' : 'Entrada'}`;
    } else {
      // Cobro normal de venta
      tipo = TipoMovimiento.ENTRADA;
      concepto = `Cobro TPV - Ticket ${datos.ticketNumero}`;
    }

    return this.crear(empresaId, {
      tipo,
      origen: datos.esMovimientoCaja ? OrigenMovimiento.TPV_CAJA : OrigenMovimiento.TPV,
      metodo,
      importe: datos.importe,
      fecha: datos.fecha,
      concepto,
      cuentaBancariaId,
      cuentaBancariaNombre,
      tpvId: datos.tpvId,
      tpvNombre: datos.tpvNombre,
      ticketId: datos.ticketId || undefined,
      ticketNumero: datos.ticketNumero || undefined,
      terceroTipo: datos.clienteId ? 'cliente' : undefined,
      terceroId: datos.clienteId,
      terceroNombre: datos.clienteNombre || (datos.esMovimientoCaja ? undefined : 'Cliente Contado'),
      terceroNif: datos.clienteNif,
      documentoOrigenTipo: datos.esMovimientoCaja ? 'Mov.Caja' : 'Ticket',
      documentoOrigenId: datos.ticketId || undefined,
      documentoOrigenNumero: datos.ticketNumero || undefined,
      observaciones: datos.descripcion,
      usuarioId: datos.usuarioId,
    });
  }

  /**
   * Listar movimientos con filtros y paginación
   */
  async listar(
    empresaId: string,
    filtros: IFiltrosMovimientos = {},
    paginacion: { pagina?: number; limite?: number; ordenarPor?: string; orden?: 'asc' | 'desc' } = {}
  ): Promise<{
    movimientos: IMovimientoBancario[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);

    const query: any = { activo: true };

    // Aplicar filtros
    if (filtros.tipo) query.tipo = filtros.tipo;
    if (filtros.origen) {
      query.origen = Array.isArray(filtros.origen) ? { $in: filtros.origen } : filtros.origen;
    }
    if (filtros.metodo) query.metodo = filtros.metodo;
    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.cuentaBancariaId) query.cuentaBancariaId = new mongoose.Types.ObjectId(filtros.cuentaBancariaId);
    if (filtros.terceroId) query.terceroId = new mongoose.Types.ObjectId(filtros.terceroId);
    if (filtros.tpvId) query.tpvId = new mongoose.Types.ObjectId(filtros.tpvId);
    if (filtros.conciliado !== undefined) query.conciliado = filtros.conciliado;

    // Filtro de fechas
    if (filtros.fechaDesde || filtros.fechaHasta) {
      query.fecha = {};
      if (filtros.fechaDesde) query.fecha.$gte = filtros.fechaDesde;
      if (filtros.fechaHasta) query.fecha.$lte = filtros.fechaHasta;
    }

    // Filtro de importes
    if (filtros.importeMin !== undefined || filtros.importeMax !== undefined) {
      query.importe = {};
      if (filtros.importeMin !== undefined) query.importe.$gte = filtros.importeMin;
      if (filtros.importeMax !== undefined) query.importe.$lte = filtros.importeMax;
    }

    // Búsqueda por texto
    if (filtros.busqueda) {
      const busquedaRegex = new RegExp(filtros.busqueda, 'i');
      query.$or = [
        { numero: busquedaRegex },
        { concepto: busquedaRegex },
        { terceroNombre: busquedaRegex },
        { ticketNumero: busquedaRegex },
        { documentoOrigenNumero: busquedaRegex },
      ];
    }

    // Paginación
    const pagina = paginacion.pagina || 1;
    const limite = paginacion.limite || 50;
    const skip = (pagina - 1) * limite;

    // Ordenación
    const ordenarPor = paginacion.ordenarPor || 'fecha';
    const orden = paginacion.orden === 'asc' ? 1 : -1;

    const [movimientos, total] = await Promise.all([
      MovimientoBancario.find(query)
        .sort({ [ordenarPor]: orden })
        .skip(skip)
        .limit(limite)
        .lean(),
      MovimientoBancario.countDocuments(query),
    ]);

    return {
      movimientos: movimientos as IMovimientoBancario[],
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  /**
   * Obtener un movimiento por ID
   */
  async obtenerPorId(empresaId: string, movimientoId: string): Promise<IMovimientoBancario | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);

    return MovimientoBancario.findOne({
      _id: new mongoose.Types.ObjectId(movimientoId),
      activo: true,
    }).lean() as Promise<IMovimientoBancario | null>;
  }

  /**
   * Anular un movimiento
   */
  async anular(
    empresaId: string,
    movimientoId: string,
    usuarioId: string,
    motivo: string
  ): Promise<IMovimientoBancario | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);

    return MovimientoBancario.findByIdAndUpdate(
      movimientoId,
      {
        estado: EstadoMovimiento.ANULADO,
        anuladoPor: new mongoose.Types.ObjectId(usuarioId),
        fechaAnulacion: new Date(),
        motivoAnulacion: motivo,
      },
      { new: true }
    ).lean() as Promise<IMovimientoBancario | null>;
  }

  /**
   * Marcar como conciliado
   */
  async marcarConciliado(
    empresaId: string,
    movimientoId: string,
    movimientoExtractoId?: string
  ): Promise<IMovimientoBancario | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);

    return MovimientoBancario.findByIdAndUpdate(
      movimientoId,
      {
        conciliado: true,
        estado: EstadoMovimiento.CONCILIADO,
        fechaConciliacion: new Date(),
        movimientoExtractoId: movimientoExtractoId ? new mongoose.Types.ObjectId(movimientoExtractoId) : undefined,
      },
      { new: true }
    ).lean() as Promise<IMovimientoBancario | null>;
  }

  /**
   * Obtener estadísticas de movimientos
   */
  async obtenerEstadisticas(
    empresaId: string,
    fechaDesde?: Date,
    fechaHasta?: Date
  ): Promise<{
    totalEntradas: number;
    totalSalidas: number;
    saldoNeto: number;
    porMetodo: { metodo: string; entradas: number; salidas: number }[];
    porOrigen: { origen: string; cantidad: number; importe: number }[];
    movimientosPorDia: { fecha: string; entradas: number; salidas: number }[];
  }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);

    const matchFecha: any = { activo: true, estado: { $ne: EstadoMovimiento.ANULADO } };
    if (fechaDesde || fechaHasta) {
      matchFecha.fecha = {};
      if (fechaDesde) matchFecha.fecha.$gte = fechaDesde;
      if (fechaHasta) matchFecha.fecha.$lte = fechaHasta;
    }

    // Totales por tipo
    const totales = await MovimientoBancario.aggregate([
      { $match: matchFecha },
      {
        $group: {
          _id: '$tipo',
          total: { $sum: '$importe' },
        },
      },
    ]);

    let totalEntradas = 0;
    let totalSalidas = 0;
    totales.forEach((t) => {
      if (t._id === TipoMovimiento.ENTRADA) totalEntradas = t.total;
      if (t._id === TipoMovimiento.SALIDA) totalSalidas = t.total;
    });

    // Por método de pago
    const porMetodo = await MovimientoBancario.aggregate([
      { $match: matchFecha },
      {
        $group: {
          _id: { metodo: '$metodo', tipo: '$tipo' },
          total: { $sum: '$importe' },
        },
      },
    ]);

    const metodoMap = new Map<string, { entradas: number; salidas: number }>();
    porMetodo.forEach((m) => {
      const key = m._id.metodo;
      if (!metodoMap.has(key)) metodoMap.set(key, { entradas: 0, salidas: 0 });
      const data = metodoMap.get(key)!;
      if (m._id.tipo === TipoMovimiento.ENTRADA) data.entradas = m.total;
      if (m._id.tipo === TipoMovimiento.SALIDA) data.salidas = m.total;
    });

    // Por origen
    const porOrigen = await MovimientoBancario.aggregate([
      { $match: matchFecha },
      {
        $group: {
          _id: '$origen',
          cantidad: { $sum: 1 },
          importe: { $sum: '$importe' },
        },
      },
      { $sort: { importe: -1 } },
    ]);

    // Por día (últimos 30 días)
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const porDia = await MovimientoBancario.aggregate([
      {
        $match: {
          ...matchFecha,
          fecha: { $gte: hace30Dias },
        },
      },
      {
        $group: {
          _id: {
            fecha: { $dateToString: { format: '%Y-%m-%d', date: '$fecha' } },
            tipo: '$tipo',
          },
          total: { $sum: '$importe' },
        },
      },
      { $sort: { '_id.fecha': 1 } },
    ]);

    const diaMap = new Map<string, { entradas: number; salidas: number }>();
    porDia.forEach((d) => {
      const key = d._id.fecha;
      if (!diaMap.has(key)) diaMap.set(key, { entradas: 0, salidas: 0 });
      const data = diaMap.get(key)!;
      if (d._id.tipo === TipoMovimiento.ENTRADA) data.entradas = d.total;
      if (d._id.tipo === TipoMovimiento.SALIDA) data.salidas = d.total;
    });

    return {
      totalEntradas,
      totalSalidas,
      saldoNeto: totalEntradas - totalSalidas,
      porMetodo: Array.from(metodoMap.entries()).map(([metodo, data]) => ({
        metodo,
        ...data,
      })),
      porOrigen: porOrigen.map((o) => ({
        origen: o._id,
        cantidad: o.cantidad,
        importe: o.importe,
      })),
      movimientosPorDia: Array.from(diaMap.entries()).map(([fecha, data]) => ({
        fecha,
        ...data,
      })),
    };
  }

  /**
   * Obtener movimientos de un TPV específico
   */
  async listarPorTPV(
    empresaId: string,
    tpvId: string,
    fechaDesde?: Date,
    fechaHasta?: Date
  ): Promise<IMovimientoBancario[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);

    const query: any = {
      activo: true,
      tpvId: new mongoose.Types.ObjectId(tpvId),
    };

    if (fechaDesde || fechaHasta) {
      query.fecha = {};
      if (fechaDesde) query.fecha.$gte = fechaDesde;
      if (fechaHasta) query.fecha.$lte = fechaHasta;
    }

    return MovimientoBancario.find(query)
      .sort({ fecha: -1 })
      .lean() as Promise<IMovimientoBancario[]>;
  }
}

export const movimientosBancariosService = new MovimientosBancariosService();
