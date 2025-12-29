import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import {
  getLicencia,
  getPlanes,
  getAddOns,
  cambiarPlan,
  addAddOn,
  removeAddOn,
  getResumenFacturacion,
  toggleRenovacionAutomatica,
  getEstadoRenovacion,
  getPermisosDisponibles,
  recalcularConteoTPVs,
} from './licencias.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/licencias/mi-licencia:
 *   get:
 *     summary: Obtener licencia actual
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información de la licencia
 */
router.get('/mi-licencia', getLicencia);

/**
 * @swagger
 * /api/licencias/planes:
 *   get:
 *     summary: Listar planes disponibles
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de planes
 */
router.get('/planes', getPlanes);

/**
 * @swagger
 * /api/licencias/addons:
 *   get:
 *     summary: Listar add-ons disponibles
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de add-ons
 */
router.get('/addons', getAddOns);

/**
 * @swagger
 * /api/licencias/cambiar-plan:
 *   post:
 *     summary: Cambiar de plan
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planSlug
 *               - tipoSuscripcion
 *             properties:
 *               planSlug:
 *                 type: string
 *                 example: professional
 *               tipoSuscripcion:
 *                 type: string
 *                 enum: [mensual, anual]
 *     responses:
 *       200:
 *         description: Plan cambiado exitosamente
 */
router.post('/cambiar-plan', cambiarPlan);

/**
 * @swagger
 * /api/licencias/add-addon:
 *   post:
 *     summary: Añadir add-on
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addOnSlug
 *             properties:
 *               addOnSlug:
 *                 type: string
 *                 example: modulo-taller
 *     responses:
 *       200:
 *         description: Add-on añadido exitosamente
 */
router.post('/add-addon', addAddOn);

/**
 * @swagger
 * /api/licencias/remove-addon:
 *   post:
 *     summary: Eliminar add-on
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addOnSlug
 *             properties:
 *               addOnSlug:
 *                 type: string
 *                 example: tpv
 *     responses:
 *       200:
 *         description: Add-on eliminado exitosamente
 */
router.post('/remove-addon', removeAddOn);

/**
 * @swagger
 * /api/licencias/facturacion:
 *   get:
 *     summary: Obtener resumen de facturación
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de facturación actual
 */
router.get('/facturacion', getResumenFacturacion);

/**
 * @swagger
 * /api/licencias/renovacion:
 *   get:
 *     summary: Obtener estado de renovación automática
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de renovación
 */
router.get('/renovacion', getEstadoRenovacion);

/**
 * @swagger
 * /api/licencias/renovacion:
 *   put:
 *     summary: Activar/Desactivar renovación automática
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activar
 *             properties:
 *               activar:
 *                 type: boolean
 *                 description: true para activar, false para desactivar
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put('/renovacion', toggleRenovacionAutomatica);

/**
 * @swagger
 * /api/licencias/permisos-disponibles:
 *   get:
 *     summary: Obtener permisos disponibles según el plan contratado
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos y su disponibilidad
 */
router.get('/permisos-disponibles', getPermisosDisponibles);

/**
 * @swagger
 * /api/licencias/recalcular-tpvs:
 *   post:
 *     summary: Recalcular conteo de TPVs desde la BD de empresa
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo recalculado
 */
router.post('/recalcular-tpvs', recalcularConteoTPVs);

export default router;