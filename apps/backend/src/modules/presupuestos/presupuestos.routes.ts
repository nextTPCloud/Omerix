import { Router } from 'express';
import { presupuestosController } from './presupuestos.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     LineaPresupuesto:
 *       type: object
 *       properties:
 *         orden:
 *           type: number
 *         tipo:
 *           type: string
 *           enum: [producto, servicio, kit, texto, subtotal, descuento]
 *         productoId:
 *           type: string
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *         cantidad:
 *           type: number
 *         precioUnitario:
 *           type: number
 *         costeUnitario:
 *           type: number
 *         descuento:
 *           type: number
 *         iva:
 *           type: number
 *         subtotal:
 *           type: number
 *         total:
 *           type: number
 *         margenPorcentaje:
 *           type: number
 *     Presupuesto:
 *       type: object
 *       required:
 *         - clienteId
 *         - clienteNombre
 *         - clienteNif
 *       properties:
 *         _id:
 *           type: string
 *         codigo:
 *           type: string
 *         serie:
 *           type: string
 *         numero:
 *           type: number
 *         version:
 *           type: number
 *         estado:
 *           type: string
 *           enum: [borrador, enviado, pendiente, aceptado, rechazado, caducado, convertido]
 *         fecha:
 *           type: string
 *           format: date
 *         fechaValidez:
 *           type: string
 *           format: date
 *         clienteId:
 *           type: string
 *         clienteNombre:
 *           type: string
 *         clienteNif:
 *           type: string
 *         proyectoId:
 *           type: string
 *         agenteComercialId:
 *           type: string
 *         lineas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LineaPresupuesto'
 *         totales:
 *           type: object
 *           properties:
 *             subtotalBruto:
 *               type: number
 *             totalDescuentos:
 *               type: number
 *             subtotalNeto:
 *               type: number
 *             totalIva:
 *               type: number
 *             totalPresupuesto:
 *               type: number
 *             costeTotal:
 *               type: number
 *             margenBruto:
 *               type: number
 *             margenPorcentaje:
 *               type: number
 *         mostrarCostes:
 *           type: boolean
 *           description: Toggle para ocultar costes al mostrar al cliente
 */

/**
 * @swagger
 * tags:
 *   name: Presupuestos
 *   description: Gestión de presupuestos con costes y márgenes
 */

/**
 * @swagger
 * /api/presupuestos/sugerir-codigo:
 *   get:
 *     summary: Obtener el siguiente código de presupuesto sugerido
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serie
 *         schema:
 *           type: string
 *           default: P
 *         description: Serie del presupuesto
 *     responses:
 *       200:
 *         description: Código sugerido
 */
