import { Router } from 'express';
import { proveedoresController } from './proveedores.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware, requireBusinessDatabase } from '@/middleware/tenant.middleware';
import { uploadSingle } from '@/middleware/upload.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Proveedores
 *   description: Gestión de proveedores del ERP
 */

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireBusinessDatabase);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @swagger
 * /proveedores:
 *   post:
 *     summary: Crear un nuevo proveedor
 *     tags: [Proveedores]
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
 *               - nif
 *             properties:
 *               codigo:
 *                 type: string
 *                 description: Código del proveedor (se genera automáticamente si no se proporciona)
 *               nombre:
 *                 type: string
 *                 description: Nombre completo o razón social
 *               nombreComercial:
 *                 type: string
 *                 description: Nombre comercial
 *               nif:
 *                 type: string
 *                 description: NIF/CIF del proveedor
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Proveedor creado exitosamente
 *       400:
 *         description: Datos inválidos o NIF duplicado
 *       401:
 *         description: No autorizado
 */
router.post('/', proveedoresController.create.bind(proveedoresController));

/**
 * @swagger
 * /proveedores:
 *   get:
 *     summary: Obtener todos los proveedores con paginación y filtros
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 25
 *         description: Registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, código, NIF o email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: nombre
 *         description: Campo para ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Orden ascendente o descendente
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: tipoProveedor
 *         schema:
 *           type: string
 *           enum: [empresa, autonomo, particular]
 *         description: Filtrar por tipo de proveedor
 *     responses:
 *       200:
 *         description: Lista de proveedores
 */
router.get('/', proveedoresController.findAll.bind(proveedoresController));

/**
 * @swagger
 * /proveedores/sugerir-codigo:
 *   get:
 *     summary: Sugerir el siguiente código disponible
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefijo
 *         schema:
 *           type: string
 *         description: Prefijo del código (ej. PROV-, P-). Si no se proporciona, detecta el patrón más común
 *     responses:
 *       200:
 *         description: Código sugerido generado exitosamente
 */
router.get('/sugerir-codigo', proveedoresController.sugerirSiguienteCodigo.bind(proveedoresController));

/**
 * @swagger
 * /proveedores/codigos:
 *   get:
 *     summary: Buscar códigos existentes por prefijo (para auto-sugerencia)
 *     tags: [Proveedores]
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
 */
router.get('/codigos', proveedoresController.searchCodigos.bind(proveedoresController));

/**
 * @swagger
 * /proveedores/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de proveedores
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de proveedores
 */
router.get('/estadisticas', proveedoresController.getEstadisticas.bind(proveedoresController));

/**
 * @swagger
 * /proveedores/selector:
 *   get:
 *     summary: Buscar proveedores para selector (autocompletado)
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Máximo de resultados
 *     responses:
 *       200:
 *         description: Lista de proveedores para selector
 */
router.get('/selector', proveedoresController.buscarParaSelector.bind(proveedoresController));

/**
 * @swagger
 * /proveedores/codigo/{codigo}:
 *   get:
 *     summary: Obtener proveedor por código
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código del proveedor
 *     responses:
 *       200:
 *         description: Proveedor encontrado
 *       404:
 *         description: Proveedor no encontrado
 */
router.get('/codigo/:codigo', proveedoresController.findByCodigo.bind(proveedoresController));

/**
 * @swagger
 * /proveedores/{id}:
 *   get:
 *     summary: Obtener proveedor por ID
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proveedor
 *     responses:
 *       200:
 *         description: Proveedor encontrado
 *       404:
 *         description: Proveedor no encontrado
 */
router.get('/:id', proveedoresController.findById.bind(proveedoresController));

/**
 * @swagger
 * /proveedores/{id}:
 *   put:
 *     summary: Actualizar un proveedor
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proveedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Proveedor actualizado exitosamente
 *       404:
 *         description: Proveedor no encontrado
 */
router.put('/:id', proveedoresController.update.bind(proveedoresController));

/**
 * @swagger
 * /proveedores/{id}:
 *   delete:
 *     summary: Eliminar un proveedor
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proveedor
 *     responses:
 *       200:
 *         description: Proveedor eliminado exitosamente
 *       404:
 *         description: Proveedor no encontrado
 */
router.delete('/:id', proveedoresController.delete.bind(proveedoresController));

// ============================================
// RUTAS DE ACCIONES MASIVAS
// ============================================

/**
 * @swagger
 * /proveedores/bulk/delete:
 *   post:
 *     summary: Eliminar múltiples proveedores
 *     tags: [Proveedores]
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
 *         description: Proveedores eliminados exitosamente
 */
router.post('/bulk/delete', proveedoresController.deleteMany.bind(proveedoresController));

/**
 * @swagger
 * /proveedores/bulk/estado:
 *   post:
 *     summary: Activar o desactivar múltiples proveedores
 *     tags: [Proveedores]
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
 *               - activo
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado de proveedores actualizado exitosamente
 */
router.post('/bulk/estado', proveedoresController.setEstadoMultiples.bind(proveedoresController));

/**
 * @swagger
 * /proveedores/{id}/toggle-estado:
 *   patch:
 *     summary: Alternar estado activo/inactivo de un proveedor
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proveedor
 *     responses:
 *       200:
 *         description: Estado del proveedor actualizado exitosamente
 *       404:
 *         description: Proveedor no encontrado
 */
router.patch('/:id/toggle-estado', proveedoresController.toggleEstado.bind(proveedoresController));

// ============================================
// RUTAS DE ARCHIVOS
// ============================================

// Subir archivo a proveedor
router.post(
  '/:id/archivos',
  uploadSingle,
  proveedoresController.subirArchivo.bind(proveedoresController)
);

// Eliminar archivo de proveedor
router.delete(
  '/:id/archivos',
  proveedoresController.eliminarArchivo.bind(proveedoresController)
);

export default router;
