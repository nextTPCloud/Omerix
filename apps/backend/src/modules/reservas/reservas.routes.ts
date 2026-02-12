import { Router } from 'express';
import {
  getAllReservas,
  getReservaById,
  createReserva,
  updateReserva,
  deleteReserva,
  confirmarReserva,
  iniciarReserva,
  completarReserva,
  cancelarReserva,
  marcarNoShow,
  verificarDisponibilidad,
  getReservasDelDia,
  getEstadisticasReservas,
} from './reservas.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware, requireBusinessDatabase } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireBusinessDatabase);

/**
 * @swagger
 * /api/reservas:
 *   get:
 *     summary: Obtener todas las reservas
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getAllReservas);

/**
 * @swagger
 * /api/reservas/disponibilidad:
 *   get:
 *     summary: Verificar disponibilidad
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.get('/disponibilidad', verificarDisponibilidad);

/**
 * @swagger
 * /api/reservas/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de reservas
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.get('/estadisticas', getEstadisticasReservas);

/**
 * @swagger
 * /api/reservas/dia/{fecha}:
 *   get:
 *     summary: Obtener reservas del día
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dia/:fecha?', getReservasDelDia);

/**
 * @swagger
 * /api/reservas/{id}:
 *   get:
 *     summary: Obtener una reserva por ID
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getReservaById);

/**
 * @swagger
 * /api/reservas:
 *   post:
 *     summary: Crear una nueva reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', createReserva);

/**
 * @swagger
 * /api/reservas/{id}:
 *   put:
 *     summary: Actualizar una reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', updateReserva);

/**
 * @swagger
 * /api/reservas/{id}:
 *   delete:
 *     summary: Eliminar una reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', deleteReserva);

/**
 * @swagger
 * /api/reservas/{id}/confirmar:
 *   post:
 *     summary: Confirmar reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/confirmar', confirmarReserva);

/**
 * @swagger
 * /api/reservas/{id}/iniciar:
 *   post:
 *     summary: Iniciar reserva (cliente llega)
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/iniciar', iniciarReserva);

/**
 * @swagger
 * /api/reservas/{id}/completar:
 *   post:
 *     summary: Completar reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/completar', completarReserva);

/**
 * @swagger
 * /api/reservas/{id}/cancelar:
 *   post:
 *     summary: Cancelar reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/cancelar', cancelarReserva);

/**
 * @swagger
 * /api/reservas/{id}/no-show:
 *   post:
 *     summary: Marcar como no-show
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/no-show', marcarNoShow);

export default router;
