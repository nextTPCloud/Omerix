// apps/backend/src/modules/plantillas-documento/documento-pdf-base.service.ts
// Servicio base para generación de PDFs usando plantillas configurables

import PDFDocument from 'pdfkit';
import axios from 'axios';
import {
  IPlantillaDocumento,
  TipoDocumentoPlantilla,
  IConfiguracionColores,
  IConfiguracionFuentes,
  IConfiguracionCabecera,
  IConfiguracionCliente,
  IConfiguracionLineas,
  IConfiguracionTotales,
  IConfiguracionPie,
} from './PlantillaDocumento';
import { IEmpresa, IDatabaseConfig } from '@/modules/empresa/Empresa';
import Empresa from '@/modules/empresa/Empresa';
import { getPlantillaDocumentoModel } from '@/utils/dynamic-models.helper';

// ============================================
// INTERFACES
// ============================================

export interface DatosDocumento {
  codigo: string;
  serie?: string;
  numero?: number;
  fecha: Date;
  fechaVencimiento?: Date;
  titulo?: string;
}

export interface DatosCliente {
  nombre: string;
  nif?: string;
  direccion?: {
    calle?: string;
    numero?: string;
    codigoPostal?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
  };
  email?: string;
  telefono?: string;
}

export interface LineaDocumento {
  orden: number;
  tipo: 'producto' | 'servicio' | 'kit' | 'texto' | 'subtotal' | 'descuento';
  codigo?: string;
  nombre: string;
  descripcion?: string;
  cantidad?: number;
  unidad?: string;
  precioUnitario?: number;
  descuento?: number;
  iva?: number;
  subtotal?: number;
}

export interface TotalesDocumento {
  subtotalBruto?: number;
  totalDescuentos?: number;
  subtotalNeto: number;
  desgloseIva?: {
    tipo: number;
    base: number;
    cuota: number;
    recargo?: number;
    cuotaRecargo?: number;
  }[];
  totalIva: number;
  totalRecargoEquivalencia?: number;
  total: number;
}

export interface OpcionesImpresion {
  plantillaId?: string;
  mostrarDescripcion?: 'ninguna' | 'corta' | 'larga';
  mostrarReferencias?: boolean;
  mostrarCondiciones?: boolean;
  mostrarFirmas?: boolean;
  mostrarCuentaBancaria?: boolean;
  mostrarLOPD?: boolean;
  mostrarRegistroMercantil?: boolean;
  mostrarVencimientos?: boolean;
  mostrarQR?: boolean;
  textoCondiciones?: string;
  textoPie?: string;
}

export const defaultOpcionesImpresion: OpcionesImpresion = {
  mostrarDescripcion: 'corta',
  mostrarReferencias: true,
  mostrarCondiciones: true,
  mostrarFirmas: true,
  mostrarCuentaBancaria: true,
  mostrarLOPD: true,
  mostrarRegistroMercantil: true,
  mostrarVencimientos: true,
  mostrarQR: false,
};

// Colores por defecto
const defaultColores: IConfiguracionColores = {
  primario: '#1F2937',
  secundario: '#3B82F6',
  texto: '#1F2937',
  textoClaro: '#6B7280',
  fondo: '#FFFFFF',
  fondoAlterno: '#F9FAFB',
  borde: '#E5E7EB',
  exito: '#22c55e',
  alerta: '#f59e0b',
  error: '#ef4444',
};

// ============================================
// CLASE BASE PDF SERVICE
// ============================================

export class DocumentoPDFBaseService {
  protected doc!: PDFKit.PDFDocument;
  protected plantilla!: IPlantillaDocumento | null;
  protected empresa!: IEmpresa | null;
  protected dbConfig!: IDatabaseConfig;
  protected colores!: IConfiguracionColores;
  protected fuentes!: IConfiguracionFuentes;
  protected y: number = 40;
  protected pageBottom: number = 760;
  protected footerSpace: number = 70;
  protected contentBottom: number = 690;
  protected logoBuffer: Buffer | null = null;

