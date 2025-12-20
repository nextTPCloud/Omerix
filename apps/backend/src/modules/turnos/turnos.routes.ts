import { Router } from 'express';
import { turnosController } from './turnos.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Turnos
 *   description: Gestión de turnos y horarios de personal
 */

// ============================================
// RUTAS ESPECIALES DE TURNOS (antes de :id)
// ============================================

/**
 * @swagger
 * /api/turnos/activos:
 *   get:
 *     summary: Obtener turnos activos
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de turnos activos
 */
router.get('/activos', turnosController.obtenerActivos);

/**
 * @swagger
 * /api/turnos/predefinidos:
 *   get:
 *     summary: Obtener turnos predefinidos
 *     tags: [Turnos]
 *     responses:
 *       200:
 *         description: Lista de turnos predefinidos
 */
router.get('/predefinidos', turnosController.obtenerPredefinidos);

/**
 * @swagger
 * /api/turnos/crear-predefinidos:
 *   post:
 *     summary: Crear turnos predefinidos
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Turnos predefinidos creados
 */
router.post('/crear-predefinidos', turnosController.crearPredefinidos);

/**
 * @swagger
 * /api/turnos/sugerir-codigo:
 *   get:
 *     summary: Obtener sugerencia de siguiente código
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Código sugerido
 */
router.get('/sugerir-codigo', turnosController.sugerirCodigo);

/**
 * @swagger
 * /api/turnos/codigos:
 *   get:
 *     summary: Buscar códigos existentes por prefijo
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *         description: Prefijo del código a buscar
 *     responses:
 *       200:
 *         description: Lista de códigos
 */
router.get('/codigos', turnosController.searchCodigos);

// ============================================
// RUTAS DE HORARIOS PERSONAL
// ============================================

/**
 * @swagger
 * /api/turnos/horarios:
 *   get:
 *     summary: Buscar horarios de personal
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: personalId
 *         schema:
 *           type: string
 *       - in: query
 *         name: turnoId
 *         schema:
 *           type: string
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *     responses:
 *       200:
 *         description: Lista de horarios
 */
router.get('/horarios', turnosController.buscarHorariosPersonal);

/**
 * @swagger
 * /api/turnos/horarios:
 *   post:
 *     summary: Crear horario de personal
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personalId
 *               - turnoId
 *               - fechaInicio
 *             properties:
 *               personalId:
 *                 type: string
 *               turnoId:
 *                 type: string
 *               fechaInicio:
 *                 type: string
 *                 format: date
 *               fechaFin:
 *                 type: string
 *                 format: date
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Horario creado
 */
router.post('/horarios', turnosController.crearHorarioPersonal);

/**
 * @swagger
 * /api/turnos/horarios/personal/{personalId}:
 *   get:
 *     summary: Obtener horario actual de un personal
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Horario actual
 */
router.get('/horarios/personal/:personalId', turnosController.obtenerHorarioActual);

/**
 * @swagger
 * /api/turnos/horarios/personal/{personalId}/turno:
 *   get:
 *     summary: Obtener turno actual de un personal
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Turno actual
 */
router.get('/horarios/personal/:personalId/turno', turnosController.obtenerTurnoActualPersonal);

/**
 * @swagger
 * /api/turnos/horarios/{id}:
 *   put:
 *     summary: Actualizar horario de personal
 *     tags: [Turnos]
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
 *         description: Horario actualizado
 */
router.put('/horarios/:id', turnosController.actualizarHorarioPersonal);

/**
 * @swagger
 * /api/turnos/horarios/{id}:
 *   delete:
 *     summary: Eliminar horario de personal
 *     tags: [Turnos]
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
 *         description: Horario eliminado
 */
router.delete('/horarios/:id', turnosController.eliminarHorarioPersonal);

// ============================================
// RUTAS CRUD DE TURNOS
// ============================================

/**
 * @swagger
 * /api/turnos:
 *   get:
 *     summary: Obtener lista de turnos
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *     responses:
 *       200:
 *         description: Lista de turnos
 */
router.get('/', turnosController.buscar);

/**
 * @swagger
 * /api/turnos:
 *   post:
 *     summary: Crear un nuevo turno
 *     tags: [Turnos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - horaEntrada
 *               - horaSalida
 *               - horasTeoricas
 *             properties:
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               horaEntrada:
 *                 type: string
 *               horaSalida:
 *                 type: string
 *               pausaInicio:
 *                 type: string
 *               pausaFin:
 *                 type: string
 *               duracionPausaMinutos:
 *                 type: number
 *               horasTeoricas:
 *                 type: number
 *               diasSemana:
 *                 type: array
 *                 items:
 *                   type: integer
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Turno creado
 */
router.post('/', turnosController.crear);

/**
 * @swagger
 * /api/turnos/{id}:
 *   get:
 *     summary: Obtener un turno por ID
 *     tags: [Turnos]
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
 *         description: Turno encontrado
 */
router.get('/:id', turnosController.obtenerPorId);

/**
 * @swagger
 * /api/turnos/{id}:
 *   put:
 *     summary: Actualizar un turno
 *     tags: [Turnos]
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
 *         description: Turno actualizado
 */
router.put('/:id', turnosController.actualizar);

/**
 * @swagger
 * /api/turnos/{id}:
 *   delete:
 *     summary: Eliminar un turno
 *     tags: [Turnos]
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
 *         description: Turno eliminado
 */
router.delete('/:id', turnosController.eliminar);

export default router;
