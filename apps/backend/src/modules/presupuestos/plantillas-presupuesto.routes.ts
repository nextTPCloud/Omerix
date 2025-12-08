import { Router } from 'express';
import { plantillasPresupuestoController } from './plantillas-presupuesto.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: PlantillasPresupuesto
 *   description: Gestión de plantillas de presupuesto reutilizables
 */

/**
 * @swagger
 * /api/plantillas-presupuesto/categorias:
 *   get:
 *     summary: Obtener categorías de plantillas
 *     tags: [PlantillasPresupuesto]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
router.get('/categorias', plantillasPresupuestoController.getCategorias.bind(plantillasPresupuestoController));

/**
 * @swagger
 * /api/plantillas-presupuesto/mas-usadas:
 *   get:
 *     summary: Obtener plantillas más usadas
 *     tags: [PlantillasPresupuesto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Lista de plantillas más usadas
 */
router.get('/mas-usadas', plantillasPresupuestoController.getMasUsadas.bind(plantillasPresupuestoController));

/**
 * @swagger
 * /api/plantillas-presupuesto:
 *   get:
 *     summary: Obtener todas las plantillas
 *     tags: [PlantillasPresupuesto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *           enum: ['true', 'false', 'all']
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
 *     responses:
 *       200:
 *         description: Lista de plantillas paginada
 */
router.get('/', plantillasPresupuestoController.obtenerTodas.bind(plantillasPresupuestoController));

/**
 * @swagger
 * /api/plantillas-presupuesto:
 *   post:
 *     summary: Crear una nueva plantilla
 *     tags: [PlantillasPresupuesto]
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
 *             properties:
 *               nombre:
 *                 type: string
 *               codigo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               categoria:
 *                 type: string
 *               lineas:
 *                 type: array
 *               esPublica:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Plantilla creada
 */
router.post('/', plantillasPresupuestoController.crear.bind(plantillasPresupuestoController));

/**
 * @swagger
 * /api/plantillas-presupuesto/desde-presupuesto/{presupuestoId}:
 *   post:
 *     summary: Crear plantilla desde un presupuesto existente
 *     tags: [PlantillasPresupuesto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: presupuestoId
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
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               categoria:
 *                 type: string
 *               mantenerPrecios:
 *                 type: boolean
 *                 default: true
 *               mantenerCostes:
 *                 type: boolean
 *                 default: true
 *               esPublica:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Plantilla creada desde presupuesto
 */
router.post('/desde-presupuesto/:presupuestoId', plantillasPresupuestoController.crearDesdePresupuesto.bind(plantillasPresupuestoController));

/**
 * @swagger
 * /api/plantillas-presupuesto/{id}:
 *   get:
 *     summary: Obtener una plantilla por ID
 *     tags: [PlantillasPresupuesto]
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
 *         description: Plantilla encontrada
 *       404:
 *         description: Plantilla no encontrada
 */
router.get('/:id', plantillasPresupuestoController.obtenerPorId.bind(plantillasPresupuestoController));

/**
 * @swagger
 * /api/plantillas-presupuesto/{id}:
 *   put:
 *     summary: Actualizar una plantilla
 *     tags: [PlantillasPresupuesto]
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
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               lineas:
 *                 type: array
 *     responses:
 *       200:
 *         description: Plantilla actualizada
 */
router.put('/:id', plantillasPresupuestoController.actualizar.bind(plantillasPresupuestoController));

/**
 * @swagger
 * /api/plantillas-presupuesto/{id}:
 *   delete:
 *     summary: Eliminar una plantilla
 *     tags: [PlantillasPresupuesto]
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
 *         description: Plantilla eliminada
 */
router.delete('/:id', plantillasPresupuestoController.eliminar.bind(plantillasPresupuestoController));

/**
 * @swagger
 * /api/plantillas-presupuesto/{id}/duplicar:
 *   post:
 *     summary: Duplicar una plantilla
 *     tags: [PlantillasPresupuesto]
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
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plantilla duplicada
 */
router.post('/:id/duplicar', plantillasPresupuestoController.duplicar.bind(plantillasPresupuestoController));

/**
 * @swagger
 * /api/plantillas-presupuesto/{id}/registrar-uso:
 *   post:
 *     summary: Registrar uso de una plantilla
 *     tags: [PlantillasPresupuesto]
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
 *         description: Uso registrado
 */
router.post('/:id/registrar-uso', plantillasPresupuestoController.registrarUso.bind(plantillasPresupuestoController));

export default router;
