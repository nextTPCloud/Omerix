import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { presupuestosCompraService } from './presupuestos-compra.service';
import {
  CreatePresupuestoCompraDTO,
  UpdatePresupuestoCompraDTO,
  GetPresupuestosCompraQuery,
  ConvertirAPedidoDTO,
} from './presupuestos-compra.dto';
import { EstadoPresupuestoCompra } from './PresupuestoCompra';

export class PresupuestosCompraController {
  // ============================================
  // CREAR
  // ============================================

  async create(req: Request, res: Response) {
    try {
      const dto: CreatePresupuestoCompraDTO = req.body;

      if (!dto.proveedorId) {
        return res.status(400).json({
          success: false,
          message: 'El proveedor es obligatorio',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.crear(
        dto,
        req.empresaId,
        req.userId!,
        req.dbConfig
      );

      res.status(201).json({
        success: true,
        message: 'Presupuesto de compra creado correctamente',
        data: presupuesto,
      });
    } catch (error: any) {
      console.error('Error creando presupuesto de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // LISTAR
  // ============================================

  async findAll(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const query: GetPresupuestosCompraQuery = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 25,
        sortBy: req.query.sortBy as string || 'fechaCreacion',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        search: req.query.search as string,
        estado: req.query.estado as EstadoPresupuestoCompra,
        estados: req.query.estados as string,
        prioridad: req.query.prioridad as any,
        proveedorId: req.query.proveedorId as string,
        activo: req.query.activo as string,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        fechaValidezDesde: req.query.fechaValidezDesde as string,
        fechaValidezHasta: req.query.fechaValidezHasta as string,
        importeMinimo: req.query.importeMinimo ? Number(req.query.importeMinimo) : undefined,
        importeMaximo: req.query.importeMaximo ? Number(req.query.importeMaximo) : undefined,
        tags: req.query.tags as string,
        ...req.query,
      };

      const result = await presupuestosCompraService.findAll(
        req.empresaId,
        req.dbConfig,
        query
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error listando presupuestos de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error listando presupuestos de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.findById(
        req.empresaId,
        req.dbConfig,
        id
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto de compra no encontrado',
        });
      }

      res.json({
        success: true,
        data: presupuesto,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER POR CODIGO
  // ============================================

  async findByCodigo(req: Request, res: Response) {
    try {
      const { codigo } = req.params;

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.findByCodigo(
        req.empresaId,
        req.dbConfig,
        codigo
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto de compra no encontrado',
        });
      }

      res.json({
        success: true,
        data: presupuesto,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto: UpdatePresupuestoCompraDTO = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.update(
        req.empresaId,
        req.dbConfig,
        id,
        dto,
        req.userId!
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto de compra no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Presupuesto de compra actualizado correctamente',
        data: presupuesto,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error actualizando presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const eliminado = await presupuestosCompraService.delete(
        req.empresaId,
        req.dbConfig,
        id,
        req.userId!
      );

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto de compra no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Presupuesto de compra eliminado correctamente',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { estado, motivoRechazo } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!estado) {
        return res.status(400).json({
          success: false,
          message: 'El estado es obligatorio',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.cambiarEstado(
        req.empresaId,
        req.dbConfig,
        id,
        estado,
        req.userId!,
        motivoRechazo
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto de compra no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Estado actualizado correctamente',
        data: presupuesto,
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
  // CONVERTIR A PEDIDO
  // ============================================

  async convertirAPedido(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto: Partial<ConvertirAPedidoDTO> = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const resultado = await presupuestosCompraService.convertirAPedido(
        req.empresaId,
        req.dbConfig,
        { ...dto, presupuestoCompraId: id },
        req.userId!
      );

      res.json({
        success: true,
        message: `Presupuesto convertido a pedido ${resultado.pedido.codigo}`,
        data: resultado,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error convirtiendo a pedido',
        error: error.message,
      });
    }
  }

  // ============================================
  // DUPLICAR
  // ============================================

  async duplicar(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no valido',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const presupuesto = await presupuestosCompraService.duplicar(
        req.empresaId,
        req.dbConfig,
        id,
        req.userId!
      );

      res.status(201).json({
        success: true,
        message: 'Presupuesto de compra duplicado correctamente',
        data: presupuesto,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error duplicando presupuesto de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // ESTADISTICAS
  // ============================================

  async getEstadisticas(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const estadisticas = await presupuestosCompraService.getEstadisticas(
        req.empresaId,
        req.dbConfig
      );

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadisticas',
        error: error.message,
      });
    }
  }

  // ============================================
  // ALERTAS
  // ============================================

  async getAlertas(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      const diasAlerta = req.query.diasAlerta ? Number(req.query.diasAlerta) : 7;

      const alertas = await presupuestosCompraService.getAlertas(
        req.empresaId,
        req.dbConfig,
        diasAlerta
      );

      res.json({
        success: true,
        data: alertas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo alertas',
        error: error.message,
      });
    }
  }

  // ============================================
  // ELIMINAR MULTIPLES
  // ============================================

  async deleteMany(req: Request, res: Response) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs',
        });
      }

      if (!req.empresaId || !req.dbConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuracion de base de datos no disponible',
        });
      }

      let eliminados = 0;
      const errores: string[] = [];

      for (const id of ids) {
        try {
          const resultado = await presupuestosCompraService.delete(
            req.empresaId,
            req.dbConfig,
            id,
            req.userId!
          );
          if (resultado) eliminados++;
        } catch (e: any) {
          errores.push(`${id}: ${e.message}`);
        }
      }

      res.json({
        success: true,
        message: `${eliminados} presupuestos eliminados`,
        data: { eliminados, errores },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando presupuestos',
        error: error.message,
      });
    }
  }
}

export const presupuestosCompraController = new PresupuestosCompraController();
