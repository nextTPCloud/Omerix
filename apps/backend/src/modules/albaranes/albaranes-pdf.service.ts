// apps/backend/src/modules/albaranes/albaranes-pdf.service.ts
// Servicio para generación de PDFs de albaranes

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
import { IAlbaran, ILineaAlbaran, TipoLinea, IDatosEntrega, IDatosTransporte } from './Albaran';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getFirmaModel } from '@/utils/dynamic-models.helper';

// ============================================
// INTERFACES ESPECÍFICAS DE ALBARAN
// ============================================

export interface OpcionesImpresionAlbaran extends OpcionesImpresion {
  mostrarDireccionEntrega?: boolean;
  mostrarTransporte?: boolean;
  mostrarFirmaRecepcion?: boolean;
  mostrarLotesSeries?: boolean;
}

// ============================================
// SERVICIO PDF ALBARANES
// ============================================

class AlbaranesPDFService extends DocumentoPDFBaseService {
  /**
   * Genera un PDF del albarán
   */
  async generarPDF(
    dbConfig: IDatabaseConfig,
    albaran: IAlbaran,
    opciones: OpcionesImpresionAlbaran = {}
  ): Promise<Buffer> {
    const opts: OpcionesImpresionAlbaran = {
      ...defaultOpcionesImpresion,
      mostrarDireccionEntrega: true,
      mostrarTransporte: true,
      mostrarFirmaRecepcion: true,
      mostrarLotesSeries: false,
      ...opciones,
    };

    // Extraer empresaId del albarán
    const empresaId = String(albaran.empresaId);

    try {
      // Inicializar documento con la configuración de base de datos
      await this.inicializarDocumento(
        empresaId,
        TipoDocumentoPlantilla.ALBARAN,
        dbConfig,
        opts.plantillaId
      );

      // Renderizar cabecera
      this.renderizarCabecera('ALBARÁN DE ENTREGA', this.extraerDatosDocumento(albaran));

      // Renderizar datos del cliente
      this.renderizarCliente(this.extraerDatosCliente(albaran));

      // Dirección de entrega (si es diferente)
      if (opts.mostrarDireccionEntrega && albaran.direccionEntrega) {
        this.renderizarDireccionEntrega(albaran);
      }

      // Datos de transporte
      if (opts.mostrarTransporte && albaran.datosTransporte) {
        this.renderizarDatosTransporte(albaran.datosTransporte);
      }

      // Título
      if (albaran.titulo) {
        this.doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(this.colores.texto)
           .text(this.truncarTexto(albaran.titulo, 80), 40, this.y);
        this.y += 15;
      }

      // Renderizar líneas
      this.renderizarLineasAlbaran(albaran.lineas || [], opts);

      // Renderizar totales
      this.renderizarTotales(this.extraerTotales(albaran));

      // Zona de firma de recepción
      if (opts.mostrarFirmaRecepcion) {
        await this.renderizarZonaFirma(albaran);
      }

      // Condiciones
      const textoCondiciones = albaran.observaciones ||
        this.empresa?.textosLegales?.condicionesVenta;
      opts.textoCondiciones = textoCondiciones;

      // Renderizar pie
      this.renderizarPie(opts);

      // Finalizar y retornar buffer
      return await this.finalizarDocumento();
    } catch (error) {
      console.error('Error generando PDF de albarán:', error);
      throw error;
    }
  }

  /**
   * Extrae los datos del documento
   */
  private extraerDatosDocumento(albaran: IAlbaran): DatosDocumento {
    return {
      codigo: albaran.codigo,
      serie: albaran.serie,
      numero: albaran.numero,
      fecha: albaran.fecha,
      fechaVencimiento: albaran.datosEntrega?.fechaProgramada,
      titulo: albaran.titulo,
    };
  }

  /**
   * Extrae los datos del cliente
   */
  private extraerDatosCliente(albaran: IAlbaran): DatosCliente {
    return {
      nombre: albaran.clienteNombre,
      nif: albaran.clienteNif,
      email: albaran.clienteEmail,
      telefono: albaran.clienteTelefono,
    };
  }

