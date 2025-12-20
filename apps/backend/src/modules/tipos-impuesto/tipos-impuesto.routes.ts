import { Router } from 'express';
import { tiposImpuestoController } from './tipos-impuesto.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import {
  requirePermission,
  requireOwnership,
  requireAuth,
} from '../../middleware/authorization.middleware';
import { TipoImpuesto } from './TipoImpuesto';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tipos de Impuesto
 *   description: Gestión de tipos de impuesto (IVA, IGIC, IPSI, etc.)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TipoImpuesto:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID del tipo de impuesto
 *         codigo:
 *           type: string
 *           description: Código único del impuesto
 *           example: IVA21
 *         nombre:
 *           type: string
 *           description: Nombre descriptivo
 *           example: IVA General
 *         descripcion:
 *           type: string
 *           description: Descripción opcional
 *         porcentaje:
 *           type: number
 *           description: Porcentaje del impuesto
 *           example: 21
 *         tipo:
 *           type: string
 *           enum: [IVA, IGIC, IPSI, OTRO]
 *           description: Tipo de impuesto
 *           example: IVA
 *         recargoEquivalencia:
 *           type: boolean
 *           description: Si aplica recargo de equivalencia
 *         porcentajeRecargo:
 *           type: number
 *           description: Porcentaje del recargo
 *           example: 5.2
 *         activo:
 *           type: boolean
 *           description: Si está activo
 *         predeterminado:
 *           type: boolean
 *           description: Si es el impuesto predeterminado
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
router.use(requireAuth);

/**
 * @swagger
 * /api/tipos-impuesto:
 *   get:
 *     summary: Obtener todos los tipos de impuesto con filtros y paginación
 *     tags: [Tipos de Impuesto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por código, nombre o descripción
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [IVA, IGIC, IPSI, OTRO]
 *         description: Filtrar por tipo
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
 *           default: codigo
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
 *         description: Lista de tipos de impuesto obtenida exitosamente
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
 *                     $ref: '#/components/schemas/TipoImpuesto'
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
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/',
  requirePermission('tipos-impuesto', 'read'),
  tiposImpuestoController.getAll.bind(tiposImpuestoController)
);

/**
 * @swagger
 * /api/tipos-impuesto/codigos:
 *   get:
 *     summary: Buscar códigos existentes por prefijo (para auto-sugerencia)
 *     tags: [Tipos de Impuesto]
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
 *         description: Lista de códigos que coinciden con el prefijo
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
 *                     type: string
 *       401:
 *         description: No autorizado
 */
router.get(
  '/codigos',
  requirePermission('tipos-impuesto', 'read'),
  tiposImpuestoController.searchCodigos.bind(tiposImpuestoController)
);

/**
 * @swagger
 * /api/tipos-impuesto/{id}:
 *   get:
 *     summary: Obtener un tipo de impuesto por ID
 *     tags: [Tipos de Impuesto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de impuesto
 *     responses:
 *       200:
 *         description: Tipo de impuesto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TipoImpuesto'
 *       404:
 *         description: Tipo de impuesto no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/:id',
  requirePermission('tipos-impuesto', 'read'),
  requireOwnership(TipoImpuesto, 'id'),
  tiposImpuestoController.getOne.bind(tiposImpuestoController)
);

/**
 * @swagger
 * /api/tipos-impuesto:
 *   post:
 *     summary: Crear un nuevo tipo de impuesto
 *     tags: [Tipos de Impuesto]
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
 *               - porcentaje
 *             properties:
 *               codigo:
 *                 type: string
 *                 description: Código único del impuesto
 *                 example: IVA21
 *               nombre:
 *                 type: string
 *                 description: Nombre descriptivo
 *                 example: IVA General
 *               descripcion:
 *                 type: string
 *                 example: IVA del 21% aplicable a la mayoría de productos
 *               porcentaje:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 21
 *               tipo:
 *                 type: string
 *                 enum: [IVA, IGIC, IPSI, OTRO]
 *                 default: IVA
 *                 example: IVA
 *               recargoEquivalencia:
 *                 type: boolean
 *                 default: false
 *               porcentajeRecargo:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 5.2
 *               activo:
 *                 type: boolean
 *                 default: true
 *               predeterminado:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Tipo de impuesto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TipoImpuesto'
 *                 message:
 *                   type: string
 *                   example: Tipo de impuesto creado correctamente
 *       400:
 *         description: Datos inválidos o código duplicado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post(
  '/',
  requirePermission('tipos-impuesto', 'create'),
  tiposImpuestoController.create.bind(tiposImpuestoController)
);

/**
 * @swagger
 * /api/tipos-impuesto/{id}:
 *   put:
 *     summary: Actualizar un tipo de impuesto
 *     tags: [Tipos de Impuesto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de impuesto
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
 *               porcentaje:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               tipo:
 *                 type: string
 *                 enum: [IVA, IGIC, IPSI, OTRO]
 *               recargoEquivalencia:
 *                 type: boolean
 *               porcentajeRecargo:
 *                 type: number
 *               activo:
 *                 type: boolean
 *               predeterminado:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tipo de impuesto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TipoImpuesto'
 *                 message:
 *                   type: string
 *                   example: Tipo de impuesto actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Tipo de impuesto no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put(
  '/:id',
  requirePermission('tipos-impuesto', 'update'),
  requireOwnership(TipoImpuesto, 'id'),
  tiposImpuestoController.update.bind(tiposImpuestoController)
);

/**
 * @swagger
 * /api/tipos-impuesto/{id}:
 *   delete:
 *     summary: Eliminar un tipo de impuesto
 *     tags: [Tipos de Impuesto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de impuesto
 *     responses:
 *       200:
 *         description: Tipo de impuesto eliminado exitosamente
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
 *                   example: Tipo de impuesto eliminado correctamente
 *       404:
 *         description: Tipo de impuesto no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete(
  '/:id',
  requirePermission('tipos-impuesto', 'delete'),
  requireOwnership(TipoImpuesto, 'id'),
  tiposImpuestoController.delete.bind(tiposImpuestoController)
);

/**
 * @swagger
 * /api/tipos-impuesto/{id}/predeterminado:
 *   post:
 *     summary: Establecer tipo de impuesto como predeterminado
 *     tags: [Tipos de Impuesto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de impuesto
 *     responses:
 *       200:
 *         description: Tipo de impuesto establecido como predeterminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TipoImpuesto'
 *                 message:
 *                   type: string
 *                   example: Tipo de impuesto establecido como predeterminado
 *       404:
 *         description: Tipo de impuesto no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post(
  '/:id/predeterminado',
  requirePermission('tipos-impuesto', 'update'),
  requireOwnership(TipoImpuesto, 'id'),
  tiposImpuestoController.setPredeterminado.bind(tiposImpuestoController)
);

/**
 * @swagger
 * /api/tipos-impuesto/{id}/duplicar:
 *   post:
 *     summary: Duplicar un tipo de impuesto
 *     tags: [Tipos de Impuesto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de impuesto a duplicar
 *     responses:
 *       201:
 *         description: Tipo de impuesto duplicado exitosamente
 *       404:
 *         description: Tipo de impuesto no encontrado
 *       401:
 *         description: No autenticado
 */
router.post('/:id/duplicar', tiposImpuestoController.duplicar.bind(tiposImpuestoController));

export default router;
