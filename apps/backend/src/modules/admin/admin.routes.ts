import { Router } from 'express';
import AdminController from './admin.controller';
import { authMiddleware, requireRole } from '@/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Panel de administración para super admins
 */

// Todas las rutas requieren autenticación y rol de super admin
router.use(authMiddleware);
router.use(requireRole('superadmin'));

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Obtener estadísticas generales del sistema
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       403:
 *         description: No tiene permisos de super admin
 */
router.get('/stats', AdminController.getSystemStats.bind(AdminController));

/**
 * @swagger
 * /api/admin/empresas:
 *   get:
 *     summary: Obtener todas las empresas con paginación
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Empresas por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, email o NIF
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activa, suspendida, cancelada]
 *       - in: query
 *         name: tipoNegocio
 *         schema:
 *           type: string
 *           enum: [retail, restauracion, taller, informatica, servicios, otro]
 *     responses:
 *       200:
 *         description: Empresas obtenidas exitosamente
 */
router.get('/empresas', AdminController.getAllEmpresas.bind(AdminController));

/**
 * @swagger
 * /api/admin/empresas/{id}:
 *   get:
 *     summary: Obtener detalles de una empresa
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la empresa
 *     responses:
 *       200:
 *         description: Empresa obtenida exitosamente
 *       404:
 *         description: Empresa no encontrada
 */
router.get('/empresas/:id', AdminController.getEmpresaById.bind(AdminController));

/**
 * @swagger
 * /api/admin/empresas/{id}:
 *   put:
 *     summary: Actualizar datos de una empresa
 *     tags: [Admin]
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
 *               email:
 *                 type: string
 *               telefono:
 *                 type: string
 *               estado:
 *                 type: string
 *                 enum: [activa, suspendida, cancelada]
 *     responses:
 *       200:
 *         description: Empresa actualizada
 */
router.put('/empresas/:id', AdminController.updateEmpresa.bind(AdminController));

/**
 * @swagger
 * /api/admin/empresas/{id}/estado:
 *   put:
 *     summary: Cambiar estado de una empresa
 *     tags: [Admin]
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
 *                 enum: [activa, suspendida, cancelada]
 *               razon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put('/empresas/:id/estado', AdminController.updateEmpresaEstado.bind(AdminController));

/**
 * @swagger
 * /api/admin/empresas/{id}:
 *   delete:
 *     summary: Eliminar una empresa completamente
 *     tags: [Admin]
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
 *         description: Empresa eliminada
 *       404:
 *         description: Empresa no encontrada
 */
router.delete('/empresas/:id', AdminController.deleteEmpresa.bind(AdminController));

export default router;