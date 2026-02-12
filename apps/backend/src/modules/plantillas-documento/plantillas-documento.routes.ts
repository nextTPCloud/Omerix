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
 * GET /api/plantillas-documento/estilos
 * Obtener estilos disponibles (moderno, clásico, minimalista, etc.)
 */
router.get('/estilos', plantillasDocumentoController.obtenerEstilos.bind(plantillasDocumentoController));

/**
 * GET /api/plantillas-documento/tipos-documento
 * Obtener tipos de documento disponibles (factura, presupuesto, albaran, etc.)
 */
router.get('/tipos-documento', plantillasDocumentoController.obtenerTiposDocumento.bind(plantillasDocumentoController));

/**
 * POST /api/plantillas-documento/inicializar
 * Inicializar plantillas predefinidas
 */
router.post(
  '/inicializar',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.inicializar.bind(plantillasDocumentoController)
);

/**
 * GET /api/plantillas-documento/tipo/:tipoDocumento
 * Obtener plantillas por tipo de documento
 */
router.get(
  '/tipo/:tipoDocumento',
  plantillasDocumentoController.obtenerPorTipo.bind(plantillasDocumentoController)
);

/**
 * GET /api/plantillas-documento/predeterminada/:tipoDocumento
 * Obtener plantilla predeterminada por tipo de documento
 */
router.get(
  '/predeterminada/:tipoDocumento',
  plantillasDocumentoController.obtenerPredeterminada.bind(plantillasDocumentoController)
);

/**
 * GET /api/plantillas-documento
 * Listar plantillas con filtros y paginación
 */
router.get(
  '/',
  plantillasDocumentoController.listar.bind(plantillasDocumentoController)
);

/**
 * GET /api/plantillas-documento/:id
 * Obtener plantilla por ID
 */
router.get(
  '/:id',
  plantillasDocumentoController.obtenerPorId.bind(plantillasDocumentoController)
);

/**
 * POST /api/plantillas-documento
 * Crear nueva plantilla
 */
router.post(
  '/',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.crear.bind(plantillasDocumentoController)
);

/**
 * PUT /api/plantillas-documento/:id
 * Actualizar plantilla
 */
router.put(
  '/:id',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.actualizar.bind(plantillasDocumentoController)
);

/**
 * DELETE /api/plantillas-documento/:id
 * Eliminar plantilla
 */
router.delete(
  '/:id',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.eliminar.bind(plantillasDocumentoController)
);

/**
 * POST /api/plantillas-documento/:id/duplicar
 * Duplicar plantilla
 */
router.post(
  '/:id/duplicar',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.duplicar.bind(plantillasDocumentoController)
);

/**
 * POST /api/plantillas-documento/:id/predeterminada
 * Establecer plantilla como predeterminada
 */
router.post(
  '/:id/predeterminada',
  requirePermission('configuracion', 'update'),
  plantillasDocumentoController.establecerPredeterminada.bind(plantillasDocumentoController)
);

export default router;
