import mongoose from 'mongoose';
import crypto from 'crypto';
import UsuarioEmpresa from '../usuarios/UsuarioEmpresa';
import Empresa from '../empresa/Empresa';
import { databaseManager } from '../../services/database-manager.service';
import {
  getProductoModel,
  getClienteModel,
  getFamiliaModel,
  getTiposImpuestoModel,
  getFormaPagoModel,
  getAlmacenModel,
  getTarifaModel,
  getOfertaModel,
  getTPVRegistradoModel,
  getFacturaModel,
  getVencimientoModel,
} from '../../utils/dynamic-models.helper';
import { TipoFactura, EstadoFactura, MetodoPago, SistemaFiscal, TipoLinea } from '../facturas/Factura';
import { movimientosBancariosService } from '../tesoreria/movimientos-bancarios.service';
import { TipoVencimiento, EstadoVencimiento } from '../../models/Vencimiento';

// Interfaces para datos sincronizados
export interface IDatosSincronizacion {
  productos: any[];
  familias: any[];
  clientes: any[];
  tiposImpuesto: any[];
  formasPago: any[];
  almacenes: any[];
  tarifas: any[];
  ofertas: any[];
  usuarios: any[];
  config: {
    serieFactura: string;
    almacenId: string;
    almacenNombre: string;
    tpvNombre: string;
    tpvConfig: any;
    empresaNombre: string;
    empresaCif: string;
    empresaDireccion: string;
  };
  ultimaActualizacion: Date;
}

export interface IVentaOffline {
  idLocal: string;           // ID generado localmente
  fecha: Date;
  clienteId?: string;
  lineas: Array<{
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    tipoImpuestoId: string;
  }>;
  pagos: Array<{
    formaPagoId: string;
    importe: number;
    referencia?: string;
  }>;
  total: number;
  totalImpuestos: number;
  usuarioId: string;
  tpvId: string;
  observaciones?: string;
  ticketImpreso?: boolean;
}

// Interface para crear ticket desde TPV
export interface ICrearTicketTPV {
  // Datos del cliente (opcional para simplificada)
  clienteId?: string;
  clienteNombre?: string;
  clienteNif?: string;
  // Lineas del ticket
  lineas: Array<{
    productoId: string;
    varianteId?: string;
    codigo: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number; // PVP con IVA
    descuento: number; // Importe de descuento
    iva: number; // Porcentaje IVA (21, 10, 4, 0)
    esKit?: boolean;
    componentesKit?: Array<{
      productoId: string;
      nombre: string;
      cantidad: number;
    }>;
  }>;
  // Totales
  subtotal: number;
  descuentoTotal: number;
  total: number;
  // Pagos
  pagos: Array<{
    metodo: 'efectivo' | 'tarjeta' | 'bizum' | 'transferencia';
    importe: number;
  }>;
  cambio: number;
  // Metadata
  usuarioId: string;
  usuarioNombre: string;
  esTicketRegalo?: boolean;
}

// Respuesta de creación de ticket
export interface ITicketCreado {
  ticketId: string;
  codigo: string;
  serie: string;
  numero: number;
  fecha: Date;
  // Datos Verifactu
  verifactu?: {
    hash: string;
    hashAnterior?: string;
    urlQR: string;
    datosQR: string;
  };
}

