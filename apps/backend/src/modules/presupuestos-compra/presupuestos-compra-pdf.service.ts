import PDFDocument from 'pdfkit';
import axios from 'axios';
import { IPresupuestoCompra, TipoLineaPresupuestoCompra } from './PresupuestoCompra';
import { IEmpresa } from '@/models/Empresa';
import Empresa from '@/models/Empresa';

/**
 * ============================================
 * PRESUPUESTO COMPRA PDF SERVICE
 * ============================================
 * Servicio para generar PDFs de solicitudes de presupuesto a proveedores
 */

export interface PDFOptions {
  mostrarDescripcion?: 'ninguna' | 'corta' | 'larga';
  mostrarReferencias?: boolean;
  mostrarCondiciones?: boolean;
  mostrarFirmas?: boolean;
}

export const defaultPDFOptions: PDFOptions = {
  mostrarDescripcion: 'corta',
  mostrarReferencias: true,
  mostrarCondiciones: true,
  mostrarFirmas: true,
};

class PresupuestosCompraPDFService {
  /**
   * Carga una imagen desde URL y la convierte a buffer
   */
  private async loadImageFromUrl(url: string): Promise<Buffer | null> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 5000,
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error cargando imagen:', error);
      return null;
    }
  }

  /**
   * Trunca texto a un número máximo de caracteres
   */
  private truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Formatea un número como moneda
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  }

  /**
   * Formatea una fecha
   */
  private formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Genera un PDF de solicitud de presupuesto a proveedor
   */
  async generarPDF(
    presupuesto: IPresupuestoCompra,
    empresaId: string,
    options: PDFOptions = {}
  ): Promise<Buffer> {
    const opts = { ...defaultPDFOptions, ...options };

    // Obtener datos de la empresa
    const empresa = await Empresa.findById(empresaId).lean() as IEmpresa | null;

    // Cargar logo si existe
    let logoBuffer: Buffer | null = null;
    if (empresa?.logo) {
      logoBuffer = await this.loadImageFromUrl(empresa.logo);
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Colores
        const primaryColor = '#1F2937';
        const blueColor = '#3B82F6';
        const textColor = '#1F2937';
        const mutedColor = '#6B7280';
        const lightGray = '#F9FAFB';
        const borderColor = '#E5E7EB';

        const pageWidth = 515;
        const leftMargin = 40;
        let y = 40;

        // ============================================
        // CABECERA
        // ============================================

        // Logo
        if (logoBuffer) {
          try {
            doc.image(logoBuffer, leftMargin, y, { width: 120, height: 50 });
          } catch (e) {
            console.error('Error insertando logo:', e);
          }
        }

        // Datos empresa (derecha)
        doc.fontSize(10).fillColor(textColor);
        const empresaX = 350;
        doc.font('Helvetica-Bold').text(empresa?.nombre || 'Empresa', empresaX, y);
        y += 12;
        doc.font('Helvetica').fontSize(8).fillColor(mutedColor);
        if (empresa?.nif) {
          doc.text(`NIF: ${empresa.nif}`, empresaX, y);
          y += 10;
        }
        if (empresa?.direccion) {
          doc.text(empresa.direccion, empresaX, y, { width: 200 });
          y += 10;
        }
        if (empresa?.codigoPostal || empresa?.ciudad) {
          doc.text(`${empresa.codigoPostal || ''} ${empresa.ciudad || ''}`.trim(), empresaX, y);
          y += 10;
        }
        if (empresa?.telefono) {
          doc.text(`Tel: ${empresa.telefono}`, empresaX, y);
          y += 10;
        }
        if (empresa?.email) {
          doc.text(empresa.email, empresaX, y);
        }

        y = Math.max(y + 20, 100);

        // ============================================
        // TÍTULO
        // ============================================

        doc.rect(leftMargin, y, pageWidth, 30).fill(blueColor);
        doc.fontSize(14).fillColor('#FFFFFF').font('Helvetica-Bold');
        doc.text('SOLICITUD DE PRESUPUESTO', leftMargin + 10, y + 8);
        doc.fontSize(10).text(presupuesto.codigo || '', leftMargin + pageWidth - 120, y + 10, { align: 'right', width: 110 });
        y += 40;

        // ============================================
        // DATOS DEL PROVEEDOR Y FECHAS
        // ============================================

        // Proveedor (izquierda)
        doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
        doc.text('PROVEEDOR', leftMargin, y);
        y += 12;
        doc.font('Helvetica').fontSize(9).fillColor(textColor);
        doc.text(presupuesto.proveedorNombre || 'Sin proveedor', leftMargin, y);
        y += 10;
        if (presupuesto.proveedorNif) {
          doc.text(`NIF: ${presupuesto.proveedorNif}`, leftMargin, y);
          y += 10;
        }
        if (presupuesto.proveedorEmail) {
          doc.text(`Email: ${presupuesto.proveedorEmail}`, leftMargin, y);
          y += 10;
        }
        if (presupuesto.proveedorTelefono) {
          doc.text(`Tel: ${presupuesto.proveedorTelefono}`, leftMargin, y);
          y += 10;
        }
        if (presupuesto.contactoProveedor) {
          doc.text(`Contacto: ${presupuesto.contactoProveedor}`, leftMargin, y);
          y += 10;
        }

        // Fechas (derecha)
        const fechasX = 350;
        let fechasY = y - 52;
        doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
        doc.text('FECHAS', fechasX, fechasY);
        fechasY += 12;
        doc.font('Helvetica').fontSize(9).fillColor(textColor);
        doc.text(`Fecha: ${this.formatDate(presupuesto.fecha)}`, fechasX, fechasY);
        fechasY += 10;
        if (presupuesto.fechaValidez) {
          doc.text(`Válido hasta: ${this.formatDate(presupuesto.fechaValidez)}`, fechasX, fechasY);
          fechasY += 10;
        }
        if (presupuesto.fechaEntregaDeseada) {
          doc.text(`Entrega deseada: ${this.formatDate(presupuesto.fechaEntregaDeseada)}`, fechasX, fechasY);
        }

        y = Math.max(y, fechasY) + 20;

        // Título del presupuesto
        if (presupuesto.titulo) {
          doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor);
          doc.text(presupuesto.titulo, leftMargin, y);
          y += 15;
        }

        // ============================================
        // TABLA DE LÍNEAS
        // ============================================

        // Cabecera de tabla
        const colWidths = { desc: 230, cant: 60, precio: 80, dto: 50, total: 95 };
        const tableX = leftMargin;

        doc.rect(tableX, y, pageWidth, 20).fill(lightGray);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(textColor);
        doc.text('DESCRIPCIÓN', tableX + 5, y + 6);
        doc.text('CANT.', tableX + colWidths.desc + 5, y + 6);
        doc.text('PRECIO', tableX + colWidths.desc + colWidths.cant + 5, y + 6);
        doc.text('DTO%', tableX + colWidths.desc + colWidths.cant + colWidths.precio + 5, y + 6);
        doc.text('TOTAL', tableX + colWidths.desc + colWidths.cant + colWidths.precio + colWidths.dto + 5, y + 6);
        y += 22;

        // Líneas
        const lineasProducto = (presupuesto.lineas || []).filter(
          l => l.tipo === TipoLineaPresupuestoCompra.PRODUCTO || !l.tipo
        );

        for (const linea of lineasProducto) {
          // Comprobar si necesitamos nueva página
          if (y > 700) {
            doc.addPage();
            y = 40;
          }

          const lineHeight = 16;

          // Descripción
          let descripcion = linea.nombre || '';
          if (opts.mostrarDescripcion === 'corta' && linea.descripcion) {
            descripcion += ` - ${this.truncateText(linea.descripcion, 50)}`;
          } else if (opts.mostrarDescripcion === 'larga' && linea.descripcion) {
            descripcion += ` - ${linea.descripcion}`;
          }

          doc.font('Helvetica').fontSize(8).fillColor(textColor);
          doc.text(this.truncateText(descripcion, 60), tableX + 5, y, { width: colWidths.desc - 10 });
          doc.text((linea.cantidad || 0).toString(), tableX + colWidths.desc + 5, y);
          doc.text(this.formatCurrency(linea.precioUnitario || 0), tableX + colWidths.desc + colWidths.cant + 5, y);
          doc.text((linea.descuento || 0).toString() + '%', tableX + colWidths.desc + colWidths.cant + colWidths.precio + 5, y);
          doc.text(this.formatCurrency(linea.total || 0), tableX + colWidths.desc + colWidths.cant + colWidths.precio + colWidths.dto + 5, y);

          // Línea divisoria
          y += lineHeight;
          doc.strokeColor(borderColor).lineWidth(0.5);
          doc.moveTo(tableX, y).lineTo(tableX + pageWidth, y).stroke();
          y += 4;
        }

        y += 10;

        // ============================================
        // TOTALES
        // ============================================

        const totalesX = 350;
        const totalesWidth = 205;

        // Subtotal
        doc.font('Helvetica').fontSize(9).fillColor(textColor);
        doc.text('Subtotal:', totalesX, y);
        doc.text(this.formatCurrency(presupuesto.totales?.subtotalBruto || 0), totalesX + 80, y, { width: 120, align: 'right' });
        y += 12;

        // Descuentos
        if ((presupuesto.totales?.totalDescuentos || 0) > 0) {
          doc.text('Descuentos:', totalesX, y);
          doc.text('-' + this.formatCurrency(presupuesto.totales?.totalDescuentos || 0), totalesX + 80, y, { width: 120, align: 'right' });
          y += 12;
        }

        // IVA
        doc.text('IVA:', totalesX, y);
        doc.text(this.formatCurrency(presupuesto.totales?.totalIva || 0), totalesX + 80, y, { width: 120, align: 'right' });
        y += 14;

        // Total
        doc.rect(totalesX, y - 2, totalesWidth, 22).fill(primaryColor);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF');
        doc.text('TOTAL', totalesX + 10, y + 4);
        doc.text(this.formatCurrency(presupuesto.totales?.totalPresupuesto || 0), totalesX + 80, y + 4, { width: 115, align: 'right' });
        y += 30;

        // ============================================
        // CONDICIONES Y OBSERVACIONES
        // ============================================

        if (opts.mostrarCondiciones && presupuesto.condiciones) {
          if (y > 680) {
            doc.addPage();
            y = 40;
          }

          doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
          doc.text('CONDICIONES', leftMargin, y);
          y += 12;
          doc.font('Helvetica').fontSize(8).fillColor(mutedColor);

          if (presupuesto.condiciones.plazoEntrega) {
            doc.text(`Plazo de entrega: ${presupuesto.condiciones.plazoEntrega}`, leftMargin, y);
            y += 10;
          }
          if (presupuesto.condiciones.formaPago) {
            doc.text(`Forma de pago: ${presupuesto.condiciones.formaPago}`, leftMargin, y);
            y += 10;
          }
          if (presupuesto.condiciones.garantia) {
            doc.text(`Garantía: ${presupuesto.condiciones.garantia}`, leftMargin, y);
            y += 10;
          }
          y += 5;
        }

        if (presupuesto.observaciones) {
          if (y > 680) {
            doc.addPage();
            y = 40;
          }

          doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
          doc.text('OBSERVACIONES', leftMargin, y);
          y += 12;
          doc.font('Helvetica').fontSize(8).fillColor(mutedColor);
          doc.text(presupuesto.observaciones, leftMargin, y, { width: pageWidth });
        }

        // ============================================
        // PIE DE PÁGINA
        // ============================================

        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor(mutedColor);
          doc.text(
            `Página ${i + 1} de ${totalPages}`,
            leftMargin,
            780,
            { align: 'center', width: pageWidth }
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const presupuestosCompraPDFService = new PresupuestosCompraPDFService();
export default presupuestosCompraPDFService;