  /**
   * Renderiza la dirección de entrega
   */
  private renderizarDireccionEntrega(albaran: IAlbaran): void {
    const direccion = albaran.direccionEntrega;
    if (!direccion) return;

    const boxX = 305;
    const boxWidth = 250;
    const boxY = this.y - 80; // Al lado del cliente

    this.doc.fillColor(this.colores.fondoAlterno)
       .rect(boxX, boxY, boxWidth, 70)
       .fill();

    this.doc.strokeColor(this.colores.borde)
       .lineWidth(0.5)
       .rect(boxX, boxY, boxWidth, 70)
       .stroke();

    let dirY = boxY + 8;

    this.doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colores.textoClaro)
       .text('DIRECCIÓN DE ENTREGA', boxX + 10, dirY);
    dirY += 12;

    this.doc.fontSize(9)
       .font('Helvetica')
       .fillColor(this.colores.texto);

    if (direccion.nombre) {
      this.doc.text(this.truncarTexto(direccion.nombre, 40), boxX + 10, dirY);
      dirY += 10;
    }

    const direccionTexto = [
      direccion.calle,
      direccion.numero,
      direccion.codigoPostal,
      direccion.ciudad,
    ].filter(Boolean).join(', ');

    if (direccionTexto) {
      this.doc.fontSize(8).fillColor(this.colores.textoClaro)
         .text(this.truncarTexto(direccionTexto, 45), boxX + 10, dirY);
      dirY += 10;
    }

    if (direccion.personaContacto) {
      this.doc.text(`Contacto: ${direccion.personaContacto}`, boxX + 10, dirY);
      dirY += 10;
    }

