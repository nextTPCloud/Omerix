import { Router } from 'express';
import { facturaEController } from './facturae.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: FacturaE
 *   description: Generación de facturas electrónicas (FacturaE) e integración con FACE
 */

// Aplicar middleware de autenticación y empresa a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// GENERACIÓN DE FACTURAE
// ============================================

/**
 * @swagger
 * /facturae/{facturaId}/generar:
 *   post:
 *     summary: Genera un documento FacturaE a partir de una factura
 *     tags: [FacturaE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facturaId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firmar:
 *                 type: boolean
 *                 description: Si firmar automáticamente el documento
 *               certificadoId:
 *                 type: string
 *                 description: ID del certificado para firmar
 *     responses:
 *       200:
 *         description: FacturaE generada exitosamente
 */
router.post('/:facturaId/generar', (req, res, next) => facturaEController.generarFacturaE(req, res, next));

/**
 * @swagger
 * /facturae/{facturaId}/descargar:
 *   get:
 *     summary: Descarga el XML de FacturaE
 *     tags: [FacturaE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facturaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo XML de FacturaE
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 */
router.get('/:facturaId/descargar', (req, res, next) => facturaEController.descargarFacturaE(req, res, next));

/**
 * @swagger
 * /facturae/lote:
 *   post:
 *     summary: Genera un lote de facturas FacturaE
 *     tags: [FacturaE]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facturaIds
 *             properties:
 *               facturaIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Lote de FacturaE generado exitosamente
 */
router.post('/lote', (req, res, next) => facturaEController.generarLote(req, res, next));

/**
 * @swagger
 * /facturae/validar:
 *   post:
 *     summary: Valida un documento FacturaE
 *     tags: [FacturaE]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - xml
 *             properties:
 *               xml:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado de la validación
 */
router.post('/validar', (req, res, next) => facturaEController.validarFacturaE(req, res, next));

// ============================================
// FIRMA ELECTRÓNICA
// ============================================

/**
 * @swagger
 * /facturae/{facturaId}/firmar:
 *   post:
 *     summary: Firma un documento FacturaE con XAdES-EPES
 *     tags: [FacturaE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facturaId
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
 *               - certificadoId
 *             properties:
 *               certificadoId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Documento firmado exitosamente
 */
router.post('/:facturaId/firmar', (req, res, next) => facturaEController.firmarFacturaE(req, res, next));

/**
 * @swagger
 * /facturae/certificados:
 *   get:
 *     summary: Obtiene certificados disponibles para firmar
 *     tags: [FacturaE]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de certificados disponibles
 */
router.get('/certificados', (req, res, next) => facturaEController.getCertificadosDisponibles(req, res, next));

// ============================================
// INTEGRACIÓN CON FACE
// ============================================

/**
 * @swagger
 * /facturae/{facturaId}/face/verificar:
 *   get:
 *     summary: Verifica los requisitos para enviar a FACE
 *     tags: [FacturaE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facturaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado de la verificación
 */
router.get('/:facturaId/face/verificar', (req, res, next) => facturaEController.verificarRequisitos(req, res, next));

/**
 * @swagger
 * /facturae/{facturaId}/face/enviar:
 *   post:
 *     summary: Envía una factura a FACE
 *     tags: [FacturaE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facturaId
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
 *               - certificadoId
 *             properties:
 *               certificadoId:
 *                 type: string
 *               entorno:
 *                 type: string
 *                 enum: [produccion, pruebas]
 *                 default: pruebas
 *     responses:
 *       200:
 *         description: Factura enviada exitosamente
 */
router.post('/:facturaId/face/enviar', (req, res, next) => facturaEController.enviarAFACE(req, res, next));

/**
 * @swagger
 * /facturae/{facturaId}/face/estado:
 *   get:
 *     summary: Consulta el estado de una factura en FACE
 *     tags: [FacturaE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facturaId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: certificadoId
 *         schema:
 *           type: string
 *       - in: query
 *         name: entorno
 *         schema:
 *           type: string
 *           enum: [produccion, pruebas]
 *     responses:
 *       200:
 *         description: Estado de la factura en FACE
 */
router.get('/:facturaId/face/estado', (req, res, next) => facturaEController.consultarEstadoFACE(req, res, next));

/**
 * @swagger
 * /facturae/{facturaId}/face/anular:
 *   post:
 *     summary: Anula una factura en FACE
 *     tags: [FacturaE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facturaId
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
 *               - certificadoId
 *             properties:
 *               motivo:
 *                 type: string
 *               certificadoId:
 *                 type: string
 *               entorno:
 *                 type: string
 *                 enum: [produccion, pruebas]
 *                 default: pruebas
 *     responses:
 *       200:
 *         description: Solicitud de anulación registrada
 */
router.post('/:facturaId/face/anular', (req, res, next) => facturaEController.anularEnFACE(req, res, next));

/**
 * @swagger
 * /facturae/{facturaId}/face/historial:
 *   get:
 *     summary: Obtiene el historial de estados FACE de una factura
 *     tags: [FacturaE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facturaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historial de estados
 */
router.get('/:facturaId/face/historial', (req, res, next) => facturaEController.getHistorialFACE(req, res, next));

export default router;
