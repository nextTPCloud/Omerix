import { Model, Types, FilterQuery } from 'mongoose';
import { IDatabaseConfig } from '../empresa/Empresa';
import { ITarifa } from './Tarifa';
import { getTarifaModel, getProductoModel } from '../../utils/dynamic-models.helper';
import {
  CreateTarifaDto,
  UpdateTarifaDto,
  GetTarifasQueryDto,
  AddPrecioTarifaDto,
} from './tarifas.dto';

class TarifasService {
  /**
   * Obtener modelo de Tarifa para la empresa
   */
  private async getModel(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<ITarifa>> {
    return getTarifaModel(empresaId, dbConfig);
  }

  /**
   * Obtener todas las tarifas con paginacion y filtros
   */
  async getAll(
    query: GetTarifasQueryDto,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const TarifaModel = await this.getModel(empresaId, dbConfig);

    const {
      search,
      sortBy = 'nombre',
      sortOrder = 'asc',
      page = 1,
      limit = 25,
      activo,
      tipo,
      vigente,
    } = query;

    // Construir filtro
    const filter: FilterQuery<ITarifa> = {
      empresaId: new Types.ObjectId(empresaId),
    };

    if (search) {
      filter.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
      ];
    }

    if (activo !== undefined) {
      filter.activo = activo;
    }

    if (tipo) {
      filter.tipo = tipo;
    }

    if (vigente !== undefined) {
      const ahora = new Date();
      if (vigente) {
        filter.activo = true;
        filter.$and = [
          { $or: [{ fechaDesde: { $exists: false } }, { fechaDesde: { $lte: ahora } }] },
          { $or: [{ fechaHasta: { $exists: false } }, { fechaHasta: null }, { fechaHasta: { $gte: ahora } }] },
        ];
      }
    }

    // Contar total
    const total = await TarifaModel.countDocuments(filter);

    // Obtener datos paginados
    const tarifas = await TarifaModel.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      data: tarifas,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener tarifa por ID con nombres de productos populados
   */
  async getById(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const TarifaModel = await this.getModel(empresaId, dbConfig);
    const ProductoModel = await getProductoModel(empresaId, dbConfig);

    const tarifa = await TarifaModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    }).lean();

    if (!tarifa) return null;

    // Popular nombres de productos en los precios
    if (tarifa.precios && tarifa.precios.length > 0) {
      const productoIds = tarifa.precios.map(p => p.productoId);
      const productos = await ProductoModel.find({
        _id: { $in: productoIds },
      }).select('_id nombre sku').lean();

      const productosMap = new Map(
        productos.map(p => [p._id.toString(), { nombre: p.nombre, sku: p.sku }])
      );

      tarifa.precios = tarifa.precios.map(precio => ({
        ...precio,
        productoNombre: productosMap.get(precio.productoId.toString())?.nombre || 'Producto no encontrado',
        productoSku: productosMap.get(precio.productoId.toString())?.sku || '',
      }));
    }

