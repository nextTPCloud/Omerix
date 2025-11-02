import  { Producto } from '../../models/Producto';
import Licencia from '../../models/Licencia';
import { CreateProductoDTO, UpdateProductoDTO, SearchProductosDTO, UpdateStockDTO } from './productos.dto';

export class ProductosService {
  
  // ============================================
  // CREAR PRODUCTO
  // ============================================
  
  async createProducto(empresaId: string, data: CreateProductoDTO) {
    // 1. Verificar límite de productos según licencia
    await this.verificarLimiteProductos(empresaId);

    // 2. Verificar que no exista el SKU en esta empresa
    const existente = await Producto.findOne({
      empresaId,
      sku: data.sku.toUpperCase(),
    });

    if (existente) {
      throw new Error('Ya existe un producto con este SKU en tu empresa');
    }

    // 3. Si tiene código de barras, verificar que no exista
    if (data.codigoBarras) {
      const existenteBarras = await Producto.findOne({
        empresaId,
        codigoBarras: data.codigoBarras,
      });

      if (existenteBarras) {
        throw new Error('Ya existe un producto con este código de barras');
      }
    }

    // 4. Crear producto
    const producto = await Producto.create({
      ...data,
      empresaId,
      sku: data.sku.toUpperCase(),
    });

    // 5. Incrementar contador de uso
    await this.incrementarContadorProductos(empresaId);

    console.log('✅ Producto creado:', producto.nombre);

    return producto;
  }

  // ============================================
  // OBTENER PRODUCTO POR ID
  // ============================================
  
  async getProductoById(empresaId: string, productoId: string) {
    const producto = await Producto.findOne({
      _id: productoId,
      empresaId,
    }).populate('proveedorId', 'nombre nif');

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return producto;
  }

  // ============================================
  // OBTENER PRODUCTO POR SKU
  // ============================================
  
