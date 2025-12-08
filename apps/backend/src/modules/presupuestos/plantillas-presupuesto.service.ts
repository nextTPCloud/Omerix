import mongoose, { Model } from 'mongoose';
import { IDatabaseConfig } from '@/models/Empresa';
import { getPlantillaPresupuestoModel } from '@/utils/dynamic-models.helper';
import { IPlantillaPresupuesto, ILineaPlantilla } from './PlantillaPresupuesto';
import { IPresupuesto, TipoLinea } from './Presupuesto';

// ============================================
// DTOs
// ============================================

export interface CreatePlantillaDTO {
  nombre: string;
  codigo?: string;
  descripcion?: string;
  categoria?: string;
  lineas?: ILineaPlantilla[];
  introduccion?: string;
  piePagina?: string;
  condicionesLegales?: string;
  condiciones?: {
    formaPagoId?: string;
    terminoPagoId?: string;
    validezDias?: number;
    tiempoEntrega?: string;
    garantia?: string;
    portesPagados?: boolean;
    portesImporte?: number;
    observacionesEntrega?: string;
  };
  descuentoGlobalPorcentaje?: number;
  esPublica?: boolean;
  tags?: string[];
}

export interface UpdatePlantillaDTO extends Partial<CreatePlantillaDTO> {}

