import { Request, Response, NextFunction } from 'express';
import { vencimientosService } from './vencimientos.service';
import {
  CreateVencimientoSchema,
  UpdateVencimientoSchema,
  SearchVencimientosSchema,
  RegistrarCobroSchema,
  CrearRemesaSchema,
} from './vencimientos.dto';

export class VencimientosController {
  /**
   * Obtener todos los vencimientos con filtros y paginación
   */
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = SearchVencimientosSchema.parse(req.query);
      const result = await vencimientosService.findAll(
        req.empresaId!,
        filters,
        req.empresaDbConfig!
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener un vencimiento por ID
   */
  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const vencimiento = await vencimientosService.findOne(
        req.params.id,
        req.empresaId!,
        req.empresaDbConfig!
      );

      res.json({
        success: true,
        data: vencimiento,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear un nuevo vencimiento
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateVencimientoSchema.parse(req.body);
      const vencimiento = await vencimientosService.create(
        req.empresaId!,
        data,
        req.empresaDbConfig!
      );

      res.status(201).json({
        success: true,
        data: vencimiento,
        message: 'Vencimiento creado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar un vencimiento
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateVencimientoSchema.parse(req.body);
      const vencimiento = await vencimientosService.update(
        req.params.id,
        req.empresaId!,
        data,
        req.empresaDbConfig!
      );

      res.json({
        success: true,
        data: vencimiento,
        message: 'Vencimiento actualizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registrar cobro/pago
   */
  async registrarCobro(req: Request, res: Response, next: NextFunction) {
    try {
      const data = RegistrarCobroSchema.parse(req.body);
      const vencimiento = await vencimientosService.registrarCobro(
        req.params.id,
        req.empresaId!,
        data,
        req.empresaDbConfig!
      );

      res.json({
        success: true,
        data: vencimiento,
        message: 'Cobro registrado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marcar como impagado
   */
  async marcarImpagado(req: Request, res: Response, next: NextFunction) {
    try {
      const vencimiento = await vencimientosService.marcarImpagado(
        req.params.id,
        req.empresaId!,
        req.empresaDbConfig!
      );

      res.json({
        success: true,
        data: vencimiento,
        message: 'Vencimiento marcado como impagado',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Anular vencimiento
   */
  async anular(req: Request, res: Response, next: NextFunction) {
    try {
      const vencimiento = await vencimientosService.anular(
        req.params.id,
        req.empresaId!,
        req.empresaDbConfig!
      );

      res.json({
        success: true,
        data: vencimiento,
        message: 'Vencimiento anulado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar vencimiento
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await vencimientosService.delete(
        req.params.id,
        req.empresaId!,
        req.empresaDbConfig!
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener vencimientos de un cliente
   */
  async getByCliente(req: Request, res: Response, next: NextFunction) {
    try {
      const vencimientos = await vencimientosService.getByCliente(
        req.params.clienteId,
        req.empresaId!,
        req.empresaDbConfig!
      );

      res.json({
        success: true,
        data: vencimientos,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener vencimientos de un proveedor
   */
  async getByProveedor(req: Request, res: Response, next: NextFunction) {
    try {
      const vencimientos = await vencimientosService.getByProveedor(
        req.params.proveedorId,
        req.empresaId!,
        req.empresaDbConfig!
      );

      res.json({
        success: true,
        data: vencimientos,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear remesa
   */
  async crearRemesa(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CrearRemesaSchema.parse(req.body);
      const remesa = await vencimientosService.crearRemesa(
        req.empresaId!,
        data,
        req.empresaDbConfig!
      );

      res.status(201).json({
        success: true,
        data: remesa,
        message: 'Remesa creada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener resumen de tesorería
   */
  async getResumen(req: Request, res: Response, next: NextFunction) {
    try {
      const tipo = req.query.tipo as string | undefined;
      const resumen = await vencimientosService.getResumen(
        req.empresaId!,
        tipo,
        req.empresaDbConfig!
      );

      res.json({
        success: true,
        data: resumen,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const vencimientosController = new VencimientosController();
