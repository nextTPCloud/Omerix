import { Request, Response } from 'express';
import { FichajesService } from './fichajes.service';
import {
  RegistrarEntradaDTO,
  RegistrarSalidaDTO,
  RegistrarPausaDTO,
  UpdateFichajeDTO,
  FichajeQueryDTO,
} from './fichajes.dto';

// ============================================
// CONTROLLER DE FICHAJES
// ============================================

export class FichajesController {
  /**
   * Obtener todos los fichajes
   */
  static async getAll(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          error: 'No autorizado',
        });
      }

      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      const query: FichajeQueryDTO = {
        personalId: req.query.personalId as string,
        departamentoId: req.query.departamentoId as string,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        estado: req.query.estado as string,
        tipo: req.query.tipo as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
        sortBy: (req.query.sortBy as string) || 'fecha',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await service.getAll(query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener fichajes',
      });
    }
  }

  /**
   * Obtener fichaje por ID
   */
  static async getById(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      const fichaje = await service.getById(req.params.id);

      if (!fichaje) {
        return res.status(404).json({
          success: false,
          error: 'Fichaje no encontrado',
        });
      }

      res.json({
        success: true,
        data: fichaje,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener fichaje',
      });
    }
  }

  /**
   * Obtener estado actual de fichaje del empleado
   */
  static async getEstadoActual(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      const personalId = req.params.personalId || req.user!.personalId?.toString();

      if (!personalId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el ID del personal',
        });
      }

      const estado = await service.getEstadoActual(personalId);

      res.json({
        success: true,
        data: estado,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estado',
      });
    }
  }

  /**
   * Registrar entrada (fichar)
   */
  static async registrarEntrada(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      const data: RegistrarEntradaDTO = req.body;

      // Si no se especifica personalId, usar el del usuario actual
      if (!data.personalId && req.user!.personalId) {
        data.personalId = req.user!.personalId.toString();
      }

      if (!data.personalId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el ID del personal',
        });
      }

      // Obtener IP del cliente
      const ip = req.ip || req.socket.remoteAddress;

      const fichaje = await service.registrarEntrada(
        data,
        req.user!._id,
        ip
      );

      res.status(201).json({
        success: true,
        data: fichaje,
        message: 'Entrada registrada correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al registrar entrada',
      });
    }
  }

  /**
   * Registrar salida
   */
  static async registrarSalida(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      const data: RegistrarSalidaDTO = {
        fichajeId: req.params.id,
        ubicacion: req.body.ubicacion,
        observaciones: req.body.observaciones,
      };

      const ip = req.ip || req.socket.remoteAddress;

      const fichaje = await service.registrarSalida(
        data,
        req.user!._id,
        ip
      );

      res.json({
        success: true,
        data: fichaje,
        message: 'Salida registrada correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al registrar salida',
      });
    }
  }

  /**
   * Registrar pausa
   */
  static async registrarPausa(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      const data: RegistrarPausaDTO = {
        fichajeId: req.params.id,
        tipo: req.body.tipo,
      };

      const fichaje = await service.registrarPausa(
        data,
        req.user!._id
      );

      res.json({
        success: true,
        data: fichaje,
        message: data.tipo === 'inicio' ? 'Pausa iniciada' : 'Pausa finalizada',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al registrar pausa',
      });
    }
  }

  /**
   * Actualizar fichaje
   */
  static async update(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      const data: UpdateFichajeDTO = req.body;

      const fichaje = await service.update(
        req.params.id,
        data,
        req.user!._id
      );

      res.json({
        success: true,
        data: fichaje,
        message: 'Fichaje actualizado correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al actualizar fichaje',
      });
    }
  }

  /**
   * Eliminar fichaje
   */
  static async delete(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      await service.delete(req.params.id);

      res.json({
        success: true,
        message: 'Fichaje eliminado correctamente',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar fichaje',
      });
    }
  }

  /**
   * Aprobar fichaje
   */
  static async aprobar(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      const fichaje = await service.aprobar(
        req.params.id,
        req.user!._id
      );

      res.json({
        success: true,
        data: fichaje,
        message: 'Fichaje aprobado correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al aprobar fichaje',
      });
    }
  }

  /**
   * Rechazar fichaje
   */
  static async rechazar(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      const fichaje = await service.rechazar(
        req.params.id,
        req.user!._id,
        req.body.motivo
      );

      res.json({
        success: true,
        data: fichaje,
        message: 'Fichaje rechazado correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al rechazar fichaje',
      });
    }
  }

  /**
   * Obtener resumen mensual del empleado
   */
  static async getResumenEmpleado(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      const personalId = req.params.personalId || req.user!.personalId?.toString();
      const mes = req.query.mes ? parseInt(req.query.mes as string) : undefined;
      const anio = req.query.anio ? parseInt(req.query.anio as string) : undefined;

      if (!personalId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el ID del personal',
        });
      }

      const resumen = await service.getResumenEmpleado(personalId, mes, anio);

      res.json({
        success: true,
        data: resumen,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener resumen',
      });
    }
  }

  /**
   * Fichar rapido (entrada o salida automatica)
   */
  static async ficharRapido(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const service = new FichajesService(
        req.empresaId as any,
        req.empresaDbConfig
      );

      const personalId = req.body.personalId || req.user!.personalId?.toString();

      if (!personalId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el ID del personal',
        });
      }

      const ip = req.ip || req.socket.remoteAddress;

      // Verificar si hay fichaje abierto
      const estado = await service.getEstadoActual(personalId);

      if (estado.fichando && estado.fichaje) {
        // Registrar salida
        const fichaje = await service.registrarSalida(
          {
            fichajeId: estado.fichaje._id.toString(),
            ubicacion: req.body.ubicacion,
          },
          req.user!._id,
          ip
        );

        return res.json({
          success: true,
          data: fichaje,
          accion: 'salida',
          message: 'Salida registrada correctamente',
        });
      } else {
        // Registrar entrada
        const fichaje = await service.registrarEntrada(
          {
            personalId,
            tipo: req.body.tipo || 'normal',
            ubicacion: req.body.ubicacion,
          },
          req.user!._id,
          ip
        );

        return res.status(201).json({
          success: true,
          data: fichaje,
          accion: 'entrada',
          message: 'Entrada registrada correctamente',
        });
      }
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al fichar',
      });
    }
  }
}
