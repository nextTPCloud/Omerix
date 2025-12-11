import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { albaranesCompraService } from './albaranes-compra.service';
import {
  CreateAlbaranCompraDTO,
  UpdateAlbaranCompraDTO,
  SearchAlbaranesCompraDTO,
  RegistrarRecepcionDTO,
  CrearDesdePedidoCompraDTO,
} from './albaranes-compra.dto';
import { EstadoAlbaranCompra } from './AlbaranCompra';
import { AuthRequest } from '@/middleware/auth.middleware';

export class AlbaranesCompraController {
  // ============================================
  // LISTAR ALBARANES DE COMPRA
  // ============================================

  async listar(req: AuthRequest, res: Response) {
    try {
      const searchDto: SearchAlbaranesCompraDTO = {
        search: req.query.search as string,
        proveedorId: req.query.proveedorId as string,
        almacenId: req.query.almacenId as string,
        estado: req.query.estado as EstadoAlbaranCompra,
        estados: req.query.estados as string,
        serie: req.query.serie as string,
        activo: req.query.activo as string,
        facturado: req.query.facturado as string,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        fechaRecepcionDesde: req.query.fechaRecepcionDesde as string,
        fechaRecepcionHasta: req.query.fechaRecepcionHasta as string,
        importeMin: req.query.importeMin ? Number(req.query.importeMin) : undefined,
        importeMax: req.query.importeMax ? Number(req.query.importeMax) : undefined,
        pedidoCompraId: req.query.pedidoCompraId as string,
        tags: req.query.tags as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        ...req.query, // Para filtros avanzados dinámicos
      };

      const resultado = await albaranesCompraService.buscar(
        searchDto,
        req.empresaId!,
        req.dbConfig!
      );

      res.json({
        success: true,
        data: resultado.albaranes,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error listando albaranes de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER ALBARÁN POR ID
  // ============================================

  async obtenerPorId(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no válido',
        });
      }

      const albaran = await albaranesCompraService.obtenerPorId(
        id,
        req.empresaId!,
        req.dbConfig!
      );

      if (!albaran) {
        return res.status(404).json({
          success: false,
          message: 'Albarán de compra no encontrado',
        });
      }

      res.json({
        success: true,
        data: albaran,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo albarán de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // CREAR ALBARÁN DE COMPRA
  // ============================================

  async crear(req: AuthRequest, res: Response) {
    try {
      const dto: CreateAlbaranCompraDTO = req.body;

      if (!dto.proveedorId) {
        return res.status(400).json({
          success: false,
          message: 'El proveedor es obligatorio',
        });
      }

      if (!dto.almacenId) {
        return res.status(400).json({
          success: false,
          message: 'El almacén es obligatorio',
        });
      }

      const albaran = await albaranesCompraService.crear(
        dto,
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      res.status(201).json({
        success: true,
        message: 'Albarán de compra creado correctamente',
        data: albaran,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error creando albarán de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // CREAR DESDE PEDIDO DE COMPRA
  // ============================================

  async crearDesdePedidoCompra(req: AuthRequest, res: Response) {
    try {
      const dto: CrearDesdePedidoCompraDTO = req.body;

      if (!dto.pedidoCompraId) {
        return res.status(400).json({
          success: false,
          message: 'El pedido de compra es obligatorio',
        });
      }

      const albaran = await albaranesCompraService.crearDesdePedidoCompra(
        dto,
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      res.status(201).json({
        success: true,
        message: 'Albarán de compra creado desde pedido',
        data: albaran,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error creando albarán de compra desde pedido',
        error: error.message,
      });
    }
  }

  // ============================================
  // ACTUALIZAR ALBARÁN
  // ============================================

  async actualizar(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const dto: UpdateAlbaranCompraDTO = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no válido',
        });
      }

      const albaran = await albaranesCompraService.actualizar(
        id,
        dto,
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      if (!albaran) {
        return res.status(404).json({
          success: false,
          message: 'Albarán de compra no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Albarán de compra actualizado correctamente',
        data: albaran,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error actualizando albarán de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // REGISTRAR RECEPCIÓN
  // ============================================

  async registrarRecepcion(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const dto: RegistrarRecepcionDTO = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no válido',
        });
      }

      const albaran = await albaranesCompraService.registrarRecepcion(
        id,
        dto,
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      if (!albaran) {
        return res.status(404).json({
          success: false,
          message: 'Albarán de compra no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Recepción registrada correctamente',
        data: albaran,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error registrando recepción',
        error: error.message,
      });
    }
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { estado, observaciones } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no válido',
        });
      }

      if (!estado) {
        return res.status(400).json({
          success: false,
          message: 'El estado es obligatorio',
        });
      }

      const albaran = await albaranesCompraService.actualizar(
        id,
        { estado },
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      if (!albaran) {
        return res.status(404).json({
          success: false,
          message: 'Albarán de compra no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Estado actualizado correctamente',
        data: albaran,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error cambiando estado',
        error: error.message,
      });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no válido',
        });
      }

      const eliminado = await albaranesCompraService.eliminar(
        id,
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: 'Albarán de compra no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Albarán de compra eliminado correctamente',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando albarán de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // ELIMINAR MÚLTIPLES
  // ============================================

  async eliminarMultiples(req: AuthRequest, res: Response) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar una lista de IDs',
        });
      }

      let eliminados = 0;
      for (const id of ids) {
        try {
          const resultado = await albaranesCompraService.eliminar(
            id,
            req.empresaId!,
            req.userId!,
            req.dbConfig!
          );
          if (resultado) eliminados++;
        } catch (e) {
          // Continuar con los siguientes
        }
      }

      res.json({
        success: true,
        message: `${eliminados} albaranes eliminados`,
        data: { eliminados },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando albaranes',
        error: error.message,
      });
    }
  }

  // ============================================
  // DUPLICAR
  // ============================================

  async duplicar(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no válido',
        });
      }

      const albaran = await albaranesCompraService.duplicar(
        id,
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      res.status(201).json({
        success: true,
        message: 'Albarán de compra duplicado correctamente',
        data: albaran,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error duplicando albarán de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(req: AuthRequest, res: Response) {
    try {
      const estadisticas = await albaranesCompraService.obtenerEstadisticas(
        req.empresaId!,
        req.dbConfig!
      );

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas',
        error: error.message,
      });
    }
  }
}

export const albaranesCompraController = new AlbaranesCompraController();
