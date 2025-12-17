import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import usuariosController from './usuarios.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios de la empresa
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por usuarios activos/inactivos
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [admin, gerente, vendedor, tecnico, almacenero, visualizador]
 *         description: Filtrar por rol
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Buscar por nombre, apellidos o email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página actual
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: Sin permisos
 */
router.get('/', usuariosController.getUsuarios.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de usuarios
 */
router.get('/estadisticas', usuariosController.getEstadisticas.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/roles-disponibles:
 *   get:
 *     summary: Obtener roles que puede asignar el usuario actual
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     description: Devuelve los roles disponibles según la jerarquía del usuario
 *     responses:
 *       200:
 *         description: Lista de roles disponibles
 */
router.get('/roles-disponibles', usuariosController.getRolesDisponibles.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', usuariosController.getUsuarioById.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     description: Solo admin/superadmin pueden crear usuarios. No se puede crear superadmin.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nombre
 *               - apellidos
 *               - rol
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               nombre:
 *                 type: string
 *               apellidos:
 *                 type: string
 *               telefono:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [admin, gerente, vendedor, tecnico, almacenero, visualizador]
 *               rolId:
 *                 type: string
 *                 description: ID de rol personalizado (opcional)
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Usuario creado
 *       400:
 *         description: Datos inválidos o email duplicado
 *       403:
 *         description: Sin permisos
 */
router.post('/', usuariosController.createUsuario.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     description: Solo admin/superadmin. No puede desactivarse a sí mismo.
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
 *               apellidos:
 *                 type: string
 *               telefono:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [admin, gerente, vendedor, tecnico, almacenero, visualizador]
 *               rolId:
 *                 type: string
 *               activo:
 *                 type: boolean
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id', usuariosController.updateUsuario.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}/password:
 *   put:
 *     summary: Cambiar contraseña de un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     description: Solo admin/superadmin pueden cambiar contraseñas de otros usuarios
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
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id/password', usuariosController.changePassword.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}/reactivar:
 *   post:
 *     summary: Reactivar un usuario desactivado
 *     tags: [Usuarios]
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
 *         description: Usuario reactivado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/:id/reactivar', usuariosController.reactivarUsuario.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Desactivar un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     description: Desactiva el usuario (no lo elimina). No puede eliminarse a sí mismo.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario desactivado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:id', usuariosController.deleteUsuario.bind(usuariosController));

/**
 * @swagger
 * /api/usuarios/{id}/permanente:
 *   delete:
 *     summary: Eliminar usuario permanentemente
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     description: Solo superadmin puede eliminar usuarios permanentemente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado permanentemente
 *       403:
 *         description: Solo superadmin
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:id/permanente', usuariosController.deleteUsuarioPermanente.bind(usuariosController));

export default router;
