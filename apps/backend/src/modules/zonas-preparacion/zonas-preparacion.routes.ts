import { Router } from 'express';
import { zonasPreparacionController } from './zonas-preparacion.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ZonasPreparacion
 *   description: Gestión de zonas de preparación (cocina caliente, fría, barra, etc.)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     KdsConfig:
 *       type: object
 *       properties:
 *         habilitado:
 *           type: boolean
 *           description: Si el KDS está habilitado para esta zona
 *           example: true
 *         dispositivoId:
 *           type: string
 *           description: ID del dispositivo KDS
 *         mostrarTiempo:
 *           type: boolean
 *           description: Mostrar tiempo transcurrido
 *           example: true
 *         mostrarPrioridad:
 *           type: boolean
 *           description: Mostrar indicador de prioridad
 *           example: true
 *         sonidoNuevaComanda:
 *           type: boolean
 *           description: Reproducir sonido al recibir comanda
 *           example: true
 *     ZonaPreparacion:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID de la zona
 *         nombre:
 *           type: string
 *           description: Nombre de la zona
 *           example: Cocina Caliente
 *         codigo:
 *           type: string
 *           description: Código único de la zona
 *           example: COC-CAL
 *         descripcion:
 *           type: string
 *           description: Descripción de la zona
 *         color:
 *           type: string
 *           description: Color para identificación visual
 *           example: "#EF4444"
 *         icono:
 *           type: string
 *           description: Nombre del icono
 *           example: flame
 *         impresoraId:
 *           type: string
 *           description: ID de la impresora asociada
 *         orden:
 *           type: number
 *           description: Orden de visualización
 *           example: 1
 *         tiempoPreparacionPromedio:
 *           type: number
 *           description: Tiempo promedio de preparación en minutos
 *           example: 15
 *         notificarRetraso:
 *           type: boolean
 *           description: Notificar cuando hay retraso
 *           example: true
 *         tiempoAlertaMinutos:
 *           type: number
 *           description: Minutos para alertar de retraso
 *           example: 10
 *         activo:
 *           type: boolean
 *           description: Si está activa
 *           example: true
 *         kds:
 *           $ref: '#/components/schemas/KdsConfig'
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
router.get('/search-codigos', (req, res) => zonasPreparacionController.searchCodigos(req, res));

/**
 * @swagger
 * /api/zonas-preparacion:
 *   get:
 *     summary: Obtener todas las zonas de preparación con filtros y paginación
 *     tags: [ZonasPreparacion]
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
 *         description: Lista de zonas obtenida exitosamente
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
 *                     $ref: '#/components/schemas/ZonaPreparacion'
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
router.get('/', (req, res) => zonasPreparacionController.findAll(req, res));

/**
 * @swagger
 * /api/zonas-preparacion/{id}:
 *   get:
 *     summary: Obtener una zona de preparación por ID
 *     tags: [ZonasPreparacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la zona
 *     responses:
 *       200:
 *         description: Zona encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ZonaPreparacion'
 *       404:
 *         description: Zona no encontrada
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', (req, res) => zonasPreparacionController.findOne(req, res));

/**
 * @swagger
 * /api/zonas-preparacion:
 *   post:
 *     summary: Crear una nueva zona de preparación
 *     tags: [ZonasPreparacion]
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
 *                 example: Cocina Caliente
 *               codigo:
 *                 type: string
 *                 example: COC-CAL
 *               descripcion:
 *                 type: string
 *               color:
 *                 type: string
 *                 example: "#EF4444"
 *               icono:
 *                 type: string
 *                 example: flame
 *               impresoraId:
 *                 type: string
 *               orden:
 *                 type: number
 *                 default: 0
 *               tiempoPreparacionPromedio:
 *                 type: number
 *               notificarRetraso:
 *                 type: boolean
 *                 default: true
 *               tiempoAlertaMinutos:
 *                 type: number
 *                 default: 10
 *               activo:
 *                 type: boolean
 *                 default: true
 *               kds:
 *                 $ref: '#/components/schemas/KdsConfig'
 *     responses:
 *       201:
 *         description: Zona creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ZonaPreparacion'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/', (req, res) => zonasPreparacionController.create(req, res));

/**
 * @swagger
 * /api/zonas-preparacion/{id}:
 *   put:
 *     summary: Actualizar una zona de preparación
 *     tags: [ZonasPreparacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la zona
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
 *               color:
 *                 type: string
 *               icono:
 *                 type: string
 *               impresoraId:
 *                 type: string
 *               orden:
 *                 type: number
 *               tiempoPreparacionPromedio:
 *                 type: number
 *               notificarRetraso:
 *                 type: boolean
 *               tiempoAlertaMinutos:
 *                 type: number
 *               activo:
 *                 type: boolean
 *               kds:
 *                 $ref: '#/components/schemas/KdsConfig'
 *     responses:
 *       200:
 *         description: Zona actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ZonaPreparacion'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Zona no encontrada
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', (req, res) => zonasPreparacionController.update(req, res));

/**
 * @swagger
 * /api/zonas-preparacion/{id}:
 *   delete:
 *     summary: Eliminar una zona de preparación
 *     tags: [ZonasPreparacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la zona
 *     responses:
 *       200:
 *         description: Zona eliminada exitosamente
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
 *                   example: Zona eliminada correctamente
 *       404:
 *         description: Zona no encontrada
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', (req, res) => zonasPreparacionController.delete(req, res));

export default router;
