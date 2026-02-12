// apps/backend/src/modules/partes-trabajo/partes-trabajo-pdf.service.ts
// Servicio para generación de PDFs de partes de trabajo

import {
  DocumentoPDFBaseService,
  DatosDocumento,
  DatosCliente,
  OpcionesImpresion,
  defaultOpcionesImpresion,
} from '@/modules/plantillas-documento/documento-pdf-base.service';
import { TipoDocumentoPlantilla } from '@/modules/plantillas-documento/PlantillaDocumento';
import { getFirmaModel } from '@/utils/dynamic-models.helper';
import {
  IParteTrabajo,
  ILineaPersonal,
  ILineaMaterial,
  ILineaMaquinaria,
  ILineaTransporte,
  ILineaGasto,
  Prioridad,
  TipoParteTrabajo,
} from './ParteTrabajo';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';

// ============================================
// INTERFACES ESPECÍFICAS DE PARTE DE TRABAJO
// ============================================

export interface OpcionesImpresionParteTrabajo extends OpcionesImpresion {
  mostrarProyecto?: boolean;
  mostrarPersonal?: boolean;
  mostrarMaterial?: boolean;
  mostrarMaquinaria?: boolean;
  mostrarTransporte?: boolean;
  mostrarGastos?: boolean;
  mostrarCostes?: boolean;
  mostrarFirmas?: boolean;
  mostrarJornadas?: boolean;
}

// ============================================
// SERVICIO PDF PARTES DE TRABAJO
// ============================================

class PartesTrabajoTDFService extends DocumentoPDFBaseService {
  /**
   * Genera un PDF del parte de trabajo
   */
  async generarPDF(
    dbConfig: IDatabaseConfig,
    parte: IParteTrabajo,
    opciones: OpcionesImpresionParteTrabajo = {}
  ): Promise<Buffer> {
    const opts: OpcionesImpresionParteTrabajo = {
      ...defaultOpcionesImpresion,
      mostrarProyecto: true,
      mostrarPersonal: true,
      mostrarMaterial: true,
      mostrarMaquinaria: true,
      mostrarTransporte: true,
      mostrarGastos: true,
      mostrarCostes: false, // Por defecto no mostrar costes al cliente
      mostrarFirmas: true,
      mostrarJornadas: true,
      ...opciones,
    };

    // Extraer empresaId del parte
    const empresaId = String(parte.empresaId);

    try {
      // Inicializar documento con la configuración de base de datos
      await this.inicializarDocumento(
        empresaId,
        TipoDocumentoPlantilla.PARTE_TRABAJO,
        dbConfig,
        opts.plantillaId
      );

      // Renderizar cabecera
      this.renderizarCabecera('PARTE DE TRABAJO', this.extraerDatosDocumento(parte));

      // Tipo y prioridad
      this.renderizarTipoPrioridad(parte);

      // Renderizar datos del cliente
      this.renderizarCliente(this.extraerDatosCliente(parte));

      // Proyecto (si existe)
      if (opts.mostrarProyecto && parte.proyectoId) {
        this.renderizarProyecto(parte);
      }

      // Dirección de trabajo
      if (parte.direccionTrabajo) {
        this.renderizarDireccionTrabajo(parte);
      }

      // Título y descripción
      if (parte.titulo) {
        this.doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(this.colores.texto)
           .text(this.truncarTexto(parte.titulo, 80), 40, this.y);
        this.y += 15;
      }

      if (parte.descripcion) {
        this.doc.fontSize(9)
           .font('Helvetica')
           .fillColor(this.colores.textoClaro)
           .text(this.truncarTexto(parte.descripcion, 200), 40, this.y, { width: 515 });
        this.y += 20;
      }

      // Jornadas de trabajo (si es multi-día)
      if (opts.mostrarJornadas && parte.esMultiDia && parte.jornadas && parte.jornadas.length > 0) {
        this.renderizarJornadas(parte);
      }

      // Líneas de personal
      if (opts.mostrarPersonal && parte.lineasPersonal && parte.lineasPersonal.length > 0) {
        this.renderizarLineasPersonal(parte.lineasPersonal, opts.mostrarCostes);
      }

      // Líneas de material
      if (opts.mostrarMaterial && parte.lineasMaterial && parte.lineasMaterial.length > 0) {
        this.renderizarLineasMaterial(parte.lineasMaterial, opts.mostrarCostes);
      }

      // Líneas de maquinaria
      if (opts.mostrarMaquinaria && parte.lineasMaquinaria && parte.lineasMaquinaria.length > 0) {
        this.renderizarLineasMaquinaria(parte.lineasMaquinaria, opts.mostrarCostes);
      }

      // Líneas de transporte
      if (opts.mostrarTransporte && parte.lineasTransporte && parte.lineasTransporte.length > 0) {
        this.renderizarLineasTransporte(parte.lineasTransporte, opts.mostrarCostes);
      }

      // Líneas de gastos
      if (opts.mostrarGastos && parte.lineasGastos && parte.lineasGastos.length > 0) {
        this.renderizarLineasGastos(parte.lineasGastos, opts.mostrarCostes);
      }

      // Totales
      this.renderizarTotalesParteTrabajo(parte, opts.mostrarCostes);

      // Trabajo realizado
      if (parte.trabajoRealizado) {
        this.renderizarTrabajoRealizado(parte);
      }

      // Firmas
      if (opts.mostrarFirmas) {
        await this.renderizarFirmasParteTrabajo(parte);
      }

      // Pie
      const textoCondiciones = parte.observacionesInternas ||
        this.empresa?.textosLegales?.condicionesVenta;
      opts.textoCondiciones = textoCondiciones;
      this.renderizarPie(opts);

      // Finalizar y retornar buffer
      return await this.finalizarDocumento();
    } catch (error) {
      console.error('Error generando PDF de parte de trabajo:', error);
      throw error;
    }
  }

