/**
 * Generador de Asientos desde Facturas
 * Genera asientos contables automáticos al emitir facturas
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
 * Datos de factura para generar asiento
 */
export interface IDatosFacturaVenta {
  facturaId: string;
  codigo: string;
  fecha: Date;
  clienteId: string;
  clienteNombre: string;
  clienteNif?: string;
  // Totales
  subtotalNeto: number;           // Base imponible total
  totalFactura: number;           // Total con IVA
  // Desglose IVA
  desgloseIva: Array<{
    tipo: number;                 // % IVA (21, 10, 4, 0)
    base: number;                 // Base imponible
    cuota: number;                // Cuota IVA
  }>;
  // Retención IRPF (opcional)
  tieneRetencion?: boolean;
  porcentajeRetencion?: number;
  importeRetencion?: number;
}

export interface IDatosFacturaCompra {
  facturaId: string;
  codigo: string;
  fecha: Date;
  proveedorId: string;
  proveedorNombre: string;
  proveedorNif?: string;
  // Totales
  subtotalNeto: number;
  totalFactura: number;
  // Desglose IVA
  desgloseIva: Array<{
    tipo: number;
    base: number;
    cuota: number;
  }>;
  // Retención IRPF (opcional)
  tieneRetencion?: boolean;
  porcentajeRetencion?: number;
  importeRetencion?: number;
}

