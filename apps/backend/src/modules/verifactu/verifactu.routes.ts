// backend/src/modules/verifactu/verifactu.routes.ts

import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { roleMiddleware } from '@/middleware/authorization.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import verifactuController from './verifactu.controller';

const router = Router();

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS VERIFACTU
// ============================================

/**
 * GET /api/verifactu/conexion
 * Verificar conexión con AEAT
 */
router.get('/conexion', verifactuController.verificarConexion);

/**
 * POST /api/verifactu/entorno
 * Configurar entorno (test/production)
 */
router.post(
  '/entorno',
  roleMiddleware(['superadmin', 'admin']),
  verifactuController.configurarEntorno
);

/**
 * POST /api/verifactu/facturas/:facturaId/enviar
 * Enviar factura a AEAT
 */
router.post(
  '/facturas/:facturaId/enviar',
  roleMiddleware(['superadmin', 'admin', 'gerente', 'contable']),
  verifactuController.enviarFactura
);

/**
 * GET /api/verifactu/facturas/:facturaId/consultar
 * Consultar estado de factura en AEAT
 */
router.get(
  '/facturas/:facturaId/consultar',
  verifactuController.consultarFactura
);

/**
 * POST /api/verifactu/facturas/:facturaId/baja
 * Dar de baja una factura en AEAT
 */
router.post(
  '/facturas/:facturaId/baja',
  roleMiddleware(['superadmin', 'admin', 'gerente', 'contable']),
  verifactuController.bajaFactura
);

/**
 * GET /api/verifactu/facturas/:facturaId/url-verificacion
 * Obtener URL de verificación para QR
 */
router.get(
  '/facturas/:facturaId/url-verificacion',
  verifactuController.obtenerURLVerificacion
);

export default router;
