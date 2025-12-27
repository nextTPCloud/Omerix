import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import {
  generarTokenActivacion,
  activarTPV,
  loginTPV,
  heartbeat,
  logoutTPV,
  listarTPVs,
  obtenerTPV,
  actualizarTPV,
  desactivarTPV,
  obtenerSesiones,
  forzarCierreSesion,
  revocarTokenTPV,
  descargarDatos,
  subirVentas,
  obtenerStock,
} from './tpv.controller';

const router = Router();

// ===== RUTAS PUBLICAS (para el TPV) =====

/**
 * @swagger
 * /api/tpv/activar:
 *   post:
 *     summary: Activa un TPV usando el token de activacion
 *     tags: [TPV]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - nombre
 *               - almacenId
 *             properties:
 *               token:
 *                 type: string
 *                 example: "ABC12XYZ"
 *               nombre:
 *                 type: string
 *                 example: "Caja Principal"
 *               almacenId:
 *                 type: string
 *     responses:
 *       200:
 *         description: TPV activado exitosamente
 */
router.post('/activar', activarTPV);

/**
 * @swagger
 * /api/tpv/login:
 *   post:
 *     summary: Login de usuario en TPV
 *     tags: [TPV]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tpvId
 *               - tpvSecret
 *               - pin
 *             properties:
 *               tpvId:
 *                 type: string
 *               tpvSecret:
 *                 type: string
 *               pin:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Login exitoso
 */
router.post('/login', loginTPV);

/**
 * @swagger
 * /api/tpv/heartbeat:
 *   post:
 *     summary: Heartbeat del TPV para mantener la sesion activa
 *     tags: [TPV]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tpvId
 *               - sesionId
 *             properties:
 *               tpvId:
 *                 type: string
 *               sesionId:
 *                 type: string
 *               cajaId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/heartbeat', heartbeat);

/**
 * @swagger
 * /api/tpv/logout:
 *   post:
 *     summary: Logout de usuario en TPV
 *     tags: [TPV]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sesionId
 *             properties:
 *               sesionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout exitoso
 */
router.post('/logout', logoutTPV);

// ===== RUTAS PROTEGIDAS (para la web de administracion) =====
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/tpv/generar-token:
 *   post:
 *     summary: Genera token de activacion para un nuevo TPV
 *     tags: [TPV]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token generado
 */
router.post('/generar-token', generarTokenActivacion);

/**
 * @swagger
 * /api/tpv/lista:
 *   get:
 *     summary: Lista todos los TPVs de la empresa
 *     tags: [TPV]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de TPVs
 */
router.get('/lista', listarTPVs);

/**
 * @swagger
 * /api/tpv/sesiones:
 *   get:
 *     summary: Obtiene sesiones activas de TPV
 *     tags: [TPV]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones activas
 */
router.get('/sesiones', obtenerSesiones);

/**
 * @swagger
 * /api/tpv/sesiones/{id}/cerrar:
 *   post:
 *     summary: Fuerza el cierre de una sesion
 *     tags: [TPV]
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
 *         description: Sesion cerrada
 */
router.post('/sesiones/:id/cerrar', forzarCierreSesion);

/**
 * @swagger
 * /api/tpv/{id}:
 *   get:
 *     summary: Obtiene un TPV
 *     tags: [TPV]
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
 *         description: TPV encontrado
 */
router.get('/:id', obtenerTPV);

/**
 * @swagger
 * /api/tpv/{id}:
 *   put:
 *     summary: Actualiza un TPV
 *     tags: [TPV]
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
 *               almacenId:
 *                 type: string
 *               serieFactura:
 *                 type: string
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: TPV actualizado
 */
router.put('/:id', actualizarTPV);

/**
 * @swagger
 * /api/tpv/{id}/desactivar:
 *   post:
 *     summary: Desactiva un TPV
 *     tags: [TPV]
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
 *         description: TPV desactivado
 */
router.post('/:id/desactivar', desactivarTPV);

/**
 * @swagger
 * /api/tpv/{id}/revocar-token:
 *   post:
 *     summary: Revoca el token de un TPV (fuerza re-autenticacion)
 *     tags: [TPV]
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
 *         description: Token revocado
 */
router.post('/:id/revocar-token', revocarTokenTPV);

export default router;
