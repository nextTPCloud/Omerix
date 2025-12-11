import { Request, Response } from 'express';
import { proveedoresService } from './proveedores.service';
import mongoose from 'mongoose';
import { CreateProveedorSchema, UpdateProveedorSchema } from './proveedores.dto';

export class ProveedoresController {

  // ============================================
  // CREAR PROVEEDOR
  // ============================================

  async create(req: Request, res: Response) {
    try {
      // Eliminar campo codigo si viene vacío para que el hook lo genere
      if (req.body.codigo === '' || req.body.codigo === undefined || req.body.codigo === null) {
        delete req.body.codigo;
      }

      // Validar autenticación
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      // MULTI-DB: Verificar que existe configuración de DB
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const validatedData = CreateProveedorSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      // Verificar duplicados por NIF
      const existeDuplicado = await proveedoresService.existeNif(
        req.body.nif,
        empresaId,
        req.empresaDbConfig
      );

      if (existeDuplicado) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un proveedor con este NIF',
        });
      }

      const proveedor = await proveedoresService.crear(
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: proveedor,
        message: 'Proveedor creado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al crear proveedor:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear el proveedor',
      });
    }
  }

  // ============================================
  // OBTENER TODOS
  // ============================================

  async findAll(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);

      const { proveedores, total, page, limit, totalPages } = await proveedoresService.findAll(
        empresaId,
        req.empresaDbConfig,
        req.query
      );

      res.json({
        success: true,
        data: proveedores,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener proveedores:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los proveedores',
      });
    }
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async findById(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const proveedor = await proveedoresService.findById(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado',
        });
      }

      res.json({
        success: true,
        data: proveedor,
      });
    } catch (error: any) {
      console.error('Error al obtener proveedor:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el proveedor',
      });
    }
  }

  // ============================================
  // OBTENER POR CÓDIGO
  // ============================================

  async findByCodigo(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const proveedor = await proveedoresService.findByCodigo(
        req.params.codigo,
        empresaId,
        req.empresaDbConfig
      );

      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado',
        });
      }

      res.json({
        success: true,
        data: proveedor,
      });
    } catch (error: any) {
      console.error('Error al obtener proveedor por código:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el proveedor',
      });
    }
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async update(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      // Verificar duplicados si se cambia el NIF
      if (req.body.nif) {
        const existeDuplicado = await proveedoresService.existeNif(
          req.body.nif,
          empresaId,
          req.empresaDbConfig,
          req.params.id
        );

        if (existeDuplicado) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otro proveedor con este NIF',
          });
        }
      }

      const validatedData = UpdateProveedorSchema.parse(req.body);

      const proveedor = await proveedoresService.actualizar(
        req.params.id,
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado',
        });
      }

      res.json({
        success: true,
        data: proveedor,
        message: 'Proveedor actualizado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar proveedor:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el proveedor',
      });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async delete(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const eliminado = await proveedoresService.eliminar(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Proveedor eliminado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar proveedor:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el proveedor',
      });
    }
  }

  // ============================================
  // ELIMINAR MÚLTIPLES
  // ============================================

  async deleteMany(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const eliminados = await proveedoresService.eliminarMultiples(
        ids,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: `${eliminados} proveedor(es) eliminado(s) exitosamente`,
        data: { eliminados },
      });
    } catch (error: any) {
      console.error('Error al eliminar proveedores:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar los proveedores',
      });
    }
  }

  // ============================================
  // TOGGLE ESTADO
  // ============================================

  async toggleEstado(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const proveedor = await proveedoresService.toggleEstado(
        req.params.id,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado',
        });
      }

      res.json({
        success: true,
        data: proveedor,
        message: `Proveedor ${proveedor.activo ? 'activado' : 'desactivado'} exitosamente`,
      });
    } catch (error: any) {
      console.error('Error al cambiar estado del proveedor:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar estado del proveedor',
      });
    }
  }

  // ============================================
  // ACTIVAR/DESACTIVAR MÚLTIPLES
  // ============================================

  async setEstadoMultiples(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const { ids, activo } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs',
        });
      }

      if (typeof activo !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el campo "activo" (boolean)',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const modificados = await proveedoresService.setEstadoMultiples(
        ids,
        activo,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: `${modificados} proveedor(es) ${activo ? 'activado(s)' : 'desactivado(s)'} exitosamente`,
        data: { modificados },
      });
    } catch (error: any) {
      console.error('Error al cambiar estado de proveedores:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar estado de los proveedores',
      });
    }
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async getEstadisticas(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const estadisticas = await proveedoresService.obtenerEstadisticas(
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  }

  // ============================================
  // BUSCAR PARA SELECTOR
  // ============================================

  async buscarParaSelector(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const search = req.query.search as string || '';
      const limit = parseInt(req.query.limit as string) || 10;

      const proveedores = await proveedoresService.buscarParaSelector(
        empresaId,
        req.empresaDbConfig,
        search,
        limit
      );

      res.json({
        success: true,
        data: proveedores,
      });
    } catch (error: any) {
      console.error('Error al buscar proveedores:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al buscar proveedores',
      });
    }
  }
}

// Exportar instancia singleton
export const proveedoresController = new ProveedoresController();
