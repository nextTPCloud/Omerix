// apps/backend/src/modules/tpv/ticket-pdf.service.ts
// Servicio para generación de tickets de TPV (impresoras térmicas)

import PDFDocument from 'pdfkit';
import axios from 'axios';
import { IEmpresa } from '@/modules/empresa/Empresa';
import Empresa from '@/modules/empresa/Empresa';

// ============================================
// INTERFACES
// ============================================

export interface LineaTicket {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  descuento?: number;
  iva?: number;
}

export interface DatosTicket {
  codigo: string;
  fecha: Date;
  serie?: string;
  numero?: number;
  tpvNombre?: string;
  cajeroNombre?: string;
  clienteNombre?: string;
  clienteNif?: string;
}

export interface TotalesTicket {
  subtotal: number;
  descuentos: number;
  totalIva: number;
  total: number;
  desgloseIva?: {
    tipo: number;
    base: number;
    cuota: number;
  }[];
}

export interface PagoTicket {
  metodoPago: string;
  importe: number;
  cambio?: number;
}

export interface DatosVerifactu {
  idFactura?: string;
  hash?: string;
  urlQR?: string;
  datosQR?: string;
}

export interface OpcionesTicket {
  anchoMm?: number;  // Ancho del papel en mm (58, 80)
  mostrarLogo?: boolean;
  mostrarNif?: boolean;
  mostrarDireccion?: boolean;
  mostrarTelefono?: boolean;
  mostrarQRVerifactu?: boolean;
  mostrarDesglosePago?: boolean;
  mostrarDetalleIva?: boolean;
  textoPie?: string;
}

export const defaultOpcionesTicket: OpcionesTicket = {
  anchoMm: 80,
  mostrarLogo: false, // Los logos en tickets térmicos no siempre se ven bien
  mostrarNif: true,
  mostrarDireccion: true,
  mostrarTelefono: true,
  mostrarQRVerifactu: true,
  mostrarDesglosePago: true,
  mostrarDetalleIva: true,
};

// ============================================
// SERVICIO TICKET PDF
// ============================================

class TicketPDFService {
  private doc!: PDFKit.PDFDocument;
  private empresa: IEmpresa | null = null;
  private y: number = 10;
  private anchoDoc: number = 226; // 80mm en puntos (80/25.4*72)
  private margen: number = 10;
  private anchoContenido: number = 206;

  /**
   * Genera un ticket en formato PDF para impresora térmica
   */
  async generarTicket(
    lineas: LineaTicket[],
    datos: DatosTicket,
    totales: TotalesTicket,
    pagos: PagoTicket[],
    empresaId: string,
    verifactu?: DatosVerifactu,
    opciones: OpcionesTicket = {}
  ): Promise<Buffer> {
    const opts = { ...defaultOpcionesTicket, ...opciones };

    // Cargar empresa
    this.empresa = await Empresa.findById(empresaId).lean() as IEmpresa | null;

    // Calcular ancho del documento según papel
    this.anchoDoc = opts.anchoMm === 58 ? 165 : 226; // 58mm o 80mm
    this.anchoContenido = this.anchoDoc - (this.margen * 2);

    // Calcular altura estimada del documento
    const alturaEstimada = this.calcularAlturaEstimada(lineas, opts, verifactu);

    // Crear documento PDF con tamaño personalizado
    this.doc = new PDFDocument({
      size: [this.anchoDoc, alturaEstimada],
      margin: this.margen,
      bufferPages: true,
    });

    this.y = this.margen;

    try {
      // Cabecera de empresa
      this.renderizarCabeceraEmpresa(opts);

      // Línea separadora
      this.renderizarLinea();

      // Datos del ticket
      this.renderizarDatosTicket(datos);

      // Cliente (si existe)
      if (datos.clienteNombre) {
        this.renderizarCliente(datos);
      }

      // Línea separadora
      this.renderizarLinea();

      // Líneas de productos
      this.renderizarLineas(lineas);

      // Línea separadora
      this.renderizarLinea();

      // Totales
      this.renderizarTotales(totales, opts);

      // Desglose de IVA
      if (opts.mostrarDetalleIva && totales.desgloseIva && totales.desgloseIva.length > 0) {
        this.renderizarDesgloseIva(totales.desgloseIva);
      }

      // Línea separadora
      this.renderizarLinea();

      // Pagos
      this.renderizarPagos(pagos, opts);

      // Línea separadora
      this.renderizarLinea();

      // QR VeriFactu
      if (opts.mostrarQRVerifactu && verifactu?.datosQR) {
        await this.renderizarQRVerifactu(verifactu);
      }

      // Pie de ticket
      this.renderizarPie(opts);

      // Finalizar
      return await this.finalizarDocumento();
    } catch (error) {
      console.error('Error generando ticket:', error);
      throw error;
    }
  }

