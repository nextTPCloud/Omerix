// apps/backend/src/modules/pedidos/pedidos-pdf.service.ts
// Servicio para generación de PDFs de pedidos

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
import { IPedido, ILineaPedido, TipoLinea, Prioridad } from './Pedido';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';

// ============================================
// INTERFACES ESPECÍFICAS DE PEDIDO
// ============================================

export interface OpcionesImpresionPedido extends OpcionesImpresion {
  mostrarPrioridad?: boolean;
  mostrarDireccionEntrega?: boolean;
  mostrarCondicionesComerciales?: boolean;
  mostrarEstadoLineas?: boolean;
}

// ============================================
// SERVICIO PDF PEDIDOS
// ============================================

class PedidosPDFService extends DocumentoPDFBaseService {
  /**
   * Genera un PDF del pedido
   */
  async generarPDF(
    dbConfig: IDatabaseConfig,
    pedido: IPedido,
    opciones: OpcionesImpresionPedido = {}
  ): Promise<Buffer> {
    const opts: OpcionesImpresionPedido = {
      ...defaultOpcionesImpresion,
      mostrarPrioridad: true,
      mostrarDireccionEntrega: true,
      mostrarCondicionesComerciales: true,
      mostrarEstadoLineas: true,
      ...opciones,
    };

    // Extraer empresaId del pedido
    const empresaId = String(pedido.empresaId);

    try {
      // Inicializar documento con la configuración de base de datos
      await this.inicializarDocumento(
        empresaId,
        TipoDocumentoPlantilla.PEDIDO,
        dbConfig,
        opts.plantillaId
      );

      // Renderizar cabecera
      this.renderizarCabecera('PEDIDO', this.extraerDatosDocumento(pedido));

      // Prioridad y estado
      if (opts.mostrarPrioridad) {
        this.renderizarPrioridad(pedido);
      }

      // Renderizar datos del cliente
      this.renderizarCliente(this.extraerDatosCliente(pedido));

      // Dirección de entrega
      if (opts.mostrarDireccionEntrega && pedido.direccionEntrega) {
        this.renderizarDireccionEntrega(pedido);
      }

      // Título
      if (pedido.titulo) {
        this.doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(this.colores.texto)
           .text(this.truncarTexto(pedido.titulo, 80), 40, this.y);
        this.y += 15;
      }

      // Condiciones comerciales
      if (opts.mostrarCondicionesComerciales && pedido.condicionesComerciales) {
        this.renderizarCondicionesComerciales(pedido);
      }

      // Renderizar líneas
      this.renderizarLineasPedido(pedido.lineas || [], opts);

      // Renderizar totales
      this.renderizarTotales(this.extraerTotales(pedido));

      // Condiciones
      const textoCondiciones = pedido.observaciones ||
        this.empresa?.textosLegales?.condicionesVenta;
      opts.textoCondiciones = textoCondiciones;

      // Renderizar pie
      this.renderizarPie(opts);

      // Finalizar y retornar buffer
      return await this.finalizarDocumento();
    } catch (error) {
      console.error('Error generando PDF de pedido:', error);
      throw error;
    }
  }

  /**
   * Extrae los datos del documento
   */
  private extraerDatosDocumento(pedido: IPedido): DatosDocumento {
    return {
      codigo: pedido.codigo,
      serie: pedido.serie,
      numero: pedido.numero,
      fecha: pedido.fecha,
      fechaVencimiento: pedido.fechaEntregaComprometida,
      titulo: pedido.titulo,
    };
  }

  /**
   * Extrae los datos del cliente
   */
  private extraerDatosCliente(pedido: IPedido): DatosCliente {
    return {
      nombre: pedido.clienteNombre,
      nif: pedido.clienteNif,
      email: pedido.clienteEmail,
      telefono: pedido.clienteTelefono,
    };
  }

  /**
   * Renderiza la prioridad y estado
   */
  private renderizarPrioridad(pedido: IPedido): void {
    const prioridadConfig: Record<Prioridad, { color: string; texto: string }> = {
      [Prioridad.ALTA]: { color: this.colores.error, texto: 'ALTA' },
      [Prioridad.MEDIA]: { color: this.colores.alerta, texto: 'MEDIA' },
      [Prioridad.BAJA]: { color: this.colores.exito, texto: 'BAJA' },
    };

    const config = prioridadConfig[pedido.prioridad] || prioridadConfig[Prioridad.MEDIA];

    // Badge de prioridad
    const badgeX = 450;
    const badgeY = 85;

    this.doc.fillColor(config.color)
       .roundedRect(badgeX, badgeY, 70, 18, 3)
       .fill();

    this.doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text(`Prioridad: ${config.texto}`, badgeX + 5, badgeY + 5, { width: 60, align: 'center' });
  }

  /**
   * Renderiza la dirección de entrega
   */
  private renderizarDireccionEntrega(pedido: IPedido): void {
    const direccion = pedido.direccionEntrega;
    if (!direccion) return;

    const boxX = 305;
    const boxWidth = 250;
    const boxY = this.y - 80;

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
      dirY += 10;
    }

