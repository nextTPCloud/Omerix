// apps/backend/src/modules/dashboard/dashboard.controller.ts

import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { CATALOGO_WIDGETS } from './Dashboard';
import { asyncHandler } from '../../middleware/errorHandler.middleware';

/**
 * Obtener dashboard del usuario actual
 */
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const usuarioId = req.userId!;
  const rolCodigo = req.userRole || 'vendedor';
  const empresaId = req.empresaId!;
  const dbConfig = req.dbConfig!;

  const dashboard = await dashboardService.getDashboardUsuario(
    usuarioId,
    rolCodigo,
    empresaId,
    dbConfig
  );

  res.json({
    success: true,
    data: dashboard,
  });
});

/**
 * Actualizar dashboard
 */
export const updateDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const empresaId = req.empresaId!;
  const dbConfig = req.dbConfig!;

  const dashboard = await dashboardService.update(id, req.body, empresaId, dbConfig);

  res.json({
    success: true,
    data: dashboard,
  });
});

/**
 * Añadir widget al dashboard
 */
export const addWidget = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const empresaId = req.empresaId!;
  const dbConfig = req.dbConfig!;

  const dashboard = await dashboardService.addWidget(id, req.body, empresaId, dbConfig);

  res.json({
    success: true,
    data: dashboard,
  });
});

/**
 * Actualizar widget
 */
export const updateWidget = asyncHandler(async (req: Request, res: Response) => {
  const { id, widgetId } = req.params;
  const empresaId = req.empresaId!;
  const dbConfig = req.dbConfig!;

  const dashboard = await dashboardService.updateWidget(
    id,
    widgetId,
    req.body,
    empresaId,
    dbConfig
  );

  res.json({
    success: true,
    data: dashboard,
  });
});

/**
 * Eliminar widget
 */
export const removeWidget = asyncHandler(async (req: Request, res: Response) => {
  const { id, widgetId } = req.params;
  const empresaId = req.empresaId!;
  const dbConfig = req.dbConfig!;

  const dashboard = await dashboardService.removeWidget(id, widgetId, empresaId, dbConfig);

  res.json({
    success: true,
    data: dashboard,
  });
});

/**
 * Obtener datos de todos los widgets
 */
export const getWidgetsData = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const empresaId = req.empresaId!;
  const dbConfig = req.dbConfig!;

  const data = await dashboardService.getAllWidgetsData(id, empresaId, dbConfig);

  res.json({
    success: true,
    data,
  });
});

/**
 * Obtener datos de un widget específico
 */
export const getWidgetData = asyncHandler(async (req: Request, res: Response) => {
  const { id, widgetId } = req.params;
  const empresaId = req.empresaId!;
  const dbConfig = req.dbConfig!;

  // Obtener dashboard y widget
  const dashboard = await dashboardService.getDashboardUsuario(
    req.userId!,
    req.userRole || 'vendedor',
    empresaId,
    dbConfig
  );

  const widget = dashboard.widgets.find((w) => w.id === widgetId);
  if (!widget) {
    return res.status(404).json({
      success: false,
      message: 'Widget no encontrado',
    });
  }

  const data = await dashboardService.getWidgetData(widget, empresaId, dbConfig);

  res.json({
    success: true,
    data,
  });
});

/**
 * Obtener catálogo de widgets disponibles
 */
export const getCatalogo = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Obtener permisos reales del usuario desde la BD
  // Por ahora se devuelve el catálogo completo

  // Por ahora devolver todo el catálogo
  const catalogo = CATALOGO_WIDGETS;

  // Agrupar por categoría
  const porCategoria: Record<string, any[]> = {};
  for (const [tipo, config] of Object.entries(catalogo)) {
    const categoria = config.categoria;
    if (!porCategoria[categoria]) {
      porCategoria[categoria] = [];
    }
    porCategoria[categoria].push({
      tipo,
      ...config,
    });
  }

  res.json({
    success: true,
    data: {
      catalogo,
      porCategoria,
    },
  });
});

/**
 * Restablecer dashboard a valores por defecto
 */
export const resetDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const rolCodigo = req.userRole || 'vendedor';
  const empresaId = req.empresaId!;
  const dbConfig = req.dbConfig!;

  const dashboard = await dashboardService.resetToDefault(id, rolCodigo, empresaId, dbConfig);

  res.json({
    success: true,
    data: dashboard,
  });
});
