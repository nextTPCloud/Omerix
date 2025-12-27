import { Router } from 'express';
import { informesController } from './informes.controller';
import { authMiddleware, requirePermission } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// NOTA: No se aplica requireModuleAccess aquí porque informes es accesible
// desde cualquier plan. Las pestañas se filtran en el frontend según los
// módulos contratados (ventas, compras, rrhh, etc.)

/**
 * @swagger
 * tags:
 *   name: Informes
 *   description: Gestion de informes personalizados
 */

/**
 * POST /api/informes/ai/generar
 * Generar informe con IA desde comando de voz/texto
 */
router.post('/ai/generar', informesController.generarConIA.bind(informesController));

/**
 * GET /api/informes/ai/sugerencias
 * Obtener sugerencias de comandos para IA
 */
router.get('/ai/sugerencias', informesController.obtenerSugerenciasIA.bind(informesController));

/**
 * GET /api/informes/catalogo
 * Obtener catálogo de colecciones y campos
 */
router.get('/catalogo', informesController.obtenerCatalogo.bind(informesController));

/**
 * GET /api/informes/plantillas
 * Obtener plantillas predefinidas
 */
router.get('/plantillas', informesController.obtenerPlantillas.bind(informesController));

/**
 * POST /api/informes/inicializar-plantillas
 * Inicializar plantillas predefinidas
 */
router.post('/inicializar-plantillas', informesController.inicializarPlantillas.bind(informesController));

/**
 * GET /api/informes
 * Listar informes
 */
router.get('/', requirePermission('informes', 'read'), informesController.listar.bind(informesController));

/**
 * GET /api/informes/nuevo
 * Obtener datos iniciales para crear un nuevo informe (catálogo + plantillas)
 */
router.get('/nuevo', requirePermission('informes', 'create'), informesController.datosNuevoInforme.bind(informesController));

/**
 * GET /api/informes/:id
 * Obtener informe por ID
 */
router.get('/:id', requirePermission('informes', 'read'), informesController.obtenerPorId.bind(informesController));

/**
 * POST /api/informes
 * Crear nuevo informe
 */
router.post('/', requirePermission('informes', 'create'), informesController.crear.bind(informesController));

/**
 * PUT /api/informes/:id
 * Actualizar informe
 */
router.put('/:id', requirePermission('informes', 'update'), informesController.actualizar.bind(informesController));

/**
 * DELETE /api/informes/:id
 * Eliminar informe
 */
router.delete('/:id', requirePermission('informes', 'delete'), informesController.eliminar.bind(informesController));

/**
 * POST /api/informes/:id/duplicar
 * Duplicar informe
 */
router.post('/:id/duplicar', requirePermission('informes', 'create'), informesController.duplicar.bind(informesController));

/**
 * POST /api/informes/:id/favorito
 * Toggle favorito
 */
router.post('/:id/favorito', requirePermission('informes', 'update'), informesController.toggleFavorito.bind(informesController));

/**
 * POST /api/informes/:id/ejecutar
 * Ejecutar informe y obtener datos
 */
router.post('/:id/ejecutar', requirePermission('informes', 'read'), informesController.ejecutar.bind(informesController));

/**
 * POST /api/informes/:id/exportar
 * Exportar informe
 */
router.post('/:id/exportar', requirePermission('informes', 'export'), informesController.exportar.bind(informesController));

export default router;