export interface SearchPlantillasDTO {
  search?: string;
  categoria?: string;
  activo?: string;
  creadoPor?: string;
  tags?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// SERVICE
// ============================================

export class PlantillasPresupuestoService {
  /**
   * Obtener modelo para empresa específica
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IPlantillaPresupuesto>> {
    return await getPlantillaPresupuestoModel(empresaId, dbConfig);
  }

  /**
   * Crear plantilla
   */
  async crear(
    data: CreatePlantillaDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPlantillaPresupuesto> {
    const PlantillaModel = await this.getModelo(String(empresaId), dbConfig);

    // Asegurar orden en líneas
    const lineasOrdenadas = (data.lineas || []).map((linea, index) => ({
      ...linea,
      orden: linea.orden ?? index,
    }));

    const plantilla = new PlantillaModel({
      ...data,
      lineas: lineasOrdenadas,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    });

    await plantilla.save();
    return plantilla;
  }

  /**
   * Crear plantilla desde un presupuesto existente
   */
  async crearDesdePresupuesto(
    presupuesto: IPresupuesto,
    nombre: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    opciones?: {
      descripcion?: string;
      categoria?: string;
      mantenerPrecios?: boolean;
      mantenerCostes?: boolean;
      esPublica?: boolean;
    }
  ): Promise<IPlantillaPresupuesto> {
    const PlantillaModel = await this.getModelo(String(empresaId), dbConfig);

    // Convertir líneas del presupuesto a líneas de plantilla
    const lineas: ILineaPlantilla[] = presupuesto.lineas.map((linea, index) => ({
      orden: index,
      tipo: linea.tipo,
      productoId: linea.productoId,
      codigo: linea.codigo,
      nombre: linea.nombre,
      descripcion: linea.descripcion,
      descripcionLarga: linea.descripcionLarga,
      sku: linea.sku,
      cantidad: linea.cantidad,
      unidad: linea.unidad,
      precioUnitario: opciones?.mantenerPrecios !== false ? linea.precioUnitario : 0,
      costeUnitario: opciones?.mantenerCostes !== false ? linea.costeUnitario : 0,
      descuento: linea.descuento,
      iva: linea.iva,
      esEditable: linea.esEditable,
      incluidoEnTotal: linea.incluidoEnTotal,
      notasInternas: linea.notasInternas,
    }));

    const plantilla = new PlantillaModel({
      nombre,
      descripcion: opciones?.descripcion || `Plantilla creada desde ${presupuesto.codigo}`,
      categoria: opciones?.categoria,
      lineas,
      introduccion: presupuesto.introduccion,
      piePagina: presupuesto.piePagina,
      condicionesLegales: presupuesto.condicionesLegales,
      condiciones: presupuesto.condiciones,
      descuentoGlobalPorcentaje: presupuesto.descuentoGlobalPorcentaje,
      esPublica: opciones?.esPublica || false,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    });

    await plantilla.save();
    return plantilla;
  }

  /**
   * Obtener todas las plantillas con filtros
   */
  async findAll(
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    query: SearchPlantillasDTO
  ) {
    const PlantillaModel = await this.getModelo(String(empresaId), dbConfig);

    const {
      search,
      categoria,
      activo,
      creadoPor,
      tags,
      page = '1',
      limit = '25',
      sortBy = 'fechaCreacion',
      sortOrder = 'desc',
    } = query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Construir filtro
    const filter: any = {
      $or: [
        { creadoPor: usuarioId },
        { esPublica: true },
      ],
    };

    if (search) {
      filter.$and = [
        {
          $or: [
            { nombre: { $regex: search, $options: 'i' } },
            { codigo: { $regex: search, $options: 'i' } },
            { descripcion: { $regex: search, $options: 'i' } },
            { categoria: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    if (categoria) {
      filter.categoria = categoria;
    }

    if (activo !== undefined && activo !== 'all') {
      filter.activo = activo === 'true';
    }

    if (creadoPor === 'mias') {
      filter.$or = [{ creadoPor: usuarioId }];
    }

    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim().toLowerCase());
      filter.tags = { $in: tagsArray };
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (pageNum - 1) * limitNum;

    const [plantillas, total] = await Promise.all([
      PlantillaModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('creadoPor', 'nombre email')
        .lean(),
      PlantillaModel.countDocuments(filter),
    ]);

    return {
      plantillas,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Obtener plantilla por ID
   */
  async findById(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPlantillaPresupuesto | null> {
    const PlantillaModel = await this.getModelo(String(empresaId), dbConfig);
    return PlantillaModel.findById(id)
      .populate('creadoPor', 'nombre email')
      .populate('lineas.productoId', 'nombre sku precios');
  }

  /**
   * Actualizar plantilla
   */
  async actualizar(
    id: string,
    data: UpdatePlantillaDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPlantillaPresupuesto | null> {
    const PlantillaModel = await this.getModelo(String(empresaId), dbConfig);

    // Asegurar orden en líneas si se proporcionan
    let lineasOrdenadas;
    if (data.lineas) {
      lineasOrdenadas = data.lineas.map((linea, index) => ({
        ...linea,
        orden: linea.orden ?? index,
      }));
    }

    return PlantillaModel.findByIdAndUpdate(
      id,
      {
        ...data,
        ...(lineasOrdenadas && { lineas: lineasOrdenadas }),
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Eliminar plantilla
   */
  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPlantillaPresupuesto | null> {
    const PlantillaModel = await this.getModelo(String(empresaId), dbConfig);
    return PlantillaModel.findByIdAndDelete(id);
  }

  /**
   * Duplicar plantilla
   */
  async duplicar(
    id: string,
    nuevoNombre: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IPlantillaPresupuesto> {
    const PlantillaModel = await this.getModelo(String(empresaId), dbConfig);

    const original = await PlantillaModel.findById(id).lean();
    if (!original) {
      throw new Error('Plantilla no encontrada');
    }

    // Limpiar líneas
    const lineasLimpias = original.lineas.map((linea: any) => {
      const { _id, ...resto } = linea;
      return resto;
    });

    const nueva = new PlantillaModel({
      ...original,
      _id: new mongoose.Types.ObjectId(),
      nombre: nuevoNombre,
      codigo: undefined,
      lineas: lineasLimpias,
      vecesUsada: 0,
      ultimoUso: undefined,
      esPublica: false,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
      modificadoPor: undefined,
      fechaModificacion: undefined,
    });

    await nueva.save();
    return nueva;
  }

  /**
   * Incrementar contador de uso
   */
  async registrarUso(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<void> {
    const PlantillaModel = await this.getModelo(String(empresaId), dbConfig);
    await PlantillaModel.findByIdAndUpdate(id, {
      $inc: { vecesUsada: 1 },
      ultimoUso: new Date(),
    });
  }

  /**
   * Obtener categorías existentes
   */
  async getCategorias(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<string[]> {
    const PlantillaModel = await this.getModelo(String(empresaId), dbConfig);
    const categorias = await PlantillaModel.distinct('categoria', {
      activo: true,
      categoria: { $ne: null, $ne: '' },
    });
    return categorias.filter(Boolean).sort();
  }

  /**
   * Obtener plantillas más usadas
   */
  async getMasUsadas(
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    limite: number = 5
  ): Promise<IPlantillaPresupuesto[]> {
    const PlantillaModel = await this.getModelo(String(empresaId), dbConfig);
    return PlantillaModel.find({
      activo: true,
      $or: [{ creadoPor: usuarioId }, { esPublica: true }],
    })
      .sort({ vecesUsada: -1 })
      .limit(limite)
      .select('nombre codigo categoria vecesUsada ultimoUso')
      .lean();
  }
}

export const plantillasPresupuestoService = new PlantillasPresupuestoService();
