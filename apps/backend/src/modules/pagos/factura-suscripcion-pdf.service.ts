import PDFDocument from 'pdfkit';
import FacturaSuscripcion, { IFacturaSuscripcion } from './FacturaSuscripcion';

/**
 * Servicio para generar PDFs de facturas de suscripción
 */
class FacturaSuscripcionPDFService {
  /**
   * Formatear fecha a formato español
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Formatear dinero
   */
  private formatMoney(amount: number): string {
    return amount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €';
  }

  /**
   * Generar PDF de una factura de suscripción
   */
  async generarPDF(facturaId: string): Promise<Buffer> {
    const factura = await FacturaSuscripcion.findById(facturaId);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    return this.generarPDFFromData(factura);
  }

  /**
   * Generar PDF desde datos de factura
   */
  async generarPDFFromData(factura: IFacturaSuscripcion): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Colores
        const primaryColor = '#2563EB';
        const textColor = '#1F2937';
        const mutedColor = '#6B7280';
        const borderColor = '#E5E7EB';

        let y = 50;

        // ===================================
        // CABECERA - Logo y datos emisor
        // ===================================

        // Título FACTURA
        doc.fontSize(28)
           .font('Helvetica-Bold')
           .fillColor(primaryColor)
           .text('FACTURA', 50, y);

        y += 40;

        // Número de factura
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(textColor)
           .text(`Nº: ${factura.numeroFactura}`, 50, y);

        y += 20;

        // Fecha de emisión
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(mutedColor)
           .text(`Fecha de emisión: ${this.formatDate(factura.fechaEmision)}`, 50, y);

        y += 15;

        // Período de facturación
        doc.text(
          `Período: ${this.formatDate(factura.periodoInicio)} - ${this.formatDate(factura.periodoFin)}`,
          50, y
        );

        // ===================================
        // DATOS DEL EMISOR (derecha)
        // ===================================
        const rightX = 350;
        let rightY = 50;

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(textColor)
           .text(factura.emisor.nombre, rightX, rightY, { width: 200, align: 'right' });

        rightY += 18;

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(mutedColor);

        doc.text(`NIF: ${factura.emisor.nif}`, rightX, rightY, { width: 200, align: 'right' });
        rightY += 12;
        doc.text(factura.emisor.direccion, rightX, rightY, { width: 200, align: 'right' });
        rightY += 12;
        doc.text(`${factura.emisor.codigoPostal} ${factura.emisor.ciudad}`, rightX, rightY, { width: 200, align: 'right' });
        rightY += 12;
        doc.text(factura.emisor.pais, rightX, rightY, { width: 200, align: 'right' });
        rightY += 12;
        doc.text(factura.emisor.email, rightX, rightY, { width: 200, align: 'right' });

        y += 50;

        // ===================================
        // LÍNEA SEPARADORA
        // ===================================
        doc.strokeColor(borderColor)
           .lineWidth(1)
           .moveTo(50, y)
           .lineTo(545, y)
           .stroke();

        y += 20;

        // ===================================
        // DATOS DEL CLIENTE
        // ===================================
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(primaryColor)
           .text('FACTURAR A:', 50, y);

        y += 15;

        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(textColor)
           .text(factura.cliente.nombre, 50, y);

        y += 15;

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(mutedColor);

        doc.text(`NIF: ${factura.cliente.nif}`, 50, y);
        y += 12;

        if (factura.cliente.direccion) {
          doc.text(factura.cliente.direccion, 50, y);
          y += 12;
        }

        if (factura.cliente.ciudad || factura.cliente.codigoPostal) {
          doc.text(`${factura.cliente.codigoPostal || ''} ${factura.cliente.ciudad || ''}`.trim(), 50, y);
          y += 12;
        }

        doc.text(factura.cliente.email, 50, y);

        y += 30;

        // ===================================
        // DETALLES DE LA SUSCRIPCIÓN
        // ===================================
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(primaryColor)
           .text('DETALLE DE LA SUSCRIPCIÓN', 50, y);

        y += 20;

        // Cabecera de tabla
        const tableTop = y;
        const col1 = 50;   // Descripción
        const col2 = 350;  // Cantidad
        const col3 = 400;  // Precio
        const col4 = 480;  // Total

        // Fondo cabecera
        doc.rect(col1 - 5, tableTop - 5, 505, 25)
           .fill('#F3F4F6');

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(textColor);

        doc.text('Concepto', col1, tableTop);
        doc.text('Cant.', col2, tableTop, { width: 40, align: 'center' });
        doc.text('Precio', col3, tableTop, { width: 70, align: 'right' });
        doc.text('Total', col4, tableTop, { width: 70, align: 'right' });

