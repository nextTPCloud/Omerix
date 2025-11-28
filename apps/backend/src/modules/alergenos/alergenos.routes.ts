import { Router } from 'express';
import { alergenosController } from './alergenos.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Alergenos
 *   description: Gestión de alérgenos (incluye los 14 obligatorios de la UE)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Alergeno:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID del alérgeno
 *         nombre:
 *           type: string
 *           description: Nombre del alérgeno
 *           example: Gluten
 *         codigo:
 *           type: string
 *           description: Código único del alérgeno
 *           example: GLUTEN
 *         descripcion:
 *           type: string
 *           description: Descripción detallada
 *           example: Cereales que contienen gluten
 *         icono:
 *           type: string
 *           description: Nombre del icono
 *           example: wheat
 *         color:
 *           type: string
 *           description: Color para identificación visual
 *           example: "#F59E0B"
 *         esObligatorioUE:
 *           type: boolean
 *           description: Si es uno de los 14 alérgenos obligatorios de la UE
 *           example: true
 *         orden:
 *           type: number
 *           description: Orden de visualización
 *           example: 1
 *         activo:
 *           type: boolean
 *           description: Si está activo
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

router.use(authMiddleware);
router.use(tenantMiddleware);

// Ruta para buscar códigos (debe ir antes de /:id para evitar conflictos)
router.get('/search-codigos', (req, res) => alergenosController.searchCodigos(req, res));

/**
 * @swagger
 * /api/alergenos:
 *   get:
 *     summary: Obtener todos los alérgenos con filtros y paginación
 *     tags: [Alergenos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o código
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *         description: Filtrar por estado activo (true/false)
 *       - in: query
 *         name: esObligatorioUE
 *         schema:
 *           type: string
 *         description: Filtrar por alérgenos obligatorios UE (true/false)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Elementos por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: orden
 *         description: Campo por el que ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Orden ascendente o descendente
 *     responses:
 *       200:
 *         description: Lista de alérgenos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Alergeno'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/', (req, res) => alergenosController.findAll(req, res));

/**
 * @swagger
 * /api/alergenos/initialize-ue:
 *   post:
 *     summary: Inicializar los 14 alérgenos obligatorios de la UE
 *     tags: [Alergenos]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Crea automáticamente los 14 alérgenos obligatorios según la normativa UE 1169/2011:
 *       1. Gluten
 *       2. Crustáceos
 *       3. Huevos
 *       4. Pescado
 *       5. Cacahuetes
 *       6. Soja
 *       7. Lácteos
 *       8. Frutos de cáscara
 *       9. Apio
 *       10. Mostaza
 *       11. Sésamo
 *       12. Sulfitos
 *       13. Altramuces
 *       14. Moluscos
 *     responses:
 *       200:
 *         description: Alérgenos inicializados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Alérgenos UE inicializados correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: integer
 *                       description: Número de alérgenos creados
 *                       example: 14
 *                     existing:
 *                       type: integer
 *                       description: Número de alérgenos que ya existían
 *                       example: 0
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/initialize-ue', (req, res) => alergenosController.initializeUE(req, res));

/**
 * @swagger
 * /api/alergenos/{id}:
 *   get:
 *     summary: Obtener un alérgeno por ID
 *     tags: [Alergenos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del alérgeno
 *     responses:
 *       200:
 *         description: Alérgeno encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Alergeno'
 *       404:
 *         description: Alérgeno no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', (req, res) => alergenosController.findOne(req, res));

/**
 * @swagger
 * /api/alergenos:
 *   post:
 *     summary: Crear un nuevo alérgeno
 *     tags: [Alergenos]
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
 *               - codigo
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del alérgeno
 *                 example: Gluten
 *               codigo:
 *                 type: string
 *                 description: Código único
 *                 example: GLUTEN
 *               descripcion:
 *                 type: string
 *                 example: Cereales que contienen gluten
 *               icono:
 *                 type: string
 *                 example: wheat
 *               color:
 *                 type: string
 *                 example: "#F59E0B"
 *               esObligatorioUE:
 *                 type: boolean
 *                 default: false
 *               orden:
 *                 type: number
 *                 default: 0
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Alérgeno creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Alergeno'
 *       400:
 *         description: Datos inválidos o código duplicado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/', (req, res) => alergenosController.create(req, res));

/**
 * @swagger
 * /api/alergenos/{id}:
 *   put:
 *     summary: Actualizar un alérgeno
 *     tags: [Alergenos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del alérgeno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               codigo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               icono:
 *                 type: string
 *               color:
 *                 type: string
 *               esObligatorioUE:
 *                 type: boolean
 *               orden:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Alérgeno actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Alergeno'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Alérgeno no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', (req, res) => alergenosController.update(req, res));

/**
 * @swagger
 * /api/alergenos/{id}:
 *   delete:
 *     summary: Eliminar un alérgeno
 *     tags: [Alergenos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del alérgeno
 *     responses:
 *       200:
 *         description: Alérgeno eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Alérgeno eliminado correctamente
 *       404:
 *         description: Alérgeno no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', (req, res) => alergenosController.delete(req, res));

export default router;
