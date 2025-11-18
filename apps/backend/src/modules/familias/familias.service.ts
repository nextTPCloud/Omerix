import mongoose, { Model } from 'mongoose';
import { Familia, IFamilia } from './Familia';
import { Producto, IProducto } from '../../models/Producto';
import { CreateFamiliaDTO, UpdateFamiliaDTO, SearchFamiliasDTO } from './familias.dto';
import { IDatabaseConfig } from '../../types/express';
import { getFamiliaModel, getProductoModel } from '../../utils/dynamic-models.helper';

export class FamiliasService {
  /**
   * Obtener modelo de Familia para una empresa específica
   */
  private async getModeloFamilia(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IFamilia>> {
    return await getFamiliaModel(empresaId, dbConfig);
  }

  /**
   * Obtener modelo de Producto para una empresa específica
   */
  private async getModeloProducto(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IProducto>> {
    return await getProductoModel(empresaId, dbConfig);
  }

  // Crear familia
  async crear(
    data: CreateFamiliaDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);

    // Verificar que el código no exista
    const existeCodigo = await FamiliaModel.findOne({
      codigo: data.codigo,
    });

    if (existeCodigo) {
      throw new Error('Ya existe una familia con ese código');
    }

    // Si tiene padre, verificar que exista
    if (data.familiaPadreId) {
      const padre = await FamiliaModel.findOne({
        _id: data.familiaPadreId,
      });

      if (!padre) {
        throw new Error('La familia padre no existe');
      }
    }

    const familia = new FamiliaModel({
      ...data,
      empresaId,
    });

    await familia.save();
    return familia;
  }

  // Obtener todas las familias
  async obtenerTodas(
    empresaId: mongoose.Types.ObjectId,
    filtros: SearchFamiliasDTO,
    dbConfig: IDatabaseConfig
  ) {
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);

    const {
      q,
      familiaPadreId,
      nivel,
      activo,
      page = 1,
      limit = 50,
      sortBy = 'orden',
      sortOrder = 'asc',
    } = filtros;

    // Construir query
    const query: any = {};

    // Búsqueda de texto
    if (q) {
      query.$or = [
        { nombre: { $regex: q, $options: 'i' } },
        { codigo: { $regex: q, $options: 'i' } },
        { descripcion: { $regex: q, $options: 'i' } },
      ];
    }

    // Filtro por familia padre
    if (familiaPadreId) {
      query.familiaPadreId = familiaPadreId;
    }

    // Filtro por nivel
    if (nivel !== undefined) {
      query.nivel = nivel;
    }

    // Filtro por estado
    if (activo !== undefined) {
      query.activo = activo;
    }

    // Calcular skip
    const skip = (page - 1) * limit;

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar query
    const [familias, total] = await Promise.all([
      FamiliaModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('familiaPadreId', 'nombre codigo')
        .lean(),
      FamiliaModel.countDocuments(query),
    ]);

    return {
      familias,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Obtener árbol de familias (jerarquía completa)
  async obtenerArbol(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);

    const familias = await FamiliaModel.find({ activo: true })
      .sort({ orden: 1, nombre: 1 })
      .lean();

    // Construir árbol jerárquico
    const arbol = this.construirArbol(familias);
    return arbol;
  }

  // Construir árbol jerárquico recursivamente
  private construirArbol(familias: any[], padreId: any = null): any[] {
    return familias
      .filter((f) => {
        if (padreId === null) {
          return !f.familiaPadreId;
        }
        return f.familiaPadreId?.toString() === padreId.toString();
      })
      .map((familia) => ({
        ...familia,
        subfamilias: this.construirArbol(familias, familia._id),
      }));
  }

  // Obtener familia por ID
  async obtenerPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);

    const familia = await FamiliaModel.findOne({
      _id: id,
    })
      .populate('familiaPadreId', 'nombre codigo')
      .lean();

    if (!familia) {
      throw new Error('Familia no encontrada');
    }

    // Obtener subfamilias
    const subfamilias = await FamiliaModel.find({
      familiaPadreId: id,
      activo: true,
    })
      .sort({ orden: 1, nombre: 1 })
      .lean();

    // Obtener productos de esta familia
    const totalProductos = await ProductoModel.countDocuments({
      familiaId: id,
      activo: true,
    });

