// apps/backend/src/modules/facturas/facturas-pdf.service.ts
// Servicio para generación de PDFs de facturas

import {
  DocumentoPDFBaseService,
  DatosDocumento,
  DatosCliente,
  LineaDocumento,
  TotalesDocumento,
  OpcionesImpresion,
  defaultOpcionesImpresion,
} from '@/modules/plantillas-documento/documento-pdf-base.service';
import { TipoDocumentoPlantilla } from '@/modules/plantillas-documento/PlantillaDocumento';
import { IFactura, TipoLinea, IVencimiento, MetodoPago } from './Factura';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';

// ============================================
// INTERFACES ESPECÍFICAS DE FACTURA
// ============================================

export interface OpcionesImpresionFactura extends OpcionesImpresion {
  mostrarVencimientos?: boolean;
  mostrarQRVerifactu?: boolean;
  mostrarFacturasRectificadas?: boolean;
}

// ============================================
// SERVICIO PDF FACTURAS
// ============================================

class FacturasPDFService extends DocumentoPDFBaseService {
  /**
   * Genera un PDF de la factura
   */
  async generarPDF(
    dbConfig: IDatabaseConfig,
    factura: IFactura,
    opciones: OpcionesImpresionFactura = {}
  ): Promise<Buffer> {
    const opts = { ...defaultOpcionesImpresion, ...opciones };

    // Extraer empresaId de la factura
    const empresaId = String(factura.empresaId);

    try {
      // Inicializar documento con la configuración de base de datos
      await this.inicializarDocumento(
        empresaId,
        TipoDocumentoPlantilla.FACTURA,
        dbConfig,
        opts.plantillaId
      );

      // Renderizar cabecera
      this.renderizarCabecera('FACTURA', this.extraerDatosDocumento(factura));

      // Renderizar datos del cliente
      this.renderizarCliente(this.extraerDatosCliente(factura));

      // Si es rectificativa, mostrar referencia
      if (factura.esRectificativa && factura.facturaRectificadaCodigo) {
        this.renderizarInfoRectificativa(factura);
      }

      // Título de factura
      if (factura.titulo) {
        this.doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(this.colores.texto)
           .text(this.truncarTexto(factura.titulo, 80), 40, this.y);
        this.y += 15;
      }

      // Renderizar líneas
      this.renderizarLineas(this.extraerLineas(factura), opts);

      // Renderizar totales
      this.renderizarTotales(this.extraerTotales(factura));

      // Renderizar vencimientos
      if (opts.mostrarVencimientos && factura.vencimientos && factura.vencimientos.length > 0) {
        this.renderizarVencimientos(factura.vencimientos);
      }

      // Condiciones de pago
      const textoCondiciones = factura.condicionesPago ||
        this.empresa?.textosLegales?.facturaPiePagina ||
        this.empresa?.textosLegales?.condicionesVenta;

      opts.textoCondiciones = textoCondiciones;

      // QR VeriFactu
      if (opts.mostrarQRVerifactu && factura.verifactu?.urlQR) {
        await this.renderizarQRVerifactu(factura);
      }

      // Renderizar pie
      this.renderizarPie(opts);

      // Finalizar y retornar buffer
      return await this.finalizarDocumento();
    } catch (error) {
      console.error('Error generando PDF de factura:', error);
      throw error;
    }
  }

  /**
   * Extrae los datos del documento
   */
  private extraerDatosDocumento(factura: IFactura): DatosDocumento {
    return {
      codigo: factura.codigo,
      serie: factura.serie,
      numero: factura.numero,
      fecha: factura.fecha,
      fechaVencimiento: factura.fechaVencimiento,
      titulo: factura.titulo,
    };
  }

  /**
   * Extrae los datos del cliente
   */
  private extraerDatosCliente(factura: IFactura): DatosCliente {
    return {
      nombre: factura.clienteNombre,
      nif: factura.clienteNif,
      direccion: factura.direccionFacturacion ? {
        calle: factura.direccionFacturacion.calle,
        numero: factura.direccionFacturacion.numero,
        codigoPostal: factura.direccionFacturacion.codigoPostal,
        ciudad: factura.direccionFacturacion.ciudad,
        provincia: factura.direccionFacturacion.provincia,
        pais: factura.direccionFacturacion.pais,
      } : undefined,
      email: factura.clienteEmail,
      telefono: factura.clienteTelefono,
    };
  }

  /**
   * Extrae las líneas para el PDF
   */
  private extraerLineas(factura: IFactura): LineaDocumento[] {
    if (!factura.lineas) return [];

    return factura.lineas.map((linea, index) => ({
      orden: linea.orden || index + 1,
      tipo: linea.tipo as 'producto' | 'servicio' | 'kit' | 'texto' | 'subtotal' | 'descuento',
      codigo: linea.codigo,
      nombre: linea.nombre,
      descripcion: linea.descripcion,
      cantidad: linea.cantidad,
      unidad: linea.unidad,
      precioUnitario: linea.precioUnitario,
      descuento: linea.descuento,
      iva: linea.iva,
      subtotal: linea.subtotal,
    }));
  }

