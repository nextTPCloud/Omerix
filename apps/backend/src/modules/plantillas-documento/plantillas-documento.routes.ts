// apps/backend/src/modules/plantillas-documento/plantillas-documento.routes.ts
// Rutas para gestión de plantillas de diseño de documentos

import { Router } from 'express';
import { plantillasDocumentoController } from './plantillas-documento.controller';
import { authMiddleware, requirePermission } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Plantillas de Documento
 *   description: Gestión de plantillas de diseño para facturas, presupuestos, albaranes, etc.
 */

/**
 * @swagger
 * /api/plantillas-documento/estilos:
 *   get:
 *     summary: Obtener estilos disponibles (moderno, clásico, minimalista, etc.)
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estilos
 */
router.get('/estilos', plantillasDocumentoController.obtenerEstilos.bind(plantillasDocumentoController));

/**
 * @swagger
 * /api/plantillas-documento/tipos-documento:
 *   get:
 *     summary: Obtener tipos de documento disponibles
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de documento
 */
router.get('/tipos-documento', plantillasDocumentoController.obtenerTiposDocumento.bind(plantillasDocumentoController));

/**
 * @swagger
 * /api/plantillas-documento/inicializar:
 *   post:
 *     summary: Inicializar plantillas predefinidas
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plantillas inicializadas
 */
router.post(
  '/inicializar',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.inicializar.bind(plantillasDocumentoController)
);

/**
 * @swagger
 * /api/plantillas-documento/tipo/{tipoDocumento}:
 *   get:
 *     summary: Obtener plantillas por tipo de documento
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipoDocumento
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plantillas del tipo indicado
 */
router.get(
  '/tipo/:tipoDocumento',
  plantillasDocumentoController.obtenerPorTipo.bind(plantillasDocumentoController)
);

/**
 * @swagger
 * /api/plantillas-documento/predeterminada/{tipoDocumento}:
 *   get:
 *     summary: Obtener plantilla predeterminada por tipo de documento
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipoDocumento
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plantilla predeterminada
 */
router.get(
  '/predeterminada/:tipoDocumento',
  plantillasDocumentoController.obtenerPredeterminada.bind(plantillasDocumentoController)
);

/**
 * @swagger
 * /api/plantillas-documento:
 *   get:
 *     summary: Listar plantillas con filtros y paginación
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de plantillas
 */
router.get(
  '/',
  plantillasDocumentoController.listar.bind(plantillasDocumentoController)
);

/**
 * @swagger
 * /api/plantillas-documento/{id}:
 *   get:
 *     summary: Obtener plantilla por ID
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle de la plantilla
 */
router.get(
  '/:id',
  plantillasDocumentoController.obtenerPorId.bind(plantillasDocumentoController)
);

/**
 * @swagger
 * /api/plantillas-documento:
 *   post:
 *     summary: Crear nueva plantilla
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Plantilla creada
 */
router.post(
  '/',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.crear.bind(plantillasDocumentoController)
);

/**
 * @swagger
 * /api/plantillas-documento/{id}:
 *   put:
 *     summary: Actualizar plantilla
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Plantilla actualizada
 */
router.put(
  '/:id',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.actualizar.bind(plantillasDocumentoController)
);

/**
 * @swagger
 * /api/plantillas-documento/{id}:
 *   delete:
 *     summary: Eliminar plantilla
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plantilla eliminada
 */
router.delete(
  '/:id',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.eliminar.bind(plantillasDocumentoController)
);

/**
 * @swagger
 * /api/plantillas-documento/{id}/duplicar:
 *   post:
 *     summary: Duplicar plantilla
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Plantilla duplicada
 */
router.post(
  '/:id/duplicar',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.duplicar.bind(plantillasDocumentoController)
);

/**
 * @swagger
 * /api/plantillas-documento/{id}/predeterminada:
 *   post:
 *     summary: Establecer plantilla como predeterminada
 *     tags: [Plantillas de Documento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plantilla establecida como predeterminada
 */
router.post(
  '/:id/predeterminada',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.establecerPredeterminada.bind(plantillasDocumentoController)
);

export default router;
