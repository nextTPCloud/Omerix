import mongoose from 'mongoose';
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
} from '../../utils/dynamic-models.helper';

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
        sku: 1,
        nombre: 1,
        descripcion: 1,
        familiaId: 1,
        tipoImpuestoId: 1,
        precios: 1,
        codigoBarras: 1,
        imagenes: 1,
        unidadMedida: 1,
        stock: 1,
        gestionaStock: 1,
        tieneVariantes: 1,
        variantes: 1,
        usarEnTPV: 1,
        permiteDescuento: 1,
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

    return {
      productos,
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
        empresaNombre: empresa?.nombre || '',
        empresaCif: empresa?.cif || '',
        empresaDireccion: empresa?.direccion
          ? `${empresa.direccion.calle || ''}, ${empresa.direccion.ciudad || ''}`
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
}

export const tpvSyncService = new TPVSyncService();
