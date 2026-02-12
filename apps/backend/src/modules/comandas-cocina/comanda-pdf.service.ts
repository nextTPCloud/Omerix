// Servicio para generación de PDF de comandas de cocina (impresoras térmicas 80mm)

import PDFDocument from 'pdfkit';

// ============================================
// CONSTANTES
// ============================================

/** Ancho del papel térmico 80mm en puntos (80/25.4*72) */
const ANCHO_DOC = 226;
const MARGEN = 10;
const ANCHO_CONTENIDO = ANCHO_DOC - MARGEN * 2;

/** Tamaño de fuente para el contenido */
const FONT_SIZE = 9;
const FONT_SIZE_TITULO = 11;
const FONT_SIZE_MODIFICADORES = 8;

// ============================================
// SERVICIO COMANDA PDF
// ============================================

class ComandaPDFService {
  private doc!: PDFKit.PDFDocument;
  private y: number = 0;

  /**
   * Genera un PDF de comanda para impresora térmica de 80mm
   * @param comanda - Documento de comanda (puede tener mesaId y creadoPor populados)
   * @returns Buffer con el contenido del PDF
   */
  async generar(comanda: any): Promise<Buffer> {
    // Calcular la altura estimada del documento según el contenido
    const alturaEstimada = this.calcularAltura(comanda);

    // Crear documento con tamaño de papel térmico
    this.doc = new PDFDocument({
      size: [ANCHO_DOC, alturaEstimada],
      margins: { top: MARGEN, bottom: MARGEN, left: MARGEN, right: MARGEN },
      bufferPages: true,
    });

    this.y = MARGEN;

    // Cabecera con número de comanda
    this.renderizarCabecera(comanda);

    // Información de mesa, salón, camarero y hora
    this.renderizarInfo(comanda);

    // Separador
    this.renderizarSeparadorGuiones();

    // Líneas de productos con modificadores, alérgenos y comentarios
    this.renderizarLineas(comanda.lineas || []);

    // Separador
    this.renderizarSeparadorGuiones();

    // Aviso de urgencia si aplica
    if (comanda.prioridad === 'urgente') {
      this.renderizarUrgente();
    }

    // Notas generales de la comanda
    if (comanda.notas) {
      this.renderizarNotas(comanda.notas);
    }

    // Línea final
    this.renderizarSeparadorIgual();

    // Recoger el buffer y devolver
    return this.finalizarDocumento();
  }

  // ============================================
  // CÁLCULO DE ALTURA
  // ============================================

  /**
   * Estima la altura total del documento para evitar páginas extra
   */
  private calcularAltura(comanda: any): number {
    let altura = MARGEN * 2; // Márgenes superior e inferior
    altura += 20; // Cabecera (título comanda)
    altura += 50; // Info (mesa, camarero, hora)
    altura += 10; // Separador

    // Líneas de productos
    const lineas = comanda.lineas || [];
    for (const linea of lineas) {
      altura += 14; // Cantidad + nombre producto
      // Modificadores
      if (linea.modificadores && linea.modificadores.length > 0) {
        altura += linea.modificadores.length * 12;
      }
      // Alérgenos
      if (linea.alergenosNombres && linea.alergenosNombres.length > 0) {
        altura += 12;
      }
      // Comentario
      if (linea.comentario) {
        altura += 12;
      }
      altura += 4; // Espacio entre líneas
    }

    altura += 10; // Separador
    if (comanda.prioridad === 'urgente') {
      altura += 20;
    }
    if (comanda.notas) {
      altura += 20;
    }
    altura += 10; // Separador final

    return Math.max(altura, 120);
  }

  // ============================================
  // RENDERIZADO DE SECCIONES
  // ============================================

  /**
   * Renderiza la cabecera con el número de comanda centrado entre signos de igual
   */
  private renderizarCabecera(comanda: any): void {
    const numero = comanda.numeroComanda ?? '?';
    const texto = `COMANDA #${numero}`;

    // Calcular cuántos '=' caben a cada lado para centrar el texto
    this.doc.font('Courier').fontSize(FONT_SIZE_TITULO);
    const anchoTexto = this.doc.widthOfString(texto);
    const anchoIgual = this.doc.widthOfString('=');
    const espacioDisponible = ANCHO_CONTENIDO - anchoTexto - 2 * anchoIgual; // 2 espacios mínimos
    const numIguales = Math.max(1, Math.floor(espacioDisponible / (2 * anchoIgual)));
    const ladoIzq = '='.repeat(numIguales);
    const ladoDer = '='.repeat(numIguales);

    this.doc.text(
      `${ladoIzq} ${texto} ${ladoDer}`,
      MARGEN,
      this.y,
      { width: ANCHO_CONTENIDO, align: 'center' }
    );
    this.y += 16;
  }

  /**
   * Renderiza la información de mesa, salón, camarero y hora
   */
  private renderizarInfo(comanda: any): void {
    this.doc.font('Courier').fontSize(FONT_SIZE);

    // Mesa y salón en la misma línea
    const mesa = this.obtenerNumeroMesa(comanda);
    const salon = this.obtenerNombreSalon(comanda);
    let lineaMesa = `Mesa: ${mesa}`;
    if (salon) {
      lineaMesa += `    Salon: ${salon}`;
    }
    this.doc.text(lineaMesa, MARGEN, this.y, { width: ANCHO_CONTENIDO });
    this.y += 12;

    // Camarero
    const camarero = this.obtenerNombreCamarero(comanda);
    this.doc.text(`Camarero: ${camarero}`, MARGEN, this.y, { width: ANCHO_CONTENIDO });
    this.y += 12;

    // Hora de recepción
    const hora = this.formatearHora(comanda.horaRecepcion);
    this.doc.text(`Hora: ${hora}`, MARGEN, this.y, { width: ANCHO_CONTENIDO });
    this.y += 12;
  }

