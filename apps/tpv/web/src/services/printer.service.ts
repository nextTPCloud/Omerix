// ===========================================
// SERVICIO DE IMPRESIÓN TPV
// Comandos ESC/POS para impresoras térmicas
// ===========================================

import { tpvApi } from './api';

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
interface LineaTicket {
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface DatosTicket {
  // Empresa
  empresaNombre: string;
  empresaNif: string;
  empresaDireccion: string;
  empresaTelefono?: string;

  // Venta
  numero: string;
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
  totalIva: number;
  total: number;

  // Pagos
  pagos: Array<{ metodo: string; importe: number }>;
  cambio: number;

  // Pie
  mensajePie?: string;
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
    const spaces = ' '.repeat(this.config.caracteresLinea - truncatedLeft.length - right.length);
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

  // Generar contenido del ticket
  generateTicketContent(datos: DatosTicket): string {
    const lines: string[] = [];

    // Inicializar
    lines.push(COMMANDS.INIT);

    // Cabecera empresa
    lines.push(COMMANDS.ALIGN_CENTER);
    lines.push(COMMANDS.DOUBLE_SIZE_ON);
    lines.push(datos.empresaNombre);
    lines.push(COMMANDS.DOUBLE_SIZE_OFF);
    lines.push(COMMANDS.FEED_LINE);

    lines.push(COMMANDS.FONT_B);
    lines.push(`NIF: ${datos.empresaNif}`);
    lines.push(datos.empresaDireccion);
    if (datos.empresaTelefono) {
      lines.push(`Tel: ${datos.empresaTelefono}`);
    }
    lines.push(COMMANDS.FONT_A);
    lines.push(COMMANDS.FEED_LINE);

    // Info ticket
    lines.push(COMMANDS.ALIGN_LEFT);
    lines.push(this.separator('='));
    lines.push(`Ticket: ${datos.numero}`);
    lines.push(`Fecha: ${datos.fecha.toLocaleString('es-ES')}`);
    lines.push(`Caja: ${datos.cajaNombre}`);
    lines.push(`Vendedor: ${datos.vendedorNombre}`);

    // Cliente
    if (datos.clienteNombre) {
      lines.push(`Cliente: ${datos.clienteNombre}`);
      if (datos.clienteNif) {
        lines.push(`NIF: ${datos.clienteNif}`);
      }
    }

    lines.push(this.separator('='));
    lines.push(COMMANDS.FEED_LINE);

    // Líneas de venta
    for (const linea of datos.lineas) {
      // Nombre del producto
      lines.push(COMMANDS.BOLD_ON);
      lines.push(linea.nombre);
      lines.push(COMMANDS.BOLD_OFF);

      // Cantidad x precio = total
      const detalle = `  ${linea.cantidad} x ${linea.precioUnitario.toFixed(2)}`;
      const totalLinea = linea.total.toFixed(2);
      lines.push(this.formatLine(detalle, totalLinea));
    }

    lines.push(COMMANDS.FEED_LINE);
    lines.push(this.separator('-'));

    // Totales
    lines.push(COMMANDS.ALIGN_RIGHT);

    if (datos.descuento > 0) {
      lines.push(this.formatLine('Subtotal:', datos.subtotal.toFixed(2)));
      lines.push(this.formatLine('Descuento:', `-${datos.descuento.toFixed(2)}`));
    }

    lines.push(this.formatLine('Base:', (datos.total - datos.totalIva).toFixed(2)));
    lines.push(this.formatLine('IVA:', datos.totalIva.toFixed(2)));

    lines.push(COMMANDS.FEED_LINE);
    lines.push(COMMANDS.BOLD_ON);
    lines.push(COMMANDS.DOUBLE_SIZE_ON);
    lines.push(this.formatLine('TOTAL:', `${datos.total.toFixed(2)} EUR`));
    lines.push(COMMANDS.DOUBLE_SIZE_OFF);
    lines.push(COMMANDS.BOLD_OFF);

    lines.push(COMMANDS.FEED_LINE);
    lines.push(this.separator('-'));

    // Pagos
    lines.push(COMMANDS.ALIGN_LEFT);
    for (const pago of datos.pagos) {
      const metodoPago = pago.metodo.charAt(0).toUpperCase() + pago.metodo.slice(1);
      lines.push(this.formatLine(metodoPago + ':', pago.importe.toFixed(2)));
    }

    if (datos.cambio > 0) {
      lines.push(COMMANDS.BOLD_ON);
      lines.push(this.formatLine('Cambio:', datos.cambio.toFixed(2)));
      lines.push(COMMANDS.BOLD_OFF);
    }

    // Pie
    lines.push(COMMANDS.FEED_LINE);
    lines.push(COMMANDS.ALIGN_CENTER);
    lines.push(this.separator('-'));
    lines.push(COMMANDS.FEED_LINE);

    if (datos.mensajePie) {
      lines.push(datos.mensajePie);
    } else {
      lines.push('Gracias por su compra');
    }

    lines.push(COMMANDS.FEED_LINE);
    lines.push(COMMANDS.FONT_B);
    lines.push('IVA INCLUIDO');
    lines.push(COMMANDS.FONT_A);

    // Avance y corte
    lines.push(COMMANDS.FEED_LINES(4));
    lines.push(COMMANDS.CUT_PARTIAL);

    return lines.join('\n');
  }

  // Imprimir ticket de apertura de caja
  generateAperturaContent(datos: {
    cajaNombre: string;
    fecha: Date;
    usuario: string;
    importeInicial: number;
  }): string {
    const lines: string[] = [];

    lines.push(COMMANDS.INIT);
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
    lines.push(`Importe inicial: ${datos.importeInicial.toFixed(2)} EUR`);
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
  }): string {
    const lines: string[] = [];

    lines.push(COMMANDS.INIT);
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
    lines.push(this.formatLine('Efectivo:', `${datos.arqueoTeorico.efectivo.toFixed(2)}`));
    lines.push(this.formatLine('Tarjeta:', `${datos.arqueoTeorico.tarjeta.toFixed(2)}`));
    lines.push(this.formatLine('Otros:', `${datos.arqueoTeorico.otros.toFixed(2)}`));
    lines.push(this.formatLine('TOTAL:', `${datos.arqueoTeorico.total.toFixed(2)}`));
    lines.push(COMMANDS.FEED_LINE);

    // Arqueo real
    lines.push(COMMANDS.BOLD_ON);
    lines.push('ARQUEO REAL');
    lines.push(COMMANDS.BOLD_OFF);
    lines.push(this.formatLine('Efectivo:', `${datos.arqueoReal.efectivo.toFixed(2)}`));
    lines.push(this.formatLine('Tarjeta:', `${datos.arqueoReal.tarjeta.toFixed(2)}`));
    lines.push(this.formatLine('Otros:', `${datos.arqueoReal.otros.toFixed(2)}`));
    lines.push(this.formatLine('TOTAL:', `${datos.arqueoReal.total.toFixed(2)}`));
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
      lines.push(datos.observaciones);
    }

    lines.push(COMMANDS.FEED_LINES(4));
    lines.push(COMMANDS.CUT_PARTIAL);

    return lines.join('\n');
  }

  // Abrir cajón
  openDrawerCommand(): string {
    return COMMANDS.OPEN_DRAWER;
  }

  // Enviar a imprimir via API local
  async print(content: string): Promise<void> {
    await tpvApi.post('/perifericos/impresora/raw', { data: content });
  }

  // Imprimir ticket de venta
  async printTicket(datos: DatosTicket): Promise<void> {
    const content = this.generateTicketContent(datos);
    await this.print(content);
  }

  // Abrir cajón
  async openDrawer(): Promise<void> {
    await tpvApi.abrirCajon();
  }
}

export const printerService = new PrinterService();
