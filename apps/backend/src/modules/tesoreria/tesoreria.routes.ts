import { Router } from 'express';
import { tesoreriaController } from './tesoreria.controller';
import { authMiddleware, requireModuleAccess } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// Verificar acceso al módulo de tesorería
router.use(requireModuleAccess('accesoTesoreria'));

/**
 * @swagger
 * /tesoreria/estadisticas:
 *   get:
 *     summary: Obtener estadísticas generales de tesorería
 *     tags: [Tesorería]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de tesorería
 */
router.get('/estadisticas', (req, res, next) => tesoreriaController.getEstadisticas(req, res, next));

/**
 * @swagger
 * /tesoreria/prevision-caja:
 *   get:
 *     summary: Obtener previsión de caja
 *     tags: [Tesorería]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: saldoInicial
 *         schema:
 *           type: number
 *           default: 0
 *     responses:
 *       200:
 *         description: Previsión de caja
 */
router.get('/prevision-caja', (req, res, next) => tesoreriaController.getPrevisionCaja(req, res, next));

/**
 * @swagger
 * /tesoreria/cliente/{clienteId}/resumen:
 *   get:
 *     summary: Obtener resumen de tesorería de un cliente
 *     tags: [Tesorería]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resumen de tesorería del cliente
 */
router.get('/cliente/:clienteId/resumen', (req, res, next) => tesoreriaController.getResumenCliente(req, res, next));

export default router;