  /**
   * Renderiza las líneas de productos con modificadores, alérgenos y comentarios
   */
  private renderizarLineas(lineas: any[]): void {
    for (const linea of lineas) {
      // Cantidad y nombre del producto
      this.doc.font('Courier-Bold').fontSize(FONT_SIZE);
      const textoProducto = `${linea.cantidad}x  ${linea.nombreProducto}`;
      this.doc.text(textoProducto, MARGEN, this.y, { width: ANCHO_CONTENIDO });
      this.y += 14;

      // Modificadores (indentados con +)
      if (linea.modificadores && linea.modificadores.length > 0) {
        this.doc.font('Courier').fontSize(FONT_SIZE_MODIFICADORES);
        for (const mod of linea.modificadores) {
          this.doc.text(`    + ${mod.nombre}`, MARGEN, this.y, { width: ANCHO_CONTENIDO });
          this.y += 12;
        }
      }

      // Alérgenos (indentados con símbolo de advertencia)
      if (linea.alergenosNombres && linea.alergenosNombres.length > 0) {
        this.doc.font('Courier').fontSize(FONT_SIZE_MODIFICADORES);
        // Mostrar abreviaturas separadas por coma
        const alergenos = linea.alergenosNombres.join(', ');
        this.doc.text(`    ! ${alergenos}`, MARGEN, this.y, { width: ANCHO_CONTENIDO });
        this.y += 12;
      }

      // Comentario del cliente (indentado entre comillas)
      if (linea.comentario) {
        this.doc.font('Courier').fontSize(FONT_SIZE_MODIFICADORES);
        this.doc.text(`    "${linea.comentario}"`, MARGEN, this.y, { width: ANCHO_CONTENIDO });
        this.y += 12;
      }

      this.y += 4; // Espacio entre líneas
    }
  }

  /**
   * Renderiza el aviso de urgencia destacado
   */
  private renderizarUrgente(): void {
    this.doc.font('Courier-Bold').fontSize(FONT_SIZE_TITULO);
    this.doc.text('** URGENTE **', MARGEN, this.y, {
      width: ANCHO_CONTENIDO,
      align: 'center',
    });
    this.y += 16;
  }

  /**
   * Renderiza las notas generales de la comanda
   */
  private renderizarNotas(notas: string): void {
    this.doc.font('Courier').fontSize(FONT_SIZE_MODIFICADORES);
    this.doc.text(`Notas: ${notas}`, MARGEN, this.y, { width: ANCHO_CONTENIDO });
    this.y += 14;
  }

  // ============================================
  // SEPARADORES
  // ============================================

  /**
   * Renderiza una línea de guiones como separador
   */
  private renderizarSeparadorGuiones(): void {
    this.doc.font('Courier').fontSize(FONT_SIZE);
    const anchoGuion = this.doc.widthOfString('-');
    const numGuiones = Math.floor(ANCHO_CONTENIDO / anchoGuion);
    this.doc.text('-'.repeat(numGuiones), MARGEN, this.y, { width: ANCHO_CONTENIDO });
    this.y += 12;
  }

  /**
   * Renderiza una línea de signos de igual como separador
   */
  private renderizarSeparadorIgual(): void {
    this.doc.font('Courier').fontSize(FONT_SIZE);
    const anchoIgual = this.doc.widthOfString('=');
    const numIguales = Math.floor(ANCHO_CONTENIDO / anchoIgual);
    this.doc.text('='.repeat(numIguales), MARGEN, this.y, { width: ANCHO_CONTENIDO });
    this.y += 12;
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Obtiene el número de mesa.
   * Si mesaId está populado (tiene campo `numero`), lo usa; si no, usa numeroMesa.
   */
  private obtenerNumeroMesa(comanda: any): string {
    if (comanda.mesaId && typeof comanda.mesaId === 'object' && comanda.mesaId.numero) {
      return String(comanda.mesaId.numero);
    }
    return comanda.numeroMesa || '-';
  }

  /**
   * Obtiene el nombre del salón desde mesaId populado (si tiene salonId con nombre)
   * o desde el campo salonNombre directamente
   */
  private obtenerNombreSalon(comanda: any): string {
    // Si mesaId está populado y tiene referencia al salón
    if (comanda.mesaId && typeof comanda.mesaId === 'object' && comanda.mesaId.salonId) {
      if (typeof comanda.mesaId.salonId === 'object' && comanda.mesaId.salonId.nombre) {
        return comanda.mesaId.salonId.nombre;
      }
    }
    return comanda.salonNombre || '';
  }

  /**
   * Obtiene el nombre del camarero.
   * Si creadoPor está populado (tiene campo `nombre`), lo usa;
   * si no, usa camareroNombre o 'TPV' como fallback.
   */
  private obtenerNombreCamarero(comanda: any): string {
    if (comanda.creadoPor && typeof comanda.creadoPor === 'object' && comanda.creadoPor.nombre) {
      return comanda.creadoPor.nombre;
    }
    return comanda.camareroNombre || 'TPV';
  }

  /**
   * Formatea una fecha/hora mostrando solo horas y minutos (formato HH:mm)
   */
  private formatearHora(fecha: Date | string | undefined): string {
    if (!fecha) return '--:--';
    const d = new Date(fecha);
    const horas = d.getHours().toString().padStart(2, '0');
    const minutos = d.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  }

  /**
   * Finaliza el documento y devuelve el buffer resultante
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

// Exportar instancia singleton
export const comandaPdfService = new ComandaPDFService();
export default comandaPdfService;
