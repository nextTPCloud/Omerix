import { Router } from 'express';
import { facturasCompraController } from './facturas-compra.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/facturas-compra:
 *   get:
 *     summary: Listar facturas de compra
 *     tags: [Facturas de Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: proveedorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [borrador, pendiente_pago, parcialmente_pagada, pagada, vencida, anulada]
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
 *         description: Lista de facturas de compra
 */
router.get('/', facturasCompraController.listar.bind(facturasCompraController));

/**
 * @swagger
 * /api/facturas-compra/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de facturas de compra
 *     tags: [Facturas de Compra]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 */
router.get('/estadisticas', facturasCompraController.obtenerEstadisticas.bind(facturasCompraController));

/**
 * @swagger
 * /api/facturas-compra/alertas:
 *   get:
 *     summary: Obtener alertas de facturas de compra (pendientes pago, vencidas, próximas vencer)
 *     tags: [Facturas de Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: diasAlerta
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Alertas obtenidas correctamente
 */
router.get('/alertas', facturasCompraController.getAlertas.bind(facturasCompraController));

/**
 * @swagger
 * /api/facturas-compra/desde-albaranes:
 *   post:
 *     summary: Crear factura de compra desde albaranes
 *     tags: [Facturas de Compra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - albaranesCompraIds
 *               - numeroFacturaProveedor
 *               - fechaFacturaProveedor
 *             properties:
 *               albaranesCompraIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               numeroFacturaProveedor:
 *                 type: string
 *               fechaFacturaProveedor:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Factura de compra creada desde albaranes
 */
router.post('/desde-albaranes', facturasCompraController.crearDesdeAlbaranes.bind(facturasCompraController));

/**
 * @swagger
 * /api/facturas-compra/bulk/delete:
 *   post:
 *     summary: Eliminar múltiples facturas de compra
 *     tags: [Facturas de Compra]
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
 *         description: Facturas eliminadas
 */
router.post('/bulk/delete', facturasCompraController.eliminarMultiples.bind(facturasCompraController));

/**
 * @swagger
 * /api/facturas-compra/bulk/estado:
 *   post:
 *     summary: Cambiar estado de múltiples facturas de compra
 *     tags: [Facturas de Compra]
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
 *               - estado
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               estado:
 *                 type: string
 *                 enum: [borrador, pendiente_pago, parcialmente_pagada, pagada, vencida, anulada]
 *     responses:
 *       200:
 *         description: Estados actualizados
 */
router.post('/bulk/estado', facturasCompraController.cambiarEstadoMasivo.bind(facturasCompraController));

/**
 * @swagger
 * /api/facturas-compra/{id}:
 *   get:
 *     summary: Obtener factura de compra por ID
 *     tags: [Facturas de Compra]
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
 *         description: Factura de compra obtenida
 *       404:
 *         description: Factura no encontrada
 */
router.get('/:id', facturasCompraController.obtenerPorId.bind(facturasCompraController));

/**
 * @swagger
 * /api/facturas-compra:
 *   post:
 *     summary: Crear nueva factura de compra
 *     tags: [Facturas de Compra]
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
 *               - numeroFacturaProveedor
 *               - fechaFacturaProveedor
 *             properties:
 *               proveedorId:
 *                 type: string
 *               numeroFacturaProveedor:
 *                 type: string
 *               fechaFacturaProveedor:
 *                 type: string
 *                 format: date
 *               lineas:
 *                 type: array
 *     responses:
 *       201:
 *         description: Factura de compra creada
 */
router.post('/', facturasCompraController.crear.bind(facturasCompraController));

/**
 * @swagger
 * /api/facturas-compra/{id}:
 *   put:
 *     summary: Actualizar factura de compra
 *     tags: [Facturas de Compra]
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
 *         description: Factura de compra actualizada
 */
router.put('/:id', facturasCompraController.actualizar.bind(facturasCompraController));

/**
 * @swagger
 * /api/facturas-compra/{id}/pago:
 *   post:
 *     summary: Registrar pago en factura de compra
 *     tags: [Facturas de Compra]
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
 *               - importe
 *             properties:
 *               importe:
 *                 type: number
 *               fechaPago:
 *                 type: string
 *                 format: date
 *               formaPagoId:
 *                 type: string
 *               referenciaPago:
 *                 type: string
 *               vencimientoId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago registrado
 */
router.post('/:id/pago', facturasCompraController.registrarPago.bind(facturasCompraController));

/**
 * @swagger
 * /api/facturas-compra/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de la factura de compra
 *     tags: [Facturas de Compra]
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
 *                 enum: [borrador, pendiente_pago, parcialmente_pagada, pagada, vencida, anulada]
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:id/estado', facturasCompraController.cambiarEstado.bind(facturasCompraController));

/**
 * @swagger
 * /api/facturas-compra/{id}:
 *   delete:
 *     summary: Eliminar factura de compra
 *     tags: [Facturas de Compra]
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
 *         description: Factura de compra eliminada
 */
router.delete('/:id', facturasCompraController.eliminar.bind(facturasCompraController));

export default router;
