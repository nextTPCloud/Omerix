import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import {
  getSolicitudPorToken,
  firmarManuscrita,
  firmarConCertificado,
  getSolicitudes,
  crearSolicitudFirma,
  reenviarNotificacion,
  getFirmasDocumento,
  firmarInterna,
} from './firmas.controller';

const router = Router();

// ===== RUTAS PUBLICAS (acceso con token de firma) =====
router.get('/firmar/:token', getSolicitudPorToken);
router.post('/firmar/:token/manuscrita', firmarManuscrita);
router.post('/firmar/:token/certificado', firmarConCertificado);

// ===== RUTAS PROTEGIDAS =====
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/solicitudes', getSolicitudes);
router.post('/solicitudes', crearSolicitudFirma);
router.post('/solicitudes/:id/reenviar/:idx', reenviarNotificacion);
router.get('/documento/:tipo/:id', getFirmasDocumento);
router.post('/interna', firmarInterna);

export default router;
