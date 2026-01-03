/**
 * Servicio de Contabilidad
 * Gestión de cuentas contables, asientos y generación automática
 */

import mongoose from 'mongoose';
import { IDatabaseConfig } from '../empresa/Empresa';
import {
  getCuentaContableModel,
  getAsientoContableModel,
  getConfigContableModel,
  getClienteModel,
  getProveedorModel,
} from '../../utils/dynamic-models.helper';
import { TipoCuenta, NaturalezaCuenta, TipoTercero, ICuentaContable } from './models/PlanCuentas';
import { OrigenAsiento, EstadoAsiento, IAsientoContable, ILineaAsiento } from './models/AsientoContable';
import { IConfigContable } from './models/ConfigContable';
import { inicializarPlanCuentas } from './seed/pgc-2007.seed';

// Tipos para DTOs
export interface ICrearCuentaDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  cuentaPadreId?: string;
  terceroId?: string;
  terceroTipo?: TipoTercero;
}

export interface ICrearAsientoDTO {
  fecha: Date;
  concepto: string;
  lineas: Array<{
    cuentaCodigo: string;
    debe: number;
    haber: number;
    concepto?: string;
    terceroId?: string;
    documentoRef?: string;
  }>;
  origenTipo?: OrigenAsiento;
  origenId?: string;
  origenNumero?: string;
}

export interface IFiltrosAsientos {
  fechaDesde?: Date;
  fechaHasta?: Date;
  ejercicio?: number;
  periodo?: number;
  cuentaCodigo?: string;
  origenTipo?: OrigenAsiento;
  estado?: EstadoAsiento;
  concepto?: string;
  pagina?: number;
  limite?: number;
}

export interface IFiltrosCuentas {
  nivel?: number;
  tipo?: TipoCuenta;
  esMovimiento?: boolean;
  activa?: boolean;
  busqueda?: string;
  codigoPadre?: string;
}

