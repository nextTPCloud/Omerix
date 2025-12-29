import { Router, Request, Response, NextFunction } from 'express';
import { FichajesController } from './fichajes.controller';
import { authMiddleware, requireModuleAccess } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Todas las rutas requieren autenticacion
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * Middleware que permite acceso si:
 * - El usuario es superadmin (rol global), O
 * - El usuario tiene rol admin en la empresa, O
 * - El usuario tiene permiso accesoRRHH, O
 * - El usuario tiene personalId (es empleado fichando)
 */
const requireFichajeAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado',
    });
  }

  // Superadmin siempre tiene acceso (verificar rol global, no rol de empresa)
  if (user.esSuperadmin || user.rolGlobal === 'superadmin') {
    return next();
  }

  // Admin de empresa tiene acceso completo a fichajes
  if (user.rol === 'admin') {
    return next();
  }

  // Si tiene permiso accesoRRHH, tiene acceso completo
  if (user.permisos?.especiales?.accesoRRHH === true) {
    return next();
  }

  // Si tiene personalId, puede acceder a sus propios fichajes
  if (user.personalId) {
    return next();
  }

  // Si no cumple ninguna condición, denegar acceso
  return res.status(403).json({
    success: false,
    message: 'No tienes acceso al módulo de fichajes. Necesitas ser empleado o tener permiso de RRHH.',
  });
};

// Aplicar middleware de acceso a fichajes
router.use(requireFichajeAccess);

/**
 * @swagger
 * /api/fichajes:
 *   get:
 *     summary: Obtener lista de fichajes
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: personalId
 *         schema:
 *           type: string
 *       - in: query
 *         name: departamentoId
 *         schema:
 *           type: string
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [abierto, cerrado, pendiente, aprobado, rechazado]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de fichajes
 */
router.get('/', FichajesController.getAll);

/**
 * @swagger
 * /api/fichajes/fichar:
 *   post:
 *     summary: Fichar rapido (entrada o salida automatica)
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personalId:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [normal, teletrabajo, viaje, formacion]
 *               ubicacion:
 *                 type: object
 *                 properties:
 *                   latitud:
 *                     type: number
 *                   longitud:
 *                     type: number
 *     responses:
 *       200:
 *         description: Fichaje registrado
 */
router.post('/fichar', FichajesController.ficharRapido);

/**
 * @swagger
 * /api/fichajes/entrada:
 *   post:
 *     summary: Registrar entrada
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personalId
 *             properties:
 *               personalId:
 *                 type: string
 *               tipo:
 *                 type: string
 *               ubicacion:
 *                 type: object
 *     responses:
 *       201:
 *         description: Entrada registrada
 */
router.post('/entrada', FichajesController.registrarEntrada);

/**
 * @swagger
 * /api/fichajes/estado/{personalId}:
 *   get:
 *     summary: Obtener estado actual de fichaje del empleado
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado actual
 */
router.get('/estado/:personalId', FichajesController.getEstadoActual);

/**
 * @swagger
 * /api/fichajes/estado:
 *   get:
 *     summary: Obtener estado actual de fichaje del usuario actual
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado actual
 */
router.get('/estado', FichajesController.getEstadoActual);

/**
 * @swagger
 * /api/fichajes/resumen/{personalId}:
 *   get:
 *     summary: Obtener resumen mensual del empleado
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resumen mensual
 */
router.get('/resumen/:personalId', FichajesController.getResumenEmpleado);

/**
 * @swagger
 * /api/fichajes/resumen:
 *   get:
 *     summary: Obtener resumen mensual del usuario actual
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen mensual
 */
router.get('/resumen', FichajesController.getResumenEmpleado);

/**
 * @swagger
 * /api/fichajes/{id}:
 *   get:
 *     summary: Obtener fichaje por ID
 *     tags: [Fichajes]
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
 *         description: Fichaje encontrado
 */
router.get('/:id', FichajesController.getById);

/**
 * @swagger
 * /api/fichajes/{id}/salida:
 *   post:
 *     summary: Registrar salida
 *     tags: [Fichajes]
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
 *         description: Salida registrada
 */
router.post('/:id/salida', FichajesController.registrarSalida);

/**
 * @swagger
 * /api/fichajes/{id}/pausa:
 *   post:
 *     summary: Registrar pausa (inicio o fin)
 *     tags: [Fichajes]
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
 *               - tipo
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [inicio, fin]
 *     responses:
 *       200:
 *         description: Pausa registrada
 */
router.post('/:id/pausa', FichajesController.registrarPausa);

/**
 * @swagger
 * /api/fichajes/{id}/aprobar:
 *   put:
 *     summary: Aprobar fichaje
 *     tags: [Fichajes]
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
 *         description: Fichaje aprobado
 */
router.put('/:id/aprobar', requireModuleAccess('accesoRRHH'), FichajesController.aprobar);

/**
 * @swagger
 * /api/fichajes/{id}/rechazar:
 *   put:
 *     summary: Rechazar fichaje
 *     tags: [Fichajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fichaje rechazado
 */
router.put('/:id/rechazar', requireModuleAccess('accesoRRHH'), FichajesController.rechazar);

/**
 * @swagger
 * /api/fichajes/{id}:
 *   put:
 *     summary: Actualizar fichaje
 *     tags: [Fichajes]
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
 *         description: Fichaje actualizado
 */
router.put('/:id', requireModuleAccess('accesoRRHH'), FichajesController.update);

/**
 * @swagger
 * /api/fichajes/{id}:
 *   delete:
 *     summary: Eliminar fichaje
 *     tags: [Fichajes]
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
 *         description: Fichaje eliminado
 */
router.delete('/:id', requireModuleAccess('accesoRRHH'), FichajesController.delete);

export default router;
