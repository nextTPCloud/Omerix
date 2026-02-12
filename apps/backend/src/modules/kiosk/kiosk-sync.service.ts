import { IKioskRegistrado } from './KioskRegistrado';
import Empresa, { IDatabaseConfig } from '../empresa/Empresa';
import {
  getProductoModel,
  getFamiliaModel,
  getModificadorProductoModel,
  getGrupoModificadoresModel,
  getTiposImpuestoModel,
  getFormaPagoModel,
  getAlergenoModel,
  getSalonModel,
  getMesaModel,
} from '../../utils/dynamic-models.helper';

export class KioskSyncService {
  /**
   * Obtener la configuracion de BD de una empresa
   */
  private async getDbConfig(empresaId: string): Promise<IDatabaseConfig> {
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
   * Descarga todos los datos necesarios para el kiosk
   * Filtrado segun configuracion del kiosk
   */
  async descargarDatos(
    empresaId: string,
    kiosk: IKioskRegistrado,
    ultimaSync?: Date
  ): Promise<{
    productos: any[];
    familias: any[];
    modificadores: any[];
    gruposModificadores: any[];
    tiposImpuesto: any[];
    formasPago: any[];
    alergenos: any[];
    salones: any[];
    mesas: any[];
    timestamp: Date;
  }> {
    console.log('[Kiosk Sync] Obteniendo dbConfig para empresa:', empresaId);
    const dbConfig = await this.getDbConfig(empresaId);
    console.log('[Kiosk Sync] dbConfig obtenido:', { host: dbConfig.host, database: dbConfig.database });

    // Obtener modelos
    const Producto = await getProductoModel(empresaId, dbConfig);
    console.log('[Kiosk Sync] Modelo Producto obtenido, coleccion:', Producto.collection.name);
    const Familia = await getFamiliaModel(empresaId, dbConfig);
    const ModificadorProducto = await getModificadorProductoModel(empresaId, dbConfig);
    const GrupoModificadores = await getGrupoModificadoresModel(empresaId, dbConfig);
    const TipoImpuesto = await getTiposImpuestoModel(empresaId, dbConfig);
    const FormaPago = await getFormaPagoModel(empresaId, dbConfig);
    const Alergeno = await getAlergenoModel(empresaId, dbConfig);
    const Salon = await getSalonModel(empresaId, dbConfig);
    const Mesa = await getMesaModel(empresaId, dbConfig);

    // Construir query base
    const baseQuery: any = {};
    if (ultimaSync) {
      baseQuery.updatedAt = { $gte: ultimaSync };
    }

    // Filtrar familias visibles si estan configuradas
    const familiasVisibles = kiosk.config.familiasVisibles || [];
    const filtroFamilias = familiasVisibles.length > 0
      ? { _id: { $in: familiasVisibles } }
      : {};

    // Obtener familias activas
    const familias = await Familia.find({
      ...baseQuery,
      ...filtroFamilias,
      activo: true,
    })
      .select('_id nombre descripcion color imagen orden')
      .sort({ orden: 1, nombre: 1 })
      .lean();

    const familiaIds = familias.map((f: any) => f._id);

    // Obtener productos de las familias visibles que esten habilitados para kiosk
    const queryProductos: any = {
      activo: true,
      usarEnKiosk: true,
    };

    // Si hay familias visibles configuradas, filtrar por ellas
    if (familiasVisibles.length > 0) {
      queryProductos.familiaId = { $in: familiaIds };
    }

    if (ultimaSync) {
      queryProductos.updatedAt = { $gte: ultimaSync };
    }

    console.log('[Kiosk Sync] Query productos:', JSON.stringify(queryProductos));

    // Primero contar cuantos productos hay en total
    const totalProductos = await Producto.countDocuments({});
    const productosActivos = await Producto.countDocuments({ activo: true });
    const productosKiosk = await Producto.countDocuments({ activo: true, usarEnKiosk: true });
    console.log('[Kiosk Sync] Estadisticas productos:', {
      total: totalProductos,
      activos: productosActivos,
      conUsarEnKiosk: productosKiosk
    });

    const productos = await Producto.find(queryProductos)
      .select('_id codigo nombre descripcion familiaId precios tipoImpuestoId imagen imagenPrincipal color modificadoresDisponibles')
      .populate('tipoImpuestoId', 'codigo nombre porcentaje')
      .lean();

    console.log('[Kiosk Sync] Productos encontrados:', productos.length);

    // Obtener modificadores
    const modificadores = await ModificadorProducto.find({
      ...baseQuery,
      activo: { $ne: false },
    })
      .select('_id codigo nombre tipo precioExtra esMultiple cantidadMaxima color grupoId')
      .populate('grupoId', 'nombre color')
      .lean();

    // Obtener grupos de modificadores
    const gruposModificadores = await GrupoModificadores.find({
      ...baseQuery,
      activo: { $ne: false },
    })
      .select('_id codigo nombre color orden')
      .sort({ orden: 1, nombre: 1 })
      .lean();

    // Obtener tipos de impuesto
    const tiposImpuesto = await TipoImpuesto.find({
      activo: { $ne: false },
    })
      .select('_id codigo nombre porcentaje')
      .lean();

    // Obtener formas de pago habilitadas para el kiosk
    let formasPago: any[] = [];
    if (kiosk.pagos.permitePago && kiosk.pagos.formasPagoIds.length > 0) {
      formasPago = await FormaPago.find({
        _id: { $in: kiosk.pagos.formasPagoIds },
        activo: { $ne: false },
      })
        .select('_id codigo nombre tipo icono')
        .lean();
    }

    // Obtener alergenos si estan habilitados
    let alergenos: any[] = [];
    if (kiosk.config.mostrarAlergenos) {
      alergenos = await Alergeno.find({
        activo: { $ne: false },
      })
        .select('_id codigo nombre descripcion icono')
        .lean();
    }

    // Obtener salones y mesas si el kiosk tiene salon asignado
    let salones: any[] = [];
    let mesas: any[] = [];

    if (kiosk.salonId) {
      salones = await Salon.find({
        _id: kiosk.salonId,
        activo: { $ne: false },
      })
        .select('_id nombre config')
        .lean();

      mesas = await Mesa.find({
        salonId: kiosk.salonId,
        activo: { $ne: false },
      })
        .select('_id numero nombre capacidad estado salonId posicion')
        .sort({ numero: 1 })
        .lean();
    }

    return {
      productos,
      familias,
      modificadores,
      gruposModificadores,
      tiposImpuesto,
      formasPago,
      alergenos,
      salones,
      mesas,
      timestamp: new Date(),
    };
  }
}

export const kioskSyncService = new KioskSyncService();
