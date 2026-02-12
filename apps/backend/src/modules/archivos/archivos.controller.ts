import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ArchivoMetadata from './ArchivoMetadata';
import StorageUsage from './StorageUsage';
import storageService from '@/services/storage.service';

class ArchivosController {

  /**
   * Subir un archivo
   */
  async uploadFile(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
      }

      const { modulo, entidadId, categoria, isPublic, generateThumbnails } = req.body;

      if (!modulo || !entidadId) {
        return res.status(400).json({ success: false, message: 'modulo y entidadId son requeridos' });
      }

      const result = await storageService.uploadFile({
        empresaId: req.empresaId,
        modulo,
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        isPublic: isPublic === 'true' || isPublic === true,
        generateThumbnails: generateThumbnails === 'true' || generateThumbnails === true,
      });

      // Guardar metadata
      const metadata = await ArchivoMetadata.create({
        empresaId: new mongoose.Types.ObjectId(req.empresaId),
        modulo,
        entidadId: new mongoose.Types.ObjectId(entidadId),
        categoria: categoria || undefined,
        nombre: req.file.originalname,
        key: result.key,
        url: result.url,
        mimeType: req.file.mimetype,
        size: result.size,
        thumbnails: result.thumbnails ? new Map(Object.entries(result.thumbnails)) : undefined,
        isPublic: isPublic === 'true' || isPublic === true,
        uploadedBy: new mongoose.Types.ObjectId(req.userId),
      });

      // Actualizar uso de almacenamiento
      await this.updateStorageUsage(req.empresaId, modulo, result.size, 1);

