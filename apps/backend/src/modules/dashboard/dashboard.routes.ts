// apps/backend/src/modules/dashboard/dashboard.routes.ts

import { Router } from 'express';
import {
  getDashboard,
  updateDashboard,
  addWidget,
  updateWidget,
  removeWidget,
  getWidgetsData,
  getWidgetData,
  getCatalogo,
  resetDashboard,
} from './dashboard.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);
router.use(tenantMiddleware);

// Dashboard del usuario
router.get('/', getDashboard);
router.get('/catalogo', getCatalogo);

// Operaciones sobre dashboard específico
router.put('/:id', updateDashboard);
router.post('/:id/reset', resetDashboard);

// Widgets
router.post('/:id/widgets', addWidget);
router.put('/:id/widgets/:widgetId', updateWidget);
router.delete('/:id/widgets/:widgetId', removeWidget);

// Datos de widgets
router.get('/:id/data', getWidgetsData);
router.get('/:id/widgets/:widgetId/data', getWidgetData);

export default router;
