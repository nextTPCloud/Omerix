import { Router } from 'express';
import { archivosController } from './archivos.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware, requireBusinessDatabase } from '@/middleware/tenant.middleware';
import { uploadSingle, uploadMultiple } from '@/middleware/upload.middleware';
import { checkStorageQuota } from '@/middleware/storage-quota.middleware';

const router = Router();

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireBusinessDatabase);

// Subir un archivo
router.post(
  '/upload',
  checkStorageQuota,
  uploadSingle,
  archivosController.uploadFile.bind(archivosController)
);

// Subir multiples archivos
router.post(
  '/upload-multiple',
  checkStorageQuota,
  uploadMultiple,
  archivosController.uploadMultiple.bind(archivosController)
);

// Listar archivos (query: modulo, entidadId, categoria)
router.get(
  '/',
  archivosController.listFiles.bind(archivosController)
);

// Obtener uso de almacenamiento
router.get(
  '/usage',
  archivosController.getStorageUsage.bind(archivosController)
);

// Obtener URL firmada para archivo privado
router.get(
  '/signed-url/*',
  archivosController.getSignedUrl.bind(archivosController)
);

// Eliminar archivo
router.delete(
  '/*',
  archivosController.deleteFile.bind(archivosController)
);

export default router;
