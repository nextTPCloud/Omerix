import mongoose from 'mongoose';
import FacturaSuscripcion, {
  IFacturaSuscripcion,
  EstadoFacturaSuscripcion,
  ConceptoFacturaSuscripcion,
  ILineaFacturaSuscripcion,
} from './FacturaSuscripcion';
import Pago, { IPago } from './Pago';
import Empresa from '../empresa/Empresa';
import Licencia from '../licencias/Licencia';
import Plan from '../licencias/Plan';
import { TRALOK_EMPRESA_DATA } from '../../scripts/seed-tralok-empresa';
import { sendEmail, emailTemplates } from '../../utils/email';

/**
 * Servicio para gestión de facturas de suscripción
 *
 * Genera facturas cuando:
 * - Se procesa un pago de suscripción
 * - Se hace upgrade de plan
 * - Se añaden add-ons
 */
export class FacturacionSuscripcionService {
  private static IVA_PORCENTAJE = 21;

  /**
   * Obtener la empresa Tralok (emisor de facturas)
   */
  private async getEmpresaTralok() {
    const tralok = await Empresa.findOne({ esPlatforma: true });

    if (!tralok) {
      throw new Error(
        'Empresa Tralok no encontrada. Ejecutar seed-tralok-empresa.ts'
      );
    }

    return tralok;
  }

  /**
   * Obtener siguiente número de factura
   */
  private async getNextNumeroFactura(serie: string = 'FS'): Promise<number> {
    const ultimaFactura = await FacturaSuscripcion.findOne({ serie })
      .sort({ numero: -1 })
      .select('numero');

    return (ultimaFactura?.numero || 0) + 1;
  }