router.get('/sugerir-codigo', presupuestosController.sugerirCodigo.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de presupuestos
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de presupuestos
 */
router.get('/estadisticas', presupuestosController.obtenerEstadisticas.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/cliente/{clienteId}:
 *   get:
 *     summary: Obtener presupuestos de un cliente
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de presupuestos del cliente
 */
router.get('/cliente/:clienteId', presupuestosController.obtenerPorCliente.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/proyecto/{proyectoId}:
 *   get:
 *     summary: Obtener presupuestos de un proyecto
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proyectoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de presupuestos del proyecto
 */
router.get('/proyecto/:proyectoId', presupuestosController.obtenerPorProyecto.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos:
 *   get:
 *     summary: Obtener todos los presupuestos
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [borrador, enviado, pendiente, aceptado, rechazado, caducado, convertido]
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *       - in: query
 *         name: proyectoId
 *         schema:
 *           type: string
 *       - in: query
 *         name: vigentes
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
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
 *         description: Lista de presupuestos paginada
 */
router.get('/', presupuestosController.obtenerTodos.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos:
 *   post:
 *     summary: Crear un nuevo presupuesto
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Presupuesto'
 *     responses:
 *       201:
 *         description: Presupuesto creado
 */
router.post('/', presupuestosController.crear.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples presupuestos
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Presupuestos eliminados
 */
router.post('/bulk-delete', presupuestosController.eliminarVarios.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}:
 *   get:
 *     summary: Obtener un presupuesto por ID
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: ocultarCostes
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Si es true, oculta los costes y márgenes
 *     responses:
 *       200:
 *         description: Presupuesto encontrado
 *       404:
 *         description: Presupuesto no encontrado
 */
router.get('/:id', presupuestosController.obtenerPorId.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}:
 *   put:
 *     summary: Actualizar un presupuesto
 *     tags: [Presupuestos]
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
 *             $ref: '#/components/schemas/Presupuesto'
 *     responses:
 *       200:
 *         description: Presupuesto actualizado
 */
router.put('/:id', presupuestosController.actualizar.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}:
 *   delete:
 *     summary: Eliminar un presupuesto
 *     tags: [Presupuestos]
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
 *         description: Presupuesto eliminado
 */
router.delete('/:id', presupuestosController.eliminar.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de un presupuesto
 *     tags: [Presupuestos]
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
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [borrador, enviado, pendiente, aceptado, rechazado, caducado, convertido]
 *               observaciones:
 *                 type: string
 *               fechaRespuesta:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Estado cambiado
 */
router.patch('/:id/estado', presupuestosController.cambiarEstado.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/duplicar:
 *   post:
 *     summary: Duplicar un presupuesto
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nuevoCliente:
 *                 type: string
 *                 description: ID del nuevo cliente (opcional)
 *               mantenerPrecios:
 *                 type: boolean
 *                 default: true
 *               mantenerCostes:
 *                 type: boolean
 *                 default: true
 *               nuevaFecha:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Presupuesto duplicado
 */
router.post('/:id/duplicar', presupuestosController.duplicar.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/revision:
 *   post:
 *     summary: Crear una revisión del presupuesto
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Revisión creada
 */
router.post('/:id/revision', presupuestosController.crearRevision.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/aplicar-margen:
 *   post:
 *     summary: Aplicar margen a las líneas del presupuesto
 *     tags: [Presupuestos]
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
 *               - valor
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [porcentaje, importe]
 *                 description: Tipo de margen a aplicar
 *               valor:
 *                 type: number
 *                 description: Valor del margen (% o €)
 *               aplicarA:
 *                 type: string
 *                 enum: [todas, productos, servicios, seleccionadas]
 *                 default: todas
 *               lineasIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de líneas específicas (para aplicarA=seleccionadas)
 *               sobreCoste:
 *                 type: boolean
 *                 default: true
 *                 description: Si true, aplica sobre coste; si false, sobre precio actual
 *     responses:
 *       200:
 *         description: Margen aplicado
 */
router.post('/:id/aplicar-margen', presupuestosController.aplicarMargen.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/importar-lineas:
 *   post:
 *     summary: Importar líneas de otro documento o productos
 *     tags: [Presupuestos]
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
 *               - origen
 *             properties:
 *               origen:
 *                 type: string
 *                 enum: [presupuesto, pedido, factura, productos]
 *               documentoId:
 *                 type: string
 *                 description: ID del documento origen (si no es productos)
 *               productosIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de productos a importar (si origen=productos)
 *               incluirPrecios:
 *                 type: boolean
 *                 default: true
 *               incluirDescuentos:
 *                 type: boolean
 *                 default: true
 *               incluirCostes:
 *                 type: boolean
 *                 default: true
 *               multiplicador:
 *                 type: number
 *                 default: 1
 *                 description: Factor para multiplicar cantidades
 *     responses:
 *       200:
 *         description: Líneas importadas
 */
router.post('/:id/importar-lineas', presupuestosController.importarLineas.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/toggle-costes:
 *   patch:
 *     summary: Activar/desactivar visibilidad de costes
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     description: Toggle rápido para ocultar costes cuando el cliente está delante
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
 *               - mostrarCostes
 *             properties:
 *               mostrarCostes:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Visibilidad de costes actualizada
 */
router.patch('/:id/toggle-costes', presupuestosController.toggleMostrarCostes.bind(presupuestosController));

export default router;
