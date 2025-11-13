import { Router } from 'express';
import ExportController from './export.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Exportación
 *   description: Exportación de datos en múltiples formatos
 */

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /api/export/excel:
 *   post:
 *     summary: Exportar datos a Excel con formato profesional
 *     tags: [Exportación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - columns
 *               - data
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Nombre del archivo (sin extensión)
 *                 example: clientes
 *               sheetName:
 *                 type: string
 *                 description: Nombre de la hoja
 *                 example: Datos
 *               title:
 *                 type: string
 *                 description: Título del documento
 *                 example: Listado de Clientes
 *               subtitle:
 *                 type: string
 *                 description: Subtítulo del documento
 *                 example: Exportado el 10/11/2025
 *               columns:
 *                 type: array
 *                 description: Definición de columnas
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: nombre
 *                     label:
 *                       type: string
 *                       example: Nombre
 *                     width:
 *                       type: number
 *                       example: 20
 *               data:
 *                 type: array
 *                 description: Array de objetos con los datos
 *                 items:
 *                   type: object
 *               stats:
 *                 type: array
 *                 description: Estadísticas a incluir en el encabezado
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                       example: Total
 *                     value:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *                       example: 150
 *               includeStats:
 *                 type: boolean
 *                 description: Si se deben incluir las estadísticas
 *                 default: true
 *     responses:
 *       200:
 *         description: Archivo Excel generado
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/excel', ExportController.exportExcel.bind(ExportController));

/**
 * @swagger
 * /api/export/pdf:
 *   post:
 *     summary: Exportar datos a PDF
 *     tags: [Exportación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - columns
 *               - data
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Nombre del archivo (sin extensión)
 *                 example: clientes
 *               title:
 *                 type: string
 *                 description: Título del documento
 *                 example: Listado de Clientes
 *               subtitle:
 *                 type: string
 *                 description: Subtítulo del documento
 *                 example: Exportado el 10/11/2025
 *               columns:
 *                 type: array
 *                 description: Definición de columnas
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: nombre
 *                     label:
 *                       type: string
 *                       example: Nombre
 *               data:
 *                 type: array
 *                 description: Array de objetos con los datos
 *                 items:
 *                   type: object
 *               stats:
 *                 type: array
 *                 description: Estadísticas a incluir
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     value:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *               includeStats:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Archivo PDF generado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/pdf', ExportController.exportPDF.bind(ExportController));

/**
 * @swagger
 * /api/export/csv:
 *   post:
 *     summary: Exportar datos a CSV
 *     tags: [Exportación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - columns
 *               - data
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Nombre del archivo (sin extensión)
 *                 example: clientes
 *               columns:
 *                 type: array
 *                 description: Definición de columnas
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: nombre
 *                     label:
 *                       type: string
 *                       example: Nombre
 *               data:
 *                 type: array
 *                 description: Array de objetos con los datos
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Archivo CSV generado
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/csv', ExportController.exportCSV.bind(ExportController));

export default router;