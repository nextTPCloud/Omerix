import { Router } from 'express';
import { clientesController } from './clientes.controller';

import { 
  CreateClienteSchema, 
  UpdateClienteSchema, 
  BulkDeleteClientesSchema,
  ChangeStatusSchema,
} from './clientes.dto';
import multer from 'multer';
import { authMiddleware } from '@/middleware/auth.middleware';
import { validateBody } from '@/middleware/validation.middleware';

const router = Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/clientes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir solo ciertos tipos de archivos
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

// Crear cliente
router.post(
  '/',
  validateBody(CreateClienteSchema),
  clientesController.create.bind(clientesController)
);

// Obtener todos los clientes (con filtros y paginación)
router.get(
  '/',
  clientesController.findAll.bind(clientesController)
);

// Obtener estadísticas
router.get(
  '/estadisticas',
  clientesController.obtenerEstadisticas.bind(clientesController)
);

// Exportar a CSV
router.get(
  '/exportar/csv',
  clientesController.exportarCSV.bind(clientesController)
);

// Obtener cliente por ID
router.get(
  '/:id',
  clientesController.findById.bind(clientesController)
);

// Actualizar cliente
router.put(
  '/:id',
  validateBody(UpdateClienteSchema),
  clientesController.update.bind(clientesController)
);

// Eliminar cliente
router.delete(
  '/:id',
  clientesController.delete.bind(clientesController)
);

// ============================================
// RUTAS ESPECIALES
// ============================================

// Eliminación múltiple
router.post(
  '/bulk-delete',
  validateBody(BulkDeleteClientesSchema),
  clientesController.bulkDelete.bind(clientesController)
);

// Cambiar estado (activar/desactivar)
router.patch(
  '/:id/estado',
  validateBody(ChangeStatusSchema),
  clientesController.changeStatus.bind(clientesController)
);

// Subir archivo
router.post(
  '/:id/archivos',
  upload.single('archivo'),
  clientesController.subirArchivo.bind(clientesController)
);

// Eliminar archivo
router.delete(
  '/:id/archivos',
  clientesController.eliminarArchivo.bind(clientesController)
);

export default router;