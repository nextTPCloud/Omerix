import mongoose, { Model } from 'mongoose';
import { Producto, IProducto } from './Producto';
import { Familia, IFamilia } from '../familias/Familia';
import Licencia from '../licencias/Licencia';
import Plan from '../licencias/Plan';
import {
  CreateProductoDTO,
  UpdateProductoDTO,
  SearchProductosDTO,
  UpdateStockDTO,
  GenerarVariantesDTO,
  AtributoDTO,
} from './productos.dto';
import { IDatabaseConfig } from '../../types/express';
import {
  getProductoModel,
  getFamiliaModel,
  getEstadoModel,
  getSituacionModel,
  getTiposImpuestoModel
} from '../../utils/dynamic-models.helper';
import { parseAdvancedFilters, mergeFilters } from '@/utils/advanced-filters.helper';
import {
  checkProductoIntegrity,
  ReferentialIntegrityError
} from '@/utils/referential-integrity.helper';

export class ProductosService {
  /**
   * Obtener modelo de Producto para una empresa específica
   * También registra los modelos referenciados para que populate funcione
   */
  private async getModeloProducto(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IProducto>> {
    // Registrar primero los modelos referenciados para que populate funcione
    await Promise.all([
      getFamiliaModel(empresaId, dbConfig),
      getEstadoModel(empresaId, dbConfig),
      getSituacionModel(empresaId, dbConfig),
      getTiposImpuestoModel(empresaId, dbConfig),
    ]);

    return await getProductoModel(empresaId, dbConfig);
  }

  /**
   * Obtener modelo de Familia para una empresa específica
   */
  private async getModeloFamilia(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IFamilia>> {
    return await getFamiliaModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR PRODUCTO
  // ============================================

  async createProducto(
    data: CreateProductoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);

    // 1. Verificar límite de productos según licencia
    await this.verificarLimiteProductos(empresaId.toString(), dbConfig);

    // 2. Verificar que no exista el SKU
    const existente = await ProductoModel.findOne({
      sku: data.sku.toUpperCase(),
    });

    if (existente) {
      throw new Error('Ya existe un producto con este SKU');
    }

    // 3. Si tiene código de barras, verificar que no exista
    if (data.codigoBarras) {
      const existenteBarras = await ProductoModel.findOne({
        codigoBarras: data.codigoBarras,
      });

      if (existenteBarras) {
        throw new Error('Ya existe un producto con este código de barras');
      }
    }

    // 4. Si tiene familia, verificar que exista
    if (data.familiaId) {
      const familia = await FamiliaModel.findOne({
        _id: data.familiaId,
        activo: true,
      });

      if (!familia) {
        throw new Error('La familia seleccionada no existe');
      }
    }

    // 5. Crear producto
    const producto = await ProductoModel.create({
      ...data,
      empresaId,
      sku: data.sku.toUpperCase(),
    });

    // 6. Incrementar contador en estadísticas de familia
    if (producto.familiaId) {
      await FamiliaModel.findByIdAndUpdate(producto.familiaId, {
        $inc: { 'estadisticas.totalProductos': 1 },
      });
    }

    // 7. Incrementar contador de uso en licencia
    await this.incrementarContadorProductos(empresaId.toString());

    console.log('✅ Producto creado:', producto.nombre);

    return producto;
  }

  // ============================================
  // GENERAR VARIANTES AUTOMÁTICAMENTE
  // ============================================

  async generarVariantes(
    productoId: string,
    atributos: AtributoDTO[],
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);

    const producto = await ProductoModel.findOne({
      _id: productoId,
      empresaId,
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Generar todas las combinaciones posibles
    const combinaciones = this.generarCombinaciones(atributos);

    // Crear variantes para cada combinación
    const variantes = combinaciones.map((combinacion, index) => {
      // Generar SKU único para la variante
      const sufijo = Object.values(combinacion)
        .map((v) => v.substring(0, 3).toUpperCase())
        .join('-');
      const varianteSku = `${producto.sku}-${sufijo}`;

      return {
        sku: varianteSku,
        combinacion,
        stock: {
          cantidad: 0,
          minimo: 0,
          maximo: 0,
        },
        precioExtra: 0,
        activo: true,
      };
    });

    // Actualizar producto con atributos y variantes
    producto.tieneVariantes = true;
    producto.atributos = atributos;
    producto.variantes = variantes as any;
    producto.tipo = 'variantes';

    await producto.save();

    console.log(`✅ Generadas ${variantes.length} variantes para ${producto.nombre}`);

    return producto;
  }

  // Generar todas las combinaciones de atributos
  private generarCombinaciones(atributos: AtributoDTO[]): Record<string, string>[] {
    if (atributos.length === 0) return [];

    const resultado: Record<string, string>[] = [];

    const generar = (index: number, actual: Record<string, string>) => {
      if (index === atributos.length) {
        resultado.push({ ...actual });
        return;
      }

      const atributo = atributos[index];
      for (const valor of atributo.valores) {
        if (valor.activo) {
          actual[atributo.nombre.toLowerCase()] = valor.valor;
          generar(index + 1, actual);
        }
      }
    };

    generar(0, {});
    return resultado;
  }

  // ============================================
  // OBTENER PRODUCTO POR ID
  // ============================================

  async getProductoById(
    productoId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);

    const producto = await ProductoModel.findOne({
      _id: productoId,
      empresaId,
    })
      .populate('familiaId', 'nombre codigo')
      .populate('proveedorId', 'nombre nif')
      .populate('componentesKit.productoId', 'nombre sku descripcionCorta codigoBarras');

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return producto;
  }

  // ============================================
  // OBTENER PRODUCTO POR SKU
  // ============================================

  async getProductoBySku(
    sku: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);

    const producto = await ProductoModel.findOne({
      empresaId,
      sku: sku.toUpperCase(),
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return producto;
  }

  // ============================================
  // OBTENER PRODUCTO POR CÓDIGO DE BARRAS
  // ============================================

  async getProductoByCodigoBarras(
    codigoBarras: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);

    // Buscar en productos principales
    let producto = await ProductoModel.findOne({
      empresaId,
      codigoBarras,
    });

    // Si no se encuentra, buscar en variantes
    if (!producto) {
      producto = await ProductoModel.findOne({
        empresaId,
        'variantes.codigoBarras': codigoBarras,
      });
    }

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return producto;
  }

  // ============================================
  // LISTAR PRODUCTOS CON BÚSQUEDA Y FILTROS
  // ============================================

  async searchProductos(
    empresaId: mongoose.Types.ObjectId,
    filters: SearchProductosDTO,
    dbConfig: IDatabaseConfig
  ) {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);

    const {
      q,
      search,
      familiaId,
      marca,
      tipo,
      tags,
      activo,
      disponible,
      destacado,
      sinStock,
      stockBajo,
      precioMin,
      precioMax,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    // Construir query
    const query: any = { empresaId };

    // Búsqueda de texto (usar 'search' o 'q')
    const searchTerm = search || q;
    if (searchTerm) {
      // Dividir el término de búsqueda en palabras para búsqueda AND
      const palabras = searchTerm.trim().split(/\s+/).filter((p: string) => p.length > 0);

      if (palabras.length > 1) {
        // Búsqueda con múltiples palabras: todas deben coincidir (AND)
        query.$and = palabras.map((palabra: string) => ({
          $or: [
            { nombre: { $regex: palabra, $options: 'i' } },
            { sku: { $regex: palabra, $options: 'i' } },
            { codigoBarras: { $regex: palabra, $options: 'i' } },
            { marca: { $regex: palabra, $options: 'i' } },
            { descripcion: { $regex: palabra, $options: 'i' } },
          ],
        }));
      } else {
        // Búsqueda con una sola palabra
        query.$or = [
          { nombre: { $regex: searchTerm, $options: 'i' } },
          { sku: { $regex: searchTerm, $options: 'i' } },
          { codigoBarras: { $regex: searchTerm, $options: 'i' } },
          { marca: { $regex: searchTerm, $options: 'i' } },
          { descripcion: { $regex: searchTerm, $options: 'i' } },
        ];
      }
    }

    // Filtros
    if (familiaId) query.familiaId = familiaId;
    if (marca) query.marca = marca;
    if (tipo) query.tipo = tipo;
    if (activo !== undefined) query.activo = activo;
    if (disponible !== undefined) query.disponible = disponible;
    if (destacado !== undefined) query.destacado = destacado;

    // Tags
    if (tags) {
      const tagsArray = tags.split(',').map((t) => t.trim());
      query.tags = { $in: tagsArray };
    }

    // Filtros de precio
    if (precioMin !== undefined || precioMax !== undefined) {
      query['precios.venta'] = {};
      if (precioMin !== undefined) query['precios.venta'].$gte = precioMin;
      if (precioMax !== undefined) query['precios.venta'].$lte = precioMax;
    }

    // Filtros de stock
    if (sinStock) {
      query['stock.cantidad'] = 0;
    }
    if (stockBajo) {
      query.$expr = { $lte: ['$stock.cantidad', '$stock.minimo'] };
    }

    // Paginación
    const skip = (page - 1) * limit;

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar query
    const [productosRaw, total] = await Promise.all([
      ProductoModel.find(query)
        .populate('familiaId', 'nombre codigo')
        .populate('proveedorId', 'nombre')
        .populate('componentesKit.productoId', 'nombre sku descripcionCorta')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductoModel.countDocuments(query),
    ]);

    // Transformar productos para calcular stock total desde stockPorAlmacen
    const productos = productosRaw.map((producto: any) => {
      // Calcular stock total desde stockPorAlmacen (sistema multi-almacén)
      let stockCantidad = producto.stock?.cantidad || 0;
      let stockMinimo = producto.stock?.minimo || 0;
      let stockMaximo = producto.stock?.maximo || 0;

      if (producto.stockPorAlmacen && producto.stockPorAlmacen.length > 0) {
        stockCantidad = producto.stockPorAlmacen.reduce(
          (sum: number, almacen: any) => sum + (almacen.cantidad || 0),
          0
        );
        // Tomar el mínimo/máximo del primer almacén o sumarlos
        stockMinimo = producto.stockPorAlmacen.reduce(
          (sum: number, almacen: any) => sum + (almacen.minimo || 0),
          0
        );
        stockMaximo = producto.stockPorAlmacen.reduce(
          (sum: number, almacen: any) => sum + (almacen.maximo || 0),
          0
        );
      }

      // Para productos con variantes, calcular stock de todas las variantes
      if (producto.variantes && producto.variantes.length > 0) {
        let stockVariantes = 0;
        for (const variante of producto.variantes) {
          if (variante.stockPorAlmacen && variante.stockPorAlmacen.length > 0) {
            stockVariantes += variante.stockPorAlmacen.reduce(
              (sum: number, almacen: any) => sum + (almacen.cantidad || 0),
              0
            );
          }
        }
        // Si el producto tiene variantes, usar el stock de las variantes
        if (stockVariantes > 0 || producto.variantes.length > 0) {
          stockCantidad = stockVariantes;
        }
      }

      return {
        ...producto,
        stock: {
          ...producto.stock,
          cantidad: stockCantidad,
          minimo: stockMinimo,
          maximo: stockMaximo,
        },
      };
    });

    return {
      productos,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // ACTUALIZAR PRODUCTO
  // ============================================

  async updateProducto(
    productoId: string,
    data: UpdateProductoDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);

    const producto = await ProductoModel.findOne({
      _id: productoId,
      empresaId,
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Verificar SKU único si se está cambiando
    if (data.sku && data.sku !== producto.sku) {
      const existente = await ProductoModel.findOne({
        empresaId,
        sku: data.sku.toUpperCase(),
        _id: { $ne: productoId },
      });

      if (existente) {
        throw new Error('Ya existe un producto con este SKU');
      }
    }

    // Verificar código de barras único si se está cambiando
    if (data.codigoBarras && data.codigoBarras !== producto.codigoBarras) {
      const existenteBarras = await ProductoModel.findOne({
        empresaId,
        codigoBarras: data.codigoBarras,
        _id: { $ne: productoId },
      });

      if (existenteBarras) {
        throw new Error('Ya existe un producto con este código de barras');
      }
    }

    // Si cambia de familia, actualizar contadores
    if (data.familiaId && data.familiaId !== producto.familiaId?.toString()) {
      // Decrementar contador de familia anterior
      if (producto.familiaId) {
        await FamiliaModel.findByIdAndUpdate(producto.familiaId, {
          $inc: { 'estadisticas.totalProductos': -1 },
        });
      }

      // Incrementar contador de nueva familia
      await FamiliaModel.findByIdAndUpdate(data.familiaId, {
        $inc: { 'estadisticas.totalProductos': 1 },
      });
    }

    // Actualizar producto
    Object.assign(producto, data);
    await producto.save();

    console.log('✅ Producto actualizado:', producto.nombre);

    return producto;
  }

  // ============================================
  // ELIMINAR PRODUCTO (SOFT DELETE)
  // ============================================

  async deleteProducto(
    productoId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    force: boolean = false
  ) {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);

    const producto = await ProductoModel.findOne({
      _id: productoId,
      empresaId,
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Verificar integridad referencial (solo si no es forzado)
    if (!force) {
      const integrityCheck = await checkProductoIntegrity(
        productoId,
        String(empresaId),
        dbConfig
      );

      if (!integrityCheck.canDelete) {
        throw new ReferentialIntegrityError(
          'el producto',
          productoId,
          integrityCheck.relatedRecords
        );
      }
    }

    // Marcar como inactivo
    producto.activo = false;
    await producto.save();

    // Decrementar contador en familia
    if (producto.familiaId) {
      await FamiliaModel.findByIdAndUpdate(producto.familiaId, {
        $inc: { 'estadisticas.totalProductos': -1 },
      });
    }

    console.log('✅ Producto eliminado (soft delete):', producto.nombre);

    return { message: 'Producto eliminado correctamente' };
  }

  // ============================================
  // ACTUALIZAR STOCK
  // ============================================

  async updateStock(
    productoId: string,
    data: UpdateStockDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);

    const producto = await ProductoModel.findOne({
      _id: productoId,
      empresaId,
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Si tiene variantes y se especifica varianteId
    if (producto.tieneVariantes && data.varianteId) {
      const variante = producto.variantes.find(
        (v: any) => v._id.toString() === data.varianteId
      );

      if (!variante) {
        throw new Error('Variante no encontrada');
      }

      // Actualizar stock de variante según tipo
      if (data.tipo === 'entrada') {
        variante.stock!.cantidad += data.cantidad;
      } else if (data.tipo === 'salida') {
        if (variante.stock!.cantidad < data.cantidad) {
          throw new Error('Stock insuficiente');
        }
        variante.stock!.cantidad -= data.cantidad;
      } else if (data.tipo === 'ajuste') {
        variante.stock!.cantidad = data.cantidad;
      }
    } else {
      // Actualizar stock del producto principal
      if (data.tipo === 'entrada') {
        producto.stock.cantidad += data.cantidad;
      } else if (data.tipo === 'salida') {
        if (producto.stock.cantidad < data.cantidad) {
          throw new Error('Stock insuficiente');
        }
        producto.stock.cantidad -= data.cantidad;
      } else if (data.tipo === 'ajuste') {
        producto.stock.cantidad = data.cantidad;
      }
    }

    await producto.save();

    console.log('✅ Stock actualizado:', producto.nombre);

    return producto;
  }

  // ============================================
  // OBTENER PRODUCTOS CON STOCK BAJO
  // ============================================

  async getProductosStockBajo(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);

    const productos = await ProductoModel.find({
      empresaId,
      activo: true,
      gestionaStock: true,
      $expr: { $lte: ['$stock.cantidad', '$stock.minimo'] },
    })
      .populate('familiaId', 'nombre codigo')
      .sort({ 'stock.cantidad': 1 })
      .lean();

    return productos;
  }

  // ============================================
  // VERIFICACIONES Y HELPERS
  // ============================================

  private async verificarLimiteProductos(empresaId: string, dbConfig: IDatabaseConfig) {
    const licencia = await Licencia.findOne({ empresaId }).populate('planId');

    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    // Obtener el plan asociado a la licencia
    const plan = await Plan.findById(licencia.planId);

    if (!plan) {
      throw new Error('Plan no encontrado');
    }

    const ProductoModel = await this.getModeloProducto(empresaId, dbConfig);
    const totalProductos = await ProductoModel.countDocuments({
      activo: true,
    });

    // Si el límite es -1, significa ilimitado
    if (plan.limites.productosCatalogo === -1) {
      return;
    }

    if (totalProductos >= plan.limites.productosCatalogo) {
      throw new Error(
        `Has alcanzado el límite de productos (${plan.limites.productosCatalogo}). Actualiza tu plan para crear más productos.`
      );
    }
  }

  private async incrementarContadorProductos(empresaId: string) {
    await Licencia.findOneAndUpdate(
      { empresaId },
      { $inc: { 'usoActual.productosActuales': 1 } }
    );
  }

  // ============================================
  // BUSCAR SKUs EXISTENTES (PARA AUTO-SUGERENCIA)
  // ============================================

  async searchSkus(
    empresaId: mongoose.Types.ObjectId,
    prefix: string,
    dbConfig: IDatabaseConfig
  ): Promise<string[]> {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);

    const productos = await ProductoModel.find(
      {
        empresaId,
        sku: { $regex: `^${prefix}`, $options: 'i' }
      },
      { sku: 1 }
    ).lean();

    return productos.map(p => p.sku);
  }

  // ============================================
  // DUPLICAR PRODUCTO
  // ============================================

  async duplicarProducto(
    productoId: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);
    const FamiliaModel = await this.getModeloFamilia(String(empresaId), dbConfig);

    // 1. Verificar límite de productos según licencia
    await this.verificarLimiteProductos(empresaId.toString(), dbConfig);

    // 2. Obtener el producto original
    const productoOriginal = await ProductoModel.findOne({
      _id: productoId,
      empresaId,
    }).lean();

    if (!productoOriginal) {
      throw new Error('Producto no encontrado');
    }

    // 3. Generar nuevo SKU único
    let nuevoSku = `${productoOriginal.sku}-COPIA`;
    let contador = 1;
    let skuExiste = true;

    while (skuExiste) {
      const existente = await ProductoModel.findOne({
        empresaId,
        sku: nuevoSku,
      });

      if (!existente) {
        skuExiste = false;
      } else {
        nuevoSku = `${productoOriginal.sku}-COPIA-${contador}`;
        contador++;
      }
    }

    // 4. Crear copia del producto
    const datosProducto: any = {
      ...productoOriginal,
      _id: undefined,
      sku: nuevoSku,
      nombre: `${productoOriginal.nombre} (Copia)`,
      codigoBarras: undefined, // No duplicar código de barras
      createdAt: undefined,
      updatedAt: undefined,
      // Resetear stock si tiene variantes
      variantes: productoOriginal.variantes?.map((v: any) => ({
        ...v,
        _id: undefined,
        sku: `${v.sku}-COPIA`,
        codigoBarras: undefined,
        stockPorAlmacen: v.stockPorAlmacen?.map((s: any) => ({
          ...s,
          cantidad: 0,
          ultimaActualizacion: new Date(),
        })) || [],
      })) || [],
      // Resetear stock principal
      stock: {
        ...productoOriginal.stock,
        cantidad: 0,
      },
    };

    const nuevoProducto = await ProductoModel.create(datosProducto);

    // 5. Incrementar contador en estadísticas de familia
    if (nuevoProducto.familiaId) {
      await FamiliaModel.findByIdAndUpdate(nuevoProducto.familiaId, {
        $inc: { 'estadisticas.totalProductos': 1 },
      });
    }

    // 6. Incrementar contador de uso en licencia
    await this.incrementarContadorProductos(empresaId.toString());

    console.log('✅ Producto duplicado:', nuevoProducto.nombre);

    return nuevoProducto;
  }

  // ============================================
  // IMAGENES
  // ============================================

  async agregarImagenes(
    id: string,
    urls: string[],
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProducto | null> {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);
    const producto = await ProductoModel.findById(id);
    if (!producto) return null;

    // Añadir URLs al array de imagenes
    const imagenesActuales = producto.imagenes || [];
    producto.imagenes = [...imagenesActuales, ...urls];

    // Si no tiene imagen principal, usar la primera
    if (!producto.imagenPrincipal && producto.imagenes.length > 0) {
      producto.imagenPrincipal = producto.imagenes[0];
    }

    await producto.save();
    return producto;
  }

  async setImagenPrincipal(
    id: string,
    url: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProducto | null> {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);
    return ProductoModel.findOneAndUpdate(
      { _id: id },
      { imagenPrincipal: url },
      { new: true }
    );
  }

  async eliminarImagen(
    id: string,
    url: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IProducto | null> {
    const ProductoModel = await this.getModeloProducto(String(empresaId), dbConfig);
    const producto = await ProductoModel.findById(id);
    if (!producto) return null;

    producto.imagenes = (producto.imagenes || []).filter((img: string) => img !== url);

    // Si la imagen eliminada era la principal, usar la primera disponible
    if (producto.imagenPrincipal === url) {
      producto.imagenPrincipal = producto.imagenes.length > 0 ? producto.imagenes[0] : undefined;
    }

    await producto.save();
    return producto;
  }
}

export const productosService = new ProductosService();