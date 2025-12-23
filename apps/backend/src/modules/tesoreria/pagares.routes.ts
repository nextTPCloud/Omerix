import { Router } from 'express';
import { pagaresController } from './pagares.controller';
import { authMiddleware, requireModuleAccess } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Pagarés
 *   description: Gestión de pagarés (emitidos y recibidos)
 */

// Aplicar middleware de autenticación y empresa a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Verificar acceso al módulo de tesorería
router.use(requireModuleAccess('accesoTesoreria'));

// ============================================
// RUTAS DE PAGARÉS
// ============================================

/**
 * @swagger
 * /pagares:
 *   get:
 *     summary: Obtener todos los pagarés con filtros y paginación
 *     tags: [Pagarés]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por número, nombre del tercero o número de pagaré
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [emitido, recibido]
 *         description: Filtrar por tipo de pagaré
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, en_cartera, cobrado, pagado, devuelto, anulado]
 *         description: Filtrar por estado
 *       - in: query
 *         name: terceroId
 *         schema:
 *           type: string
 *         description: Filtrar por ID del tercero (cliente/proveedor)
 *       - in: query
 *         name: terceroTipo
 *         schema:
 *           type: string
 *           enum: [cliente, proveedor]
 *         description: Filtrar por tipo de tercero
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de vencimiento desde
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de vencimiento hasta
 *       - in: query
 *         name: vencidos
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Solo pagarés vencidos
 *       - in: query
 *         name: sinRemesa
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Solo pagarés sin remesa asignada
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: fechaVencimiento
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Lista de pagarés obtenida exitosamente
 *       401:
 *         description: No autenticado
 */
router.get('/', (req, res, next) => pagaresController.getAll(req, res, next));

/**
 * @swagger
 * /pagares/proximos-vencimientos:
 *   get:
 *     summary: Obtener pagarés con vencimiento próximo
 *     tags: [Pagarés]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Días hacia adelante para buscar vencimientos
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [emitido, recibido]
 *         description: Filtrar por tipo
 *     responses:
 *       200:
 *         description: Lista de próximos vencimientos
 *       401:
 *         description: No autenticado
 */
router.get('/proximos-vencimientos', (req, res, next) => pagaresController.getProximosVencimientos(req, res, next));

/**
 * @swagger
 * /pagares/devueltos:
 *   get:
 *     summary: Obtener pagarés devueltos
 *     tags: [Pagarés]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pagarés devueltos
 *       401:
 *         description: No autenticado
 */
router.get('/devueltos', (req, res, next) => pagaresController.getDevueltos(req, res, next));

/**
 * @swagger
 * /pagares/{id}:
 *   get:
 *     summary: Obtener un pagaré por ID
 *     tags: [Pagarés]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pagaré
 *     responses:
 *       200:
 *         description: Pagaré obtenido exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Pagaré no encontrado
 */
router.get('/:id', (req, res, next) => pagaresController.getById(req, res, next));

/**
 * @swagger
 * /pagares:
 *   post:
 *     summary: Crear un nuevo pagaré
 *     tags: [Pagarés]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - terceroId
 *               - terceroTipo
 *               - terceroNombre
 *               - importe
 *               - fechaEmision
 *               - fechaVencimiento
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [emitido, recibido]
 *               numeroPagare:
 *                 type: string
 *                 description: Número impreso en el pagaré físico
 *               terceroId:
 *                 type: string
 *               terceroTipo:
 *                 type: string
 *                 enum: [cliente, proveedor]
 *               terceroNombre:
 *                 type: string
 *               importe:
 *                 type: number
 *               fechaEmision:
 *                 type: string
 *                 format: date
 *               fechaVencimiento:
 *                 type: string
 *                 format: date
 *               bancoEmisor:
 *                 type: string
 *               cuentaOrigen:
 *                 type: string
 *               cuentaDestino:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pagaré creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post('/', (req, res, next) => pagaresController.create(req, res, next));

/**
 * @swagger
 * /pagares/desde-vencimiento:
 *   post:
 *     summary: Crear un pagaré desde un vencimiento existente
 *     tags: [Pagarés]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vencimientoId
 *             properties:
 *               vencimientoId:
 *                 type: string
 *               numeroPagare:
 *                 type: string
 *               fechaVencimiento:
 *                 type: string
 *                 format: date
 *               bancoEmisor:
 *                 type: string
 *               cuentaOrigen:
 *                 type: string
 *               cuentaDestino:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pagaré creado desde vencimiento
 *       400:
 *         description: Vencimiento ya tiene pagaré asociado
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vencimiento no encontrado
 */
router.post('/desde-vencimiento', (req, res, next) => pagaresController.crearDesdeVencimiento(req, res, next));

/**
 * @swagger
 * /pagares/remesa:
 *   post:
 *     summary: Crear una remesa de pagarés
 *     tags: [Pagarés]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pagareIds
 *             properties:
 *               pagareIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               fechaRemesa:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Remesa creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post('/remesa', (req, res, next) => pagaresController.crearRemesa(req, res, next));

/**
 * @swagger
 * /pagares/{id}:
 *   put:
 *     summary: Actualizar un pagaré
 *     tags: [Pagarés]
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
 *             properties:
 *               numeroPagare:
 *                 type: string
 *               fechaVencimiento:
 *                 type: string
 *                 format: date
 *               bancoEmisor:
 *                 type: string
 *               cuentaOrigen:
 *                 type: string
 *               cuentaDestino:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pagaré actualizado exitosamente
 *       400:
 *         description: Pagaré no modificable (ya cobrado/pagado)
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Pagaré no encontrado
 */
router.put('/:id', (req, res, next) => pagaresController.update(req, res, next));

/**
 * @swagger
 * /pagares/{id}/cobrar:
 *   post:
 *     summary: Marcar pagaré como cobrado/pagado
 *     tags: [Pagarés]
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
 *               fechaCobro:
 *                 type: string
 *                 format: date
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pagaré marcado como cobrado/pagado
 *       400:
 *         description: Pagaré anulado
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Pagaré no encontrado
 */
router.post('/:id/cobrar', (req, res, next) => pagaresController.marcarCobrado(req, res, next));

/**
 * @swagger
 * /pagares/{id}/devolver:
 *   post:
 *     summary: Marcar pagaré como devuelto
 *     tags: [Pagarés]
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
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *                 description: Motivo de la devolución
 *               comision:
 *                 type: number
 *                 description: Comisión bancaria por devolución
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pagaré marcado como devuelto
 *       400:
 *         description: Pagaré ya devuelto o anulado
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Pagaré no encontrado
 */
router.post('/:id/devolver', (req, res, next) => pagaresController.marcarDevuelto(req, res, next));

/**
 * @swagger
 * /pagares/{id}/anular:
 *   post:
 *     summary: Anular un pagaré
 *     tags: [Pagarés]
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
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pagaré anulado exitosamente
 *       400:
 *         description: Pagaré no puede anularse (ya cobrado/pagado)
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Pagaré no encontrado
 */
router.post('/:id/anular', (req, res, next) => pagaresController.anular(req, res, next));

/**
 * @swagger
 * /pagares/{id}:
 *   delete:
 *     summary: Eliminar un pagaré
 *     tags: [Pagarés]
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
 *         description: Pagaré eliminado exitosamente
 *       400:
 *         description: Pagaré no puede eliminarse (ya cobrado/pagado)
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Pagaré no encontrado
 */
router.delete('/:id', (req, res, next) => pagaresController.delete(req, res, next));

export default router;
