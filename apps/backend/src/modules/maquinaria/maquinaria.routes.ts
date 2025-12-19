import { Router } from 'express';
import { maquinariaController } from './maquinaria.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Maquinaria
 *   description: Gestion de maquinaria, vehiculos y equipos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Maquinaria:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         codigo:
 *           type: string
 *           example: MAQ001
 *         nombre:
 *           type: string
 *           example: Excavadora Caterpillar
 *         descripcion:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [vehiculo, maquinaria, herramienta, equipo]
 *         matricula:
 *           type: string
 *         marca:
 *           type: string
 *         modelo:
 *           type: string
 *         anio:
 *           type: number
 *         estado:
 *           type: string
 *           enum: [disponible, en_uso, mantenimiento, baja]
 *         tarifaHoraCoste:
 *           type: number
 *         tarifaHoraVenta:
 *           type: number
 *         tarifaDiaCoste:
 *           type: number
 *         tarifaDiaVenta:
 *           type: number
 *         tarifaKmCoste:
 *           type: number
 *         tarifaKmVenta:
 *           type: number
 *         kmActuales:
 *           type: number
 *         horasUso:
 *           type: number
 *         activo:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Aplicar middleware de autenticacion y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/maquinaria:
 *   get:
 *     summary: Obtener toda la maquinaria
 *     tags: [Maquinaria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Busqueda por codigo, nombre, matricula, marca o modelo
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *         description: Filtrar por estado activo (true/false)
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: orden
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Lista de maquinaria obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/', maquinariaController.getAll.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria/activas:
 *   get:
 *     summary: Obtener maquinaria activa
 *     tags: [Maquinaria]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de maquinaria activa
 *       401:
 *         description: No autorizado
 */
router.get('/activas', maquinariaController.getActivas.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria/disponibles:
 *   get:
 *     summary: Obtener maquinaria disponible
 *     tags: [Maquinaria]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de maquinaria disponible
 *       401:
 *         description: No autorizado
 */
router.get('/disponibles', maquinariaController.getDisponibles.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria/estadisticas:
 *   get:
 *     summary: Obtener estadisticas de maquinaria
 *     tags: [Maquinaria]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadisticas de maquinaria
 *       401:
 *         description: No autorizado
 */
router.get('/estadisticas', maquinariaController.getEstadisticas.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria/alertas:
 *   get:
 *     summary: Obtener alertas de maquinaria (mantenimiento, ITV, seguro)
 *     tags: [Maquinaria]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alertas de maquinaria
 *       401:
 *         description: No autorizado
 */
router.get('/alertas', maquinariaController.getAlertas.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria/bulk/delete:
 *   post:
 *     summary: Eliminar multiples maquinarias
 *     tags: [Maquinaria]
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
 *         description: Maquinarias eliminadas exitosamente
 *       401:
 *         description: No autorizado
 */
router.post('/bulk/delete', maquinariaController.deleteMany.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria/{id}:
 *   get:
 *     summary: Obtener una maquinaria por ID
 *     tags: [Maquinaria]
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
 *         description: Maquinaria encontrada
 *       404:
 *         description: Maquinaria no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:id', maquinariaController.getOne.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria:
 *   post:
 *     summary: Crear una nueva maquinaria
 *     tags: [Maquinaria]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *               - tipo
 *             properties:
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [vehiculo, maquinaria, herramienta, equipo]
 *     responses:
 *       201:
 *         description: Maquinaria creada exitosamente
 *       400:
 *         description: Datos invalidos
 *       401:
 *         description: No autorizado
 */
router.post('/', maquinariaController.create.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria/{id}:
 *   put:
 *     summary: Actualizar una maquinaria
 *     tags: [Maquinaria]
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
 *         description: Maquinaria actualizada exitosamente
 *       404:
 *         description: Maquinaria no encontrada
 *       401:
 *         description: No autorizado
 */
router.put('/:id', maquinariaController.update.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria/{id}:
 *   delete:
 *     summary: Eliminar una maquinaria
 *     tags: [Maquinaria]
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
 *         description: Maquinaria eliminada exitosamente
 *       404:
 *         description: Maquinaria no encontrada
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', maquinariaController.delete.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria/{id}/mantenimiento:
 *   post:
 *     summary: Registrar mantenimiento
 *     tags: [Maquinaria]
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
 *               - fecha
 *               - tipo
 *               - descripcion
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *               tipo:
 *                 type: string
 *                 enum: [preventivo, correctivo, revision]
 *               descripcion:
 *                 type: string
 *               coste:
 *                 type: number
 *     responses:
 *       200:
 *         description: Mantenimiento registrado exitosamente
 *       404:
 *         description: Maquinaria no encontrada
 *       401:
 *         description: No autorizado
 */
router.post('/:id/mantenimiento', maquinariaController.registrarMantenimiento.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de maquinaria
 *     tags: [Maquinaria]
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
 *                 enum: [disponible, en_uso, mantenimiento, baja]
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       404:
 *         description: Maquinaria no encontrada
 *       401:
 *         description: No autorizado
 */
router.patch('/:id/estado', maquinariaController.cambiarEstado.bind(maquinariaController));

/**
 * @swagger
 * /api/maquinaria/{id}/duplicar:
 *   post:
 *     summary: Duplicar una maquinaria
 *     tags: [Maquinaria]
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
 *         description: Maquinaria duplicada exitosamente
 *       404:
 *         description: Maquinaria no encontrada
 *       401:
 *         description: No autorizado
 */
router.post('/:id/duplicar', maquinariaController.duplicar.bind(maquinariaController));

export default router;