    return tarifa;
  }

  /**
   * Obtener tarifas activas
   */
  async getActivas(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const TarifaModel = await this.getModel(empresaId, dbConfig);
    const ahora = new Date();

    const tarifas = await TarifaModel.find({
      empresaId: new Types.ObjectId(empresaId),
      activo: true,
      $or: [
        { fechaDesde: { $exists: false } },
        { fechaDesde: { $lte: ahora } },
      ],
    })
      .sort({ nombre: 1 })
      .select('_id codigo nombre tipo porcentajeGeneral')
      .lean();

    return tarifas;
  }

  /**
   * Crear nueva tarifa
   */
  async create(
    createDto: CreateTarifaDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ) {
    const TarifaModel = await this.getModel(empresaId, dbConfig);

    // Verificar codigo unico si se proporciona
    if (createDto.codigo) {
      const existente = await TarifaModel.findOne({
        empresaId: new Types.ObjectId(empresaId),
        codigo: createDto.codigo,
      });

      if (existente) {
        throw new Error(`Ya existe una tarifa con el codigo ${createDto.codigo}`);
      }
    }

    const tarifa = new TarifaModel({
      ...createDto,
      empresaId: new Types.ObjectId(empresaId),
      creadoPor: new Types.ObjectId(usuarioId),
    });

    await tarifa.save();
    return tarifa;
  }

  /**
   * Actualizar tarifa
   */
  async update(
    id: string,
    updateDto: UpdateTarifaDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ) {
    const TarifaModel = await this.getModel(empresaId, dbConfig);

    // Verificar que existe
    const tarifa = await TarifaModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!tarifa) {
      throw new Error('Tarifa no encontrada');
    }

    // Verificar codigo unico si se cambia
    if (updateDto.codigo && updateDto.codigo !== tarifa.codigo) {
      const existente = await TarifaModel.findOne({
        empresaId: new Types.ObjectId(empresaId),
        codigo: updateDto.codigo,
        _id: { $ne: new Types.ObjectId(id) },
      });

      if (existente) {
        throw new Error(`Ya existe una tarifa con el codigo ${updateDto.codigo}`);
      }
    }

    // Actualizar
    Object.assign(tarifa, updateDto);
    tarifa.modificadoPor = new Types.ObjectId(usuarioId);
    await tarifa.save();

    return tarifa;
  }

  /**
   * Eliminar tarifa
   */
  async delete(
    id: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const TarifaModel = await this.getModel(empresaId, dbConfig);

    const result = await TarifaModel.deleteOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (result.deletedCount === 0) {
      throw new Error('Tarifa no encontrada');
    }

    return { success: true };
  }

  /**
   * Eliminar multiples tarifas
   */
  async bulkDelete(
    ids: string[],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const TarifaModel = await this.getModel(empresaId, dbConfig);

    const result = await TarifaModel.deleteMany({
      _id: { $in: ids.map(id => new Types.ObjectId(id)) },
      empresaId: new Types.ObjectId(empresaId),
    });

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  }

  /**
   * Cambiar estado activo
   */
  async changeStatus(
    id: string,
    activo: boolean,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ) {
    const TarifaModel = await this.getModel(empresaId, dbConfig);

    const tarifa = await TarifaModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        empresaId: new Types.ObjectId(empresaId),
      },
      {
        activo,
        modificadoPor: new Types.ObjectId(usuarioId),
      },
      { new: true }
    );

    if (!tarifa) {
      throw new Error('Tarifa no encontrada');
    }

    return tarifa;
  }

  /**
   * Agregar o actualizar precio de producto en tarifa
   */
  async addOrUpdatePrecio(
    tarifaId: string,
    precioDto: AddPrecioTarifaDto,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ) {
    const TarifaModel = await this.getModel(empresaId, dbConfig);

    const tarifa = await TarifaModel.findOne({
      _id: new Types.ObjectId(tarifaId),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!tarifa) {
      throw new Error('Tarifa no encontrada');
    }

    // Buscar si ya existe el producto
    const indexExistente = tarifa.precios.findIndex(
      p => p.productoId.toString() === precioDto.productoId &&
           (!precioDto.varianteId || p.varianteId?.toString() === precioDto.varianteId)
    );

    if (indexExistente >= 0) {
      // Actualizar existente
      tarifa.precios[indexExistente] = {
        ...tarifa.precios[indexExistente],
        ...precioDto,
        productoId: new Types.ObjectId(precioDto.productoId),
        varianteId: precioDto.varianteId ? new Types.ObjectId(precioDto.varianteId) : undefined,
      } as any;
    } else {
      // Agregar nuevo
      tarifa.precios.push({
        ...precioDto,
        productoId: new Types.ObjectId(precioDto.productoId),
        varianteId: precioDto.varianteId ? new Types.ObjectId(precioDto.varianteId) : undefined,
      } as any);
    }

    tarifa.modificadoPor = new Types.ObjectId(usuarioId);
    await tarifa.save();

    // Devolver tarifa con nombres de productos populados
    return this.getById(tarifaId, empresaId, dbConfig);
  }

  /**
   * Eliminar precio de producto de tarifa
   */
  async deletePrecio(
    tarifaId: string,
    productoId: string,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig,
    varianteId?: string
  ) {
    const TarifaModel = await this.getModel(empresaId, dbConfig);

    const tarifa = await TarifaModel.findOne({
      _id: new Types.ObjectId(tarifaId),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!tarifa) {
      throw new Error('Tarifa no encontrada');
    }

    // Filtrar para eliminar
    tarifa.precios = tarifa.precios.filter(
      p => !(p.productoId.toString() === productoId &&
             (!varianteId || p.varianteId?.toString() === varianteId))
    );

    tarifa.modificadoPor = new Types.ObjectId(usuarioId);
    await tarifa.save();

    // Devolver tarifa con nombres de productos populados
    return this.getById(tarifaId, empresaId, dbConfig);
  }

  /**
   * Duplicar tarifa
   */
  async duplicar(
    id: string,
    nuevoNombre: string,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ) {
    const TarifaModel = await this.getModel(empresaId, dbConfig);

    const original = await TarifaModel.findOne({
      _id: new Types.ObjectId(id),
      empresaId: new Types.ObjectId(empresaId),
    });

    if (!original) {
      throw new Error('Tarifa no encontrada');
    }

    const count = await TarifaModel.countDocuments({ empresaId: new Types.ObjectId(empresaId) });

    const nuevaTarifa = new TarifaModel({
      ...original.toObject(),
      _id: new Types.ObjectId(),
      codigo: `TAR-${String(count + 1).padStart(3, '0')}`,
      nombre: nuevoNombre || `${original.nombre} (copia)`,
      creadoPor: new Types.ObjectId(usuarioId),
      modificadoPor: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await nuevaTarifa.save();
    return nuevaTarifa;
  }
}

export const tarifasService = new TarifasService();
export default tarifasService;
