import { Router } from 'express';
import { conciliacionController } from './conciliacion.controller';
import { authMiddleware, requireModuleAccess } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// Verificar acceso al módulo de tesorería
router.use(requireModuleAccess('accesoTesoreria'));

/**
 * @swagger
 * tags:
 *   name: Conciliacion
 *   description: Conciliación bancaria - Importación y matching de extractos
 */

// ============================================
// RUTAS DE IMPORTACIÓN
// ============================================

/**
 * @swagger
 * /conciliacion/importar:
 *   post:
 *     summary: Importar extracto bancario
 *     tags: [Conciliacion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cuentaBancariaId
 *               - nombreArchivo
 *               - contenido
 *             properties:
 *               cuentaBancariaId:
 *                 type: string
 *               nombreArchivo:
 *                 type: string
 *               contenido:
 *                 type: string
 *                 description: Contenido del archivo en base64 o texto plano
 *               configCSV:
 *                 type: object
 *                 description: Configuración para parsear CSV
 *                 properties:
 *                   separador:
 *                     type: string
 *                   formatoFecha:
 *                     type: string
 *                   columnaFecha:
 *                     type: number
 *                   columnaConcepto:
 *                     type: number
 *                   columnaImporte:
 *                     type: number
 *                   columnaSaldo:
 *                     type: number
 *                   tieneEncabezado:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Extracto importado exitosamente
 */
router.post('/importar', (req, res, next) => conciliacionController.importar(req, res, next));

/**
 * @swagger
 * /conciliacion/importaciones:
 *   get:
 *     summary: Listar importaciones de extractos
 *     tags: [Conciliacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cuentaBancariaId
 *         schema:
 *           type: string
 *         description: Filtrar por cuenta bancaria
 *     responses:
 *       200:
 *         description: Lista de importaciones
 */
router.get('/importaciones', (req, res, next) => conciliacionController.listarImportaciones(req, res, next));

/**
 * @swagger
 * /conciliacion/importaciones/{id}:
 *   get:
 *     summary: Obtener una importación por ID
 *     tags: [Conciliacion]
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
 *         description: Datos de la importación
 */
router.get('/importaciones/:id', (req, res, next) => conciliacionController.obtenerImportacion(req, res, next));

/**
 * @swagger
 * /conciliacion/importaciones/{id}/movimientos:
 *   get:
 *     summary: Listar movimientos de extracto de una importación
 *     tags: [Conciliacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, sugerido, conciliado, descartado]
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de movimientos del extracto
 */
router.get('/importaciones/:id/movimientos', (req, res, next) => conciliacionController.listarMovimientosExtracto(req, res, next));

/**
 * @swagger
 * /conciliacion/importaciones/{id}/matching:
 *   post:
 *     summary: Ejecutar matching automático para una importación
 *     tags: [Conciliacion]
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
 *         description: Resultados del matching
 */
router.post('/importaciones/:id/matching', (req, res, next) => conciliacionController.ejecutarMatching(req, res, next));

/**
 * @swagger
 * /conciliacion/importaciones/{id}/finalizar:
 *   post:
 *     summary: Finalizar importación
 *     tags: [Conciliacion]
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
 *         description: Importación finalizada
 */
router.post('/importaciones/:id/finalizar', (req, res, next) => conciliacionController.finalizarImportacion(req, res, next));

// ============================================
// RUTAS DE MOVIMIENTOS DE EXTRACTO
// ============================================

/**
 * @swagger
 * /conciliacion/movimientos/{id}/aprobar:
 *   post:
 *     summary: Aprobar match sugerido
 *     tags: [Conciliacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del movimiento del extracto
 *     responses:
 *       200:
 *         description: Match aprobado
 */
router.post('/movimientos/:id/aprobar', (req, res, next) => conciliacionController.aprobarMatch(req, res, next));

/**
 * @swagger
 * /conciliacion/movimientos/{id}/rechazar:
 *   post:
 *     summary: Rechazar match sugerido
 *     tags: [Conciliacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del movimiento del extracto
 *     responses:
 *       200:
 *         description: Match rechazado
 */
router.post('/movimientos/:id/rechazar', (req, res, next) => conciliacionController.rechazarMatch(req, res, next));

/**
 * @swagger
 * /conciliacion/movimientos/{id}/conciliar:
 *   post:
 *     summary: Conciliar manualmente un movimiento
 *     tags: [Conciliacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del movimiento del extracto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movimientoBancarioId
 *             properties:
 *               movimientoBancarioId:
 *                 type: string
 *                 description: ID del movimiento bancario a vincular
 *     responses:
 *       200:
 *         description: Conciliación realizada
 */
router.post('/movimientos/:id/conciliar', (req, res, next) => conciliacionController.conciliarManual(req, res, next));

/**
 * @swagger
 * /conciliacion/movimientos/{id}/descartar:
 *   post:
 *     summary: Descartar movimiento del extracto
 *     tags: [Conciliacion]
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
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movimiento descartado
 */
router.post('/movimientos/:id/descartar', (req, res, next) => conciliacionController.descartarMovimiento(req, res, next));

// ============================================
// RUTAS DE BÚSQUEDA
// ============================================

/**
 * @swagger
 * /conciliacion/buscar-movimientos:
 *   get:
 *     summary: Buscar movimientos bancarios para conciliación manual
 *     tags: [Conciliacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cuentaBancariaId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cargo, abono]
 *       - in: query
 *         name: importe
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: margenDias
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Movimientos bancarios encontrados
 */
router.get('/buscar-movimientos', (req, res, next) => conciliacionController.buscarMovimientos(req, res, next));

export default router;
