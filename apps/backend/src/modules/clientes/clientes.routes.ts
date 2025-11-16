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
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBody } from '@/middleware/validation.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gestión de clientes del ERP
 */

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

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - nif
 *               - tipoCliente
 *             properties:
 *               codigo:
 *                 type: string
 *                 description: Código del cliente (se genera automáticamente si no se proporciona)
 *               nombre:
 *                 type: string
 *                 description: Nombre completo o razón social
 *               nombreComercial:
 *                 type: string
 *                 description: Nombre comercial
 *               nif:
 *                 type: string
 *                 description: NIF/CIF del cliente
 *               email:
 *                 type: string
 *                 format: email
 *               telefono:
 *                 type: string
 *               tipoCliente:
 *                 type: string
 *                 enum: [empresa, particular]
 *               formaPago:
 *                 type: string
 *                 enum: [contado, transferencia, domiciliacion, confirming, pagare]
 *               limiteCredito:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente
 *       400:
 *         description: Datos inválidos o NIF duplicado
 *       401:
 *         description: No autenticado
 */
router.post(
  '/',
  validateBody(CreateClienteSchema),
  clientesController.create.bind(clientesController)
);

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Obtener todos los clientes con filtros y paginación
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, NIF, email
 *       - in: query
 *         name: tipoCliente
 *         schema:
 *           type: string
 *           enum: [empresa, particular]
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: formaPago
 *         schema:
 *           type: string
 *           enum: [contado, transferencia, domiciliacion, confirming, pagare]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lista de clientes obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: No autenticado
 */
router.get(
  '/',
  clientesController.findAll.bind(clientesController)
);

/**
 * @swagger
 * /clientes/sugerir-codigo:
 *   get:
 *     summary: Sugerir el siguiente código disponible
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefijo
 *         schema:
 *           type: string
 *         description: Prefijo del código (ej. CLI-, C-). Si no se proporciona, detecta el patrón más común
 *         example: CLI-
 *     responses:
 *       200:
 *         description: Código sugerido generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     codigo:
 *                       type: string
 *                       example: CLI-001
 *       401:
 *         description: No autenticado
 */
router.get(
  '/sugerir-codigo',
  clientesController.sugerirSiguienteCodigo.bind(clientesController)
);

/**
 * @swagger
 * /clientes/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     activos:
 *                       type: integer
 *                     inactivos:
 *                       type: integer
 *                     empresas:
 *                       type: integer
 *                     particulares:
 *                       type: integer
 *                     conRiesgo:
 *                       type: integer
 *       401:
 *         description: No autenticado
 */
router.get(
  '/estadisticas',
  clientesController.obtenerEstadisticas.bind(clientesController)
);

/**
 * @swagger
 * /clientes/exportar/csv:
 *   get:
 *     summary: Exportar clientes a CSV
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tipoCliente
 *         schema:
 *           type: string
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Archivo CSV generado
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: No autenticado
 */
router.get(
  '/exportar/csv',
  clientesController.exportarCSV.bind(clientesController)
);

/**
 * @swagger
 * /clientes/{id}:
 *   get:
 *     summary: Obtener un cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente obtenido exitosamente
 *       404:
 *         description: Cliente no encontrado
 *       401:
 *         description: No autenticado
 */
router.get(
  '/:id',
  clientesController.findById.bind(clientesController)
);

/**
 * @swagger
 * /clientes/{id}:
 *   put:
 *     summary: Actualizar un cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               nombreComercial:
 *                 type: string
 *               nif:
 *                 type: string
 *               email:
 *                 type: string
 *               telefono:
 *                 type: string
 *               tipoCliente:
 *                 type: string
 *                 enum: [empresa, particular]
 *               formaPago:
 *                 type: string
 *               limiteCredito:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente
 *       404:
 *         description: Cliente no encontrado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.put(
  '/:id',
  validateBody(UpdateClienteSchema),
  clientesController.update.bind(clientesController)
);

/**
 * @swagger
 * /clientes/{id}:
 *   delete:
 *     summary: Eliminar un cliente (soft delete)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente eliminado exitosamente
 *       404:
 *         description: Cliente no encontrado
 *       401:
 *         description: No autenticado
 */
router.delete(
  '/:id',
  clientesController.delete.bind(clientesController)
);

// ============================================
// RUTAS ESPECIALES
// ============================================

/**
 * @swagger
 * /clientes/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de IDs de clientes a eliminar
 *     responses:
 *       200:
 *         description: Clientes eliminados exitosamente
 *       400:
 *         description: IDs inválidos
 *       401:
 *         description: No autenticado
 */
router.post(
  '/bulk-delete',
  validateBody(BulkDeleteClientesSchema),
  clientesController.bulkDelete.bind(clientesController)
);

/**
 * @swagger
 * /clientes/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de un cliente (activar/desactivar)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activo
 *             properties:
 *               activo:
 *                 type: boolean
 *                 description: true para activar, false para desactivar
 *     responses:
 *       200:
 *         description: Estado cambiado exitosamente
 *       404:
 *         description: Cliente no encontrado
 *       401:
 *         description: No autenticado
 */
router.patch(
  '/:id/estado',
  validateBody(ChangeStatusSchema),
  clientesController.changeStatus.bind(clientesController)
);

/**
 * @swagger
 * /clientes/{id}/archivos:
 *   post:
 *     summary: Subir un archivo a un cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a subir (máx 10MB, PDF, imágenes, Word, Excel)
 *     responses:
 *       200:
 *         description: Archivo subido exitosamente
 *       400:
 *         description: Archivo no válido o demasiado grande
 *       404:
 *         description: Cliente no encontrado
 *       401:
 *         description: No autenticado
 */
router.post(
  '/:id/archivos',
  upload.single('archivo'),
  clientesController.subirArchivo.bind(clientesController)
);

/**
 * @swagger
 * /clientes/{id}/archivos:
 *   delete:
 *     summary: Eliminar un archivo de un cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL del archivo a eliminar
 *     responses:
 *       200:
 *         description: Archivo eliminado exitosamente
 *       404:
 *         description: Cliente o archivo no encontrado
 *       401:
 *         description: No autenticado
 */
router.delete(
  '/:id/archivos',
  clientesController.eliminarArchivo.bind(clientesController)
);

export default router;