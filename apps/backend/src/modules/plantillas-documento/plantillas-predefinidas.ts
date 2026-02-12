// apps/backend/src/modules/plantillas-documento/plantillas-predefinidas.ts
// Plantillas de diseño predefinidas para documentos

import {
  IPlantillaDocumento,
  TipoDocumentoPlantilla,
  EstiloPlantilla,
} from './PlantillaDocumento';

/**
 * Obtiene las plantillas de documento predefinidas para una empresa
 */
export function obtenerPlantillasDocumentoPredefinidas(empresaId: string): Partial<IPlantillaDocumento>[] {
  const plantillas: Partial<IPlantillaDocumento>[] = [];

  // Tipos de documento que necesitan plantillas
  const tiposDocumento: { tipo: TipoDocumentoPlantilla; nombreSingular: string }[] = [
    { tipo: TipoDocumentoPlantilla.FACTURA, nombreSingular: 'Factura' },
    { tipo: TipoDocumentoPlantilla.PRESUPUESTO, nombreSingular: 'Presupuesto' },
    { tipo: TipoDocumentoPlantilla.ALBARAN, nombreSingular: 'Albarán' },
    { tipo: TipoDocumentoPlantilla.PEDIDO, nombreSingular: 'Pedido' },
    { tipo: TipoDocumentoPlantilla.PARTE_TRABAJO, nombreSingular: 'Parte de Trabajo' },
  ];

  // Para cada tipo de documento, crear las plantillas con diferentes estilos
  for (const { tipo, nombreSingular } of tiposDocumento) {
    // =============================================
    // ESTILO MODERNO (Predeterminada)
    // =============================================
    plantillas.push({
      empresaId,
      nombre: `${nombreSingular} Moderno`,
      descripcion: 'Diseño limpio y moderno con colores azules y líneas simples',
      codigo: `${tipo.toUpperCase()}_MODERNO`,
      tipoDocumento: tipo,
      estilo: EstiloPlantilla.MODERNO,
      colores: {
        primario: '#3b82f6',      // Azul brillante
        secundario: '#64748b',    // Gris pizarra
        texto: '#1e293b',         // Gris oscuro
        textoClaro: '#64748b',    // Gris medio
        fondo: '#ffffff',         // Blanco
        fondoAlterno: '#f8fafc',  // Gris muy claro
        borde: '#e2e8f0',         // Gris claro
        exito: '#22c55e',
        alerta: '#f59e0b',
        error: '#ef4444',
      },
      fuentes: {
        familia: 'Inter, Helvetica, Arial, sans-serif',
        tamañoTitulo: 28,
        tamañoSubtitulo: 12,
        tamañoTexto: 10,
        tamañoPie: 8,
      },
      cabecera: {
        mostrarLogo: true,
        posicionLogo: 'izquierda',
        anchoLogo: 160,
        mostrarDatosEmpresa: true,
        mostrarNIF: true,
        mostrarDireccion: true,
        mostrarContacto: true,
        mostrarWeb: true,
      },
      cliente: {
        posicion: 'derecha',
        mostrarTitulo: true,
        mostrarCodigo: false,
        mostrarNIF: true,
        mostrarDireccion: true,
        mostrarContacto: true,
      },
      lineas: {
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
      },
      totales: {
        posicion: 'derecha',
        mostrarSubtotal: true,
        mostrarDescuentoGlobal: true,
        mostrarBaseImponible: true,
        mostrarDetalleIVA: true,
        mostrarRecargoEquivalencia: false,
        mostrarRetencion: false,
        mostrarTotal: true,
        resaltarTotal: true,
      },
      pie: {
        mostrarCondiciones: true,
        mostrarFormaPago: true,
        mostrarVencimientos: true,
        mostrarDatosBancarios: true,
        mostrarFirma: false,
        mostrarPagina: true,
      },
      textos: {
        tituloDocumento: nombreSingular.toUpperCase(),
      },
      margenes: { superior: 20, inferior: 20, izquierdo: 15, derecho: 15 },
      papel: { formato: 'A4', orientacion: 'vertical' },
      activa: true,
      esPredeterminada: true,
      esPlantillaSistema: true,
    });

    // =============================================
    // ESTILO CLÁSICO
    // =============================================
    plantillas.push({
      empresaId,
      nombre: `${nombreSingular} Clásico`,
      descripcion: 'Diseño tradicional con bordes definidos y tipografía serif',
      codigo: `${tipo.toUpperCase()}_CLASICO`,
      tipoDocumento: tipo,
      estilo: EstiloPlantilla.CLASICO,
      colores: {
        primario: '#1e3a5f',      // Azul oscuro
        secundario: '#5c6a7a',    // Gris azulado
        texto: '#2c3e50',         // Gris azul oscuro
        textoClaro: '#7f8c8d',    // Gris
        fondo: '#ffffff',
        fondoAlterno: '#fafafa',
        borde: '#bdc3c7',
        exito: '#27ae60',
        alerta: '#f39c12',
        error: '#e74c3c',
      },
      fuentes: {
        familia: 'Georgia, Times New Roman, serif',
        tamañoTitulo: 26,
        tamañoSubtitulo: 12,
        tamañoTexto: 10,
        tamañoPie: 8,
      },
      cabecera: {
        mostrarLogo: true,
        posicionLogo: 'centro',
        anchoLogo: 140,
        mostrarDatosEmpresa: true,
        mostrarNIF: true,
        mostrarDireccion: true,
        mostrarContacto: true,
        mostrarWeb: false,
      },
      cliente: {
        posicion: 'izquierda',
        mostrarTitulo: true,
        mostrarCodigo: true,
        mostrarNIF: true,
        mostrarDireccion: true,
        mostrarContacto: false,
      },
      lineas: {
        mostrarNumeroLinea: true,
        mostrarReferencia: true,
        mostrarDescripcion: true,
        mostrarCantidad: true,
        mostrarUnidad: true,
        mostrarPrecioUnitario: true,
        mostrarDescuento: true,
        mostrarIVA: true,
        mostrarSubtotal: true,
        filasZebra: false,
      },
      totales: {
        posicion: 'derecha',
        mostrarSubtotal: true,
        mostrarDescuentoGlobal: true,
        mostrarBaseImponible: true,
        mostrarDetalleIVA: true,
        mostrarRecargoEquivalencia: false,
        mostrarRetencion: false,
        mostrarTotal: true,
        resaltarTotal: true,
      },
      pie: {
        mostrarCondiciones: true,
        mostrarFormaPago: true,
        mostrarVencimientos: true,
        mostrarDatosBancarios: true,
        mostrarFirma: true,
        mostrarPagina: true,
      },
      textos: {
        tituloDocumento: nombreSingular.toUpperCase(),
      },
      margenes: { superior: 25, inferior: 25, izquierdo: 20, derecho: 20 },
      papel: { formato: 'A4', orientacion: 'vertical' },
      activa: true,
      esPredeterminada: false,
      esPlantillaSistema: true,
    });

    // =============================================
    // ESTILO MINIMALISTA
    // =============================================
    plantillas.push({
      empresaId,
      nombre: `${nombreSingular} Minimalista`,
      descripcion: 'Diseño ultra limpio con mucho espacio en blanco',
      codigo: `${tipo.toUpperCase()}_MINIMALISTA`,
      tipoDocumento: tipo,
      estilo: EstiloPlantilla.MINIMALISTA,
      colores: {
        primario: '#000000',      // Negro
        secundario: '#666666',    // Gris oscuro
        texto: '#333333',         // Gris muy oscuro
        textoClaro: '#999999',    // Gris claro
        fondo: '#ffffff',
        fondoAlterno: '#ffffff',  // Sin zebra
        borde: '#eeeeee',         // Gris muy claro
        exito: '#28a745',
        alerta: '#ffc107',
        error: '#dc3545',
      },
      fuentes: {
        familia: 'Helvetica Neue, Helvetica, Arial, sans-serif',
        tamañoTitulo: 32,
        tamañoSubtitulo: 11,
        tamañoTexto: 9,
        tamañoPie: 7,
      },
      cabecera: {
        mostrarLogo: true,
        posicionLogo: 'izquierda',
        anchoLogo: 120,
        mostrarDatosEmpresa: true,
        mostrarNIF: true,
        mostrarDireccion: false,
        mostrarContacto: true,
        mostrarWeb: false,
      },
      cliente: {
        posicion: 'derecha',
        mostrarTitulo: false,
        mostrarCodigo: false,
        mostrarNIF: true,
        mostrarDireccion: true,
        mostrarContacto: false,
      },
      lineas: {
        mostrarNumeroLinea: false,
        mostrarReferencia: false,
        mostrarDescripcion: true,
        mostrarCantidad: true,
        mostrarUnidad: false,
        mostrarPrecioUnitario: true,
        mostrarDescuento: false,
        mostrarIVA: false,
        mostrarSubtotal: true,
        filasZebra: false,
      },
      totales: {
        posicion: 'derecha',
        mostrarSubtotal: false,
        mostrarDescuentoGlobal: false,
        mostrarBaseImponible: true,
        mostrarDetalleIVA: true,
        mostrarRecargoEquivalencia: false,
        mostrarRetencion: false,
        mostrarTotal: true,
        resaltarTotal: false,
      },
      pie: {
        mostrarCondiciones: false,
        mostrarFormaPago: true,
        mostrarVencimientos: true,
        mostrarDatosBancarios: true,
        mostrarFirma: false,
        mostrarPagina: false,
      },
      textos: {
        tituloDocumento: nombreSingular,
      },
      margenes: { superior: 30, inferior: 30, izquierdo: 25, derecho: 25 },
      papel: { formato: 'A4', orientacion: 'vertical' },
      activa: true,
      esPredeterminada: false,
      esPlantillaSistema: true,
    });

    // =============================================
    // ESTILO CORPORATIVO
    // =============================================
    plantillas.push({
      empresaId,
      nombre: `${nombreSingular} Corporativo`,
      descripcion: 'Diseño profesional con cabecera destacada y colores corporativos',
      codigo: `${tipo.toUpperCase()}_CORPORATIVO`,
      tipoDocumento: tipo,
      estilo: EstiloPlantilla.CORPORATIVO,
      colores: {
        primario: '#1a365d',      // Azul corporativo oscuro
        secundario: '#2b6cb0',    // Azul medio
        texto: '#2d3748',         // Gris oscuro
        textoClaro: '#718096',    // Gris
        fondo: '#ffffff',
        fondoAlterno: '#f7fafc',
        borde: '#e2e8f0',
        exito: '#38a169',
        alerta: '#d69e2e',
        error: '#c53030',
      },
      fuentes: {
        familia: 'Roboto, Helvetica, Arial, sans-serif',
        tamañoTitulo: 24,
        tamañoSubtitulo: 11,
        tamañoTexto: 9,
        tamañoPie: 7,
      },
      cabecera: {
        mostrarLogo: true,
        posicionLogo: 'izquierda',
        anchoLogo: 180,
        mostrarDatosEmpresa: true,
        mostrarNIF: true,
        mostrarDireccion: true,
        mostrarContacto: true,
        mostrarWeb: true,
        colorFondo: '#1a365d',
      },
      cliente: {
        posicion: 'derecha',
        mostrarTitulo: true,
        mostrarCodigo: true,
        mostrarNIF: true,
        mostrarDireccion: true,
        mostrarContacto: true,
      },
      lineas: {
        mostrarNumeroLinea: true,
        mostrarReferencia: true,
        mostrarDescripcion: true,
        mostrarCantidad: true,
        mostrarUnidad: true,
        mostrarPrecioUnitario: true,
        mostrarDescuento: true,
        mostrarIVA: true,
        mostrarSubtotal: true,
        filasZebra: true,
      },
      totales: {
        posicion: 'derecha',
        mostrarSubtotal: true,
        mostrarDescuentoGlobal: true,
        mostrarBaseImponible: true,
        mostrarDetalleIVA: true,
        mostrarRecargoEquivalencia: true,
        mostrarRetencion: true,
        mostrarTotal: true,
        resaltarTotal: true,
      },
      pie: {
        mostrarCondiciones: true,
        mostrarFormaPago: true,
        mostrarVencimientos: true,
        mostrarDatosBancarios: true,
        mostrarFirma: true,
        mostrarPagina: true,
        textoLegal: 'Inscrita en el Registro Mercantil',
      },
      textos: {
        tituloDocumento: nombreSingular.toUpperCase(),
      },
      margenes: { superior: 15, inferior: 20, izquierdo: 15, derecho: 15 },
      papel: { formato: 'A4', orientacion: 'vertical' },
      activa: true,
      esPredeterminada: false,
      esPlantillaSistema: true,
    });

    // =============================================
    // ESTILO COLORIDO
    // =============================================
    plantillas.push({
      empresaId,
      nombre: `${nombreSingular} Colorido`,
      descripcion: 'Diseño vibrante con colores llamativos y estilo moderno',
      codigo: `${tipo.toUpperCase()}_COLORIDO`,
      tipoDocumento: tipo,
      estilo: EstiloPlantilla.COLORIDO,
      colores: {
        primario: '#8b5cf6',      // Violeta
        secundario: '#ec4899',    // Rosa
        texto: '#1f2937',         // Gris muy oscuro
        textoClaro: '#6b7280',    // Gris
        fondo: '#ffffff',
        fondoAlterno: '#faf5ff',  // Violeta muy claro
        borde: '#e9d5ff',         // Violeta claro
        exito: '#10b981',
        alerta: '#f59e0b',
        error: '#ef4444',
      },
      fuentes: {
        familia: 'Poppins, Helvetica, Arial, sans-serif',
        tamañoTitulo: 30,
        tamañoSubtitulo: 12,
        tamañoTexto: 10,
        tamañoPie: 8,
      },
      cabecera: {
        mostrarLogo: true,
        posicionLogo: 'izquierda',
        anchoLogo: 150,
        mostrarDatosEmpresa: true,
        mostrarNIF: true,
        mostrarDireccion: true,
        mostrarContacto: true,
        mostrarWeb: true,
      },
      cliente: {
        posicion: 'derecha',
        mostrarTitulo: true,
        mostrarCodigo: false,
        mostrarNIF: true,
        mostrarDireccion: true,
        mostrarContacto: true,
      },
      lineas: {
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
      },
      totales: {
        posicion: 'derecha',
        mostrarSubtotal: true,
        mostrarDescuentoGlobal: true,
        mostrarBaseImponible: true,
        mostrarDetalleIVA: true,
        mostrarRecargoEquivalencia: false,
        mostrarRetencion: false,
        mostrarTotal: true,
        resaltarTotal: true,
      },
      pie: {
        mostrarCondiciones: true,
        mostrarFormaPago: true,
        mostrarVencimientos: true,
        mostrarDatosBancarios: true,
        mostrarFirma: false,
        mostrarPagina: true,
      },
      textos: {
        tituloDocumento: nombreSingular.toUpperCase(),
      },
      margenes: { superior: 20, inferior: 20, izquierdo: 15, derecho: 15 },
      papel: { formato: 'A4', orientacion: 'vertical' },
      activa: true,
      esPredeterminada: false,
      esPlantillaSistema: true,
    });
  }

  return plantillas;
}

export default obtenerPlantillasDocumentoPredefinidas;