    if (direccion.telefonoContacto) {
      this.doc.text(`Tel: ${direccion.telefonoContacto}`, boxX + 10, dirY);
    }
  }

  /**
   * Renderiza los datos de transporte
   */
  private renderizarDatosTransporte(transporte: IDatosTransporte): void {
    this.doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text('Datos de transporte:', 40, this.y);
    this.y += 10;

    this.doc.fontSize(7).font('Helvetica').fillColor(this.colores.textoClaro);

    const datosTransporte: string[] = [];
    if (transporte.nombreTransportista) {
      datosTransporte.push(`Transportista: ${transporte.nombreTransportista}`);
    }
    if (transporte.vehiculo || transporte.matricula) {
      datosTransporte.push(`Vehículo: ${[transporte.vehiculo, transporte.matricula].filter(Boolean).join(' - ')}`);
    }
    if (transporte.conductor) {
      datosTransporte.push(`Conductor: ${transporte.conductor}`);
    }
    if (transporte.numeroSeguimiento) {
      datosTransporte.push(`Seguimiento: ${transporte.numeroSeguimiento}`);
    }

    if (datosTransporte.length > 0) {
      this.doc.text(datosTransporte.join(' | '), 40, this.y);
      this.y += 15;
    }
  }

  /**
   * Renderiza las líneas del albarán (con cantidades solicitadas/entregadas)
   */
  private renderizarLineasAlbaran(
    lineas: ILineaAlbaran[],
    opciones: OpcionesImpresionAlbaran
  ): void {
    const tableLeft = 40;
    const tableWidth = 515;
    const headerHeight = 18;
    const rowHeight = 16;

    // Columnas específicas para albarán
    const cols = {
      concepto: { x: tableLeft, width: 180 },
      solicitada: { x: tableLeft + 180, width: 50 },
      entregada: { x: tableLeft + 230, width: 50 },
      pendiente: { x: tableLeft + 280, width: 50 },
      precio: { x: tableLeft + 330, width: 60 },
      dto: { x: tableLeft + 390, width: 35 },
      importe: { x: tableLeft + 425, width: 50 },
    };

    // Header de tabla
    const drawTableHeader = (yPos: number): number => {
      this.doc.fillColor(this.colores.primario)
         .rect(tableLeft, yPos, tableWidth, headerHeight)
         .fill();

      this.doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold');
      const hY = yPos + 5;

      this.doc.text('Descripción', cols.concepto.x + 2, hY);
      this.doc.text('Solic.', cols.solicitada.x, hY, { width: cols.solicitada.width, align: 'right' });
      this.doc.text('Entreg.', cols.entregada.x, hY, { width: cols.entregada.width, align: 'right' });
      this.doc.text('Pend.', cols.pendiente.x, hY, { width: cols.pendiente.width, align: 'right' });
      this.doc.text('Precio', cols.precio.x, hY, { width: cols.precio.width, align: 'right' });
      this.doc.text('Dto', cols.dto.x, hY, { width: cols.dto.width, align: 'right' });
      this.doc.text('Importe', cols.importe.x, hY, { width: cols.importe.width, align: 'right' });

      return yPos + headerHeight;
    };

    this.y = drawTableHeader(this.y);

    // Filas de datos
    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];

      // Salto de página si necesario
      if (this.y + rowHeight > this.contentBottom) {
        this.doc.addPage();
        this.y = 40;
        this.y = drawTableHeader(this.y);
      }

      // Fondo alternado
      if (i % 2 === 0) {
        this.doc.fillColor(this.colores.fondoAlterno)
           .rect(tableLeft, this.y, tableWidth, rowHeight)
           .fill();
      }

      this.doc.strokeColor(this.colores.borde)
         .lineWidth(0.5)
         .rect(tableLeft, this.y, tableWidth, rowHeight)
         .stroke();

      const textY = this.y + 4;
      this.doc.fillColor(this.colores.texto).font('Helvetica').fontSize(7);

      // Línea de texto
      if (linea.tipo === TipoLinea.TEXTO) {
        this.doc.font('Helvetica-Oblique')
           .fillColor(this.colores.textoClaro)
           .text(this.truncarTexto(linea.nombre, 100), tableLeft + 5, textY);
        this.y += rowHeight;
        continue;
      }

      // Nombre con referencia
      let nombreDisplay = this.truncarTexto(linea.nombre, 30);
      if (opciones.mostrarReferencias && linea.codigo) {
        nombreDisplay += ` (${linea.codigo})`;
      }
      this.doc.font('Helvetica-Bold')
         .fillColor(this.colores.texto)
         .text(this.truncarTexto(nombreDisplay, 40), cols.concepto.x + 2, textY);

      // Lotes/Series
      if (opciones.mostrarLotesSeries && (linea.lote || linea.numeroSerie)) {
        this.doc.fontSize(5)
           .font('Helvetica')
           .fillColor(this.colores.textoClaro)
           .text(`Lote: ${linea.lote || '-'} | NS: ${linea.numeroSerie || '-'}`, cols.concepto.x + 2, textY + 8);
      }

      this.doc.font('Helvetica').fontSize(7).fillColor(this.colores.texto);

      // Cantidades
      this.doc.text(String(linea.cantidadSolicitada), cols.solicitada.x, textY, { width: cols.solicitada.width, align: 'right' });
      this.doc.text(String(linea.cantidadEntregada), cols.entregada.x, textY, { width: cols.entregada.width, align: 'right' });

      // Pendiente con color si hay
      const pendiente = linea.cantidadPendiente || 0;
      if (pendiente > 0) {
        this.doc.fillColor(this.colores.alerta);
      }
      this.doc.text(String(pendiente), cols.pendiente.x, textY, { width: cols.pendiente.width, align: 'right' });
      this.doc.fillColor(this.colores.texto);

      // Precio
      this.doc.text(this.formatearMoneda(linea.precioUnitario), cols.precio.x, textY, { width: cols.precio.width, align: 'right' });

      // Descuento
      const dtoTexto = linea.descuento > 0 ? `${linea.descuento}%` : '-';
      this.doc.text(dtoTexto, cols.dto.x, textY, { width: cols.dto.width, align: 'right' });

      // Subtotal
      this.doc.font('Helvetica-Bold')
         .text(this.formatearMoneda(linea.subtotal), cols.importe.x, textY, { width: cols.importe.width, align: 'right' });

      this.y += rowHeight;
    }
  }

  /**
   * Extrae los totales para el PDF
   */
  private extraerTotales(albaran: IAlbaran): TotalesDocumento {
    return {
      subtotalBruto: albaran.totales?.subtotalBruto || 0,
      totalDescuentos: albaran.totales?.totalDescuentos || 0,
      subtotalNeto: albaran.totales?.subtotalNeto || 0,
      desgloseIva: albaran.totales?.desgloseIva?.map(iva => ({
        tipo: iva.tipo,
        base: iva.base,
        cuota: iva.cuota,
      })) || [],
      totalIva: albaran.totales?.totalIva || 0,
      total: albaran.totales?.totalAlbaran || 0,
    };
  }

  /**
   * Renderiza la zona de firma de recepción, embebiendo firmas reales si existen
   */
  private async renderizarZonaFirma(albaran: IAlbaran): Promise<void> {
    if (this.y > this.contentBottom - 80) {
      this.doc.addPage();
      this.y = 40;
    }

    this.y += 20;

    // Buscar firmas reales del documento
    let firmasReales: any[] = [];
    try {
      const empresaId = String(albaran.empresaId);
      const empresa = (await import('@/modules/empresa/Empresa')).default;
      const emp = await empresa.findById(empresaId).select('databaseConfig').lean();
      if (emp?.databaseConfig) {
        const Firma = await getFirmaModel(empresaId, emp.databaseConfig);
        firmasReales = await Firma.find({
          documentoId: albaran._id?.toString(),
          tipoDocumento: 'albaran',
        }).sort({ timestamp: -1 }).lean();
      }
    } catch (e) {
      // Si falla la búsqueda de firmas, continuar sin ellas
    }

    // Recuadro de firma
    const firmaX = 340;
    const firmaY = this.y;
    const firmaWidth = 200;
    const firmaHeight = 70;

    this.doc.strokeColor(this.colores.borde)
       .lineWidth(1)
       .rect(firmaX, firmaY, firmaWidth, firmaHeight)
       .stroke();

    this.doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text('CONFORME RECEPCIÓN', firmaX + 10, firmaY + 5);

    const firmaManuscrita = firmasReales.find(f =>
      f.tipo === 'manuscrita' || f.tipo === 'remota_manuscrita'
    );
    const firmaCertificado = firmasReales.find(f => f.tipo === 'certificado_digital');

    if (firmaManuscrita?.imagenFirma) {
      // Embeber imagen de firma manuscrita
      try {
        let imgData = firmaManuscrita.imagenFirma;
        if (imgData.startsWith('data:')) {
          imgData = imgData.split(',')[1];
        }
        const imgBuffer = Buffer.from(imgData, 'base64');
        this.doc.image(imgBuffer, firmaX + 25, firmaY + 15, {
          width: firmaWidth - 50,
          height: 35,
          fit: [firmaWidth - 50, 35],
        });
      } catch (e) {
        // Si falla embeber imagen, mostrar texto
      }
      this.doc.fontSize(6).font('Helvetica').fillColor(this.colores.textoClaro)
         .text(`${firmaManuscrita.firmante?.nombre || ''} - ${this.formatearFecha(firmaManuscrita.timestamp)}`,
           firmaX + 10, firmaY + 55, { width: firmaWidth - 20, align: 'center' });
    } else if (firmaCertificado?.certificadoInfo) {
      // Mostrar info del certificado digital
      const cert = firmaCertificado.certificadoInfo;
      this.doc.fontSize(7).font('Helvetica').fillColor(this.colores.textoClaro);
      this.doc.text(`Firmado digitalmente por:`, firmaX + 10, firmaY + 18);
      this.doc.font('Helvetica-Bold').text(`${cert.titular}`, firmaX + 10, firmaY + 28);
      this.doc.font('Helvetica').text(`NIF: ${cert.nif || '-'}`, firmaX + 10, firmaY + 38);
      this.doc.text(`Emisor: ${cert.emisor || '-'}`, firmaX + 10, firmaY + 48);
      this.doc.fontSize(6).text(`Fecha: ${this.formatearFecha(firmaCertificado.timestamp)}`, firmaX + 10, firmaY + 58);
    } else {
      // Sin firmas: placeholder original
      if (albaran.datosEntrega) {
        this.doc.fontSize(7).font('Helvetica').fillColor(this.colores.textoClaro);
        if (albaran.datosEntrega.receptorNombre) {
          this.doc.text(`Nombre: ${albaran.datosEntrega.receptorNombre}`, firmaX + 10, firmaY + 18);
        }
        if (albaran.datosEntrega.receptorDni) {
          this.doc.text(`DNI: ${albaran.datosEntrega.receptorDni}`, firmaX + 10, firmaY + 28);
        }
        if (albaran.datosEntrega.fechaEntrega) {
          this.doc.text(`Fecha: ${this.formatearFecha(albaran.datosEntrega.fechaEntrega)}`, firmaX + 10, firmaY + 38);
        }
      }

      // Línea para firma
      this.doc.strokeColor(this.colores.borde)
         .lineWidth(0.5)
         .moveTo(firmaX + 20, firmaY + 60)
         .lineTo(firmaX + firmaWidth - 20, firmaY + 60)
         .stroke();

      this.doc.fontSize(6)
         .fillColor(this.colores.textoClaro)
         .text('Firma y sello', firmaX + 10, firmaY + 62, { width: firmaWidth - 20, align: 'center' });
    }

    this.y = firmaY + firmaHeight + 15;
  }
}

export const albaranesPDFService = new AlbaranesPDFService();
export default albaranesPDFService;
