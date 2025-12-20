import { Router } from 'express';
import { FichajesController } from './fichajes.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticacion
router.use(authMiddleware);

/**
 * @swagger
 * /api/fichajes:
 *   get:
 *     summary: Obtener lista de fichajes
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: personalId
 *         schema:
 *           type: string
 *       - in: query
 *         name: departamentoId
 *         schema:
 *           type: string
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [abierto, cerrado, pendiente, aprobado, rechazado]
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
 *         description: Lista de fichajes
 */
router.get('/', FichajesController.getAll);

/**
 * @swagger
 * /api/fichajes/fichar:
 *   post:
 *     summary: Fichar rapido (entrada o salida automatica)
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personalId:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [normal, teletrabajo, viaje, formacion]
 *               ubicacion:
 *                 type: object
 *                 properties:
 *                   latitud:
 *                     type: number
 *                   longitud:
 *                     type: number
 *     responses:
 *       200:
 *         description: Fichaje registrado
 */
router.post('/fichar', FichajesController.ficharRapido);

/**
 * @swagger
 * /api/fichajes/entrada:
 *   post:
 *     summary: Registrar entrada
 *     tags: [Fichajes]
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
 *             properties:
 *               personalId:
 *                 type: string
 *               tipo:
 *                 type: string
 *               ubicacion:
 *                 type: object
 *     responses:
 *       201:
 *         description: Entrada registrada
 */
router.post('/entrada', FichajesController.registrarEntrada);

/**
 * @swagger
 * /api/fichajes/estado/{personalId}:
 *   get:
 *     summary: Obtener estado actual de fichaje del empleado
 *     tags: [Fichajes]
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
 *         description: Estado actual
 */
router.get('/estado/:personalId', FichajesController.getEstadoActual);

/**
 * @swagger
 * /api/fichajes/estado:
 *   get:
 *     summary: Obtener estado actual de fichaje del usuario actual
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado actual
 */
router.get('/estado', FichajesController.getEstadoActual);

/**
 * @swagger
 * /api/fichajes/resumen/{personalId}:
 *   get:
 *     summary: Obtener resumen mensual del empleado
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resumen mensual
 */
router.get('/resumen/:personalId', FichajesController.getResumenEmpleado);

/**
 * @swagger
 * /api/fichajes/resumen:
 *   get:
 *     summary: Obtener resumen mensual del usuario actual
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen mensual
 */
router.get('/resumen', FichajesController.getResumenEmpleado);

/**
 * @swagger
 * /api/fichajes/{id}:
 *   get:
 *     summary: Obtener fichaje por ID
 *     tags: [Fichajes]
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
 *         description: Fichaje encontrado
 */
router.get('/:id', FichajesController.getById);

/**
 * @swagger
 * /api/fichajes/{id}/salida:
 *   post:
 *     summary: Registrar salida
 *     tags: [Fichajes]
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
 *         description: Salida registrada
 */
router.post('/:id/salida', FichajesController.registrarSalida);

/**
 * @swagger
 * /api/fichajes/{id}/pausa:
 *   post:
 *     summary: Registrar pausa (inicio o fin)
 *     tags: [Fichajes]
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
 *               - tipo
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [inicio, fin]
 *     responses:
 *       200:
 *         description: Pausa registrada
 */
router.post('/:id/pausa', FichajesController.registrarPausa);

/**
 * @swagger
 * /api/fichajes/{id}:
 *   put:
 *     summary: Actualizar fichaje
 *     tags: [Fichajes]
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
 *         description: Fichaje actualizado
 */
router.put('/:id', FichajesController.update);

/**
 * @swagger
 * /api/fichajes/{id}:
 *   delete:
 *     summary: Eliminar fichaje
 *     tags: [Fichajes]
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
 *         description: Fichaje eliminado
 */
router.delete('/:id', FichajesController.delete);

export default router;
