import { Router } from 'express';
import ConfiguracionUsuarioController from './configuracion-usuario.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Configuraciones
 *   description: Gestión de configuraciones de usuario por módulo
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ColumnaConfig:
 *       type: object
 *       required:
 *         - key
 *         - visible
 *         - orden
 *       properties:
 *         key:
 *           type: string
 *           description: Identificador de la columna
 *           example: "nombre"
 *         visible:
 *           type: boolean
 *           description: Si la columna está visible
 *           example: true
 *         orden:
 *           type: number
 *           description: Orden de la columna
 *           example: 0
 *         ancho:
 *           type: number
 *           description: Ancho de la columna en píxeles (opcional)
 *           example: 200
 *
 *     SortConfig:
 *       type: object
 *       required:
 *         - key
 *         - direction
 *       properties:
 *         key:
 *           type: string
 *           description: Campo por el que ordenar
 *           example: "createdAt"
 *         direction:
 *           type: string
 *           enum: [asc, desc]
 *           description: Dirección del ordenamiento
 *           example: "desc"
 *
 *     ModuleConfig:
 *       type: object
 *       properties:
 *         columnas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ColumnaConfig'
 *         sortConfig:
 *           $ref: '#/components/schemas/SortConfig'
 *         columnFilters:
 *           type: object
 *           description: Filtros por columna
 *           example: { "activo": true, "tipoCliente": "empresa" }
 *         paginacion:
 *           type: object
 *           properties:
 *             limit:
 *               type: number
 *               enum: [10, 25, 50, 100]
 *               example: 25
 *         filtrosAdicionales:
 *           type: object
 *           description: Filtros adicionales específicos del módulo
 *           example: {}
 *
 *     ConfiguracionUsuario:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID de la configuración
 *         usuarioId:
 *           type: string
 *           description: ID del usuario
 *         empresaId:
 *           type: string
 *           description: ID de la empresa
 *         configuraciones:
 *           type: object
 *           description: Configuraciones por módulo
 *           properties:
 *             clientes:
 *               $ref: '#/components/schemas/ModuleConfig'
 *             productos:
 *               $ref: '#/components/schemas/ModuleConfig'
 *             facturas:
 *               $ref: '#/components/schemas/ModuleConfig'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/configuraciones:
 *   get:
 *     summary: Obtener toda la configuración del usuario
 *     tags: [Configuraciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ConfiguracionUsuario'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/', authMiddleware, ConfiguracionUsuarioController.getAll);

/**
 * @swagger
 * /api/configuraciones/modulo:
 *   get:
 *     summary: Obtener configuración de un módulo específico
 *     tags: [Configuraciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: modulo
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del módulo (clientes, productos, facturas, etc.)
 *         example: "clientes"
 *     responses:
 *       200:
 *         description: Configuración del módulo obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ModuleConfig'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/modulo', authMiddleware, ConfiguracionUsuarioController.getModuleConfig);

/**
 * @swagger
 * /api/configuraciones/modulo:
 *   put:
 *     summary: Actualizar configuración completa de un módulo
 *     tags: [Configuraciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modulo
 *               - configuracion
 *             properties:
 *               modulo:
 *                 type: string
 *                 description: Nombre del módulo
 *                 example: "clientes"
 *               configuracion:
 *                 $ref: '#/components/schemas/ModuleConfig'
 *     responses:
 *       200:
 *         description: Configuración actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/modulo', authMiddleware, ConfiguracionUsuarioController.updateModuleConfig);

/**
 * @swagger
 * /api/configuraciones/modulo:
 *   delete:
 *     summary: Restablecer configuración de un módulo (eliminarla)
 *     tags: [Configuraciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modulo
 *             properties:
 *               modulo:
 *                 type: string
 *                 description: Nombre del módulo
 *                 example: "clientes"
 *     responses:
 *       200:
 *         description: Configuración restablecida correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete('/modulo', authMiddleware, ConfiguracionUsuarioController.resetModuleConfig);

/**
 * @swagger
 * /api/configuraciones/columnas:
 *   put:
 *     summary: Actualizar solo las columnas de un módulo
 *     tags: [Configuraciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modulo
 *               - columnas
 *             properties:
 *               modulo:
 *                 type: string
 *                 example: "clientes"
 *               columnas:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ColumnaConfig'
 *     responses:
 *       200:
 *         description: Columnas actualizadas correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/columnas', authMiddleware, ConfiguracionUsuarioController.updateColumnas);

/**
 * @swagger
 * /api/configuraciones/sort:
 *   put:
 *     summary: Actualizar solo el ordenamiento de un módulo
 *     tags: [Configuraciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modulo
 *               - sortConfig
 *             properties:
 *               modulo:
 *                 type: string
 *                 example: "clientes"
 *               sortConfig:
 *                 $ref: '#/components/schemas/SortConfig'
 *     responses:
 *       200:
 *         description: Ordenamiento actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/sort', authMiddleware, ConfiguracionUsuarioController.updateSortConfig);

/**
 * @swagger
 * /api/configuraciones/filters:
 *   put:
 *     summary: Actualizar solo los filtros de columna de un módulo
 *     tags: [Configuraciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modulo
 *               - columnFilters
 *             properties:
 *               modulo:
 *                 type: string
 *                 example: "clientes"
 *               columnFilters:
 *                 type: object
 *                 description: Filtros por columna
 *                 example: { "activo": true, "tipoCliente": "empresa" }
 *     responses:
 *       200:
 *         description: Filtros actualizados correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/filters', authMiddleware, ConfiguracionUsuarioController.updateColumnFilters);

/**
 * @swagger
 * /api/configuraciones/pagination:
 *   put:
 *     summary: Actualizar solo el límite de paginación de un módulo
 *     tags: [Configuraciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modulo
 *               - limit
 *             properties:
 *               modulo:
 *                 type: string
 *                 example: "clientes"
 *               limit:
 *                 type: number
 *                 enum: [10, 25, 50, 100]
 *                 example: 50
 *     responses:
 *       200:
 *         description: Límite de paginación actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/pagination', authMiddleware, ConfiguracionUsuarioController.updatePaginationLimit);

export default router;