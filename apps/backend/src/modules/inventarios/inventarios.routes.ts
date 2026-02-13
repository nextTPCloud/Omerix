import { Router } from 'express';
import { inventariosController } from './inventarios.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware, requireBusinessDatabase } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireBusinessDatabase);

/**
 * @swagger
 * tags:
 *   name: Inventarios
 *   description: Gestión de inventarios físicos
 */

/**
 * @swagger
 * /api/inventarios/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de inventarios
 *     tags: [Inventarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de inventarios
 */
router.get('/estadisticas', inventariosController.estadisticas.bind(inventariosController));

/**
 * @swagger
 * /api/inventarios:
 *   get:
 *     summary: Listar inventarios con filtros
 *     tags: [Inventarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: almacenId
 *         schema:
 *           type: string
 *         description: Filtrar por almacén
 *     responses:
 *       200:
 *         description: Lista de inventarios
 */
router.get('/', inventariosController.listar.bind(inventariosController));

/**
 * @swagger
 * /api/inventarios/{id}:
 *   get:
 *     summary: Obtener inventario por ID
 *     tags: [Inventarios]
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
 *         description: Detalle del inventario
 *       404:
 *         description: Inventario no encontrado
 */
router.get('/:id', inventariosController.obtenerPorId.bind(inventariosController));

/**
 * @swagger
 * /api/inventarios:
 *   post:
 *     summary: Crear nuevo inventario
 *     tags: [Inventarios]
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
 *         description: Inventario creado
 */
router.post('/', inventariosController.crear.bind(inventariosController));

/**
 * @swagger
 * /api/inventarios/{id}/iniciar:
 *   post:
 *     summary: Iniciar inventario (pasar a EN_CONTEO)
 *     tags: [Inventarios]
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
 *         description: Inventario iniciado
 */
router.post('/:id/iniciar', inventariosController.iniciar.bind(inventariosController));

/**
 * @swagger
 * /api/inventarios/{id}/conteos:
 *   put:
 *     summary: Actualizar conteos de múltiples líneas
 *     tags: [Inventarios]
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
 *         description: Conteos actualizados
 */
router.put('/:id/conteos', inventariosController.actualizarConteos.bind(inventariosController));

/**
 * @swagger
 * /api/inventarios/{id}/lineas/{lineaId}/conteo:
 *   put:
 *     summary: Actualizar conteo de una línea específica
 *     tags: [Inventarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: lineaId
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
 *         description: Conteo actualizado
 */
router.put('/:id/lineas/:lineaId/conteo', inventariosController.actualizarConteoLinea.bind(inventariosController));

/**
 * @swagger
 * /api/inventarios/{id}/finalizar-conteo:
 *   post:
 *     summary: Finalizar conteo (pasar a PENDIENTE_REVISION)
 *     tags: [Inventarios]
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
 *         description: Conteo finalizado
 */
router.post('/:id/finalizar-conteo', inventariosController.finalizarConteo.bind(inventariosController));

/**
 * @swagger
 * /api/inventarios/{id}/revisar-diferencias:
 *   put:
 *     summary: Revisar diferencias (aprobar/rechazar ajustes)
 *     tags: [Inventarios]
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
 *         description: Diferencias revisadas
 */
router.put('/:id/revisar-diferencias', inventariosController.revisarDiferencias.bind(inventariosController));

/**
 * @swagger
 * /api/inventarios/{id}/regularizar:
 *   post:
 *     summary: Regularizar inventario (aplicar ajustes aprobados)
 *     tags: [Inventarios]
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
 *         description: Inventario regularizado
 */
router.post('/:id/regularizar', inventariosController.regularizar.bind(inventariosController));

/**
 * @swagger
 * /api/inventarios/{id}/anular:
 *   post:
 *     summary: Anular inventario
 *     tags: [Inventarios]
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
 *         description: Inventario anulado
 */
router.post('/:id/anular', inventariosController.anular.bind(inventariosController));

export default router;
