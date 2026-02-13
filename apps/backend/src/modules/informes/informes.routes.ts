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
 * @swagger
 * /api/informes/ai/generar:
 *   post:
 *     summary: Generar informe con IA desde comando de voz/texto
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comando:
 *                 type: string
 *                 description: Comando en lenguaje natural
 *     responses:
 *       200:
 *         description: Informe generado
 */
router.post('/ai/generar', informesController.generarConIA.bind(informesController));

/**
 * @swagger
 * /api/informes/ai/sugerencias:
 *   get:
 *     summary: Obtener sugerencias de comandos para IA
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sugerencias
 */
router.get('/ai/sugerencias', informesController.obtenerSugerenciasIA.bind(informesController));

/**
 * @swagger
 * /api/informes/catalogo:
 *   get:
 *     summary: Obtener catálogo de colecciones y campos disponibles
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Catálogo de colecciones
 */
router.get('/catalogo', informesController.obtenerCatalogo.bind(informesController));

/**
 * @swagger
 * /api/informes/plantillas:
 *   get:
 *     summary: Obtener plantillas predefinidas
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de plantillas
 */
router.get('/plantillas', informesController.obtenerPlantillas.bind(informesController));

/**
 * @swagger
 * /api/informes/inicializar-plantillas:
 *   post:
 *     summary: Inicializar plantillas predefinidas
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forzar:
 *                 type: boolean
 *                 description: Forzar reinicialización de plantillas existentes
 *     responses:
 *       200:
 *         description: Plantillas inicializadas
 */
router.post('/inicializar-plantillas', informesController.inicializarPlantillas.bind(informesController));

/**
 * @swagger
 * /api/informes/debug:
 *   get:
 *     summary: Debug - ver informes directamente (TEMPORAL)
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos de debug
 */
router.get('/debug', informesController.debug.bind(informesController));

/**
 * @swagger
 * /api/informes:
 *   get:
 *     summary: Listar informes
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: modulo
 *         schema:
 *           type: string
 *         description: Filtrar por módulo
 *       - in: query
 *         name: favorito
 *         schema:
 *           type: boolean
 *         description: Solo favoritos
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Texto de búsqueda
 *     responses:
 *       200:
 *         description: Lista de informes
 */
router.get('/', requirePermission('informes', 'read'), informesController.listar.bind(informesController));

/**
 * @swagger
 * /api/informes/nuevo:
 *   get:
 *     summary: Obtener datos iniciales para crear un nuevo informe
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Catálogo y plantillas para nuevo informe
 */
router.get('/nuevo', requirePermission('informes', 'create'), informesController.datosNuevoInforme.bind(informesController));

/**
 * @swagger
 * /api/informes/{id}:
 *   get:
 *     summary: Obtener informe por ID
 *     tags: [Informes]
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
 *         description: Detalle del informe
 *       404:
 *         description: Informe no encontrado
 */
router.get('/:id', requirePermission('informes', 'read'), informesController.obtenerPorId.bind(informesController));

/**
 * @swagger
 * /api/informes:
 *   post:
 *     summary: Crear nuevo informe
 *     tags: [Informes]
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
 *         description: Informe creado
 */
router.post('/', requirePermission('informes', 'create'), informesController.crear.bind(informesController));

/**
 * @swagger
 * /api/informes/{id}:
 *   put:
 *     summary: Actualizar informe
 *     tags: [Informes]
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
 *         description: Informe actualizado
 */
router.put('/:id', requirePermission('informes', 'update'), informesController.actualizar.bind(informesController));

/**
 * @swagger
 * /api/informes/{id}:
 *   delete:
 *     summary: Eliminar informe
 *     tags: [Informes]
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
 *         description: Informe eliminado
 */
router.delete('/:id', requirePermission('informes', 'delete'), informesController.eliminar.bind(informesController));

/**
 * @swagger
 * /api/informes/{id}/duplicar:
 *   post:
 *     summary: Duplicar informe
 *     tags: [Informes]
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
 *         description: Informe duplicado
 */
router.post('/:id/duplicar', requirePermission('informes', 'create'), informesController.duplicar.bind(informesController));

/**
 * @swagger
 * /api/informes/{id}/favorito:
 *   post:
 *     summary: Toggle favorito de un informe
 *     tags: [Informes]
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
 *         description: Favorito actualizado
 */
router.post('/:id/favorito', requirePermission('informes', 'update'), informesController.toggleFavorito.bind(informesController));

/**
 * @swagger
 * /api/informes/{id}/ejecutar:
 *   post:
 *     summary: Ejecutar informe y obtener datos
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Parámetros de ejecución del informe
 *     responses:
 *       200:
 *         description: Datos del informe ejecutado
 */
router.post('/:id/ejecutar', requirePermission('informes', 'read'), informesController.ejecutar.bind(informesController));

/**
 * @swagger
 * /api/informes/{id}/exportar:
 *   post:
 *     summary: Exportar informe a Excel, PDF o CSV
 *     tags: [Informes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               formato:
 *                 type: string
 *                 enum: [excel, pdf, csv]
 *     responses:
 *       200:
 *         description: Archivo exportado
 */
router.post('/:id/exportar', requirePermission('informes', 'export'), informesController.exportar.bind(informesController));

export default router;
