import { Router } from 'express';
import { ofertasController } from './ofertas.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Todas las rutas requieren autenticacion y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/ofertas - Obtener todas las ofertas
router.get('/', ofertasController.getAll.bind(ofertasController));

// GET /api/ofertas/vigentes - Obtener ofertas vigentes
router.get('/vigentes', ofertasController.getVigentes.bind(ofertasController));

// GET /api/ofertas/happy-hours - Obtener happy hours activas ahora
router.get('/happy-hours', ofertasController.getHappyHours.bind(ofertasController));

// GET /api/ofertas/:id - Obtener oferta por ID
router.get('/:id', ofertasController.getById.bind(ofertasController));

// POST /api/ofertas - Crear oferta
router.post('/', ofertasController.create.bind(ofertasController));

// PUT /api/ofertas/:id - Actualizar oferta
router.put('/:id', ofertasController.update.bind(ofertasController));

// DELETE /api/ofertas/:id - Eliminar oferta
router.delete('/:id', ofertasController.delete.bind(ofertasController));

// POST /api/ofertas/bulk-delete - Eliminar multiples ofertas
router.post('/bulk-delete', ofertasController.bulkDelete.bind(ofertasController));

// PATCH /api/ofertas/:id/status - Cambiar estado activo
router.patch('/:id/status', ofertasController.changeStatus.bind(ofertasController));

// POST /api/ofertas/:id/duplicar - Duplicar oferta
router.post('/:id/duplicar', ofertasController.duplicar.bind(ofertasController));

export default router;
