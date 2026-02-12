import { Router } from 'express';
import {
  getAllCamareros,
  getCamareroById,
  getCamareroByUsuario,
  getSiguienteCodigo,
  createCamarero,
  updateCamarero,
  deleteCamarero,
  cambiarEstadoCamarero,
  verificarPINCamarero,
  getCamarerosActivos,
  getCamarerosPorSalon,
  asignarSalones,
  asignarMesas,
  registrarPropina,
  resetearPropinas,
  getEstadisticasCamarero,
  getResumenCamareros,
} from './camareros.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware, requireBusinessDatabase } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireBusinessDatabase);

/**
 * @swagger
 * /api/camareros:
 *   get:
 *     summary: Obtener todos los camareros
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getAllCamareros);

/**
 * @swagger
 * /api/camareros/activos:
 *   get:
 *     summary: Obtener camareros activos (en turno)
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.get('/activos', getCamarerosActivos);

/**
 * @swagger
 * /api/camareros/resumen:
 *   get:
 *     summary: Obtener resumen general de camareros
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.get('/resumen', getResumenCamareros);

/**
 * @swagger
 * /api/camareros/siguiente-codigo:
 *   get:
 *     summary: Sugerir el siguiente codigo de camarero
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefijo
 *         schema:
 *           type: string
 *         description: Prefijo para el codigo (por defecto CAM)
 */
router.get('/siguiente-codigo', getSiguienteCodigo);

/**
 * @swagger
 * /api/camareros/salon/{salonId}:
 *   get:
 *     summary: Obtener camareros asignados a un salón
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.get('/salon/:salonId', getCamarerosPorSalon);

/**
 * @swagger
 * /api/camareros/usuario/{usuarioId}:
 *   get:
 *     summary: Obtener camarero por ID de usuario
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.get('/usuario/:usuarioId', getCamareroByUsuario);

/**
 * @swagger
 * /api/camareros/{id}:
 *   get:
 *     summary: Obtener un camarero por ID
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getCamareroById);

/**
 * @swagger
 * /api/camareros:
 *   post:
 *     summary: Crear un nuevo camarero
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', createCamarero);

/**
 * @swagger
 * /api/camareros/{id}:
 *   put:
 *     summary: Actualizar un camarero
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', updateCamarero);

/**
 * @swagger
 * /api/camareros/{id}:
 *   delete:
 *     summary: Eliminar un camarero (soft delete)
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', deleteCamarero);

/**
 * @swagger
 * /api/camareros/{id}/estado:
 *   put:
 *     summary: Cambiar estado del camarero
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/estado', cambiarEstadoCamarero);

/**
 * @swagger
 * /api/camareros/{id}/verificar-pin:
 *   post:
 *     summary: Verificar PIN del camarero
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/verificar-pin', verificarPINCamarero);

/**
 * @swagger
 * /api/camareros/{id}/salones:
 *   put:
 *     summary: Asignar salones a un camarero
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/salones', asignarSalones);

/**
 * @swagger
 * /api/camareros/{id}/mesas:
 *   put:
 *     summary: Asignar mesas a un camarero
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/mesas', asignarMesas);

/**
 * @swagger
 * /api/camareros/{id}/propina:
 *   post:
 *     summary: Registrar propina para un camarero
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/propina', registrarPropina);

/**
 * @swagger
 * /api/camareros/{id}/propinas/reset:
 *   post:
 *     summary: Resetear propinas acumuladas de un camarero
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/propinas/reset', resetearPropinas);

/**
 * @swagger
 * /api/camareros/{id}/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de un camarero
 *     tags: [Camareros]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/estadisticas', getEstadisticasCamarero);

export default router;