    if (direccion.horarioEntrega) {
      this.doc.text(`Horario: ${direccion.horarioEntrega}`, boxX + 10, dirY);
    }
  }

  /**
   * Renderiza las condiciones comerciales
   */
  private renderizarCondicionesComerciales(pedido: IPedido): void {
    const condiciones = pedido.condicionesComerciales;
    if (!condiciones) return;

    this.doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text('Condiciones comerciales:', 40, this.y);
    this.y += 10;

    this.doc.fontSize(7).font('Helvetica').fillColor(this.colores.textoClaro);

    const datos: string[] = [];
    if (condiciones.tiempoEntrega) {
      datos.push(`Tiempo de entrega: ${condiciones.tiempoEntrega}`);
    }
    if (condiciones.garantia) {
      datos.push(`Garantía: ${condiciones.garantia}`);
    }
    if (condiciones.portesImporte !== undefined) {
      datos.push(`Portes: ${condiciones.portesPagados ? 'Pagados' : this.formatearMoneda(condiciones.portesImporte)}`);
    }

    if (datos.length > 0) {
      this.doc.text(datos.join(' | '), 40, this.y);
      this.y += 15;
    }
  }

  /**
   * Renderiza las líneas del pedido
   */
  private renderizarLineasPedido(
    lineas: ILineaPedido[],
    opciones: OpcionesImpresionPedido
  ): void {
    const tableLeft = 40;
    const tableWidth = 515;
    const headerHeight = 18;
    const rowHeight = 16;

    // Columnas específicas para pedido
    const cols = opciones.mostrarEstadoLineas ? {
      concepto: { x: tableLeft, width: 160 },
      cantidad: { x: tableLeft + 160, width: 40 },
      servida: { x: tableLeft + 200, width: 40 },
      pendiente: { x: tableLeft + 240, width: 40 },
      precio: { x: tableLeft + 280, width: 60 },
      dto: { x: tableLeft + 340, width: 35 },
      iva: { x: tableLeft + 375, width: 35 },
      importe: { x: tableLeft + 410, width: 65 },
    } : {
      concepto: { x: tableLeft, width: 200 },
      cantidad: { x: tableLeft + 200, width: 50 },
      precio: { x: tableLeft + 250, width: 70 },
      dto: { x: tableLeft + 320, width: 40 },
      iva: { x: tableLeft + 360, width: 40 },
      importe: { x: tableLeft + 400, width: 75 },
    };

    // Header de tabla
    const drawTableHeader = (yPos: number): number => {
      this.doc.fillColor(this.colores.primario)
         .rect(tableLeft, yPos, tableWidth, headerHeight)
         .fill();

      this.doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold');
      const hY = yPos + 5;

      this.doc.text('Descripción', cols.concepto.x + 2, hY);
      this.doc.text('Cant.', cols.cantidad.x, hY, { width: cols.cantidad.width, align: 'right' });

      if (opciones.mostrarEstadoLineas && 'servida' in cols) {
        this.doc.text('Serv.', (cols as any).servida.x, hY, { width: (cols as any).servida.width, align: 'right' });
        this.doc.text('Pend.', (cols as any).pendiente.x, hY, { width: (cols as any).pendiente.width, align: 'right' });
      }

      this.doc.text('Precio', cols.precio.x, hY, { width: cols.precio.width, align: 'right' });
      this.doc.text('Dto', cols.dto.x, hY, { width: cols.dto.width, align: 'right' });
      this.doc.text('IVA', cols.iva.x, hY, { width: cols.iva.width, align: 'right' });
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
      let nombreDisplay = this.truncarTexto(linea.nombre, 28);
      if (opciones.mostrarReferencias && linea.codigo) {
        nombreDisplay += ` (${linea.codigo})`;
      }
      this.doc.font('Helvetica-Bold')
         .fillColor(this.colores.texto)
         .text(this.truncarTexto(nombreDisplay, 35), cols.concepto.x + 2, textY);

      this.doc.font('Helvetica').fontSize(7).fillColor(this.colores.texto);

      // Cantidad
      const cantidadTexto = linea.unidad ? `${linea.cantidad} ${linea.unidad}` : String(linea.cantidad);
      this.doc.text(cantidadTexto, cols.cantidad.x, textY, { width: cols.cantidad.width, align: 'right' });

      // Servida y pendiente (si aplica)
      if (opciones.mostrarEstadoLineas && 'servida' in cols) {
        this.doc.text(String(linea.cantidadServida || 0), (cols as any).servida.x, textY, { width: (cols as any).servida.width, align: 'right' });

        const pendiente = linea.cantidadPendiente || 0;
        if (pendiente > 0) {
          this.doc.fillColor(this.colores.alerta);
        }
        this.doc.text(String(pendiente), (cols as any).pendiente.x, textY, { width: (cols as any).pendiente.width, align: 'right' });
        this.doc.fillColor(this.colores.texto);
      }

      // Precio
      this.doc.text(this.formatearMoneda(linea.precioUnitario), cols.precio.x, textY, { width: cols.precio.width, align: 'right' });

      // Descuento
      const dtoTexto = linea.descuento > 0 ? `${linea.descuento}%` : '-';
      this.doc.text(dtoTexto, cols.dto.x, textY, { width: cols.dto.width, align: 'right' });

      // IVA
      this.doc.text(`${linea.iva}%`, cols.iva.x, textY, { width: cols.iva.width, align: 'right' });

      // Subtotal
      this.doc.font('Helvetica-Bold')
         .text(this.formatearMoneda(linea.subtotal), cols.importe.x, textY, { width: cols.importe.width, align: 'right' });

      this.y += rowHeight;
    }
  }

  /**
   * Extrae los totales para el PDF
   */
  private extraerTotales(pedido: IPedido): TotalesDocumento {
    return {
      subtotalBruto: pedido.totales?.subtotalBruto || 0,
      totalDescuentos: pedido.totales?.totalDescuentos || 0,
      subtotalNeto: pedido.totales?.subtotalNeto || 0,
      desgloseIva: pedido.totales?.desgloseIva?.map(iva => ({
        tipo: iva.tipo,
        base: iva.base,
        cuota: iva.cuota,
      })) || [],
      totalIva: pedido.totales?.totalIva || 0,
      total: pedido.totales?.totalPedido || 0,
    };
  }
}

export const pedidosPDFService = new PedidosPDFService();
export default pedidosPDFService;
