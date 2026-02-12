import { Router } from 'express';
import {
  getAllComandas,
  getComandasKDS,
  getComandaById,
  createComanda,
  updateComanda,
  updateLineaComanda,
  marcarComandaLista,
  marcarComandaServida,
  cancelarComanda,
  reimprimirComanda,
  getEstadisticasKDS,
  sseKDS,
} from './comandas-cocina.controller';

const router = Router();

/**
 * @swagger
 * /api/comandas-cocina/events/{zonaPreparacionId}:
 *   get:
 *     summary: SSE para recibir eventos de KDS en tiempo real
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 */
router.get('/events/:zonaPreparacionId', sseKDS);

/**
 * @swagger
 * /api/comandas-cocina:
 *   get:
 *     summary: Obtener todas las comandas
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getAllComandas);

/**
 * @swagger
 * /api/comandas-cocina/kds:
 *   get:
 *     summary: Obtener comandas para KDS
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: zonaPreparacionId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/kds', getComandasKDS);

/**
 * @swagger
 * /api/comandas-cocina/estadisticas/{zonaPreparacionId}:
 *   get:
 *     summary: Obtener estadisticas del KDS
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 */
router.get('/estadisticas/:zonaPreparacionId', getEstadisticasKDS);

/**
 * @swagger
 * /api/comandas-cocina/{id}:
 *   get:
 *     summary: Obtener una comanda por ID
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getComandaById);

/**
 * @swagger
 * /api/comandas-cocina:
 *   post:
 *     summary: Crear una nueva comanda
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', createComanda);

/**
 * @swagger
 * /api/comandas-cocina/{id}:
 *   put:
 *     summary: Actualizar una comanda
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', updateComanda);

/**
 * @swagger
 * /api/comandas-cocina/{id}/linea/{lineaId}:
 *   put:
 *     summary: Actualizar estado de una linea de comanda
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/linea/:lineaId', updateLineaComanda);

/**
 * @swagger
 * /api/comandas-cocina/{id}/lista:
 *   post:
 *     summary: Marcar comanda como lista
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/lista', marcarComandaLista);

/**
 * @swagger
 * /api/comandas-cocina/{id}/servida:
 *   post:
 *     summary: Marcar comanda como servida
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/servida', marcarComandaServida);

/**
 * @swagger
 * /api/comandas-cocina/{id}/cancelar:
 *   post:
 *     summary: Cancelar comanda
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/cancelar', cancelarComanda);

/**
 * @swagger
 * /api/comandas-cocina/{id}/reimprimir:
 *   post:
 *     summary: Reimprimir comanda
 *     tags: [Comandas Cocina]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/reimprimir', reimprimirComanda);

export default router;
