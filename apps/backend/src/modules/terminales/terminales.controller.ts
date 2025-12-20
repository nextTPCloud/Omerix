import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TerminalesService } from './terminales.service';
import {
  CreateTerminalSchema,
  UpdateTerminalSchema,
  TerminalQuerySchema,
  SincronizarEmpleadosSchema,
  SincronizarAsistenciaSchema,
} from './terminales.dto';
import { IDatabaseConfig } from '@/models/Empresa';
import { terminalSyncScheduler } from './terminal-sync.scheduler';

// ============================================
// CONTROLADOR DE TERMINALES
// ============================================

class TerminalesController {
  private getService(req: Request): TerminalesService {
    const empresaId = new mongoose.Types.ObjectId(req.empresaId);
    const dbConfig = req.empresaDbConfig as IDatabaseConfig;
    return new TerminalesService(empresaId, dbConfig);
  }

  /**
   * GET /api/terminales
   * Obtener lista de terminales
   */
  async getAll(req: Request, res: Response) {
    try {
      const validacion = TerminalQuerySchema.safeParse(req.query);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: validacion.error.errors,
        });
      }

      const service = this.getService(req);
      const result = await service.getAll(validacion.data);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Error obteniendo terminales:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener terminales',
      });
    }
  }

  /**
   * GET /api/terminales/activos
   * Obtener terminales activos
   */
  async getActivos(req: Request, res: Response) {
    try {
      const service = this.getService(req);
      const terminales = await service.getActivos();

      res.json({
        success: true,
        data: terminales,
      });
    } catch (error: any) {
      console.error('Error obteniendo terminales activos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener terminales',
      });
    }
  }

  /**
   * GET /api/terminales/sugerir-codigo
   * Sugerir código para nuevo terminal
   */
  async sugerirCodigo(req: Request, res: Response) {
    try {
      const prefijo = (req.query.prefijo as string) || 'TRM';
      const service = this.getService(req);
      const codigo = await service.sugerirCodigo(prefijo);

      res.json({
        success: true,
        data: { codigo },
      });
    } catch (error: any) {
      console.error('Error sugiriendo código:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al sugerir código',
      });
    }
  }

  /**
   * GET /api/terminales/:id
   * Obtener terminal por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = this.getService(req);
      const terminal = await service.getById(id);

      if (!terminal) {
        return res.status(404).json({
          success: false,
          message: 'Terminal no encontrado',
        });
      }

      res.json({
        success: true,
        data: terminal,
      });
    } catch (error: any) {
      console.error('Error obteniendo terminal:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener terminal',
      });
    }
  }

  /**
   * POST /api/terminales
   * Crear nuevo terminal
   */
  async create(req: Request, res: Response) {
    try {
      const validacion = CreateTerminalSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const usuarioId = new mongoose.Types.ObjectId(req.userId);
      const service = this.getService(req);
      const terminal = await service.create(validacion.data, usuarioId);

      // Recargar scheduler para incluir el nuevo terminal
      await this.reloadScheduler(req, terminal._id.toString());

      res.status(201).json({
        success: true,
        data: terminal,
        message: 'Terminal creado correctamente',
      });
    } catch (error: any) {
      console.error('Error creando terminal:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear terminal',
      });
    }
  }

  /**
   * PUT /api/terminales/:id
   * Actualizar terminal
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validacion = UpdateTerminalSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const usuarioId = new mongoose.Types.ObjectId(req.userId);
      const service = this.getService(req);
      const terminal = await service.update(id, validacion.data, usuarioId);

      if (!terminal) {
        return res.status(404).json({
          success: false,
          message: 'Terminal no encontrado',
        });
      }

      // Recargar scheduler con la nueva configuración
      await this.reloadScheduler(req, id);

      res.json({
        success: true,
        data: terminal,
        message: 'Terminal actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error actualizando terminal:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar terminal',
      });
    }
  }

  /**
   * DELETE /api/terminales/:id
   * Desactivar terminal
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = this.getService(req);
      const terminal = await service.delete(id);

      if (!terminal) {
        return res.status(404).json({
          success: false,
          message: 'Terminal no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Terminal desactivado correctamente',
      });
    } catch (error: any) {
      console.error('Error eliminando terminal:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar terminal',
      });
    }
  }

  /**
   * DELETE /api/terminales/:id/permanente
   * Eliminar terminal permanentemente
   */
  async deletePermanente(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = this.getService(req);
      const terminal = await service.deletePermanente(id);

      if (!terminal) {
        return res.status(404).json({
          success: false,
          message: 'Terminal no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Terminal eliminado permanentemente',
      });
    } catch (error: any) {
      console.error('Error eliminando terminal:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar terminal',
      });
    }
  }

  /**
   * POST /api/terminales/:id/probar-conexion
   * Probar conexión con el terminal
   */
  async probarConexion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = this.getService(req);
      const resultado = await service.probarConexion(id);

      res.json({
        success: resultado.success,
        data: resultado.info,
        message: resultado.success
          ? 'Conexión exitosa'
          : `Error de conexión: ${resultado.error}`,
      });
    } catch (error: any) {
      console.error('Error probando conexión:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al probar conexión',
      });
    }
  }

  /**
   * POST /api/terminales/:id/sincronizar-empleados
   * Sincronizar empleados al terminal
   */
  async sincronizarEmpleados(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validacion = SincronizarEmpleadosSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: validacion.error.errors,
        });
      }

      const usuarioId = new mongoose.Types.ObjectId(req.userId);
      const service = this.getService(req);
      const resultado = await service.sincronizarEmpleados(id, validacion.data, usuarioId);

      res.json({
        success: true,
        data: resultado,
        message: `Sincronización completada: ${resultado.registrosProcesados} procesados, ${resultado.registrosNuevos} nuevos`,
      });
    } catch (error: any) {
      console.error('Error sincronizando empleados:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al sincronizar empleados',
      });
    }
  }

  /**
   * POST /api/terminales/:id/sincronizar
   * Sincronizar fichajes desde el terminal
   */
  async sincronizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validacion = SincronizarAsistenciaSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: validacion.error.errors,
        });
      }

      const usuarioId = new mongoose.Types.ObjectId(req.userId);
      const service = this.getService(req);
      const resultado = await service.sincronizarAsistencia(id, validacion.data, usuarioId);

      res.json({
        success: true,
        data: resultado,
        message: `Sincronización completada: ${resultado.registrosProcesados} procesados, ${resultado.registrosNuevos} nuevos fichajes`,
      });
    } catch (error: any) {
      console.error('Error sincronizando fichajes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al sincronizar fichajes',
      });
    }
  }

  /**
   * GET /api/terminales/:id/historial
   * Obtener historial de sincronizaciones
   */
  async getHistorial(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const limite = parseInt(req.query.limite as string) || 50;
      const service = this.getService(req);
      const historial = await service.getHistorial(id, limite);

      res.json({
        success: true,
        data: historial,
      });
    } catch (error: any) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener historial',
      });
    }
  }

  /**
   * GET /api/terminales/:id/empleados
   * Obtener empleados sincronizados en el terminal
   */
  async getEmpleados(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = this.getService(req);
      const empleados = await service.getEmpleadosSincronizados(id);

      res.json({
        success: true,
        data: empleados,
      });
    } catch (error: any) {
      console.error('Error obteniendo empleados:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener empleados',
      });
    }
  }

  /**
   * GET /api/terminales/scheduler/status
   * Obtener estado del scheduler de sincronización automática
   */
  async getSchedulerStatus(req: Request, res: Response) {
    try {
      const status = terminalSyncScheduler.getStatus();
      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      console.error('Error obteniendo estado del scheduler:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estado',
      });
    }
  }

  /**
   * Recargar terminal en el scheduler después de crear/actualizar
   */
  private async reloadScheduler(req: Request, terminalId: string): Promise<void> {
    try {
      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const dbConfig = req.empresaDbConfig as IDatabaseConfig;
      await terminalSyncScheduler.reloadTerminal(
        empresaId,
        new mongoose.Types.ObjectId(terminalId),
        dbConfig
      );
    } catch (error: any) {
      console.error('Error recargando scheduler:', error);
    }
  }
}

export const terminalesController = new TerminalesController();
export default terminalesController;
