import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import {
  generarTokenActivacion,
  activarTPV,
  loginTPV,
  verificarPin,
  heartbeat,
  logoutTPV,
  listarTPVs,
  obtenerTPV,
  actualizarTPV,
  desactivarTPV,
  eliminarTPV,
  obtenerSesiones,
  forzarCierreSesion,
  revocarTokenTPV,
  descargarDatos,
  subirVentas,
  obtenerStock,
  crearTicket,
  obtenerVencimientosPendientes,
  buscarVencimientoPorFactura,
  cobrarVencimiento,
  sincronizarMovimientoCaja,
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
 * /api/tpv/verificar-pin:
 *   post:
 *     summary: Verifica PIN sin crear sesion (para PIN por ticket)
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
 *     responses:
 *       200:
 *         description: PIN verificado
 */
router.post('/verificar-pin', verificarPin);

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

// ===== RUTAS DE SINCRONIZACION (autenticacion por tpvId/tpvSecret) =====

/**
 * @swagger
 * /api/tpv/sync/descargar:
 *   post:
 *     summary: Descarga datos para el TPV (productos, clientes, tarifas)
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
 *             properties:
 *               tpvId:
 *                 type: string
 *               tpvSecret:
 *                 type: string
 *               ultimaSync:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de ultima sincronizacion para sync incremental
 *     responses:
 *       200:
 *         description: Datos descargados
 */
router.post('/sync/descargar', descargarDatos);

/**
 * @swagger
 * /api/tpv/sync/subir:
 *   post:
 *     summary: Sube ventas realizadas en modo offline
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
 *               - ventas
 *             properties:
 *               tpvId:
 *                 type: string
 *               tpvSecret:
 *                 type: string
 *               ventas:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Ventas procesadas
 */
router.post('/sync/subir', subirVentas);

/**
 * @swagger
 * /api/tpv/sync/stock:
 *   post:
 *     summary: Obtiene stock actual de productos
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
 *             properties:
 *               tpvId:
 *                 type: string
 *               tpvSecret:
 *                 type: string
 *               productosIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Stock obtenido
 */
router.post('/sync/stock', obtenerStock);

/**
 * @swagger
 * /api/tpv/sync/ticket:
 *   post:
 *     summary: Crea un ticket (factura simplificada) desde el TPV
 *     tags: [TPV]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empresaId
 *               - tpvId
 *               - tpvSecret
 *               - ticket
 *             properties:
 *               empresaId:
 *                 type: string
 *               tpvId:
 *                 type: string
 *               tpvSecret:
 *                 type: string
 *               ticket:
 *                 type: object
 *                 properties:
 *                   lineas:
 *                     type: array
 *                   total:
 *                     type: number
 *                   pagos:
 *                     type: array
 *     responses:
 *       200:
 *         description: Ticket creado con datos de Verifactu
 */
router.post('/sync/ticket', crearTicket);

/**
 * @swagger
 * /api/tpv/sync/vencimientos-pendientes:
 *   post:
 *     summary: Obtiene vencimientos pendientes de cobro/pago
 *     tags: [TPV]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empresaId
 *               - tpvId
 *               - tpvSecret
 *             properties:
 *               empresaId:
 *                 type: string
 *               tpvId:
 *                 type: string
 *               tpvSecret:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [cobro, pago]
 *                 description: Filtrar por tipo (cobro=clientes, pago=proveedores)
 *               busqueda:
 *                 type: string
 *                 description: Buscar por nombre cliente/proveedor o numero factura
 *               limite:
 *                 type: number
 *                 description: Limite de resultados (default 50)
 *     responses:
 *       200:
 *         description: Lista de vencimientos pendientes
 */
router.post('/sync/vencimientos-pendientes', obtenerVencimientosPendientes);

/**
 * @swagger
 * /api/tpv/sync/buscar-factura:
 *   post:
 *     summary: Busca vencimientos por numero de factura
 *     tags: [TPV]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empresaId
 *               - tpvId
 *               - tpvSecret
 *               - numeroFactura
 *             properties:
 *               empresaId:
 *                 type: string
 *               tpvId:
 *                 type: string
 *               tpvSecret:
 *                 type: string
 *               numeroFactura:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vencimientos de la factura
 */
router.post('/sync/buscar-factura', buscarVencimientoPorFactura);

/**
 * @swagger
 * /api/tpv/sync/cobrar-vencimiento:
 *   post:
 *     summary: Registra el cobro/pago de un vencimiento desde TPV
 *     tags: [TPV]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empresaId
 *               - tpvId
 *               - tpvSecret
 *               - vencimientoId
 *               - formaPagoId
 *             properties:
 *               empresaId:
 *                 type: string
 *               tpvId:
 *                 type: string
 *               tpvSecret:
 *                 type: string
 *               vencimientoId:
 *                 type: string
 *               formaPagoId:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vencimiento cobrado/pagado y movimiento bancario creado
 */
router.post('/sync/cobrar-vencimiento', cobrarVencimiento);

/**
 * @swagger
 * /api/tpv/sync/movimiento-caja:
 *   post:
 *     summary: Sincroniza un movimiento de caja desde el TPV (entrada/salida o cierre)
 *     tags: [TPV]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empresaId
 *               - tpvId
 *               - tpvSecret
 *               - tipo
 *               - datos
 *             properties:
 *               empresaId:
 *                 type: string
 *               tpvId:
 *                 type: string
 *               tpvSecret:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [movimiento, caja]
 *                 description: Tipo de movimiento (movimiento=entrada/salida manual, caja=apertura/cierre)
 *               datos:
 *                 type: object
 *                 description: Datos del movimiento
 *     responses:
 *       200:
 *         description: Movimiento sincronizado correctamente
 */
router.post('/sync/movimiento-caja', sincronizarMovimientoCaja);

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

/**
 * @swagger
 * /api/tpv/{id}:
 *   delete:
 *     summary: Elimina un TPV permanentemente
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
 *         description: TPV eliminado
 */
router.delete('/:id', eliminarTPV);

export default router;
