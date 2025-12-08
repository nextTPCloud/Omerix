import { Router } from 'express';
import { portalClienteController } from './portal-cliente.controller';

const router = Router();

/**
 * RUTAS PÚBLICAS DEL PORTAL DE CLIENTE
 * No requieren autenticación - acceso mediante token único
 */

/**
 * @swagger
 * /portal/presupuesto/{token}:
 *   get:
 *     summary: Obtener presupuesto por token de acceso (público)
 *     tags: [Portal Cliente]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token único de acceso al presupuesto
 *     responses:
 *       200:
 *         description: Presupuesto obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     presupuesto:
 *                       type: object
 *                     empresa:
 *                       type: object
 *                     puedeResponder:
 *                       type: boolean
 *       404:
 *         description: Presupuesto no encontrado o enlace expirado
 */
router.get(
  '/presupuesto/:token',
  portalClienteController.obtenerPresupuesto.bind(portalClienteController)
);

/**
 * @swagger
 * /portal/presupuesto/{token}/responder:
 *   post:
 *     summary: Registrar respuesta del cliente (aceptar/rechazar)
 *     tags: [Portal Cliente]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token único de acceso al presupuesto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - aceptado
 *             properties:
 *               aceptado:
 *                 type: boolean
 *                 description: true para aceptar, false para rechazar
 *               comentarios:
 *                 type: string
 *                 description: Comentarios opcionales del cliente
 *               nombreFirmante:
 *                 type: string
 *                 description: Nombre de quien responde
 *     responses:
 *       200:
 *         description: Respuesta registrada exitosamente
 *       400:
 *         description: Datos inválidos o presupuesto ya respondido
 *       404:
 *         description: Presupuesto no encontrado
 */
router.post(
  '/presupuesto/:token/responder',
  portalClienteController.registrarRespuesta.bind(portalClienteController)
);

export default router;
