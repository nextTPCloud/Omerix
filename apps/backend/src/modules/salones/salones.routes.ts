import { Router } from 'express';
import {
  // Salones
  getAllSalones,
  getSalonById,
  createSalon,
  updateSalon,
  deleteSalon,
  getSiguienteCodigoSalon,
  // Mesas
  getAllMesas,
  getMesasBySalon,
  getMesaById,
  createMesa,
  createMesasBulk,
  updateMesa,
  deleteMesa,
  // Operaciones de estado
  cambiarEstadoMesa,
  moverMesa,
  actualizarPosicionesMesas,
  agruparMesas,
  desagruparMesas,
  // Estadisticas
  getEstadisticasSalon,
} from './salones.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware, requireBusinessDatabase } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireBusinessDatabase);

// ============================================
// SALONES
// ============================================

/**
 * @swagger
 * /api/salones:
 *   get:
 *     summary: Obtener todos los salones
 *     tags: [Salones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Buscar por nombre o codigo
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: almacenId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tpvId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de salones
 */
router.get('/', getAllSalones);

/**
 * @swagger
 * /api/salones/siguiente-codigo:
 *   get:
 *     summary: Obtener el siguiente codigo de salon sugerido
 *     tags: [Salones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefijo
 *         schema:
 *           type: string
 *         description: Prefijo para el codigo (default SAL)
 *     responses:
 *       200:
 *         description: Codigo sugerido
 */
router.get('/siguiente-codigo', getSiguienteCodigoSalon);

/**
 * @swagger
 * /api/salones/{id}:
 *   get:
 *     summary: Obtener un salon por ID
 *     tags: [Salones]
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
 *         description: Salon encontrado
 *       404:
 *         description: Salon no encontrado
 */
router.get('/:id', getSalonById);

/**
 * @swagger
 * /api/salones:
 *   post:
 *     summary: Crear un nuevo salon
 *     tags: [Salones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSalonDTO'
 *     responses:
 *       201:
 *         description: Salon creado
 */
router.post('/', createSalon);

/**
 * @swagger
 * /api/salones/{id}:
 *   put:
 *     summary: Actualizar un salon
 *     tags: [Salones]
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
 *             $ref: '#/components/schemas/UpdateSalonDTO'
 *     responses:
 *       200:
 *         description: Salon actualizado
 */
router.put('/:id', updateSalon);

/**
 * @swagger
 * /api/salones/{id}:
 *   delete:
 *     summary: Eliminar un salon
 *     tags: [Salones]
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
 *         description: Salon eliminado
 */
router.delete('/:id', deleteSalon);

/**
 * @swagger
 * /api/salones/{salonId}/estadisticas:
 *   get:
 *     summary: Obtener estadisticas de un salon
 *     tags: [Salones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadisticas del salon
 */
router.get('/:salonId/estadisticas', getEstadisticasSalon);

/**
 * @swagger
 * /api/salones/{salonId}/mesas:
 *   get:
 *     summary: Obtener mesas de un salon
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de mesas del salon
 */
router.get('/:salonId/mesas', getMesasBySalon);

// ============================================
// MESAS (rutas separadas)
// ============================================

const mesasRouter = Router();

// Aplicar middleware de autenticación y tenant a todas las rutas de mesas
mesasRouter.use(authMiddleware);
mesasRouter.use(tenantMiddleware);
mesasRouter.use(requireBusinessDatabase);

/**
 * @swagger
 * /api/mesas:
 *   get:
 *     summary: Obtener todas las mesas
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: salonId
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [libre, ocupada, reservada, cuenta_pedida, por_limpiar, fuera_servicio]
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de mesas
 */
mesasRouter.get('/', getAllMesas);

/**
 * @swagger
 * /api/mesas/{id}:
 *   get:
 *     summary: Obtener una mesa por ID
 *     tags: [Mesas]
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
 *         description: Mesa encontrada
 */
mesasRouter.get('/:id', getMesaById);

/**
 * @swagger
 * /api/mesas:
 *   post:
 *     summary: Crear una nueva mesa
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMesaDTO'
 *     responses:
 *       201:
 *         description: Mesa creada
 */
mesasRouter.post('/', createMesa);

/**
 * @swagger
 * /api/mesas/bulk:
 *   post:
 *     summary: Crear multiples mesas de una vez
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               salonId:
 *                 type: string
 *               cantidad:
 *                 type: number
 *               prefijo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mesas creadas
 */
mesasRouter.post('/bulk', createMesasBulk);

/**
 * @swagger
 * /api/mesas/posiciones:
 *   put:
 *     summary: Actualizar posiciones de multiples mesas
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mesas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     x:
 *                       type: number
 *                     y:
 *                       type: number
 *                     rotacion:
 *                       type: number
 *     responses:
 *       200:
 *         description: Posiciones actualizadas
 */
mesasRouter.put('/posiciones', actualizarPosicionesMesas);

/**
 * @swagger
 * /api/mesas/agrupar:
 *   post:
 *     summary: Agrupar mesas
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mesasIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               mesaPrincipalId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mesas agrupadas
 */
mesasRouter.post('/agrupar', agruparMesas);

/**
 * @swagger
 * /api/mesas/desagrupar/{grupoId}:
 *   post:
 *     summary: Desagrupar mesas
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mesas desagrupadas
 */
mesasRouter.post('/desagrupar/:grupoId', desagruparMesas);

/**
 * @swagger
 * /api/mesas/{id}:
 *   put:
 *     summary: Actualizar una mesa
 *     tags: [Mesas]
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
 *             $ref: '#/components/schemas/UpdateMesaDTO'
 *     responses:
 *       200:
 *         description: Mesa actualizada
 */
mesasRouter.put('/:id', updateMesa);

/**
 * @swagger
 * /api/mesas/{id}:
 *   delete:
 *     summary: Eliminar una mesa
 *     tags: [Mesas]
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
 *         description: Mesa eliminada
 */
mesasRouter.delete('/:id', deleteMesa);

/**
 * @swagger
 * /api/mesas/{id}/estado:
 *   put:
 *     summary: Cambiar estado de una mesa
 *     tags: [Mesas]
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
 *             $ref: '#/components/schemas/CambiarEstadoMesaDTO'
 *     responses:
 *       200:
 *         description: Estado cambiado
 */
mesasRouter.put('/:id/estado', cambiarEstadoMesa);

/**
 * @swagger
 * /api/mesas/{id}/mover:
 *   put:
 *     summary: Mover una mesa en el plano
 *     tags: [Mesas]
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
 *               x:
 *                 type: number
 *               y:
 *                 type: number
 *               rotacion:
 *                 type: number
 *     responses:
 *       200:
 *         description: Mesa movida
 */
mesasRouter.put('/:id/mover', moverMesa);

export { router as salonesRouter, mesasRouter };
