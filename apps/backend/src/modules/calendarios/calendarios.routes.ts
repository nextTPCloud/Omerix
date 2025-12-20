import { Router } from 'express';
import { calendariosController } from './calendarios.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Calendarios
 *   description: Gestión de calendarios laborales y festivos
 */

// ============================================
// RUTAS ESPECIALES (antes de :id)
// ============================================

/**
 * @swagger
 * /api/calendarios/activos:
 *   get:
 *     summary: Obtener calendarios activos
 *     tags: [Calendarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de calendarios activos
 */
router.get('/activos', calendariosController.obtenerActivos);

/**
 * @swagger
 * /api/calendarios/defecto/{anio}:
 *   get:
 *     summary: Obtener calendario por defecto de un año
 *     tags: [Calendarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: anio
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Calendario por defecto
 */
router.get('/defecto/:anio', calendariosController.obtenerPorDefecto);

/**
 * @swagger
 * /api/calendarios/festivos-nacionales/{anio}:
 *   get:
 *     summary: Obtener festivos nacionales predefinidos
 *     tags: [Calendarios]
 *     parameters:
 *       - in: path
 *         name: anio
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de festivos nacionales
 */
router.get('/festivos-nacionales/:anio', calendariosController.obtenerFestivosNacionales);

/**
 * @swagger
 * /api/calendarios/es-festivo:
 *   get:
 *     summary: Verificar si una fecha es festivo
 *     tags: [Calendarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Resultado de verificación
 */
router.get('/es-festivo', calendariosController.esFestivo);

// ============================================
// RUTAS CRUD
// ============================================

/**
 * @swagger
 * /api/calendarios:
 *   get:
 *     summary: Obtener lista de calendarios
 *     tags: [Calendarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *     responses:
 *       200:
 *         description: Lista de calendarios
 */
router.get('/', calendariosController.buscar);

/**
 * @swagger
 * /api/calendarios:
 *   post:
 *     summary: Crear un nuevo calendario
 *     tags: [Calendarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - anio
 *               - nombre
 *             properties:
 *               anio:
 *                 type: integer
 *               nombre:
 *                 type: string
 *               region:
 *                 type: string
 *               esDefecto:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Calendario creado correctamente
 */
router.post('/', calendariosController.crear);

/**
 * @swagger
 * /api/calendarios/{id}:
 *   get:
 *     summary: Obtener un calendario por ID
 *     tags: [Calendarios]
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
 *         description: Calendario encontrado
 */
router.get('/:id', calendariosController.obtenerPorId);

/**
 * @swagger
 * /api/calendarios/{id}:
 *   put:
 *     summary: Actualizar un calendario
 *     tags: [Calendarios]
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
 *         description: Calendario actualizado
 */
router.put('/:id', calendariosController.actualizar);

/**
 * @swagger
 * /api/calendarios/{id}:
 *   delete:
 *     summary: Eliminar un calendario
 *     tags: [Calendarios]
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
 *         description: Calendario eliminado
 */
router.delete('/:id', calendariosController.eliminar);

// ============================================
// RUTAS DE FESTIVOS
// ============================================

/**
 * @swagger
 * /api/calendarios/{id}/festivos:
 *   post:
 *     summary: Agregar festivo a calendario
 *     tags: [Calendarios]
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
 *               - nombre
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [nacional, autonomico, local, empresa]
 *               sustituible:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Festivo agregado
 */
router.post('/:id/festivos', calendariosController.agregarFestivo);

/**
 * @swagger
 * /api/calendarios/{id}/festivos/{festivoId}:
 *   delete:
 *     summary: Eliminar festivo de calendario
 *     tags: [Calendarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: festivoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Festivo eliminado
 */
router.delete('/:id/festivos/:festivoId', calendariosController.eliminarFestivo);

export default router;