  /**
   * Calcula la altura estimada del documento
   */
  private calcularAlturaEstimada(
    lineas: LineaTicket[],
    opts: OpcionesTicket,
    verifactu?: DatosVerifactu
  ): number {
    let altura = 100; // Cabecera básica
    altura += lineas.length * 25; // Líneas de productos
    altura += 80; // Totales
    altura += 50; // Pagos
    if (opts.mostrarQRVerifactu && verifactu?.datosQR) {
      altura += 100; // QR
    }
    altura += 60; // Pie
    return Math.max(altura, 200);
  }

  /**
   * Renderiza la cabecera de la empresa
   */
  private renderizarCabeceraEmpresa(opts: OpcionesTicket): void {
    const centro = this.anchoDoc / 2;

    // Nombre de empresa
    this.doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(
         this.empresa?.nombreComercial || this.empresa?.nombre || 'EMPRESA',
         this.margen,
         this.y,
         { width: this.anchoContenido, align: 'center' }
       );
    this.y += 15;

    this.doc.fontSize(8).font('Helvetica');

    // NIF
    if (opts.mostrarNif && this.empresa?.nif) {
      this.doc.text(`CIF/NIF: ${this.empresa.nif}`, this.margen, this.y, {
        width: this.anchoContenido,
        align: 'center',
      });
      this.y += 10;
    }

    // Dirección
    if (opts.mostrarDireccion && this.empresa?.direccion) {
      const direccion = [
        this.empresa.direccion.calle,
        this.empresa.direccion.codigoPostal,
        this.empresa.direccion.ciudad,
      ].filter(Boolean).join(', ');

      if (direccion) {
        this.doc.text(direccion, this.margen, this.y, {
          width: this.anchoContenido,
          align: 'center',
        });
        this.y += 10;
      }
    }

    // Teléfono
    if (opts.mostrarTelefono && this.empresa?.telefono) {
      this.doc.text(`Tel: ${this.empresa.telefono}`, this.margen, this.y, {
        width: this.anchoContenido,
        align: 'center',
      });
      this.y += 10;
    }
  }

  /**
   * Renderiza los datos del ticket
   */
  private renderizarDatosTicket(datos: DatosTicket): void {
    this.doc.fontSize(8).font('Helvetica');

    // Código y fecha en la misma línea
    const fechaFormateada = this.formatearFechaHora(datos.fecha);
    this.doc.text(`Ticket: ${datos.codigo}`, this.margen, this.y);
    this.doc.text(fechaFormateada, this.margen, this.y, {
      width: this.anchoContenido,
      align: 'right',
    });
    this.y += 10;

    // TPV y cajero
    if (datos.tpvNombre || datos.cajeroNombre) {
      const info = [
        datos.tpvNombre ? `TPV: ${datos.tpvNombre}` : '',
        datos.cajeroNombre ? `Cajero: ${datos.cajeroNombre}` : '',
      ].filter(Boolean).join('  ');
      this.doc.text(info, this.margen, this.y);
      this.y += 10;
    }
  }

  /**
   * Renderiza datos del cliente
   */
  private renderizarCliente(datos: DatosTicket): void {
    this.doc.fontSize(8).font('Helvetica');
    this.doc.text(`Cliente: ${datos.clienteNombre}`, this.margen, this.y);
    this.y += 10;

    if (datos.clienteNif) {
      this.doc.text(`NIF: ${datos.clienteNif}`, this.margen, this.y);
      this.y += 10;
    }
  }