  /**
   * Calcular línea de factura con IVA
   */
  private calcularLinea(
    concepto: ConceptoFacturaSuscripcion,
    descripcion: string,
    precioUnitario: number,
    cantidad: number = 1,
    descuentoPorcentaje: number = 0,
    ivaPorcentaje: number = FacturacionSuscripcionService.IVA_PORCENTAJE
  ): ILineaFacturaSuscripcion {
    const precioConDescuento =
      precioUnitario * (1 - descuentoPorcentaje / 100);
    const subtotal = precioConDescuento * cantidad;
    const ivaImporte = subtotal * (ivaPorcentaje / 100);
    const total = subtotal + ivaImporte;

    return {
      concepto,
      descripcion,
      cantidad,
      precioUnitario,
      descuento: descuentoPorcentaje,
      iva: ivaPorcentaje,
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Generar factura para un pago de suscripción
   */
  async generarFacturaPago(pagoId: string): Promise<IFacturaSuscripcion> {
    // Obtener el pago
    const pago = await Pago.findById(pagoId);
    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    if (pago.estado !== 'completado') {
      throw new Error('El pago no está completado');
    }

    // Verificar que no exista ya una factura para este pago
    const facturaExistente = await FacturaSuscripcion.findOne({ pagoId });
    if (facturaExistente) {
      return facturaExistente;
    }

    // Obtener datos necesarios
    const [tralok, empresaCliente, licencia] = await Promise.all([
      this.getEmpresaTralok(),
      Empresa.findById(pago.empresaId),
      Licencia.findOne({ empresaId: pago.empresaId }).populate('planId'),
    ]);

    if (!empresaCliente) {
      throw new Error('Empresa cliente no encontrada');
    }

    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const plan = licencia.planId as any;

    // Determinar concepto y descripción
    let concepto: ConceptoFacturaSuscripcion;
    let descripcion: string;

    switch (pago.concepto) {
      case 'suscripcion':
        concepto =
          licencia.tipoSuscripcion === 'anual'
            ? ConceptoFacturaSuscripcion.SUSCRIPCION_ANUAL
            : ConceptoFacturaSuscripcion.SUSCRIPCION_MENSUAL;
        descripcion = `Suscripción ${licencia.tipoSuscripcion} - Plan ${plan.nombre}`;
        break;
      case 'upgrade':
        concepto = ConceptoFacturaSuscripcion.UPGRADE;
        descripcion = pago.descripcion || `Upgrade de plan - ${plan.nombre}`;
        break;
      case 'addon':
        concepto = ConceptoFacturaSuscripcion.ADDON;
        descripcion = pago.descripcion || 'Módulo adicional';
        break;
      default:
        concepto = ConceptoFacturaSuscripcion.OTRO;
        descripcion = pago.descripcion || 'Servicio Tralok';
    }

    // Crear línea de factura
    const linea = this.calcularLinea(
      concepto,
      descripcion,
      pago.cantidad,
      1,
      0,
      FacturacionSuscripcionService.IVA_PORCENTAJE
    );

    // Calcular período de facturación
    const periodoInicio = licencia.fechaInicio || new Date();
    const periodoFin = licencia.fechaRenovacion || new Date();

    // Generar número de factura
    const serie = 'FS';
    const numero = await this.getNextNumeroFactura(serie);

    // Crear factura
    const factura = await FacturaSuscripcion.create({
      serie,
      numero,
      numeroFactura: `${serie}-${String(numero).padStart(6, '0')}`,

      // Emisor (Tralok)
      emisor: {
        empresaId: tralok._id,
        nombre: tralok.nombre,
        nif: tralok.nif,
        direccion: tralok.direccion?.calle || TRALOK_EMPRESA_DATA.direccion.calle,
        ciudad: tralok.direccion?.ciudad || TRALOK_EMPRESA_DATA.direccion.ciudad,
        codigoPostal:
          tralok.direccion?.codigoPostal ||
          TRALOK_EMPRESA_DATA.direccion.codigoPostal,
        pais: tralok.direccion?.pais || 'España',
        email: tralok.email,
        telefono: tralok.telefono,
      },

      // Cliente
      cliente: {
        empresaId: empresaCliente._id,
        nombre: empresaCliente.nombre,
        nif: empresaCliente.nif,
        direccion: empresaCliente.direccion?.calle,
        ciudad: empresaCliente.direccion?.ciudad,
        codigoPostal: empresaCliente.direccion?.codigoPostal,
        pais: empresaCliente.direccion?.pais || 'España',
        email: empresaCliente.email,
      },

      // Fechas
      fechaEmision: new Date(),
      fechaVencimiento: new Date(), // Ya está pagada
      fechaPago: pago.fechaPago || new Date(),

      // Período
      periodoInicio,
      periodoFin,

      // Plan
      planId: plan._id,
      planNombre: plan.nombre,
      licenciaId: licencia._id,
      tipoSuscripcion: licencia.tipoSuscripcion,

      // Líneas
      lineas: [linea],

      // Totales
      subtotal: linea.subtotal,
      totalDescuentos: 0,
      totalIVA: linea.total - linea.subtotal,
      total: linea.total,
      moneda: pago.moneda || 'EUR',

      // Estado
      estado: EstadoFacturaSuscripcion.PAGADA,

      // Pago
      pagoId: pago._id,
      metodoPago: pago.metodoPago?.tipo,
      transaccionExternaId: pago.transaccionExternaId,
    });

    // Actualizar el pago con la referencia a la factura
    await Pago.findByIdAndUpdate(pagoId, {
      facturaId: factura._id,
      numeroFactura: factura.numeroFactura,
    });

    console.log(`✅ Factura de suscripción generada: ${factura.numeroFactura}`);

    return factura;
  }

  /**
   * Obtener facturas de una empresa
   */
  async getFacturasEmpresa(
    empresaId: string,
    filtros?: {
      estado?: EstadoFacturaSuscripcion;
      desde?: Date;
      hasta?: Date;
      limit?: number;
    }
  ): Promise<IFacturaSuscripcion[]> {
    const query: any = { 'cliente.empresaId': empresaId };

    if (filtros?.estado) {
      query.estado = filtros.estado;
    }

    if (filtros?.desde || filtros?.hasta) {
      query.fechaEmision = {};
      if (filtros?.desde) query.fechaEmision.$gte = filtros.desde;
      if (filtros?.hasta) query.fechaEmision.$lte = filtros.hasta;
    }

    return FacturaSuscripcion.find(query)
      .sort({ fechaEmision: -1 })
      .limit(filtros?.limit || 50);
  }

  /**
   * Obtener una factura por ID
   */
  async getFacturaById(facturaId: string): Promise<IFacturaSuscripcion | null> {
    return FacturaSuscripcion.findById(facturaId);
  }

  /**
   * Obtener factura por número
   */
  async getFacturaByNumero(
    numeroFactura: string
  ): Promise<IFacturaSuscripcion | null> {
    return FacturaSuscripcion.findOne({ numeroFactura });
  }

  /**
   * Marcar factura como pagada
   */
  async marcarComoPagada(
    facturaId: string,
    pagoId: string,
    transaccionId?: string
  ): Promise<IFacturaSuscripcion | null> {
    return FacturaSuscripcion.findByIdAndUpdate(
      facturaId,
      {
        estado: EstadoFacturaSuscripcion.PAGADA,
        fechaPago: new Date(),
        pagoId,
        transaccionExternaId: transaccionId,
      },
      { new: true }
    );
  }

  /**
   * Anular factura (genera rectificativa)
   */
  async anularFactura(
    facturaId: string,
    motivo: string
  ): Promise<IFacturaSuscripcion> {
    const facturaOriginal = await FacturaSuscripcion.findById(facturaId);

    if (!facturaOriginal) {
      throw new Error('Factura no encontrada');
    }

    if (facturaOriginal.estado === EstadoFacturaSuscripcion.ANULADA) {
      throw new Error('La factura ya está anulada');
    }

    // Marcar original como anulada
    facturaOriginal.estado = EstadoFacturaSuscripcion.ANULADA;
    await facturaOriginal.save();

    // Crear factura rectificativa
    const numero = await this.getNextNumeroFactura('FSR');

    const rectificativa = await FacturaSuscripcion.create({
      ...facturaOriginal.toObject(),
      _id: new mongoose.Types.ObjectId(),
      serie: 'FSR',
      numero,
      numeroFactura: `FSR-${String(numero).padStart(6, '0')}`,
      fechaEmision: new Date(),
      esRectificativa: true,
      facturaOriginalId: facturaOriginal._id,
      motivoRectificacion: motivo,
      estado: EstadoFacturaSuscripcion.EMITIDA,
      // Importes negativos
      subtotal: -facturaOriginal.subtotal,
      totalIVA: -facturaOriginal.totalIVA,
      total: -facturaOriginal.total,
      lineas: facturaOriginal.lineas.map((l) => ({
        ...l,
        subtotal: -l.subtotal,
        total: -l.total,
      })),
    });

    console.log(
      `✅ Factura rectificativa generada: ${rectificativa.numeroFactura}`
    );

    return rectificativa;
  }

  /**
   * Enviar factura por email
   */
  async enviarFacturaPorEmail(
    facturaId: string
  ): Promise<{ success: boolean; message: string }> {
    const factura = await FacturaSuscripcion.findById(facturaId);

    if (!factura) {
      return { success: false, message: 'Factura no encontrada' };
    }

    // Formatear fechas
    const formatDate = (date: Date) =>
      date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    const formatMoney = (amount: number) =>
      `${amount.toFixed(2)}€`;

    // Preparar datos para el email
    const emailHtml = emailTemplates.facturaSuscripcion({
      clienteNombre: factura.cliente.nombre,
      numeroFactura: factura.numeroFactura,
      fechaEmision: formatDate(factura.fechaEmision),
      planNombre: factura.planNombre,
      tipoSuscripcion: factura.tipoSuscripcion === 'anual' ? 'Anual' : 'Mensual',
      periodoInicio: formatDate(factura.periodoInicio),
      periodoFin: formatDate(factura.periodoFin),
      lineas: factura.lineas.map((l) => ({
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: formatMoney(l.precioUnitario),
        total: formatMoney(l.total),
      })),
      subtotal: formatMoney(factura.subtotal),
      totalIva: formatMoney(factura.totalIVA),
      total: formatMoney(factura.total),
      urlDescarga: factura.pdfUrl,
    });

    // Enviar email
    const result = await sendEmail(
      factura.cliente.email,
      `Factura ${factura.numeroFactura} - Tralok ERP`,
      emailHtml
    );

    if (result.success) {
      console.log(`Factura ${factura.numeroFactura} enviada a ${factura.cliente.email}`);
    }

    return result;
  }

  /**
   * Generar factura y enviar por email (proceso completo tras pago)
   */
  async procesarPagoCompletado(
    pagoId: string
  ): Promise<{ factura: IFacturaSuscripcion; emailEnviado: boolean }> {
    // Generar factura
    const factura = await this.generarFacturaPago(pagoId);

    // Enviar factura por email
    const emailResult = await this.enviarFacturaPorEmail(factura._id.toString());

    // También enviar confirmación de pago
    const licencia = await Licencia.findById(factura.licenciaId).populate('planId');
    if (licencia && factura.cliente.email) {
      const plan = licencia.planId as any;
      const formatDate = (date: Date) =>
        date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

      const confirmacionHtml = emailTemplates.pagoExitoso({
        clienteNombre: factura.cliente.nombre,
        planNombre: plan.nombre,
        total: `${factura.total.toFixed(2)}€`,
        proximaRenovacion: formatDate(licencia.fechaRenovacion),
        numeroFactura: factura.numeroFactura,
      });

      await sendEmail(
        factura.cliente.email,
        'Pago confirmado - Tralok ERP',
        confirmacionHtml
      );
    }

    return {
      factura,
      emailEnviado: emailResult.success,
    };
  }

  /**
   * Estadísticas de facturación
   */
  async getEstadisticas(periodo?: { desde: Date; hasta: Date }) {
    const match: any = {};

    if (periodo) {
      match.fechaEmision = {
        $gte: periodo.desde,
        $lte: periodo.hasta,
      };
    }

    const stats = await FacturaSuscripcion.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
    ]);

    const resultado: any = {
      totalFacturas: 0,
      totalFacturado: 0,
      porEstado: {},
    };

    stats.forEach((s) => {
      resultado.totalFacturas += s.count;
      resultado.totalFacturado += s.total;
      resultado.porEstado[s._id] = {
        count: s.count,
        total: s.total,
      };
    });

    return resultado;
  }
}

export const facturacionSuscripcionService = new FacturacionSuscripcionService();
