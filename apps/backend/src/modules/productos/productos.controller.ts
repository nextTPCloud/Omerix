  import { Request, Response } from 'express';
  import { ProductosService } from './productos.service';
  import {
    CreateProductoSchema,
    UpdateProductoSchema,
    SearchProductosSchema,
    UpdateStockSchema,
    CreateProductoDTO,
    UpdateProductoDTO,
    SearchProductosDTO,
    UpdateStockDTO,
  } from './productos.dto';

  const productosService = new ProductosService();

  // ============================================
  // HELPER DE VALIDACIÓN
  // ============================================

  interface ValidationSuccess<T> {
    success: true;
    data: T;
  }

  interface ValidationError {
    success: false;
    errors: Array<{ field: string; message: string }>;
  }

  type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

  const validateRequest = <T>(schema: any, data: any): ValidationResult<T> => {
    try {
      const validatedData = schema.parse(data) as T;
      return { success: true, data: validatedData };
    } catch (error: any) {
      return {
        success: false,
        errors: error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })) || [{ field: 'unknown', message: error.message }],
      };
    }
  };

  // ============================================
  // CREAR PRODUCTO
  // ============================================

  export const createProducto = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;

      // Validar
      const validation = validateRequest<CreateProductoDTO>(CreateProductoSchema, req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validation.errors,
        });
      }

      // Crear
      const producto = await productosService.createProducto(empresaId, validation.data);

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: producto,
      });
    } catch (error: any) {
      console.error('Error creando producto:', error);

      const statusCode = error.message.includes('límite') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error creando producto',
      });
    }
  };

  // ============================================
  // OBTENER PRODUCTO POR ID
  // ============================================

  export const getProducto = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      const producto = await productosService.getProductoById(empresaId, id);

      res.json({
        success: true,
        data: producto,
      });
    } catch (error: any) {
      console.error('Error obteniendo producto:', error);

      const statusCode = error.message === 'Producto no encontrado' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error obteniendo producto',
      });
    }
  };

  // ============================================
  // OBTENER PRODUCTO POR SKU
  // ============================================

  export const getProductoBySku = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;
      const { sku } = req.params;

      const producto = await productosService.getProductoBySku(empresaId, sku);

      res.json({
        success: true,
        data: producto,
      });
    } catch (error: any) {
      console.error('Error obteniendo producto por SKU:', error);

      const statusCode = error.message === 'Producto no encontrado' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error obteniendo producto',
      });
    }
  };

  // ============================================
  // OBTENER PRODUCTO POR CÓDIGO DE BARRAS
  // ============================================

  export const getProductoByCodigoBarras = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;
      const { codigo } = req.params;

      const producto = await productosService.getProductoByCodigoBarras(empresaId, codigo);

      res.json({
        success: true,
        data: producto,
      });
    } catch (error: any) {
      console.error('Error obteniendo producto por código de barras:', error);

      const statusCode = error.message === 'Producto no encontrado' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error obteniendo producto',
      });
    }
  };

  // ============================================
  // LISTAR/BUSCAR PRODUCTOS
  // ============================================

  export const searchProductos = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;

      // Validar query params
      const validation = validateRequest<SearchProductosDTO>(
        SearchProductosSchema,
        req.query
      );

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de búsqueda inválidos',
          errors: validation.errors,
        });
      }

      const result = await productosService.searchProductos(empresaId, validation.data);

      res.json({
        success: true,
        data: result.productos,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error buscando productos:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Error buscando productos',
      });
    }
  };

  // ============================================
  // ACTUALIZAR PRODUCTO
  // ============================================

  export const updateProducto = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      // Validar
      const validation = validateRequest<UpdateProductoDTO>(UpdateProductoSchema, req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validation.errors,
        });
      }

      const producto = await productosService.updateProducto(
        empresaId,
        id,
        validation.data
      );

      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: producto,
      });
    } catch (error: any) {
      console.error('Error actualizando producto:', error);

      const statusCode = error.message === 'Producto no encontrado' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error actualizando producto',
      });
    }
  };

  // ============================================
  // ELIMINAR PRODUCTO (SOFT DELETE)
  // ============================================

  export const deleteProducto = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      const result = await productosService.deleteProducto(empresaId, id);

      res.json(result);
    } catch (error: any) {
      console.error('Error eliminando producto:', error);

      const statusCode = error.message === 'Producto no encontrado' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error eliminando producto',
      });
    }
  };

  // ============================================
  // ELIMINAR PERMANENTEMENTE
  // ============================================

  export const deleteProductoPermanente = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      const result = await productosService.deleteProductoPermanente(empresaId, id);

      res.json(result);
    } catch (error: any) {
      console.error('Error eliminando producto permanentemente:', error);

      const statusCode = error.message === 'Producto no encontrado' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error eliminando producto',
      });
    }
  };

  // ============================================
  // ACTUALIZAR STOCK
  // ============================================

  export const updateStock = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      // Validar
      const validation = validateRequest<UpdateStockDTO>(UpdateStockSchema, req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validation.errors,
        });
      }

      const producto = await productosService.updateStock(
        empresaId,
        id,
        validation.data
      );

      res.json({
        success: true,
        message: 'Stock actualizado exitosamente',
        data: producto,
      });
    } catch (error: any) {
      console.error('Error actualizando stock:', error);

      const statusCode = error.message === 'Producto no encontrado' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error actualizando stock',
      });
    }
  };

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  export const getEstadisticas = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;

      const estadisticas = await productosService.getEstadisticas(empresaId);

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      console.error('Error obteniendo estadísticas:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo estadísticas',
      });
    }
  };

  // ============================================
  // OBTENER CATEGORÍAS
  // ============================================

  export const getCategorias = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;

      const categorias = await productosService.getCategorias(empresaId);

      res.json({
        success: true,
        data: categorias,
      });
    } catch (error: any) {
      console.error('Error obteniendo categorías:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo categorías',
      });
    }
  };

  // ============================================
  // OBTENER SUBCATEGORÍAS
  // ============================================

  export const getSubcategorias = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;
      const { categoria } = req.query;

      const subcategorias = await productosService.getSubcategorias(
        empresaId,
        categoria as string
      );

      res.json({
        success: true,
        data: subcategorias,
      });
    } catch (error: any) {
      console.error('Error obteniendo subcategorías:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo subcategorías',
      });
    }
  };

  // ============================================
  // OBTENER MARCAS
  // ============================================

  export const getMarcas = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;

      const marcas = await productosService.getMarcas(empresaId);

      res.json({
        success: true,
        data: marcas,
      });
    } catch (error: any) {
      console.error('Error obteniendo marcas:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo marcas',
      });
    }
  };

  // ============================================
  // OBTENER TAGS
  // ============================================

  export const getTags = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;

      const tags = await productosService.getTags(empresaId);

      res.json({
        success: true,
        data: tags,
      });
    } catch (error: any) {
      console.error('Error obteniendo tags:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo tags',
      });
    }
  };

  // ============================================
  // PRODUCTOS CON STOCK BAJO
  // ============================================

  export const getProductosStockBajo = async (req: Request, res: Response) => {
    try {
      const empresaId = req.empresaId!;

      const productos = await productosService.getProductosStockBajo(empresaId);

      res.json({
        success: true,
        data: productos,
      });
    } catch (error: any) {
      console.error('Error obteniendo productos con stock bajo:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo productos con stock bajo',
      });
    }
  };