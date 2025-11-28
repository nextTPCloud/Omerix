import { Router } from 'express';
import { impresorasController } from './impresoras.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Impresoras
 *   description: Gestión de impresoras (tickets, cocina, etiquetas, fiscales)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Impresora:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID de la impresora
 *         nombre:
 *           type: string
 *           description: Nombre identificativo de la impresora
 *           example: Impresora Cocina Principal
 *         tipo:
 *           type: string
 *           enum: [ticket, cocina, etiquetas, fiscal]
 *           description: Tipo de impresora
 *           example: cocina
 *         tipoConexion:
 *           type: string
 *           enum: [usb, red, bluetooth, serie]
 *           description: Tipo de conexión
 *           example: red
 *         ip:
 *           type: string
 *           description: Dirección IP (para conexión de red)
 *           example: "192.168.1.100"
 *         puerto:
 *           type: number
 *           description: Puerto de conexión
 *           example: 9100
 *         mac:
 *           type: string
 *           description: Dirección MAC (para bluetooth)
 *         puertoSerie:
 *           type: string
 *           description: Puerto serie (COM1, /dev/ttyUSB0)
 *           example: COM1
 *         baudRate:
 *           type: number
 *           description: Velocidad del puerto serie
 *           example: 9600
 *         modelo:
 *           type: string
 *           description: Modelo de la impresora
 *           example: Epson TM-T20III
 *         fabricante:
 *           type: string
 *           description: Fabricante
 *           example: Epson
 *         anchoPapel:
 *           type: number
 *           enum: [58, 80]
 *           description: Ancho del papel en mm
 *           example: 80
 *         cortarPapel:
 *           type: boolean
 *           description: Cortar papel automáticamente
 *           example: true
 *         abrirCajon:
 *           type: boolean
 *           description: Abrir cajón al imprimir ticket
 *           example: true
 *         imprimirLogo:
 *           type: boolean
 *           description: Imprimir logo en tickets
 *           example: true
 *         copias:
 *           type: number
 *           description: Número de copias por defecto
 *           example: 1
 *         zonaPreparacionId:
 *           type: string
 *           description: ID de la zona de preparación asociada
 *         activo:
 *           type: boolean
 *           description: Si está activa
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
router.get('/search-codigos', (req, res) => impresorasController.searchCodigos(req, res));

/**
 * @swagger
 * /api/impresoras:
 *   get:
 *     summary: Obtener todas las impresoras con filtros y paginación
 *     tags: [Impresoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o modelo
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [ticket, cocina, etiquetas, fiscal]
 *         description: Filtrar por tipo de impresora
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
 *         description: Lista de impresoras obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Impresora'
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
router.get('/', (req, res) => impresorasController.findAll(req, res));

/**
 * @swagger
 * /api/impresoras/{id}:
 *   get:
 *     summary: Obtener una impresora por ID
 *     tags: [Impresoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la impresora
 *     responses:
 *       200:
 *         description: Impresora encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Impresora'
 *       404:
 *         description: Impresora no encontrada
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', (req, res) => impresorasController.findOne(req, res));

/**
 * @swagger
 * /api/impresoras:
 *   post:
 *     summary: Crear una nueva impresora
 *     tags: [Impresoras]
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
 *               - tipo
 *               - tipoConexion
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Impresora Cocina Principal
 *               tipo:
 *                 type: string
 *                 enum: [ticket, cocina, etiquetas, fiscal]
 *                 example: cocina
 *               tipoConexion:
 *                 type: string
 *                 enum: [usb, red, bluetooth, serie]
 *                 example: red
 *               ip:
 *                 type: string
 *                 example: "192.168.1.100"
 *               puerto:
 *                 type: number
 *                 example: 9100
 *               mac:
 *                 type: string
 *               puertoSerie:
 *                 type: string
 *               baudRate:
 *                 type: number
 *               modelo:
 *                 type: string
 *                 example: Epson TM-T20III
 *               fabricante:
 *                 type: string
 *                 example: Epson
 *               anchoPapel:
 *                 type: number
 *                 enum: [58, 80]
 *                 default: 80
 *               cortarPapel:
 *                 type: boolean
 *                 default: true
 *               abrirCajon:
 *                 type: boolean
 *                 default: false
 *               imprimirLogo:
 *                 type: boolean
 *                 default: true
 *               copias:
 *                 type: number
 *                 default: 1
 *               zonaPreparacionId:
 *                 type: string
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Impresora creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Impresora'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/', (req, res) => impresorasController.create(req, res));

/**
 * @swagger
 * /api/impresoras/{id}:
 *   put:
 *     summary: Actualizar una impresora
 *     tags: [Impresoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la impresora
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [ticket, cocina, etiquetas, fiscal]
 *               tipoConexion:
 *                 type: string
 *                 enum: [usb, red, bluetooth, serie]
 *               ip:
 *                 type: string
 *               puerto:
 *                 type: number
 *               mac:
 *                 type: string
 *               puertoSerie:
 *                 type: string
 *               baudRate:
 *                 type: number
 *               modelo:
 *                 type: string
 *               fabricante:
 *                 type: string
 *               anchoPapel:
 *                 type: number
 *                 enum: [58, 80]
 *               cortarPapel:
 *                 type: boolean
 *               abrirCajon:
 *                 type: boolean
 *               imprimirLogo:
 *                 type: boolean
 *               copias:
 *                 type: number
 *               zonaPreparacionId:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Impresora actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Impresora'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Impresora no encontrada
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', (req, res) => impresorasController.update(req, res));

/**
 * @swagger
 * /api/impresoras/{id}:
 *   delete:
 *     summary: Eliminar una impresora
 *     tags: [Impresoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la impresora
 *     responses:
 *       200:
 *         description: Impresora eliminada exitosamente
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
 *                   example: Impresora eliminada correctamente
 *       404:
 *         description: Impresora no encontrada
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', (req, res) => impresorasController.delete(req, res));

/**
 * @swagger
 * /api/impresoras/{id}/test:
 *   post:
 *     summary: Probar conexión con una impresora
 *     tags: [Impresoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la impresora
 *     description: Envía una página de prueba a la impresora para verificar la conexión
 *     responses:
 *       200:
 *         description: Prueba de impresión exitosa
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
 *                   example: Prueba de impresión enviada correctamente
 *       404:
 *         description: Impresora no encontrada
 *       400:
 *         description: Error de conexión con la impresora
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/:id/test', (req, res) => impresorasController.testConnection(req, res));

export default router;
