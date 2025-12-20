import PDFDocument from 'pdfkit';
import axios from 'axios';
import { IPresupuesto, TipoLinea } from './Presupuesto';
import { IEmpresa } from '@/modules/empresa/Empresa';
import Empresa from '@/modules/empresa/Empresa';

/**
 * ============================================
 * PRESUPUESTO PDF SERVICE
 * ============================================
 * Servicio para generar PDFs de presupuestos
 */

export interface PDFOptions {
  mostrarDescripcion?: 'ninguna' | 'corta' | 'larga';
  mostrarReferencias?: boolean;
  mostrarCondiciones?: boolean;
  mostrarFirmas?: boolean;
  mostrarCuentaBancaria?: boolean;
  mostrarLOPD?: boolean;
  mostrarRegistroMercantil?: boolean;
}

export const defaultPDFOptions: PDFOptions = {
  mostrarDescripcion: 'corta',
  mostrarReferencias: true,
  mostrarCondiciones: true,
  mostrarFirmas: true,
  mostrarCuentaBancaria: true,
  mostrarLOPD: true,
  mostrarRegistroMercantil: true,
};

class PresupuestosPDFService {
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
   * Genera un PDF del presupuesto
   */
  async generarPDF(
    presupuesto: IPresupuesto,
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

        // Margen inferior para pie de página
        const pageBottom = 760;
        const footerSpace = 70;
        const contentBottom = pageBottom - footerSpace;

        let y = 40;

        // ===================================
        // CABECERA
        // ===================================
        const headerStartY = y;
        let logoWidth = 0;

        if (logoBuffer) {
          try {
            doc.image(logoBuffer, 40, y, { height: 50, fit: [100, 50] });
            logoWidth = 110;
          } catch (error) {
            console.error('Error insertando logo:', error);
          }
        }

        const empresaTextX = 40 + logoWidth + (logoWidth > 0 ? 10 : 0);

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(textColor)
           .text(empresa?.nombreComercial || empresa?.nombre || 'Mi Empresa', empresaTextX, y, { lineBreak: false });
        y += 18;

        doc.fontSize(8).font('Helvetica').fillColor(mutedColor);

        if (empresa?.direccion) {
          const direccionText = [
            empresa.direccion.calle,
            empresa.direccion.codigoPostal,
            empresa.direccion.ciudad
          ].filter(Boolean).join(', ');
          if (direccionText) {
            doc.text(direccionText, empresaTextX, y, { lineBreak: false });
            y += 10;
          }
        }

        const nifTelText = [
          empresa?.nif ? `NIF: ${empresa.nif}` : '',
          empresa?.telefono ? `Tel: ${empresa.telefono}` : ''
        ].filter(Boolean).join('   ');
        if (nifTelText) {
          doc.text(nifTelText, empresaTextX, y, { lineBreak: false });
          y += 10;
        }

        if (empresa?.email) {
          doc.text(empresa.email, empresaTextX, y, { lineBreak: false });
          y += 10;
        }

        // Número de presupuesto a la derecha
        const rightX = 400;
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor(textColor)
           .text('PRESUPUESTO', rightX, headerStartY, { width: 155, align: 'right' });

        doc.fontSize(12)
           .fillColor(blueColor)
           .text(presupuesto.codigo, rightX, headerStartY + 20, { width: 155, align: 'right' });

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(mutedColor)
           .text(`Fecha: ${this.formatDate(presupuesto.fecha)}`, rightX, headerStartY + 38, { width: 155, align: 'right' })
           .text(`Válido hasta: ${this.formatDate(presupuesto.fechaValidez)}`, rightX, headerStartY + 50, { width: 155, align: 'right' });

        y = Math.max(y, headerStartY + 65);

        // Línea separadora
        doc.strokeColor(primaryColor)
           .lineWidth(2)
           .moveTo(40, y)
           .lineTo(555, y)
           .stroke();

        y += 20;

        // ===================================
        // CLIENTE
        // ===================================
        const clienteBoxY = y;
        const boxWidth = 250;

        doc.fillColor(lightGray).rect(40, clienteBoxY, boxWidth, 70).fill();
        doc.strokeColor(borderColor).lineWidth(0.5).rect(40, clienteBoxY, boxWidth, 70).stroke();

        let clienteY = clienteBoxY + 8;

        doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedColor)
           .text('DATOS DEL CLIENTE', 50, clienteY, { lineBreak: false });
        clienteY += 12;