export class TPVSyncService {
  /**
   * Obtener la configuracion de BD de una empresa
   */
  private async getDbConfig(empresaId: string) {
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }
    if (!empresa.databaseConfig) {
      throw new Error('Configuracion de base de datos no encontrada para esta empresa');
    }
    return empresa.databaseConfig;
  }

  /**
   * Descarga todos los datos necesarios para el TPV
   */
  async descargarDatos(
    tpvId: string,
    empresaId: string,
    ultimaSync?: Date
  ): Promise<IDatosSincronizacion> {
    // Obtener dbConfig para modelos dinamicos
    const dbConfig = await this.getDbConfig(empresaId);

    // Obtener modelos dinamicos
    const [
      Producto,
      Familia,
      Cliente,
      TipoImpuesto,
      FormaPago,
      Almacen,
      Tarifa,
      Oferta,
      TPVRegistrado,
    ] = await Promise.all([
      getProductoModel(empresaId, dbConfig),
      getFamiliaModel(empresaId, dbConfig),
      getClienteModel(empresaId, dbConfig),
      getTiposImpuestoModel(empresaId, dbConfig),
      getFormaPagoModel(empresaId, dbConfig),
      getAlmacenModel(empresaId, dbConfig),
      getTarifaModel(empresaId, dbConfig),
      getOfertaModel(empresaId, dbConfig),
      getTPVRegistradoModel(empresaId, dbConfig),
    ]);

    // Obtener datos del TPV con su almacen (BD de empresa)
    const tpv = await TPVRegistrado.findById(tpvId)
      .populate('almacenId', 'codigo nombre');
    if (!tpv) {
      throw new Error('TPV no encontrado');
    }

    // Obtener empresa (BD principal)
    const empresa = await Empresa.findById(empresaId);

    // Filtro de fecha si es sincronizacion incremental
    const filtroFecha = ultimaSync
      ? { updatedAt: { $gte: ultimaSync } }
      : {};

    // Cargar datos en paralelo (ya no necesitan empresaId porque cada BD es por empresa)
    const [
      productos,
      familias,
      clientes,
      tiposImpuesto,
      formasPago,
      almacenes,
      tarifas,
      ofertas,
      usuarios,
    ] = await Promise.all([
      // Productos activos
      Producto.find({
        activo: true,
        ...filtroFecha,
      }).select({
        _id: 1,
        codigo: 1,
        sku: 1,
        nombre: 1,
        descripcion: 1,
        familiaId: 1,
        tipoImpuestoId: 1,
        precios: 1,
        precioVenta: 1,
        codigoBarras: 1,
        imagenes: 1,
        unidadMedida: 1,
        ventaPorPeso: 1,
        stock: 1,
        stockMinimo: 1,
        controlStock: 1,
        gestionaStock: 1,
        // Tipo de producto y variantes
        tipo: 1,
        tieneVariantes: 1,
        atributos: 1,
        variantes: 1,
        // Kit/Compuesto
        componentesKit: 1,
        // TPV
        usarEnTPV: 1,
        permiteDescuento: 1,
        precioModificable: 1,
        iva: 1,
      }),

      // Familias activas
      Familia.find({
        activo: true,
        ...filtroFecha,
      }).select({
        _id: 1,
        codigo: 1,
        nombre: 1,
        color: 1,
        orden: 1,
        padreId: 1,
        imagen: 1,
      }),

      // Clientes activos
      Cliente.find({
        activo: true,
        ...filtroFecha,
      }).select({
        _id: 1,
        codigo: 1,
        nombre: 1,
        nombreComercial: 1,
        nif: 1,
        telefono: 1,
        email: 1,
        direccion: 1,
        tarifaId: 1,
        formaPagoId: 1,
        terminoPagoId: 1,
      }),

      // Tipos de impuesto
      TipoImpuesto.find({
        activo: true,
      }).select({
        _id: 1,
        codigo: 1,
        nombre: 1,
        porcentaje: 1,
        tipo: 1,
      }),

      // Formas de pago activas
      FormaPago.find({
        activo: true,
      }).select({
        _id: 1,
        codigo: 1,
        nombre: 1,
        tipo: 1,
        requiereCambio: 1,
        abreCajon: 1,
      }),

      // Almacenes
      Almacen.find({
        activo: true,
      }).select({
        _id: 1,
        codigo: 1,
        nombre: 1,
        direccion: 1,
      }),

      // Tarifas activas
      Tarifa.find({
        activo: true,
        ...filtroFecha,
      }).select({
        _id: 1,
        codigo: 1,
        nombre: 1,
        tipo: 1,
        porcentajeModificacion: 1,
        redondeo: 1,
        precios: 1,
      }),

      // Ofertas activas (vigentes)
      Oferta.find({
        activo: true,
        fechaInicio: { $lte: new Date() },
        $or: [
          { fechaFin: { $gte: new Date() } },
          { fechaFin: null },
        ],
      }).select({
        _id: 1,
        codigo: 1,
        nombre: 1,
        tipo: 1,
        descuento: 1,
        productos: 1,
        familias: 1,
        fechaInicio: 1,
        fechaFin: 1,
        prioridad: 1,
      }),

      // Usuarios con PIN para TPV (desde UsuarioEmpresa en BD principal)
      UsuarioEmpresa.find({
        empresaId,
        activo: true,
        pinTPV: { $exists: true, $nin: [null, ''] },
      }).populate({
        path: 'usuarioId',
        match: { activo: true },
        select: '_id nombre apellidos permisos',
      }),
    ]);

    // Transformar usuarios para mantener compatibilidad
    const usuariosTransformados = usuarios
      .filter((ue: any) => ue.usuarioId) // Solo los que tienen usuario activo
      .map((ue: any) => ({
        _id: ue.usuarioId._id,
        nombre: ue.usuarioId.nombre,
        apellidos: ue.usuarioId.apellidos,
        rol: ue.rol, // Rol de la relacion usuario-empresa
        permisos: ue.usuarioId.permisos || {},
      }));

    // Crear mapa de productos para resolver nombres de componentes de kit
    const productosMap = new Map(productos.map((p: any) => [p._id.toString(), p]));

    // Enriquecer componentesKit con nombres de productos
    const productosEnriquecidos = productos.map((p: any) => {
      const producto = p.toObject ? p.toObject() : p;
      if (producto.componentesKit && producto.componentesKit.length > 0) {
        producto.componentesKit = producto.componentesKit.map((comp: any) => {
          const productoComponente = productosMap.get(comp.productoId?.toString());
          return {
            ...comp,
            productoId: comp.productoId?.toString(),
            nombre: productoComponente?.nombre || 'Producto no encontrado',
            sku: productoComponente?.sku || productoComponente?.codigo || '',
          };
        });
      }
      return producto;
    });

    return {
      productos: productosEnriquecidos,
      familias,
      clientes,
      tiposImpuesto,
      formasPago,
      almacenes,
      tarifas,
      ofertas,
      usuarios: usuariosTransformados,
      config: {
        serieFactura: tpv.serieFactura,
        almacenId: (tpv.almacenId as any)?._id?.toString() || tpv.almacenId?.toString() || '',
        almacenNombre: (tpv.almacenId as any)?.nombre || '',
        tpvNombre: tpv.nombre,
        tpvConfig: tpv.config,
        // Datos de empresa para tickets
        empresaNombre: empresa?.nombre || '',
        empresaNombreComercial: empresa?.nombreComercial || '',
        empresaCif: empresa?.nif || '',
        empresaTelefono: empresa?.telefono || '',
        empresaEmail: empresa?.email || '',
        empresaDireccion: empresa?.direccion
          ? `${empresa.direccion.calle || ''}${empresa.direccion.numero ? ' ' + empresa.direccion.numero : ''}, ${empresa.direccion.codigoPostal || ''} ${empresa.direccion.ciudad || ''}`
          : '',
        // Textos legales
        textoLOPD: empresa?.textosLegales?.textoLOPD || '',
        condicionesVenta: empresa?.textosLegales?.condicionesVenta || '',
        // Configuración Verifactu
        verifactu: empresa?.verifactuConfig ? {
          entorno: empresa.verifactuConfig.entorno,
          generarQR: empresa.verifactuConfig.generarQR,
          sistemaFiscal: empresa.verifactuConfig.sistemaFiscal,
        } : null,
      },
      ultimaActualizacion: new Date(),
    };
  }

  /**
   * Recibe ventas realizadas en modo offline
   */
  async subirVentas(
    tpvId: string,
    empresaId: string,
    ventas: IVentaOffline[]
  ): Promise<{
    procesadas: number;
    errores: Array<{ idLocal: string; error: string }>;
    tickets: Array<{ idLocal: string; ticketId: string; numero: string }>;
  }> {
    const resultados = {
      procesadas: 0,
      errores: [] as Array<{ idLocal: string; error: string }>,
      tickets: [] as Array<{ idLocal: string; ticketId: string; numero: string }>,
    };

    // Obtener modelo dinamico
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);

    // Verificar TPV (sin filtro empresaId porque la BD ya es de la empresa)
    const tpv = await TPVRegistrado.findOne({ _id: tpvId });
    if (!tpv) {
      throw new Error('TPV no encontrado');
    }

    // Procesar cada venta
    for (const venta of ventas) {
      try {
        // Aqui iria la logica de crear la factura/ticket
        // Por ahora solo registramos el intento
        // TODO: Integrar con modulo de facturas

        // Simular creacion de ticket
        const ticketId = new mongoose.Types.ObjectId().toString();
        const numero = `T${Date.now()}`;

        resultados.tickets.push({
          idLocal: venta.idLocal,
          ticketId,
          numero,
        });
        resultados.procesadas++;
      } catch (error: any) {
        resultados.errores.push({
          idLocal: venta.idLocal,
          error: error.message,
        });
      }
    }

    return resultados;
  }

  /**
   * Obtiene stock actual de productos para el almacen del TPV
   */
  async obtenerStock(
    tpvId: string,
    empresaId: string,
    productosIds?: string[]
  ): Promise<Array<{ productoId: string; stock: number }>> {
    // Obtener modelo dinamico
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);

    const tpv = await TPVRegistrado.findOne({ _id: tpvId });
    if (!tpv) {
      throw new Error('TPV no encontrado');
    }

    // Stock esta en la BD de empresa - obtener conexion dinamica
    const connection = await databaseManager.getConnection(empresaId, dbConfig);
    const Stock = connection.model('Stock');

    // Sin filtro empresaId porque la BD ya es de la empresa
    const filtro: any = {
      almacenId: tpv.almacenId,
    };

    if (productosIds && productosIds.length > 0) {
      filtro.productoId = { $in: productosIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const stocks = await Stock.find(filtro).select({
      productoId: 1,
      stockActual: 1,
    });

    return stocks.map((s: any) => ({
      productoId: s.productoId.toString(),
      stock: s.stockActual,
    }));
  }

  /**
   * Obtiene movimientos de caja del dia para sincronizar
   */
  async obtenerMovimientosCaja(
    tpvId: string,
    empresaId: string,
    fecha: Date
  ): Promise<any[]> {
    // Obtener modelo dinamico de Caja
    const dbConfig = await this.getDbConfig(empresaId);
    const connection = await databaseManager.getConnection(empresaId, dbConfig);
    const Caja = connection.model('Caja');

    const iniciodia = new Date(fecha);
    iniciodia.setHours(0, 0, 0, 0);

    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    // Sin filtro empresaId porque la BD ya es de la empresa
    const cajas = await Caja.find({
      tpvId,
      fechaApertura: { $gte: iniciodia, $lte: finDia },
    });

    return cajas;
  }

  /**
   * Crea un ticket (factura simplificada) desde el TPV
   * Incluye generación de hash Verifactu y datos para QR
   */
  async crearTicket(
    tpvId: string,
    empresaId: string,
    datos: ICrearTicketTPV
  ): Promise<ITicketCreado> {
    console.log('[TPV crearTicket] Iniciando...', { tpvId, empresaId, lineas: datos.lineas?.length });

    // Obtener dbConfig y modelos
    const dbConfig = await this.getDbConfig(empresaId);
    console.log('[TPV crearTicket] dbConfig:', dbConfig?.mongoUri ? 'OK' : 'NO CONFIG');

    const Factura = await getFacturaModel(empresaId, dbConfig);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);
    console.log('[TPV crearTicket] Modelos obtenidos');

    // Obtener datos del TPV
    const tpv = await TPVRegistrado.findById(tpvId);
    if (!tpv) {
      throw new Error('TPV no encontrado');
    }

    // Obtener datos de empresa
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }

    // Determinar serie del ticket (desde config del TPV o por defecto)
    const serieTicket = tpv.serieFactura || 'FS';

    // Obtener último ticket de la serie para calcular número
    const año = new Date().getFullYear();
    const ultimoTicket = await Factura.findOne({
      serie: serieTicket,
      codigo: new RegExp(`^${serieTicket}${año}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    const numero = ultimoTicket?.numero ? ultimoTicket.numero + 1 : 1;
    const codigo = `${serieTicket}${año}-${numero.toString().padStart(5, '0')}`;

    // Obtener hash anterior para encadenamiento Verifactu
    const ultimaFacturaInmutable = await Factura.findOne({
      inmutable: true,
    }).sort({ fechaCreacion: -1 }).lean();
    const hashAnterior = (ultimaFacturaInmutable as any)?.verifactu?.hash;

    // Calcular desglose de IVA por tipo
    const desgloseIvaMap = new Map<number, { base: number; cuota: number }>();
    for (const linea of datos.lineas) {
      const iva = linea.iva || 21;
      const totalLinea = linea.precioUnitario * linea.cantidad - linea.descuento;
      // PVP ya incluye IVA, calcular base
      const baseLinea = totalLinea / (1 + iva / 100);
      const cuotaLinea = totalLinea - baseLinea;

      if (desgloseIvaMap.has(iva)) {
        const actual = desgloseIvaMap.get(iva)!;
        desgloseIvaMap.set(iva, {
          base: actual.base + baseLinea,
          cuota: actual.cuota + cuotaLinea,
        });
      } else {
        desgloseIvaMap.set(iva, { base: baseLinea, cuota: cuotaLinea });
      }
    }

    const desgloseIva = Array.from(desgloseIvaMap.entries()).map(([tipo, valores]) => ({
      tipo,
      base: Math.round(valores.base * 100) / 100,
      cuota: Math.round(valores.cuota * 100) / 100,
    }));

    const totalIva = desgloseIva.reduce((sum, d) => sum + d.cuota, 0);
    const totalBase = desgloseIva.reduce((sum, d) => sum + d.base, 0);

    // Generar hash Verifactu
    const fechaExpedicion = new Date();
    const hash = this.generarHashVerifactu({
      nifEmitente: empresa.nif || '',
      numSerieFactura: codigo,
      fechaExpedicion,
      tipoFactura: 'F2', // Factura simplificada
      cuotaTotal: totalIva,
      importeTotal: datos.total,
      hashAnterior,
    });

    // Generar URL y datos para QR
    const entornoVerifactu = empresa.verifactuConfig?.entorno || 'test';
    const urlQR = this.generarURLVerificacion(
      codigo,
      empresa.nif || '',
      fechaExpedicion,
      datos.total,
      entornoVerifactu
    );
    const datosQR = `NIF:${empresa.nif}|NUM:${codigo}|FECHA:${this.formatearFechaVerifactu(fechaExpedicion)}|TOTAL:${datos.total.toFixed(2)}|HASH:${hash.substring(0, 8)}`;

    // Convertir lineas al formato de factura
    const lineasFactura = datos.lineas.map((linea, index) => {
      const iva = linea.iva || 21;
      const totalLinea = linea.precioUnitario * linea.cantidad - linea.descuento;
      const baseLinea = totalLinea / (1 + iva / 100);
      const ivaImporte = totalLinea - baseLinea;
      const descuentoPorcentaje = linea.descuento > 0
        ? (linea.descuento / (linea.precioUnitario * linea.cantidad)) * 100
        : 0;

      return {
        orden: index + 1,
        tipo: linea.esKit ? TipoLinea.KIT : TipoLinea.PRODUCTO,
        productoId: linea.productoId ? new mongoose.Types.ObjectId(linea.productoId) : undefined,
        codigo: linea.codigo,
        nombre: linea.nombre,
        cantidad: linea.cantidad,
        unidad: 'ud',
        precioUnitario: linea.precioUnitario,
        descuento: descuentoPorcentaje,
        descuentoImporte: linea.descuento,
        subtotal: baseLinea,
        iva,
        ivaImporte,
        total: totalLinea,
        costeUnitario: 0,
        costeTotalLinea: 0,
        margenUnitario: 0,
        margenPorcentaje: 0,
        margenTotalLinea: 0,
        mostrarComponentes: !!linea.esKit,
        esEditable: false,
        incluidoEnTotal: true,
        componentesKit: linea.componentesKit?.map(c => ({
          productoId: new mongoose.Types.ObjectId(c.productoId),
          nombre: c.nombre,
          cantidad: c.cantidad,
          precioUnitario: 0,
          costeUnitario: 0,
          descuento: 0,
          iva: 21,
          subtotal: 0,
          opcional: false,
          seleccionado: true,
        })),
      };
    });

    // Convertir pagos al formato de cobros
    const cobros = datos.pagos.map(pago => {
      let metodoPago: MetodoPago;
      switch (pago.metodo) {
        case 'efectivo': metodoPago = MetodoPago.EFECTIVO; break;
        case 'tarjeta': metodoPago = MetodoPago.TARJETA; break;
        case 'bizum': metodoPago = MetodoPago.TARJETA; break; // Bizum como tarjeta
        case 'transferencia': metodoPago = MetodoPago.TRANSFERENCIA; break;
        default: metodoPago = MetodoPago.EFECTIVO;
      }
      // Para efectivo, descontar el cambio
      const importeReal = pago.metodo === 'efectivo' && datos.cambio > 0
        ? pago.importe - datos.cambio
        : pago.importe;

      return {
        fecha: new Date(),
        importe: importeReal > 0 ? importeReal : pago.importe,
        metodoPago,
        registradoPor: new mongoose.Types.ObjectId(datos.usuarioId),
        fechaRegistro: new Date(),
      };
    }).filter(c => c.importe > 0);

    // Crear la factura/ticket
    const ticket = new Factura({
      _id: new mongoose.Types.ObjectId(),
      codigo,
      serie: serieTicket,
      numero,
      tipo: TipoFactura.SIMPLIFICADA,
      estado: EstadoFactura.COBRADA,
      fecha: fechaExpedicion,

      // Cliente (opcional para simplificada)
      ...(datos.clienteId && { clienteId: new mongoose.Types.ObjectId(datos.clienteId) }),
      clienteNombre: datos.clienteNombre || 'Cliente Contado',
      clienteNif: datos.clienteNif || '',

      // Lineas
      lineas: lineasFactura,

      // Totales
      totales: {
        subtotalBruto: datos.subtotal,
        totalDescuentos: datos.descuentoTotal,
        subtotalNeto: totalBase,
        desgloseIva,
        totalIva: Math.round(totalIva * 100) / 100,
        totalRecargoEquivalencia: 0,
        totalFactura: datos.total,
        costeTotalMateriales: 0,
        costeTotalServicios: 0,
        costeTotalKits: 0,
        costeTotal: 0,
        margenBruto: 0,
        margenPorcentaje: 0,
      },

      descuentoGlobalPorcentaje: 0,
      descuentoGlobalImporte: datos.descuentoTotal,

      // Cobros
      cobros,
      importeCobrado: datos.total,
      importePendiente: 0,

      // Datos fiscales
      regimenIva: 'general',
      recargoEquivalencia: false,
      sistemaFiscal: empresa.verifactuConfig?.sistemaFiscal || SistemaFiscal.VERIFACTU,

      // Verifactu
      verifactu: {
        idFactura: codigo,
        hash,
        hashAnterior,
        fechaExpedicion,
        estadoEnvio: 'pendiente',
        urlQR,
        datosQR,
      },

      // QR para imprimir
      codigoQR: datosQR,
      urlVerificacion: urlQR,

      // Observaciones
      observaciones: datos.esTicketRegalo ? 'TICKET REGALO - Sin precios' : undefined,
      observacionesInternas: `TPV: ${tpv.nombre} | Vendedor: ${datos.usuarioNombre}`,

      // Control
      activo: true,
      bloqueado: true,
      inmutable: true, // Facturas ya emitidas no se pueden modificar (ley anti-fraude)

      // Visualización
      mostrarCostes: false,
      mostrarMargenes: false,
      mostrarComponentesKit: true,
      mostrarPrecios: !datos.esTicketRegalo,

      // Auditoría
      creadoPor: new mongoose.Types.ObjectId(datos.usuarioId),
      fechaCreacion: new Date(),

      // Historial
      historial: [{
        fecha: new Date(),
        usuarioId: new mongoose.Types.ObjectId(datos.usuarioId),
        accion: 'Ticket creado desde TPV',
        descripcion: `Creado en ${tpv.nombre}`,
      }],
    });

    await ticket.save();
    console.log('[TPV crearTicket] Ticket guardado:', { ticketId: ticket._id.toString(), codigo, serie: serieTicket, numero });

    // Crear movimiento bancario por cada método de pago
    try {
      for (const pago of datos.pagos) {
        if (pago.importe > 0) {
          // Para efectivo, descontar el cambio
          const importeReal = pago.metodo === 'efectivo' && datos.cambio > 0
            ? pago.importe - datos.cambio
            : pago.importe;

          if (importeReal > 0) {
            await movimientosBancariosService.crearDesdeTPV(empresaId, {
              tpvId,
              tpvNombre: tpv.nombre,
              ticketId: ticket._id.toString(),
              ticketNumero: codigo,
              importe: importeReal,
              metodo: pago.metodo,
              fecha: fechaExpedicion,
              clienteId: datos.clienteId,
              clienteNombre: datos.clienteNombre,
              clienteNif: datos.clienteNif,
              usuarioId: datos.usuarioId,
            });
            console.log('[TPV crearTicket] Movimiento bancario creado:', { metodo: pago.metodo, importe: importeReal });
          }
        }
      }
    } catch (error: any) {
      // No fallar si hay error en movimientos, el ticket ya está creado
      console.error('[TPV crearTicket] Error creando movimiento bancario:', error.message);
    }

    return {
      ticketId: ticket._id.toString(),
      codigo,
      serie: serieTicket,
      numero,
      fecha: fechaExpedicion,
      verifactu: {
        hash,
        hashAnterior,
        urlQR,
        datosQR,
      },
    };
  }

  /**
   * Genera hash encadenado para Verifactu
   */
  private generarHashVerifactu(datos: {
    nifEmitente: string;
    numSerieFactura: string;
    fechaExpedicion: Date;
    tipoFactura: string;
    cuotaTotal: number;
    importeTotal: number;
    hashAnterior?: string;
  }): string {
    const fechaStr = this.formatearFechaVerifactu(datos.fechaExpedicion).replace(/-/g, '');

    const cadena = [
      datos.nifEmitente,
      datos.numSerieFactura,
      fechaStr,
      datos.tipoFactura,
      datos.cuotaTotal.toFixed(2),
      datos.importeTotal.toFixed(2),
      datos.hashAnterior || 'GENESIS',
    ].join('');

    return crypto
      .createHash('sha256')
      .update(cadena)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Genera URL de verificación para QR Verifactu
   */
  private generarURLVerificacion(
    codigo: string,
    nif: string,
    fecha: Date,
    total: number,
    entorno: 'test' | 'production'
  ): string {
    const baseUrl = entorno === 'production'
      ? 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR'
      : 'https://www7.aeat.es/wlpl/TIKE-CONT/ValidarQR';

    const params = new URLSearchParams({
      nif,
      numserie: codigo,
      fecha: this.formatearFechaVerifactu(fecha),
      importe: total.toFixed(2),
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Formatea fecha para Verifactu (DD-MM-YYYY)
   */
  private formatearFechaVerifactu(fecha: Date): string {
    const d = new Date(fecha);
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  }

  /**
   * Obtener vencimientos pendientes para TPV
   * Devuelve cobros (clientes) y pagos (proveedores) pendientes
   */
  async obtenerVencimientosPendientes(
    empresaId: string,
    tipo?: 'cobro' | 'pago',
    busqueda?: string,
    limite: number = 50
  ): Promise<{
    cobros: any[];
    pagos: any[];
    totalPendienteCobros: number;
    totalPendientePagos: number;
  }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Vencimiento = await getVencimientoModel(empresaId, dbConfig);

    // Query base: pendientes o parciales
    const queryBase: any = {
      estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
    };

    // Filtro de búsqueda
    if (busqueda) {
      queryBase.$or = [
        { numero: { $regex: busqueda, $options: 'i' } },
        { terceroNombre: { $regex: busqueda, $options: 'i' } },
        { documentoNumero: { $regex: busqueda, $options: 'i' } },
        { terceroNif: { $regex: busqueda, $options: 'i' } },
      ];
    }

    // Consultar cobros y pagos
    const queryCobros = { ...queryBase, tipo: TipoVencimiento.COBRO };
    const queryPagos = { ...queryBase, tipo: TipoVencimiento.PAGO };

    const [cobros, pagos, totalCobros, totalPagos] = await Promise.all([
      (!tipo || tipo === 'cobro')
        ? Vencimiento.find(queryCobros)
            .sort({ fechaVencimiento: 1 })
            .limit(limite)
            .lean()
        : [],
      (!tipo || tipo === 'pago')
        ? Vencimiento.find(queryPagos)
            .sort({ fechaVencimiento: 1 })
            .limit(limite)
            .lean()
        : [],
      Vencimiento.aggregate([
        { $match: queryCobros },
        { $group: { _id: null, total: { $sum: '$importePendiente' } } },
      ]),
      Vencimiento.aggregate([
        { $match: queryPagos },
        { $group: { _id: null, total: { $sum: '$importePendiente' } } },
      ]),
    ]);

    return {
      cobros: cobros || [],
      pagos: pagos || [],
      totalPendienteCobros: totalCobros[0]?.total || 0,
      totalPendientePagos: totalPagos[0]?.total || 0,
    };
  }

  /**
   * Buscar vencimiento por número de factura
   */
  async buscarVencimientoPorFactura(
    empresaId: string,
    numeroFactura: string
  ): Promise<any[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Vencimiento = await getVencimientoModel(empresaId, dbConfig);

    const vencimientos = await Vencimiento.find({
      documentoNumero: { $regex: numeroFactura, $options: 'i' },
      estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
    })
      .sort({ fechaVencimiento: 1 })
      .lean();

    return vencimientos;
  }

  /**
   * Cobrar/Pagar vencimiento desde TPV
   * Registra el cobro y crea el movimiento bancario correspondiente
   */
  async cobrarVencimiento(
    tpvId: string,
    empresaId: string,
    vencimientoId: string,
    datos: {
      importe: number;
      metodo: 'efectivo' | 'tarjeta' | 'bizum' | 'transferencia';
      formaPagoId?: string;
      referencia?: string;
      observaciones?: string;
      usuarioId: string;
    }
  ): Promise<{
    success: boolean;
    vencimiento: any;
    movimientoId?: string;
    message: string;
  }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Vencimiento = await getVencimientoModel(empresaId, dbConfig);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);

    // Verificar TPV
    const tpv = await TPVRegistrado.findById(tpvId);
    if (!tpv) {
      throw new Error('TPV no encontrado');
    }

    // Obtener vencimiento
    const vencimiento = await Vencimiento.findById(vencimientoId);
    if (!vencimiento) {
      throw new Error('Vencimiento no encontrado');
    }

    // Verificar que se puede cobrar
    if (vencimiento.estado === EstadoVencimiento.ANULADO) {
      throw new Error('No se puede cobrar un vencimiento anulado');
    }

    if (vencimiento.estado === EstadoVencimiento.COBRADO || vencimiento.estado === EstadoVencimiento.PAGADO) {
      throw new Error('Este vencimiento ya está cobrado/pagado');
    }

    // Verificar importe
    if (datos.importe > vencimiento.importePendiente) {
      throw new Error(`El importe (${datos.importe}) excede el pendiente (${vencimiento.importePendiente})`);
    }

    // Registrar cobro parcial
    vencimiento.cobrosParciales.push({
      fecha: new Date(),
      importe: datos.importe,
      formaPagoId: datos.formaPagoId ? new mongoose.Types.ObjectId(datos.formaPagoId) : undefined,
      referencia: datos.referencia || `TPV: ${tpv.nombre}`,
      observaciones: datos.observaciones,
    });

    // Actualizar importes
    vencimiento.importeCobrado += datos.importe;
    vencimiento.importePendiente = vencimiento.importe - vencimiento.importeCobrado;

    // Actualizar estado
    if (vencimiento.importePendiente <= 0) {
      vencimiento.estado = vencimiento.tipo === TipoVencimiento.COBRO
        ? EstadoVencimiento.COBRADO
        : EstadoVencimiento.PAGADO;
    } else {
      vencimiento.estado = EstadoVencimiento.PARCIAL;
    }

    await vencimiento.save();

    // Crear movimiento bancario
    let movimientoId: string | undefined;
    try {
      const tipoMovimiento = vencimiento.tipo === TipoVencimiento.COBRO ? 'entrada' : 'salida';
      const concepto = vencimiento.tipo === TipoVencimiento.COBRO
        ? `Cobro factura ${vencimiento.documentoNumero} - ${vencimiento.terceroNombre}`
        : `Pago factura ${vencimiento.documentoNumero} - ${vencimiento.terceroNombre}`;

      const movimiento = await movimientosBancariosService.crearDesdeTPV(empresaId, {
        tpvId,
        tpvNombre: tpv.nombre,
        ticketId: vencimiento.documentoId?.toString() || '',
        ticketNumero: vencimiento.documentoNumero || '',
        importe: datos.importe,
        metodo: datos.metodo,
        fecha: new Date(),
        clienteId: vencimiento.clienteId?.toString(),
        clienteNombre: vencimiento.terceroNombre,
        clienteNif: vencimiento.terceroNif,
        usuarioId: datos.usuarioId,
        formaPagoId: datos.formaPagoId,
      });
      movimientoId = movimiento._id.toString();
    } catch (error: any) {
      console.error('[TPV cobrarVencimiento] Error creando movimiento bancario:', error.message);
    }

    const estadoTexto = vencimiento.importePendiente <= 0 ? 'completamente' : 'parcialmente';
    const accionTexto = vencimiento.tipo === TipoVencimiento.COBRO ? 'cobrado' : 'pagado';

    return {
      success: true,
      vencimiento: vencimiento.toObject(),
      movimientoId,
      message: `Vencimiento ${accionTexto} ${estadoTexto}. Importe: ${datos.importe.toFixed(2)} €`,
    };
  }

  /**
   * Sincroniza un movimiento de caja offline desde el TPV
   * Tipos: 'movimiento' (entrada/salida manual), 'caja' (apertura/cierre)
   */
  async sincronizarMovimientoCaja(
    tpvId: string,
    empresaId: string,
    tipo: 'movimiento' | 'caja',
    datos: any
  ): Promise<{
    success: boolean;
    movimientoId?: string;
    message: string;
  }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, dbConfig);

    // Verificar TPV
    const tpv = await TPVRegistrado.findById(tpvId);
    if (!tpv) {
      throw new Error('TPV no encontrado');
    }

    try {
      if (tipo === 'movimiento') {
        // Movimiento manual de caja (entrada/salida)
        const movimiento = await movimientosBancariosService.crearDesdeTPV(empresaId, {
          tpvId,
          tpvNombre: tpv.nombre,
          ticketId: datos.id || '',
          ticketNumero: `MOV-${datos.id?.slice(-6) || Date.now()}`,
          importe: datos.importe || datos.importeOriginal || 0,
          metodo: 'efectivo',
          fecha: datos.fecha ? new Date(datos.fecha) : new Date(),
          usuarioId: datos.usuarioId,
          esMovimientoCaja: true,
          tipoMovimiento: datos.tipo, // 'entrada' o 'salida'
          descripcion: datos.descripcion,
        });

        return {
          success: true,
          movimientoId: movimiento._id.toString(),
          message: `Movimiento de caja sincronizado: ${datos.tipo}`,
        };
      } else if (tipo === 'caja') {
        // Cierre de caja
        // TODO: Crear registro de cierre de caja en la BD
        // Por ahora solo registramos el evento
        console.log('[TPV Sync] Cierre de caja recibido:', {
          tpvId,
          arqueoTeorico: datos.arqueoTeorico,
          arqueoReal: datos.arqueoReal,
          diferencia: datos.diferencia,
          movimientos: datos.movimientos?.length,
        });

        return {
          success: true,
          message: 'Cierre de caja registrado',
        };
      }

      return {
        success: false,
        message: 'Tipo de movimiento no reconocido',
      };
    } catch (error: any) {
      console.error('[TPV Sync] Error sincronizando movimiento de caja:', error.message);
      throw error;
    }
  }
}

export const tpvSyncService = new TPVSyncService();
