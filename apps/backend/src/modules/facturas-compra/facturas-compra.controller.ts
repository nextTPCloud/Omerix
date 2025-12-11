import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { facturasCompraService } from './facturas-compra.service';
import {
  CreateFacturaCompraDTO,
  UpdateFacturaCompraDTO,
  SearchFacturasCompraDTO,
  RegistrarPagoDTO,
  CrearDesdeAlbaranesDTO,
} from './facturas-compra.dto';
import { EstadoFacturaCompra } from './FacturaCompra';
import { AuthRequest } from '@/middleware/auth.middleware';

export class FacturasCompraController {
  // ============================================
  // LISTAR
  // ============================================

  async listar(req: AuthRequest, res: Response) {
    try {
      const searchDto: SearchFacturasCompraDTO = {
        search: req.query.search as string,
        proveedorId: req.query.proveedorId as string,
        estado: req.query.estado as EstadoFacturaCompra,
        estados: req.query.estados as string,
        serie: req.query.serie as string,
        activo: req.query.activo as string,
        contabilizada: req.query.contabilizada as string,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        fechaVencimientoDesde: req.query.fechaVencimientoDesde as string,
        fechaVencimientoHasta: req.query.fechaVencimientoHasta as string,
        importeMin: req.query.importeMin ? Number(req.query.importeMin) : undefined,
        importeMax: req.query.importeMax ? Number(req.query.importeMax) : undefined,
        numeroFacturaProveedor: req.query.numeroFacturaProveedor as string,
        tags: req.query.tags as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        ...req.query,
      };

      const resultado = await facturasCompraService.buscar(
        searchDto,
        req.empresaId!,
        req.dbConfig!
      );

      res.json({
        success: true,
        data: resultado.facturas,
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
        message: 'Error listando facturas de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER POR ID
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

      const factura = await facturasCompraService.obtenerPorId(
        id,
        req.empresaId!,
        req.dbConfig!
      );

      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura de compra no encontrada',
        });
      }

      res.json({
        success: true,
        data: factura,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo factura de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // CREAR
  // ============================================

  async crear(req: AuthRequest, res: Response) {
    try {
      const dto: CreateFacturaCompraDTO = req.body;

      if (!dto.proveedorId) {
        return res.status(400).json({
          success: false,
          message: 'El proveedor es obligatorio',
        });
      }

      if (!dto.numeroFacturaProveedor) {
        return res.status(400).json({
          success: false,
          message: 'El número de factura del proveedor es obligatorio',
        });
      }

      if (!dto.fechaFacturaProveedor) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de factura del proveedor es obligatoria',
        });
      }

      const factura = await facturasCompraService.crear(
        dto,
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      res.status(201).json({
        success: true,
        message: 'Factura de compra creada correctamente',
        data: factura,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error creando factura de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // CREAR DESDE ALBARANES
  // ============================================

  async crearDesdeAlbaranes(req: AuthRequest, res: Response) {
    try {
      const dto: CrearDesdeAlbaranesDTO = req.body;

      if (!dto.albaranesCompraIds || dto.albaranesCompraIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar al menos un albarán de compra',
        });
      }

      if (!dto.numeroFacturaProveedor) {
        return res.status(400).json({
          success: false,
          message: 'El número de factura del proveedor es obligatorio',
        });
      }

      if (!dto.fechaFacturaProveedor) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de factura del proveedor es obligatoria',
        });
      }

      const factura = await facturasCompraService.crearDesdeAlbaranes(
        dto,
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      res.status(201).json({
        success: true,
        message: 'Factura de compra creada desde albaranes',
        data: factura,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error creando factura de compra desde albaranes',
        error: error.message,
      });
    }
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const dto: UpdateFacturaCompraDTO = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no válido',
        });
      }

      const factura = await facturasCompraService.actualizar(
        id,
        dto,
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura de compra no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Factura de compra actualizada correctamente',
        data: factura,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error actualizando factura de compra',
        error: error.message,
      });
    }
  }

  // ============================================
  // REGISTRAR PAGO
  // ============================================

  async registrarPago(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const dto: RegistrarPagoDTO = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID no válido',
        });
      }

      if (!dto.importe || dto.importe <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El importe del pago debe ser mayor que cero',
        });
      }

      const factura = await facturasCompraService.registrarPago(
        id,
        dto,
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura de compra no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Pago registrado correctamente',
        data: factura,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error registrando pago',
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
      const { estado } = req.body;

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

      const factura = await facturasCompraService.actualizar(
        id,
        { estado },
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura de compra no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Estado actualizado correctamente',
        data: factura,
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

      const eliminado = await facturasCompraService.eliminar(
        id,
        req.empresaId!,
        req.userId!,
        req.dbConfig!
      );

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: 'Factura de compra no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Factura de compra eliminada correctamente',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando factura de compra',
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
          const resultado = await facturasCompraService.eliminar(
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
        message: `${eliminados} facturas eliminadas`,
        data: { eliminados },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando facturas',
        error: error.message,
      });
    }
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(req: AuthRequest, res: Response) {
    try {
      const estadisticas = await facturasCompraService.obtenerEstadisticas(
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

export const facturasCompraController = new FacturasCompraController();
