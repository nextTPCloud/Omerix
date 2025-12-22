import { Router } from 'express';
import { inventariosController } from './inventarios.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Inventarios
 *   description: Gestión de inventarios físicos
 */

/**
 * GET /api/inventarios/estadisticas
 * Obtener estadísticas de inventarios
 */
router.get('/estadisticas', inventariosController.estadisticas.bind(inventariosController));

/**
 * GET /api/inventarios
 * Listar inventarios con filtros
 */
router.get('/', inventariosController.listar.bind(inventariosController));

/**
 * GET /api/inventarios/:id
 * Obtener inventario por ID
 */
router.get('/:id', inventariosController.obtenerPorId.bind(inventariosController));

/**
 * POST /api/inventarios
 * Crear nuevo inventario
 */
router.post('/', inventariosController.crear.bind(inventariosController));

/**
 * POST /api/inventarios/:id/iniciar
 * Iniciar inventario (pasar a EN_CONTEO)
 */
router.post('/:id/iniciar', inventariosController.iniciar.bind(inventariosController));

/**
 * PUT /api/inventarios/:id/conteos
 * Actualizar conteos de múltiples líneas
 */
router.put('/:id/conteos', inventariosController.actualizarConteos.bind(inventariosController));

/**
 * PUT /api/inventarios/:id/lineas/:lineaId/conteo
 * Actualizar conteo de una línea específica
 */
router.put('/:id/lineas/:lineaId/conteo', inventariosController.actualizarConteoLinea.bind(inventariosController));

/**
 * POST /api/inventarios/:id/finalizar-conteo
 * Finalizar conteo (pasar a PENDIENTE_REVISION)
 */
router.post('/:id/finalizar-conteo', inventariosController.finalizarConteo.bind(inventariosController));

/**
 * PUT /api/inventarios/:id/revisar-diferencias
 * Revisar diferencias (aprobar/rechazar ajustes)
 */
router.put('/:id/revisar-diferencias', inventariosController.revisarDiferencias.bind(inventariosController));

/**
 * POST /api/inventarios/:id/regularizar
 * Regularizar inventario (aplicar ajustes aprobados)
 */
router.post('/:id/regularizar', inventariosController.regularizar.bind(inventariosController));

/**
 * POST /api/inventarios/:id/anular
 * Anular inventario
 */
router.post('/:id/anular', inventariosController.anular.bind(inventariosController));

export default router;