  /**
   * Extrae los datos del documento
   */
  private extraerDatosDocumento(parte: IParteTrabajo): DatosDocumento {
    return {
      codigo: parte.codigo,
      serie: parte.serie,
      numero: parte.numero,
      fecha: parte.fecha,
      fechaVencimiento: parte.fechaPrevista,
      titulo: parte.titulo,
    };
  }

  /**
   * Extrae los datos del cliente
   */
  private extraerDatosCliente(parte: IParteTrabajo): DatosCliente {
    return {
      nombre: parte.clienteNombre,
      nif: parte.clienteNif,
      email: parte.clienteEmail,
      telefono: parte.clienteTelefono,
    };
  }

  /**
   * Renderiza el tipo y prioridad
   */
  private renderizarTipoPrioridad(parte: IParteTrabajo): void {
    const tipoTextos: Record<TipoParteTrabajo, string> = {
      [TipoParteTrabajo.MANTENIMIENTO]: 'Mantenimiento',
      [TipoParteTrabajo.INSTALACION]: 'Instalación',
      [TipoParteTrabajo.REPARACION]: 'Reparación',
      [TipoParteTrabajo.SERVICIO]: 'Servicio',
      [TipoParteTrabajo.PROYECTO]: 'Proyecto',
      [TipoParteTrabajo.OTRO]: 'Otro',
    };

    const prioridadConfig: Record<Prioridad, { color: string; texto: string }> = {
      [Prioridad.BAJA]: { color: this.colores.exito, texto: 'BAJA' },
      [Prioridad.MEDIA]: { color: this.colores.alerta, texto: 'MEDIA' },
      [Prioridad.ALTA]: { color: this.colores.error, texto: 'ALTA' },
      [Prioridad.URGENTE]: { color: '#dc2626', texto: 'URGENTE' },
    };

    const prioridad = prioridadConfig[parte.prioridad] || prioridadConfig[Prioridad.MEDIA];

    // Badge de tipo
    this.doc.fillColor(this.colores.secundario)
       .roundedRect(400, 85, 70, 18, 3)
       .fill();

    this.doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text(tipoTextos[parte.tipo] || 'Otro', 405, 90, { width: 60, align: 'center' });

    // Badge de prioridad
    this.doc.fillColor(prioridad.color)
       .roundedRect(475, 85, 60, 18, 3)
       .fill();

    this.doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text(prioridad.texto, 480, 90, { width: 50, align: 'center' });
  }