class AsientoFacturaGenerator {
  /**
   * Generar asiento desde factura de venta
   *
   * Estructura del asiento:
   * DEBE:
   *   430XXXXX (Cliente)        Total factura
   * HABER:
   *   700XXXXX (Ventas)         Base imponible
   *   477000XX (IVA Rep.)       Cuota IVA (por cada tipo)
   *   4730XXXX (Ret. IRPF)      Retención (si aplica)
   */
  async generarDesdeFacturaVenta(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    datos: IDatosFacturaVenta,
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

    // Verificar si ya existe asiento para esta factura
    const asientoExistente = await AsientoContable.findOne({
      origenTipo: OrigenAsiento.FACTURA_VENTA,
      origenId: new mongoose.Types.ObjectId(datos.facturaId),
    });

    if (asientoExistente) {
      console.log('[Contabilidad] Ya existe asiento para factura', datos.codigo);
      return asientoExistente;
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
    let orden = 1;

    // 1. DEBE: Cliente (total factura)
    lineas.push({
      orden: orden++,
      cuentaId: cuentaCliente._id,
      cuentaCodigo: cuentaCliente.codigo,
      cuentaNombre: cuentaCliente.nombre,
      debe: datos.totalFactura,
      haber: 0,
      concepto: `Fra. ${datos.codigo} - ${datos.clienteNombre}`,
      terceroId: new mongoose.Types.ObjectId(datos.clienteId),
      terceroNombre: datos.clienteNombre,
      terceroNif: datos.clienteNif,
      documentoRef: datos.codigo,
    });

    // 2. HABER: Ventas (base imponible)
    const cuentaVentas = await CuentaContable.findOne({
      codigo: config.cuentasDefecto?.ventasMercaderias || '700',
    });

    if (cuentaVentas) {
      lineas.push({
        orden: orden++,
        cuentaId: cuentaVentas._id,
        cuentaCodigo: cuentaVentas.codigo,
        cuentaNombre: cuentaVentas.nombre,
        debe: 0,
        haber: datos.subtotalNeto,
        concepto: `Ventas Fra. ${datos.codigo}`,
        documentoRef: datos.codigo,
      });
    }

    // 3. HABER: IVA Repercutido (por cada tipo)
    for (const iva of datos.desgloseIva) {
      if (iva.cuota > 0) {
        const codigoIva = this.getCuentaIvaRepercutido(config, iva.tipo);
        let cuentaIva = await CuentaContable.findOne({ codigo: codigoIva });

        // Si no existe, usar cuenta genérica
        if (!cuentaIva) {
          cuentaIva = await CuentaContable.findOne({ codigo: '4770' });
        }

        if (cuentaIva) {
          lineas.push({
            orden: orden++,
            cuentaId: cuentaIva._id,
            cuentaCodigo: cuentaIva.codigo,
            cuentaNombre: cuentaIva.nombre,
            debe: 0,
            haber: iva.cuota,
            concepto: `IVA ${iva.tipo}% Fra. ${datos.codigo}`,
            documentoRef: datos.codigo,
          });
        }
      }
    }

    // 4. HABER: Retención IRPF (si aplica) - resta del total
    if (datos.tieneRetencion && datos.importeRetencion && datos.importeRetencion > 0) {
      const cuentaRetencion = await CuentaContable.findOne({
        codigo: config.cuentasDefecto?.retencionesIRPFPracticadas || '4730',
      });

      if (cuentaRetencion) {
        // La retención reduce el importe a cobrar del cliente
        lineas[0].debe -= datos.importeRetencion;

        lineas.push({
          orden: orden++,
          cuentaId: cuentaRetencion._id,
          cuentaCodigo: cuentaRetencion.codigo,
          cuentaNombre: cuentaRetencion.nombre,
          debe: datos.importeRetencion,
          haber: 0,
          concepto: `Retención IRPF ${datos.porcentajeRetencion}% Fra. ${datos.codigo}`,
          documentoRef: datos.codigo,
        });
      }
    }

    // Calcular totales
    const totalDebe = lineas.reduce((sum, l) => sum + l.debe, 0);
    const totalHaber = lineas.reduce((sum, l) => sum + l.haber, 0);
    const cuadrado = Math.abs(totalDebe - totalHaber) < 0.01;

    if (!cuadrado) {
      console.error('[Contabilidad] Asiento no cuadra', { totalDebe, totalHaber });
      throw new Error(`El asiento no cuadra. Debe: ${totalDebe}, Haber: ${totalHaber}`);
    }

    // Obtener número de asiento
    const ejercicio = datos.fecha.getFullYear();
    const numero = await this.getSiguienteNumeroAsiento(AsientoContable, ConfigContable, ejercicio);

    // Crear asiento
    const asiento = await AsientoContable.create({
      numero,
      fecha: datos.fecha,
      periodo: datos.fecha.getMonth() + 1,
      ejercicio,
      concepto: `Fra. venta ${datos.codigo} - ${datos.clienteNombre}`,
      lineas,
      totalDebe: Math.round(totalDebe * 100) / 100,
      totalHaber: Math.round(totalHaber * 100) / 100,
      cuadrado: true,
      diferencia: 0,
      origenTipo: OrigenAsiento.FACTURA_VENTA,
      origenId: new mongoose.Types.ObjectId(datos.facturaId),
      origenNumero: datos.codigo,
      estado: EstadoAsiento.CONTABILIZADO,
      bloqueado: true,
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
      contabilizadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaContabilizacion: new Date(),
    });

    // Actualizar saldos de cuentas
    await this.actualizarSaldosCuentas(CuentaContable, lineas);

    console.log('[Contabilidad] Asiento creado:', asiento.numero, 'para factura', datos.codigo);

    return asiento;
  }

  /**
   * Generar asiento desde factura de compra
   *
   * Estructura del asiento:
   * DEBE:
   *   600XXXXX (Compras)        Base imponible
   *   472000XX (IVA Sop.)       Cuota IVA (por cada tipo)
   * HABER:
   *   400XXXXX (Proveedor)      Total factura
   *   4751XXXX (Ret. IRPF)      Retención (si aplica)
   */
  async generarDesdeFacturaCompra(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    datos: IDatosFacturaCompra,
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
      return null;
    }

    // Verificar si ya existe asiento
    const asientoExistente = await AsientoContable.findOne({
      origenTipo: OrigenAsiento.FACTURA_COMPRA,
      origenId: new mongoose.Types.ObjectId(datos.facturaId),
    });

    if (asientoExistente) {
      return asientoExistente;
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
    let orden = 1;

    // 1. DEBE: Compras (base imponible)
    const cuentaCompras = await CuentaContable.findOne({
      codigo: config.cuentasDefecto?.comprasMercaderias || '600',
    });

    if (cuentaCompras) {
      lineas.push({
        orden: orden++,
        cuentaId: cuentaCompras._id,
        cuentaCodigo: cuentaCompras.codigo,
        cuentaNombre: cuentaCompras.nombre,
        debe: datos.subtotalNeto,
        haber: 0,
        concepto: `Compras Fra. ${datos.codigo}`,
        documentoRef: datos.codigo,
      });
    }

    // 2. DEBE: IVA Soportado (por cada tipo)
    for (const iva of datos.desgloseIva) {
      if (iva.cuota > 0) {
        const codigoIva = this.getCuentaIvaSoportado(config, iva.tipo);
        let cuentaIva = await CuentaContable.findOne({ codigo: codigoIva });

        if (!cuentaIva) {
          cuentaIva = await CuentaContable.findOne({ codigo: '4720' });
        }

        if (cuentaIva) {
          lineas.push({
            orden: orden++,
            cuentaId: cuentaIva._id,
            cuentaCodigo: cuentaIva.codigo,
            cuentaNombre: cuentaIva.nombre,
            debe: iva.cuota,
            haber: 0,
            concepto: `IVA ${iva.tipo}% Fra. ${datos.codigo}`,
            documentoRef: datos.codigo,
          });
        }
      }
    }

    // 3. HABER: Proveedor (total factura)
    let importeProveedor = datos.totalFactura;

    // Si hay retención, el proveedor cobra menos
    if (datos.tieneRetencion && datos.importeRetencion) {
      importeProveedor -= datos.importeRetencion;
    }

    lineas.push({
      orden: orden++,
      cuentaId: cuentaProveedor._id,
      cuentaCodigo: cuentaProveedor.codigo,
      cuentaNombre: cuentaProveedor.nombre,
      debe: 0,
      haber: importeProveedor,
      concepto: `Fra. ${datos.codigo} - ${datos.proveedorNombre}`,
      terceroId: new mongoose.Types.ObjectId(datos.proveedorId),
      terceroNombre: datos.proveedorNombre,
      terceroNif: datos.proveedorNif,
      documentoRef: datos.codigo,
    });

    // 4. HABER: Retención IRPF (si aplica)
    if (datos.tieneRetencion && datos.importeRetencion && datos.importeRetencion > 0) {
      const cuentaRetencion = await CuentaContable.findOne({
        codigo: config.cuentasDefecto?.retencionesIRPFSoportadas || '4751',
      });

      if (cuentaRetencion) {
        lineas.push({
          orden: orden++,
          cuentaId: cuentaRetencion._id,
          cuentaCodigo: cuentaRetencion.codigo,
          cuentaNombre: cuentaRetencion.nombre,
          debe: 0,
          haber: datos.importeRetencion,
          concepto: `Retención IRPF ${datos.porcentajeRetencion}% Fra. ${datos.codigo}`,
          documentoRef: datos.codigo,
        });
      }
    }

    // Calcular totales
    const totalDebe = lineas.reduce((sum, l) => sum + l.debe, 0);
    const totalHaber = lineas.reduce((sum, l) => sum + l.haber, 0);

    if (Math.abs(totalDebe - totalHaber) >= 0.01) {
      throw new Error(`El asiento no cuadra. Debe: ${totalDebe}, Haber: ${totalHaber}`);
    }

    // Obtener número de asiento
    const ejercicio = datos.fecha.getFullYear();
    const numero = await this.getSiguienteNumeroAsiento(AsientoContable, ConfigContable, ejercicio);

    // Crear asiento
    const asiento = await AsientoContable.create({
      numero,
      fecha: datos.fecha,
      periodo: datos.fecha.getMonth() + 1,
      ejercicio,
      concepto: `Fra. compra ${datos.codigo} - ${datos.proveedorNombre}`,
      lineas,
      totalDebe: Math.round(totalDebe * 100) / 100,
      totalHaber: Math.round(totalHaber * 100) / 100,
      cuadrado: true,
      diferencia: 0,
      origenTipo: OrigenAsiento.FACTURA_COMPRA,
      origenId: new mongoose.Types.ObjectId(datos.facturaId),
      origenNumero: datos.codigo,
      estado: EstadoAsiento.CONTABILIZADO,
      bloqueado: true,
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaCreacion: new Date(),
      contabilizadoPor: new mongoose.Types.ObjectId(usuarioId),
      fechaContabilizacion: new Date(),
    });

    // Actualizar saldos
    await this.actualizarSaldosCuentas(CuentaContable, lineas);

    console.log('[Contabilidad] Asiento compra creado:', asiento.numero);

    return asiento;
  }

  // ============================================
  // HELPERS
  // ============================================

  private getCuentaIvaRepercutido(config: any, porcentaje: number): string {
    switch (porcentaje) {
      case 21: return config?.cuentasDefecto?.ivaRepercutido21 || '4770021';
      case 10: return config?.cuentasDefecto?.ivaRepercutido10 || '4770010';
      case 4: return config?.cuentasDefecto?.ivaRepercutido4 || '4770004';
      default: return config?.cuentasDefecto?.ivaRepercutido0 || '4770000';
    }
  }

  private getCuentaIvaSoportado(config: any, porcentaje: number): string {
    switch (porcentaje) {
      case 21: return config?.cuentasDefecto?.ivaSoportado21 || '4720021';
      case 10: return config?.cuentasDefecto?.ivaSoportado10 || '4720010';
      case 4: return config?.cuentasDefecto?.ivaSoportado4 || '4720004';
      default: return '4720021';
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

export const asientoFacturaGenerator = new AsientoFacturaGenerator();
