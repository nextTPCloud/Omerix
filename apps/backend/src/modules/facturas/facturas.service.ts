import mongoose, { Model } from 'mongoose';
import {
  Factura,
  IFactura,
  EstadoFactura,
  TipoFactura,
  TipoLinea,
  ILineaFactura,
  MetodoPago,
  SistemaFiscal,
  MotivoRectificacion,
} from './Factura';
import {
  CreateFacturaDTO,
  UpdateFacturaDTO,
  SearchFacturasDTO,
  RegistrarCobroDTO,
  CrearDesdeAlbaranesDTO,
  CrearFacturaDirectaDTO,
  CrearRectificativaDTO,
  EmitirFacturaDTO,
  AnularFacturaDTO,
} from './facturas.dto';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import {
  getFacturaModel,
  getAlbaranModel,
  getPedidoModel,
  getProductoModel,
  getClienteModel,
  getProyectoModel,
  getAgenteComercialModel,
  getUserModel,
  getSerieDocumentoModel,
  getPresupuestoModel,
  getTerminoPagoModel,
} from '@/utils/dynamic-models.helper';
import { EstadoAlbaran, TipoAlbaran } from '../albaranes/Albaran';
import { EstadoPresupuesto } from '../presupuestos/Presupuesto';
import fiscalLogService from '@/modules/logs/services/fiscal-log.service';
import { DocumentType } from '@/modules/logs/interfaces/log.interface';
import {
  generateDocumentHash,
  generateVerifactuSignature,
  generateTicketBAISignature,
  generateFiscalDocumentId,
} from '@/utils/crypto/signature.util';
import QRCode from 'qrcode';
import { logError, logInfo, logWarn } from '@/utils/logger/winston.config';
import { verifactuService } from '@/modules/verifactu/verifactu.service';
import Empresa from '@/modules/empresa/Empresa';
import { vencimientosService } from '@/modules/tesoreria/vencimientos.service';
import { TipoVencimiento } from '@/models/Vencimiento';
import { parseAdvancedFilters, mergeFilters } from '@/utils/advanced-filters.helper';
import { albaranesService } from '@/modules/albaranes/albaranes.service';
import { TipoAlbaran as TipoAlbaranEnum } from '@/modules/albaranes/Albaran';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  facturas: IFactura[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class FacturasService {
  /**
   * Obtener modelo de Factura para una empresa específica
   */
  private async getModeloFactura(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IFactura>> {
    // Registrar modelos referenciados para que populate funcione
    await Promise.all([
      getClienteModel(empresaId, dbConfig),
      getProyectoModel(empresaId, dbConfig),
      getAgenteComercialModel(empresaId, dbConfig),
      getProductoModel(empresaId, dbConfig),
      getUserModel(empresaId, dbConfig),
      getAlbaranModel(empresaId, dbConfig),
      getPedidoModel(empresaId, dbConfig),
    ]);

    return await getFacturaModel(empresaId, dbConfig);
  }

  // ============================================
  // CÁLCULOS DE LÍNEAS Y TOTALES
  // ============================================

  /**
   * Calcular importes de una línea
   */
  calcularLinea(linea: Partial<ILineaFactura>, recargoEquivalencia: boolean = false): ILineaFactura {
    const cantidad = linea.cantidad || 0;
    const precioUnitario = linea.precioUnitario || 0;
    const costeUnitario = linea.costeUnitario || 0;
    const descuento = linea.descuento || 0;
    const iva = linea.iva || 21;

    // Calcular subtotal
    const subtotalBruto = cantidad * precioUnitario;
    const descuentoImporte = subtotalBruto * (descuento / 100);
    const subtotal = subtotalBruto - descuentoImporte;

    // Calcular IVA
    const ivaImporte = subtotal * (iva / 100);

    // Calcular recargo equivalencia si aplica
    let recargoImporte = 0;
    const tipoRecargo = linea.recargoEquivalencia || (recargoEquivalencia ? this.getRecargoEquivalencia(iva) : 0);
    if (tipoRecargo > 0) {
      recargoImporte = subtotal * (tipoRecargo / 100);
    }

    const total = subtotal + ivaImporte + recargoImporte;

    // Calcular costes
    const costeTotalLinea = cantidad * costeUnitario;

    // Calcular márgenes
    const margenUnitario = precioUnitario - costeUnitario;
    const margenPorcentaje = costeUnitario > 0
      ? ((precioUnitario - costeUnitario) / costeUnitario) * 100
      : 0;
    const margenTotalLinea = subtotal - costeTotalLinea;

    return {
      ...linea,
      cantidad,
      precioUnitario,
      costeUnitario,
      descuento,
      descuentoImporte,
      subtotal,
      iva,
      ivaImporte,
      recargoEquivalencia: tipoRecargo,
      recargoImporte,
      total,
      costeTotalLinea,
      margenUnitario,
      margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
      margenTotalLinea,
    } as ILineaFactura;
  }

  /**
   * Obtener porcentaje de recargo de equivalencia según IVA
   */
  private getRecargoEquivalencia(iva: number): number {
    switch (iva) {
      case 21:
        return 5.2;
      case 10:
        return 1.4;
      case 4:
        return 0.5;
      default:
        return 0;
    }
  }

  /**
   * Calcular totales de la factura
   */
  calcularTotales(
    lineas: ILineaFactura[],
    descuentoGlobalPorcentaje: number = 0,
    retencionIRPF: number = 0
  ) {
    let subtotalBruto = 0;
    let totalDescuentos = 0;
    let costeTotalMateriales = 0;
    let costeTotalServicios = 0;
    let costeTotalKits = 0;
    let totalRecargoEquivalencia = 0;

    const ivaAgrupado: Record<number, { base: number; cuota: number; recargo: number; cuotaRecargo: number }> = {};

    for (const linea of lineas) {
      if (!linea.incluidoEnTotal) continue;

      subtotalBruto += linea.cantidad * linea.precioUnitario;
      totalDescuentos += linea.descuentoImporte;
      totalRecargoEquivalencia += linea.recargoImporte || 0;

      // Agrupar IVA y recargo
      const tipoIva = linea.iva || 21;
      if (!ivaAgrupado[tipoIva]) {
        ivaAgrupado[tipoIva] = { base: 0, cuota: 0, recargo: linea.recargoEquivalencia || 0, cuotaRecargo: 0 };
      }
      ivaAgrupado[tipoIva].base += linea.subtotal;
      ivaAgrupado[tipoIva].cuota += linea.ivaImporte;
      ivaAgrupado[tipoIva].cuotaRecargo += linea.recargoImporte || 0;

      // Costes por tipo
      switch (linea.tipo) {
        case TipoLinea.SERVICIO:
          costeTotalServicios += linea.costeTotalLinea;
          break;
        case TipoLinea.KIT:
          costeTotalKits += linea.costeTotalLinea;
          break;
        default:
          costeTotalMateriales += linea.costeTotalLinea;
      }
    }

    // Aplicar descuento global
    const subtotalNeto = subtotalBruto - totalDescuentos;
    const descuentoGlobalImporte = subtotalNeto * (descuentoGlobalPorcentaje / 100);
    const subtotalNetoConDescuento = subtotalNeto - descuentoGlobalImporte;

    // Recalcular IVA si hay descuento global
    const factorDescuento = subtotalNeto > 0 ? subtotalNetoConDescuento / subtotalNeto : 1;
    const desgloseIva = Object.entries(ivaAgrupado).map(([tipo, valores]) => ({
      tipo: Number(tipo),
      base: Math.round(valores.base * factorDescuento * 100) / 100,
      cuota: Math.round(valores.cuota * factorDescuento * 100) / 100,
      recargo: valores.recargo,
      cuotaRecargo: Math.round(valores.cuotaRecargo * factorDescuento * 100) / 100,
    }));

    const totalIva = desgloseIva.reduce((sum, item) => sum + item.cuota, 0);
    const totalRecargoAjustado = desgloseIva.reduce((sum, item) => sum + item.cuotaRecargo, 0);

    // Calcular retención IRPF
    const importeRetencion = subtotalNetoConDescuento * (retencionIRPF / 100);

    const totalFactura = subtotalNetoConDescuento + totalIva + totalRecargoAjustado - importeRetencion;

    const costeTotal = costeTotalMateriales + costeTotalServicios + costeTotalKits;
    const margenBruto = subtotalNetoConDescuento - costeTotal;
    const margenPorcentaje = costeTotal > 0 ? (margenBruto / costeTotal) * 100 : 0;

    return {
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round((totalDescuentos + descuentoGlobalImporte) * 100) / 100,
      subtotalNeto: Math.round(subtotalNetoConDescuento * 100) / 100,
      desgloseIva,
      totalIva: Math.round(totalIva * 100) / 100,
      totalRecargoEquivalencia: Math.round(totalRecargoAjustado * 100) / 100,
      totalFactura: Math.round(totalFactura * 100) / 100,
      costeTotalMateriales: Math.round(costeTotalMateriales * 100) / 100,
      costeTotalServicios: Math.round(costeTotalServicios * 100) / 100,
      costeTotalKits: Math.round(costeTotalKits * 100) / 100,
      costeTotal: Math.round(costeTotal * 100) / 100,
      margenBruto: Math.round(margenBruto * 100) / 100,
      margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
      importeRetencion: Math.round(importeRetencion * 100) / 100,
    };
  }

  // ============================================
  // CREAR FACTURA
  // ============================================

  async crear(
    createFacturaDto: CreateFacturaDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);
    const ClienteModel = await getClienteModel(String(empresaId), dbConfig);

    // Generar código
    const serie = createFacturaDto.serie || 'FAC';
    const año = new Date().getFullYear();

    const ultimaFactura = await FacturaModel.findOne({
      serie,
      codigo: new RegExp(`^${serie}${año}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numero = 1;
    if (ultimaFactura && ultimaFactura.numero) {
      numero = ultimaFactura.numero + 1;
    }

    const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

    // Obtener datos del cliente si solo viene clienteId
    let clienteData = {
      clienteNombre: createFacturaDto.clienteNombre,
      clienteNif: createFacturaDto.clienteNif,
      clienteEmail: createFacturaDto.clienteEmail,
      clienteTelefono: createFacturaDto.clienteTelefono,
      direccionFacturacion: createFacturaDto.direccionFacturacion,
    };

    // Variable para almacenar el término de pago del cliente
    let terminoPagoCliente: any = null;

    // Cargar cliente para obtener datos y término de pago
    if (createFacturaDto.clienteId) {
      const cliente = await ClienteModel.findById(createFacturaDto.clienteId).lean();
      if (cliente) {
        // Completar datos del cliente si faltan
        if (!clienteData.clienteNombre || !clienteData.clienteNif) {
          const direccionFiscal = (cliente as any).direcciones?.find((d: any) => d.tipo === 'fiscal') || (cliente as any).direccion;
          clienteData = {
            clienteNombre: clienteData.clienteNombre || (cliente as any).nombre,
            clienteNif: clienteData.clienteNif || (cliente as any).nif,
            clienteEmail: clienteData.clienteEmail || (cliente as any).email,
            clienteTelefono: clienteData.clienteTelefono || (cliente as any).telefono,
            direccionFacturacion: clienteData.direccionFacturacion || {
              nombre: (cliente as any).nombre,
              calle: direccionFiscal?.calle,
              numero: direccionFiscal?.numero,
              piso: direccionFiscal?.piso,
              codigoPostal: direccionFiscal?.codigoPostal,
              ciudad: direccionFiscal?.ciudad,
              provincia: direccionFiscal?.provincia,
              pais: direccionFiscal?.pais || 'España',
            },
          };
        }

        // Cargar término de pago del cliente si existe
        if ((cliente as any).terminoPagoId) {
          const TerminoPagoModel = await getTerminoPagoModel(String(empresaId), dbConfig);
          terminoPagoCliente = await TerminoPagoModel.findById((cliente as any).terminoPagoId).lean();
        }
      }
    }

    // Procesar líneas
    let lineasProcesadas: ILineaFactura[] = [];
    if (createFacturaDto.lineas && createFacturaDto.lineas.length > 0) {
      lineasProcesadas = createFacturaDto.lineas.map((linea, index) => {
        return this.calcularLinea(
          {
            ...linea,
            orden: linea.orden ?? index + 1,
            tipo: linea.tipo || TipoLinea.PRODUCTO,
            mostrarComponentes: linea.mostrarComponentes ?? true,
            esEditable: linea.esEditable ?? true,
            incluidoEnTotal: linea.incluidoEnTotal ?? true,
          },
          createFacturaDto.recargoEquivalencia
        );
      });
    }

    // Calcular totales
    const totales = this.calcularTotales(
      lineasProcesadas,
      createFacturaDto.descuentoGlobalPorcentaje || 0,
      createFacturaDto.retencionIRPF || 0
    );

    // Generar vencimientos según el término de pago o por defecto
    let vencimientos: any[] = [];
    let fechaVencimiento: Date;
    const fechaFactura = createFacturaDto.fecha ? new Date(createFacturaDto.fecha) : new Date();

    if (createFacturaDto.vencimientos?.length) {
      // Si vienen vencimientos explícitos, usarlos
      vencimientos = createFacturaDto.vencimientos.map((v, i) => ({
        ...v,
        numero: i + 1,
        cobrado: false,
      }));
      fechaVencimiento = new Date(vencimientos[0].fecha);
    } else if (terminoPagoCliente && terminoPagoCliente.vencimientos?.length) {
      // Generar vencimientos según el término de pago del cliente
      vencimientos = terminoPagoCliente.vencimientos.map((v: any, i: number) => {
        const fechaVenc = new Date(fechaFactura);
        fechaVenc.setDate(fechaVenc.getDate() + v.dias);
        const importe = Math.round((totales.totalFactura * v.porcentaje / 100) * 100) / 100;

        return {
          numero: i + 1,
          fecha: fechaVenc,
          importe,
          metodoPago: MetodoPago.TRANSFERENCIA,
          cobrado: false,
        };
      });
      fechaVencimiento = new Date(vencimientos[0].fecha);
    } else {
      // Por defecto: un único vencimiento a 30 días
      fechaVencimiento = createFacturaDto.fechaVencimiento
        ? new Date(createFacturaDto.fechaVencimiento)
        : new Date(fechaFactura.getTime() + 30 * 24 * 60 * 60 * 1000);

      vencimientos = [{
        numero: 1,
        fecha: fechaVencimiento,
        importe: totales.totalFactura,
        metodoPago: MetodoPago.TRANSFERENCIA,
        cobrado: false,
      }];
    }

    // Crear factura
    const factura = new FacturaModel({
      _id: new mongoose.Types.ObjectId(),
      codigo,
      serie,
      numero,
      tipo: createFacturaDto.tipo || TipoFactura.ORDINARIA,
      estado: createFacturaDto.estado || EstadoFactura.BORRADOR,
      fecha: createFacturaDto.fecha ? new Date(createFacturaDto.fecha) : new Date(),
      fechaOperacion: createFacturaDto.fechaOperacion ? new Date(createFacturaDto.fechaOperacion) : undefined,
      fechaVencimiento,
      periodoFacturacion: createFacturaDto.periodoFacturacion,

      // Rectificativa
      esRectificativa: createFacturaDto.esRectificativa || false,
      facturaRectificadaId: createFacturaDto.facturaRectificadaId,
      facturaRectificadaCodigo: createFacturaDto.facturaRectificadaCodigo,
      motivoRectificacion: createFacturaDto.motivoRectificacion,
      descripcionRectificacion: createFacturaDto.descripcionRectificacion,

      // Cliente
      clienteId: createFacturaDto.clienteId,
      ...clienteData,

      // Orígenes
      albaranesOrigen: createFacturaDto.albaranesOrigen,
      pedidosOrigen: createFacturaDto.pedidosOrigen,
      presupuestosOrigen: createFacturaDto.presupuestosOrigen,

      // Relaciones
      proyectoId: createFacturaDto.proyectoId,
      agenteComercialId: createFacturaDto.agenteComercialId,

      // Referencias
      referenciaCliente: createFacturaDto.referenciaCliente,

      // Contenido
      titulo: createFacturaDto.titulo,
      descripcion: createFacturaDto.descripcion,
      lineas: lineasProcesadas,
      totales,

      // Descuentos
      descuentoGlobalPorcentaje: createFacturaDto.descuentoGlobalPorcentaje || 0,
      descuentoGlobalImporte: totales.totalDescuentos,

      // Vencimientos y cobros
      vencimientos,
      cobros: [],
      importeCobrado: 0,
      importePendiente: totales.totalFactura,

      // Datos fiscales
      regimenIva: createFacturaDto.regimenIva || 'general',
      claveOperacion: createFacturaDto.claveOperacion,
      recargoEquivalencia: createFacturaDto.recargoEquivalencia || false,
      retencionIRPF: createFacturaDto.retencionIRPF || 0,
      importeRetencion: totales.importeRetencion,

      // Sistema fiscal
      sistemaFiscal: createFacturaDto.sistemaFiscal || SistemaFiscal.VERIFACTU,

      // Textos
      observaciones: createFacturaDto.observaciones,
      observacionesInternas: createFacturaDto.observacionesInternas,
      condicionesPago: createFacturaDto.condicionesPago,
      pieFactura: createFacturaDto.pieFactura,

      // Tags
      tags: createFacturaDto.tags,

      // Control
      activo: true,
      bloqueado: false,
      inmutable: false,

      // Configuración
      mostrarCostes: createFacturaDto.mostrarCostes ?? true,
      mostrarMargenes: createFacturaDto.mostrarMargenes ?? true,
      mostrarComponentesKit: createFacturaDto.mostrarComponentesKit ?? true,
      mostrarPrecios: createFacturaDto.mostrarPrecios ?? true,

      // Auditoría
      creadoPor: usuarioId,
      fechaCreacion: new Date(),

      // Historial
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'CREADA',
        descripcion: `Factura ${codigo} creada`,
      }],
    });

    await factura.save();

    logInfo('Factura creada', { codigo, empresaId: String(empresaId) });

    // ============================================
    // GENERAR ALBARÁN AUTOMÁTICO PARA PRODUCTOS FÍSICOS
    // ============================================
    // Si la factura tiene productos físicos y no viene de albaranes,
    // generar albarán automático para el control de stock
    const tieneProductosFisicos = lineasProcesadas.some(
      linea => linea.tipo === TipoLinea.PRODUCTO && linea.productoId
    );
    const vieneDeAlbaranes = createFacturaDto.albaranesOrigen && createFacturaDto.albaranesOrigen.length > 0;

    if (tieneProductosFisicos && !vieneDeAlbaranes) {
      try {
        // Filtrar solo líneas de productos físicos
        const lineasProductos = lineasProcesadas
          .filter(linea => linea.tipo === TipoLinea.PRODUCTO && linea.productoId)
          .map(linea => ({
            tipo: 'producto' as const,
            productoId: linea.productoId?.toString(),
            productoNombre: linea.productoNombre,
            productoCodigo: linea.productoCodigo,
            descripcion: linea.descripcion,
            variante: linea.variante,
            cantidadSolicitada: linea.cantidad,
            cantidadEntregada: linea.cantidad, // Se entrega todo automáticamente
            precioUnitario: linea.precioUnitario,
            costeUnitario: linea.costeUnitario,
            descuento: linea.descuento,
            iva: linea.iva,
            recargoEquivalencia: linea.recargoEquivalencia,
            almacenId: linea.almacenId?.toString(),
          }));

        if (lineasProductos.length > 0) {
          const albaranData = {
            tipo: TipoAlbaranEnum.VENTA,
            clienteId: createFacturaDto.clienteId,
            clienteNombre: clienteData.clienteNombre,
            clienteNif: clienteData.clienteNif,
            clienteEmail: clienteData.clienteEmail,
            clienteTelefono: clienteData.clienteTelefono,
            fecha: factura.fecha,
            lineas: lineasProductos,
            observaciones: `Albarán generado automáticamente desde factura ${codigo}`,
            observacionesInternas: `Factura origen: ${factura._id}`,
            descuentoGlobalPorcentaje: createFacturaDto.descuentoGlobalPorcentaje || 0,
            proyectoId: createFacturaDto.proyectoId,
            estado: 'entregado', // Ya entregado para que mueva stock
            fechaEntrega: factura.fecha,
          };

          const albaran = await albaranesService.crear(
            albaranData as any,
            empresaId,
            usuarioId,
            dbConfig
          );

          // Vincular albarán a la factura
          factura.albaranesOrigen = [albaran._id];
          await factura.save();

          logInfo('Albarán automático generado para factura', {
            facturaId: factura._id.toString(),
            albaranId: albaran._id.toString(),
            albaranCodigo: albaran.codigo,
          });
        }
      } catch (error) {
        // No fallar la factura si el albarán falla, solo loggear
        logError('Error generando albarán automático para factura', {
          facturaId: factura._id.toString(),
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return factura;
  }

  // ============================================
  // ACTUALIZAR FACTURA
  // ============================================

  async actualizar(
    id: string,
    updateFacturaDto: UpdateFacturaDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura | null> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);

    const factura = await FacturaModel.findById(id);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    // Verificar que no sea inmutable
    if (factura.inmutable) {
      throw new Error('Esta factura es inmutable y no puede modificarse (cumplimiento ley anti-fraude)');
    }

    // Verificar que no esté en estado emitida o superior
    if (factura.estado !== EstadoFactura.BORRADOR) {
      throw new Error('Solo se pueden modificar facturas en estado borrador');
    }

    // Guardar datos anteriores para historial
    const datosAnteriores = factura.toObject();

    // Procesar líneas si vienen
    if (updateFacturaDto.lineas) {
      const lineasProcesadas = updateFacturaDto.lineas.map((linea, index) => {
        return this.calcularLinea(
          {
            ...linea,
            orden: linea.orden ?? index + 1,
            tipo: linea.tipo || TipoLinea.PRODUCTO,
            mostrarComponentes: linea.mostrarComponentes ?? true,
            esEditable: linea.esEditable ?? true,
            incluidoEnTotal: linea.incluidoEnTotal ?? true,
          },
          updateFacturaDto.recargoEquivalencia ?? factura.recargoEquivalencia
        );
      });
      factura.lineas = lineasProcesadas as any;
    }

    // Actualizar campos
    Object.keys(updateFacturaDto).forEach(key => {
      if (key !== 'lineas' && updateFacturaDto[key as keyof UpdateFacturaDTO] !== undefined) {
        (factura as any)[key] = updateFacturaDto[key as keyof UpdateFacturaDTO];
      }
    });

    // Recalcular totales
    const totales = this.calcularTotales(
      factura.lineas,
      factura.descuentoGlobalPorcentaje,
      factura.retencionIRPF || 0
    );
    factura.totales = totales as any;
    factura.importePendiente = totales.totalFactura - factura.importeCobrado;

    // Actualizar auditoría
    factura.modificadoPor = usuarioId;
    factura.fechaModificacion = new Date();

    // Agregar al historial
    factura.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'ACTUALIZADA',
      descripcion: 'Factura actualizada',
      datosAnteriores,
    });

    await factura.save();

    return factura;
  }

  // ============================================
  // BUSCAR FACTURAS
  // ============================================

  async buscar(
    searchDto: SearchFacturasDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<FindAllResult> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);

    const {
      search,
      clienteId,
      proyectoId,
      agenteComercialId,
      estado,
      estados,
      tipo,
      serie,
      activo,
      cobrada,
      vencida,
      rectificativa,
      fechaDesde,
      fechaHasta,
      fechaVencimientoDesde,
      fechaVencimientoHasta,
      importeMin,
      importeMax,
      albaranOrigenId,
      pedidoOrigenId,
      sistemaFiscal,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'fechaCreacion',
      sortOrder = 'desc',
    } = searchDto;

    const query: any = {};

    // Búsqueda por texto
    if (search) {
      query.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { clienteNombre: { $regex: search, $options: 'i' } },
        { clienteNif: { $regex: search, $options: 'i' } },
        { titulo: { $regex: search, $options: 'i' } },
        { referenciaCliente: { $regex: search, $options: 'i' } },
      ];
    }

    // Filtros
    if (clienteId) query.clienteId = clienteId;
    if (proyectoId) query.proyectoId = proyectoId;
    if (agenteComercialId) query.agenteComercialId = agenteComercialId;
    if (estado) query.estado = estado;
    if (estados) {
      query.estado = { $in: estados.split(',') };
    }
    if (tipo) query.tipo = tipo;
    if (serie) query.serie = serie;
    if (activo === 'true') query.activo = true;
    if (activo === 'false') query.activo = false;
    if (sistemaFiscal) query.sistemaFiscal = sistemaFiscal;

    if (cobrada === 'true') query.estado = EstadoFactura.COBRADA;
    if (cobrada === 'false') query.estado = { $ne: EstadoFactura.COBRADA };

    if (vencida === 'true') {
      query.fechaVencimiento = { $lt: new Date() };
      query.estado = { $nin: [EstadoFactura.COBRADA, EstadoFactura.ANULADA] };
      query.importePendiente = { $gt: 0 };
    }

    if (rectificativa === 'true') query.esRectificativa = true;
    if (rectificativa === 'false') query.esRectificativa = false;

    // Filtros de fecha
    if (fechaDesde || fechaHasta) {
      query.fecha = {};
      if (fechaDesde) query.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fecha.$lte = new Date(fechaHasta);
    }

    if (fechaVencimientoDesde || fechaVencimientoHasta) {
      query.fechaVencimiento = {};
      if (fechaVencimientoDesde) query.fechaVencimiento.$gte = new Date(fechaVencimientoDesde);
      if (fechaVencimientoHasta) query.fechaVencimiento.$lte = new Date(fechaVencimientoHasta);
    }

    // Filtros de importe
    if (importeMin || importeMax) {
      query['totales.totalFactura'] = {};
      if (importeMin) query['totales.totalFactura'].$gte = parseFloat(importeMin);
      if (importeMax) query['totales.totalFactura'].$lte = parseFloat(importeMax);
    }

    // Filtros de origen
    if (albaranOrigenId) query.albaranesOrigen = albaranOrigenId;
    if (pedidoOrigenId) query.pedidosOrigen = pedidoOrigenId;

    // Tags
    if (tags) {
      query.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
    }

    // FILTROS AVANZADOS - Procesar operadores como _ne, _gt, _lt, etc.
    const allowedAdvancedFields = [
      'estado', 'codigo', 'clienteNombre', 'titulo', 'serie', 'tipo',
      'activo', 'cobrada', 'vencida', 'agenteComercial', 'proyecto',
    ];
    const advancedFilters = parseAdvancedFilters(searchDto, allowedAdvancedFields);

    // Combinar filtros existentes con filtros avanzados
    const finalFilter = mergeFilters(query, advancedFilters);

    // Calcular skip
    const skip = (page - 1) * limit;

    // Ejecutar query
    const [facturas, total] = await Promise.all([
      FacturaModel.find(finalFilter)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .populate('clienteId', 'nombre codigo nif')
        .populate('proyectoId', 'nombre codigo')
        .populate('agenteComercialId', 'nombre apellidos codigo')
        .lean(),
      FacturaModel.countDocuments(finalFilter),
    ]);

    return {
      facturas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // OBTENER FACTURA POR ID
  // ============================================

  async obtenerPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura | null> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);

    return FacturaModel.findById(id)
      .populate('clienteId', 'nombre codigo nif email telefono direcciones')
      .populate('proyectoId', 'nombre codigo')
      .populate('agenteComercialId', 'nombre apellidos codigo')
      .populate('albaranesOrigen', 'codigo fecha totales')
      .populate('pedidosOrigen', 'codigo fecha totales')
      .populate('facturaRectificadaId', 'codigo fecha totales')
      .populate('creadoPor', 'nombre apellidos email')
      .populate('modificadoPor', 'nombre apellidos email')
      .lean();
  }

  // ============================================
  // EMITIR FACTURA (Con datos fiscales)
  // ============================================

  async emitir(
    id: string,
    emitirDto: EmitirFacturaDTO,
    empresaId: mongoose.Types.ObjectId,
    empresaNif: string,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);

    const factura = await FacturaModel.findById(id);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    if (factura.inmutable) {
      throw new Error('Esta factura ya fue emitida y es inmutable');
    }

    if (factura.estado !== EstadoFactura.BORRADOR) {
      throw new Error('Solo se pueden emitir facturas en estado borrador');
    }

    const sistemaFiscal = emitirDto.sistemaFiscal || factura.sistemaFiscal || SistemaFiscal.VERIFACTU;
    const fechaExpedicion = new Date();

    // Generar datos fiscales según sistema
    if (sistemaFiscal === SistemaFiscal.VERIFACTU) {
      const verifactuData = await this.generarVeriFactu(factura, empresaNif, empresaId);
      factura.verifactu = verifactuData;
      factura.codigoQR = verifactuData.urlQR;
      factura.urlVerificacion = verifactuData.urlQR;
    } else if (sistemaFiscal === SistemaFiscal.TICKETBAI) {
      const ticketbaiData = await this.generarTicketBAI(factura, empresaNif, empresaId);
      factura.ticketbai = ticketbaiData;
      factura.codigoQR = ticketbaiData.urlQR;
      factura.urlVerificacion = ticketbaiData.urlQR;
    }

    // Marcar como inmutable
    factura.inmutable = true;
    factura.estado = EstadoFactura.EMITIDA;
    factura.sistemaFiscal = sistemaFiscal;

    // Crear log fiscal
    try {
      const fiscalLog = await fiscalLogService.createWithVerifactu(
        {
          empresaId: String(empresaId),
          usuarioId: String(usuarioId),
          documentoTipo: factura.esRectificativa ? DocumentType.RECTIFICATIVA : DocumentType.FACTURA,
          documentoId: String(factura._id),
          numeroDocumento: factura.codigo,
          serie: factura.serie,
          importe: factura.totales.subtotalNeto,
          iva: factura.totales.totalIva,
          total: factura.totales.totalFactura,
        },
        empresaNif
      );
      factura.fiscalLogId = fiscalLog._id;
    } catch (error) {
      logError('Error creando log fiscal', error as Error);
    }

    // Historial
    factura.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'EMITIDA',
      descripcion: `Factura emitida con ${sistemaFiscal}`,
    });

    factura.modificadoPor = usuarioId;
    factura.fechaModificacion = new Date();

    await factura.save();

    logInfo('Factura emitida', { codigo: factura.codigo, sistemaFiscal });

    // ============================================
    // CREAR VENCIMIENTOS EN TESORERÍA
    // ============================================
    try {
      if (factura.vencimientos && factura.vencimientos.length > 0) {
        const vencimientosData = factura.vencimientos.map(v => ({
          tipo: TipoVencimiento.COBRO,
          documentoOrigen: 'factura_venta' as const,
          documentoId: factura._id.toString(),
          documentoNumero: factura.codigo,
          fechaEmision: factura.fecha,
          fechaVencimiento: new Date(v.fecha),
          importe: v.importe,
          clienteId: factura.clienteId.toString(),
          terceroNombre: factura.clienteNombre,
          terceroNif: factura.clienteNif || '',
          formaPagoId: factura.formaPagoId?.toString(),
          observaciones: `Vencimiento ${v.numero} de factura ${factura.codigo}`,
        }));

        await vencimientosService.createMultiple(
          String(empresaId),
          vencimientosData,
          dbConfig
        );

        logInfo('Vencimientos creados en tesorería', {
          facturaId: factura._id,
          codigo: factura.codigo,
          numVencimientos: vencimientosData.length,
        });
      }
    } catch (error) {
      logError('Error creando vencimientos en tesorería', error as Error);
      // No lanzamos error para no bloquear la emisión de la factura
    }

    // ============================================
    // ENVÍO AUTOMÁTICO A AEAT (VeriFactu)
    // ============================================
    if (sistemaFiscal === SistemaFiscal.VERIFACTU) {
      try {
        // Obtener empresa para el nombre
        const empresa = await Empresa.findById(empresaId);
        if (!empresa) {
          throw new Error('Empresa no encontrada para envío VeriFactu');
        }

        // Configurar entorno (por defecto test, se puede cambiar via configuración de empresa)
        const entorno = emitirDto.entornoVeriFactu || 'test';
        verifactuService.setEntorno(entorno);

        // Enviar a AEAT
        const resultado = await verifactuService.enviarFactura(
          factura,
          {
            empresaNif,
            empresaNombre: empresa.nombre,
            certificadoId: emitirDto.certificadoId,
            entorno,
          },
          String(empresaId)
        );

        // Actualizar estado según resultado
        if (resultado.exito) {
          factura.estado = EstadoFactura.ENVIADA;
          if (factura.verifactu) {
            factura.verifactu.estadoEnvio = 'aceptado';
            factura.verifactu.fechaEnvio = resultado.fechaEnvio;
            if (resultado.csv) {
              factura.verifactu.codigoRespuesta = resultado.csv;
            }
          }
          factura.historial.push({
            fecha: new Date(),
            usuarioId,
            accion: 'ENVIADA_AEAT',
            descripcion: `Factura enviada a AEAT (VeriFactu) - CSV: ${resultado.csv || 'N/A'}`,
          });
          logInfo('Factura enviada a AEAT correctamente', { codigo: factura.codigo, csv: resultado.csv });
        } else {
          // Error en envío - la factura queda emitida pero no enviada
          if (factura.verifactu) {
            factura.verifactu.estadoEnvio = 'rechazado';
            factura.verifactu.codigoRespuesta = resultado.codigo;
            factura.verifactu.mensajeRespuesta = resultado.mensaje;
          }
          factura.historial.push({
            fecha: new Date(),
            usuarioId,
            accion: 'ERROR_ENVIO_AEAT',
            descripcion: `Error envío VeriFactu: ${resultado.mensaje}`,
          });
          logWarn('Error enviando factura a AEAT', { codigo: factura.codigo, error: resultado.mensaje });
        }

        await factura.save();
      } catch (error: any) {
        logError('Error en envío automático a AEAT', error);
        // No lanzamos error para no bloquear la emisión
        // La factura queda emitida pero pendiente de envío
        factura.historial.push({
          fecha: new Date(),
          usuarioId,
          accion: 'ERROR_ENVIO_AEAT',
          descripcion: `Error técnico: ${error.message}`,
        });
        await factura.save();
      }
    }

    return factura;
  }

  /**
   * Generar datos VeriFactu
   */
  private async generarVeriFactu(
    factura: IFactura,
    empresaNif: string,
    empresaId: mongoose.Types.ObjectId
  ): Promise<any> {
    const fechaExpedicion = new Date();
    const idFactura = generateFiscalDocumentId(
      'factura',
      factura.serie,
      factura.codigo,
      String(empresaId)
    );

    // Generar hash de la factura
    const hashData = generateVerifactuSignature({
      idFactura,
      empresaNIF: empresaNif,
      fechaExpedicion,
      importe: factura.totales.totalFactura,
      numeroFactura: factura.codigo,
    });

    // Generar URL del QR
    const qrData = `VERIFACTU:${idFactura}:${empresaNif}:${factura.codigo}:${factura.totales.totalFactura.toFixed(2)}:${fechaExpedicion.toISOString().split('T')[0]}:${hashData.hash.substring(0, 32)}`;

    // Codificar como data URL
    let urlQR = '';
    try {
      urlQR = await QRCode.toDataURL(qrData, { width: 200, margin: 2 });
    } catch (error) {
      logError('Error generando QR VeriFactu', error as Error);
      urlQR = qrData;
    }

    return {
      idFactura,
      hash: hashData.hash,
      hashAnterior: null,
      fechaExpedicion,
      estadoEnvio: 'pendiente',
      urlQR,
      datosQR: qrData,
    };
  }

  /**
   * Generar datos TicketBAI
   */
  private async generarTicketBAI(
    factura: IFactura,
    empresaNif: string,
    empresaId: mongoose.Types.ObjectId
  ): Promise<any> {
    const fechaExpedicion = new Date();
    const tbaiId = generateFiscalDocumentId(
      'tbai',
      factura.serie,
      factura.codigo,
      String(empresaId)
    );

    // Generar firma TicketBAI
    const tbaiData = generateTicketBAISignature({
      tbaiId,
      empresaNIF: empresaNif,
      serie: factura.serie,
      numero: factura.codigo,
      fecha: fechaExpedicion,
      importe: factura.totales.totalFactura,
    });

    // Generar URL del QR
    const qrData = `TBAI:${tbaiId}:${empresaNif}:${factura.codigo}:${factura.totales.totalFactura.toFixed(2)}:${fechaExpedicion.toISOString().split('T')[0]}`;

    let urlQR = '';
    try {
      urlQR = await QRCode.toDataURL(qrData, { width: 200, margin: 2 });
    } catch (error) {
      logError('Error generando QR TicketBAI', error as Error);
      urlQR = qrData;
    }

    return {
      tbaiId,
      firma: tbaiData.firma,
      qr: tbaiData.qr,
      urlQR,
      fechaExpedicion,
      estadoEnvio: 'pendiente',
    };
  }

  // ============================================
  // REGISTRAR COBRO
  // ============================================

  async registrarCobro(
    id: string,
    cobroDto: RegistrarCobroDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);

    const factura = await FacturaModel.findById(id);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    if (factura.estado === EstadoFactura.ANULADA) {
      throw new Error('No se pueden registrar cobros en facturas anuladas');
    }

    // Agregar cobro
    factura.cobros.push({
      fecha: new Date(cobroDto.fecha),
      importe: cobroDto.importe,
      metodoPago: cobroDto.metodoPago,
      referencia: cobroDto.referencia,
      cuentaDestino: cobroDto.cuentaDestino,
      observaciones: cobroDto.observaciones,
      registradoPor: usuarioId,
      fechaRegistro: new Date(),
    });

    // Recalcular importes
    factura.importeCobrado = factura.cobros.reduce((sum, c) => sum + c.importe, 0);
    factura.importePendiente = Math.max(0, factura.totales.totalFactura - factura.importeCobrado);

    // Actualizar estado
    if (factura.importePendiente <= 0) {
      factura.estado = EstadoFactura.COBRADA;
    } else if (factura.importeCobrado > 0) {
      factura.estado = EstadoFactura.PARCIALMENTE_COBRADA;
    }

    // Si viene vencimientoId, marcarlo como cobrado
    if (cobroDto.vencimientoId) {
      const vencimiento = factura.vencimientos.find(
        v => v._id?.toString() === cobroDto.vencimientoId
      );
      if (vencimiento) {
        vencimiento.cobrado = true;
        vencimiento.fechaCobro = new Date(cobroDto.fecha);
        vencimiento.referenciaPago = cobroDto.referencia;
      }
    }

    // Historial
    factura.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'COBRO_REGISTRADO',
      descripcion: `Cobro registrado: ${cobroDto.importe.toFixed(2)}€ - ${cobroDto.metodoPago}`,
    });

    factura.modificadoPor = usuarioId;
    factura.fechaModificacion = new Date();

    await factura.save();

    return factura;
  }

  // ============================================
  // CREAR DESDE PRESUPUESTO (directamente)
  // ============================================

  async crearDesdePresupuesto(
    presupuestoId: string,
    dto: { copiarNotas?: boolean; emitirDirectamente?: boolean },
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura> {
    const PresupuestoModel = await getPresupuestoModel(String(empresaId), dbConfig);
    const presupuesto = await PresupuestoModel.findById(presupuestoId);

    if (!presupuesto) {
      throw new Error('Presupuesto no encontrado');
    }

    // Verificar que el presupuesto está aceptado
    if (presupuesto.estado !== EstadoPresupuesto.ACEPTADO && presupuesto.estado !== EstadoPresupuesto.CONVERTIDO) {
      throw new Error('El presupuesto debe estar en estado Aceptado para generar una factura');
    }

    // Convertir líneas de presupuesto a líneas de factura
    const lineas = presupuesto.lineas.map((lineaPresupuesto: any, index: number) => {
      return {
        orden: index + 1,
        tipo: lineaPresupuesto.tipo,
        productoId: lineaPresupuesto.productoId,
        codigo: lineaPresupuesto.codigo,
        nombre: lineaPresupuesto.nombre,
        descripcion: lineaPresupuesto.descripcion,
        descripcionLarga: lineaPresupuesto.descripcionLarga,
        sku: lineaPresupuesto.sku,
        variante: lineaPresupuesto.variante,
        cantidad: lineaPresupuesto.cantidad,
        unidad: lineaPresupuesto.unidad,
        precioUnitario: lineaPresupuesto.precioUnitario,
        descuento: lineaPresupuesto.descuento,
        iva: lineaPresupuesto.iva,
        recargoEquivalencia: lineaPresupuesto.recargoEquivalencia || 0,
        costeUnitario: lineaPresupuesto.costeUnitario,
        componentesKit: lineaPresupuesto.componentesKit,
        mostrarComponentes: lineaPresupuesto.mostrarComponentes,
        esEditable: true,
        incluidoEnTotal: lineaPresupuesto.incluidoEnTotal,
        notasInternas: dto.copiarNotas ? lineaPresupuesto.notasInternas : undefined,
      };
    });

    // Crear la factura
    const factura = await this.crear({
      tipo: TipoFactura.ORDINARIA,
      presupuestoOrigenId: presupuestoId,
      clienteId: presupuesto.clienteId.toString(),
      clienteNombre: presupuesto.clienteNombre,
      clienteNif: presupuesto.clienteNif,
      clienteEmail: presupuesto.clienteEmail,
      clienteTelefono: presupuesto.clienteTelefono,
      direccionFacturacion: presupuesto.direccionFacturacion,
      proyectoId: presupuesto.proyectoId?.toString(),
      agenteComercialId: presupuesto.agenteComercialId?.toString(),
      referenciaCliente: presupuesto.referenciaCliente,
      titulo: presupuesto.titulo,
      descripcion: presupuesto.descripcion,
      lineas: lineas as any,
      descuentoGlobalPorcentaje: presupuesto.descuentoGlobalPorcentaje,
      observaciones: dto.copiarNotas ? presupuesto.observaciones : undefined,
      mostrarCostes: presupuesto.mostrarCostes,
      mostrarMargenes: presupuesto.mostrarMargenes,
      mostrarComponentesKit: presupuesto.mostrarComponentesKit,
    }, empresaId, usuarioId, dbConfig);

    // Actualizar presupuesto: cambiar estado y añadir documento generado
    presupuesto.estado = EstadoPresupuesto.CONVERTIDO;

    // Añadir al array de documentos generados
    if (!presupuesto.documentosGenerados) {
      presupuesto.documentosGenerados = [];
    }
    presupuesto.documentosGenerados.push({
      tipo: 'factura',
      documentoId: factura._id,
      codigo: factura.codigo,
      fecha: new Date(),
    });

    // Registrar en historial del presupuesto
    presupuesto.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'Factura generada',
      descripcion: `Se ha generado la factura ${factura.codigo} directamente desde el presupuesto`,
    });

    await presupuesto.save();

    return factura;
  }

  // ============================================
  // CREAR DESDE ALBARANES
  // ============================================

  async crearDesdeAlbaranes(
    dto: CrearDesdeAlbaranesDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura[]> {
    const AlbaranModel = await getAlbaranModel(String(empresaId), dbConfig);

    // Obtener albaranes
    const albaranes = await AlbaranModel.find({
      _id: { $in: dto.albaranesIds },
      facturado: { $ne: true },
    }).populate('clienteId');

    if (albaranes.length === 0) {
      throw new Error('No se encontraron albaranes pendientes de facturar');
    }

    // Agrupar por cliente si se solicita
    const facturasCreadas: IFactura[] = [];

    if (dto.agruparPorCliente) {
      const albaranesPorCliente: Record<string, typeof albaranes> = {};
      albaranes.forEach(alb => {
        const clienteId = String(alb.clienteId);
        if (!albaranesPorCliente[clienteId]) {
          albaranesPorCliente[clienteId] = [];
        }
        albaranesPorCliente[clienteId].push(alb);
      });

      for (const [clienteId, albaranesCliente] of Object.entries(albaranesPorCliente)) {
        const factura = await this.crearFacturaDesdeAlbaranes(
          albaranesCliente,
          dto,
          empresaId,
          usuarioId,
          dbConfig
        );
        facturasCreadas.push(factura);
      }
    } else {
      const factura = await this.crearFacturaDesdeAlbaranes(
        albaranes,
        dto,
        empresaId,
        usuarioId,
        dbConfig
      );
      facturasCreadas.push(factura);
    }

    // Marcar albaranes como facturados
    for (const albaran of albaranes) {
      albaran.facturado = true;
      albaran.facturaId = facturasCreadas[0]._id;
      albaran.estado = EstadoAlbaran.FACTURADO;
      await albaran.save();
    }

    return facturasCreadas;
  }

  // ============================================
  // CREAR FACTURA DIRECTA DESDE ALBARANES (EMITIDA)
  // ============================================

  /**
   * Crea factura(s) desde albaranes y las emite directamente (no como borrador).
   * Útil para facturación rápida donde se quiere factura emitida inmediatamente.
   */
  async crearDesdeAlbaranesYEmitir(
    dto: CrearFacturaDirectaDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura[]> {
    // 1. Obtener empresa para configuración VeriFactu
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }

    // 2. Crear las facturas como borrador primero
    const facturasCreadas = await this.crearDesdeAlbaranes(
      {
        albaranesIds: dto.albaranesIds,
        agruparPorCliente: dto.agruparPorCliente,
        fechaFactura: dto.fechaFactura,
        fechaVencimiento: dto.fechaVencimiento,
        serie: dto.serie,
        observaciones: dto.observaciones,
        metodoPago: dto.metodoPago,
      },
      empresaId,
      usuarioId,
      dbConfig
    );

    // 3. Si se solicita emitir directamente, emitir cada factura
    if (dto.emitirDirectamente) {
      const facturasEmitidas: IFactura[] = [];

      // Obtener configuración de VeriFactu de la empresa
      const verifactuConfig = empresa.verifactuConfig || {
        entorno: 'test',
        sistemaFiscal: 'verifactu',
        envioAutomatico: true,
      };

      for (const factura of facturasCreadas) {
        try {
          const facturaEmitida = await this.emitir(
            String(factura._id),
            {
              sistemaFiscal: dto.sistemaFiscal || (verifactuConfig.sistemaFiscal === 'verifactu' ? SistemaFiscal.VERIFACTU : SistemaFiscal.TICKETBAI),
              enviarAHacienda: dto.enviarAAEAT ?? verifactuConfig.envioAutomatico,
              entornoVeriFactu: verifactuConfig.entorno,
              certificadoId: verifactuConfig.certificadoId,
            },
            empresaId,
            empresa.nif,
            usuarioId,
            dbConfig
          );
          facturasEmitidas.push(facturaEmitida);

          logInfo('Factura creada y emitida directamente desde albarán', {
            facturaId: facturaEmitida._id,
            codigo: facturaEmitida.codigo,
            estado: facturaEmitida.estado,
          });
        } catch (error: any) {
          logError('Error emitiendo factura directa', {
            facturaId: factura._id,
            error: error.message,
          });
          // Añadir la factura sin emitir (quedará como borrador)
          facturasEmitidas.push(factura);
        }
      }

      return facturasEmitidas;
    }

    return facturasCreadas;
  }

  private async crearFacturaDesdeAlbaranes(
    albaranes: any[],
    dto: CrearDesdeAlbaranesDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura> {
    const primerAlbaran = albaranes[0];

    // El cliente puede venir populado (objeto) o como ObjectId
    const cliente = primerAlbaran.clienteId;
    const esClientePopulado = cliente && typeof cliente === 'object' && cliente._id;

    // Detectar si son albaranes de devolución (rectificativos)
    // Nota: Si tipo no está definido, se asume VENTA (valor por defecto)
    const esDevolucion = albaranes.every(a => a.tipo === TipoAlbaran.DEVOLUCION);
    const tieneAlbaranesDevolucion = albaranes.some(a => a.tipo === TipoAlbaran.DEVOLUCION);

    // No mezclar albaranes de venta con albaranes de devolución
    if (tieneAlbaranesDevolucion && !esDevolucion) {
      throw new Error('No se pueden mezclar albaranes de venta con albaranes de devolución en la misma factura');
    }

    // Obtener datos de la factura rectificada si es devolución
    let facturaRectificadaId: string | undefined;
    let facturaRectificadaCodigo: string | undefined;
    if (esDevolucion && (primerAlbaran as any).albaranRectificadoId) {
      // Buscar la factura del albarán original
      const AlbaranModel = await getAlbaranModel(String(empresaId), dbConfig);
      const albaranOriginal = await AlbaranModel.findById((primerAlbaran as any).albaranRectificadoId);
      if (albaranOriginal?.facturaId) {
        const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);
        const facturaOriginal = await FacturaModel.findById(albaranOriginal.facturaId);
        if (facturaOriginal) {
          facturaRectificadaId = String(facturaOriginal._id);
          facturaRectificadaCodigo = facturaOriginal.codigo;
        }
      }
    }

    // Combinar líneas de todos los albaranes
    const lineas: any[] = [];
    let orden = 1;

    for (const albaran of albaranes) {
      // Añadir línea de referencia al albarán
      const tipoTexto = esDevolucion ? 'Devolución' : 'Albarán';
      lineas.push({
        orden: orden++,
        tipo: TipoLinea.TEXTO,
        nombre: `${tipoTexto} ${albaran.codigo} - ${new Date(albaran.fecha).toLocaleDateString('es-ES')}`,
        cantidad: 0,
        precioUnitario: 0,
        descuento: 0,
        iva: 0,
        incluidoEnTotal: false,
      });

      // Añadir líneas del albarán
      for (const linea of albaran.lineas) {
        if (linea.incluidoEnTotal !== false) {
          // Para devoluciones, las cantidades van en negativo
          const cantidad = linea.cantidadEntregada || linea.cantidad || 0;
          lineas.push({
            orden: orden++,
            tipo: linea.tipo,
            productoId: linea.productoId,
            codigo: linea.codigo,
            nombre: linea.nombre,
            descripcion: linea.descripcion,
            sku: linea.sku,
            variante: linea.variante,
            cantidad: esDevolucion ? -Math.abs(cantidad) : cantidad, // Negativo para devoluciones
            unidad: linea.unidad,
            precioUnitario: linea.precioUnitario,
            descuento: linea.descuento,
            iva: linea.iva,
            costeUnitario: linea.costeUnitario,
            componentesKit: linea.componentesKit,
            mostrarComponentes: linea.mostrarComponentes,
            albaranLineaId: linea._id,
          });
        }
      }
    }

    // Crear factura
    const facturaDto: CreateFacturaDTO = {
      serie: dto.serie || (esDevolucion ? 'REC' : 'FAC'), // Serie REC para rectificativas
      tipo: esDevolucion ? TipoFactura.RECTIFICATIVA : TipoFactura.ORDINARIA,
      esRectificativa: esDevolucion,
      facturaRectificadaId,
      facturaRectificadaCodigo,
      motivoRectificacion: esDevolucion ? MotivoRectificacion.DEVOLUCION : undefined,
      descripcionRectificacion: esDevolucion && (primerAlbaran as any).motivoDevolucion
        ? (primerAlbaran as any).motivoDevolucion
        : undefined,
      clienteId: String(cliente._id || cliente),
      clienteNombre: cliente.nombre,
      clienteNif: cliente.nif,
      clienteEmail: cliente.email,
      clienteTelefono: cliente.telefono,
      fecha: dto.fechaFactura,
      fechaVencimiento: dto.fechaVencimiento,
      albaranesOrigen: albaranes.map(a => String(a._id)),
      lineas,
      observaciones: dto.observaciones || (esDevolucion ? 'Factura rectificativa por devolución de mercancía' : undefined),
    };

    return this.crear(facturaDto, empresaId, usuarioId, dbConfig);
  }

  // ============================================
  // CREAR RECTIFICATIVA
  // ============================================

  async crearRectificativa(
    dto: CrearRectificativaDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);

    const facturaOriginal = await FacturaModel.findById(dto.facturaOriginalId);
    if (!facturaOriginal) {
      throw new Error('Factura original no encontrada');
    }

    // Preparar líneas rectificativas (importes negativos)
    let lineas = dto.lineas || facturaOriginal.lineas.map(l => ({
      ...l,
      cantidad: -(l as any).cantidad,
    }));

    // Si es rectificación parcial
    if (dto.importeRectificar && dto.importeRectificar < facturaOriginal.totales.totalFactura) {
      const factor = dto.importeRectificar / facturaOriginal.totales.totalFactura;
      lineas = facturaOriginal.lineas.map(l => ({
        ...l,
        cantidad: -Math.round((l as any).cantidad * factor * 100) / 100,
      }));
    }

    const facturaDto: CreateFacturaDTO = {
      serie: dto.serie || 'RFC',
      tipo: TipoFactura.RECTIFICATIVA,
      clienteId: String(facturaOriginal.clienteId),
      clienteNombre: facturaOriginal.clienteNombre,
      clienteNif: facturaOriginal.clienteNif,
      clienteEmail: facturaOriginal.clienteEmail,
      direccionFacturacion: facturaOriginal.direccionFacturacion,
      esRectificativa: true,
      facturaRectificadaId: String(facturaOriginal._id),
      facturaRectificadaCodigo: facturaOriginal.codigo,
      motivoRectificacion: dto.motivoRectificacion,
      descripcionRectificacion: dto.descripcionRectificacion,
      proyectoId: facturaOriginal.proyectoId ? String(facturaOriginal.proyectoId) : undefined,
      agenteComercialId: facturaOriginal.agenteComercialId ? String(facturaOriginal.agenteComercialId) : undefined,
      lineas: lineas as any,
      recargoEquivalencia: facturaOriginal.recargoEquivalencia,
      retencionIRPF: facturaOriginal.retencionIRPF,
    };

    const rectificativa = await this.crear(facturaDto, empresaId, usuarioId, dbConfig);

    // Actualizar factura original
    facturaOriginal.estado = EstadoFactura.RECTIFICADA;
    facturaOriginal.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'RECTIFICADA',
      descripcion: `Rectificada por factura ${rectificativa.codigo}`,
    });
    await facturaOriginal.save();

    return rectificativa;
  }

  // ============================================
  // ANULAR FACTURA
  // ============================================

  async anular(
    id: string,
    dto: AnularFacturaDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);

    const factura = await FacturaModel.findById(id);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    if (factura.estado === EstadoFactura.ANULADA) {
      throw new Error('La factura ya está anulada');
    }

    // Si está emitida, crear rectificativa en lugar de anular
    if (factura.inmutable && dto.crearRectificativa) {
      return this.crearRectificativa(
        {
          facturaOriginalId: id,
          motivoRectificacion: MotivoRectificacion.OTROS,
          descripcionRectificacion: dto.motivo,
        },
        empresaId,
        usuarioId,
        dbConfig
      );
    }

    // Si no está emitida, anular directamente
    factura.estado = EstadoFactura.ANULADA;
    factura.activo = false;

    // Historial
    factura.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'ANULADA',
      descripcion: `Motivo: ${dto.motivo}`,
    });

    factura.modificadoPor = usuarioId;
    factura.fechaModificacion = new Date();

    await factura.save();

    // Liberar albaranes
    if (factura.albaranesOrigen?.length) {
      const AlbaranModel = await getAlbaranModel(String(empresaId), dbConfig);
      await AlbaranModel.updateMany(
        { _id: { $in: factura.albaranesOrigen } },
        { $set: { facturado: false, facturaId: null, estado: EstadoAlbaran.ENTREGADO } }
      );
    }

    return factura;
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);

    const [
      total,
      porEstado,
      totales,
      vencidas,
    ] = await Promise.all([
      FacturaModel.countDocuments(),
      FacturaModel.aggregate([
        { $group: { _id: '$estado', count: { $sum: 1 } } },
      ]),
      FacturaModel.aggregate([
        { $match: { activo: true, estado: { $ne: EstadoFactura.ANULADA } } },
        {
          $group: {
            _id: null,
            totalFacturado: { $sum: '$totales.totalFactura' },
            totalCobrado: { $sum: '$importeCobrado' },
            totalPendiente: { $sum: '$importePendiente' },
          },
        },
      ]),
      FacturaModel.countDocuments({
        activo: true,
        estado: { $nin: [EstadoFactura.COBRADA, EstadoFactura.ANULADA] },
        fechaVencimiento: { $lt: new Date() },
        importePendiente: { $gt: 0 },
      }),
    ]);

    const estadisticasPorEstado: Record<string, number> = {};
    porEstado.forEach((item: { _id: string; count: number }) => {
      estadisticasPorEstado[item._id] = item.count;
    });

    return {
      total,
      porEstado: estadisticasPorEstado,
      totalFacturado: totales[0]?.totalFacturado || 0,
      totalCobrado: totales[0]?.totalCobrado || 0,
      totalPendiente: totales[0]?.totalPendiente || 0,
      totalVencido: vencidas,
    };
  }

  // ============================================
  // ELIMINAR (Solo borradores)
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);

    const factura = await FacturaModel.findById(id);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    if (factura.inmutable) {
      throw new Error('No se pueden eliminar facturas emitidas. Use anular o crear rectificativa.');
    }

    if (factura.estado !== EstadoFactura.BORRADOR) {
      throw new Error('Solo se pueden eliminar facturas en estado borrador');
    }

    await FacturaModel.findByIdAndDelete(id);

    return true;
  }

  // ============================================
  // DUPLICAR FACTURA
  // ============================================

  async duplicar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IFactura> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);

    const facturaOriginal = await FacturaModel.findById(id);
    if (!facturaOriginal) {
      throw new Error('Factura no encontrada');
    }

    // Preparar datos para nueva factura
    const nuevaFacturaData: CreateFacturaDTO = {
      serie: facturaOriginal.serie,
      tipo: facturaOriginal.tipo === TipoFactura.RECTIFICATIVA ? TipoFactura.ORDINARIA : facturaOriginal.tipo,
      clienteId: String(facturaOriginal.clienteId),
      clienteNombre: facturaOriginal.clienteNombre,
      clienteNif: facturaOriginal.clienteNif,
      clienteEmail: facturaOriginal.clienteEmail,
      clienteTelefono: facturaOriginal.clienteTelefono,
      direccionFacturacion: facturaOriginal.direccionFacturacion,
      direccionEnvio: facturaOriginal.direccionEnvio,
      referenciaCliente: facturaOriginal.referenciaCliente,
      proyectoId: facturaOriginal.proyectoId ? String(facturaOriginal.proyectoId) : undefined,
      agenteComercialId: facturaOriginal.agenteComercialId ? String(facturaOriginal.agenteComercialId) : undefined,
      titulo: facturaOriginal.titulo ? `Copia de ${facturaOriginal.titulo}` : undefined,
      lineas: facturaOriginal.lineas.map(linea => ({
        orden: linea.orden,
        tipo: linea.tipo,
        productoId: linea.productoId ? String(linea.productoId) : undefined,
        codigo: linea.codigo,
        nombre: linea.nombre,
        descripcion: linea.descripcion,
        descripcionLarga: linea.descripcionLarga,
        sku: linea.sku,
        variante: linea.variante,
        cantidad: linea.cantidad,
        unidad: linea.unidad,
        precioUnitario: linea.precioUnitario,
        descuento: linea.descuento,
        iva: linea.iva,
        recargoEquivalencia: linea.recargoEquivalencia,
        costeUnitario: linea.costeUnitario,
        componentesKit: linea.componentesKit,
        mostrarComponentes: linea.mostrarComponentes,
      })),
      descuentoGlobalPorcentaje: facturaOriginal.descuentoGlobalPorcentaje,
      recargoEquivalencia: facturaOriginal.recargoEquivalencia,
      retencionIRPF: facturaOriginal.retencionIRPF,
      formaPago: facturaOriginal.formaPago,
      terminoPago: facturaOriginal.terminoPago,
      condiciones: facturaOriginal.condiciones,
      sistemaFiscal: facturaOriginal.sistemaFiscal,
      observaciones: facturaOriginal.observaciones,
      observacionesInternas: facturaOriginal.observacionesInternas,
      tags: facturaOriginal.tags,
      mostrarCostes: facturaOriginal.mostrarCostes,
    };

    // Crear nueva factura (como borrador)
    const nuevaFactura = await this.crear(
      nuevaFacturaData,
      empresaId,
      usuarioId,
      dbConfig
    );

    // Añadir al historial
    nuevaFactura.historial.push({
      fecha: new Date(),
      usuarioId,
      accion: 'DUPLICADA',
      descripcion: `Duplicada desde factura ${facturaOriginal.codigo}`,
    });
    await nuevaFactura.save();

    return nuevaFactura;
  }

  // ============================================
  // ENVIAR POR EMAIL
  // ============================================

  async enviarPorEmail(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    options?: {
      emailDestino?: string;
      asunto?: string;
      mensaje?: string;
      pdfOptions?: any;
    }
  ): Promise<{ enviado: boolean; mensaje: string }> {
    const FacturaModel = await this.getModeloFactura(String(empresaId), dbConfig);

    const factura = await FacturaModel.findById(id);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    const emailDestino = options?.emailDestino || factura.clienteEmail;
    if (!emailDestino) {
      throw new Error('No hay dirección de email configurada para este cliente');
    }

    // Importar servicio de email
    const { sendEmail } = await import('@/utils/email');

    // Preparar asunto y mensaje
    const asunto = options?.asunto || `Factura ${factura.codigo} - ${factura.clienteNombre}`;
    const mensaje = options?.mensaje || `
      <p>Estimado/a ${factura.clienteNombre},</p>
      <p>Le adjuntamos la factura <strong>${factura.codigo}</strong> por un importe de <strong>${factura.totales.totalFactura.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</strong>.</p>
      ${factura.fechaVencimiento ? `<p>Fecha de vencimiento: ${new Date(factura.fechaVencimiento).toLocaleDateString('es-ES')}</p>` : ''}
      <p>Quedamos a su disposición para cualquier consulta.</p>
      <p>Atentamente,</p>
    `;

    try {
      // Enviar email (sin PDF por ahora, se puede agregar después)
      await sendEmail({
        to: emailDestino,
        subject: asunto,
        html: mensaje,
      });

      // Actualizar factura
      factura.fechaEnvio = new Date();
      factura.contadorEnvios = (factura.contadorEnvios || 0) + 1;

      // Si está emitida, cambiar a enviada
      if (factura.estado === EstadoFactura.EMITIDA) {
        factura.estado = EstadoFactura.ENVIADA;
      }

      // Historial
      factura.historial.push({
        fecha: new Date(),
        usuarioId,
        accion: 'ENVIADA_EMAIL',
        descripcion: `Enviada por email a ${emailDestino}`,
      });

      factura.modificadoPor = usuarioId;
      factura.fechaModificacion = new Date();
      await factura.save();

      logInfo('Factura enviada por email', { codigo: factura.codigo, email: emailDestino });

      return {
        enviado: true,
        mensaje: `Factura enviada correctamente a ${emailDestino}`,
      };
    } catch (error: any) {
      logError('Error enviando factura por email', error);
      throw new Error(`Error al enviar email: ${error.message}`);
    }
  }

  // ============================================
  // ALERTAS DE FACTURAS
  // ============================================

  /**
   * Obtener alertas de facturas:
   * - Pendientes de cobro (emitidas, enviadas, parcialmente cobradas)
   * - Vencidas (fecha de vencimiento pasada)
   * - Próximas a vencer (vencen en los próximos X días)
   */
  async getAlertas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    diasAlerta: number = 7
  ): Promise<{
    alertas: {
      pendientesCobro: any[];
      vencidas: any[];
      proximasVencer: any[];
    };
    resumen: {
      pendientesCobro: number;
      vencidas: number;
      proximasVencer: number;
      total: number;
    };
  }> {
    const FacturaModel = await this.getModeloFactura(empresaId.toString(), dbConfig);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaAlerta = new Date();
    fechaAlerta.setDate(fechaAlerta.getDate() + diasAlerta);

    // Pendientes de cobro: emitidas, enviadas o parcialmente cobradas (no vencidas)
    const pendientesCobro = await FacturaModel.find({
      activo: true,
      estado: {
        $in: [
          EstadoFactura.EMITIDA,
          EstadoFactura.ENVIADA,
          EstadoFactura.PARCIALMENTE_COBRADA,
        ],
      },
      $or: [
        { fechaVencimiento: { $gte: hoy } },
        { fechaVencimiento: { $exists: false } },
        { fechaVencimiento: null },
      ],
    })
      .populate('clienteId', 'nombre nombreComercial')
      .sort({ fechaVencimiento: 1, fecha: 1 })
      .limit(50)
      .lean();

    // Vencidas: fecha de vencimiento pasada y no cobradas
    const vencidas = await FacturaModel.find({
      activo: true,
      estado: {
        $in: [
          EstadoFactura.VENCIDA,
          EstadoFactura.IMPAGADA,
          EstadoFactura.EMITIDA,
          EstadoFactura.ENVIADA,
          EstadoFactura.PARCIALMENTE_COBRADA,
        ],
      },
      fechaVencimiento: { $lt: hoy },
    })
      .populate('clienteId', 'nombre nombreComercial')
      .sort({ fechaVencimiento: 1 })
      .limit(50)
      .lean();

    // Próximas a vencer: vencen en los próximos X días
    const proximasVencer = await FacturaModel.find({
      activo: true,
      estado: {
        $in: [
          EstadoFactura.EMITIDA,
          EstadoFactura.ENVIADA,
          EstadoFactura.PARCIALMENTE_COBRADA,
        ],
      },
      fechaVencimiento: {
        $gte: hoy,
        $lte: fechaAlerta,
      },
    })
      .populate('clienteId', 'nombre nombreComercial')
      .sort({ fechaVencimiento: 1 })
      .limit(50)
      .lean();

    // Formatear datos para el frontend
    const formatFactura = (f: any) => ({
      _id: f._id,
      codigo: f.codigo,
      clienteNombre:
        f.clienteId?.nombreComercial ||
        f.clienteId?.nombre ||
        f.clienteNombre ||
        'Sin cliente',
      fecha: f.fecha,
      fechaVencimiento: f.fechaVencimiento,
      estado: f.estado,
      totales: f.totales,
      importePendiente: (f.totales?.totalFactura || 0) - (f.totales?.totalCobrado || 0),
    });

    return {
      alertas: {
        pendientesCobro: pendientesCobro.map(formatFactura),
        vencidas: vencidas.map(formatFactura),
        proximasVencer: proximasVencer.map(formatFactura),
      },
      resumen: {
        pendientesCobro: pendientesCobro.length,
        vencidas: vencidas.length,
        proximasVencer: proximasVencer.length,
        total: pendientesCobro.length + vencidas.length,
      },
    };
  }
}

export default new FacturasService();
