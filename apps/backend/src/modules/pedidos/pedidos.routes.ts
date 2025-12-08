import { Router } from 'express';
import { pedidosController } from './pedidos.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Pedidos
 *   description: Gestión de pedidos de venta
 */

// ============================================
// RUTAS ESPECIALES (antes de :id)
// ============================================

/**
 * @swagger
 * /api/pedidos/sugerir-codigo:
 *   get:
 *     summary: Obtener el siguiente código de pedido sugerido
 *     tags: [Pedidos]
 */
router.get('/sugerir-codigo', pedidosController.sugerirCodigo.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de pedidos
 *     tags: [Pedidos]
 */
router.get('/estadisticas', pedidosController.obtenerEstadisticas.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/alertas:
 *   get:
 *     summary: Obtener alertas de pedidos (retrasados, pendientes, etc.)
 *     tags: [Pedidos]
 */
router.get('/alertas', pedidosController.getAlertas.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/alertas/resumen:
 *   get:
 *     summary: Obtener resumen de alertas (solo contadores)
 *     tags: [Pedidos]
 */
router.get('/alertas/resumen', pedidosController.getResumenAlertas.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/kpis:
 *   get:
 *     summary: Obtener KPIs del dashboard de pedidos
 *     tags: [Pedidos]
 */
router.get('/kpis', pedidosController.getKPIs.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/cliente/{clienteId}:
 *   get:
 *     summary: Obtener pedidos de un cliente
 *     tags: [Pedidos]
 */
router.get('/cliente/:clienteId', pedidosController.obtenerPorCliente.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/proyecto/{proyectoId}:
 *   get:
 *     summary: Obtener pedidos de un proyecto
 *     tags: [Pedidos]
 */
router.get('/proyecto/:proyectoId', pedidosController.obtenerPorProyecto.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/desde-presupuesto/{presupuestoId}:
 *   post:
 *     summary: Crear pedido desde un presupuesto
 *     tags: [Pedidos]
 */
router.post('/desde-presupuesto/:presupuestoId', pedidosController.crearDesdePresupuesto.bind(pedidosController));

// ============================================
// RUTAS CRUD PRINCIPALES
// ============================================

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Obtener todos los pedidos
 *     tags: [Pedidos]
 */
router.get('/', pedidosController.obtenerTodos.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos:
 *   post:
 *     summary: Crear un nuevo pedido
 *     tags: [Pedidos]
 */
router.post('/', pedidosController.crear.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples pedidos
 *     tags: [Pedidos]
 */
router.post('/bulk-delete', pedidosController.eliminarVarios.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/{id}:
 *   get:
 *     summary: Obtener un pedido por ID
 *     tags: [Pedidos]
 */
router.get('/:id', pedidosController.obtenerPorId.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/{id}:
 *   put:
 *     summary: Actualizar un pedido
 *     tags: [Pedidos]
 */
router.put('/:id', pedidosController.actualizar.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/{id}:
 *   delete:
 *     summary: Eliminar un pedido
 *     tags: [Pedidos]
 */
router.delete('/:id', pedidosController.eliminar.bind(pedidosController));

// ============================================
// ACCIONES SOBRE PEDIDO
// ============================================

/**
 * @swagger
 * /api/pedidos/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de un pedido
 *     tags: [Pedidos]
 */
router.patch('/:id/estado', pedidosController.cambiarEstado.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/{id}/duplicar:
 *   post:
 *     summary: Duplicar un pedido
 *     tags: [Pedidos]
 */
router.post('/:id/duplicar', pedidosController.duplicar.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/{id}/aplicar-margen:
 *   post:
 *     summary: Aplicar margen a las líneas del pedido
 *     tags: [Pedidos]
 */
router.post('/:id/aplicar-margen', pedidosController.aplicarMargen.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/{id}/importar-lineas:
 *   post:
 *     summary: Importar líneas de otro documento o productos
 *     tags: [Pedidos]
 */
router.post('/:id/importar-lineas', pedidosController.importarLineas.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/{id}/toggle-costes:
 *   patch:
 *     summary: Activar/desactivar visibilidad de costes
 *     tags: [Pedidos]
 */
router.patch('/:id/toggle-costes', pedidosController.toggleMostrarCostes.bind(pedidosController));

// ============================================
// COMUNICACIÓN
// ============================================

/**
 * @swagger
 * /api/pedidos/{id}/enviar-email:
 *   post:
 *     summary: Enviar pedido por email
 *     tags: [Pedidos]
 */
router.post('/:id/enviar-email', pedidosController.enviarPorEmail.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/{id}/whatsapp:
 *   get:
 *     summary: Generar URL de WhatsApp para el pedido
 *     tags: [Pedidos]
 */
router.get('/:id/whatsapp', pedidosController.generarURLWhatsApp.bind(pedidosController));

// ============================================
// NOTAS DE SEGUIMIENTO
// ============================================

/**
 * @swagger
 * /api/pedidos/{id}/notas:
 *   post:
 *     summary: Añadir nota de seguimiento
 *     tags: [Pedidos]
 */
router.post('/:id/notas', pedidosController.addNotaSeguimiento.bind(pedidosController));

/**
 * @swagger
 * /api/pedidos/{id}/notas/{notaId}:
 *   delete:
 *     summary: Eliminar nota de seguimiento
 *     tags: [Pedidos]
 */
router.delete('/:id/notas/:notaId', pedidosController.deleteNotaSeguimiento.bind(pedidosController));

export default router;
