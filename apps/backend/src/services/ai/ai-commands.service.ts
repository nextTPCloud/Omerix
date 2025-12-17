/**
 * Servicio de IA para comandos de voz/chat
 *
 * Interpreta comandos en lenguaje natural y crea documentos automáticamente.
 *
 * Ejemplos de uso:
 *   "Crea un albarán para el cliente ACME con 10 tornillos M8"
 *   "Hazme un presupuesto para Industrias López con 5 motores y 20 cables"
 *   "Genera una factura del albarán ALB2025-00001"
 *   "Crea un pedido de compra a proveedor Ferretería Central con 100 tuercas"
 */

import mongoose from 'mongoose';
import { AIService, createAIServiceWithConfig } from './ai.service';
import { AIMessage, AIProvider } from './ai.types';
import { IDatabaseConfig } from '@/models/Empresa';

// ============================================
// TIPOS
// ============================================

export type TipoDocumento =
  | 'presupuesto'
  | 'pedido'
  | 'albaran'
  | 'factura'
  | 'presupuesto_compra'
  | 'pedido_compra'
  | 'albaran_compra'
  | 'factura_compra';

export interface EntidadExtraida {
  tipo: 'cliente' | 'proveedor' | 'producto';
  textoOriginal: string;
  nombre?: string;
  codigo?: string;
  cantidad?: number;
  precio?: number;
  unidad?: string;
}

export interface ComandoParseado {
  intencion: TipoDocumento | 'consulta' | 'modificacion' | 'desconocido';
  entidades: EntidadExtraida[];
  documentoReferencia?: string; // Para "factura del albarán X"
  fechas?: {
    fecha?: Date;
    fechaVencimiento?: Date;
    fechaEntrega?: Date;
  };
  observaciones?: string;
  confianza: 'alta' | 'media' | 'baja';
  razonamiento?: string;
}

export interface EntidadResuelta {
  tipo: 'cliente' | 'proveedor' | 'producto';
  encontrado: boolean;
  id?: string;
  nombre?: string;
  datos?: any;
  alternativas?: Array<{ id: string; nombre: string; similitud: number }>;
  cantidad?: number;
  precio?: number;
  unidad?: string;
}

export interface ResultadoComando {
  exito: boolean;
  mensaje: string;
  tipoDocumento?: TipoDocumento;
  documentoCreado?: any;
  entidadesResueltas?: EntidadResuelta[];
  requiereConfirmacion?: boolean;
  datosParaConfirmar?: {
    cliente?: EntidadResuelta;
    proveedor?: EntidadResuelta;
    productos?: EntidadResuelta[];
    totales?: any;
  };
  sugerencias?: string[];
  error?: string;
}

// ============================================
// SERVICIO
// ============================================

export class AICommandsService {
  private aiService: AIService;

  constructor(provider?: AIProvider, apiKey?: string, model?: string) {
    this.aiService = createAIServiceWithConfig(provider, apiKey, model);
  }

  // ============================================
  // PARSEAR COMANDO
  // ============================================

