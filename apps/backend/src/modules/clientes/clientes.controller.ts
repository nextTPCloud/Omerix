import { Request, Response } from 'express';
import { clientesService } from './clientes.service';
import mongoose from 'mongoose';
import { CreateClienteSchema } from './clientes.dto';

export class ClientesController {
  
  // ============================================
  // CREAR CLIENTE
  // ============================================
  
  async create(req: Request, res: Response) {
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
  
  async findAll(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      
      // ✅ FIX: Desestructurar el resultado para evitar errores de TypeScript
      const { clientes, total, page, limit, totalPages } = await clientesService.findAll(empresaId, req.query);

      res.json({
        success: true,
        data: clientes,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages,  // ← CAMBIO: pages en lugar de totalPages
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
  
  async findById(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const cliente = await clientesService.findById(req.params.id, empresaId);

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
  
  async update(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId); // Del middleware de autenticación
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      // Verificar duplicados si se cambia el NIF
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
  // ELIMINAR (SOFT DELETE)
  // ============================================
  
  async delete(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
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
  
  async bulkDelete(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un array de IDs',
        });
      }

      const count = await clientesService.eliminarMultiples(ids, empresaId);

      res.json({
        success: true,
        message: `${count} cliente(s) eliminado(s) exitosamente`,
        count,
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
  
  async changeStatus(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);
      const { activo } = req.body;

      if (typeof activo !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo "activo" debe ser un booleano',
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

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
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
  // EXPORTAR CSV
  // ============================================
  
  async exportarCSV(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const clientes = await clientesService.exportarCSV(empresaId, req.query);

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=clientes.csv');

      // Crear CSV
      const csvHeader = 'Código,Nombre,NIF,Email,Teléfono,Tipo,Forma Pago,Estado\n';
      let csvContent = csvHeader;

      clientes.forEach((cliente: any) => {
        csvContent += `"${cliente.codigo}","${cliente.nombre}","${cliente.nif}","${cliente.email || ''}","${cliente.telefono || ''}","${cliente.tipoCliente}","${cliente.formaPago}","${cliente.activo ? 'Activo' : 'Inactivo'}"\n`;
      });

      res.send(csvContent);
    } catch (error: any) {
      console.error('Error al exportar CSV:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al exportar CSV',
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

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha subido ningún archivo',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const archivo = {
        nombre: req.file.originalname,
        url: req.file.path,
        tipo: req.file.mimetype,
        tamaño: req.file.size,
      };

      const cliente = await clientesService.subirArchivo(
        req.params.id,
        archivo,
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

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar la URL del archivo a eliminar',
        });
      }

      const cliente = await clientesService.eliminarArchivo(
        req.params.id,
        url,
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
  // ACTUALIZAR RIESGO
  // ============================================
  
  async actualizarRiesgo(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { riesgo } = req.body;

      if (typeof riesgo !== 'number' || riesgo < 0) {
        return res.status(400).json({
          success: false,
          message: 'El riesgo debe ser un número positivo',
        });
      }

      const cliente = await clientesService.actualizarRiesgo(
        req.params.id,
        riesgo,
        empresaId
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
        message: 'Riesgo actualizado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar riesgo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el riesgo',
      });
    }
  }
}

export const clientesController = new ClientesController();