// backend/src/modules/certificados/certificados.routes.ts

import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { roleMiddleware } from '@/middleware/authorization.middleware';
import certificadosController from './certificados.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============================================
// RUTAS DE CERTIFICADOS ELECTRÓNICOS
// ============================================

/**
 * GET /api/certificados
 * Listar certificados de la empresa
 */
router.get('/', certificadosController.listar);

/**
 * GET /api/certificados/predeterminado
 * Obtener certificado predeterminado
 */
router.get('/predeterminado', certificadosController.obtenerPredeterminado);

/**
 * GET /api/certificados/proximos-caducar
 * Obtener certificados próximos a caducar (admin)
 */
router.get(
  '/proximos-caducar',
  roleMiddleware(['superadmin', 'admin']),
  certificadosController.proximosACaducar
);

// ============================================
// RUTAS DE WINDOWS STORE (antes de :id)
// ============================================

/**
 * GET /api/certificados/windows-store/disponible
 * Verificar si el almacén de Windows está disponible
 */
router.get('/windows-store/disponible', certificadosController.windowsStoreDisponible);

/**
 * GET /api/certificados/windows-store/listar
 * Listar certificados del almacén de Windows
 */
router.get(
  '/windows-store/listar',
  roleMiddleware(['superadmin', 'admin', 'gerente']),
  certificadosController.listarCertificadosWindows
);

/**
 * POST /api/certificados/windows-store/registrar
 * Registrar un certificado del almacén de Windows
 */
router.post(
  '/windows-store/registrar',
  roleMiddleware(['superadmin', 'admin', 'gerente']),
  certificadosController.registrarCertificadoWindows
);

// ============================================
// RUTAS GENERALES
// ============================================

/**
 * POST /api/certificados
 * Subir un nuevo certificado
 * Solo admin y gerente pueden subir certificados
 */
router.post(
  '/',
  roleMiddleware(['superadmin', 'admin', 'gerente']),
  certificadosController.subir
);

/**
 * POST /api/certificados/verificar-password
 * Verificar contraseña de un certificado (antes de subirlo)
 */
router.post(
  '/verificar-password',
  roleMiddleware(['superadmin', 'admin', 'gerente']),
  certificadosController.verificarPassword
);

/**
 * GET /api/certificados/:id
 * Obtener un certificado por ID
 */
router.get('/:id', certificadosController.obtenerPorId);

/**
 * GET /api/certificados/:id/validar
 * Validar un certificado para un uso específico
 */
router.get('/:id/validar', certificadosController.validar);

/**
 * PUT /api/certificados/:id
 * Actualizar un certificado
 */
router.put(
  '/:id',
  roleMiddleware(['superadmin', 'admin', 'gerente']),
  certificadosController.actualizar
);

/**
 * DELETE /api/certificados/:id
 * Eliminar un certificado
 */
router.delete(
  '/:id',
  roleMiddleware(['superadmin', 'admin', 'gerente']),
  certificadosController.eliminar
);

/**
 * POST /api/certificados/:id/probar-firma
 * Probar firma con un certificado
 */
router.post(
  '/:id/probar-firma',
  roleMiddleware(['superadmin', 'admin', 'gerente']),
  certificadosController.probarFirma
);

export default router;
