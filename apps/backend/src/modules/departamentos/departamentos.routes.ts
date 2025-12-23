import { Router } from 'express';
import { departamentosController } from './departamentos.controller';
import { authMiddleware, requireModuleAccess } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Verificar acceso al módulo de RRHH
router.use(requireModuleAccess('accesoRRHH'));

/**
 * @swagger
 * tags:
 *   name: Departamentos
 *   description: Gestión de departamentos de la empresa
 */

// ============================================
// RUTAS ESPECIALES (antes de :id)
// ============================================

/**
 * @swagger
 * /api/departamentos/activos:
 *   get:
 *     summary: Obtener departamentos activos (para selects)
 *     tags: [Departamentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de departamentos activos
 */
router.get('/activos', departamentosController.obtenerActivos);

/**
 * @swagger
 * /api/departamentos/sugerir-codigo:
 *   get:
 *     summary: Obtener sugerencia de siguiente código
 *     tags: [Departamentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Código sugerido
 */
router.get('/sugerir-codigo', departamentosController.sugerirCodigo);

/**
 * @swagger
 * /api/departamentos/codigos:
 *   get:
 *     summary: Buscar códigos existentes por prefijo
 *     tags: [Departamentos]
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
 *         description: Lista de códigos
 */
router.get('/codigos', departamentosController.searchCodigos);

// ============================================
// RUTAS CRUD
// ============================================

/**
 * @swagger
 * /api/departamentos:
 *   get:
 *     summary: Obtener lista de departamentos con filtros
 *     tags: [Departamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por código o nombre
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de departamentos
 */
router.get('/', departamentosController.buscar);

/**
 * @swagger
 * /api/departamentos:
 *   post:
 *     summary: Crear un nuevo departamento
 *     tags: [Departamentos]
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
 *             properties:
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               responsableId:
 *                 type: string
 *               color:
 *                 type: string
 *               orden:
 *                 type: number
 *     responses:
 *       201:
 *         description: Departamento creado correctamente
 */
router.post('/', departamentosController.crear);

/**
 * @swagger
 * /api/departamentos/{id}:
 *   get:
 *     summary: Obtener un departamento por ID
 *     tags: [Departamentos]
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
 *         description: Departamento encontrado
 *       404:
 *         description: Departamento no encontrado
 */
router.get('/:id', departamentosController.obtenerPorId);

/**
 * @swagger
 * /api/departamentos/{id}:
 *   put:
 *     summary: Actualizar un departamento
 *     tags: [Departamentos]
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
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               responsableId:
 *                 type: string
 *               color:
 *                 type: string
 *               orden:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Departamento actualizado correctamente
 */
router.put('/:id', departamentosController.actualizar);

/**
 * @swagger
 * /api/departamentos/{id}:
 *   delete:
 *     summary: Eliminar un departamento (soft delete)
 *     tags: [Departamentos]
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
 *         description: Departamento eliminado correctamente
 */
router.delete('/:id', departamentosController.eliminar);

export default router;
