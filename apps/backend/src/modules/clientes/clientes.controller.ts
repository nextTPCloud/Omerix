import { Request, Response } from 'express';
import { clientesService } from './clientes.service';
import mongoose from 'mongoose';
import { CreateClienteSchema } from './clientes.dto';

export class ClientesController {
  
  // ============================================
  // CREAR CLIENTE
  // ============================================
  
  async crear(req: Request, res: Response) {
    try {
      // ✅ FIX: Eliminar campo codigo si viene vacío o undefined
      // Esto permite que el pre-save hook del modelo lo genere automáticamente
      if (req.body.codigo === '' || req.body.codigo === undefined || req.body.codigo === null) {
        delete req.body.codigo;
      }
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }       
      const validatedData = CreateClienteSchema.parse(req.body);

      
    // Obtener empresaId y usuarioId del request (añadidos por middleware)
      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const usuarioId = new mongoose.Types.ObjectId(req.userId); // Del middleware de autenticación

      // Verificar duplicados
      const existeDuplicado = await clientesService.verificarDuplicados(
        req.body.nif,
        empresaId
      );

      if (existeDuplicado) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cliente con este NIF',
        });
      }

      const cliente = await clientesService.crear(
        req.body,
        empresaId,
        usuarioId
      );

      res.status(201).json({
        success: true,
        data: cliente,
        message: 'Cliente creado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear el cliente',
      });
    }
  }

  // ============================================
  // OBTENER TODOS
  // ============================================
  
  async obtenerTodos(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      
      const resultado = await clientesService.obtenerTodos(empresaId, req.query);

      res.json({
        success: true,
        data: resultado.clientes,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener clientes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los clientes',
      });
    }
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  
  async obtenerPorId(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const cliente = await clientesService.obtenerPorId(req.params.id, empresaId);

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      res.json({
        success: true,
        data: cliente,
      });
    } catch (error: any) {
      console.error('Error al obtener cliente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el cliente',
      });
    }
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  
  async actualizar(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const usuarioId = new mongoose.Types.ObjectId(req.userId); // Del middleware de autenticación

      // Verificar duplicados (excluyendo el cliente actual)
      if (req.body.nif) {
        const existeDuplicado = await clientesService.verificarDuplicados(
          req.body.nif,
          empresaId,
          req.params.id
        );

        if (existeDuplicado) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un cliente con este NIF',
          });
        }
      }

      const cliente = await clientesService.actualizar(
        req.params.id,
        req.body,
        empresaId,
        usuarioId
      );

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      res.json({
        success: true,
        data: cliente,
        message: 'Cliente actualizado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar cliente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el cliente',
      });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================
  
  async eliminar(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const resultado = await clientesService.eliminar(req.params.id, empresaId);

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Cliente eliminado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el cliente',
      });
    }
  }

  // ============================================
  // ELIMINACIÓN MÚLTIPLE
  // ============================================
  
  async eliminarMultiples(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs',
        });
      }

      const eliminados = await clientesService.eliminarMultiples(ids, empresaId);

      res.json({
        success: true,
        message: `${eliminados} cliente(s) eliminado(s) exitosamente`,
        data: { eliminados },
      });
    } catch (error: any) {
      console.error('Error al eliminar clientes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar los clientes',
      });
    }
  }

  // ============================================
  // CAMBIAR ESTADO (ACTIVAR/DESACTIVAR)
  // ============================================
  
  async cambiarEstado(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const usuarioId = new mongoose.Types.ObjectId(req.userId); // Del middleware de autenticación

      const { activo } = req.body;

      if (typeof activo !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo activo debe ser un booleano',
        });
      }

      const cliente = await clientesService.cambiarEstado(
        req.params.id,
        activo,
        empresaId,
        usuarioId
      );

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      res.json({
        success: true,
        data: cliente,
        message: `Cliente ${activo ? 'activado' : 'desactivado'} exitosamente`,
      });
    } catch (error: any) {
      console.error('Error al cambiar estado del cliente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar el estado del cliente',
      });
    }
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================
  
  async obtenerEstadisticas(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const estadisticas = await clientesService.obtenerEstadisticas(empresaId);

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las estadísticas',
      });
    }
  }

  // ============================================
  // SUBIR ARCHIVO
  // ============================================
  
  async subirArchivo(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const usuarioId = new mongoose.Types.ObjectId(req.userId); // Del middleware de autenticación


      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha proporcionado ningún archivo',
        });
      }

      // Aquí deberías subir el archivo a tu servicio de almacenamiento (S3, etc.)
      // Por ahora, simularemos la URL
      const archivoData = {
        nombre: req.file.originalname,
        url: `/uploads/clientes/${req.params.id}/${req.file.filename}`,
        tipo: req.file.mimetype,
        tamaño: req.file.size,
      };

      const cliente = await clientesService.subirArchivo(
        req.params.id,
        archivoData,
        empresaId,
        usuarioId
      );

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      res.json({
        success: true,
        data: cliente,
        message: 'Archivo subido exitosamente',
      });
    } catch (error: any) {
      console.error('Error al subir archivo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al subir el archivo',
      });
    }
  }

  // ============================================
  // ELIMINAR ARCHIVO
  // ============================================
  
  async eliminarArchivo(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const usuarioId = new mongoose.Types.ObjectId(req.userId); // Del middleware de autenticación

      const { archivoUrl } = req.body;

      if (!archivoUrl) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere la URL del archivo',
        });
      }

      const cliente = await clientesService.eliminarArchivo(
        req.params.id,
        archivoUrl,
        empresaId,
        usuarioId
      );

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      res.json({
        success: true,
        data: cliente,
        message: 'Archivo eliminado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar archivo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el archivo',
      });
    }
  }

  // ============================================
  // EXPORTAR A CSV
  // ============================================
  
  async exportarCSV(req: Request, res: Response) {
    try {
     if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const clientes = await clientesService.exportarCSV(empresaId, req.query);

      // Generar CSV
      const headers = [
        'Código',
        'Nombre',
        'NIF',
        'Email',
        'Teléfono',
        'Forma de Pago',
        'Activo',
      ];

      const rows = clientes.map((c: any) => [
        c.codigo,
        c.nombreCompleto || c.nombre,
        c.nif,
        c.email || '',
        c.telefono || '',
        c.formaPago,
        c.activo ? 'Sí' : 'No',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(r => r.join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=clientes.csv');
      res.send(csv);
    } catch (error: any) {
      console.error('Error al exportar CSV:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al exportar los datos',
      });
    }
  }
}

export const clientesController = new ClientesController();