  /**
   * Extrae los totales para el PDF
   */
  private extraerTotales(factura: IFactura): TotalesDocumento {
    return {
      subtotalBruto: factura.totales?.subtotalBruto || 0,
      totalDescuentos: factura.totales?.totalDescuentos || 0,
      subtotalNeto: factura.totales?.subtotalNeto || 0,
      desgloseIva: factura.totales?.desgloseIva?.map(iva => ({
        tipo: iva.tipo,
        base: iva.base,
        cuota: iva.cuota,
        recargo: iva.recargo,
        cuotaRecargo: iva.cuotaRecargo,
      })) || [],
      totalIva: factura.totales?.totalIva || 0,
      totalRecargoEquivalencia: factura.totales?.totalRecargoEquivalencia || 0,
      total: factura.totales?.totalFactura || 0,
    };
  }

  /**
   * Renderiza información de factura rectificativa
   */
  private renderizarInfoRectificativa(factura: IFactura): void {
    this.doc.fillColor(this.colores.alerta)
       .rect(40, this.y, 515, 25)
       .fill();

    this.doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text(`FACTURA RECTIFICATIVA de ${factura.facturaRectificadaCodigo}`, 50, this.y + 7);

    if (factura.motivoRectificacion) {
      this.doc.fontSize(8)
         .font('Helvetica')
         .text(`Motivo: ${factura.motivoRectificacion}`, 350, this.y + 8);
    }

    this.y += 30;
  }

  /**
   * Renderiza los vencimientos de pago
   */
  private renderizarVencimientos(vencimientos: IVencimiento[]): void {
    if (this.y > this.contentBottom - 60) {
      this.doc.addPage();
      this.y = 40;
    }

    this.doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text('Vencimientos de pago:', 40, this.y);
    this.y += 15;

    const tableLeft = 40;
    const tableWidth = 300;
    const rowHeight = 14;

    // Header
    this.doc.fillColor(this.colores.primario)
       .rect(tableLeft, this.y, tableWidth, 16)
       .fill();

    this.doc.fillColor('#FFFFFF')
       .fontSize(7)
       .font('Helvetica-Bold')
       .text('Nº', tableLeft + 5, this.y + 4)
       .text('Fecha', tableLeft + 30, this.y + 4)
       .text('Importe', tableLeft + 100, this.y + 4, { width: 60, align: 'right' })
       .text('Forma Pago', tableLeft + 170, this.y + 4)
       .text('Estado', tableLeft + 250, this.y + 4);

    this.y += 16;

    // Filas
    for (const venc of vencimientos) {
      if (this.y + rowHeight > this.contentBottom) break;

      this.doc.fillColor(this.colores.texto)
         .fontSize(7)
         .font('Helvetica')
         .text(String(venc.numero), tableLeft + 5, this.y + 3)
         .text(this.formatearFecha(venc.fecha), tableLeft + 30, this.y + 3)
         .text(this.formatearMoneda(venc.importe), tableLeft + 100, this.y + 3, { width: 60, align: 'right' })
         .text(this.traducirMetodoPago(venc.metodoPago), tableLeft + 170, this.y + 3);

      // Estado con color
      const estadoColor = venc.cobrado ? this.colores.exito : this.colores.textoClaro;
      const estadoTexto = venc.cobrado ? 'Cobrado' : 'Pendiente';
      this.doc.fillColor(estadoColor).text(estadoTexto, tableLeft + 250, this.y + 3);

      this.doc.strokeColor(this.colores.borde)
         .lineWidth(0.5)
         .moveTo(tableLeft, this.y + rowHeight)
         .lineTo(tableLeft + tableWidth, this.y + rowHeight)
         .stroke();

      this.y += rowHeight;
    }

    this.y += 15;
  }

  /**
   * Renderiza el QR de VeriFactu
   */
  private async renderizarQRVerifactu(factura: IFactura): Promise<void> {
    if (!factura.verifactu?.datosQR) return;

    if (this.y > this.contentBottom - 80) {
      this.doc.addPage();
      this.y = 40;
    }

    const qrX = 455;
    const qrY = this.y;

    // Renderizar QR
    await this.renderizarQR(factura.verifactu.datosQR, qrX, qrY, 60);

    // Texto debajo del QR
    this.doc.fontSize(5)
       .fillColor(this.colores.textoClaro)
       .text('Verificar factura', qrX, qrY + 62, { width: 60, align: 'center' });

    // ID de VeriFactu
    if (factura.verifactu.idFactura) {
      this.doc.fontSize(4)
         .text(`ID: ${factura.verifactu.idFactura.substring(0, 20)}...`, qrX, qrY + 72, { width: 60, align: 'center' });
    }
  }

  /**
   * Traduce el método de pago
   */
  private traducirMetodoPago(metodo: MetodoPago): string {
    const traducciones: Record<MetodoPago, string> = {
      [MetodoPago.EFECTIVO]: 'Efectivo',
      [MetodoPago.TRANSFERENCIA]: 'Transferencia',
      [MetodoPago.TARJETA]: 'Tarjeta',
      [MetodoPago.DOMICILIACION]: 'Domiciliación',
      [MetodoPago.CHEQUE]: 'Cheque',
      [MetodoPago.PAGARE]: 'Pagaré',
      [MetodoPago.CONFIRMING]: 'Confirming',
      [MetodoPago.COMPENSACION]: 'Compensación',
    };
    return traducciones[metodo] || metodo;
  }
}

export const facturasPDFService = new FacturasPDFService();
export default facturasPDFService;
