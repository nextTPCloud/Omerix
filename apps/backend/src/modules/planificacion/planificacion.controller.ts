import { Request, Response } from 'express';
import { planificacionService } from './planificacion.service';
import {
  CreatePlanificacionSchema,
  UpdatePlanificacionSchema,
  AgregarAsignacionSchema,
  ActualizarAsignacionSchema,
  CambiarEstadoPlanificacionSchema,
  SearchPlanificacionesSchema,
  CopiarSemanaSchema,
} from './planificacion.dto';

class PlanificacionController {
  /**
   * GET /api/planificacion
   * Listar planificaciones
   */
  async listar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const params = SearchPlanificacionesSchema.parse(req.query);

      const result = await planificacionService.listar(empresaId, params);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/planificacion/:id
   * Obtener planificacion por ID
   */
  async obtenerPorId(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      const planificacion = await planificacionService.obtenerPorId(empresaId, id);

      res.json({
        success: true,
        data: planificacion,
      });
    } catch (error: any) {
      res.status(error.message === 'Planificacion no encontrada' ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/planificacion
   * Crear planificacion
   */
  async crear(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.usuarioId!;
      const usuarioNombre = req.usuarioNombre || 'Sistema';
      const data = CreatePlanificacionSchema.parse(req.body);

      const planificacion = await planificacionService.crear(
        empresaId,
        data,
        usuarioId,
        usuarioNombre
      );

      res.status(201).json({
        success: true,
        data: planificacion,
        message: 'Planificacion creada correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/planificacion/:id
   * Actualizar planificacion
   */
  async actualizar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;
      const data = UpdatePlanificacionSchema.parse(req.body);

      const planificacion = await planificacionService.actualizar(empresaId, id, data);

      res.json({
        success: true,
        data: planificacion,
        message: 'Planificacion actualizada correctamente',
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrada') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/planificacion/:id/asignaciones
   * Agregar asignaciones
   */
  async agregarAsignaciones(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;
      const data = AgregarAsignacionSchema.parse(req.body);

      const planificacion = await planificacionService.agregarAsignaciones(empresaId, id, data);

      res.json({
        success: true,
        data: planificacion,
        message: 'Asignaciones agregadas correctamente',
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrada') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/planificacion/:id/asignaciones/:asignacionId
   * Actualizar asignacion
   */
  async actualizarAsignacion(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id, asignacionId } = req.params;
      const data = ActualizarAsignacionSchema.parse(req.body);

      const planificacion = await planificacionService.actualizarAsignacion(
        empresaId,
        id,
        asignacionId,
        data
      );

      res.json({
        success: true,
        data: planificacion,
        message: 'Asignacion actualizada correctamente',
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrada') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/planificacion/:id/asignaciones/:asignacionId
   * Eliminar asignacion
   */
  async eliminarAsignacion(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id, asignacionId } = req.params;

      const planificacion = await planificacionService.eliminarAsignacion(
        empresaId,
        id,
        asignacionId
      );

      res.json({
        success: true,
        data: planificacion,
        message: 'Asignacion eliminada correctamente',
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrada') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/planificacion/:id/estado
   * Cambiar estado
   */
  async cambiarEstado(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const usuarioId = req.usuarioId!;
      const usuarioNombre = req.usuarioNombre || 'Sistema';
      const { id } = req.params;
      const data = CambiarEstadoPlanificacionSchema.parse(req.body);

      const planificacion = await planificacionService.cambiarEstado(
        empresaId,
        id,
        data,
        usuarioId,
        usuarioNombre
      );

      res.json({
        success: true,
        data: planificacion,
        message: `Estado cambiado a ${data.estado}`,
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrada') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/planificacion/:id/copiar-semana
   * Copiar semana
   */
  async copiarSemana(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;
      const data = CopiarSemanaSchema.parse(req.body);

      const planificacion = await planificacionService.copiarSemana(empresaId, id, data);

      res.json({
        success: true,
        data: planificacion,
        message: 'Semana copiada correctamente',
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrada') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/planificacion/:id
   * Eliminar planificacion
   */
  async eliminar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { id } = req.params;

      await planificacionService.eliminar(empresaId, id);

      res.json({
        success: true,
        message: 'Planificacion eliminada correctamente',
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrada') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/planificacion/empleado/:personalId
   * Obtener planificacion de un empleado
   */
  async obtenerPlanificacionEmpleado(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { personalId } = req.params;
      const { fechaDesde, fechaHasta } = req.query;

      const asignaciones = await planificacionService.obtenerPlanificacionEmpleado(
        empresaId,
        personalId,
        fechaDesde as string,
        fechaHasta as string
      );

      res.json({
        success: true,
        data: asignaciones,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/planificacion/sugerir-codigo
   * Obtener sugerencia de proximo codigo
   */
  async sugerirCodigo(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const codigo = await planificacionService.sugerirCodigo(empresaId);

      res.json({
        success: true,
        data: { codigo },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/planificacion/resumen-semanal
   * Obtener resumen semanal
   */
  async obtenerResumenSemanal(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const { fechaInicio } = req.query;

      if (!fechaInicio) {
        throw new Error('fechaInicio es requerido');
      }

      const resumen = await planificacionService.obtenerResumenSemanal(
        empresaId,
        fechaInicio as string
      );

      res.json({
        success: true,
        data: resumen,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const planificacionController = new PlanificacionController();
export default planificacionController;