  /**
   * Carga la plantilla predeterminada del tipo de documento
   * Utiliza el modelo dinámico para buscar en la base de datos de la empresa
   */
  protected async cargarPlantilla(
    empresaId: string,
    tipo: TipoDocumentoPlantilla
  ): Promise<IPlantillaDocumento | null> {
    // Obtener modelo dinámico para la empresa
    const PlantillaModel = await getPlantillaDocumentoModel(empresaId, this.dbConfig);

    // Buscar plantilla predeterminada
    let plantilla = await PlantillaModel.findOne({
      empresaId,
      tipoDocumento: tipo,
      esPredeterminada: true,
      activa: true,
    }).lean() as IPlantillaDocumento | null;

    // Si no hay predeterminada, buscar cualquier activa
    if (!plantilla) {
      plantilla = await PlantillaModel.findOne({
        empresaId,
        tipoDocumento: tipo,
        activa: true,
      }).lean() as IPlantillaDocumento | null;
    }

    return plantilla;
  }

  /**
   * Carga una imagen desde URL
   */
  protected async cargarImagen(url: string): Promise<Buffer | null> {
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
   * Inicializa el documento PDF
   */
  protected async inicializarDocumento(
    empresaId: string,
    tipoDocumento: TipoDocumentoPlantilla,
    dbConfig: IDatabaseConfig,
    plantillaId?: string
  ): Promise<void> {
    // Guardar dbConfig para uso en métodos internos
    this.dbConfig = dbConfig;

    // Cargar empresa
    this.empresa = await Empresa.findById(empresaId).lean() as IEmpresa | null;

    // Obtener modelo dinámico para la empresa
    const PlantillaModel = await getPlantillaDocumentoModel(empresaId, dbConfig);

    // Cargar plantilla (por ID o predeterminada)
    if (plantillaId) {
      this.plantilla = await PlantillaModel.findById(plantillaId).lean() as IPlantillaDocumento | null;
    } else {
      this.plantilla = await this.cargarPlantilla(empresaId, tipoDocumento);
    }

    // Establecer colores y fuentes
    this.colores = this.plantilla?.colores || defaultColores;
    this.fuentes = this.plantilla?.fuentes || {
      familia: 'Helvetica',
      tamañoTitulo: 16,
      tamañoSubtitulo: 12,
      tamañoTexto: 10,
      tamañoPie: 8,
    };

    // Cargar logo si existe
    if (this.empresa?.logo) {
      this.logoBuffer = await this.cargarImagen(this.empresa.logo);
    }

    // Configurar márgenes
    const margenes = this.plantilla?.margenes || {
      superior: 40,
      inferior: 40,
      izquierdo: 40,
      derecho: 40,
    };

    // Configurar papel
    const papel = this.plantilla?.papel || { formato: 'A4', orientacion: 'vertical' };

    // Crear documento PDF
    this.doc = new PDFDocument({
      size: papel.formato as PDFKit.PDFDocumentOptions['size'],
      layout: papel.orientacion === 'horizontal' ? 'landscape' : 'portrait',
      margin: margenes.izquierdo,
      bufferPages: true,
    });

    this.y = margenes.superior;
    this.pageBottom = papel.formato === 'A4' ? 760 : 700;
    this.contentBottom = this.pageBottom - this.footerSpace;
  }

  /**
   * Renderiza la cabecera del documento
   */
  protected renderizarCabecera(
    tipoDocumento: string,
    documento: DatosDocumento
  ): void {
    const config = this.plantilla?.cabecera || {
      mostrarLogo: true,
      posicionLogo: 'izquierda',
      anchoLogo: 100,
      mostrarDatosEmpresa: true,
      mostrarNIF: true,
      mostrarDireccion: true,
      mostrarContacto: true,
      mostrarWeb: false,
    };

    const headerStartY = this.y;
    let logoWidth = 0;

    // Logo
    if (config.mostrarLogo && this.logoBuffer) {
      try {
        const logoX = config.posicionLogo === 'derecha' ? 400 : 40;
        this.doc.image(this.logoBuffer, logoX, this.y, { height: 50, fit: [config.anchoLogo || 100, 50] });
        logoWidth = (config.anchoLogo || 100) + 10;
      } catch (error) {
        console.error('Error insertando logo:', error);
      }
    }

    // Datos de empresa
    if (config.mostrarDatosEmpresa) {
      const empresaTextX = config.posicionLogo === 'derecha' ? 40 : 40 + logoWidth;

      this.doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(this.colores.texto)
         .text(this.empresa?.nombreComercial || this.empresa?.nombre || '', empresaTextX, this.y);
      this.y += 18;

      this.doc.fontSize(8).font('Helvetica').fillColor(this.colores.textoClaro);

      if (config.mostrarDireccion && this.empresa?.direccion) {
        const direccion = [
          this.empresa.direccion.calle,
          this.empresa.direccion.codigoPostal,
          this.empresa.direccion.ciudad,
        ].filter(Boolean).join(', ');
        if (direccion) {
          this.doc.text(direccion, empresaTextX, this.y);
          this.y += 10;
        }
      }

      const infoContacto: string[] = [];
      if (config.mostrarNIF && this.empresa?.nif) {
        infoContacto.push(`NIF: ${this.empresa.nif}`);
      }
      if (config.mostrarContacto && this.empresa?.telefono) {
        infoContacto.push(`Tel: ${this.empresa.telefono}`);
      }
      if (infoContacto.length > 0) {
        this.doc.text(infoContacto.join('   '), empresaTextX, this.y);
        this.y += 10;
      }

      if (config.mostrarContacto && this.empresa?.email) {
        this.doc.text(this.empresa.email, empresaTextX, this.y);
        this.y += 10;
      }

      if (config.mostrarWeb && this.empresa?.web) {
        this.doc.text(this.empresa.web, empresaTextX, this.y);
        this.y += 10;
      }
    }

    // Título del documento a la derecha
    const rightX = 400;
    const textoTitulo = this.plantilla?.textos?.tituloDocumento || tipoDocumento;

    this.doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text(textoTitulo, rightX, headerStartY, { width: 155, align: 'right' });

    this.doc.fontSize(12)
       .fillColor(this.colores.secundario)
       .text(documento.codigo, rightX, headerStartY + 20, { width: 155, align: 'right' });

    this.doc.fontSize(8)
       .font('Helvetica')
       .fillColor(this.colores.textoClaro)
       .text(`Fecha: ${this.formatearFecha(documento.fecha)}`, rightX, headerStartY + 38, { width: 155, align: 'right' });

    if (documento.fechaVencimiento) {
      this.doc.text(`Vencimiento: ${this.formatearFecha(documento.fechaVencimiento)}`, rightX, headerStartY + 50, { width: 155, align: 'right' });
    }

    this.y = Math.max(this.y, headerStartY + 65);

    // Línea separadora
    this.doc.strokeColor(this.colores.primario)
       .lineWidth(2)
       .moveTo(40, this.y)
       .lineTo(555, this.y)
       .stroke();

    this.y += 20;
  }

  /**
   * Renderiza los datos del cliente
   */
  protected renderizarCliente(cliente: DatosCliente): void {
    const config = this.plantilla?.cliente || {
      posicion: 'izquierda',
      mostrarTitulo: true,
      mostrarCodigo: false,
      mostrarNIF: true,
      mostrarDireccion: true,
      mostrarContacto: true,
    };

    const boxX = config.posicion === 'derecha' ? 305 : 40;
    const boxWidth = 250;
    const boxY = this.y;

    // Fondo del recuadro
    this.doc.fillColor(this.colores.fondoAlterno)
       .rect(boxX, boxY, boxWidth, 70)
       .fill();

    this.doc.strokeColor(this.colores.borde)
       .lineWidth(0.5)
       .rect(boxX, boxY, boxWidth, 70)
       .stroke();

    let clienteY = boxY + 8;

    // Título
    if (config.mostrarTitulo) {
      this.doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor(this.colores.textoClaro)
         .text('DATOS DEL CLIENTE', boxX + 10, clienteY);
      clienteY += 12;
    }

    // Nombre del cliente
    this.doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text(this.truncarTexto(cliente.nombre, 40), boxX + 10, clienteY);
    clienteY += 12;

    this.doc.fontSize(8).font('Helvetica').fillColor(this.colores.textoClaro);

    // NIF
    if (config.mostrarNIF && cliente.nif) {
      this.doc.text(`NIF: ${cliente.nif}`, boxX + 10, clienteY);
      clienteY += 10;
    }

    // Dirección
    if (config.mostrarDireccion && cliente.direccion) {
      const direccion = [
        cliente.direccion.calle,
        cliente.direccion.codigoPostal,
        cliente.direccion.ciudad,
      ].filter(Boolean).join(', ');
      if (direccion) {
        this.doc.text(this.truncarTexto(direccion, 45), boxX + 10, clienteY);
        clienteY += 10;
      }
    }

    // Contacto
    if (config.mostrarContacto) {
      if (cliente.email) {
        this.doc.text(this.truncarTexto(cliente.email, 35), boxX + 10, clienteY);
        clienteY += 10;
      }
      if (cliente.telefono) {
        this.doc.text(`Tel: ${cliente.telefono}`, boxX + 10, clienteY);
      }
    }

    this.y = boxY + 80;
  }

  /**
   * Renderiza la tabla de líneas
   */
  protected renderizarLineas(
    lineas: LineaDocumento[],
    opciones: OpcionesImpresion
  ): void {
    const config = this.plantilla?.lineas || {
      mostrarNumeroLinea: false,
      mostrarReferencia: true,
      mostrarDescripcion: true,
      mostrarCantidad: true,
      mostrarUnidad: true,
      mostrarPrecioUnitario: true,
      mostrarDescuento: true,
      mostrarIVA: true,
      mostrarSubtotal: true,
      filasZebra: true,
    };

    const tableLeft = 40;
    const tableWidth = 515;
    const headerHeight = 18;
    const rowHeight = 16;

    // Configuración de columnas
    const cols = {
      num: { x: tableLeft, width: 20 },
      concepto: { x: tableLeft + 20, width: 200 },
      cantidad: { x: tableLeft + 220, width: 50 },
      precio: { x: tableLeft + 270, width: 65 },
      dto: { x: tableLeft + 335, width: 35 },
      iva: { x: tableLeft + 370, width: 35 },
      importe: { x: tableLeft + 405, width: 70 },
    };

    // Header de tabla
    const drawTableHeader = (yPos: number): number => {
      this.doc.fillColor(this.colores.primario)
         .rect(tableLeft, yPos, tableWidth, headerHeight)
         .fill();

      this.doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold');
      const hY = yPos + 5;

      if (config.mostrarNumeroLinea) {
        this.doc.text('#', cols.num.x + 2, hY);
      }
      this.doc.text('Descripción', cols.concepto.x + 2, hY);
      if (config.mostrarCantidad) {
        this.doc.text('Cant.', cols.cantidad.x, hY, { width: cols.cantidad.width, align: 'right' });
      }
      if (config.mostrarPrecioUnitario) {
        this.doc.text('Precio', cols.precio.x, hY, { width: cols.precio.width, align: 'right' });
      }
      if (config.mostrarDescuento) {
        this.doc.text('Dto', cols.dto.x, hY, { width: cols.dto.width, align: 'right' });
      }
      if (config.mostrarIVA) {
        this.doc.text('IVA', cols.iva.x, hY, { width: cols.iva.width, align: 'right' });
      }
      if (config.mostrarSubtotal) {
        this.doc.text('Importe', cols.importe.x, hY, { width: cols.importe.width, align: 'right' });
      }

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

      // Fondo alternado (zebra)
      if (config.filasZebra && i % 2 === 0) {
        this.doc.fillColor(this.colores.fondoAlterno)
           .rect(tableLeft, this.y, tableWidth, rowHeight)
           .fill();
      }

      // Borde de fila
      this.doc.strokeColor(this.colores.borde)
         .lineWidth(0.5)
         .rect(tableLeft, this.y, tableWidth, rowHeight)
         .stroke();

      const textY = this.y + 4;
      this.doc.fillColor(this.colores.texto).font('Helvetica').fontSize(7);

      // Línea de texto
      if (linea.tipo === 'texto') {
        this.doc.font('Helvetica-Oblique')
           .fillColor(this.colores.textoClaro)
           .text(this.truncarTexto(linea.nombre, 100), tableLeft + 5, textY);
        this.y += rowHeight;
        continue;
      }

      // Línea de subtotal
      if (linea.tipo === 'subtotal') {
        this.doc.font('Helvetica-Bold')
           .fillColor(this.colores.texto)
           .text('Subtotal:', tableLeft + 5, textY, { width: cols.importe.x - tableLeft - 10, align: 'right' })
           .text(this.formatearMoneda(linea.subtotal || 0), cols.importe.x, textY, { width: cols.importe.width, align: 'right' });
        this.y += rowHeight;
        continue;
      }

      // Número de línea
      if (config.mostrarNumeroLinea) {
        this.doc.fillColor(this.colores.textoClaro)
           .text(String(i + 1), cols.num.x + 2, textY);
      }

      // Nombre con referencia
      let nombreDisplay = this.truncarTexto(linea.nombre, 35);
      if (opciones.mostrarReferencias && linea.codigo) {
        nombreDisplay += ` (${linea.codigo})`;
      }
      this.doc.font('Helvetica-Bold')
         .fillColor(this.colores.texto)
         .text(this.truncarTexto(nombreDisplay, 45), cols.concepto.x + 2, textY);

      this.doc.font('Helvetica').fillColor(this.colores.texto);

      // Cantidad
      if (config.mostrarCantidad && linea.cantidad !== undefined) {
        const cantidadTexto = linea.unidad ? `${linea.cantidad} ${linea.unidad}` : String(linea.cantidad);
        this.doc.text(cantidadTexto, cols.cantidad.x, textY, { width: cols.cantidad.width, align: 'right' });
      }

      // Precio unitario
      if (config.mostrarPrecioUnitario && linea.precioUnitario !== undefined) {
        this.doc.text(this.formatearMoneda(linea.precioUnitario), cols.precio.x, textY, { width: cols.precio.width, align: 'right' });
      }

      // Descuento
      if (config.mostrarDescuento) {
        const dtoTexto = linea.descuento && linea.descuento > 0 ? `${linea.descuento}%` : '-';
        this.doc.text(dtoTexto, cols.dto.x, textY, { width: cols.dto.width, align: 'right' });
      }

      // IVA
      if (config.mostrarIVA && linea.iva !== undefined) {
        this.doc.text(`${linea.iva}%`, cols.iva.x, textY, { width: cols.iva.width, align: 'right' });
      }

      // Subtotal
      if (config.mostrarSubtotal && linea.subtotal !== undefined) {
        this.doc.font('Helvetica-Bold')
           .text(this.formatearMoneda(linea.subtotal), cols.importe.x, textY, { width: cols.importe.width, align: 'right' });
      }

      this.y += rowHeight;
    }
  }

  /**
   * Renderiza los totales del documento
   */
  protected renderizarTotales(totales: TotalesDocumento): void {
    const config = this.plantilla?.totales || {
      posicion: 'derecha',
      mostrarSubtotal: true,
      mostrarDescuentoGlobal: true,
      mostrarBaseImponible: true,
      mostrarDetalleIVA: true,
      mostrarRecargoEquivalencia: false,
      mostrarRetencion: false,
      mostrarTotal: true,
      resaltarTotal: true,
    };

    this.y += 10;

    // Verificar espacio para totales
    const desgloseIva = totales.desgloseIva || [];
    const totalesHeight = 55 + desgloseIva.length * 12;

    if (this.y > this.contentBottom - totalesHeight - 20) {
      this.doc.addPage();
      this.y = 40;
    }

    const totalesX = config.posicion === 'izquierda' ? 40 :
                     config.posicion === 'centrado' ? 200 : 360;
    const totalesWidth = 195;

    // Fondo
    this.doc.fillColor(this.colores.fondoAlterno)
       .rect(totalesX, this.y, totalesWidth, totalesHeight)
       .fill();

    this.doc.strokeColor(this.colores.borde)
       .rect(totalesX, this.y, totalesWidth, totalesHeight)
       .stroke();

    let totY = this.y + 8;
    this.doc.fontSize(8).fillColor(this.colores.texto).font('Helvetica');

    // Base Imponible
    if (config.mostrarBaseImponible) {
      this.doc.text('Base Imponible:', totalesX + 10, totY);
      this.doc.text(this.formatearMoneda(totales.subtotalNeto), totalesX + 100, totY, { width: 85, align: 'right' });
      totY += 12;
    }

    // Desglose de IVA
    if (config.mostrarDetalleIVA && desgloseIva.length > 0) {
      for (const iva of desgloseIva) {
        this.doc.text(`IVA ${iva.tipo}%:`, totalesX + 10, totY);
        this.doc.text(this.formatearMoneda(iva.cuota), totalesX + 100, totY, { width: 85, align: 'right' });
        totY += 12;

        // Recargo equivalencia
        if (config.mostrarRecargoEquivalencia && iva.recargo && iva.cuotaRecargo) {
          this.doc.text(`R.E. ${iva.recargo}%:`, totalesX + 10, totY);
          this.doc.text(this.formatearMoneda(iva.cuotaRecargo), totalesX + 100, totY, { width: 85, align: 'right' });
          totY += 12;
        }
      }
    } else if (totales.totalIva > 0) {
      this.doc.text('IVA:', totalesX + 10, totY);
      this.doc.text(this.formatearMoneda(totales.totalIva), totalesX + 100, totY, { width: 85, align: 'right' });
      totY += 12;
    }

    // Total con fondo resaltado
    if (config.mostrarTotal && config.resaltarTotal) {
      this.doc.fillColor(this.colores.primario)
         .rect(totalesX, totY, totalesWidth, 22)
         .fill();

      this.doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#FFFFFF')
         .text('TOTAL:', totalesX + 10, totY + 6)
         .text(this.formatearMoneda(totales.total), totalesX + 80, totY + 6, { width: 105, align: 'right' });
    }

    this.y += totalesHeight + 15;
  }

  /**
   * Renderiza el pie de página con datos legales
   */
  protected renderizarPie(opciones: OpcionesImpresion): void {
    const config = this.plantilla?.pie || {
      mostrarCondiciones: true,
      mostrarFormaPago: true,
      mostrarVencimientos: true,
      mostrarDatosBancarios: true,
      mostrarFirma: false,
      mostrarPagina: true,
    };

    // Condiciones
    if (opciones.mostrarCondiciones && opciones.textoCondiciones) {
      if (this.y > this.contentBottom - 40) {
        this.doc.addPage();
        this.y = 40;
      }

      this.doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(this.colores.texto)
         .text('Condiciones:', 40, this.y);
      this.y += 12;

      this.doc.fontSize(6)
         .font('Helvetica')
         .fillColor(this.colores.textoClaro)
         .text(this.truncarTexto(opciones.textoCondiciones, 500), 40, this.y, { width: 515, height: 30, ellipsis: true });
      this.y += 35;
    }

    // Cuenta bancaria
    if (opciones.mostrarCuentaBancaria && this.empresa?.cuentasBancarias && this.empresa.cuentasBancarias.length > 0) {
      const cuenta = this.empresa.cuentasBancarias.find((c: any) => c.predeterminada && c.activa)
        || this.empresa.cuentasBancarias.find((c: any) => c.activa);

      if (cuenta) {
        if (this.y > this.contentBottom - 30) {
          this.doc.addPage();
          this.y = 40;
        }

        this.doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor(this.colores.texto)
           .text('Datos bancarios:', 40, this.y);
        this.y += 10;

        const bancoInfo = [
          cuenta.banco,
          `IBAN: ${cuenta.iban}`,
          cuenta.swift ? `BIC: ${cuenta.swift}` : '',
        ].filter(Boolean).join(' | ');

        this.doc.fontSize(7)
           .font('Helvetica')
           .fillColor(this.colores.textoClaro)
           .text(bancoInfo, 40, this.y);
        this.y += 15;
      }
    }

    // Firmas
    if (opciones.mostrarFirmas && config.mostrarFirma) {
      if (this.y > this.contentBottom - 50) {
        this.doc.addPage();
        this.y = 40;
      }

      this.y += 30;

      this.doc.strokeColor(this.colores.borde)
         .lineWidth(0.5)
         .moveTo(60, this.y).lineTo(200, this.y).stroke()
         .moveTo(340, this.y).lineTo(480, this.y).stroke();

      this.y += 5;
      this.doc.fontSize(7)
         .fillColor(this.colores.textoClaro)
         .text('La Empresa', 60, this.y, { width: 140, align: 'center' })
         .text('El Cliente', 340, this.y, { width: 140, align: 'center' });
    }

    // Pie de página en todas las páginas
    this.renderizarPiesEnTodasLasPaginas(opciones);
  }

  /**
   * Renderiza el pie de página en todas las páginas
   */
  protected renderizarPiesEnTodasLasPaginas(opciones: OpcionesImpresion): void {
    const pageCount = this.doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      this.doc.switchToPage(i);

      const footerY = this.doc.page.height - 50;

      // LOPD
      if (opciones.mostrarLOPD && this.empresa?.textosLegales?.textoLOPD) {
        const lopdText = this.truncarTexto(this.empresa.textosLegales.textoLOPD, 250);
        this.doc.fontSize(5)
           .font('Helvetica')
           .fillColor('#9CA3AF')
           .text(lopdText, 40, footerY - 15, {
             width: this.doc.page.width - 80,
             align: 'center',
             height: 12,
             ellipsis: true,
           });
      }

      // Registro mercantil
      if (opciones.mostrarRegistroMercantil && this.empresa) {
        const registroText = [
          this.empresa.nombre,
          this.empresa.nif ? `CIF: ${this.empresa.nif}` : '',
          this.empresa.datosRegistro?.registroMercantil,
        ].filter(Boolean).join(' · ');

        if (registroText) {
          this.doc.fontSize(5)
             .fillColor('#9CA3AF')
             .text(this.truncarTexto(registroText, 150), 40, footerY, {
               width: this.doc.page.width - 80,
               align: 'center',
             });
        }
      }

      // Número de página
      const configPie = this.plantilla?.pie || { mostrarPagina: true };
      if (configPie.mostrarPagina) {
        this.doc.fontSize(7)
           .fillColor(this.colores.textoClaro)
           .text(`Página ${i + 1} de ${pageCount}`, 40, this.doc.page.height - 25, {
             width: this.doc.page.width - 80,
             align: 'center',
           });
      }
    }
  }

  /**
   * Renderiza un código QR
   */
  protected async renderizarQR(data: string, x: number, y: number, size: number = 60): Promise<void> {
    // Importar QRCode dinámicamente
    try {
      const QRCode = await import('qrcode');
      const qrBuffer = await QRCode.toBuffer(data, {
        type: 'png',
        width: size,
        margin: 1,
      });
      this.doc.image(qrBuffer, x, y, { width: size });
    } catch (error) {
      console.error('Error generando QR:', error);
    }
  }

  /**
   * Trunca texto a un número máximo de caracteres
   */
  protected truncarTexto(texto: string, maxLength: number): string {
    if (!texto || texto.length <= maxLength) return texto || '';
    return texto.substring(0, maxLength) + '...';
  }

  /**
   * Formatea una fecha
   */
  protected formatearFecha(fecha: Date | string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Formatea un valor como moneda
   */
  protected formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(valor || 0);
  }

  /**
   * Finaliza y retorna el buffer del PDF
   */
  protected finalizarDocumento(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);
      this.doc.end();
    });
  }
}

export default DocumentoPDFBaseService;
