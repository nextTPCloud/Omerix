import { Router } from 'express';
import pipelineRoutes from './pipeline.routes';
import leadsRoutes from './leads.routes';
import oportunidadesRoutes from './oportunidades.routes';
import actividadesRoutes from './actividades.routes';

const router = Router();

/**
 * Router principal del módulo CRM
 * Agrupa todas las rutas de CRM bajo /api/crm
 *
 * Rutas disponibles:
 * - /api/crm/pipeline/* - Gestión de etapas del pipeline
 * - /api/crm/leads/* - Gestión de leads (prospectos)
 * - /api/crm/oportunidades/* - Gestión de oportunidades
 * - /api/crm/actividades/* - Gestión de actividades
 */

// Pipeline de ventas
router.use('/pipeline', pipelineRoutes);

// Leads (prospectos)
router.use('/leads', leadsRoutes);

// Oportunidades
router.use('/oportunidades', oportunidadesRoutes);

// Actividades
router.use('/actividades', actividadesRoutes);

export default router;