    return {
      ...familia,
      subfamilias,
      totalProductos,
    };
  }

  // Actualizar familia
  async actualizar(
    id: string,
    data: UpdateFamiliaDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);

    const familia = await FamiliaModel.findOne({ _id: id });

    if (!familia) {
      throw new Error('Familia no encontrada');
    }

    // Verificar código único si se está cambiando
    if (data.codigo && data.codigo !== familia.codigo) {
      const existeCodigo = await FamiliaModel.findOne({
        codigo: data.codigo,
        _id: { $ne: id },
      });

      if (existeCodigo) {
        throw new Error('Ya existe una familia con ese código');
      }
    }

    // Verificar que no se establezca a sí misma como padre
    if (data.familiaPadreId && data.familiaPadreId === id) {
      throw new Error('Una familia no puede ser su propio padre');
    }

    // Verificar que el nuevo padre no sea una subfamilia de esta familia
    if (data.familiaPadreId) {
      const nuevoPadre = await FamiliaModel.findOne({
        _id: data.familiaPadreId,
      });

      if (nuevoPadre) {
        // Verificar que no cree una referencia circular
        if (nuevoPadre.ruta.includes(familia._id.toString())) {
          throw new Error('No se puede crear una referencia circular');
        }
      }
    }

    Object.assign(familia, data);
    await familia.save();

    return familia;
  }

  // Eliminar familia (soft delete)
  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);

    const familia = await FamiliaModel.findOne({ _id: id });

    if (!familia) {
      throw new Error('Familia no encontrada');
    }

    // Verificar que no tenga subfamilias activas
    const subfamiliasActivas = await FamiliaModel.countDocuments({
      familiaPadreId: id,
      activo: true,
    });

    if (subfamiliasActivas > 0) {
      throw new Error('No se puede eliminar una familia con subfamilias activas');
    }

    // Verificar que no tenga productos activos
    const productosActivos = await ProductoModel.countDocuments({
      familiaId: id,
      activo: true,
    });

    if (productosActivos > 0) {
      throw new Error('No se puede eliminar una familia con productos activos');
    }

    // Marcar como inactiva
    familia.activo = false;
    await familia.save();

    return { message: 'Familia eliminada correctamente' };
  }

  // Reordenar familias
  async reordenar(
    items: Array<{ id: string; orden: number }>,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { orden: item.orden } },
      },
    }));

    await FamiliaModel.bulkWrite(bulkOps);

    return { message: 'Orden actualizado correctamente' };
  }

  // Obtener estadísticas de una familia
  async obtenerEstadisticas(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);

    const familia = await FamiliaModel.findOne({ _id: id });

    if (!familia) {
      throw new Error('Familia no encontrada');
    }

    // Obtener IDs de todas las subfamilias (recursivamente)
    const subfamiliasIds = await this.obtenerSubfamiliasRecursivo(id, empresaId, dbConfig);
    const todasLasFamiliasIds = [id, ...subfamiliasIds];

    // Estadísticas de productos
    const [
      totalProductos,
      productosActivos,
      productosInactivos,
      valorInventario,
    ] = await Promise.all([
      ProductoModel.countDocuments({
        familiaId: { $in: todasLasFamiliasIds },
      }),
      ProductoModel.countDocuments({
        familiaId: { $in: todasLasFamiliasIds },
        activo: true,
      }),
      ProductoModel.countDocuments({
        familiaId: { $in: todasLasFamiliasIds },
        activo: false,
      }),
      ProductoModel.aggregate([
        {
          $match: {
            familiaId: { $in: todasLasFamiliasIds.map(id => new mongoose.Types.ObjectId(id as string)) },
            activo: true,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: ['$stock.cantidad', '$precios.compra'],
              },
            },
          },
        },
      ]),
    ]);

    return {
      totalProductos,
      productosActivos,
      productosInactivos,
      valorInventario: valorInventario[0]?.total || 0,
      totalSubfamilias: subfamiliasIds.length,
    };
  }

  // Obtener todas las subfamilias recursivamente
  private async obtenerSubfamiliasRecursivo(
    familiaId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<string[]> {
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);

    const subfamilias = await FamiliaModel.find({
      familiaPadreId: familiaId,
    }).select('_id');

    let ids: string[] = subfamilias.map((f) => f._id.toString());

    for (const subfamilia of subfamilias) {
      const subIds = await this.obtenerSubfamiliasRecursivo(
        subfamilia._id.toString(),
        empresaId,
        dbConfig
      );
      ids = [...ids, ...subIds];
    }

    return ids;
  }

  // ============================================
  // SUGERIR SIGUIENTE CÓDIGO
  // ============================================

  async sugerirSiguienteCodigo(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    prefijo?: string
  ): Promise<string> {
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);

    // Si no se proporciona prefijo, buscar el patrón más común
    if (!prefijo || prefijo.trim() === '') {
      // Buscar todos los códigos y extraer el prefijo más común
      const familias = await FamiliaModel.find({})
        .select('codigo')
        .sort({ codigo: -1 })
        .limit(10)
        .lean();

      if (familias.length === 0) {
        return 'FAM-001';
      }

      // Intentar detectar el patrón más común (ej: FAM-, F-, etc.)
      const patrones = familias
        .map(f => {
          const match = f.codigo?.match(/^([A-Za-z]+-)/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      if (patrones.length > 0) {
        // Usar el patrón más frecuente
        const patronMasComun = patrones.sort(
          (a, b) =>
            patrones.filter(v => v === a).length - patrones.filter(v => v === b).length
        )[patrones.length - 1];

        prefijo = patronMasComun!;
      } else {
        prefijo = 'FAM-';
      }
    }

    // Buscar el último código con ese prefijo
    const regex = new RegExp(`^${prefijo}(\\d+)$`, 'i');
    const familias = await FamiliaModel.find({
      codigo: regex,
    })
      .select('codigo')
      .sort({ codigo: -1 })
      .lean();

    if (familias.length === 0) {
      // Primer código con este prefijo
      return `${prefijo}001`;
    }

    // Extraer todos los números y encontrar el máximo
    const numeros = familias
      .map(f => {
        const match = f.codigo?.match(regex);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));

    const maxNumero = Math.max(...numeros);
    const siguienteNumero = maxNumero + 1;

    // Formatear con ceros a la izquierda (mínimo 3 dígitos)
    const digitosMinimos = 3;
    const numeroStr = siguienteNumero.toString().padStart(digitosMinimos, '0');

    return `${prefijo}${numeroStr}`;
  }
}

export const familiasService = new FamiliasService();