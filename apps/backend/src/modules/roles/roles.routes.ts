import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import rolesController from './roles.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Obtener todos los roles de la empresa
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por roles activos/inactivos
 *       - in: query
 *         name: incluirSistema
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Incluir roles del sistema
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Buscar por nombre, código o descripción
 *     responses:
 *       200:
 *         description: Lista de roles
 */
router.get('/', rolesController.getRoles.bind(rolesController));

/**
 * @swagger
 * /api/roles/sistema:
 *   get:
 *     summary: Obtener plantillas de roles del sistema
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plantillas de roles predefinidos
 */
router.get('/sistema', rolesController.getRolesSistema.bind(rolesController));

/**
 * @swagger
 * /api/roles/recursos:
 *   get:
 *     summary: Obtener lista de recursos y permisos disponibles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     description: Devuelve la lista de recursos y acciones disponibles para configurar permisos
 *     responses:
 *       200:
 *         description: Lista de recursos y permisos especiales
 */
router.get('/recursos', rolesController.getRecursos.bind(rolesController));

/**
 * @swagger
 * /api/roles/inicializar:
 *   post:
 *     summary: Inicializar roles del sistema para la empresa
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     description: Crea los roles predefinidos del sistema. Solo admin/superadmin.
 *     responses:
 *       201:
 *         description: Roles inicializados
 *       403:
 *         description: Sin permisos
 */
router.post('/inicializar', rolesController.inicializarRoles.bind(rolesController));

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obtener un rol por ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Datos del rol
 *       404:
 *         description: Rol no encontrado
 */
router.get('/:id', rolesController.getRolById.bind(rolesController));

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crear un nuevo rol
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     description: Solo admin/superadmin pueden crear roles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *             properties:
 *               codigo:
 *                 type: string
 *                 pattern: '^[a-z0-9_-]+$'
 *                 example: vendedor_junior
 *               nombre:
 *                 type: string
 *                 example: Vendedor Junior
 *               descripcion:
 *                 type: string
 *               rolBase:
 *                 type: string
 *                 enum: [admin, gerente, vendedor, tecnico, almacenero, visualizador]
 *               permisos:
 *                 type: object
 *                 properties:
 *                   recursos:
 *                     type: object
 *                   especiales:
 *                     type: object
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *               orden:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Rol creado
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Sin permisos
 */
router.post('/', rolesController.createRol.bind(rolesController));

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Actualizar un rol
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     description: Solo admin/superadmin pueden actualizar roles. No se pueden modificar roles del sistema.
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
 *               permisos:
 *                 type: object
 *               color:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Rol no encontrado
 */
router.put('/:id', rolesController.updateRol.bind(rolesController));

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Eliminar un rol
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     description: Solo admin/superadmin. No se pueden eliminar roles del sistema.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rol eliminado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Rol no encontrado
 */
router.delete('/:id', rolesController.deleteRol.bind(rolesController));

/**
 * @swagger
 * /api/roles/{id}/duplicar:
 *   post:
 *     summary: Duplicar un rol existente
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     description: Crea una copia del rol con nuevo código y nombre
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del rol a duplicar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *             properties:
 *               codigo:
 *                 type: string
 *                 pattern: '^[a-z0-9_-]+$'
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rol duplicado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Rol original no encontrado
 */
router.post('/:id/duplicar', rolesController.duplicarRol.bind(rolesController));

export default router;
