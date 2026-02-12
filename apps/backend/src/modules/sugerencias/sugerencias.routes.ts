import { Router } from 'express';
import {
  getAllSugerencias,
  getSugerenciaById,
  createSugerencia,
  updateSugerencia,
  deleteSugerencia,
  getSugerenciasParaProducto,
  getSugerenciasFinalizacion,
  registrarAceptacion,
  getEstadisticasSugerencias,
} from './sugerencias.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware, requireBusinessDatabase } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireBusinessDatabase);

/**
 * @swagger
 * /api/sugerencias:
 *   get:
 *     summary: Obtener todas las sugerencias
 *     tags: [Sugerencias]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getAllSugerencias);

/**
 * @swagger
 * /api/sugerencias/finalizacion:
 *   get:
 *     summary: Obtener sugerencias para finalización de pedido
 *     tags: [Sugerencias]
 *     security:
 *       - bearerAuth: []
 */
router.get('/finalizacion', getSugerenciasFinalizacion);

/**
 * @swagger
 * /api/sugerencias/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de sugerencias
 *     tags: [Sugerencias]
 *     security:
 *       - bearerAuth: []
 */
router.get('/estadisticas', getEstadisticasSugerencias);

/**
 * @swagger
 * /api/sugerencias/producto/{productoId}:
 *   get:
 *     summary: Obtener sugerencias para un producto
 *     tags: [Sugerencias]
 *     security:
 *       - bearerAuth: []
 */
router.get('/producto/:productoId', getSugerenciasParaProducto);

/**
 * @swagger
 * /api/sugerencias/{id}:
 *   get:
 *     summary: Obtener una sugerencia por ID
 *     tags: [Sugerencias]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getSugerenciaById);

/**
 * @swagger
 * /api/sugerencias:
 *   post:
 *     summary: Crear una nueva sugerencia
 *     tags: [Sugerencias]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', createSugerencia);

/**
 * @swagger
 * /api/sugerencias/{id}:
 *   put:
 *     summary: Actualizar una sugerencia
 *     tags: [Sugerencias]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', updateSugerencia);

/**
 * @swagger
 * /api/sugerencias/{id}:
 *   delete:
 *     summary: Eliminar una sugerencia
 *     tags: [Sugerencias]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', deleteSugerencia);

/**
 * @swagger
 * /api/sugerencias/{id}/aceptar:
 *   post:
 *     summary: Registrar aceptación de sugerencia
 *     tags: [Sugerencias]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/aceptar', registrarAceptacion);

export default router;
