/**
 * Generador de Asientos desde Cobros y Pagos
 * Genera asientos contables automáticos desde movimientos de tesorería
 */

import mongoose from 'mongoose';
import { IDatabaseConfig } from '../../empresa/Empresa';
import {
  getCuentaContableModel,
  getAsientoContableModel,
  getConfigContableModel,
} from '../../../utils/dynamic-models.helper';
import { TipoTercero, NaturalezaCuenta } from '../models/PlanCuentas';
import { OrigenAsiento, EstadoAsiento, ILineaAsiento } from '../models/AsientoContable';
import { contabilidadService } from '../contabilidad.service';

/**
 * Datos de cobro para generar asiento
 */
export interface IDatosCobro {
  cobroId: string;
  referencia?: string;
  fecha: Date;
  importe: number;
  // Cliente
  clienteId: string;
  clienteNombre: string;
  clienteNif?: string;
  // Medio de pago
  medioPago: 'efectivo' | 'banco' | 'tarjeta' | 'transferencia' | 'cheque' | 'otro';
  cuentaBancariaId?: string;
  cuentaBancariaNombre?: string;
  // Factura asociada (opcional)
  facturaId?: string;
  facturaCodigo?: string;
  // Concepto
  concepto?: string;
}

/**
 * Datos de pago para generar asiento
 */
export interface IDatosPago {
  pagoId: string;
  referencia?: string;
  fecha: Date;
  importe: number;
  // Proveedor
  proveedorId: string;
  proveedorNombre: string;
  proveedorNif?: string;
  // Medio de pago
  medioPago: 'efectivo' | 'banco' | 'tarjeta' | 'transferencia' | 'cheque' | 'otro';
  cuentaBancariaId?: string;
  cuentaBancariaNombre?: string;
  // Factura asociada (opcional)
  facturaId?: string;
  facturaCodigo?: string;
  // Concepto
  concepto?: string;
}

class AsientoCobroGenerator {
  /**
   * Generar asiento desde cobro
   *
   * Estructura del asiento:
   * DEBE:
   *   57XXXXXX (Caja/Banco)     Importe cobrado
   * HABER:
   *   430XXXXX (Cliente)        Importe cobrado
   */
  async generarDesdeCobro(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    datos: IDatosCobro,
    usuarioId: string
  ): Promise<any> {
    const [CuentaContable, AsientoContable, ConfigContable] = await Promise.all([
      getCuentaContableModel(empresaId, dbConfig),
      getAsientoContableModel(empresaId, dbConfig),
      getConfigContableModel(empresaId, dbConfig),
    ]);

    // Obtener configuración
    const config = await ConfigContable.findOne();
    if (!config?.generarAsientosAutomaticos) {
      console.log('[Contabilidad] Generación automática desactivada');
      return null;
    }

    // Verificar si ya existe asiento para este cobro
    const asientoExistente = await AsientoContable.findOne({
      origenTipo: OrigenAsiento.COBRO,
      origenId: new mongoose.Types.ObjectId(datos.cobroId),
    });

    if (asientoExistente) {
      console.log('[Contabilidad] Ya existe asiento para cobro', datos.referencia);
      return asientoExistente;
    }

    // Obtener cuenta de tesorería según medio de pago
    const cuentaTesoreria = await this.getCuentaTesoreria(
      CuentaContable,
      config,
      datos.medioPago,
      datos.cuentaBancariaId
    );

    if (!cuentaTesoreria) {
      throw new Error('No se encontró cuenta contable para el medio de pago');
    }

    // Obtener o crear subcuenta de cliente
    const cuentaCliente = await contabilidadService.obtenerOCrearSubcuentaTercero(
      empresaId,
      dbConfig,
      datos.clienteId,
      TipoTercero.CLIENTE,
      usuarioId
    );

    // Preparar líneas del asiento
    const lineas: ILineaAsiento[] = [];
    const conceptoBase = datos.concepto ||
      (datos.facturaCodigo ? `Cobro Fra. ${datos.facturaCodigo}` : `Cobro cliente ${datos.clienteNombre}`);

    // 1. DEBE: Caja/Banco
    lineas.push({
      orden: 1,
      cuentaId: cuentaTesoreria._id,
      cuentaCodigo: cuentaTesoreria.codigo,
      cuentaNombre: cuentaTesoreria.nombre,
      debe: datos.importe,
      haber: 0,
      concepto: conceptoBase,
      documentoRef: datos.referencia || datos.facturaCodigo,
    });

    // 2. HABER: Cliente
    lineas.push({
      orden: 2,
      cuentaId: cuentaCliente._id,
      cuentaCodigo: cuentaCliente.codigo,
      cuentaNombre: cuentaCliente.nombre,
      debe: 0,
      haber: datos.importe,
      concepto: conceptoBase,
      terceroId: new mongoose.Types.ObjectId(datos.clienteId),
      terceroNombre: datos.clienteNombre,
      terceroNif: datos.clienteNif,
      documentoRef: datos.referencia || datos.facturaCodigo,
    });

    // Obtener número de asiento
    const ejercicio = datos.fecha.getFullYear();
    const numero = await this.getSiguienteNumeroAsiento(AsientoContable, ConfigContable, ejercicio);

    // Crear asiento
    const asiento = await AsientoContable.create({
      numero,
      fecha: datos.fecha,
      periodo: datos.fecha.getMonth() + 1,
      ejercicio,
      concepto: conceptoBase,
      lineas,
      totalDebe: datos.importe,
      totalHaber: datos.importe,
      cuadrado: true,
      diferencia: 0,
      origenTipo: OrigenAsiento.COBRO,
      origenId: new mongoose.Types.ObjectId(datos.cobroId),
      origenNumero: datos.referencia,
      estado: EstadoAsiento.CONTABILIZADO,
      bloqueado: true,
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
      contabilizadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaContabilizacion: new Date(),
    });

    // Actualizar saldos de cuentas
    await this.actualizarSaldosCuentas(CuentaContable, lineas);

    console.log('[Contabilidad] Asiento cobro creado:', asiento.numero);

    return asiento;
  }

