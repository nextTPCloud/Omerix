import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { calcularPrecio, calcularPreciosMultiples } from './precios.controller';

const router = Router();

// Aplicar middlewares de autenticacion y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS DE PRECIOS
// ============================================

// Calcular precio de un producto
router.post('/calcular', calcularPrecio);

// Calcular precios de multiples productos
router.post('/calcular-multiples', calcularPreciosMultiples);

export default router;
