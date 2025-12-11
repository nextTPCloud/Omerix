import { Router } from 'express';
import { albaranesCompraController } from './albaranes-compra.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

/**
 * @swagger
 * /api/albaranes-compra:
 *   get:
 *     summary: Listar albaranes de compra
 *     tags: [Albaranes de Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por código, proveedor, título, etc.
 *       - in: query
 *         name: proveedorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [borrador, pendiente_recepcion, recibido_parcial, recibido, facturado, anulado]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de albaranes de compra
 */
router.get('/', albaranesCompraController.listar.bind(albaranesCompraController));

/**
 * @swagger
 * /api/albaranes-compra/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de albaranes de compra
 *     tags: [Albaranes de Compra]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 */
router.get('/estadisticas', albaranesCompraController.obtenerEstadisticas.bind(albaranesCompraController));

/**
 * @swagger
 * /api/albaranes-compra/desde-pedido:
 *   post:
 *     summary: Crear albarán de compra desde pedido de compra
 *     tags: [Albaranes de Compra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pedidoCompraId
 *             properties:
 *               pedidoCompraId:
 *                 type: string
 *               lineasIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               recibirTodo:
 *                 type: boolean
 *               almacenId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Albarán de compra creado desde pedido
 */
router.post('/desde-pedido', albaranesCompraController.crearDesdePedidoCompra.bind(albaranesCompraController));

/**
 * @swagger
 * /api/albaranes-compra/bulk/delete:
 *   post:
 *     summary: Eliminar múltiples albaranes de compra
 *     tags: [Albaranes de Compra]
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
 *     responses:
 *       200:
 *         description: Albaranes eliminados
 */
router.post('/bulk/delete', albaranesCompraController.eliminarMultiples.bind(albaranesCompraController));

/**
 * @swagger
 * /api/albaranes-compra/{id}:
 *   get:
 *     summary: Obtener albarán de compra por ID
 *     tags: [Albaranes de Compra]
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
 *         description: Albarán de compra obtenido
 *       404:
 *         description: Albarán no encontrado
 */
router.get('/:id', albaranesCompraController.obtenerPorId.bind(albaranesCompraController));

/**
 * @swagger
 * /api/albaranes-compra:
 *   post:
 *     summary: Crear nuevo albarán de compra
 *     tags: [Albaranes de Compra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proveedorId
 *               - almacenId
 *             properties:
 *               proveedorId:
 *                 type: string
 *               almacenId:
 *                 type: string
 *               lineas:
 *                 type: array
 *     responses:
 *       201:
 *         description: Albarán de compra creado
 */
router.post('/', albaranesCompraController.crear.bind(albaranesCompraController));

/**
 * @swagger
 * /api/albaranes-compra/{id}:
 *   put:
 *     summary: Actualizar albarán de compra
 *     tags: [Albaranes de Compra]
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
 *         description: Albarán de compra actualizado
 */
router.put('/:id', albaranesCompraController.actualizar.bind(albaranesCompraController));

/**
 * @swagger
 * /api/albaranes-compra/{id}/recepcion:
 *   post:
 *     summary: Registrar recepción de mercancía
 *     tags: [Albaranes de Compra]
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
 *             required:
 *               - lineasRecibidas
 *             properties:
 *               fechaRecepcion:
 *                 type: string
 *                 format: date-time
 *               lineasRecibidas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - lineaId
 *                     - cantidadRecibida
 *                   properties:
 *                     lineaId:
 *                       type: string
 *                     cantidadRecibida:
 *                       type: number
 *                     lote:
 *                       type: string
 *                     numeroSerie:
 *                       type: string
 *     responses:
 *       200:
 *         description: Recepción registrada
 */
router.post('/:id/recepcion', albaranesCompraController.registrarRecepcion.bind(albaranesCompraController));

/**
 * @swagger
 * /api/albaranes-compra/{id}/estado:
 *   patch:
 *     summary: Cambiar estado del albarán de compra
 *     tags: [Albaranes de Compra]
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
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [borrador, pendiente_recepcion, recibido_parcial, recibido, facturado, anulado]
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:id/estado', albaranesCompraController.cambiarEstado.bind(albaranesCompraController));

/**
 * @swagger
 * /api/albaranes-compra/{id}/duplicar:
 *   post:
 *     summary: Duplicar albarán de compra
 *     tags: [Albaranes de Compra]
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
 *         description: Albarán de compra duplicado
 */
router.post('/:id/duplicar', albaranesCompraController.duplicar.bind(albaranesCompraController));

/**
 * @swagger
 * /api/albaranes-compra/{id}:
 *   delete:
 *     summary: Eliminar albarán de compra
 *     tags: [Albaranes de Compra]
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
 *         description: Albarán de compra eliminado
 */
router.delete('/:id', albaranesCompraController.eliminar.bind(albaranesCompraController));

export default router;