  /**
   * Parsea un comando de texto y extrae la intención y entidades
   */
  async parsearComando(texto: string): Promise<ComandoParseado> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres un asistente de un sistema ERP que interpreta comandos en español para crear documentos comerciales.

Tu tarea es analizar el texto del usuario y extraer:
1. La intención (tipo de documento a crear)
2. Las entidades mencionadas (clientes, proveedores, productos)
3. Referencias a otros documentos
4. Fechas si se mencionan

TIPOS DE DOCUMENTOS (intención):
- presupuesto: Presupuesto de venta a cliente
- pedido: Pedido de venta de cliente
- albaran: Albarán de entrega a cliente
- factura: Factura de venta a cliente
- presupuesto_compra: Presupuesto solicitado a proveedor
- pedido_compra: Pedido de compra a proveedor
- albaran_compra: Albarán de recepción de proveedor
- factura_compra: Factura de compra de proveedor
- consulta: Pregunta sobre datos existentes
- modificacion: Modificar documento existente
- desconocido: No se puede determinar

INDICADORES DE VENTA (a cliente):
- "para el cliente", "al cliente", "a [nombre cliente]"
- "vender", "entregar", "facturar a"

INDICADORES DE COMPRA (a proveedor):
- "al proveedor", "a proveedor", "comprar a"
- "pedir a", "solicitar a", "encargar a"

Responde SOLO en JSON con esta estructura:
{
  "intencion": string,
  "entidades": [
    {
      "tipo": "cliente" | "proveedor" | "producto",
      "textoOriginal": string,
      "nombre": string | null,
      "codigo": string | null,
      "cantidad": number | null,
      "precio": number | null,
      "unidad": string | null
    }
  ],
  "documentoReferencia": string | null,
  "fechas": {
    "fecha": string | null,
    "fechaVencimiento": string | null,
    "fechaEntrega": string | null
  },
  "observaciones": string | null,
  "confianza": "alta" | "media" | "baja",
  "razonamiento": string
}`,
      },
      {
        role: 'user',
        content: texto,
      },
    ];

    const response = await this.aiService.complete(messages, { temperature: 0.2 });

    try {
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      const result = JSON.parse(jsonStr.trim());

      // Convertir fechas string a Date si existen
      if (result.fechas) {
        if (result.fechas.fecha) result.fechas.fecha = new Date(result.fechas.fecha);
        if (result.fechas.fechaVencimiento) result.fechas.fechaVencimiento = new Date(result.fechas.fechaVencimiento);
        if (result.fechas.fechaEntrega) result.fechas.fechaEntrega = new Date(result.fechas.fechaEntrega);
      }

      return result as ComandoParseado;
    } catch (error) {
      console.error('Error parseando comando:', response.content);
      return {
        intencion: 'desconocido',
        entidades: [],
        confianza: 'baja',
        razonamiento: 'Error al interpretar el comando',
      };
    }
  }

  // ============================================
  // RESOLVER ENTIDADES
  // ============================================

  /**
   * Busca en la base de datos las entidades extraídas del comando
   */
  async resolverEntidades(
    entidades: EntidadExtraida[],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<EntidadResuelta[]> {
    const { databaseManager } = await import('@/services/database-manager.service');
    const resultados: EntidadResuelta[] = [];

    for (const entidad of entidades) {
      let resultado: EntidadResuelta = {
        tipo: entidad.tipo,
        encontrado: false,
        cantidad: entidad.cantidad,
        precio: entidad.precio,
        unidad: entidad.unidad,
      };

      const searchText = entidad.nombre || entidad.textoOriginal;

      if (entidad.tipo === 'cliente') {
        resultado = await this.buscarCliente(searchText, empresaId, dbConfig, resultado);
      } else if (entidad.tipo === 'proveedor') {
        resultado = await this.buscarProveedor(searchText, empresaId, dbConfig, resultado);
      } else if (entidad.tipo === 'producto') {
        resultado = await this.buscarProducto(searchText, entidad.codigo, empresaId, dbConfig, resultado);
      }

      resultados.push(resultado);
    }

    return resultados;
  }

  private async buscarCliente(
    texto: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    resultado: EntidadResuelta
  ): Promise<EntidadResuelta> {
    const { getClienteModel } = await import('@/utils/dynamic-models.helper');
    const ClienteModel = await getClienteModel(empresaId, dbConfig);

    // Buscar por código exacto primero
    let cliente = await ClienteModel.findOne({
      activo: true,
      $or: [
        { codigo: texto.toUpperCase() },
        { codigo: texto },
      ],
    }).lean();

    if (!cliente) {
      // Buscar por nombre con regex
      const regex = new RegExp(texto.split(' ').join('.*'), 'i');
      cliente = await ClienteModel.findOne({
        activo: true,
        $or: [
          { nombre: regex },
          { nombreComercial: regex },
          { razonSocial: regex },
        ],
      }).lean();
    }

    if (cliente) {
      resultado.encontrado = true;
      resultado.id = cliente._id.toString();
      resultado.nombre = cliente.nombreComercial || cliente.nombre;
      resultado.datos = cliente;
    } else {
      // Buscar alternativas
      const regex = new RegExp(texto.split('').join('.*'), 'i');
      const alternativas = await ClienteModel.find({
        activo: true,
        $or: [
          { nombre: regex },
          { nombreComercial: regex },
        ],
      })
        .limit(5)
        .lean();

      resultado.alternativas = alternativas.map(c => ({
        id: c._id.toString(),
        nombre: c.nombreComercial || c.nombre,
        similitud: this.calcularSimilitud(texto, c.nombreComercial || c.nombre),
      }));
    }

    return resultado;
  }

  private async buscarProveedor(
    texto: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    resultado: EntidadResuelta
  ): Promise<EntidadResuelta> {
    const { getProveedorModel } = await import('@/utils/dynamic-models.helper');
    const ProveedorModel = await getProveedorModel(empresaId, dbConfig);

    // Buscar por código exacto primero
    let proveedor = await ProveedorModel.findOne({
      activo: true,
      $or: [
        { codigo: texto.toUpperCase() },
        { codigo: texto },
      ],
    }).lean();

    if (!proveedor) {
      // Buscar por nombre con regex
      const regex = new RegExp(texto.split(' ').join('.*'), 'i');
      proveedor = await ProveedorModel.findOne({
        activo: true,
        $or: [
          { nombre: regex },
          { nombreComercial: regex },
          { razonSocial: regex },
        ],
      }).lean();
    }

    if (proveedor) {
      resultado.encontrado = true;
      resultado.id = proveedor._id.toString();
      resultado.nombre = proveedor.nombreComercial || proveedor.nombre;
      resultado.datos = proveedor;
    } else {
      // Buscar alternativas
      const regex = new RegExp(texto.split('').join('.*'), 'i');
      const alternativas = await ProveedorModel.find({
        activo: true,
        $or: [
          { nombre: regex },
          { nombreComercial: regex },
        ],
      })
        .limit(5)
        .lean();

      resultado.alternativas = alternativas.map(p => ({
        id: p._id.toString(),
        nombre: p.nombreComercial || p.nombre,
        similitud: this.calcularSimilitud(texto, p.nombreComercial || p.nombre),
      }));
    }

    return resultado;
  }

  private async buscarProducto(
    texto: string,
    codigo: string | undefined,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    resultado: EntidadResuelta
  ): Promise<EntidadResuelta> {
    const { getProductoModel } = await import('@/utils/dynamic-models.helper');
    const ProductoModel = await getProductoModel(empresaId, dbConfig);

    let producto: any = null;

    // Buscar por código si se proporciona
    if (codigo) {
      producto = await ProductoModel.findOne({
        activo: true,
        $or: [
          { codigo: codigo.toUpperCase() },
          { sku: codigo.toUpperCase() },
          { ean: codigo },
        ],
      }).lean();
    }

    if (!producto) {
      // Buscar por nombre con regex
      const regex = new RegExp(texto.split(' ').join('.*'), 'i');
      producto = await ProductoModel.findOne({
        activo: true,
        nombre: regex,
      }).lean();
    }

    if (producto) {
      resultado.encontrado = true;
      resultado.id = producto._id.toString();
      resultado.nombre = producto.nombre;
      resultado.datos = producto;
      // Usar precio del producto si no se especificó
      if (!resultado.precio && producto.precioVenta) {
        resultado.precio = producto.precioVenta;
      }
    } else {
      // Buscar alternativas
      const palabras = texto.split(' ').filter(p => p.length > 2);
      const regexParts = palabras.map(p => `(?=.*${p})`).join('');
      const regex = new RegExp(regexParts, 'i');

      const alternativas = await ProductoModel.find({
        activo: true,
        nombre: regex,
      })
        .limit(5)
        .lean();

      resultado.alternativas = alternativas.map(p => ({
        id: p._id.toString(),
        nombre: p.nombre,
        similitud: this.calcularSimilitud(texto, p.nombre),
      }));
    }

    return resultado;
  }

  private calcularSimilitud(texto1: string, texto2: string): number {
    const s1 = texto1.toLowerCase();
    const s2 = texto2.toLowerCase();

    if (s1 === s2) return 1;
    if (s2.includes(s1) || s1.includes(s2)) return 0.8;

    // Similitud simple basada en palabras comunes
    const palabras1 = new Set(s1.split(/\s+/));
    const palabras2 = new Set(s2.split(/\s+/));
    const interseccion = [...palabras1].filter(p => palabras2.has(p));
    const union = new Set([...palabras1, ...palabras2]);

    return interseccion.length / union.size;
  }

  // ============================================
  // PROCESAR COMANDO COMPLETO
  // ============================================

  /**
   * Procesa un comando completo: parsea, resuelve entidades y opcionalmente crea el documento
   */
  async procesarComando(
    texto: string,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig,
    autoCrear: boolean = false
  ): Promise<ResultadoComando> {
    try {
      // 1. Parsear comando
      const comandoParseado = await this.parsearComando(texto);

      if (comandoParseado.intencion === 'desconocido') {
        return {
          exito: false,
          mensaje: 'No pude entender el comando. Por favor, intenta ser más específico.',
          sugerencias: [
            'Crea un albarán para [cliente] con [productos]',
            'Hazme un presupuesto para [cliente] con [productos]',
            'Genera una factura del albarán [código]',
            'Pide a [proveedor] [cantidad] [producto]',
          ],
        };
      }

      if (comandoParseado.intencion === 'consulta') {
        return {
          exito: true,
          mensaje: 'Para consultas, usa la búsqueda del sistema o pregúntame algo específico.',
        };
      }

      // 2. Resolver entidades
      const entidadesResueltas = await this.resolverEntidades(
        comandoParseado.entidades,
        empresaId,
        dbConfig
      );

      // 3. Verificar si todas las entidades se resolvieron
      const entidadesNoEncontradas = entidadesResueltas.filter(e => !e.encontrado);
      const tercero = entidadesResueltas.find(e => e.tipo === 'cliente' || e.tipo === 'proveedor');
      const productos = entidadesResueltas.filter(e => e.tipo === 'producto');

      // Determinar si es venta o compra
      const esCompra = ['presupuesto_compra', 'pedido_compra', 'albaran_compra', 'factura_compra']
        .includes(comandoParseado.intencion);

      if (!tercero) {
        return {
          exito: false,
          mensaje: esCompra
            ? 'No se especificó un proveedor. ¿A quién quieres hacer el pedido?'
            : 'No se especificó un cliente. ¿Para quién es el documento?',
          entidadesResueltas,
        };
      }

      if (!tercero.encontrado && (!tercero.alternativas || tercero.alternativas.length === 0)) {
        return {
          exito: false,
          mensaje: `No encontré ${esCompra ? 'al proveedor' : 'al cliente'} "${tercero.nombre || comandoParseado.entidades[0]?.textoOriginal}". ¿Quieres crearlo primero?`,
          entidadesResueltas,
        };
      }

      if (productos.length === 0) {
        return {
          exito: false,
          mensaje: '¿Qué productos quieres incluir en el documento?',
          entidadesResueltas,
        };
      }

      // 4. Si hay entidades no encontradas, pedir confirmación
      if (entidadesNoEncontradas.length > 0 || !autoCrear) {
        // Preparar datos para confirmar
        const datosParaConfirmar: ResultadoComando['datosParaConfirmar'] = {};

        if (tercero.tipo === 'cliente') {
          datosParaConfirmar.cliente = tercero;
        } else {
          datosParaConfirmar.proveedor = tercero;
        }

        datosParaConfirmar.productos = productos;

        // Calcular totales preliminares
        let subtotal = 0;
        for (const prod of productos) {
          const precio = prod.precio || prod.datos?.precioVenta || 0;
          const cantidad = prod.cantidad || 1;
          subtotal += precio * cantidad;
        }

        datosParaConfirmar.totales = {
          subtotal,
          iva: subtotal * 0.21,
          total: subtotal * 1.21,
        };

        const mensajeEntidades = entidadesNoEncontradas.length > 0
          ? `Encontré ${entidadesResueltas.length - entidadesNoEncontradas.length} de ${entidadesResueltas.length} elementos. `
          : '';

        return {
          exito: true,
          mensaje: `${mensajeEntidades}¿Confirmas la creación del documento?`,
          tipoDocumento: comandoParseado.intencion as TipoDocumento,
          entidadesResueltas,
          requiereConfirmacion: true,
          datosParaConfirmar,
        };
      }

      // 5. Crear el documento (solo si autoCrear es true)
      const documentoCreado = await this.crearDocumento(
        comandoParseado.intencion as TipoDocumento,
        entidadesResueltas,
        comandoParseado,
        empresaId,
        usuarioId,
        dbConfig
      );

      return {
        exito: true,
        mensaje: `Documento ${documentoCreado.codigo} creado correctamente.`,
        tipoDocumento: comandoParseado.intencion as TipoDocumento,
        documentoCreado,
        entidadesResueltas,
      };

    } catch (error: any) {
      console.error('Error procesando comando:', error);
      return {
        exito: false,
        mensaje: 'Error al procesar el comando.',
        error: error.message,
      };
    }
  }

  // ============================================
  // CREAR DOCUMENTO
  // ============================================

  /**
   * Crea el documento en la base de datos
   */
  async crearDocumento(
    tipo: TipoDocumento,
    entidadesResueltas: EntidadResuelta[],
    comandoParseado: ComandoParseado,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const tercero = entidadesResueltas.find(e => e.tipo === 'cliente' || e.tipo === 'proveedor');
    const productos = entidadesResueltas.filter(e => e.tipo === 'producto' && e.encontrado);

    if (!tercero || !tercero.encontrado) {
      throw new Error('No se encontró el cliente/proveedor para crear el documento');
    }

    // Preparar líneas
    const lineas = productos.map((prod, index) => {
      const cantidad = prod.cantidad || 1;
      const precioUnitario = prod.precio || prod.datos?.precioVenta || prod.datos?.precioCompra || 0;
      const descuento = 0;
      const iva = prod.datos?.iva || 21;
      const subtotalBruto = cantidad * precioUnitario;
      const descuentoImporte = subtotalBruto * (descuento / 100);
      const subtotal = subtotalBruto - descuentoImporte;
      const ivaImporte = subtotal * (iva / 100);
      const total = subtotal + ivaImporte;

      return {
        orden: index + 1,
        tipo: 'producto',
        productoId: prod.id ? new mongoose.Types.ObjectId(prod.id) : undefined,
        codigo: prod.datos?.codigo || prod.datos?.sku,
        nombre: prod.nombre || prod.datos?.nombre,
        descripcion: prod.datos?.descripcion,
        sku: prod.datos?.sku,
        cantidad,
        unidad: prod.unidad || prod.datos?.unidad || 'ud',
        precioUnitario,
        descuento,
        descuentoImporte,
        subtotal,
        iva,
        ivaImporte,
        total,
        esEditable: true,
        incluidoEnTotal: true,
      };
    });

    // Calcular totales
    const totales = this.calcularTotales(lineas);

    // Según el tipo, usar el servicio correspondiente
    switch (tipo) {
      case 'albaran': {
        const { albaranesService } = await import('@/modules/albaranes/albaranes.service');
        return albaranesService.crear({
          clienteId: tercero.id!,
          clienteNombre: tercero.datos?.nombre || tercero.datos?.nombreComercial,
          clienteNif: tercero.datos?.nif || tercero.datos?.cif,
          clienteEmail: tercero.datos?.email,
          lineas,
          observaciones: comandoParseado.observaciones,
        }, new mongoose.Types.ObjectId(empresaId), new mongoose.Types.ObjectId(usuarioId), dbConfig);
      }

      case 'factura': {
        const { facturasService } = await import('@/modules/facturas/facturas.service');
        return facturasService.crear({
          clienteId: tercero.id!,
          clienteNombre: tercero.datos?.nombre || tercero.datos?.nombreComercial,
          clienteNif: tercero.datos?.nif || tercero.datos?.cif,
          clienteEmail: tercero.datos?.email,
          lineas,
          observaciones: comandoParseado.observaciones,
        }, new mongoose.Types.ObjectId(empresaId), new mongoose.Types.ObjectId(usuarioId), dbConfig);
      }

      case 'pedido_compra': {
        const { pedidosCompraService } = await import('@/modules/pedidos-compra/pedidos-compra.service');
        return pedidosCompraService.crear({
          proveedorId: tercero.id!,
          proveedorNombre: tercero.datos?.nombre || tercero.datos?.nombreComercial,
          proveedorNif: tercero.datos?.nif || tercero.datos?.cif,
          proveedorEmail: tercero.datos?.email,
          lineas: lineas.map(l => ({
            ...l,
            cantidadRecibida: 0,
            cantidadPendiente: l.cantidad,
          })),
          observaciones: comandoParseado.observaciones,
        }, empresaId, usuarioId, dbConfig);
      }

      case 'albaran_compra': {
        const { albaranesCompraService } = await import('@/modules/albaranes-compra/albaranes-compra.service');
        // Necesita almacenId - obtener el predeterminado
        const { getAlmacenModel } = await import('@/utils/dynamic-models.helper');
        const AlmacenModel = await getAlmacenModel(empresaId, dbConfig);
        const almacenPredeterminado = await AlmacenModel.findOne({ predeterminado: true }).lean() ||
          await AlmacenModel.findOne({ activo: true }).lean();

        if (!almacenPredeterminado) {
          throw new Error('No hay almacén configurado. Crea un almacén primero.');
        }

        return albaranesCompraService.crear({
          proveedorId: tercero.id!,
          proveedorNombre: tercero.datos?.nombre || tercero.datos?.nombreComercial,
          proveedorNif: tercero.datos?.nif || tercero.datos?.cif,
          proveedorEmail: tercero.datos?.email,
          almacenId: almacenPredeterminado._id.toString(),
          lineas: lineas.map(l => ({
            ...l,
            cantidadPedida: l.cantidad,
            cantidadRecibida: 0,
          })),
          observaciones: comandoParseado.observaciones,
        }, new mongoose.Types.ObjectId(empresaId), new mongoose.Types.ObjectId(usuarioId), dbConfig);
      }

      default:
        throw new Error(`Tipo de documento "${tipo}" no soportado aún para creación automática`);
    }
  }

  private calcularTotales(lineas: any[]) {
    let subtotalBruto = 0;
    let totalDescuentos = 0;
    const ivaAgrupado: Record<number, { base: number; cuota: number }> = {};

    for (const linea of lineas) {
      if (!linea.incluidoEnTotal) continue;

      subtotalBruto += linea.cantidad * linea.precioUnitario;
      totalDescuentos += linea.descuentoImporte || 0;

      const tipoIva = linea.iva || 21;
      if (!ivaAgrupado[tipoIva]) {
        ivaAgrupado[tipoIva] = { base: 0, cuota: 0 };
      }
      ivaAgrupado[tipoIva].base += linea.subtotal || 0;
      ivaAgrupado[tipoIva].cuota += linea.ivaImporte || 0;
    }

    const subtotalNeto = subtotalBruto - totalDescuentos;
    const desgloseIva = Object.entries(ivaAgrupado).map(([tipo, valores]) => ({
      tipo: Number(tipo),
      base: Math.round(valores.base * 100) / 100,
      cuota: Math.round(valores.cuota * 100) / 100,
    }));

    const totalIva = desgloseIva.reduce((sum, item) => sum + item.cuota, 0);
    const total = subtotalNeto + totalIva;

    return {
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round(totalDescuentos * 100) / 100,
      subtotalNeto: Math.round(subtotalNeto * 100) / 100,
      desgloseIva,
      totalIva: Math.round(totalIva * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  // ============================================
  // CHAT CONTEXTUAL
  // ============================================

  /**
   * Chat con contexto del ERP para responder preguntas o ejecutar comandos
   */
  async chat(
    mensaje: string,
    historial: AIMessage[],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<{ respuesta: string; esComando: boolean; resultado?: ResultadoComando }> {
    // Detectar si es un comando o una pregunta
    const esComandoPatrones = [
      /^(crea|hazme|genera|haz|crear|nuevo|nueva)/i,
      /^(pide|pedir|encargar|solicitar) a/i,
      /^(factura|albaran|presupuesto|pedido) (para|de|del|a)/i,
    ];

    const esComando = esComandoPatrones.some(patron => patron.test(mensaje.trim()));

    if (esComando) {
      // Es un comando - procesarlo
      const resultado = await this.procesarComando(mensaje, empresaId, '', dbConfig, false);
      return {
        respuesta: resultado.mensaje,
        esComando: true,
        resultado,
      };
    }

    // Es una conversación normal - usar chat de IA
    const respuesta = await this.aiService.chat(mensaje, historial);
    return {
      respuesta,
      esComando: false,
    };
  }
}

// Singleton
let aiCommandsServiceInstance: AICommandsService | null = null;

export function getAICommandsService(): AICommandsService {
  if (!aiCommandsServiceInstance) {
    aiCommandsServiceInstance = new AICommandsService();
  }
  return aiCommandsServiceInstance;
}

export function createAICommandsServiceWithConfig(
  provider?: AIProvider,
  apiKey?: string,
  model?: string
): AICommandsService {
  return new AICommandsService(provider, apiKey, model);
}