  /**
   * Renderiza información del proyecto
   */
  private renderizarProyecto(parte: IParteTrabajo): void {
    this.doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text('Proyecto:', 40, this.y);

    this.doc.font('Helvetica')
       .fillColor(this.colores.secundario)
       .text(`${parte.proyectoCodigo || ''} - ${parte.proyectoNombre || ''}`, 90, this.y);

    this.y += 15;
  }

  /**
   * Renderiza la dirección de trabajo
   */
  private renderizarDireccionTrabajo(parte: IParteTrabajo): void {
    const direccion = parte.direccionTrabajo;
    if (!direccion) return;

    const boxX = 305;
    const boxWidth = 250;
    const boxY = this.y - 80;

    this.doc.fillColor(this.colores.fondoAlterno)
       .rect(boxX, boxY, boxWidth, 60)
       .fill();

    this.doc.strokeColor(this.colores.borde)
       .lineWidth(0.5)
       .rect(boxX, boxY, boxWidth, 60)
       .stroke();

    let dirY = boxY + 8;

    this.doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colores.textoClaro)
       .text('LUGAR DE TRABAJO', boxX + 10, dirY);
    dirY += 12;

    const direccionTexto = [
      direccion.calle,
      direccion.codigoPostal,
      direccion.ciudad,
      direccion.provincia,
    ].filter(Boolean).join(', ');

