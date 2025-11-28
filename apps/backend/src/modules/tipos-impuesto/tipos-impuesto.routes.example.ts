// apps/backend/src/modules/tipos-impuesto/tipos-impuesto.routes.example.ts
// EJEMPLO DE CÓMO IMPLEMENTAR AUTORIZACIÓN ROBUSTA EN RUTAS

import { Router } from 'express';
import { tiposImpuestoController } from './tipos-impuesto.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import {
  requirePermission,
  requireOwnership,
  requireAuth,
} from '@/middleware/authorization.middleware';
import { validateBody } from '@/middleware/validation.middleware';
import {
  CreateTipoImpuestoSchema,
  UpdateTipoImpuestoSchema,
} from './tipos-impuesto.dto';
import { getTiposImpuestoModel } from '@/utils/dynamic-models.helper';

const router = Router();

// ============================================
// APLICAR MIDDLEWARES GLOBALES
// ============================================
// 1. Autenticación (verifica JWT y usuario activo)
router.use(authMiddleware);

// 2. Tenant (configura la base de datos de la empresa)
router.use(tenantMiddleware);

// 3. Validar autenticación completa (userId + empresaId)
router.use(requireAuth);

// ============================================
// RUTAS CON AUTORIZACIÓN GRANULAR
// ============================================

/**
 * GET /tipos-impuesto
 * Requiere: permiso de lectura en tipos-impuesto
 */
router.get(
  '/',
  requirePermission('tipos-impuesto', 'read'),
  tiposImpuestoController.getAll.bind(tiposImpuestoController)
);

/**
 * GET /tipos-impuesto/:id
 * Requiere:
 * - Permiso de lectura en tipos-impuesto
 * - Ownership (el tipo de impuesto debe pertenecer a la empresa del usuario)
 */
router.get(
  '/:id',
  requirePermission('tipos-impuesto', 'read'),
  requireOwnership(getTiposImpuestoModel, 'id'),
  tiposImpuestoController.getOne.bind(tiposImpuestoController)
);

/**
 * POST /tipos-impuesto
 * Requiere: permiso de creación en tipos-impuesto
 */
router.post(
  '/',
  requirePermission('tipos-impuesto', 'create'),
  validateBody(CreateTipoImpuestoSchema),
  tiposImpuestoController.create.bind(tiposImpuestoController)
);

/**
 * PUT /tipos-impuesto/:id
 * Requiere:
 * - Permiso de actualización en tipos-impuesto
 * - Ownership (el tipo de impuesto debe pertenecer a la empresa)
 */
router.put(
  '/:id',
  requirePermission('tipos-impuesto', 'update'),
  requireOwnership(getTiposImpuestoModel, 'id'),
  validateBody(UpdateTipoImpuestoSchema),
  tiposImpuestoController.update.bind(tiposImpuestoController)
);

/**
 * DELETE /tipos-impuesto/:id
 * Requiere:
 * - Permiso de eliminación en tipos-impuesto
 * - Ownership (el tipo de impuesto debe pertenecer a la empresa)
 */
router.delete(
  '/:id',
  requirePermission('tipos-impuesto', 'delete'),
  requireOwnership(getTiposImpuestoModel, 'id'),
  tiposImpuestoController.delete.bind(tiposImpuestoController)
);

/**
 * PATCH /tipos-impuesto/:id/predeterminado
 * Requiere:
 * - Permiso de actualización en tipos-impuesto
 * - Ownership
 */
router.patch(
  '/:id/predeterminado',
  requirePermission('tipos-impuesto', 'update'),
  requireOwnership(getTiposImpuestoModel, 'id'),
  tiposImpuestoController.setPredeterminado.bind(tiposImpuestoController)
);

export default router;

/*
 * NOTAS DE IMPLEMENTACIÓN:
 *
 * 1. ORDEN DE MIDDLEWARES IMPORTA:
 *    - authMiddleware (verifica JWT)
 *    - tenantMiddleware (configura DB de empresa)
 *    - requireAuth (valida datos completos)
 *    - requirePermission (verifica permisos de rol)
 *    - requireOwnership (verifica que el recurso pertenece a la empresa)
 *    - validateBody (valida datos de entrada)
 *    - controller (ejecuta lógica)
 *
 * 2. PERMISOS POR ROL:
 *    - superadmin: acceso total
 *    - admin: acceso total a su empresa
 *    - gerente: crear, leer, actualizar (no eliminar)
 *    - vendedor: solo lectura
 *    - almacenero: solo lectura
 *    - visualizador: solo lectura
 *
 * 3. OWNERSHIP:
 *    - requireOwnership verifica automáticamente que el recurso
 *      pertenezca a la empresa del usuario autenticado
 *    - Previene acceso cruzado entre empresas
 *    - El recurso se añade a req.resource para evitar consultas duplicadas
 *
 * 4. VALIDACIÓN DE ENTRADA:
 *    - validateBody usa Zod para validar estructura
 *    - AuthorizationHelper.validateInput previene inyección de operadores MongoDB
 *
 * 5. RATE LIMITING:
 *    - Global: implementado en server.ts
 *    - Por usuario: implementado en authMiddleware (1000 req/min)
 *
 * 6. LOGS DE AUDITORÍA:
 *    - Los eventos de seguridad se registran automáticamente
 *    - AuthorizationHelper.logSecurityEvent para eventos personalizados
 */
