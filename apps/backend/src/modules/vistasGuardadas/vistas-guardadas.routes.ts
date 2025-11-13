import { Router } from 'express';
import VistasGuardadasController from './vistas-guardadas.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Vistas Guardadas
 *   description: Gestión de vistas personalizadas guardadas por módulo
 */

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /api/vistas-guardadas:
 *   get:
 *     summary: Obtener todas las vistas de un módulo
 *     tags: [Vistas Guardadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: modulo
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del módulo
 *       - in: query
 *         name: incluirCompartidas
 *         schema:
 *           type: boolean
 *         description: Incluir vistas compartidas
 *     responses:
 *       200:
 *         description: Vistas obtenidas exitosamente
 *       400:
 *         description: Parámetros inválidos
 */
router.get('/', VistasGuardadasController.findAll.bind(VistasGuardadasController));

/**
 * @swagger
 * /api/vistas-guardadas/default/{modulo}:
 *   get:
 *     summary: Obtener la vista por defecto de un módulo
 *     tags: [Vistas Guardadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modulo
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del módulo
 *     responses:
 *       200:
 *         description: Vista por defecto obtenida
 *       404:
 *         description: No hay vista por defecto
 */
router.get('/default/:modulo', VistasGuardadasController.findDefault.bind(VistasGuardadasController));

/**
 * @swagger
 * /api/vistas-guardadas:
 *   post:
 *     summary: Crear una nueva vista guardada
 *     tags: [Vistas Guardadas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modulo
 *               - nombre
 *               - configuracion
 *             properties:
 *               modulo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               configuracion:
 *                 type: object
 *               esDefault:
 *                 type: boolean
 *               compartida:
 *                 type: boolean
 *               icono:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vista creada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', VistasGuardadasController.create.bind(VistasGuardadasController));

/**
 * @swagger
 * /api/vistas-guardadas/{id}:
 *   get:
 *     summary: Obtener una vista por ID
 *     tags: [Vistas Guardadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la vista
 *     responses:
 *       200:
 *         description: Vista obtenida exitosamente
 *       404:
 *         description: Vista no encontrada
 */
router.get('/:id', VistasGuardadasController.findById.bind(VistasGuardadasController));

/**
 * @swagger
 * /api/vistas-guardadas/{id}:
 *   put:
 *     summary: Actualizar una vista
 *     tags: [Vistas Guardadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la vista
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               configuracion:
 *                 type: object
 *               esDefault:
 *                 type: boolean
 *               compartida:
 *                 type: boolean
 *               icono:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vista actualizada exitosamente
 *       404:
 *         description: Vista no encontrada
 */
router.put('/:id', VistasGuardadasController.update.bind(VistasGuardadasController));

/**
 * @swagger
 * /api/vistas-guardadas/{id}:
 *   delete:
 *     summary: Eliminar una vista
 *     tags: [Vistas Guardadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la vista
 *     responses:
 *       200:
 *         description: Vista eliminada exitosamente
 *       404:
 *         description: Vista no encontrada
 */
router.delete('/:id', VistasGuardadasController.delete.bind(VistasGuardadasController));

/**
 * @swagger
 * /api/vistas-guardadas/{id}/duplicate:
 *   post:
 *     summary: Duplicar una vista
 *     tags: [Vistas Guardadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la vista a duplicar
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nuevoNombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vista duplicada exitosamente
 *       404:
 *         description: Vista no encontrada
 */
router.post('/:id/duplicate', VistasGuardadasController.duplicate.bind(VistasGuardadasController));

/**
 * @swagger
 * /api/vistas-guardadas/{id}/set-default:
 *   put:
 *     summary: Establecer una vista como predeterminada
 *     tags: [Vistas Guardadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la vista
 *     responses:
 *       200:
 *         description: Vista establecida como predeterminada
 *       404:
 *         description: Vista no encontrada
 */
router.put('/:id/set-default', VistasGuardadasController.setDefault.bind(VistasGuardadasController));

export default router;