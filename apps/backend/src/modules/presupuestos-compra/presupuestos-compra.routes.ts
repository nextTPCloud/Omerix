import { Router } from 'express';
import { presupuestosCompraController } from './presupuestos-compra.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Presupuestos de Compra
 *   description: Gestion de presupuestos de compra a proveedores
 */

// Aplicar middleware de autenticacion y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS CRUD BASICAS
// ============================================

/**
 * @swagger
 * /presupuestos-compra:
 *   post:
 *     summary: Crear un nuevo presupuesto de compra
 *     tags: [Presupuestos de Compra]
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
 *             properties:
 *               proveedorId:
 *                 type: string
 *               titulo:
 *                 type: string
 *               lineas:
 *                 type: array
 *     responses:
 *       201:
 *         description: Presupuesto de compra creado exitosamente
 */
router.post('/', presupuestosCompraController.create.bind(presupuestosCompraController));

/**
 * @swagger
 * /presupuestos-compra:
 *   get:
 *     summary: Obtener todos los presupuestos de compra con paginacion y filtros
 *     tags: [Presupuestos de Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numero de pagina
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Registros por pagina
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busqueda por codigo, proveedor, etc.
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: proveedorId
 *         schema:
 *           type: string
 *         description: Filtrar por proveedor
 *     responses:
 *       200:
 *         description: Lista de presupuestos de compra
 */
router.get('/', presupuestosCompraController.findAll.bind(presupuestosCompraController));

/**
 * @swagger
 * /presupuestos-compra/estadisticas:
 *   get:
 *     summary: Obtener estadisticas de presupuestos de compra
 *     tags: [Presupuestos de Compra]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadisticas de presupuestos de compra
 */
router.get('/estadisticas', presupuestosCompraController.getEstadisticas.bind(presupuestosCompraController));

/**
 * @swagger
 * /presupuestos-compra/alertas:
 *   get:
 *     summary: Obtener alertas de presupuestos de compra
 *     tags: [Presupuestos de Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: diasAlerta
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Dias para considerar proximos a expirar
 *     responses:
 *       200:
 *         description: Alertas de presupuestos de compra
 */
router.get('/alertas', presupuestosCompraController.getAlertas.bind(presupuestosCompraController));

/**
 * @swagger
 * /presupuestos-compra/codigo/{codigo}:
 *   get:
 *     summary: Obtener presupuesto de compra por codigo
 *     tags: [Presupuestos de Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Presupuesto de compra encontrado
 *       404:
 *         description: Presupuesto de compra no encontrado
 */
router.get('/codigo/:codigo', presupuestosCompraController.findByCodigo.bind(presupuestosCompraController));

/**
 * @swagger
 * /presupuestos-compra/{id}:
 *   get:
 *     summary: Obtener presupuesto de compra por ID
 *     tags: [Presupuestos de Compra]
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
 *         description: Presupuesto de compra encontrado
 *       404:
 *         description: Presupuesto de compra no encontrado
 */
router.get('/:id', presupuestosCompraController.findById.bind(presupuestosCompraController));

/**
 * @swagger
 * /presupuestos-compra/{id}:
 *   put:
 *     summary: Actualizar un presupuesto de compra
 *     tags: [Presupuestos de Compra]
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
 *         description: Presupuesto de compra actualizado
 *       404:
 *         description: Presupuesto de compra no encontrado
 */
router.put('/:id', presupuestosCompraController.update.bind(presupuestosCompraController));

/**
 * @swagger
 * /presupuestos-compra/{id}:
 *   delete:
 *     summary: Eliminar un presupuesto de compra
 *     tags: [Presupuestos de Compra]
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
 *         description: Presupuesto de compra eliminado
 *       404:
 *         description: Presupuesto de compra no encontrado
 */
router.delete('/:id', presupuestosCompraController.delete.bind(presupuestosCompraController));

// ============================================
// RUTAS DE ACCIONES
// ============================================

/**
 * @swagger
 * /presupuestos-compra/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de un presupuesto de compra
 *     tags: [Presupuestos de Compra]
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
 *                 enum: [borrador, enviado, recibido, aceptado, rechazado, convertido, expirado, cancelado]
 *               motivoRechazo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:id/estado', presupuestosCompraController.cambiarEstado.bind(presupuestosCompraController));

/**
 * @swagger
 * /presupuestos-compra/{id}/convertir:
 *   post:
 *     summary: Convertir presupuesto de compra a pedido de compra
 *     tags: [Presupuestos de Compra]
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
 *               lineasIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de lineas a incluir (todas si no se especifica)
 *               fechaEntregaPrevista:
 *                 type: string
 *                 format: date
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presupuesto convertido a pedido
 */
router.post('/:id/convertir', presupuestosCompraController.convertirAPedido.bind(presupuestosCompraController));

/**
 * @swagger
 * /presupuestos-compra/{id}/duplicar:
 *   post:
 *     summary: Duplicar un presupuesto de compra
 *     tags: [Presupuestos de Compra]
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
 *         description: Presupuesto de compra duplicado
 */
router.post('/:id/duplicar', presupuestosCompraController.duplicar.bind(presupuestosCompraController));

// ============================================
// RUTAS MASIVAS
// ============================================

/**
 * @swagger
 * /presupuestos-compra/bulk/delete:
 *   post:
 *     summary: Eliminar multiples presupuestos de compra
 *     tags: [Presupuestos de Compra]
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
 *         description: Presupuestos de compra eliminados
 */
router.post('/bulk/delete', presupuestosCompraController.deleteMany.bind(presupuestosCompraController));

export default router;
