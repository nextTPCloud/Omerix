import mongoose from 'mongoose';
import Producto from '../productos/Producto';
import Cliente from '../clientes/Cliente';
import Familia from '../familias/Familia';
import TipoImpuesto from '../tipos-impuesto/TipoImpuesto';
import FormaPago from '../formas-pago/FormaPago';
import Almacen from '../almacenes/Almacen';
import Tarifa from '../tarifas/Tarifa';
import Oferta from '../ofertas/Oferta';
import Usuario from '../usuarios/Usuario';
import TPVRegistrado from './TPVRegistrado';

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

export class TPVSyncService {
  /**
   * Descarga todos los datos necesarios para el TPV
   */
  async descargarDatos(
    tpvId: string,
    empresaId: string,
    ultimaSync?: Date
  ): Promise<IDatosSincronizacion> {
    // Obtener datos del TPV
    const tpv = await TPVRegistrado.findOne({ _id: tpvId, empresaId });
    if (!tpv) {
      throw new Error('TPV no encontrado');
    }

    // Obtener empresa
    const Empresa = mongoose.model('Empresa');
    const empresa = await Empresa.findById(empresaId);

    // Filtro de fecha si es sincronizacion incremental
    const filtroFecha = ultimaSync
      ? { updatedAt: { $gte: ultimaSync } }
      : {};

    // Cargar datos en paralelo
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
        empresaId,
        activo: true,
        ...filtroFecha,
      }).select({
        _id: 1,
        codigo: 1,
        nombre: 1,
        descripcion: 1,
        familiaId: 1,
        tipoImpuestoId: 1,
        precioVenta: 1,
        codigoBarras: 1,
        imagen: 1,
        unidadMedida: 1,
        ventaPorPeso: 1,
        stockMinimo: 1,
        controlStock: 1,
        modificadores: 1,
        variantes: 1,
      }),

      // Familias activas
      Familia.find({
        empresaId,
        activo: true,
        ...filtroFecha,
      }).select({
        _id: 1,
        codigo: 1,
        nombre: 1,
        color: 1,
        orden: 1,
        familiaId: 1, // Padre
        imagen: 1,
      }),

      // Clientes activos
      Cliente.find({
        empresaId,
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
        empresaId,
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
        empresaId,
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
        empresaId,
        activo: true,
      }).select({
        _id: 1,
        codigo: 1,
        nombre: 1,
        direccion: 1,
      }),

      // Tarifas activas
      Tarifa.find({
        empresaId,
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
        empresaId,
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

      // Usuarios con PIN para TPV
      Usuario.find({
        empresaId,
        activo: true,
        pinTPV: { $exists: true, $ne: null },
      }).select({
        _id: 1,
        nombre: 1,
        apellidos: 1,
        rol: 1,
        permisos: 1,
      }),
    ]);

    return {
      productos,
      familias,
      clientes,
      tiposImpuesto,
      formasPago,
      almacenes,
      tarifas,
      ofertas,
      usuarios,
      config: {
        serieFactura: tpv.serieFactura,
        almacenId: tpv.almacenId.toString(),
        tpvNombre: tpv.nombre,
        tpvConfig: tpv.config,
        empresaNombre: empresa?.nombre || '',
        empresaCif: empresa?.cif || '',
        empresaDireccion: empresa?.direccion
          ? `${empresa.direccion.calle}, ${empresa.direccion.ciudad}`
          : '',
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

    // Verificar TPV
    const tpv = await TPVRegistrado.findOne({ _id: tpvId, empresaId });
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
    const tpv = await TPVRegistrado.findOne({ _id: tpvId, empresaId });
    if (!tpv) {
      throw new Error('TPV no encontrado');
    }

    const Stock = mongoose.model('Stock');

    const filtro: any = {
      empresaId,
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
    // Obtener movimientos de caja del dia
    const Caja = mongoose.model('Caja');

    const iniciodia = new Date(fecha);
    iniciodia.setHours(0, 0, 0, 0);

    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const cajas = await Caja.find({
      empresaId,
      tpvId,
      fechaApertura: { $gte: iniciodia, $lte: finDia },
    });

    return cajas;
  }
}

export const tpvSyncService = new TPVSyncService();