class ContabilidadService {
  /**
   * Obtener modelos dinámicos
   */
  private async getModels(empresaId: string, dbConfig: IDatabaseConfig) {
    const [CuentaContable, AsientoContable, ConfigContable] = await Promise.all([
      getCuentaContableModel(empresaId, dbConfig),
      getAsientoContableModel(empresaId, dbConfig),
      getConfigContableModel(empresaId, dbConfig),
    ]);
    return { CuentaContable, AsientoContable, ConfigContable };
  }

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * Obtener configuración contable de la empresa
   */
  async getConfig(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IConfigContable> {
    const { ConfigContable } = await this.getModels(empresaId, dbConfig);

    let config = await ConfigContable.findOne();
    if (!config) {
      // Crear configuración por defecto
      config = await ConfigContable.create({
        ejercicioActivo: new Date().getFullYear(),
        proximoNumeroAsiento: 1,
        generarAsientosAutomaticos: true,
      });
    }

    return config;
  }

  /**
   * Actualizar configuración contable
   */
  async actualizarConfig(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    datos: Partial<IConfigContable>,
    usuarioId: string
  ): Promise<IConfigContable> {
    const { ConfigContable } = await this.getModels(empresaId, dbConfig);

    const config = await ConfigContable.findOneAndUpdate(
      {},
      { ...datos, modificadoPor: usuarioId, fechaModificacion: new Date() },
      { new: true, upsert: true }
    );

    return config;
  }

  /**
   * Inicializar plan de cuentas PGC 2007
   */
  async inicializarPlanCuentas(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    usuarioId: string
  ): Promise<{ cuentasCreadas: number; errores: string[] }> {
    const { CuentaContable } = await this.getModels(empresaId, dbConfig);

    return inicializarPlanCuentas(CuentaContable, usuarioId);
  }

  // ============================================
  // CUENTAS CONTABLES
  // ============================================

  /**
   * Listar cuentas contables
   */
  async listarCuentas(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    filtros: IFiltrosCuentas = {}
  ): Promise<ICuentaContable[]> {
    const { CuentaContable } = await this.getModels(empresaId, dbConfig);

    const query: any = {};

    if (filtros.nivel !== undefined) {
      query.nivel = filtros.nivel;
    }

    if (filtros.tipo) {
      query.tipo = filtros.tipo;
    }

    if (filtros.esMovimiento !== undefined) {
      query.esMovimiento = filtros.esMovimiento;
    }

    if (filtros.activa !== undefined) {
      query.activa = filtros.activa;
    }

    if (filtros.codigoPadre) {
      query.codigoPadre = filtros.codigoPadre;
    }

    if (filtros.busqueda) {
      query.$or = [
        { codigo: { $regex: filtros.busqueda, $options: 'i' } },
        { nombre: { $regex: filtros.busqueda, $options: 'i' } },
      ];
    }

    return CuentaContable.find(query).sort({ codigo: 1 });
  }

  /**
   * Obtener cuenta por código
   */
  async obtenerCuentaPorCodigo(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    codigo: string
  ): Promise<ICuentaContable | null> {
    const { CuentaContable } = await this.getModels(empresaId, dbConfig);
    return CuentaContable.findOne({ codigo });
  }

  /**
   * Obtener cuenta por ID
   */
  async obtenerCuenta(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    cuentaId: string
  ): Promise<ICuentaContable | null> {
    const { CuentaContable } = await this.getModels(empresaId, dbConfig);
    return CuentaContable.findById(cuentaId);
  }

  /**
   * Crear subcuenta
   */
  async crearCuenta(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    datos: ICrearCuentaDTO,
    usuarioId: string
  ): Promise<ICuentaContable> {
    const { CuentaContable } = await this.getModels(empresaId, dbConfig);

    // Verificar que no existe
    const existe = await CuentaContable.findOne({ codigo: datos.codigo });
    if (existe) {
      throw new Error(`Ya existe una cuenta con el código ${datos.codigo}`);
    }

    // Buscar cuenta padre
    let cuentaPadre;
    let cuentaPadreId;
    const codigoPadre = datos.codigo.slice(0, -1);

    if (codigoPadre) {
      cuentaPadre = await CuentaContable.findOne({ codigo: codigoPadre });
      if (cuentaPadre) {
        cuentaPadreId = cuentaPadre._id;
      }
    }

    // Determinar tipo y naturaleza según código
    const { tipo, naturaleza } = this.determinarTipoNaturaleza(datos.codigo);

    // Determinar nivel
    let nivel = datos.codigo.length;
    if (nivel > 4) {
      nivel = 4 + Math.floor((datos.codigo.length - 4) / 2);
    }

    // Obtener datos del tercero si aplica
    let terceroNombre;
    let terceroNif;
    if (datos.terceroId && datos.terceroTipo) {
      const terceroData = await this.obtenerDatosTercero(
        empresaId,
        dbConfig,
        datos.terceroId,
        datos.terceroTipo
      );
      terceroNombre = terceroData?.nombre;
      terceroNif = terceroData?.nif;
    }

    const cuenta = await CuentaContable.create({
      codigo: datos.codigo,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      nivel,
      tipo,
      naturaleza,
      esMovimiento: nivel >= 3,
      esSistema: false,
      activa: true,
      cuentaPadreId,
      codigoPadre,
      terceroId: datos.terceroId ? new mongoose.Types.ObjectId(datos.terceroId) : undefined,
      terceroTipo: datos.terceroTipo,
      terceroNombre,
      terceroNif,
      saldoDebe: 0,
      saldoHaber: 0,
      saldo: 0,
      numeroMovimientos: 0,
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
    });

    return cuenta;
  }

  /**
   * Actualizar cuenta
   */
  async actualizarCuenta(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    cuentaId: string,
    datos: Partial<ICrearCuentaDTO>,
    usuarioId: string
  ): Promise<ICuentaContable> {
    const { CuentaContable } = await this.getModels(empresaId, dbConfig);

    const cuenta = await CuentaContable.findById(cuentaId);
    if (!cuenta) {
      throw new Error('Cuenta no encontrada');
    }

    if (cuenta.esSistema) {
      throw new Error('No se puede modificar una cuenta del sistema');
    }

    const actualizacion: any = {
      modificadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaModificacion: new Date(),
    };

    if (datos.nombre) actualizacion.nombre = datos.nombre;
    if (datos.descripcion !== undefined) actualizacion.descripcion = datos.descripcion;

    return CuentaContable.findByIdAndUpdate(cuentaId, actualizacion, { new: true });
  }

  /**
   * Desactivar cuenta
   */
  async desactivarCuenta(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    cuentaId: string,
    usuarioId: string
  ): Promise<ICuentaContable> {
    const { CuentaContable } = await this.getModels(empresaId, dbConfig);

    const cuenta = await CuentaContable.findById(cuentaId);
    if (!cuenta) {
      throw new Error('Cuenta no encontrada');
    }

    if (cuenta.esSistema) {
      throw new Error('No se puede desactivar una cuenta del sistema');
    }

    if (cuenta.numeroMovimientos > 0) {
      throw new Error('No se puede desactivar una cuenta con movimientos');
    }

    return CuentaContable.findByIdAndUpdate(
      cuentaId,
      {
        activa: false,
        modificadoPor: new mongoose.Types.ObjectId(usuarioId),
        fechaModificacion: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Obtener o crear subcuenta de tercero
   */
  async obtenerOCrearSubcuentaTercero(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    terceroId: string,
    terceroTipo: TipoTercero,
    usuarioId: string
  ): Promise<ICuentaContable> {
    const { CuentaContable, ConfigContable } = await this.getModels(empresaId, dbConfig);

    // Buscar si ya existe
    let cuenta = await CuentaContable.findOne({
      terceroId: new mongoose.Types.ObjectId(terceroId),
      terceroTipo,
    });

    if (cuenta) {
      return cuenta;
    }

    // Obtener configuración
    const config = await this.getConfig(empresaId, dbConfig);

    // Determinar prefijo y longitud
    const prefijo = terceroTipo === TipoTercero.CLIENTE
      ? config.prefijoCuentaCliente || '430'
      : config.prefijoCuentaProveedor || '400';
    const longitud = terceroTipo === TipoTercero.CLIENTE
      ? config.longitudSubcuentaCliente || 7
      : config.longitudSubcuentaProveedor || 7;

    // Obtener último número usado
    const ultimaCuenta = await CuentaContable.findOne({
      codigo: new RegExp(`^${prefijo}\\d+$`),
    }).sort({ codigo: -1 });

    let siguienteNumero = 1;
    if (ultimaCuenta) {
      const numeroActual = parseInt(ultimaCuenta.codigo.slice(prefijo.length), 10);
      siguienteNumero = numeroActual + 1;
    }

    // Generar código
    const sufijo = siguienteNumero.toString().padStart(longitud - prefijo.length, '0');
    const codigo = `${prefijo}${sufijo}`;

    // Obtener datos del tercero
    const terceroData = await this.obtenerDatosTercero(empresaId, dbConfig, terceroId, terceroTipo);
    if (!terceroData) {
      throw new Error('Tercero no encontrado');
    }

    // Crear subcuenta
    cuenta = await this.crearCuenta(
      empresaId,
      dbConfig,
      {
        codigo,
        nombre: terceroData.nombre,
        terceroId,
        terceroTipo,
      },
      usuarioId
    );

    return cuenta;
  }

  // ============================================
  // ASIENTOS CONTABLES
  // ============================================

  /**
   * Listar asientos
   */
  async listarAsientos(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    filtros: IFiltrosAsientos = {}
  ): Promise<{ asientos: IAsientoContable[]; total: number; paginas: number }> {
    const { AsientoContable } = await this.getModels(empresaId, dbConfig);

    const query: any = {};

    if (filtros.ejercicio) {
      query.ejercicio = filtros.ejercicio;
    }

    if (filtros.periodo) {
      query.periodo = filtros.periodo;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      query.fecha = {};
      if (filtros.fechaDesde) query.fecha.$gte = filtros.fechaDesde;
      if (filtros.fechaHasta) query.fecha.$lte = filtros.fechaHasta;
    }

    if (filtros.cuentaCodigo) {
      query['lineas.cuentaCodigo'] = { $regex: `^${filtros.cuentaCodigo}` };
    }

    if (filtros.origenTipo) {
      query.origenTipo = filtros.origenTipo;
    }

    if (filtros.estado) {
      query.estado = filtros.estado;
    }

    if (filtros.concepto) {
      query.concepto = { $regex: filtros.concepto, $options: 'i' };
    }

    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 50;
    const skip = (pagina - 1) * limite;

    const [asientos, total] = await Promise.all([
      AsientoContable.find(query)
        .sort({ fecha: -1, numero: -1 })
        .skip(skip)
        .limit(limite),
      AsientoContable.countDocuments(query),
    ]);

    return {
      asientos,
      total,
      paginas: Math.ceil(total / limite),
    };
  }

  /**
   * Obtener asiento por ID
   */
  async obtenerAsiento(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    asientoId: string
  ): Promise<IAsientoContable | null> {
    const { AsientoContable } = await this.getModels(empresaId, dbConfig);
    return AsientoContable.findById(asientoId);
  }

  /**
   * Crear asiento manual
   */
  async crearAsiento(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    datos: ICrearAsientoDTO,
    usuarioId: string
  ): Promise<IAsientoContable> {
    const { AsientoContable, CuentaContable, ConfigContable } = await this.getModels(
      empresaId,
      dbConfig
    );

    // Obtener configuración
    const config = await this.getConfig(empresaId, dbConfig);

    // Verificar período cerrado
    const periodo = datos.fecha.getMonth() + 1;
    const ejercicio = datos.fecha.getFullYear();

    if (config.bloquearPeriodosCerrados) {
      const ejercicioData = config.ejercicios.find((e: any) => e.ejercicio === ejercicio);
      if (ejercicioData?.cerrado) {
        throw new Error(`El ejercicio ${ejercicio} está cerrado`);
      }
      const periodoData = ejercicioData?.periodos.find((p: any) => p.mes === periodo);
      if (periodoData?.cerrado) {
        throw new Error(`El período ${periodo}/${ejercicio} está cerrado`);
      }
    }

    // Procesar líneas
    const lineas: ILineaAsiento[] = [];
    for (const linea of datos.lineas) {
      const cuenta = await CuentaContable.findOne({ codigo: linea.cuentaCodigo });
      if (!cuenta) {
        throw new Error(`Cuenta ${linea.cuentaCodigo} no encontrada`);
      }
      if (!cuenta.esMovimiento) {
        throw new Error(`La cuenta ${linea.cuentaCodigo} no admite movimientos`);
      }

      lineas.push({
        orden: lineas.length + 1,
        cuentaId: cuenta._id,
        cuentaCodigo: cuenta.codigo,
        cuentaNombre: cuenta.nombre,
        debe: linea.debe || 0,
        haber: linea.haber || 0,
        concepto: linea.concepto,
        terceroId: linea.terceroId ? new mongoose.Types.ObjectId(linea.terceroId) : undefined,
        documentoRef: linea.documentoRef,
      });
    }

    // Calcular totales
    const totalDebe = lineas.reduce((sum, l) => sum + l.debe, 0);
    const totalHaber = lineas.reduce((sum, l) => sum + l.haber, 0);
    const cuadrado = Math.abs(totalDebe - totalHaber) < 0.01;

    if (!cuadrado && !config.permitirAsientosDescuadrados) {
      throw new Error(`El asiento no cuadra. Debe: ${totalDebe}, Haber: ${totalHaber}`);
    }

    // Obtener siguiente número
    const numero = await this.getSiguienteNumeroAsiento(empresaId, dbConfig, ejercicio);

    // Crear asiento
    const asiento = await AsientoContable.create({
      numero,
      fecha: datos.fecha,
      periodo,
      ejercicio,
      concepto: datos.concepto,
      lineas,
      totalDebe,
      totalHaber,
      cuadrado,
      diferencia: totalDebe - totalHaber,
      origenTipo: datos.origenTipo || OrigenAsiento.MANUAL,
      origenId: datos.origenId ? new mongoose.Types.ObjectId(datos.origenId) : undefined,
      origenNumero: datos.origenNumero,
      estado: EstadoAsiento.CONTABILIZADO,
      bloqueado: false,
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
      contabilizadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaContabilizacion: new Date(),
    });

    // Actualizar saldos de cuentas
    await this.actualizarSaldosCuentas(CuentaContable, lineas);

    return asiento;
  }

  /**
   * Anular asiento (crea contraasiento)
   */
  async anularAsiento(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    asientoId: string,
    motivo: string,
    usuarioId: string
  ): Promise<IAsientoContable> {
    const { AsientoContable, CuentaContable } = await this.getModels(empresaId, dbConfig);

    const asiento = await AsientoContable.findById(asientoId);
    if (!asiento) {
      throw new Error('Asiento no encontrado');
    }

    if (asiento.estado === EstadoAsiento.ANULADO) {
      throw new Error('El asiento ya está anulado');
    }

    if (asiento.asientoAnulacionId) {
      throw new Error('El asiento ya tiene un contraasiento');
    }

    // Crear contraasiento (invirtiendo debe/haber)
    const lineasContra = asiento.lineas.map((l: ILineaAsiento, i: number) => ({
      ...l,
      orden: i + 1,
      debe: l.haber,
      haber: l.debe,
      concepto: `Anulación: ${l.concepto || asiento.concepto}`,
    }));

    const numero = await this.getSiguienteNumeroAsiento(
      empresaId,
      dbConfig,
      asiento.ejercicio
    );

    const contraAsiento = await AsientoContable.create({
      numero,
      fecha: new Date(),
      periodo: new Date().getMonth() + 1,
      ejercicio: asiento.ejercicio,
      concepto: `Anulación asiento ${asiento.numero}: ${motivo}`,
      lineas: lineasContra,
      totalDebe: asiento.totalHaber,
      totalHaber: asiento.totalDebe,
      cuadrado: true,
      diferencia: 0,
      origenTipo: OrigenAsiento.AJUSTE,
      asientoAnuladoId: asiento._id,
      estado: EstadoAsiento.CONTABILIZADO,
      bloqueado: true,
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
      contabilizadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaContabilizacion: new Date(),
    });

    // Actualizar asiento original
    await AsientoContable.findByIdAndUpdate(asientoId, {
      estado: EstadoAsiento.ANULADO,
      asientoAnulacionId: contraAsiento._id,
      motivoAnulacion: motivo,
      anuladoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaAnulacion: new Date(),
    });

    // Actualizar saldos de cuentas
    await this.actualizarSaldosCuentas(CuentaContable, lineasContra);

    return contraAsiento;
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  /**
   * Obtener siguiente número de asiento
   */
  private async getSiguienteNumeroAsiento(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    ejercicio: number
  ): Promise<number> {
    const { AsientoContable, ConfigContable } = await this.getModels(empresaId, dbConfig);

    const config = await ConfigContable.findOne();

    if (config?.reiniciarNumeracionAnual) {
      const ultimo = await AsientoContable.findOne({ ejercicio }).sort({ numero: -1 });
      return (ultimo?.numero || 0) + 1;
    }

    // Usar contador global
    const resultado = await ConfigContable.findOneAndUpdate(
      {},
      { $inc: { proximoNumeroAsiento: 1 } },
      { new: false }
    );

    return resultado?.proximoNumeroAsiento || 1;
  }

  /**
   * Actualizar saldos de cuentas afectadas
   */
  private async actualizarSaldosCuentas(
    CuentaContable: any,
    lineas: ILineaAsiento[]
  ): Promise<void> {
    for (const linea of lineas) {
      await CuentaContable.findByIdAndUpdate(linea.cuentaId, {
        $inc: {
          saldoDebe: linea.debe,
          saldoHaber: linea.haber,
          numeroMovimientos: 1,
        },
        ultimoMovimiento: new Date(),
      });

      // Recalcular saldo
      const cuenta = await CuentaContable.findById(linea.cuentaId);
      if (cuenta) {
        const saldo = cuenta.naturaleza === NaturalezaCuenta.DEUDORA
          ? cuenta.saldoDebe - cuenta.saldoHaber
          : cuenta.saldoHaber - cuenta.saldoDebe;
        await CuentaContable.findByIdAndUpdate(linea.cuentaId, { saldo });
      }
    }
  }

  /**
   * Determinar tipo y naturaleza según código PGC
   */
  private determinarTipoNaturaleza(codigo: string): {
    tipo: TipoCuenta;
    naturaleza: NaturalezaCuenta;
  } {
    const grupo = parseInt(codigo.charAt(0), 10);

    switch (grupo) {
      case 1:
        return { tipo: TipoCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.ACREEDORA };
      case 2:
      case 3:
        return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
      case 4:
        if (codigo.startsWith('40') || codigo.startsWith('41')) {
          return { tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA };
        }
        if (codigo.startsWith('43') || codigo.startsWith('44')) {
          return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
        }
        if (codigo.startsWith('475') || codigo.startsWith('476') || codigo.startsWith('477')) {
          return { tipo: TipoCuenta.PASIVO, naturaleza: NaturalezaCuenta.ACREEDORA };
        }
        return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
      case 5:
        return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
      case 6:
        return { tipo: TipoCuenta.GASTO, naturaleza: NaturalezaCuenta.DEUDORA };
      case 7:
        return { tipo: TipoCuenta.INGRESO, naturaleza: NaturalezaCuenta.ACREEDORA };
      default:
        return { tipo: TipoCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEUDORA };
    }
  }

  /**
   * Obtener datos de un tercero (cliente o proveedor)
   */
  private async obtenerDatosTercero(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    terceroId: string,
    terceroTipo: TipoTercero
  ): Promise<{ nombre: string; nif: string } | null> {
    if (terceroTipo === TipoTercero.CLIENTE) {
      const Cliente = await getClienteModel(empresaId, dbConfig);
      const cliente = await Cliente.findById(terceroId);
      return cliente ? { nombre: cliente.nombre, nif: cliente.nif || '' } : null;
    } else {
      const Proveedor = await getProveedorModel(empresaId, dbConfig);
      const proveedor = await Proveedor.findById(terceroId);
      return proveedor ? { nombre: proveedor.nombre, nif: proveedor.nif || '' } : null;
    }
  }
}

export const contabilidadService = new ContabilidadService();