  /**
   * Generar asiento desde pago
   *
   * Estructura del asiento:
   * DEBE:
   *   400XXXXX (Proveedor)      Importe pagado
   * HABER:
   *   57XXXXXX (Caja/Banco)     Importe pagado
   */
  async generarDesdePago(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    datos: IDatosPago,
    usuarioId: string
  ): Promise<any> {
    const [CuentaContable, AsientoContable, ConfigContable] = await Promise.all([
      getCuentaContableModel(empresaId, dbConfig),
      getAsientoContableModel(empresaId, dbConfig),
      getConfigContableModel(empresaId, dbConfig),
    ]);

    // Obtener configuración
    const config = await ConfigContable.findOne();
    if (!config?.generarAsientosAutomaticos) {
      console.log('[Contabilidad] Generación automática desactivada');
      return null;
    }

    // Verificar si ya existe asiento para este pago
    const asientoExistente = await AsientoContable.findOne({
      origenTipo: OrigenAsiento.PAGO,
      origenId: new mongoose.Types.ObjectId(datos.pagoId),
    });

    if (asientoExistente) {
      console.log('[Contabilidad] Ya existe asiento para pago', datos.referencia);
      return asientoExistente;
    }

    // Obtener cuenta de tesorería según medio de pago
    const cuentaTesoreria = await this.getCuentaTesoreria(
      CuentaContable,
      config,
      datos.medioPago,
      datos.cuentaBancariaId
    );

    if (!cuentaTesoreria) {
      throw new Error('No se encontró cuenta contable para el medio de pago');
    }

    // Obtener o crear subcuenta de proveedor
    const cuentaProveedor = await contabilidadService.obtenerOCrearSubcuentaTercero(
      empresaId,
      dbConfig,
      datos.proveedorId,
      TipoTercero.PROVEEDOR,
      usuarioId
    );

    // Preparar líneas del asiento
    const lineas: ILineaAsiento[] = [];
    const conceptoBase = datos.concepto ||
      (datos.facturaCodigo ? `Pago Fra. ${datos.facturaCodigo}` : `Pago proveedor ${datos.proveedorNombre}`);

    // 1. DEBE: Proveedor
    lineas.push({
      orden: 1,
      cuentaId: cuentaProveedor._id,
      cuentaCodigo: cuentaProveedor.codigo,
      cuentaNombre: cuentaProveedor.nombre,
      debe: datos.importe,
      haber: 0,
      concepto: conceptoBase,
      terceroId: new mongoose.Types.ObjectId(datos.proveedorId),
      terceroNombre: datos.proveedorNombre,
      terceroNif: datos.proveedorNif,
      documentoRef: datos.referencia || datos.facturaCodigo,
    });

    // 2. HABER: Caja/Banco
    lineas.push({
      orden: 2,
      cuentaId: cuentaTesoreria._id,
      cuentaCodigo: cuentaTesoreria.codigo,
      cuentaNombre: cuentaTesoreria.nombre,
      debe: 0,
      haber: datos.importe,
      concepto: conceptoBase,
      documentoRef: datos.referencia || datos.facturaCodigo,
    });

    // Obtener número de asiento
    const ejercicio = datos.fecha.getFullYear();
    const numero = await this.getSiguienteNumeroAsiento(AsientoContable, ConfigContable, ejercicio);

    // Crear asiento
    const asiento = await AsientoContable.create({
      numero,
      fecha: datos.fecha,
      periodo: datos.fecha.getMonth() + 1,
      ejercicio,
      concepto: conceptoBase,
      lineas,
      totalDebe: datos.importe,
      totalHaber: datos.importe,
      cuadrado: true,
      diferencia: 0,
      origenTipo: OrigenAsiento.PAGO,
      origenId: new mongoose.Types.ObjectId(datos.pagoId),
      origenNumero: datos.referencia,
      estado: EstadoAsiento.CONTABILIZADO,
      bloqueado: true,
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
      contabilizadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaContabilizacion: new Date(),
    });

    // Actualizar saldos de cuentas
    await this.actualizarSaldosCuentas(CuentaContable, lineas);

    console.log('[Contabilidad] Asiento pago creado:', asiento.numero);

    return asiento;
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Obtener cuenta de tesorería según medio de pago
   */
  private async getCuentaTesoreria(
    CuentaContable: any,
    config: any,
    medioPago: string,
    cuentaBancariaId?: string
  ): Promise<any> {
    // Si hay cuenta bancaria específica, buscar su cuenta contable asociada
    if (cuentaBancariaId) {
      const cuentaBancaria = await CuentaContable.findOne({
        terceroId: new mongoose.Types.ObjectId(cuentaBancariaId),
        codigo: { $regex: /^572/ }, // Cuentas bancarias
      });
      if (cuentaBancaria) return cuentaBancaria;
    }

    // Según el medio de pago
    switch (medioPago) {
      case 'efectivo':
        // Buscar cuenta de caja
        const cuentaCaja = await CuentaContable.findOne({
          codigo: config?.cuentasDefecto?.caja || '5700',
        });
        if (cuentaCaja) return cuentaCaja;
        // Buscar cualquier cuenta 570
        return CuentaContable.findOne({ codigo: { $regex: /^570/ } });

      case 'banco':
      case 'transferencia':
        // Buscar cuenta de bancos por defecto
        const cuentaBancos = await CuentaContable.findOne({
          codigo: config?.cuentasDefecto?.bancos || '5720',
        });
        if (cuentaBancos) return cuentaBancos;
        // Buscar cualquier cuenta 572
        return CuentaContable.findOne({ codigo: { $regex: /^572/ } });

      case 'tarjeta':
        // Buscar cuenta de pagos con tarjeta (571)
        const cuentaTarjeta = await CuentaContable.findOne({
          codigo: { $regex: /^571/ },
        });
        if (cuentaTarjeta) return cuentaTarjeta;
        // Si no existe, usar bancos
        return CuentaContable.findOne({
          codigo: config?.cuentasDefecto?.bancos || '5720',
        });

      case 'cheque':
        // Cheques usar efectos a cobrar/pagar
        // Por simplicidad, usar bancos
        return CuentaContable.findOne({
          codigo: config?.cuentasDefecto?.bancos || '5720',
        });

      default:
        // Por defecto, usar caja
        return CuentaContable.findOne({
          codigo: config?.cuentasDefecto?.caja || '5700',
        });
    }
  }

  private async getSiguienteNumeroAsiento(
    AsientoContable: any,
    ConfigContable: any,
    ejercicio: number
  ): Promise<number> {
    const config = await ConfigContable.findOne();

    if (config?.reiniciarNumeracionAnual) {
      const ultimo = await AsientoContable.findOne({ ejercicio }).sort({ numero: -1 });
      return (ultimo?.numero || 0) + 1;
    }

    const resultado = await ConfigContable.findOneAndUpdate(
      {},
      { $inc: { proximoNumeroAsiento: 1 } },
      { new: false }
    );

    return resultado?.proximoNumeroAsiento || 1;
  }

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
}

export const asientoCobroGenerator = new AsientoCobroGenerator();
