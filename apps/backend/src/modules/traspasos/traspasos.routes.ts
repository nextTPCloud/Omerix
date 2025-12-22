import { Router } from 'express';
import { traspasosController } from './traspasos.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Traspasos
 *   description: Gestión de traspasos entre almacenes
 */

/**
 * GET /api/traspasos/estadisticas
 * Obtener estadísticas de traspasos
 */
router.get('/estadisticas', traspasosController.estadisticas.bind(traspasosController));

/**
 * GET /api/traspasos
 * Listar traspasos con filtros
 */
router.get('/', traspasosController.listar.bind(traspasosController));

/**
 * GET /api/traspasos/:id
 * Obtener traspaso por ID
 */
router.get('/:id', traspasosController.obtenerPorId.bind(traspasosController));

/**
 * POST /api/traspasos
 * Crear nuevo traspaso
 */
router.post('/', traspasosController.crear.bind(traspasosController));

/**
 * PUT /api/traspasos/:id
 * Actualizar traspaso (solo en borrador)
 */
router.put('/:id', traspasosController.actualizar.bind(traspasosController));

/**
 * POST /api/traspasos/:id/confirmar-salida
 * Confirmar salida del almacén origen
 */
router.post('/:id/confirmar-salida', traspasosController.confirmarSalida.bind(traspasosController));

/**
 * POST /api/traspasos/:id/confirmar-recepcion
 * Confirmar recepción en almacén destino
 */
router.post('/:id/confirmar-recepcion', traspasosController.confirmarRecepcion.bind(traspasosController));

/**
 * POST /api/traspasos/:id/anular
 * Anular traspaso
 */
router.post('/:id/anular', traspasosController.anular.bind(traspasosController));

export default router;
