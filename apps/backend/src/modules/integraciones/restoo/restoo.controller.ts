import { Request, Response } from 'express';
import { restooService } from './restoo.service';
import {
  CreateRestooConnectionSchema,
  UpdateRestooConnectionSchema,
  SyncRestooSchema,
  MapeoSalonSchema,
} from './restoo.dto';
import { TipoSyncRestoo } from './RestooConnection';

export class RestooController {
  async crearConexion(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const validacion = CreateRestooConnectionSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({ success: false, message: 'Datos invalidos', errors: validacion.error.errors });
      }

      const conexion = await restooService.crearConexion(validacion.data, req.empresaId!, req.empresaDbConfig);
      res.status(201).json({ success: true, data: conexion, message: 'Conexion con Restoo creada correctamente' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al crear conexion' });
    }
  }

  async obtenerConexiones(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const conexiones = await restooService.obtenerConexiones(req.empresaId!, req.empresaDbConfig);
      res.json({ success: true, data: conexiones });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al obtener conexiones' });
    }
  }

  async obtenerConexion(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const conexion = await restooService.obtenerConexion(req.params.id, req.empresaId!, req.empresaDbConfig);
      if (!conexion) return res.status(404).json({ success: false, message: 'Conexion no encontrada' });
      res.json({ success: true, data: conexion });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al obtener conexion' });
    }
  }

  async actualizarConexion(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const validacion = UpdateRestooConnectionSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({ success: false, message: 'Datos invalidos', errors: validacion.error.errors });
      }

      const conexion = await restooService.actualizarConexion(req.params.id, validacion.data, req.empresaId!, req.empresaDbConfig);
      if (!conexion) return res.status(404).json({ success: false, message: 'Conexion no encontrada' });
      res.json({ success: true, data: conexion, message: 'Conexion actualizada correctamente' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al actualizar conexion' });
    }
  }

  async eliminarConexion(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const conexion = await restooService.eliminarConexion(req.params.id, req.empresaId!, req.empresaDbConfig);
      if (!conexion) return res.status(404).json({ success: false, message: 'Conexion no encontrada' });
      res.json({ success: true, message: 'Conexion eliminada correctamente' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al eliminar conexion' });
    }
  }

  async testConexion(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const result = await restooService.testConexion(req.params.id, req.empresaId!, req.empresaDbConfig);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al probar conexion' });
    }
  }

  async sincronizar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const validacion = SyncRestooSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({ success: false, message: 'Datos invalidos', errors: validacion.error.errors });
      }

      let log;
      const tipo = validacion.data.tipo as TipoSyncRestoo;

      if (tipo === TipoSyncRestoo.RESERVAS) {
        log = await restooService.sincronizarReservas(req.params.id, req.empresaId!, req.empresaDbConfig);
      } else if (tipo === TipoSyncRestoo.DISPONIBILIDAD) {
        log = await restooService.sincronizarDisponibilidad(req.params.id, req.empresaId!, req.empresaDbConfig);
      } else {
        return res.status(400).json({ success: false, message: 'Tipo de sincronizacion no soportado' });
      }

      res.json({ success: true, data: log, message: 'Sincronizacion completada' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error en sincronizacion' });
    }
  }

  async obtenerLogs(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await restooService.obtenerLogs(req.params.id, req.empresaId!, req.empresaDbConfig, page, limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al obtener logs' });
    }
  }

  async obtenerSalonesRestoo(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const zones = await restooService.obtenerSalonesRestoo(req.params.id, req.empresaId!, req.empresaDbConfig);
      res.json({ success: true, data: zones });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al obtener salones de Restoo' });
    }
  }

  async obtenerMapeoSalones(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const mapeos = await restooService.obtenerMapeoSalones(req.params.id, req.empresaId!, req.empresaDbConfig);
      res.json({ success: true, data: mapeos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al obtener mapeo de salones' });
    }
  }

  async guardarMapeoSalones(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const validacion = MapeoSalonSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({ success: false, message: 'Datos invalidos', errors: validacion.error.errors });
      }

      const mapeos = await restooService.guardarMapeoSalones(
        req.params.id,
        validacion.data.mapeos,
        req.empresaId!,
        req.empresaDbConfig
      );
      res.json({ success: true, data: mapeos, message: 'Mapeo de salones guardado correctamente' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al guardar mapeo de salones' });
    }
  }
}

export const restooController = new RestooController();
