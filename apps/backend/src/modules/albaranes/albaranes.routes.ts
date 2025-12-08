import { Router } from 'express';
import { albaranesController } from './albaranes.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Albaranes
 *   description: Gestión de albaranes de entrega
 */

// ============================================
// RUTAS ESPECIALES (antes de :id)
// ============================================

/**
 * @swagger
 * /api/albaranes/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de albaranes
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de albaranes
 */
router.get('/estadisticas', albaranesController.estadisticas);

/**
 * @swagger
 * /api/albaranes/desde-pedido/{pedidoId}:
 *   post:
 *     summary: Crear albarán desde un pedido existente
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pedidoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pedido origen
 *     responses:
 *       201:
 *         description: Albarán creado correctamente
 *       404:
 *         description: Pedido no encontrado
 */
router.post('/desde-pedido/:pedidoId', albaranesController.crearDesdePedido);

/**
 * @swagger
 * /api/albaranes/pedido/{pedidoId}:
 *   get:
 *     summary: Obtener albaranes de un pedido específico
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pedidoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Lista de albaranes del pedido
 */
router.get('/pedido/:pedidoId', albaranesController.obtenerAlbaranesDePedido);

// ============================================
// ACCIONES MASIVAS
// ============================================

/**
 * @swagger
 * /api/albaranes/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples albaranes
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Albaranes eliminados correctamente
 */
router.post('/bulk-delete', albaranesController.eliminarVarios);

/**
 * @swagger
 * /api/albaranes/bulk-email:
 *   post:
 *     summary: Enviar múltiples albaranes por email
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Emails enviados correctamente
 */
router.post('/bulk-email', albaranesController.enviarVariosPorEmail);

/**
 * @swagger
 * /api/albaranes/bulk-whatsapp:
 *   post:
 *     summary: Generar URLs de WhatsApp para múltiples albaranes
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: URLs generadas correctamente
 */
router.post('/bulk-whatsapp', albaranesController.generarURLsWhatsApp);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @swagger
 * /api/albaranes:
 *   get:
 *     summary: Obtener todos los albaranes con filtros y paginación
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Elementos por página
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *         description: Filtrar por cliente
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha desde
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha hasta
 *     responses:
 *       200:
 *         description: Lista de albaranes
 */
router.get('/', albaranesController.buscar);

/**
 * @swagger
 * /api/albaranes:
 *   post:
 *     summary: Crear un nuevo albarán
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clienteId
 *               - lineas
 *             properties:
 *               clienteId:
 *                 type: string
 *               pedidoId:
 *                 type: string
 *               lineas:
 *                 type: array
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Albarán creado correctamente
 */
router.post('/', albaranesController.crear);

/**
 * @swagger
 * /api/albaranes/{id}:
 *   get:
 *     summary: Obtener un albarán por ID
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del albarán
 *     responses:
 *       200:
 *         description: Datos del albarán
 *       404:
 *         description: Albarán no encontrado
 */
router.get('/:id', albaranesController.obtenerPorId);

/**
 * @swagger
 * /api/albaranes/{id}:
 *   put:
 *     summary: Actualizar un albarán
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del albarán
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Albarán actualizado
 *       404:
 *         description: Albarán no encontrado
 */
router.put('/:id', albaranesController.actualizar);

/**
 * @swagger
 * /api/albaranes/{id}:
 *   patch:
 *     summary: Actualizar parcialmente un albarán
 *     tags: [Albaranes]
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
 *         description: Albarán actualizado
 */
router.patch('/:id', albaranesController.actualizar);

/**
 * @swagger
 * /api/albaranes/{id}:
 *   delete:
 *     summary: Eliminar un albarán (soft delete)
 *     tags: [Albaranes]
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
 *         description: Albarán eliminado
 *       404:
 *         description: Albarán no encontrado
 */
router.delete('/:id', albaranesController.eliminar);

// ============================================
// RUTAS DE ACCIONES
// ============================================

/**
 * @swagger
 * /api/albaranes/{id}/registrar-entrega:
 *   post:
 *     summary: Registrar la entrega de un albarán
 *     tags: [Albaranes]
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
 *               fechaEntrega:
 *                 type: string
 *                 format: date-time
 *               firmadoPor:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entrega registrada
 */
router.post('/:id/registrar-entrega', albaranesController.registrarEntrega);

/**
 * @swagger
 * /api/albaranes/{id}/cambiar-estado:
 *   post:
 *     summary: Cambiar el estado de un albarán
 *     tags: [Albaranes]
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
 *                 enum: [borrador, pendiente, entregado, facturado, cancelado]
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.post('/:id/cambiar-estado', albaranesController.cambiarEstado);

/**
 * @swagger
 * /api/albaranes/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de un albarán (alias)
 *     tags: [Albaranes]
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
 *         description: Estado actualizado
 */
router.patch('/:id/estado', albaranesController.cambiarEstado);

/**
 * @swagger
 * /api/albaranes/{id}/duplicar:
 *   post:
 *     summary: Duplicar un albarán existente
 *     tags: [Albaranes]
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
 *         description: Albarán duplicado
 *       404:
 *         description: Albarán original no encontrado
 */
router.post('/:id/duplicar', albaranesController.duplicar);

export default router;
