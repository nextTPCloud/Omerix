import { Request, Response } from 'express';
import { ecommerceService } from './ecommerce.service';
import { CreateConexionSchema, UpdateConexionSchema, SyncRequestSchema } from './ecommerce.dto';
import { TipoSync, DireccionSync } from './Ecommerce';

export class EcommerceController {
  async crearConexion(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const validacion = CreateConexionSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({ success: false, message: 'Datos invalidos', errors: validacion.error.errors });
      }

      const conexion = await ecommerceService.crearConexion(validacion.data, req.empresaId!, req.empresaDbConfig);
      res.status(201).json({ success: true, data: conexion, message: 'Conexion creada correctamente' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al crear conexion' });
    }
  }

  async obtenerConexiones(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({ success: false, message: 'Configuracion de base de datos no disponible' });
      }

      const conexiones = await ecommerceService.obtenerConexiones(req.empresaId!, req.empresaDbConfig);
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

      const conexion = await ecommerceService.obtenerConexion(req.params.id, req.empresaId!, req.empresaDbConfig);
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

      const validacion = UpdateConexionSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({ success: false, message: 'Datos invalidos', errors: validacion.error.errors });
      }

      const conexion = await ecommerceService.actualizarConexion(req.params.id, validacion.data, req.empresaId!, req.empresaDbConfig);
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

      const conexion = await ecommerceService.eliminarConexion(req.params.id, req.empresaId!, req.empresaDbConfig);
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

      const result = await ecommerceService.testConexion(req.params.id, req.empresaId!, req.empresaDbConfig);
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

      const validacion = SyncRequestSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({ success: false, message: 'Datos invalidos', errors: validacion.error.errors });
      }

      const log = await ecommerceService.sincronizar(
        req.params.id,
        validacion.data.tipo as TipoSync,
        validacion.data.direccion as DireccionSync,
        req.empresaId!,
        req.empresaDbConfig
      );

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

      const logs = await ecommerceService.obtenerLogs(req.params.id, req.empresaId!, req.empresaDbConfig);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error al obtener logs' });
    }
  }
}

export const ecommerceController = new EcommerceController();
