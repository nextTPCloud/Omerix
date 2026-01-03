// ===========================================
// SERVICIO DE IMPRESIÓN TPV
// Comandos ESC/POS para impresoras térmicas
// ===========================================

// Constantes ESC/POS
const ESC = '\x1B';
const GS = '\x1D';

// Comandos básicos
const COMMANDS = {
  INIT: ESC + '@', // Inicializar impresora
  CUT: GS + 'V' + '\x00', // Cortar papel
  CUT_PARTIAL: GS + 'V' + '\x01', // Corte parcial

  // Alineación
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',

  // Estilo de texto
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  DOUBLE_HEIGHT_ON: ESC + '!' + '\x10',
  DOUBLE_HEIGHT_OFF: ESC + '!' + '\x00',
  DOUBLE_WIDTH_ON: ESC + '!' + '\x20',
  DOUBLE_WIDTH_OFF: ESC + '!' + '\x00',
  DOUBLE_SIZE_ON: ESC + '!' + '\x30',
  DOUBLE_SIZE_OFF: ESC + '!' + '\x00',
  UNDERLINE_ON: ESC + '-' + '\x01',
  UNDERLINE_OFF: ESC + '-' + '\x00',

  // Fuente
  FONT_A: ESC + 'M' + '\x00', // Normal
  FONT_B: ESC + 'M' + '\x01', // Pequeña

  // Cajón
  OPEN_DRAWER: ESC + 'p' + '\x00' + '\x19' + '\xFA',

  // Avance
  FEED_LINE: '\n',
  FEED_LINES: (n: number) => ESC + 'd' + String.fromCharCode(n),
};

// Interfaces
interface ComponenteLinea {
  nombre: string;
  cantidad: number;
}

interface LineaTicket {
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  total: number;
  esKit?: boolean;
  componentesKit?: ComponenteLinea[];
}

interface DatosEmpresa {
  nombre: string;
  nombreComercial?: string;
  nif: string;
  direccion: string;
  telefono?: string;
  email?: string;
  textoLOPD?: string;
}

interface VerifactuInfo {
  generarQR: boolean;
  urlQR?: string; // URL para el QR de Verifactu
  datosQR?: string; // Datos para el QR
  hash?: string; // Hash de la factura
}

interface DatosTicket {
  // Empresa
  empresa: DatosEmpresa;

  // Venta
  numero: string;
  serie: string;
  fecha: Date;
  cajaNombre: string;
  vendedorNombre: string;

  // Cliente
  clienteNombre?: string;
  clienteNif?: string;

  // Líneas
  lineas: LineaTicket[];

  // Totales
  subtotal: number;
  descuento: number;
  impuestos: Array<{ nombre: string; base: number; porcentaje: number; cuota: number }>;
  total: number;

  // Pagos
  pagos: Array<{ metodo: string; importe: number }>;
  cambio: number;

  // Verifactu (opcional)
  verifactu?: VerifactuInfo;

  // Opciones
  esTicketRegalo?: boolean;
}

interface ConfigImpresora {
  ancho: 58 | 80; // mm
  caracteresLinea: number;
}

// Clase de servicio
class PrinterService {
  private config: ConfigImpresora = {
    ancho: 80,
    caracteresLinea: 48, // 48 para 80mm, 32 para 58mm
  };

  setConfig(config: Partial<ConfigImpresora>) {
    this.config = { ...this.config, ...config };
    if (config.ancho === 58) {
      this.config.caracteresLinea = 32;
    } else {
      this.config.caracteresLinea = 48;
    }
  }

  // Formatear línea con precio alineado a la derecha
  private formatLine(left: string, right: string): string {
    const maxLeft = this.config.caracteresLinea - right.length - 1;
    const truncatedLeft = left.substring(0, maxLeft);
    const spaces = ' '.repeat(Math.max(1, this.config.caracteresLinea - truncatedLeft.length - right.length));
    return truncatedLeft + spaces + right;
  }