      res.status(201).json({
        success: true,
        data: metadata,
        message: 'Archivo subido exitosamente',
      });
    } catch (error: any) {
      console.error('Error al subir archivo:', error);
      res.status(500).json({ success: false, message: error.message || 'Error al subir el archivo' });
    }
  }

  /**
   * Subir multiples archivos
   */
  async uploadMultiple(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No se han subido archivos' });
      }

      const { modulo, entidadId, categoria, isPublic, generateThumbnails } = req.body;

      if (!modulo || !entidadId) {
        return res.status(400).json({ success: false, message: 'modulo y entidadId son requeridos' });
      }

      const results = [];
      let totalSize = 0;

      for (const file of files) {
        const result = await storageService.uploadFile({
          empresaId: req.empresaId,
          modulo,
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          isPublic: isPublic === 'true' || isPublic === true,
          generateThumbnails: generateThumbnails === 'true' || generateThumbnails === true,
        });

        const metadata = await ArchivoMetadata.create({
          empresaId: new mongoose.Types.ObjectId(req.empresaId),
          modulo,
          entidadId: new mongoose.Types.ObjectId(entidadId),
          categoria: categoria || undefined,
          nombre: file.originalname,
          key: result.key,
          url: result.url,
          mimeType: file.mimetype,
          size: result.size,
          thumbnails: result.thumbnails ? new Map(Object.entries(result.thumbnails)) : undefined,
          isPublic: isPublic === 'true' || isPublic === true,
          uploadedBy: new mongoose.Types.ObjectId(req.userId),
        });

        totalSize += result.size;
        results.push(metadata);
      }

      // Actualizar uso de almacenamiento
      await this.updateStorageUsage(req.empresaId, modulo, totalSize, files.length);

      res.status(201).json({
        success: true,
        data: results,
        message: `${results.length} archivos subidos exitosamente`,
      });
    } catch (error: any) {
      console.error('Error al subir archivos:', error);
      res.status(500).json({ success: false, message: error.message || 'Error al subir archivos' });
    }
  }

  /**
   * Eliminar un archivo
   */
  async deleteFile(req: Request, res: Response) {
    try {
      if (!req.empresaId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const key = req.params[0] || req.params.key;
      if (!key) {
        return res.status(400).json({ success: false, message: 'key es requerido' });
      }

      // Verificar ownership por empresaId
      const metadata = await ArchivoMetadata.findOne({ key, empresaId: req.empresaId });
      if (!metadata) {
        return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
      }

      // Eliminar de almacenamiento
      await storageService.deleteFile(key);

      // Eliminar metadata
      const size = metadata.size;
      const modulo = metadata.modulo;
      await ArchivoMetadata.deleteOne({ _id: metadata._id });

      // Actualizar uso de almacenamiento
      await this.updateStorageUsage(req.empresaId, modulo, -size, -1);

      res.json({ success: true, message: 'Archivo eliminado exitosamente' });
    } catch (error: any) {
      console.error('Error al eliminar archivo:', error);
      res.status(500).json({ success: false, message: error.message || 'Error al eliminar el archivo' });
    }
  }

  /**
   * Obtener URL firmada para archivo privado
   */
  async getSignedUrl(req: Request, res: Response) {
    try {
      if (!req.empresaId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const key = req.params[0] || req.params.key;

      // Verificar ownership
      const metadata = await ArchivoMetadata.findOne({ key, empresaId: req.empresaId });
      if (!metadata) {
        return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
      }

      const signedUrl = await storageService.getSignedUrl(key);

      res.json({ success: true, data: { url: signedUrl } });
    } catch (error: any) {
      console.error('Error al obtener URL firmada:', error);
      res.status(500).json({ success: false, message: error.message || 'Error al obtener URL firmada' });
    }
  }

  /**
   * Listar archivos por modulo/entidadId
   */
  async listFiles(req: Request, res: Response) {
    try {
      if (!req.empresaId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const { modulo, entidadId, categoria } = req.query;

      const filter: any = { empresaId: req.empresaId };
      if (modulo) filter.modulo = modulo;
      if (entidadId) filter.entidadId = entidadId;
      if (categoria) filter.categoria = categoria;

      const archivos = await ArchivoMetadata.find(filter)
        .sort({ uploadedAt: -1 })
        .lean();

      res.json({ success: true, data: archivos });
    } catch (error: any) {
      console.error('Error al listar archivos:', error);
      res.status(500).json({ success: false, message: error.message || 'Error al listar archivos' });
    }
  }

  /**
   * Obtener uso de almacenamiento
   */
  async getStorageUsage(req: Request, res: Response) {
    try {
      if (!req.empresaId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      let usage = await StorageUsage.findOne({ empresaId: req.empresaId });
      if (!usage) {
        usage = await StorageUsage.create({
          empresaId: new mongoose.Types.ObjectId(req.empresaId),
          usedBytes: 0,
          limitBytes: 1 * 1024 * 1024 * 1024, // 1GB default
          fileCount: 0,
        });
      }

      res.json({
        success: true,
        data: {
          usedBytes: usage.usedBytes,
          limitBytes: usage.limitBytes,
          usedGB: +(usage.usedBytes / (1024 * 1024 * 1024)).toFixed(3),
          limitGB: +(usage.limitBytes / (1024 * 1024 * 1024)).toFixed(1),
          fileCount: usage.fileCount,
          percentUsed: usage.limitBytes > 0 ? +((usage.usedBytes / usage.limitBytes) * 100).toFixed(1) : 0,
          breakdown: usage.breakdown,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener uso de almacenamiento:', error);
      res.status(500).json({ success: false, message: error.message || 'Error al obtener uso' });
    }
  }

  /**
   * Actualizar contadores de almacenamiento
   */
  private async updateStorageUsage(empresaId: string, modulo: string, sizeChange: number, countChange: number) {
    try {
      await StorageUsage.findOneAndUpdate(
        { empresaId },
        {
          $inc: {
            usedBytes: sizeChange,
            fileCount: countChange,
            [`breakdown.${modulo}.bytes`]: sizeChange,
            [`breakdown.${modulo}.count`]: countChange,
          },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error actualizando uso de almacenamiento:', error);
    }
  }
}

export const archivosController = new ArchivosController();