    if (direccionTexto) {
      this.doc.fontSize(8)
         .font('Helvetica')
         .fillColor(this.colores.texto)
         .text(this.truncarTexto(direccionTexto, 45), boxX + 10, dirY);
    }
  }

  /**
   * Renderiza las jornadas de trabajo
   */
  private renderizarJornadas(parte: IParteTrabajo): void {
    this.verificarSaltoPagina(60);

    this.doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text('Jornadas de trabajo', 40, this.y);
    this.y += 15;

    for (const jornada of parte.jornadas) {
      if (this.y > this.contentBottom - 30) {
        this.doc.addPage();
        this.y = 40;
      }

      this.doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor(this.colores.texto)
         .text(this.formatearFecha(jornada.fecha), 40, this.y);

      if (jornada.horaInicio || jornada.horaFin) {
        this.doc.font('Helvetica')
           .fillColor(this.colores.textoClaro)
           .text(`${jornada.horaInicio || ''} - ${jornada.horaFin || ''}`, 120, this.y);
      }

      // Personal asignado
      if (jornada.personal && jornada.personal.length > 0) {
        const nombres = jornada.personal.map(p => p.nombre).join(', ');
        this.doc.text(`Personal: ${this.truncarTexto(nombres, 50)}`, 200, this.y);
      }

      this.y += 12;
    }

    this.y += 10;
  }

  /**
   * Renderiza líneas de personal
   */
  private renderizarLineasPersonal(lineas: ILineaPersonal[], mostrarCostes?: boolean): void {
    this.renderizarSeccionLineas(
      'Mano de obra',
      ['Personal', 'Fecha', 'Horas', mostrarCostes ? 'Coste' : '', 'Venta'],
      lineas.map(l => [
        this.truncarTexto(l.personalNombre, 25),
        this.formatearFecha(l.fecha),
        `${l.horasTrabajadas}h`,
        mostrarCostes ? this.formatearMoneda(l.costeTotal) : '',
        this.formatearMoneda(l.ventaTotal),
      ]),
      lineas.reduce((sum, l) => sum + l.ventaTotal, 0)
    );
  }

  /**
   * Renderiza líneas de material
   */
  private renderizarLineasMaterial(lineas: ILineaMaterial[], mostrarCostes?: boolean): void {
    this.renderizarSeccionLineas(
      'Materiales',
      ['Producto', 'Cantidad', 'P.Unitario', mostrarCostes ? 'Coste' : '', 'Venta'],
      lineas.map(l => [
        this.truncarTexto(l.productoNombre, 25),
        `${l.cantidad} ${l.unidad}`,
        this.formatearMoneda(l.precioVenta),
        mostrarCostes ? this.formatearMoneda(l.costeTotal) : '',
        this.formatearMoneda(l.ventaTotal),
      ]),
      lineas.reduce((sum, l) => sum + l.ventaTotal, 0)
    );
  }

  /**
   * Renderiza líneas de maquinaria
   */
  private renderizarLineasMaquinaria(lineas: ILineaMaquinaria[], mostrarCostes?: boolean): void {
    this.renderizarSeccionLineas(
      'Maquinaria',
      ['Máquina', 'Cantidad', 'Tipo', mostrarCostes ? 'Coste' : '', 'Venta'],
      lineas.map(l => [
        this.truncarTexto(l.nombre, 25),
        String(l.cantidad),
        l.tipoUnidad,
        mostrarCostes ? this.formatearMoneda(l.costeTotal) : '',
        this.formatearMoneda(l.ventaTotal),
      ]),
      lineas.reduce((sum, l) => sum + l.ventaTotal, 0)
    );
  }

  /**
   * Renderiza líneas de transporte
   */
  private renderizarLineasTransporte(lineas: ILineaTransporte[], mostrarCostes?: boolean): void {
    this.renderizarSeccionLineas(
      'Transporte',
      ['Vehículo', 'Fecha', 'Km', mostrarCostes ? 'Coste' : '', 'Venta'],
      lineas.map(l => [
        this.truncarTexto(l.vehiculoNombre, 25),
        this.formatearFecha(l.fecha),
        `${l.kmRecorridos} km`,
        mostrarCostes ? this.formatearMoneda(l.costeTotal) : '',
        this.formatearMoneda(l.precioVenta),
      ]),
      lineas.reduce((sum, l) => sum + l.precioVenta, 0)
    );
  }

  /**
   * Renderiza líneas de gastos
   */
  private renderizarLineasGastos(lineas: ILineaGasto[], mostrarCostes?: boolean): void {
    this.renderizarSeccionLineas(
      'Gastos',
      ['Tipo', 'Fecha', 'Descripción', mostrarCostes ? 'Importe' : '', 'Facturable'],
      lineas.map(l => [
        this.truncarTexto(l.tipoGastoNombre, 20),
        this.formatearFecha(l.fecha),
        this.truncarTexto(l.descripcion || '', 20),
        mostrarCostes ? this.formatearMoneda(l.importe) : '',
        this.formatearMoneda(l.importeFacturable),
      ]),
      lineas.reduce((sum, l) => sum + l.importeFacturable, 0)
    );
  }

  /**
   * Renderiza una sección de líneas genérica
   */
  private renderizarSeccionLineas(
    titulo: string,
    headers: string[],
    filas: string[][],
    total: number
  ): void {
    this.verificarSaltoPagina(60);

    // Título de sección
    this.doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text(titulo, 40, this.y);
    this.y += 15;

    const tableLeft = 40;
    const tableWidth = 515;
    const headerHeight = 16;
    const rowHeight = 14;

    // Filtrar headers vacíos y calcular anchos
    const activeHeaders = headers.filter(h => h);
    const colWidth = tableWidth / activeHeaders.length;

    // Header
    this.doc.fillColor(this.colores.primario)
       .rect(tableLeft, this.y, tableWidth, headerHeight)
       .fill();

    this.doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold');
    activeHeaders.forEach((header, i) => {
      const align = i === 0 ? 'left' : 'right';
      this.doc.text(header, tableLeft + i * colWidth + 5, this.y + 4, { width: colWidth - 10, align });
    });

    this.y += headerHeight;

    // Filas
    for (let i = 0; i < filas.length; i++) {
      if (this.y + rowHeight > this.contentBottom) {
        this.doc.addPage();
        this.y = 40;
      }

      if (i % 2 === 0) {
        this.doc.fillColor(this.colores.fondoAlterno)
           .rect(tableLeft, this.y, tableWidth, rowHeight)
           .fill();
      }

      this.doc.strokeColor(this.colores.borde)
         .lineWidth(0.5)
         .rect(tableLeft, this.y, tableWidth, rowHeight)
         .stroke();

      const fila = filas[i].filter((_, idx) => headers[idx]); // Filtrar columnas vacías
      this.doc.fillColor(this.colores.texto).fontSize(7).font('Helvetica');

      fila.forEach((valor, j) => {
        const align = j === 0 ? 'left' : 'right';
        this.doc.text(valor, tableLeft + j * colWidth + 5, this.y + 3, { width: colWidth - 10, align });
      });

      this.y += rowHeight;
    }

    // Total de sección
    this.doc.fillColor(this.colores.fondoAlterno)
       .rect(tableLeft, this.y, tableWidth, rowHeight)
       .fill();

    this.doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text(`Total ${titulo}:`, tableLeft + 5, this.y + 3)
       .text(this.formatearMoneda(total), tableLeft + tableWidth - 80, this.y + 3, { width: 75, align: 'right' });

    this.y += rowHeight + 15;
  }

  /**
   * Renderiza los totales del parte de trabajo
   */
  private renderizarTotalesParteTrabajo(parte: IParteTrabajo, mostrarCostes?: boolean): void {
    this.verificarSaltoPagina(80);

    const totales = parte.totales;
    if (!totales) return;

    const totalesX = 360;
    const totalesWidth = 195;
    const lineasTotales = mostrarCostes ? 8 : 5;
    const totalesHeight = 20 + lineasTotales * 14;

    this.doc.fillColor(this.colores.fondoAlterno)
       .rect(totalesX, this.y, totalesWidth, totalesHeight)
       .fill();

    this.doc.strokeColor(this.colores.borde)
       .rect(totalesX, this.y, totalesWidth, totalesHeight)
       .stroke();

    let totY = this.y + 8;
    this.doc.fontSize(8).fillColor(this.colores.texto).font('Helvetica');

    // Desglose por tipo
    this.doc.text('Personal:', totalesX + 10, totY);
    this.doc.text(this.formatearMoneda(totales.ventaPersonal), totalesX + 100, totY, { width: 85, align: 'right' });
    totY += 12;

    this.doc.text('Material:', totalesX + 10, totY);
    this.doc.text(this.formatearMoneda(totales.ventaMaterial), totalesX + 100, totY, { width: 85, align: 'right' });
    totY += 12;

    this.doc.text('Maquinaria:', totalesX + 10, totY);
    this.doc.text(this.formatearMoneda(totales.ventaMaquinaria), totalesX + 100, totY, { width: 85, align: 'right' });
    totY += 12;

    this.doc.text('Transporte:', totalesX + 10, totY);
    this.doc.text(this.formatearMoneda(totales.ventaTransporte), totalesX + 100, totY, { width: 85, align: 'right' });
    totY += 12;

    this.doc.text('Gastos:', totalesX + 10, totY);
    this.doc.text(this.formatearMoneda(totales.ventaGastos), totalesX + 100, totY, { width: 85, align: 'right' });
    totY += 14;

    // Subtotal
    this.doc.strokeColor(this.colores.borde)
       .moveTo(totalesX + 10, totY - 4)
       .lineTo(totalesX + totalesWidth - 10, totY - 4)
       .stroke();

    this.doc.text('Subtotal:', totalesX + 10, totY);
    this.doc.text(this.formatearMoneda(totales.subtotalVenta), totalesX + 100, totY, { width: 85, align: 'right' });
    totY += 12;

    this.doc.text('IVA:', totalesX + 10, totY);
    this.doc.text(this.formatearMoneda(totales.totalIva), totalesX + 100, totY, { width: 85, align: 'right' });
    totY += 14;

    // Total con fondo oscuro
    this.doc.fillColor(this.colores.primario)
       .rect(totalesX, totY - 2, totalesWidth, 22)
       .fill();

    this.doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text('TOTAL:', totalesX + 10, totY + 4)
       .text(this.formatearMoneda(totales.totalVenta), totalesX + 80, totY + 4, { width: 105, align: 'right' });

    this.y += totalesHeight + 20;
  }

  /**
   * Renderiza el trabajo realizado
   */
  private renderizarTrabajoRealizado(parte: IParteTrabajo): void {
    if (!parte.trabajoRealizado) return;

    this.verificarSaltoPagina(60);

    this.doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text('Trabajo realizado:', 40, this.y);
    this.y += 12;

    this.doc.fontSize(8)
       .font('Helvetica')
       .fillColor(this.colores.textoClaro)
       .text(parte.trabajoRealizado, 40, this.y, { width: 300, height: 60 });

    this.y += 70;
  }

  /**
   * Renderiza las firmas del parte de trabajo, embebiendo firmas reales si existen
   */
  private async renderizarFirmasParteTrabajo(parte: IParteTrabajo): Promise<void> {
    this.verificarSaltoPagina(100);

    this.y += 20;

    // Buscar firmas reales del documento
    let firmasReales: any[] = [];
    try {
      const empresaId = String(parte.empresaId);
      const empresa = (await import('@/modules/empresa/Empresa')).default;
      const emp = await empresa.findById(empresaId).select('databaseConfig').lean();
      if (emp?.databaseConfig) {
        const Firma = await getFirmaModel(empresaId, emp.databaseConfig);
        firmasReales = await Firma.find({
          documentoId: parte._id?.toString(),
          tipoDocumento: 'parteTrabajo',
        }).sort({ timestamp: -1 }).lean();
      }
    } catch (e) {
      // Si falla la búsqueda de firmas, continuar sin ellas
    }

    // Separar firmas por tipo de firmante
    const firmasTecnico = firmasReales.filter(f => f.firmante?.tipo === 'interno');
    const firmasCliente = firmasReales.filter(f => f.firmante?.tipo === 'cliente');

    const firmaX1 = 60;
    const firmaY = this.y;
    const firmaWidth = 180;
    const firmaHeight = 70;

    // === Recuadro TÉCNICO ===
    this.doc.strokeColor(this.colores.borde)
       .lineWidth(1)
       .rect(firmaX1, firmaY, firmaWidth, firmaHeight)
       .stroke();

    this.doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text('TÉCNICO', firmaX1 + 10, firmaY + 5);

    const firmaTecManuscrita = firmasTecnico.find(f => f.imagenFirma);
    const firmaTecCert = firmasTecnico.find(f => f.tipo === 'certificado_digital');

    if (firmaTecManuscrita?.imagenFirma) {
      try {
        let imgData = firmaTecManuscrita.imagenFirma;
        if (imgData.startsWith('data:')) imgData = imgData.split(',')[1];
        const imgBuffer = Buffer.from(imgData, 'base64');
        this.doc.image(imgBuffer, firmaX1 + 15, firmaY + 16, {
          width: firmaWidth - 30,
          height: 30,
          fit: [firmaWidth - 30, 30],
        });
      } catch (e) { /* ignorar error de imagen */ }
      this.doc.fontSize(6).font('Helvetica').fillColor(this.colores.textoClaro)
         .text(`${firmaTecManuscrita.firmante?.nombre || ''} - ${this.formatearFecha(firmaTecManuscrita.timestamp)}`,
           firmaX1 + 10, firmaY + 50, { width: firmaWidth - 20, align: 'center' });
    } else if (firmaTecCert?.certificadoInfo) {
      this.doc.fontSize(7).font('Helvetica').fillColor(this.colores.textoClaro);
      this.doc.text(`${firmaTecCert.certificadoInfo.titular}`, firmaX1 + 10, firmaY + 20);
      this.doc.text(`NIF: ${firmaTecCert.certificadoInfo.nif || '-'}`, firmaX1 + 10, firmaY + 32);
      this.doc.fontSize(6).text(`${this.formatearFecha(firmaTecCert.timestamp)}`, firmaX1 + 10, firmaY + 44);
    } else {
      // Placeholder original
      if (parte.nombreTecnico) {
        this.doc.fontSize(7).font('Helvetica').fillColor(this.colores.textoClaro)
           .text(`Nombre: ${parte.nombreTecnico}`, firmaX1 + 10, firmaY + 18);
      }
      if (parte.fechaFirmaTecnico) {
        this.doc.text(`Fecha: ${this.formatearFecha(parte.fechaFirmaTecnico)}`, firmaX1 + 10, firmaY + 30);
      }
      this.doc.strokeColor(this.colores.borde).lineWidth(0.5)
         .moveTo(firmaX1 + 20, firmaY + firmaHeight - 15)
         .lineTo(firmaX1 + firmaWidth - 20, firmaY + firmaHeight - 15)
         .stroke();
    }

    // === Recuadro CLIENTE ===
    const firmaX2 = 320;

    this.doc.strokeColor(this.colores.borde)
       .lineWidth(1)
       .rect(firmaX2, firmaY, firmaWidth, firmaHeight)
       .stroke();

    this.doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colores.texto)
       .text('CLIENTE', firmaX2 + 10, firmaY + 5);

    const firmaCliManuscrita = firmasCliente.find(f => f.imagenFirma);
    const firmaCliCert = firmasCliente.find(f => f.tipo === 'certificado_digital');

    if (firmaCliManuscrita?.imagenFirma) {
      try {
        let imgData = firmaCliManuscrita.imagenFirma;
        if (imgData.startsWith('data:')) imgData = imgData.split(',')[1];
        const imgBuffer = Buffer.from(imgData, 'base64');
        this.doc.image(imgBuffer, firmaX2 + 15, firmaY + 16, {
          width: firmaWidth - 30,
          height: 30,
          fit: [firmaWidth - 30, 30],
        });
      } catch (e) { /* ignorar error de imagen */ }
      this.doc.fontSize(6).font('Helvetica').fillColor(this.colores.textoClaro)
         .text(`${firmaCliManuscrita.firmante?.nombre || ''} - ${this.formatearFecha(firmaCliManuscrita.timestamp)}`,
           firmaX2 + 10, firmaY + 50, { width: firmaWidth - 20, align: 'center' });
    } else if (firmaCliCert?.certificadoInfo) {
      this.doc.fontSize(7).font('Helvetica').fillColor(this.colores.textoClaro);
      this.doc.text(`${firmaCliCert.certificadoInfo.titular}`, firmaX2 + 10, firmaY + 20);
      this.doc.text(`NIF: ${firmaCliCert.certificadoInfo.nif || '-'}`, firmaX2 + 10, firmaY + 32);
      this.doc.fontSize(6).text(`${this.formatearFecha(firmaCliCert.timestamp)}`, firmaX2 + 10, firmaY + 44);
    } else {
      // Placeholder original
      if (parte.nombreCliente) {
        this.doc.fontSize(7).font('Helvetica').fillColor(this.colores.textoClaro)
           .text(`Nombre: ${parte.nombreCliente}`, firmaX2 + 10, firmaY + 18);
      }
      if (parte.dniCliente) {
        this.doc.text(`DNI: ${parte.dniCliente}`, firmaX2 + 10, firmaY + 30);
      }
      if (parte.fechaFirmaCliente) {
        this.doc.text(`Fecha: ${this.formatearFecha(parte.fechaFirmaCliente)}`, firmaX2 + 10, firmaY + 42);
      }
      this.doc.strokeColor(this.colores.borde).lineWidth(0.5)
         .moveTo(firmaX2 + 20, firmaY + firmaHeight - 15)
         .lineTo(firmaX2 + firmaWidth - 20, firmaY + firmaHeight - 15)
         .stroke();
    }

    this.y = firmaY + firmaHeight + 15;
  }

  /**
   * Verifica si hay espacio suficiente, si no, añade página
   */
  private verificarSaltoPagina(espacioRequerido: number): void {
    if (this.y > this.contentBottom - espacioRequerido) {
      this.doc.addPage();
      this.y = 40;
    }
  }
}

export const partesTrabajoTDFService = new PartesTrabajoTDFService();
export default partesTrabajoTDFService;
