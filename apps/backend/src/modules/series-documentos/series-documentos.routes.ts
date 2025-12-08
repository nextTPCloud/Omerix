import { Router } from 'express';
import { seriesDocumentosController } from './series-documentos.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Series de Documentos
 *   description: Gestión de series de numeración para documentos (presupuestos, pedidos, albaranes, facturas)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SerieDocumento:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         codigo:
 *           type: string
 *           description: Código de la serie (ej. A, B, FC)
 *         nombre:
 *           type: string
 *           description: Nombre descriptivo
 *         descripcion:
 *           type: string
 *         tipoDocumento:
 *           type: string
 *           enum: [presupuesto, pedido, albaran, factura, factura_rectificativa, pedido_proveedor, albaran_proveedor, factura_proveedor]
 *         prefijo:
 *           type: string
 *           description: Prefijo del número (ej. PRES-, PED-)
 *         sufijo:
 *           type: string
 *         longitudNumero:
 *           type: integer
 *           description: Longitud del número con padding de ceros
 *         siguienteNumero:
 *           type: integer
 *           description: Próximo número a usar
 *         incluirAnio:
 *           type: boolean
 *           description: Incluir año en el código
 *         separadorAnio:
 *           type: string
 *           description: Separador del año (/, -, etc)
 *         reiniciarAnualmente:
 *           type: boolean
 *           description: Reiniciar numeración cada año
 *         activo:
 *           type: boolean
 *         predeterminada:
 *           type: boolean
 *           description: Serie por defecto para este tipo de documento
 */

// ============================================
// RUTAS DE UTILIDAD (antes de :id)
// ============================================

/**
 * @swagger
 * /api/series-documentos/sugerir-codigo:
 *   get:
 *     summary: Obtener el próximo código sugerido para un tipo de documento
 *     description: Devuelve el código que se generaría sin incrementar el contador
 *     tags: [Series de Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipoDocumento
 *         required: true
 *         schema:
 *           type: string
 *           enum: [presupuesto, pedido, albaran, factura, factura_rectificativa, pedido_proveedor, albaran_proveedor, factura_proveedor]
 *         description: Tipo de documento
 *       - in: query
 *         name: serieId
 *         schema:
 *           type: string
 *         description: ID de serie específica (opcional, si no se indica usa la predeterminada)
 *     responses:
 *       200:
 *         description: Código sugerido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     codigo:
 *                       type: string
 *                     serieId:
 *                       type: string
 *                     siguienteNumero:
 *                       type: integer
 */
router.get('/sugerir-codigo', seriesDocumentosController.sugerirCodigo);

/**
 * @swagger
 * /api/series-documentos/generar-codigo:
 *   post:
 *     summary: Generar código e incrementar el contador
 *     description: Genera el código y aumenta el contador de la serie
 *     tags: [Series de Documentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipoDocumento
 *             properties:
 *               tipoDocumento:
 *                 type: string
 *                 enum: [presupuesto, pedido, albaran, factura, factura_rectificativa, pedido_proveedor, albaran_proveedor, factura_proveedor]
 *               serieId:
 *                 type: string
 *                 description: ID de serie específica (opcional)
 *     responses:
 *       200:
 *         description: Código generado
 */
router.post('/generar-codigo', seriesDocumentosController.generarCodigo);

/**
 * @swagger
 * /api/series-documentos/crear-por-defecto:
 *   post:
 *     summary: Crear series por defecto para la empresa
 *     description: Crea una serie predeterminada para cada tipo de documento
 *     tags: [Series de Documentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Series creadas correctamente
 *       409:
 *         description: Ya existen series para esta empresa
 */
router.post('/crear-por-defecto', seriesDocumentosController.crearSeriesPorDefecto);

/**
 * @swagger
 * /api/series-documentos/tipo/{tipoDocumento}:
 *   get:
 *     summary: Obtener series por tipo de documento
 *     tags: [Series de Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipoDocumento
 *         required: true
 *         schema:
 *           type: string
 *           enum: [presupuesto, pedido, albaran, factura, factura_rectificativa, pedido_proveedor, albaran_proveedor, factura_proveedor]
 *       - in: query
 *         name: soloActivas
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Solo devolver series activas
 *     responses:
 *       200:
 *         description: Lista de series del tipo especificado
 */