  // Formatear línea centrada
  private centerText(text: string): string {
    const padding = Math.max(0, Math.floor((this.config.caracteresLinea - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  // Línea separadora
  private separator(char: string = '-'): string {
    return char.repeat(this.config.caracteresLinea);
  }

  // Dividir texto largo en múltiples líneas
  private wrapText(text: string, maxWidth?: number): string[] {
    const width = maxWidth || this.config.caracteresLinea;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= width) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }

  // Generar contenido del ticket
  generateTicketContent(datos: DatosTicket): string {
    const lines: string[] = [];

    // Inicializar
    lines.push(COMMANDS.INIT);

    // ========== CABECERA EMPRESA ==========
    lines.push(COMMANDS.ALIGN_CENTER);
    lines.push(COMMANDS.DOUBLE_SIZE_ON);
    lines.push(datos.empresa.nombreComercial || datos.empresa.nombre);
    lines.push(COMMANDS.DOUBLE_SIZE_OFF);
    lines.push(COMMANDS.FEED_LINE);

    lines.push(COMMANDS.FONT_B);
    lines.push(`CIF: ${datos.empresa.nif}`);
    if (datos.empresa.direccion) {
      // Dividir dirección si es muy larga
      const direccionLines = this.wrapText(datos.empresa.direccion, this.config.caracteresLinea - 4);
      direccionLines.forEach(l => lines.push(l));
    }
    if (datos.empresa.telefono) {
      lines.push(`Tel: ${datos.empresa.telefono}`);
    }
    lines.push(COMMANDS.FONT_A);
    lines.push(COMMANDS.FEED_LINE);

    // ========== DATOS DEL TICKET ==========
    lines.push(COMMANDS.ALIGN_LEFT);
    lines.push(this.separator('='));

    lines.push(COMMANDS.BOLD_ON);
    lines.push(`FACTURA SIMPLIFICADA`);
    lines.push(COMMANDS.BOLD_OFF);

    lines.push(`N: ${datos.serie}-${datos.numero}`);
    lines.push(`Fecha: ${datos.fecha.toLocaleDateString('es-ES')} ${datos.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`);
    lines.push(`Caja: ${datos.cajaNombre}`);
    lines.push(`Atendido por: ${datos.vendedorNombre}`);

    // Cliente
    if (datos.clienteNombre) {
      lines.push(COMMANDS.FEED_LINE);
      lines.push(`Cliente: ${datos.clienteNombre}`);
      if (datos.clienteNif) {
        lines.push(`NIF: ${datos.clienteNif}`);
      }
    }

    lines.push(this.separator('='));
    lines.push(COMMANDS.FEED_LINE);

    // ========== LÍNEAS DE VENTA ==========
    // Cabecera
    lines.push(COMMANDS.FONT_B);
    lines.push(this.formatLine('Articulo', 'Importe'));
    lines.push(this.separator('-'));
    lines.push(COMMANDS.FONT_A);

    for (const linea of datos.lineas) {
      // Nombre del producto
      lines.push(COMMANDS.BOLD_ON);

      // Si es ticket regalo, no mostrar precios
      if (datos.esTicketRegalo) {
        lines.push(linea.nombre);
        lines.push(COMMANDS.BOLD_OFF);
        lines.push(`  Cant: ${linea.cantidad}`);
      } else {
        lines.push(linea.nombre);
        lines.push(COMMANDS.BOLD_OFF);

        // Cantidad x precio = total
        const detalle = `  ${linea.cantidad} x ${linea.precioUnitario.toFixed(2)}`;
        const totalLinea = linea.total.toFixed(2);
        lines.push(this.formatLine(detalle, totalLinea));

        // Descuento si aplica
        if (linea.descuento && linea.descuento > 0) {
          const porcDescuento = ((linea.descuento / (linea.precioUnitario * linea.cantidad)) * 100).toFixed(0);
          lines.push(COMMANDS.FONT_B);
          lines.push(`    Dto: -${linea.descuento.toFixed(2)} (${porcDescuento}%)`);
          lines.push(COMMANDS.FONT_A);
        }
      }

      // Componentes del kit
      if (linea.esKit && linea.componentesKit && linea.componentesKit.length > 0) {
        lines.push(COMMANDS.FONT_B);
        lines.push('  Incluye:');
        for (const comp of linea.componentesKit) {
          const cantStr = comp.cantidad > 1 ? `${comp.cantidad}x ` : '';
          lines.push(`    - ${cantStr}${comp.nombre}`);
        }
        lines.push(COMMANDS.FONT_A);
      }
    }

    lines.push(COMMANDS.FEED_LINE);
    lines.push(this.separator('-'));

    // ========== TOTALES ==========
    if (!datos.esTicketRegalo) {
      lines.push(COMMANDS.ALIGN_RIGHT);

      // Subtotal y descuentos
      if (datos.descuento > 0) {
        lines.push(this.formatLine('Subtotal:', datos.subtotal.toFixed(2)));
        lines.push(this.formatLine('Descuento:', `-${datos.descuento.toFixed(2)}`));
      }

      // Desglose de impuestos
      for (const imp of datos.impuestos) {
        lines.push(COMMANDS.FONT_B);
        lines.push(this.formatLine(`Base ${imp.porcentaje}%:`, imp.base.toFixed(2)));
        lines.push(this.formatLine(`${imp.nombre} ${imp.porcentaje}%:`, imp.cuota.toFixed(2)));
        lines.push(COMMANDS.FONT_A);
      }

      // Total grande
      lines.push(COMMANDS.FEED_LINE);
      lines.push(COMMANDS.BOLD_ON);
      lines.push(COMMANDS.DOUBLE_SIZE_ON);
      lines.push(this.formatLine('TOTAL:', `${datos.total.toFixed(2)} EUR`));
      lines.push(COMMANDS.DOUBLE_SIZE_OFF);
      lines.push(COMMANDS.BOLD_OFF);

      lines.push(COMMANDS.FEED_LINE);
      lines.push(this.separator('-'));

      // ========== PAGOS ==========
      lines.push(COMMANDS.ALIGN_LEFT);
      lines.push(COMMANDS.BOLD_ON);
      lines.push('FORMA DE PAGO:');
      lines.push(COMMANDS.BOLD_OFF);

      for (const pago of datos.pagos) {
        const metodoPago = this.formatearMetodoPago(pago.metodo);
        lines.push(this.formatLine(`  ${metodoPago}:`, `${pago.importe.toFixed(2)} EUR`));
      }

      if (datos.cambio > 0) {
        lines.push(COMMANDS.FEED_LINE);
        lines.push(COMMANDS.BOLD_ON);
        lines.push(this.formatLine('  CAMBIO:', `${datos.cambio.toFixed(2)} EUR`));
        lines.push(COMMANDS.BOLD_OFF);
      }
    }

    // ========== VERIFACTU / QR ==========
    if (datos.verifactu && datos.verifactu.generarQR) {
      lines.push(COMMANDS.FEED_LINE);
      lines.push(COMMANDS.ALIGN_CENTER);
      lines.push(this.separator('-'));
      lines.push(COMMANDS.FONT_B);
      lines.push('FACTURA VERIFICABLE');

      if (datos.verifactu.hash) {
        lines.push(`Huella: ${datos.verifactu.hash.substring(0, 16)}...`);
      }

      // TODO: Generar QR real con comandos ESC/POS
      // Por ahora mostrar URL
      if (datos.verifactu.urlQR) {
        lines.push('Escanee el QR para verificar');
        // GS + '(' + 'k' para QR en ESC/POS
        // Esto requiere implementación específica según impresora
      }

      lines.push(COMMANDS.FONT_A);
    }

    // ========== PIE ==========
    lines.push(COMMANDS.FEED_LINE);
    lines.push(COMMANDS.ALIGN_CENTER);
    lines.push(this.separator('-'));

    // Mensaje de agradecimiento
    lines.push(COMMANDS.BOLD_ON);
    if (datos.esTicketRegalo) {
      lines.push('** TICKET REGALO **');
    } else {
      lines.push('Gracias por su compra');
    }
    lines.push(COMMANDS.BOLD_OFF);

    lines.push(COMMANDS.FEED_LINE);
    lines.push(COMMANDS.FONT_B);
    lines.push('IVA INCLUIDO');

    // LOPD
    if (datos.empresa.textoLOPD) {
      lines.push(COMMANDS.FEED_LINE);
      const lopdLines = this.wrapText(datos.empresa.textoLOPD, this.config.caracteresLinea);
      lopdLines.forEach(l => lines.push(l));
    }

    lines.push(COMMANDS.FONT_A);

    // Avance y corte
    lines.push(COMMANDS.FEED_LINES(4));
    lines.push(COMMANDS.CUT_PARTIAL);

    return lines.join('\n');
  }

  // Formatear método de pago para mostrar
  private formatearMetodoPago(metodo: string): string {
    const metodos: Record<string, string> = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'bizum': 'Bizum',
      'transferencia': 'Transferencia',
    };
    return metodos[metodo.toLowerCase()] || metodo;
  }

  // Imprimir ticket de apertura de caja
  generateAperturaContent(datos: {
    cajaNombre: string;
    fecha: Date;
    usuario: string;
    importeInicial: number;
    empresaNombre?: string;
  }): string {
    const lines: string[] = [];

    lines.push(COMMANDS.INIT);

    if (datos.empresaNombre) {
      lines.push(COMMANDS.ALIGN_CENTER);
      lines.push(COMMANDS.BOLD_ON);
      lines.push(datos.empresaNombre);
      lines.push(COMMANDS.BOLD_OFF);
      lines.push(COMMANDS.FEED_LINE);
    }

    lines.push(COMMANDS.ALIGN_CENTER);
    lines.push(COMMANDS.BOLD_ON);
    lines.push(COMMANDS.DOUBLE_SIZE_ON);
    lines.push('APERTURA DE CAJA');
    lines.push(COMMANDS.DOUBLE_SIZE_OFF);
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(COMMANDS.FEED_LINE);

    lines.push(COMMANDS.ALIGN_LEFT);
    lines.push(this.separator('='));
    lines.push(`Caja: ${datos.cajaNombre}`);
    lines.push(`Fecha: ${datos.fecha.toLocaleString('es-ES')}`);
    lines.push(`Usuario: ${datos.usuario}`);
    lines.push(this.separator('='));
    lines.push(COMMANDS.FEED_LINE);

    lines.push(COMMANDS.ALIGN_CENTER);
    lines.push(COMMANDS.BOLD_ON);
    lines.push(COMMANDS.DOUBLE_HEIGHT_ON);
    lines.push(`Importe inicial: ${datos.importeInicial.toFixed(2)} EUR`);
    lines.push(COMMANDS.DOUBLE_HEIGHT_OFF);
    lines.push(COMMANDS.BOLD_OFF);

    lines.push(COMMANDS.FEED_LINES(4));
    lines.push(COMMANDS.CUT_PARTIAL);

    return lines.join('\n');
  }

  // Imprimir ticket de cierre de caja
  generateCierreContent(datos: {
    cajaNombre: string;
    fecha: Date;
    usuario: string;
    numeroVentas: number;
    totalVentas: number;
    arqueoTeorico: { efectivo: number; tarjeta: number; otros: number; total: number };
    arqueoReal: { efectivo: number; tarjeta: number; otros: number; total: number };
    diferencia: number;
    observaciones?: string;
    empresaNombre?: string;
  }): string {
    const lines: string[] = [];

    lines.push(COMMANDS.INIT);

    if (datos.empresaNombre) {
      lines.push(COMMANDS.ALIGN_CENTER);
      lines.push(COMMANDS.BOLD_ON);
      lines.push(datos.empresaNombre);
      lines.push(COMMANDS.BOLD_OFF);
      lines.push(COMMANDS.FEED_LINE);
    }

    lines.push(COMMANDS.ALIGN_CENTER);
    lines.push(COMMANDS.BOLD_ON);
    lines.push(COMMANDS.DOUBLE_SIZE_ON);
    lines.push('CIERRE DE CAJA');
    lines.push(COMMANDS.DOUBLE_SIZE_OFF);
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(COMMANDS.FEED_LINE);

    lines.push(COMMANDS.ALIGN_LEFT);
    lines.push(this.separator('='));
    lines.push(`Caja: ${datos.cajaNombre}`);
    lines.push(`Fecha: ${datos.fecha.toLocaleString('es-ES')}`);
    lines.push(`Usuario: ${datos.usuario}`);
    lines.push(this.separator('='));
    lines.push(COMMANDS.FEED_LINE);

    // Resumen
    lines.push(COMMANDS.BOLD_ON);
    lines.push('RESUMEN DE VENTAS');
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(this.formatLine('Ventas realizadas:', String(datos.numeroVentas)));
    lines.push(this.formatLine('Total vendido:', `${datos.totalVentas.toFixed(2)} EUR`));
    lines.push(COMMANDS.FEED_LINE);

    // Arqueo teórico
    lines.push(COMMANDS.BOLD_ON);
    lines.push('ARQUEO TEORICO');
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(this.formatLine('  Efectivo:', `${datos.arqueoTeorico.efectivo.toFixed(2)}`));
    lines.push(this.formatLine('  Tarjeta:', `${datos.arqueoTeorico.tarjeta.toFixed(2)}`));
    lines.push(this.formatLine('  Otros:', `${datos.arqueoTeorico.otros.toFixed(2)}`));
    lines.push(this.formatLine('  TOTAL:', `${datos.arqueoTeorico.total.toFixed(2)}`));
    lines.push(COMMANDS.FEED_LINE);

    // Arqueo real
    lines.push(COMMANDS.BOLD_ON);
    lines.push('ARQUEO REAL');
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(this.formatLine('  Efectivo:', `${datos.arqueoReal.efectivo.toFixed(2)}`));
    lines.push(this.formatLine('  Tarjeta:', `${datos.arqueoReal.tarjeta.toFixed(2)}`));
    lines.push(this.formatLine('  Otros:', `${datos.arqueoReal.otros.toFixed(2)}`));
    lines.push(this.formatLine('  TOTAL:', `${datos.arqueoReal.total.toFixed(2)}`));
    lines.push(COMMANDS.FEED_LINE);

    // Diferencia
    lines.push(this.separator('-'));
    lines.push(COMMANDS.BOLD_ON);
    lines.push(COMMANDS.DOUBLE_HEIGHT_ON);
    const signo = datos.diferencia >= 0 ? '+' : '';
    lines.push(this.formatLine('DIFERENCIA:', `${signo}${datos.diferencia.toFixed(2)}`));
    lines.push(COMMANDS.DOUBLE_HEIGHT_OFF);
    lines.push(COMMANDS.BOLD_OFF);

    if (datos.observaciones) {
      lines.push(COMMANDS.FEED_LINE);
      lines.push('Observaciones:');
      const obsLines = this.wrapText(datos.observaciones);
      obsLines.forEach(l => lines.push(l));
    }

    lines.push(COMMANDS.FEED_LINES(4));
    lines.push(COMMANDS.CUT_PARTIAL);

    return lines.join('\n');
  }

  // Abrir cajón
  openDrawerCommand(): string {
    return COMMANDS.OPEN_DRAWER;
  }

  // Imprimir usando ventana del navegador (fallback)
  printBrowser(datos: DatosTicket): void {
    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para imprimir');
      return;
    }

    const fechaStr = datos.fecha.toLocaleDateString('es-ES') + ' ' +
                     datos.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const lineasHTML = datos.lineas.map((l) => {
      let html = `
        <tr>
          <td colspan="4" style="font-weight: bold; padding-top: 5px;">${l.nombre}</td>
        </tr>
        <tr>
          <td style="padding-left: 10px;">${l.cantidad} x ${l.precioUnitario.toFixed(2)}</td>
          <td></td>
          <td></td>
          <td style="text-align: right;">${datos.esTicketRegalo ? '' : l.total.toFixed(2)}</td>
        </tr>
      `;

      if (l.descuento && l.descuento > 0 && !datos.esTicketRegalo) {
        html += `<tr><td colspan="4" style="text-align: right; font-size: 10px; color: green;">Dto: -${l.descuento.toFixed(2)} EUR</td></tr>`;
      }

      if (l.esKit && l.componentesKit && l.componentesKit.length > 0) {
        html += `<tr><td colspan="4" style="font-size: 10px; color: #666; padding-left: 15px;">Incluye:</td></tr>`;
        l.componentesKit.forEach(comp => {
          const cantStr = comp.cantidad > 1 ? `${comp.cantidad}x ` : '';
          html += `<tr><td colspan="4" style="font-size: 10px; color: #666; padding-left: 20px;">- ${cantStr}${comp.nombre}</td></tr>`;
        });
      }

      return html;
    }).join('');

    const impuestosHTML = datos.impuestos.map(imp => `
      <div style="display: flex; justify-content: space-between; font-size: 10px;">
        <span>Base ${imp.porcentaje}%: ${imp.base.toFixed(2)}</span>
        <span>${imp.nombre} ${imp.porcentaje}%: ${imp.cuota.toFixed(2)}</span>
      </div>
    `).join('');

    const pagosHTML = datos.pagos.map(p => `
      <div style="display: flex; justify-content: space-between;">
        <span>${this.formatearMetodoPago(p.metodo)}:</span>
        <span>${p.importe.toFixed(2)} EUR</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket ${datos.serie}-${datos.numero}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 280px;
            margin: 0 auto;
            padding: 15px;
            background: white;
          }
          .header { text-align: center; margin-bottom: 15px; }
          .empresa-nombre { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .empresa-datos { font-size: 10px; color: #666; }
          .separator { border-top: 1px dashed #000; margin: 10px 0; }
          .separator-double { border-top: 2px solid #000; margin: 10px 0; }
          .ticket-info { font-size: 11px; margin-bottom: 10px; }
          .ticket-info strong { font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 2px 0; vertical-align: top; }
          .totales { margin-top: 10px; }
          .total-final {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            padding: 10px;
            background: #f5f5f5;
            margin: 10px 0;
          }
          .pagos { margin: 10px 0; }
          .cambio { font-weight: bold; background: #e8f5e9; padding: 5px; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
          .gracias { font-size: 14px; font-weight: bold; color: #000; margin-bottom: 10px; }
          .regalo { background: #fff3e0; padding: 10px; text-align: center; font-weight: bold; }
          .lopd { font-size: 8px; color: #999; margin-top: 10px; text-align: justify; }
          .verifactu { margin: 15px 0; text-align: center; padding: 10px; border: 1px solid #ccc; background: #f9f9f9; }
          .verifactu-title { font-weight: bold; margin-bottom: 5px; }
          .verifactu-hash { font-size: 8px; color: #666; word-break: break-all; margin: 5px 0; }
          .verifactu-qr { margin: 10px 0; }
          .verifactu-qr img { max-width: 120px; }
          @media print {
            body { width: 100%; margin: 0; padding: 5px; }
            @page { margin: 0; }
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
      </head>
      <body>
        <div class="header">
          <div class="empresa-nombre">${datos.empresa.nombreComercial || datos.empresa.nombre}</div>
          <div class="empresa-datos">
            CIF: ${datos.empresa.nif}<br>
            ${datos.empresa.direccion}<br>
            ${datos.empresa.telefono ? 'Tel: ' + datos.empresa.telefono : ''}
          </div>
        </div>

        <div class="separator-double"></div>

        <div class="ticket-info">
          <strong>FACTURA SIMPLIFICADA</strong><br>
          N: ${datos.serie}-${datos.numero}<br>
          Fecha: ${fechaStr}<br>
          Caja: ${datos.cajaNombre}<br>
          Atendido por: ${datos.vendedorNombre}
          ${datos.clienteNombre ? `<br>Cliente: ${datos.clienteNombre}` : ''}
          ${datos.clienteNif ? `<br>NIF: ${datos.clienteNif}` : ''}
        </div>

        <div class="separator-double"></div>

        <table>
          <tbody>
            ${lineasHTML}
          </tbody>
        </table>

        ${!datos.esTicketRegalo ? `
          <div class="separator"></div>

          <div class="totales">
            ${datos.descuento > 0 ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>${datos.subtotal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: green;">
                <span>Descuento:</span>
                <span>-${datos.descuento.toFixed(2)}</span>
              </div>
            ` : ''}
            ${impuestosHTML}
          </div>

          <div class="total-final">
            TOTAL: ${datos.total.toFixed(2)} EUR
          </div>

          <div class="separator"></div>

          <div class="pagos">
            <strong>Forma de pago:</strong>
            ${pagosHTML}
            ${datos.cambio > 0 ? `<div class="cambio">Cambio: ${datos.cambio.toFixed(2)} EUR</div>` : ''}
          </div>
        ` : '<div class="regalo">** TICKET REGALO **</div>'}

        ${datos.verifactu && datos.verifactu.generarQR ? `
        <div class="verifactu">
          <div class="verifactu-title">FACTURA VERIFICABLE</div>
          ${datos.verifactu.hash ? `<div class="verifactu-hash">Huella: ${datos.verifactu.hash.substring(0, 24)}...</div>` : ''}
          <div class="verifactu-qr" id="qrcode"></div>
          <div style="font-size: 9px;">Escanee para verificar</div>
        </div>
        ` : ''}

        <div class="separator"></div>

        <div class="footer">
          <div class="gracias">${datos.esTicketRegalo ? 'TICKET REGALO' : 'Gracias por su compra'}</div>
          <div>IVA INCLUIDO</div>
          ${datos.empresa.textoLOPD ? `<div class="lopd">${datos.empresa.textoLOPD}</div>` : ''}
        </div>

        ${datos.verifactu && datos.verifactu.generarQR && datos.verifactu.urlQR ? `
        <script>
          // Generar QR cuando cargue la librería
          function generateQR() {
            if (typeof qrcode !== 'undefined') {
              var qr = qrcode(0, 'M');
              qr.addData('${datos.verifactu.urlQR}');
              qr.make();
              document.getElementById('qrcode').innerHTML = qr.createImgTag(3, 0);
            }
          }
          // Esperar a que cargue qrcode.min.js
          if (typeof qrcode !== 'undefined') {
            generateQR();
          } else {
            setTimeout(generateQR, 100);
          }
        </script>
        ` : ''}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Esperar a que cargue e imprimir
    setTimeout(() => {
      printWindow.print();
      // Cerrar después de imprimir
      setTimeout(() => printWindow.close(), 500);
    }, 250);
  }
}

export const printerService = new PrinterService();
