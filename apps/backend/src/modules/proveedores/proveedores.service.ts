import mongoose, { Model } from 'mongoose';
import { CreateProveedorDTO, UpdateProveedorDTO, GetProveedoresQuery } from './proveedores.dto';
import { Proveedor, IProveedor } from '@/modules/proveedores/Proveedor';
import { IDatabaseConfig } from '@/models/Empresa';
import { getProveedorModel } from '@/utils/dynamic-models.helper';
import { parseAdvancedFilters, mergeFilters } from '@/utils/advanced-filters.helper';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface findAllResult {
  proveedores: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProveedoresService {

  /**
   * Obtener modelo de Proveedor para una empresa específica
   */
  private async getModeloProveedor(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IProveedor>> {
    return await getProveedorModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR PROVEEDOR
  // ============================================

  async crear(
    createProveedorDto: CreateProveedorDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProveedor> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const proveedorData = {
      ...createProveedorDto,
      empresaId,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    };

    const proveedor = new ProveedorModel(proveedorData);
    await proveedor.save();

    return proveedor;
  }

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACIÓN
  // ============================================

  async findAll(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    query: Partial<GetProveedoresQuery>
  ): Promise<findAllResult> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const {
      search,
      sortBy = 'nombre',
      sortOrder = 'asc',
      page = 1,
      limit = 25,
      activo,
      tipoProveedor,
      formaPagoId,
      terminoPagoId,
      categoriaId,
      zona,
      calificacionMinima,
    } = query;

    // Construir filtro
    const filter: any = {};

    // Búsqueda por texto
    if (search) {
      filter.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { nombreComercial: { $regex: search, $options: 'i' } },
        { codigo: { $regex: search, $options: 'i' } },
        { nif: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { telefono: { $regex: search, $options: 'i' } },
        { 'direccion.calle': { $regex: search, $options: 'i' } },
        { 'direccion.ciudad': { $regex: search, $options: 'i' } },
        { 'direccion.provincia': { $regex: search, $options: 'i' } },
      ];
    }

    // Filtros adicionales
    if (activo !== undefined) {
      filter.activo = activo;
    }

    if (tipoProveedor) {
      filter.tipoProveedor = tipoProveedor;
    }

    if (formaPagoId) {
      filter.formaPagoId = formaPagoId;
    }

    if (terminoPagoId) {
      filter.terminoPagoId = terminoPagoId;
    }

    if (categoriaId) {
      filter.categoriaId = categoriaId;
    }

    if (zona) {
      filter.zona = zona;
    }

    if (calificacionMinima) {
      filter.calificacion = { $gte: calificacionMinima };
    }

    // FILTROS AVANZADOS - Procesar operadores como _ne, _gt, _lt, etc.
    const allowedAdvancedFields = [
      'codigo', 'nombre', 'nombreComercial', 'nif', 'email', 'telefono',
      'tipoProveedor', 'totalCompras', 'calificacion', 'fiabilidad',
      'tiempoEntregaPromedio', 'activo', 'createdAt',
    ];
    const advancedFilters = parseAdvancedFilters(query as any, allowedAdvancedFields);

    // Combinar filtros existentes con filtros avanzados
    const finalFilter = mergeFilters(filter, advancedFilters);

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar consulta
    const [proveedores, total] = await Promise.all([
      ProveedorModel.find(finalFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('categoriaId', 'nombre')
        .populate('formaPagoId', 'nombre')
        .populate('terminoPagoId', 'nombre')
        .lean(),
      ProveedorModel.countDocuments(finalFilter),
    ]);

    return {
      proveedores,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async findById(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProveedor | null> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const proveedor = await ProveedorModel.findOne({
      _id: id,
    })
      .populate('categoriaId', 'nombre')
      .populate('formaPagoId', 'nombre codigo')
      .populate('terminoPagoId', 'nombre dias');

    return proveedor;
  }

  // ============================================
  // OBTENER POR CÓDIGO
  // ============================================

  async findByCodigo(
    codigo: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProveedor | null> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const proveedor = await ProveedorModel.findOne({
      codigo: codigo.toUpperCase(),
    });

    return proveedor;
  }

  // ============================================
  // OBTENER POR NIF
  // ============================================

  async findByNif(
    nif: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProveedor | null> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const proveedor = await ProveedorModel.findOne({
      nif: nif.toUpperCase(),
    });

    return proveedor;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    updateProveedorDto: UpdateProveedorDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProveedor | null> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const proveedor = await ProveedorModel.findOneAndUpdate(
      { _id: id },
      {
        ...updateProveedorDto,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true, runValidators: true }
    );

    return proveedor;
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const resultado = await ProveedorModel.deleteOne({
      _id: id,
    });

    return resultado.deletedCount > 0;
  }

  // ============================================
  // ELIMINACIÓN MÚLTIPLE
  // ============================================

  async eliminarMultiples(
    ids: string[],
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<number> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const resultado = await ProveedorModel.deleteMany({
      _id: { $in: ids },
    });

    return resultado.deletedCount || 0;
  }

  // ============================================
  // TOGGLE ESTADO (ACTIVAR/DESACTIVAR)
  // ============================================

  async toggleEstado(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProveedor | null> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const proveedor = await ProveedorModel.findById(id);

    if (!proveedor) {
      return null;
    }

    proveedor.activo = !proveedor.activo;
    proveedor.modificadoPor = usuarioId;
    proveedor.fechaModificacion = new Date();

    await proveedor.save();

    return proveedor;
  }

  // ============================================
  // ACTIVAR/DESACTIVAR MÚLTIPLES
  // ============================================

  async setEstadoMultiples(
    ids: string[],
    activo: boolean,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<number> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const resultado = await ProveedorModel.updateMany(
      { _id: { $in: ids } },
      {
        activo,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      }
    );

    return resultado.modifiedCount || 0;
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    totalCompras: number;
    promedioCalificacion: number;
  }> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const [totales, activos, inactivos, estadisticas] = await Promise.all([
      ProveedorModel.countDocuments(),
      ProveedorModel.countDocuments({ activo: true }),
      ProveedorModel.countDocuments({ activo: false }),
      ProveedorModel.aggregate([
        { $match: { activo: true } },
        {
          $group: {
            _id: null,
            totalCompras: { $sum: '$totalCompras' },
            promedioCalificacion: { $avg: '$calificacion' },
          }
        }
      ]),
    ]);

    return {
      total: totales,
      activos,
      inactivos,
      totalCompras: estadisticas[0]?.totalCompras || 0,
      promedioCalificacion: estadisticas[0]?.promedioCalificacion || 0,
    };
  }

  // ============================================
  // BUSCAR PARA SELECTOR (AUTOCOMPLETADO)
  // ============================================

  async buscarParaSelector(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    search: string,
    limit: number = 10
  ): Promise<Array<{ _id: string; codigo: string; nombre: string; nif: string }>> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const proveedores = await ProveedorModel.find({
      activo: true,
      $or: [
        { nombre: { $regex: search, $options: 'i' } },
        { nombreComercial: { $regex: search, $options: 'i' } },
        { codigo: { $regex: search, $options: 'i' } },
        { nif: { $regex: search, $options: 'i' } },
      ],
    })
      .select('_id codigo nombre nif')
      .limit(limit)
      .lean();

    return proveedores.map((p: any) => ({
      _id: p._id.toString(),
      codigo: p.codigo,
      nombre: p.nombre,
      nif: p.nif,
    }));
  }

  // ============================================
  // ACTUALIZAR ESTADÍSTICAS DE COMPRA
  // ============================================

  async actualizarEstadisticasCompra(
    id: string,
    importeCompra: number,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<void> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    await ProveedorModel.updateOne(
      { _id: id },
      {
        $inc: { totalCompras: importeCompra },
        $set: { ultimaCompra: new Date() },
      }
    );
  }

  // ============================================
  // VERIFICAR EXISTENCIA POR NIF
  // ============================================

  async existeNif(
    nif: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    excludeId?: string
  ): Promise<boolean> {
    const ProveedorModel = await this.getModeloProveedor(String(empresaId), dbConfig);

    const query: any = { nif: nif.toUpperCase() };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await ProveedorModel.countDocuments(query);
    return count > 0;
  }
}

// Exportar instancia singleton
export const proveedoresService = new ProveedoresService();