router.get('/tipo/:tipoDocumento', seriesDocumentosController.obtenerPorTipoDocumento);

// ============================================
// CRUD BÁSICO
// ============================================

/**
 * @swagger
 * /api/series-documentos:
 *   get:
 *     summary: Obtener todas las series con filtros
 *     tags: [Series de Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por código o nombre
 *       - in: query
 *         name: tipoDocumento
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de documento
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: predeterminada
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filtrar por predeterminada
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista de series
 */
router.get('/', seriesDocumentosController.buscar);

/**
 * @swagger
 * /api/series-documentos:
 *   post:
 *     summary: Crear una nueva serie de documentos
 *     tags: [Series de Documentos]
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
 *               - tipoDocumento
 *             properties:
 *               codigo:
 *                 type: string
 *                 maxLength: 10
 *               nombre:
 *                 type: string
 *                 maxLength: 100
 *               descripcion:
 *                 type: string
 *               tipoDocumento:
 *                 type: string
 *                 enum: [presupuesto, pedido, albaran, factura, factura_rectificativa, pedido_proveedor, albaran_proveedor, factura_proveedor]
 *               prefijo:
 *                 type: string
 *               sufijo:
 *                 type: string
 *               longitudNumero:
 *                 type: integer
 *                 default: 5
 *               siguienteNumero:
 *                 type: integer
 *                 default: 1
 *               incluirAnio:
 *                 type: boolean
 *                 default: true
 *               separadorAnio:
 *                 type: string
 *                 default: '/'
 *               reiniciarAnualmente:
 *                 type: boolean
 *                 default: true
 *               activo:
 *                 type: boolean
 *                 default: true
 *               predeterminada:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Serie creada correctamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Ya existe una serie con ese código para este tipo
 */
router.post('/', seriesDocumentosController.crear);

/**
 * @swagger
 * /api/series-documentos/{id}:
 *   get:
 *     summary: Obtener una serie por ID
 *     tags: [Series de Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la serie
 *     responses:
 *       200:
 *         description: Datos de la serie
 *       404:
 *         description: Serie no encontrada
 */
router.get('/:id', seriesDocumentosController.obtenerPorId);

/**
 * @swagger
 * /api/series-documentos/{id}:
 *   put:
 *     summary: Actualizar una serie
 *     tags: [Series de Documentos]
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
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               prefijo:
 *                 type: string
 *               sufijo:
 *                 type: string
 *               longitudNumero:
 *                 type: integer
 *               siguienteNumero:
 *                 type: integer
 *               incluirAnio:
 *                 type: boolean
 *               separadorAnio:
 *                 type: string
 *               reiniciarAnualmente:
 *                 type: boolean
 *               activo:
 *                 type: boolean
 *               predeterminada:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Serie actualizada
 *       404:
 *         description: Serie no encontrada
 */
router.put('/:id', seriesDocumentosController.actualizar);

/**
 * @swagger
 * /api/series-documentos/{id}:
 *   delete:
 *     summary: Eliminar una serie
 *     description: No se puede eliminar una serie predeterminada
 *     tags: [Series de Documentos]
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
 *         description: Serie eliminada
 *       400:
 *         description: No se puede eliminar una serie predeterminada
 *       404:
 *         description: Serie no encontrada
 */
router.delete('/:id', seriesDocumentosController.eliminar);

// ============================================
// ACCIONES ESPECIALES
// ============================================

/**
 * @swagger
 * /api/series-documentos/{id}/predeterminada:
 *   post:
 *     summary: Establecer serie como predeterminada
 *     description: Establece esta serie como la predeterminada para su tipo de documento
 *     tags: [Series de Documentos]
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
 *         description: Serie establecida como predeterminada
 *       404:
 *         description: Serie no encontrada
 */
router.post('/:id/predeterminada', seriesDocumentosController.establecerPredeterminada);

/**
 * @swagger
 * /api/series-documentos/{id}/duplicar:
 *   post:
 *     summary: Duplicar una serie
 *     description: Crea una copia de la serie con un nuevo código
 *     tags: [Series de Documentos]
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
 *         description: Serie duplicada correctamente
 *       404:
 *         description: Serie original no encontrada
 */
router.post('/:id/duplicar', seriesDocumentosController.duplicar);

export default router;
