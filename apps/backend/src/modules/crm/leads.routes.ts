import { Router } from 'express';
import { leadsController } from './leads.controller';
import {
  CreateLeadSchema,
  UpdateLeadSchema,
  ConvertirLeadSchema,
} from './crm.dto';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBody } from '@/middleware/validation.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Leads CRM
 *   description: Gestión de leads (prospectos)
 */

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @swagger
 * /crm/leads:
 *   post:
 *     summary: Crear un nuevo lead
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  validateBody(CreateLeadSchema),
  leadsController.crear.bind(leadsController)
);

/**
 * @swagger
 * /crm/leads:
 *   get:
 *     summary: Obtener todos los leads con filtros y paginación
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  leadsController.obtenerTodos.bind(leadsController)
);

/**
 * @swagger
 * /crm/leads/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de leads
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/estadisticas',
  leadsController.obtenerEstadisticas.bind(leadsController)
);

/**
 * @swagger
 * /crm/leads/pendientes-contacto:
 *   get:
 *     summary: Obtener leads pendientes de contacto
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/pendientes-contacto',
  leadsController.obtenerPendientesContacto.bind(leadsController)
);

/**
 * @swagger
 * /crm/leads/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples leads
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/bulk-delete',
  leadsController.eliminarMultiples.bind(leadsController)
);

/**
 * @swagger
 * /crm/leads/{id}:
 *   get:
 *     summary: Obtener un lead por ID
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  leadsController.obtenerPorId.bind(leadsController)
);

/**
 * @swagger
 * /crm/leads/{id}:
 *   put:
 *     summary: Actualizar un lead
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  validateBody(UpdateLeadSchema),
  leadsController.actualizar.bind(leadsController)
);

/**
 * @swagger
 * /crm/leads/{id}:
 *   delete:
 *     summary: Eliminar un lead
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  leadsController.eliminar.bind(leadsController)
);

/**
 * @swagger
 * /crm/leads/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de un lead
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/estado',
  leadsController.cambiarEstado.bind(leadsController)
);

/**
 * @swagger
 * /crm/leads/{id}/asignar:
 *   patch:
 *     summary: Asignar lead a un usuario
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/asignar',
  leadsController.asignar.bind(leadsController)
);

/**
 * @swagger
 * /crm/leads/{id}/convertir:
 *   post:
 *     summary: Convertir lead a cliente y/u oportunidad
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/convertir',
  validateBody(ConvertirLeadSchema),
  leadsController.convertir.bind(leadsController)
);

/**
 * @swagger
 * /crm/leads/{id}/duplicar:
 *   post:
 *     summary: Duplicar un lead
 *     tags: [Leads CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/duplicar',
  leadsController.duplicar.bind(leadsController)
);

export default router;
