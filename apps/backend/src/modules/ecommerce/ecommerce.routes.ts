import { Router } from 'express';
import { ecommerceController } from './ecommerce.controller';
import { authMiddleware, requireRole } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares de autenticacion y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// Solo admin puede gestionar conexiones e-commerce
router.use(requireRole('admin', 'superadmin'));

// CRUD conexiones
router.get('/', ecommerceController.obtenerConexiones.bind(ecommerceController));
router.post('/', ecommerceController.crearConexion.bind(ecommerceController));
router.get('/:id', ecommerceController.obtenerConexion.bind(ecommerceController));
router.put('/:id', ecommerceController.actualizarConexion.bind(ecommerceController));
router.delete('/:id', ecommerceController.eliminarConexion.bind(ecommerceController));

// Test conexion
router.post('/:id/test', ecommerceController.testConexion.bind(ecommerceController));

// Sincronizacion
router.post('/:id/sync', ecommerceController.sincronizar.bind(ecommerceController));

// Logs
router.get('/:id/logs', ecommerceController.obtenerLogs.bind(ecommerceController));

export default router;
