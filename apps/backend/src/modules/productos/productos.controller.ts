import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { productosService } from './productos.service';
import storageService from '@/services/storage.service';
import {
  CreateProductoSchema,
  UpdateProductoSchema,
  SearchProductosSchema,
  UpdateStockSchema,
  GenerarVariantesSchema,
} from './productos.dto';

export class ProductosController {
  // Crear producto
  async crear(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      // Validar datos
      const validacion = CreateProductoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const producto = await productosService.createProducto(
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: producto,
        message: 'Producto creado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear producto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear producto',
      });
    }
  }

  // Generar variantes
  async generarVariantes(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { id } = req.params;

      // Validar datos
      const validacion = GenerarVariantesSchema.safeParse({
        ...req.body,
        productoId: id,
      });

      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const producto = await productosService.generarVariantes(
        id,
        validacion.data.atributos,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: producto,
        message: 'Variantes generadas correctamente',
      });
    } catch (error: any) {
      console.error('Error al generar variantes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al generar variantes',
      });
    }
  }

  // Obtener todos los productos
  async obtenerTodos(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);

      // Validar filtros
      const validacion = SearchProductosSchema.safeParse(req.query);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Filtros inválidos',
          errors: validacion.error.errors,
        });
      }

      const resultado = await productosService.searchProductos(
        empresaId,
        validacion.data,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: resultado.productos,
        pagination: resultado.pagination,
      });
    } catch (error: any) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener productos',
      });
    }
  }

  // Obtener producto por ID
  async obtenerPorId(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { id } = req.params;

      const producto = await productosService.getProductoById(
        id,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: producto,
      });
    } catch (error: any) {
      console.error('Error al obtener producto:', error);
      res.status(error.message === 'Producto no encontrado' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al obtener producto',
      });
    }
  }

  // Obtener producto por SKU
  async obtenerPorSku(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { sku } = req.params;

      const producto = await productosService.getProductoBySku(
        sku,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: producto,
      });
    } catch (error: any) {
      console.error('Error al obtener producto por SKU:', error);
      res.status(error.message === 'Producto no encontrado' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al obtener producto',
      });
    }
  }

  // Obtener producto por código de barras
  async obtenerPorCodigoBarras(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { codigoBarras } = req.params;

      const producto = await productosService.getProductoByCodigoBarras(
        codigoBarras,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: producto,
      });
    } catch (error: any) {
      console.error('Error al obtener producto por código de barras:', error);
      res.status(error.message === 'Producto no encontrado' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al obtener producto',
      });
    }
  }

  // Actualizar producto
  async actualizar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { id } = req.params;

      // Validar datos
      const validacion = UpdateProductoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const producto = await productosService.updateProducto(
        id,
        validacion.data,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: producto,
        message: 'Producto actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar producto:', error);
      res.status(error.message === 'Producto no encontrado' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al actualizar producto',
      });
    }
  }

  // Eliminar producto
  async eliminar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { id } = req.params;

      const resultado = await productosService.deleteProducto(
        id,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: resultado.message,
      });
    } catch (error: any) {
      console.error('Error al eliminar producto:', error);
      res.status(error.message === 'Producto no encontrado' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al eliminar producto',
      });
    }
  }

  // Actualizar stock
  async actualizarStock(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { id } = req.params;

      // Validar datos
      const validacion = UpdateStockSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const producto = await productosService.updateStock(
        id,
        validacion.data,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: producto,
        message: 'Stock actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar stock:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar stock',
      });
    }
  }

  // Obtener productos con stock bajo
  async obtenerStockBajo(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);

      const productos = await productosService.getProductosStockBajo(
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: productos,
      });
    } catch (error: any) {
      console.error('Error al obtener productos con stock bajo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener productos con stock bajo',
      });
    }
  }

  // Buscar SKUs existentes (para auto-sugerencia)
  async searchSkus(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const prefix = (req.query.prefix as string) || '';

      const skus = await productosService.searchSkus(
        empresaId,
        prefix,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: skus,
      });
    } catch (error: any) {
      console.error('Error al buscar SKUs:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al buscar SKUs',
      });
    }
  }

  // Duplicar producto
  async duplicar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);
      const { id } = req.params;

      const producto = await productosService.duplicarProducto(
        id,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: producto,
        message: 'Producto duplicado correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar producto:', error);
      res.status(error.message === 'Producto no encontrado' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al duplicar producto',
      });
    }
  }
  // ============================================
  // SUBIR IMAGENES
  // ============================================

  async subirImagenes(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuración de base de datos no disponible' });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No se han subido imágenes' });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const urls: string[] = [];

      for (const file of files) {
        const result = await storageService.uploadFile({
          empresaId: req.empresaId!,
          modulo: 'productos',
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          isPublic: true,
          generateThumbnails: true,
          subfolder: 'imagenes',
        });
        urls.push(result.url);
      }

      // Actualizar producto: añadir URLs a imagenes[]
      const producto = await productosService.agregarImagenes(
        req.params.id,
        urls,
        empresaId,
        req.empresaDbConfig
      );

      if (!producto) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }

      res.json({ success: true, data: producto, message: `${urls.length} imágenes subidas exitosamente` });
    } catch (error: any) {
      console.error('Error al subir imágenes:', error);
      res.status(500).json({ success: false, message: error.message || 'Error al subir imágenes' });
    }
  }

  // ============================================
  // SET IMAGEN PRINCIPAL
  // ============================================

  async setImagenPrincipal(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuración de base de datos no disponible' });
      }

      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, message: 'url es requerido' });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const producto = await productosService.setImagenPrincipal(
        req.params.id,
        url,
        empresaId,
        req.empresaDbConfig
      );

      if (!producto) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }

      res.json({ success: true, data: producto, message: 'Imagen principal actualizada' });
    } catch (error: any) {
      console.error('Error al cambiar imagen principal:', error);
      res.status(500).json({ success: false, message: error.message || 'Error al cambiar imagen principal' });
    }
  }

  // ============================================
  // ELIMINAR IMAGEN
  // ============================================

  async eliminarImagen(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuración de base de datos no disponible' });
      }

      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, message: 'url es requerido' });
      }

      // Intentar eliminar de almacenamiento
      try {
        const keyMatch = url.match(new RegExp(`${req.empresaId}/.*`));
        if (keyMatch) {
          await storageService.deleteFile(keyMatch[0]);
        }
      } catch {
        // Continuar
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const producto = await productosService.eliminarImagen(
        req.params.id,
        url,
        empresaId,
        req.empresaDbConfig
      );

      if (!producto) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }

      res.json({ success: true, data: producto, message: 'Imagen eliminada exitosamente' });
    } catch (error: any) {
      console.error('Error al eliminar imagen:', error);
      res.status(500).json({ success: false, message: error.message || 'Error al eliminar imagen' });
    }
  }
}

export const productosController = new ProductosController();