        y = tableTop + 25;

        // Líneas de factura
        doc.font('Helvetica').fillColor(textColor);

        for (const linea of factura.lineas) {
          // Línea separadora
          doc.strokeColor(borderColor)
             .lineWidth(0.5)
             .moveTo(col1, y)
             .lineTo(550, y)
             .stroke();

          y += 10;

          doc.fontSize(9);
          doc.text(linea.descripcion, col1, y, { width: 290 });
          doc.text(linea.cantidad.toString(), col2, y, { width: 40, align: 'center' });
          doc.text(this.formatMoney(linea.precioUnitario), col3, y, { width: 70, align: 'right' });
          doc.text(this.formatMoney(linea.total), col4, y, { width: 70, align: 'right' });

          y += 20;
        }

        // Línea final
        doc.strokeColor(borderColor)
           .lineWidth(1)
           .moveTo(col1, y)
           .lineTo(550, y)
           .stroke();

        y += 20;

        // ===================================
        // TOTALES
        // ===================================
        const totalsX = 380;

        // Subtotal
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(mutedColor)
           .text('Base imponible:', totalsX, y);
        doc.fillColor(textColor)
           .text(this.formatMoney(factura.subtotal), col4, y, { width: 70, align: 'right' });
        y += 15;

        // IVA
        doc.fillColor(mutedColor)
           .text('IVA (21%):', totalsX, y);
        doc.fillColor(textColor)
           .text(this.formatMoney(factura.totalIVA), col4, y, { width: 70, align: 'right' });
        y += 15;

        // Línea antes del total
        doc.strokeColor(primaryColor)
           .lineWidth(2)
           .moveTo(totalsX, y)
           .lineTo(550, y)
           .stroke();
        y += 10;

        // Total
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(primaryColor)
           .text('TOTAL:', totalsX, y);
        doc.text(this.formatMoney(factura.total), col4, y, { width: 70, align: 'right' });

        y += 40;

        // ===================================
        // ESTADO DE PAGO
        // ===================================
        if (factura.estado === 'pagada') {
          const badgeWidth = 100;
          const badgeHeight = 25;
          const badgeX = 450;

          doc.rect(badgeX, y, badgeWidth, badgeHeight)
             .fill('#10B981');

          doc.fontSize(10)
             .font('Helvetica-Bold')
             .fillColor('#FFFFFF')
             .text('PAGADA', badgeX, y + 7, { width: badgeWidth, align: 'center' });

          y += 15;

          if (factura.fechaPago) {
            doc.fontSize(8)
               .font('Helvetica')
               .fillColor(mutedColor)
               .text(`Pagada el ${this.formatDate(factura.fechaPago)}`, badgeX, y + 20, {
                 width: badgeWidth,
                 align: 'center'
               });
          }
        }

        y += 50;

        // ===================================
        // INFORMACIÓN ADICIONAL
        // ===================================
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(mutedColor);

        if (factura.metodoPago) {
          doc.text(`Método de pago: ${factura.metodoPago}`, 50, y);
          y += 12;
        }

        if (factura.transaccionExternaId) {
          doc.text(`Referencia: ${factura.transaccionExternaId}`, 50, y);
          y += 12;
        }

        // ===================================
        // PIE DE PÁGINA
        // ===================================
        const footerY = 780;

        doc.strokeColor(borderColor)
           .lineWidth(0.5)
           .moveTo(50, footerY - 20)
           .lineTo(545, footerY - 20)
           .stroke();

        doc.fontSize(7)
           .font('Helvetica')
           .fillColor(mutedColor);

        doc.text(
          `${factura.emisor.nombre} - ${factura.emisor.nif} - ${factura.emisor.direccion}, ${factura.emisor.codigoPostal} ${factura.emisor.ciudad}`,
          50,
          footerY,
          { width: 495, align: 'center' }
        );

        doc.text(
          'Esta factura ha sido generada automáticamente y es válida sin firma.',
          50,
          footerY + 12,
          { width: 495, align: 'center' }
        );

        // Finalizar documento
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generar y guardar PDF, retornando la URL
   */
  async generarYGuardarPDF(facturaId: string): Promise<{ pdfBuffer: Buffer; factura: IFacturaSuscripcion }> {
    const factura = await FacturaSuscripcion.findById(facturaId);
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    const pdfBuffer = await this.generarPDFFromData(factura);

    // Actualizar fecha de generación
    factura.pdfGeneradoEn = new Date();
    await factura.save();

    return { pdfBuffer, factura };
  }
}

export const facturaSuscripcionPDFService = new FacturaSuscripcionPDFService();