  async getProductoBySku(empresaId: string, sku: string) {
    const producto = await Producto.findOne({
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
  
  async getProductoByCodigoBarras(empresaId: string, codigoBarras: string) {
    const producto = await Producto.findOne({
      empresaId,
      codigoBarras,
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return producto;
  }

  // ============================================
  // LISTAR PRODUCTOS CON BÚSQUEDA Y FILTROS
  // ============================================
  
  async searchProductos(empresaId: string, filters: SearchProductosDTO) {
    const {
      q,
      categoria,
      subcategoria,
      marca,
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

    // Búsqueda de texto
    if (q) {
      query.$text = { $search: q };
    }

    // Filtros
    if (categoria) query.categoria = categoria;
    if (subcategoria) query.subcategoria = subcategoria;
    if (marca) query.marca = marca;
    if (activo !== undefined) query.activo = activo;
    if (disponible !== undefined) query.disponible = disponible;
    if (destacado !== undefined) query.destacado = destacado;

    // Tags
    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim());
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
    const [productos, total] = await Promise.all([
      Producto.find(query)
        .populate('proveedorId', 'nombre')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Producto.countDocuments(query),
    ]);

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
    empresaId: string,
    productoId: string,
    data: UpdateProductoDTO
  ) {
    const producto = await Producto.findOne({
      _id: productoId,
      empresaId,
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Si se cambia el SKU, verificar que no exista
    if (data.sku && data.sku.toUpperCase() !== producto.sku) {
      const existente = await Producto.findOne({
        empresaId,
        sku: data.sku.toUpperCase(),
        _id: { $ne: productoId },
      });

      if (existente) {
        throw new Error('Ya existe un producto con este SKU');
      }
    }

    // Si se cambia el código de barras, verificar que no exista
    if (data.codigoBarras && data.codigoBarras !== producto.codigoBarras) {
      const existenteBarras = await Producto.findOne({
        empresaId,
        codigoBarras: data.codigoBarras,
        _id: { $ne: productoId },
      });

      if (existenteBarras) {
        throw new Error('Ya existe un producto con este código de barras');
      }
    }

    // Actualizar
    Object.assign(producto, data);

    if (data.sku) {
      producto.sku = data.sku.toUpperCase();
    }

    await producto.save();

    console.log('✅ Producto actualizado:', producto.nombre);

    return producto;
  }

  // ============================================
  // ELIMINAR PRODUCTO (SOFT DELETE)
  // ============================================
  
  async deleteProducto(empresaId: string, productoId: string) {
    const producto = await Producto.findOne({
      _id: productoId,
      empresaId,
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Soft delete (desactivar)
    producto.activo = false;
    await producto.save();

    // Decrementar contador
    await this.decrementarContadorProductos(empresaId);

    console.log('✅ Producto desactivado:', producto.nombre);

    return { success: true, message: 'Producto desactivado' };
  }

  // ============================================
  // ELIMINAR PERMANENTEMENTE
  // ============================================
  
  async deleteProductoPermanente(empresaId: string, productoId: string) {
    const producto = await Producto.findOneAndDelete({
      _id: productoId,
      empresaId,
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Decrementar contador si estaba activo
    if (producto.activo) {
      await this.decrementarContadorProductos(empresaId);
    }

    console.log('✅ Producto eliminado permanentemente:', producto.nombre);

    return { success: true, message: 'Producto eliminado permanentemente' };
  }

  // ============================================
  // ACTUALIZAR STOCK
  // ============================================
  
  async updateStock(
    empresaId: string,
    productoId: string,
    data: UpdateStockDTO
  ) {
    const producto = await Producto.findOne({
      _id: productoId,
      empresaId,
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    if (!producto.gestionaStock) {
      throw new Error('Este producto no gestiona stock');
    }

    const stockActual = producto.stock.cantidad;

    switch (data.tipo) {
      case 'entrada':
        producto.stock.cantidad += data.cantidad;
        break;
      case 'salida':
        if (stockActual < data.cantidad) {
          throw new Error('Stock insuficiente');
        }
        producto.stock.cantidad -= data.cantidad;
        break;
      case 'ajuste':
        producto.stock.cantidad = data.cantidad;
        break;
    }

    await producto.save();

    console.log(
      `✅ Stock actualizado: ${producto.nombre} - ${stockActual} → ${producto.stock.cantidad}`
    );

    return producto;
  }

  // ============================================
  // ESTADÍSTICAS DE PRODUCTOS
  // ============================================
  
  async getEstadisticas(empresaId: string) {
    const [
      total,
      activos,
      disponibles,
      sinStock,
      stockBajo,
      destacados,
      valorInventario,
    ] = await Promise.all([
      Producto.countDocuments({ empresaId }),
      Producto.countDocuments({ empresaId, activo: true }),
      Producto.countDocuments({ empresaId, disponible: true }),
      Producto.countDocuments({ empresaId, 'stock.cantidad': 0, gestionaStock: true }),
      Producto.countDocuments({
        empresaId,
        $expr: { $lte: ['$stock.cantidad', '$stock.minimo'] },
        gestionaStock: true,
      }),
      Producto.countDocuments({ empresaId, destacado: true }),
      Producto.aggregate([
        { $match: { empresaId: empresaId as any } },
        {
          $group: {
            _id: null,
            valor: {
              $sum: { $multiply: ['$stock.cantidad', '$precios.compra'] },
            },
          },
        },
      ]),
    ]);

    return {
      total,
      activos,
      inactivos: total - activos,
      disponibles,
      sinStock,
      stockBajo,
      destacados,
      valorInventario: valorInventario[0]?.valor || 0,
    };
  }

  // ============================================
  // OBTENER CATEGORÍAS ÚNICAS
  // ============================================
  
  async getCategorias(empresaId: string) {
    const categorias = await Producto.distinct('categoria', {
      empresaId,
      categoria: { $ne: null },
    });
    return categorias;
  }

  // ============================================
  // OBTENER SUBCATEGORÍAS ÚNICAS
  // ============================================
  
  async getSubcategorias(empresaId: string, categoria?: string) {
    const query: any = {
      empresaId,
      subcategoria: { $ne: null },
    };

    if (categoria) {
      query.categoria = categoria;
    }

    const subcategorias = await Producto.distinct('subcategoria', query);
    return subcategorias;
  }

  // ============================================
  // OBTENER MARCAS ÚNICAS
  // ============================================
  
  async getMarcas(empresaId: string) {
    const marcas = await Producto.distinct('marca', {
      empresaId,
      marca: { $ne: null },
    });
    return marcas;
  }

  // ============================================
  // OBTENER TAGS ÚNICOS
  // ============================================
  
  async getTags(empresaId: string) {
    const tags = await Producto.distinct('tags', { empresaId });
    return tags;
  }

  // ============================================
  // PRODUCTOS CON STOCK BAJO
  // ============================================
  
  async getProductosStockBajo(empresaId: string) {
    const productos = await Producto.find({
      empresaId,
      gestionaStock: true,
      $expr: { $lte: ['$stock.cantidad', '$stock.minimo'] },
    })
      .select('nombre sku stock precios')
      .limit(50)
      .lean();

    return productos;
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  private async verificarLimiteProductos(empresaId: string) {
    const licencia = await Licencia.findOne({ empresaId }).populate('planId');

    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const plan = licencia.planId as any;
    const limite = plan.limites.productosCatalogo;

    // -1 = ilimitado
    if (limite === -1) {
      return;
    }

    const productosActuales = licencia.usoActual.productosActuales;

    if (productosActuales >= limite) {
      throw new Error(
        `Has alcanzado el límite de ${limite} productos de tu plan ${plan.nombre}. Actualiza tu plan para crear más productos.`
      );
    }

    // Advertencia al 90%
    const porcentaje = (productosActuales / limite) * 100;
    if (porcentaje >= 90) {
      console.warn(
        `⚠️ Empresa ${empresaId} está al ${porcentaje.toFixed(0)}% del límite de productos`
      );
    }
  }

  private async incrementarContadorProductos(empresaId: string) {
    await Licencia.findOneAndUpdate(
      { empresaId },
      { $inc: { 'usoActual.productosActuales': 1 } }
    );
  }

  private async decrementarContadorProductos(empresaId: string) {
    await Licencia.findOneAndUpdate(
      { empresaId },
      { $inc: { 'usoActual.productosActuales': -1 } }
    );
  }
}