  /**
   * Renderiza las líneas de productos
   */
  private renderizarLineas(lineas: LineaTicket[]): void {
    this.doc.fontSize(8).font('Helvetica');

    for (const linea of lineas) {
      // Nombre del producto
      const nombreTruncado = linea.nombre.length > 30
        ? linea.nombre.substring(0, 27) + '...'
        : linea.nombre;

      this.doc.font('Helvetica-Bold')
         .text(nombreTruncado, this.margen, this.y);
      this.y += 10;

      // Cantidad x Precio = Subtotal
      this.doc.font('Helvetica');
      const detalleLinea = `${linea.cantidad} x ${this.formatearMoneda(linea.precioUnitario)}`;
      this.doc.text(detalleLinea, this.margen + 10, this.y);

      // Subtotal a la derecha
      this.doc.text(this.formatearMoneda(linea.subtotal), this.margen, this.y, {
        width: this.anchoContenido,
        align: 'right',
      });
      this.y += 10;

      // Descuento si aplica
      if (linea.descuento && linea.descuento > 0) {
        this.doc.fontSize(7)
           .text(`  Dto: -${linea.descuento}%`, this.margen + 10, this.y);
        this.y += 8;
      }

      this.y += 2; // Espacio entre líneas
    }
  }

  /**
   * Renderiza los totales
   */
  private renderizarTotales(totales: TotalesTicket, opts: OpcionesTicket): void {
    this.doc.fontSize(9).font('Helvetica');

    // Subtotal
    this.renderizarLineaTotal('Subtotal:', totales.subtotal);

    // Descuentos
    if (totales.descuentos > 0) {
      this.renderizarLineaTotal('Descuentos:', -totales.descuentos);
    }

    // IVA
    this.renderizarLineaTotal('IVA:', totales.totalIva);

    // TOTAL (destacado)
    this.y += 5;
    this.doc.fontSize(12).font('Helvetica-Bold');
    this.doc.text('TOTAL:', this.margen, this.y);
    this.doc.text(this.formatearMoneda(totales.total), this.margen, this.y, {
      width: this.anchoContenido,
      align: 'right',
    });
    this.y += 15;
  }

  /**
   * Renderiza el desglose de IVA
   */
  private renderizarDesgloseIva(desgloseIva: { tipo: number; base: number; cuota: number }[]): void {
    this.doc.fontSize(7).font('Helvetica');

    this.doc.text('Desglose IVA:', this.margen, this.y);
    this.y += 8;

    for (const iva of desgloseIva) {
      const texto = `${iva.tipo}%: Base ${this.formatearMoneda(iva.base)} - Cuota ${this.formatearMoneda(iva.cuota)}`;
      this.doc.text(texto, this.margen + 5, this.y, {
        width: this.anchoContenido - 5,
      });
      this.y += 8;
    }

    this.y += 5;
  }

  /**
   * Renderiza los pagos
   */
  private renderizarPagos(pagos: PagoTicket[], opts: OpcionesTicket): void {
    this.doc.fontSize(9).font('Helvetica');

    this.doc.text('FORMA DE PAGO:', this.margen, this.y);
    this.y += 12;

    for (const pago of pagos) {
      this.doc.text(this.traducirMetodoPago(pago.metodoPago), this.margen + 5, this.y);
      this.doc.text(this.formatearMoneda(pago.importe), this.margen, this.y, {
        width: this.anchoContenido,
        align: 'right',
      });
      this.y += 10;
    }

    // Cambio
    const totalPagado = pagos.reduce((sum, p) => sum + p.importe, 0);
    const cambio = pagos.find(p => p.cambio !== undefined)?.cambio;
    if (cambio && cambio > 0) {
      this.doc.font('Helvetica-Bold');
      this.doc.text('CAMBIO:', this.margen + 5, this.y);
      this.doc.text(this.formatearMoneda(cambio), this.margen, this.y, {
        width: this.anchoContenido,
        align: 'right',
      });
      this.y += 12;
    }
  }

