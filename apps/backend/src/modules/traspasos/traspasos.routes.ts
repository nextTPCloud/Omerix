import { Router } from 'express';
import { traspasosController } from './traspasos.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Traspasos
 *   description: Gestión de traspasos entre almacenes
 */

/**
 * @swagger
 * /api/traspasos/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de traspasos
 *     tags: [Traspasos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de traspasos
 */
router.get('/estadisticas', traspasosController.estadisticas.bind(traspasosController));

/**
 * @swagger
 * /api/traspasos:
 *   get:
 *     summary: Listar traspasos con filtros
 *     tags: [Traspasos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de traspasos
 */
router.get('/', traspasosController.listar.bind(traspasosController));

/**
 * @swagger
 * /api/traspasos/{id}:
 *   get:
 *     summary: Obtener traspaso por ID
 *     tags: [Traspasos]
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
 *         description: Detalle del traspaso
 */
router.get('/:id', traspasosController.obtenerPorId.bind(traspasosController));

/**
 * @swagger
 * /api/traspasos:
 *   post:
 *     summary: Crear nuevo traspaso
 *     tags: [Traspasos]
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
 *         description: Traspaso creado
 */
router.post('/', traspasosController.crear.bind(traspasosController));

/**
 * @swagger
 * /api/traspasos/{id}:
 *   put:
 *     summary: Actualizar traspaso (solo en borrador)
 *     tags: [Traspasos]
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
 *         description: Traspaso actualizado
 */
router.put('/:id', traspasosController.actualizar.bind(traspasosController));

/**
 * @swagger
 * /api/traspasos/{id}/confirmar-salida:
 *   post:
 *     summary: Confirmar salida del almacén origen
 *     tags: [Traspasos]
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
 *         description: Salida confirmada
 */
router.post('/:id/confirmar-salida', traspasosController.confirmarSalida.bind(traspasosController));

/**
 * @swagger
 * /api/traspasos/{id}/confirmar-recepcion:
 *   post:
 *     summary: Confirmar recepción en almacén destino
 *     tags: [Traspasos]
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
 *         description: Recepción confirmada
 */
router.post('/:id/confirmar-recepcion', traspasosController.confirmarRecepcion.bind(traspasosController));

/**
 * @swagger
 * /api/traspasos/{id}/anular:
 *   post:
 *     summary: Anular traspaso
 *     tags: [Traspasos]
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
 *         description: Traspaso anulado
 */
router.post('/:id/anular', traspasosController.anular.bind(traspasosController));

export default router;