        const clienteNombre = typeof presupuesto.clienteId === 'object'
          ? (presupuesto.clienteId as any).nombre
          : presupuesto.clienteNombre;

        doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor)
           .text(this.truncateText(clienteNombre || '', 40), 50, clienteY, { lineBreak: false });
        clienteY += 12;

        doc.fontSize(8).font('Helvetica').fillColor(mutedColor);
        doc.text(`NIF: ${presupuesto.clienteNif || ''}`, 50, clienteY, { lineBreak: false });
        clienteY += 10;

        if (presupuesto.clienteEmail) {
          doc.text(this.truncateText(presupuesto.clienteEmail, 35), 50, clienteY, { lineBreak: false });
          clienteY += 10;
        }

        if (presupuesto.clienteTelefono) {
          doc.text(`Tel: ${presupuesto.clienteTelefono}`, 50, clienteY, { lineBreak: false });
        }

        y = clienteBoxY + 80;

        // Título del presupuesto
        if (presupuesto.titulo) {
          doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor)
             .text(this.truncateText(presupuesto.titulo, 80), 40, y, { lineBreak: false });
          y += 15;
        }

        // ===================================
        // TABLA DE LÍNEAS
        // ===================================
        const tableLeft = 40;
        const tableWidth = 515;
        const headerHeight = 18;

        const cols = {
          num: { x: tableLeft, width: 20 },
          concepto: { x: tableLeft + 20, width: 200 },
          cantidad: { x: tableLeft + 220, width: 50 },
          precio: { x: tableLeft + 270, width: 65 },
          dto: { x: tableLeft + 335, width: 35 },
          iva: { x: tableLeft + 370, width: 35 },
          importe: { x: tableLeft + 405, width: 70 },
        };

        // Función para dibujar header de tabla
        const drawTableHeader = (yPos: number) => {
          doc.fillColor(primaryColor).rect(tableLeft, yPos, tableWidth, headerHeight).fill();
          doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold');
          const hY = yPos + 5;
          doc.text('#', cols.num.x + 2, hY, { lineBreak: false });
          doc.text('Descripción', cols.concepto.x + 2, hY, { lineBreak: false });
          doc.text('Cant.', cols.cantidad.x, hY, { width: cols.cantidad.width, align: 'right' });
          doc.text('Precio', cols.precio.x, hY, { width: cols.precio.width, align: 'right' });
          doc.text('Dto', cols.dto.x, hY, { width: cols.dto.width, align: 'right' });
          doc.text('IVA', cols.iva.x, hY, { width: cols.iva.width, align: 'right' });
          doc.text('Importe', cols.importe.x, hY, { width: cols.importe.width, align: 'right' });
          return yPos + headerHeight;
        };

        y = drawTableHeader(y);

        // Filas de datos
        const lineas = presupuesto.lineas || [];
        for (let i = 0; i < lineas.length; i++) {
          const linea = lineas[i];
          const rowHeight = 16;

          // Salto de página si necesario
          if (y + rowHeight > contentBottom) {
            doc.addPage();
            y = 40;
            y = drawTableHeader(y);
          }

          // Fondo alternado
          if (i % 2 === 0) {
            doc.fillColor(lightGray).rect(tableLeft, y, tableWidth, rowHeight).fill();
          }
          doc.strokeColor(borderColor).lineWidth(0.5).rect(tableLeft, y, tableWidth, rowHeight).stroke();

          const textY = y + 4;
          doc.fillColor(textColor).font('Helvetica').fontSize(7);

          // Línea de texto
          if (linea.tipo === TipoLinea.TEXTO) {
            doc.font('Helvetica-Oblique').fillColor(mutedColor)
               .text(this.truncateText(linea.nombre, 100), tableLeft + 5, textY, { lineBreak: false });
            y += rowHeight;
            continue;
          }

          // Línea de subtotal
          if (linea.tipo === TipoLinea.SUBTOTAL) {
            doc.font('Helvetica-Bold').fillColor(textColor)
               .text('Subtotal:', tableLeft + 5, textY, { width: cols.importe.x - tableLeft - 10, align: 'right' })
               .text(this.formatCurrency(linea.subtotal || 0), cols.importe.x, textY, { width: cols.importe.width, align: 'right' });
            y += rowHeight;
            continue;
          }

          // Línea normal
          doc.fillColor(mutedColor).text(String(i + 1), cols.num.x + 2, textY, { lineBreak: false });

          // Nombre con referencia
          let nombreDisplay = this.truncateText(linea.nombre, 35);
          if (opts.mostrarReferencias && linea.codigo) {
            nombreDisplay += ` (${linea.codigo})`;
          }
          doc.font('Helvetica-Bold').fillColor(textColor)
             .text(this.truncateText(nombreDisplay, 45), cols.concepto.x + 2, textY, { lineBreak: false });

          doc.font('Helvetica').fillColor(textColor);
          doc.text(`${linea.cantidad} ${linea.unidad || 'ud'}`, cols.cantidad.x, textY, { width: cols.cantidad.width, align: 'right' });
          doc.text(this.formatCurrency(linea.precioUnitario), cols.precio.x, textY, { width: cols.precio.width, align: 'right' });
          doc.text(linea.descuento > 0 ? `${linea.descuento}%` : '-', cols.dto.x, textY, { width: cols.dto.width, align: 'right' });
          doc.text(`${linea.iva}%`, cols.iva.x, textY, { width: cols.iva.width, align: 'right' });
          doc.font('Helvetica-Bold')
             .text(this.formatCurrency(linea.subtotal), cols.importe.x, textY, { width: cols.importe.width, align: 'right' });

          y += rowHeight;
        }

        // ===================================
        // TOTALES
        // ===================================
        y += 10;

        if (y > contentBottom - 80) {
          doc.addPage();
          y = 40;
        }

        const totalesX = 360;
        const totalesWidth = 195;
        const desgloseIva = presupuesto.totales?.desgloseIva || [];
        const totalesHeight = 55 + desgloseIva.length * 12;

        doc.fillColor(lightGray).rect(totalesX, y, totalesWidth, totalesHeight).fill();
        doc.strokeColor(borderColor).rect(totalesX, y, totalesWidth, totalesHeight).stroke();

        let totY = y + 8;
        doc.fontSize(8).fillColor(textColor).font('Helvetica');

        doc.text('Base Imponible:', totalesX + 10, totY, { lineBreak: false });
        doc.text(this.formatCurrency(presupuesto.totales?.subtotalNeto || 0), totalesX + 100, totY, { width: 85, align: 'right' });
        totY += 12;

        for (const iva of desgloseIva) {
          doc.text(`IVA ${iva.tipo}%:`, totalesX + 10, totY, { lineBreak: false });
          doc.text(this.formatCurrency(iva.cuota), totalesX + 100, totY, { width: 85, align: 'right' });
          totY += 12;
        }

        if (desgloseIva.length === 0) {
          doc.text('IVA:', totalesX + 10, totY, { lineBreak: false });
          doc.text(this.formatCurrency(presupuesto.totales?.totalIva || 0), totalesX + 100, totY, { width: 85, align: 'right' });
          totY += 12;
        }

        // Total con fondo oscuro
        doc.fillColor(primaryColor).rect(totalesX, totY, totalesWidth, 22).fill();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF')
           .text('TOTAL:', totalesX + 10, totY + 6, { lineBreak: false })
           .text(this.formatCurrency(presupuesto.totales?.totalPresupuesto || 0), totalesX + 80, totY + 6, { width: 105, align: 'right' });

        y += totalesHeight + 15;

        // ===================================
        // CONDICIONES (simplificado)
        // ===================================
        if (opts.mostrarCondiciones && presupuesto.condiciones) {
          if (y > contentBottom - 50) {
            doc.addPage();
            y = 40;
          }

          doc.fontSize(9).font('Helvetica-Bold').fillColor(textColor)
             .text('Condiciones:', 40, y, { lineBreak: false });
          y += 12;

          doc.fontSize(7).font('Helvetica').fillColor(mutedColor);

          const condicionesTexto: string[] = [];
          if (presupuesto.condiciones.validezDias) {
            condicionesTexto.push(`Validez: ${presupuesto.condiciones.validezDias} días`);
          }
          if (presupuesto.condiciones.tiempoEntrega) {
            condicionesTexto.push(`Entrega: ${presupuesto.condiciones.tiempoEntrega}`);
          }
          if (presupuesto.condiciones.garantia) {
            condicionesTexto.push(`Garantía: ${presupuesto.condiciones.garantia}`);
          }

          if (condicionesTexto.length > 0) {
            doc.text(condicionesTexto.join(' | '), 40, y, { lineBreak: false });
            y += 12;
          }
        }

        // Condiciones generales de empresa (máximo 3 líneas)
        if (opts.mostrarCondiciones && empresa?.textosLegales?.presupuestoCondiciones) {
          if (y > contentBottom - 40) {
            doc.addPage();
            y = 40;
          }

          const condicionesEmpresa = this.truncateText(empresa.textosLegales.presupuestoCondiciones, 400);
          doc.fontSize(6).font('Helvetica').fillColor(mutedColor)
             .text(condicionesEmpresa, 40, y, { width: 515, height: 30, ellipsis: true });
          y += 35;
        }

        // ===================================
        // CUENTA BANCARIA
        // ===================================
        if (opts.mostrarCuentaBancaria && empresa?.cuentasBancarias && empresa.cuentasBancarias.length > 0) {
          const cuenta = empresa.cuentasBancarias.find(c => c.predeterminada && c.activa)
            || empresa.cuentasBancarias.find(c => c.activa);

          if (cuenta) {
            if (y > contentBottom - 30) {
              doc.addPage();
              y = 40;
            }

            doc.fontSize(8).font('Helvetica-Bold').fillColor(textColor)
               .text('Datos bancarios:', 40, y, { lineBreak: false });
            y += 10;

            const bancoInfo = [
              cuenta.banco,
              `IBAN: ${cuenta.iban}`,
              cuenta.swift ? `BIC: ${cuenta.swift}` : ''
            ].filter(Boolean).join(' | ');

            doc.fontSize(7).font('Helvetica').fillColor(mutedColor)
               .text(bancoInfo, 40, y, { lineBreak: false });
            y += 15;
          }
        }

        // ===================================
        // FIRMAS
        // ===================================
        if (opts.mostrarFirmas) {
          if (y > contentBottom - 50) {
            doc.addPage();
            y = 40;
          }

          y += 30;

          doc.strokeColor(borderColor).lineWidth(0.5)
             .moveTo(60, y).lineTo(200, y).stroke()
             .moveTo(340, y).lineTo(480, y).stroke();

          y += 5;
          doc.fontSize(7).fillColor(mutedColor)
             .text('La Empresa', 60, y, { width: 140, align: 'center' })
             .text('El Cliente', 340, y, { width: 140, align: 'center' });
        }

        // ===================================
        // PIE DE PÁGINA EN TODAS LAS PÁGINAS
        // ===================================
        const pageCount = doc.bufferedPageRange().count;

        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);

          const footerY = doc.page.height - 50;

          // LOPD (truncado a 200 caracteres)
          if (opts.mostrarLOPD && empresa?.textosLegales?.textoLOPD) {
            const lopdText = this.truncateText(empresa.textosLegales.textoLOPD, 250);
            doc.fontSize(5).font('Helvetica').fillColor('#9CA3AF')
               .text(lopdText, 40, footerY - 15, {
                 width: doc.page.width - 80,
                 align: 'center',
                 height: 12,
                 ellipsis: true
               });
          }

          // Registro mercantil
          if (opts.mostrarRegistroMercantil && empresa) {
            const registroText = [
              empresa.nombre,
              empresa.nif ? `CIF: ${empresa.nif}` : '',
              empresa.datosRegistro?.registroMercantil,
            ].filter(Boolean).join(' · ');

            if (registroText) {
              doc.fontSize(5).fillColor('#9CA3AF')
                 .text(this.truncateText(registroText, 150), 40, footerY, {
                   width: doc.page.width - 80,
                   align: 'center',
                   lineBreak: false
                 });
            }
          }

          // Número de página
          doc.fontSize(7).fillColor(mutedColor)
             .text(`Página ${i + 1} de ${pageCount}`, 40, doc.page.height - 25, {
               width: doc.page.width - 80,
               align: 'center',
               lineBreak: false
             });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(value || 0);
  }
}

export const presupuestosPDFService = new PresupuestosPDFService();
export default presupuestosPDFService;