  /**
   * Renderiza el QR de VeriFactu
   */
  private async renderizarQRVerifactu(verifactu: DatosVerifactu): Promise<void> {
    if (!verifactu.datosQR) return;

    try {
      const QRCode = await import('qrcode');

      const qrSize = 70;
      const qrX = (this.anchoDoc - qrSize) / 2;

      const qrBuffer = await QRCode.toBuffer(verifactu.datosQR, {
        type: 'png',
        width: qrSize,
        margin: 1,
      });

      this.doc.image(qrBuffer, qrX, this.y, { width: qrSize });
      this.y += qrSize + 5;

      // Texto debajo del QR
      this.doc.fontSize(6)
         .font('Helvetica')
         .text('Verificar factura', this.margen, this.y, {
           width: this.anchoContenido,
           align: 'center',
         });
      this.y += 8;

      if (verifactu.idFactura) {
        this.doc.text(`ID: ${verifactu.idFactura.substring(0, 30)}`, this.margen, this.y, {
          width: this.anchoContenido,
          align: 'center',
        });
        this.y += 8;
      }

      if (verifactu.hash) {
        this.doc.text(`Hash: ${verifactu.hash.substring(0, 20)}...`, this.margen, this.y, {
          width: this.anchoContenido,
          align: 'center',
        });
        this.y += 8;
      }
    } catch (error) {
      console.error('Error generando QR:', error);
    }
  }

  /**
   * Renderiza el pie del ticket
   */
  private renderizarPie(opts: OpcionesTicket): void {
    this.doc.fontSize(8).font('Helvetica');

    // Texto de agradecimiento
    this.doc.text('¡GRACIAS POR SU COMPRA!', this.margen, this.y, {
      width: this.anchoContenido,
      align: 'center',
    });
    this.y += 10;

    // Texto personalizado
    if (opts.textoPie) {
      this.doc.fontSize(6)
         .text(opts.textoPie, this.margen, this.y, {
           width: this.anchoContenido,
           align: 'center',
         });
      this.y += 10;
    }

    // Texto legal (LOPD resumido)
    if (this.empresa?.textosLegales?.textoLOPD) {
      this.doc.fontSize(5)
         .text(
           this.empresa.textosLegales.textoLOPD.substring(0, 150) + '...',
           this.margen,
           this.y,
           { width: this.anchoContenido, align: 'center' }
         );
      this.y += 15;
    }

    // Línea final decorativa
    this.renderizarLineaDoble();
  }

  /**
   * Renderiza una línea de total
   */
  private renderizarLineaTotal(etiqueta: string, valor: number): void {
    this.doc.text(etiqueta, this.margen, this.y);
    this.doc.text(this.formatearMoneda(valor), this.margen, this.y, {
      width: this.anchoContenido,
      align: 'right',
    });
    this.y += 12;
  }

  /**
   * Renderiza una línea separadora simple
   */
  private renderizarLinea(): void {
    this.y += 3;
    this.doc.strokeColor('#000000')
       .lineWidth(0.5)
       .moveTo(this.margen, this.y)
       .lineTo(this.anchoDoc - this.margen, this.y)
       .stroke();
    this.y += 8;
  }

  /**
   * Renderiza una línea separadora doble
   */
  private renderizarLineaDoble(): void {
    this.y += 3;
    this.doc.strokeColor('#000000')
       .lineWidth(0.5)
       .moveTo(this.margen, this.y)
       .lineTo(this.anchoDoc - this.margen, this.y)
       .stroke()
       .moveTo(this.margen, this.y + 2)
       .lineTo(this.anchoDoc - this.margen, this.y + 2)
       .stroke();
    this.y += 8;
  }

  /**
   * Formatea fecha y hora
   */
  private formatearFechaHora(fecha: Date): string {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Formatea moneda
   */
  private formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(valor || 0);
  }

  /**
   * Traduce el método de pago
   */
  private traducirMetodoPago(metodo: string): string {
    const traducciones: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
      bizum: 'Bizum',
      vale: 'Vale',
      mixto: 'Mixto',
    };
    return traducciones[metodo.toLowerCase()] || metodo;
  }

  /**
   * Finaliza y retorna el buffer del PDF
   */
  private finalizarDocumento(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);
      this.doc.end();
    });
  }
}

export const ticketPDFService = new TicketPDFService();
export default ticketPDFService;
