import { Request, Response } from 'express';
import { pedidosCompraService } from './pedidos-compra.service';
import {
  CreatePedidoCompraSchema,
  UpdatePedidoCompraSchema,
  GetPedidosCompraQuerySchema,
} from './pedidos-compra.dto';
import { EstadoPedidoCompra } from './PedidoCompra';
import { AuthRequest } from '@/middleware/auth.middleware';

// ============================================
// CONTROLADOR DE PEDIDOS DE COMPRA
// ============================================

class PedidosCompraController {
  // ============================================
  // CREAR PEDIDO DE COMPRA
  // ============================================

  async create(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      // Extraer opción de actualizar precios
      const { actualizarPrecios, ...bodyData } = req.body;

      // Validar datos
      const validatedData = CreatePedidoCompraSchema.parse(bodyData);

      const pedidoCompra = await pedidosCompraService.crear(
        validatedData,
        req.user!.empresaId,
        req.user!.userId,
        dbConfig
      );

      // Si se solicitó actualizar precios, hacerlo después de crear
      let preciosActualizados = 0;
      if (actualizarPrecios && (actualizarPrecios.precioCompra || actualizarPrecios.precioVenta)) {
        const resultado = await pedidosCompraService.actualizarPreciosProductos(
          req.user!.empresaId,
          dbConfig,
          pedidoCompra.lineas || [],
          actualizarPrecios
        );
        preciosActualizados = resultado.actualizados;
      }

      return res.status(201).json({
        success: true,
        data: pedidoCompra,
        message: preciosActualizados > 0
          ? `Pedido de compra creado correctamente. ${preciosActualizados} producto(s) actualizados.`
          : 'Pedido de compra creado correctamente',
        preciosActualizados,
      });
    } catch (error: any) {
      console.error('Error al crear pedido de compra:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Datos invalidos',
          errors: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Error al crear el pedido de compra',
      });
    }
  }

  // ============================================
  // OBTENER TODOS CON FILTROS
  // ============================================

  async findAll(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      // Validar query params
      const validatedQuery = GetPedidosCompraQuerySchema.parse(req.query);

      const result = await pedidosCompraService.findAll(
        req.user!.empresaId,
        dbConfig,
        validatedQuery
      );

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error al obtener pedidos de compra:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los pedidos de compra',
      });
    }
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async findById(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const { id } = req.params;

      const pedidoCompra = await pedidosCompraService.findById(
        id,
        req.user!.empresaId,
        dbConfig
      );

      if (!pedidoCompra) {
        return res.status(404).json({
          success: false,
          message: 'Pedido de compra no encontrado',
        });
      }

      return res.json({
        success: true,
        data: pedidoCompra,
      });
    } catch (error: any) {
      console.error('Error al obtener pedido de compra:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el pedido de compra',
      });
    }
  }

  // ============================================
  // OBTENER POR CODIGO
  // ============================================

  async findByCodigo(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const { codigo } = req.params;

      const pedidoCompra = await pedidosCompraService.findByCodigo(
        codigo,
        req.user!.empresaId,
        dbConfig
      );

      if (!pedidoCompra) {
        return res.status(404).json({
          success: false,
          message: 'Pedido de compra no encontrado',
        });
      }

      return res.json({
        success: true,
        data: pedidoCompra,
      });
    } catch (error: any) {
      console.error('Error al obtener pedido de compra por codigo:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el pedido de compra',
      });
    }
  }

  // ============================================
  // ACTUALIZAR PEDIDO DE COMPRA
  // ============================================

  async update(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const { id } = req.params;

      // Extraer opción de actualizar precios
      const { actualizarPrecios, ...bodyData } = req.body;

      // Validar datos
      const validatedData = UpdatePedidoCompraSchema.parse(bodyData);

      const pedidoCompra = await pedidosCompraService.update(
        id,
        validatedData,
        req.user!.empresaId,
        req.user!.userId,
        dbConfig
      );

      if (!pedidoCompra) {
        return res.status(404).json({
          success: false,
          message: 'Pedido de compra no encontrado',
        });
      }

      // Si se solicitó actualizar precios, hacerlo después de actualizar
      let preciosActualizados = 0;
      if (actualizarPrecios && (actualizarPrecios.precioCompra || actualizarPrecios.precioVenta)) {
        const resultado = await pedidosCompraService.actualizarPreciosProductos(
          req.user!.empresaId,
          dbConfig,
          pedidoCompra.lineas || [],
          actualizarPrecios
        );
        preciosActualizados = resultado.actualizados;
      }

      return res.json({
        success: true,
        data: pedidoCompra,
        message: preciosActualizados > 0
          ? `Pedido de compra actualizado correctamente. ${preciosActualizados} producto(s) actualizados.`
          : 'Pedido de compra actualizado correctamente',
        preciosActualizados,
      });
    } catch (error: any) {
      console.error('Error al actualizar pedido de compra:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Datos invalidos',
          errors: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el pedido de compra',
      });
    }
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const { estado } = req.body;

      if (!estado || !Object.values(EstadoPedidoCompra).includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado invalido',
        });
      }

      const pedidoCompra = await pedidosCompraService.cambiarEstado(
        id,
        estado,
        req.user!.empresaId,
        req.user!.userId,
        dbConfig
      );

      if (!pedidoCompra) {
        return res.status(404).json({
          success: false,
          message: 'Pedido de compra no encontrado',
        });
      }

      return res.json({
        success: true,
        data: pedidoCompra,
        message: `Estado cambiado a "${estado}"`,
      });
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar el estado',
      });
    }
  }

  // ============================================
  // ELIMINAR PEDIDO DE COMPRA
  // ============================================

  async delete(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const { id } = req.params;

      const deleted = await pedidosCompraService.delete(
        id,
        req.user!.empresaId,
        dbConfig
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Pedido de compra no encontrado',
        });
      }

      return res.json({
        success: true,
        message: 'Pedido de compra eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar pedido de compra:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el pedido de compra',
      });
    }
  }

  // ============================================
  // ELIMINAR MULTIPLES
  // ============================================

  async deleteMany(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un array de IDs',
        });
      }

      const eliminados = await pedidosCompraService.deleteMany(
        ids,
        req.user!.empresaId,
        dbConfig
      );

      return res.json({
        success: true,
        message: `${eliminados} pedidos de compra eliminados`,
        data: { eliminados },
      });
    } catch (error: any) {
      console.error('Error al eliminar pedidos de compra:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar los pedidos de compra',
      });
    }
  }

  // ============================================
  // OBTENER ESTADISTICAS
  // ============================================

  async getEstadisticas(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const estadisticas = await pedidosCompraService.getEstadisticas(
        req.user!.empresaId,
        dbConfig
      );

      return res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      console.error('Error al obtener estadisticas:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las estadisticas',
      });
    }
  }

  // ============================================
  // REGISTRAR RECEPCION
  // ============================================

  async registrarRecepcion(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const { lineaId, cantidadRecibida } = req.body;

      if (!lineaId || cantidadRecibida === undefined || cantidadRecibida < 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar lineaId y cantidadRecibida validos',
        });
      }

      const pedidoCompra = await pedidosCompraService.registrarRecepcion(
        id,
        lineaId,
        cantidadRecibida,
        req.user!.empresaId,
        req.user!.userId,
        dbConfig
      );

      if (!pedidoCompra) {
        return res.status(404).json({
          success: false,
          message: 'Pedido de compra no encontrado',
        });
      }

      return res.json({
        success: true,
        data: pedidoCompra,
        message: 'Recepcion registrada correctamente',
      });
    } catch (error: any) {
      console.error('Error al registrar recepcion:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al registrar la recepcion',
      });
    }
  }

  // ============================================
  // DUPLICAR PEDIDO
  // ============================================

  async duplicar(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const { id } = req.params;

      const nuevoPedido = await pedidosCompraService.duplicar(
        id,
        req.user!.empresaId,
        req.user!.userId,
        dbConfig
      );

      return res.status(201).json({
        success: true,
        data: nuevoPedido,
        message: 'Pedido de compra duplicado correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar pedido de compra:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al duplicar el pedido de compra',
      });
    }
  }

  // ============================================
  // PREPARAR PARA RECEPCIÓN
  // ============================================

  async prepararParaRecepcion(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const { id } = req.params;

      const resultado = await pedidosCompraService.prepararParaRecepcion(
        id,
        req.user!.empresaId,
        dbConfig
      );

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: 'Pedido de compra no encontrado',
        });
      }

      return res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al preparar recepcion:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al preparar la recepcion',
      });
    }
  }

  // ============================================
  // ALERTAS
  // ============================================

  async getAlertas(req: AuthRequest, res: Response) {
    try {
      const dbConfig = req.dbConfig;
      if (!dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const diasAlerta = req.query.diasAlerta ? Number(req.query.diasAlerta) : 7;

      const result = await pedidosCompraService.getAlertas(
        req.user!.empresaId,
        dbConfig,
        diasAlerta
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error al obtener alertas de pedidos de compra:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener alertas de pedidos de compra',
      });
    }
  }
}

export const pedidosCompraController = new PedidosCompraController();
export default pedidosCompraController;
