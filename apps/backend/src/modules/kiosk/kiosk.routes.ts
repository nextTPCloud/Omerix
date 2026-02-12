import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import {
  // Publicas
  activarKiosk,
  activarConToken,
  descargarDatos,
  crearSesion,
  obtenerSesion,
  actualizarCarrito,
  actualizarClienteSesion,
  crearPedido,
  obtenerEstadoPedido,
  registrarPago,
  // Protegidas
  generarTokenActivacion,
  listarKiosks,
  obtenerKiosk,
  crearKiosk,
  actualizarKiosk,
  desactivarKiosk,
  activarKioskAdmin,
  eliminarKiosk,
  regenerarSecret,
  generarQRMesa,
  // TPV Integration
  obtenerPedidosPendientesTPV,
  validarPedidoTPV,
  cancelarPedido,
} from './kiosk.controller';

const router = Router();

// ============================================
// RUTAS PUBLICAS (para el kiosk/cliente)
// ============================================

/**
 * @swagger
 * /api/kiosk/activar:
 *   post:
 *     summary: Activa/verifica un kiosk y obtiene su configuracion
 *     tags: [Kiosk]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empresaId
 *               - kioskId
 *               - kioskSecret
 *             properties:
 *               empresaId:
 *                 type: string
 *               kioskId:
 *                 type: string
 *               kioskSecret:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kiosk activado con configuracion
 */
router.post('/activar', activarKiosk);

/**
 * @swagger
 * /api/kiosk/activar-token:
 *   post:
 *     summary: Activa un kiosk usando el token de activacion
 *     tags: [Kiosk]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [totem, qr_mesa, tablet_mesa, menu_digital]
 *     responses:
 *       200:
 *         description: Kiosk activado con credenciales
 */
router.post('/activar-token', activarConToken);

/**
 * @swagger
 * /api/kiosk/sync/descargar:
 *   post:
 *     summary: Descarga datos para el kiosk (productos, familias, modificadores)
 *     tags: [Kiosk]
 */
router.post('/sync/descargar', descargarDatos);

// ============================================
// SESIONES QR
// ============================================

/**
 * @swagger
 * /api/kiosk/session/crear:
 *   post:
 *     summary: Crea una nueva sesion QR
 *     tags: [Kiosk]
 */
router.post('/session/crear', crearSesion);

/**
 * @swagger
 * /api/kiosk/session/{token}:
 *   post:
 *     summary: Obtiene datos de una sesion por token
 *     tags: [Kiosk]
 */
router.post('/session/:token', obtenerSesion);

/**
 * @swagger
 * /api/kiosk/session/{token}/carrito:
 *   put:
 *     summary: Actualiza el carrito de una sesion
 *     tags: [Kiosk]
 */
router.put('/session/:token/carrito', actualizarCarrito);

/**
 * @swagger
 * /api/kiosk/session/{token}/cliente:
 *   put:
 *     summary: Actualiza datos del cliente en sesion
 *     tags: [Kiosk]
 */
router.put('/session/:token/cliente', actualizarClienteSesion);

// ============================================
// PEDIDOS
// ============================================

/**
 * @swagger
 * /api/kiosk/pedido/crear:
 *   post:
 *     summary: Crea un pedido desde kiosk
 *     tags: [Kiosk]
 */
router.post('/pedido/crear', crearPedido);

/**
 * @swagger
 * /api/kiosk/pedido/{id}/estado:
 *   post:
 *     summary: Obtiene el estado de un pedido
 *     tags: [Kiosk]
 */
router.post('/pedido/:id/estado', obtenerEstadoPedido);

/**
 * @swagger
 * /api/kiosk/pedido/{id}/pagar:
 *   post:
 *     summary: Registra el pago de un pedido
 *     tags: [Kiosk]
 */
router.post('/pedido/:id/pagar', registrarPago);

// ============================================
// INTEGRACION TPV (pedidos pendientes)
// ============================================

/**
 * @swagger
 * /api/kiosk/tpv/pedidos-pendientes:
 *   post:
 *     summary: Obtiene pedidos pendientes de validacion para un TPV
 *     tags: [Kiosk]
 */
router.post('/tpv/pedidos-pendientes', obtenerPedidosPendientesTPV);

/**
 * @swagger
 * /api/kiosk/tpv/pedido/{id}/validar:
 *   post:
 *     summary: Valida un pedido desde TPV
 *     tags: [Kiosk]
 */
router.post('/tpv/pedido/:id/validar', validarPedidoTPV);

/**
 * @swagger
 * /api/kiosk/tpv/pedido/{id}/cancelar:
 *   post:
 *     summary: Cancela un pedido
 *     tags: [Kiosk]
 */
router.post('/tpv/pedido/:id/cancelar', cancelarPedido);

// ============================================
// RUTAS PROTEGIDAS (admin)
// ============================================
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/kiosk/generar-token:
 *   post:
 *     summary: Genera un token de activacion para un nuevo kiosk
 *     tags: [Kiosk]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token generado
 */
router.post('/generar-token', generarTokenActivacion);

/**
 * @swagger
 * /api/kiosk/lista:
 *   get:
 *     summary: Lista todos los kioskos de la empresa
 *     tags: [Kiosk]
 *     security:
 *       - bearerAuth: []
 */
router.get('/lista', listarKiosks);

/**
 * @swagger
 * /api/kiosk/crear:
 *   post:
 *     summary: Crea un nuevo kiosk
 *     tags: [Kiosk]
 *     security:
 *       - bearerAuth: []
 */
router.post('/crear', crearKiosk);

/**
 * @swagger
 * /api/kiosk/{id}:
 *   get:
 *     summary: Obtiene un kiosk por ID
 *     tags: [Kiosk]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', obtenerKiosk);

/**
 * @swagger
 * /api/kiosk/{id}:
 *   put:
 *     summary: Actualiza un kiosk
 *     tags: [Kiosk]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', actualizarKiosk);

/**
 * @swagger
 * /api/kiosk/{id}/desactivar:
 *   post:
 *     summary: Desactiva un kiosk
 *     tags: [Kiosk]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/desactivar', desactivarKiosk);

/**
 * @swagger
 * /api/kiosk/{id}/activar:
 *   post:
 *     summary: Activa un kiosk desactivado
 *     tags: [Kiosk]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/activar', activarKioskAdmin);

/**
 * @swagger
 * /api/kiosk/{id}/regenerar-secret:
 *   post:
 *     summary: Regenera el secret de un kiosk
 *     tags: [Kiosk]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/regenerar-secret', regenerarSecret);

/**
 * @swagger
 * /api/kiosk/{id}/generar-qr/{mesaId}:
 *   get:
 *     summary: Genera URL de QR para una mesa
 *     tags: [Kiosk]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/generar-qr/:mesaId', generarQRMesa);

/**
 * @swagger
 * /api/kiosk/{id}:
 *   delete:
 *     summary: Elimina un kiosk
 *     tags: [Kiosk]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', eliminarKiosk);

export default router;
