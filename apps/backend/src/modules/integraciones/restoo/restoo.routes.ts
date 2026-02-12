import { Router } from 'express';
import { restooController } from './restoo.controller';
import { authMiddleware, requireRole } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares de autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// Solo admin puede gestionar integraciones con Restoo
router.use(requireRole('admin', 'superadmin'));

// CRUD conexiones
router.get('/', restooController.obtenerConexiones.bind(restooController));
router.post('/', restooController.crearConexion.bind(restooController));
router.get('/:id', restooController.obtenerConexion.bind(restooController));
router.put('/:id', restooController.actualizarConexion.bind(restooController));
router.delete('/:id', restooController.eliminarConexion.bind(restooController));

// Test conexión
router.post('/:id/test', restooController.testConexion.bind(restooController));

// Sincronización
router.post('/:id/sync', restooController.sincronizar.bind(restooController));

// Logs
router.get('/:id/logs', restooController.obtenerLogs.bind(restooController));

// Salones Restoo (zonas remotas)
router.get('/:id/salones-restoo', restooController.obtenerSalonesRestoo.bind(restooController));

// Mapeo salones
router.get('/:id/mapeo-salones', restooController.obtenerMapeoSalones.bind(restooController));
router.post('/:id/mapeo-salones', restooController.guardarMapeoSalones.bind(restooController));

export default router;
