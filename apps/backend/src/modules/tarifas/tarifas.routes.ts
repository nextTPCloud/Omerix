import { Router } from 'express';
import { tarifasController } from './tarifas.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Todas las rutas requieren autenticacion y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/tarifas - Obtener todas las tarifas
router.get('/', tarifasController.getAll.bind(tarifasController));

// GET /api/tarifas/activas - Obtener tarifas activas (para selectores)
router.get('/activas', tarifasController.getActivas.bind(tarifasController));

// GET /api/tarifas/:id - Obtener tarifa por ID
router.get('/:id', tarifasController.getById.bind(tarifasController));

// POST /api/tarifas - Crear tarifa
router.post('/', tarifasController.create.bind(tarifasController));

// PUT /api/tarifas/:id - Actualizar tarifa
router.put('/:id', tarifasController.update.bind(tarifasController));

// DELETE /api/tarifas/:id - Eliminar tarifa
router.delete('/:id', tarifasController.delete.bind(tarifasController));

// POST /api/tarifas/bulk-delete - Eliminar multiples tarifas
router.post('/bulk-delete', tarifasController.bulkDelete.bind(tarifasController));

// PATCH /api/tarifas/:id/status - Cambiar estado activo
router.patch('/:id/status', tarifasController.changeStatus.bind(tarifasController));

// POST /api/tarifas/:id/precios - Agregar/actualizar precio de producto
router.post('/:id/precios', tarifasController.addOrUpdatePrecio.bind(tarifasController));

// DELETE /api/tarifas/:id/precios/:productoId - Eliminar precio de producto
router.delete('/:id/precios/:productoId', tarifasController.deletePrecio.bind(tarifasController));

// POST /api/tarifas/:id/duplicar - Duplicar tarifa
router.post('/:id/duplicar', tarifasController.duplicar.bind(tarifasController));

export default router;
