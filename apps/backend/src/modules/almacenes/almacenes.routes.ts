import { Router } from 'express';
import { almacenesController } from './almacenes.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Almacenes
 *   description: Gestión de almacenes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Direccion:
 *       type: object
 *       properties:
 *         calle:
 *           type: string
 *           description: Nombre de la calle
 *           example: Avenida Principal
 *         numero:
 *           type: string
 *           description: Número de la calle
 *           example: "123"
 *         codigoPostal:
 *           type: string
 *           description: Código postal
 *           example: "28001"
 *         ciudad:
 *           type: string
 *           description: Ciudad
 *           example: Madrid
 *         provincia:
 *           type: string
 *           description: Provincia
 *           example: Madrid
 *         pais:
 *           type: string
 *           description: País
 *           example: España
 *     Almacen:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID del almacén
 *         codigo:
 *           type: string
 *           description: Código único del almacén
 *           example: ALM001
 *         nombre:
 *           type: string
 *           description: Nombre del almacén
 *           example: Almacén Central
 *         descripcion:
 *           type: string
 *           description: Descripción del almacén
 *         direccion:
 *           $ref: '#/components/schemas/Direccion'
 *         esPrincipal:
 *           type: boolean
 *           description: Si es el almacén principal
 *           example: true
 *         activo:
 *           type: boolean
 *           description: Si está activo
 *           example: true
 *         capacidadMaxima:
 *           type: number
 *           description: Capacidad máxima del almacén
 *           example: 10000
 *         unidadCapacidad:
 *           type: string
 *           enum: [unidades, kg, m3, litros]
 *           description: Unidad de medida de la capacidad
 *           example: unidades
 *         responsable:
 *           type: string
 *           description: Nombre del responsable
 *           example: Juan Pérez
 *         telefono:
 *           type: string
 *           description: Teléfono de contacto
 *           example: "+34 912 345 678"
 *         email:
 *           type: string
 *           description: Email de contacto
 *           example: almacen@empresa.com
 *         usarEnTPV:
 *           type: boolean
 *           description: Si aparece en el selector del TPV
 *           example: true
 *         notas:
 *           type: string
 *           description: Notas adicionales
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/almacenes:
 *   get:
 *     summary: Obtener todos los almacenes con filtros y paginación
 *     tags: [Almacenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por código, nombre o descripción
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *         description: Filtrar por estado activo (true/false)
 *       - in: query
 *         name: esPrincipal
 *         schema:
 *           type: string
 *         description: Filtrar por almacén principal (true/false)
 *       - in: query
 *         name: usarEnTPV
 *         schema:
 *           type: string
 *         description: Filtrar por uso en TPV (true/false)
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
 *           default: nombre
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
 *         description: Lista de almacenes obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Almacen'
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
router.get('/', almacenesController.getAll.bind(almacenesController));

/**
 * @swagger
 * /api/almacenes/principal:
 *   get:
 *     summary: Obtener el almacén principal
 *     tags: [Almacenes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Almacén principal encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Almacen'
 *       404:
 *         description: No hay almacén principal definido
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/principal', almacenesController.getPrincipal.bind(almacenesController));

/**
 * @swagger
 * /api/almacenes/activos:
 *   get:
 *     summary: Obtener todos los almacenes activos
 *     tags: [Almacenes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de almacenes activos
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
 *                     $ref: '#/components/schemas/Almacen'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/activos', almacenesController.getActivos.bind(almacenesController));

/**
 * @swagger
 * /api/almacenes/{id}:
 *   get:
 *     summary: Obtener un almacén por ID
 *     tags: [Almacenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del almacén
 *     responses:
 *       200:
 *         description: Almacén encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Almacen'
 *       404:
 *         description: Almacén no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', almacenesController.getOne.bind(almacenesController));

/**
 * @swagger
 * /api/almacenes:
 *   post:
 *     summary: Crear un nuevo almacén
 *     tags: [Almacenes]
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
 *             properties:
 *               codigo:
 *                 type: string
 *                 description: Código único del almacén
 *                 example: ALM001
 *               nombre:
 *                 type: string
 *                 description: Nombre del almacén
 *                 example: Almacén Central
 *               descripcion:
 *                 type: string
 *                 example: Almacén principal de la empresa
 *               direccion:
 *                 $ref: '#/components/schemas/Direccion'
 *               esPrincipal:
 *                 type: boolean
 *                 default: false
 *               activo:
 *                 type: boolean
 *                 default: true
 *               capacidadMaxima:
 *                 type: number
 *                 minimum: 0
 *                 example: 10000
 *               unidadCapacidad:
 *                 type: string
 *                 enum: [unidades, kg, m3, litros]
 *                 default: unidades
 *               responsable:
 *                 type: string
 *                 example: Juan Pérez
 *               telefono:
 *                 type: string
 *                 example: "+34 912 345 678"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: almacen@empresa.com
 *               usarEnTPV:
 *                 type: boolean
 *                 default: true
 *               notas:
 *                 type: string
 *     responses:
 *       201:
 *         description: Almacén creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Almacen'
 *                 message:
 *                   type: string
 *                   example: Almacén creado correctamente
 *       400:
 *         description: Datos inválidos o código duplicado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/', almacenesController.create.bind(almacenesController));

/**
 * @swagger
 * /api/almacenes/{id}:
 *   put:
 *     summary: Actualizar un almacén
 *     tags: [Almacenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del almacén
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               direccion:
 *                 $ref: '#/components/schemas/Direccion'
 *               esPrincipal:
 *                 type: boolean
 *               activo:
 *                 type: boolean
 *               capacidadMaxima:
 *                 type: number
 *               unidadCapacidad:
 *                 type: string
 *                 enum: [unidades, kg, m3, litros]
 *               responsable:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               usarEnTPV:
 *                 type: boolean
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Almacén actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Almacen'
 *                 message:
 *                   type: string
 *                   example: Almacén actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Almacén no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', almacenesController.update.bind(almacenesController));

/**
 * @swagger
 * /api/almacenes/{id}:
 *   delete:
 *     summary: Eliminar un almacén
 *     tags: [Almacenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del almacén
 *     responses:
 *       200:
 *         description: Almacén eliminado exitosamente
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
 *                   example: Almacén eliminado correctamente
 *       404:
 *         description: Almacén no encontrado
 *       400:
 *         description: No se puede eliminar el almacén principal
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', almacenesController.delete.bind(almacenesController));

/**
 * @swagger
 * /api/almacenes/{id}/principal:
 *   post:
 *     summary: Establecer almacén como principal
 *     tags: [Almacenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del almacén
 *     responses:
 *       200:
 *         description: Almacén establecido como principal exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Almacen'
 *                 message:
 *                   type: string
 *                   example: Almacén establecido como principal
 *       404:
 *         description: Almacén no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/:id/principal', almacenesController.setPrincipal.bind(almacenesController));

export default router;
