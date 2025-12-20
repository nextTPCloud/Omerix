import { Router } from 'express';
import { terminalesController } from './terminales.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { roleMiddleware } from '@/middleware/authorization.middleware';

const router = Router();

// Middleware de autenticación y tenant para todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Rutas de lectura (gerente, admin, superadmin)
const readRoles = roleMiddleware(['gerente', 'admin', 'superadmin']);

// Rutas de escritura (admin, superadmin)
const writeRoles = roleMiddleware(['admin', 'superadmin']);

// ============================================
// RUTAS PÚBLICAS (con permisos de lectura)
// ============================================

// Obtener lista de terminales
router.get('/', readRoles, (req, res) => terminalesController.getAll(req, res));

// Obtener terminales activos
router.get('/activos', readRoles, (req, res) => terminalesController.getActivos(req, res));

// Sugerir código
router.get('/sugerir-codigo', writeRoles, (req, res) => terminalesController.sugerirCodigo(req, res));

// Estado del scheduler de sincronización automática
router.get('/scheduler/status', readRoles, (req, res) => terminalesController.getSchedulerStatus(req, res));

// Obtener terminal por ID
router.get('/:id', readRoles, (req, res) => terminalesController.getById(req, res));

// Obtener historial de sincronizaciones
router.get('/:id/historial', readRoles, (req, res) => terminalesController.getHistorial(req, res));

// Obtener empleados sincronizados
router.get('/:id/empleados', readRoles, (req, res) => terminalesController.getEmpleados(req, res));

// ============================================
// RUTAS DE ESCRITURA
// ============================================

// Crear terminal
router.post('/', writeRoles, (req, res) => terminalesController.create(req, res));

// Actualizar terminal
router.put('/:id', writeRoles, (req, res) => terminalesController.update(req, res));

// Desactivar terminal
router.delete('/:id', writeRoles, (req, res) => terminalesController.delete(req, res));

// Eliminar permanentemente
router.delete('/:id/permanente', roleMiddleware(['superadmin']), (req, res) => terminalesController.deletePermanente(req, res));

// ============================================
// RUTAS DE SINCRONIZACIÓN
// ============================================

// Probar conexión
router.post('/:id/probar-conexion', writeRoles, (req, res) => terminalesController.probarConexion(req, res));

// Sincronizar empleados al terminal
router.post('/:id/sincronizar-empleados', writeRoles, (req, res) => terminalesController.sincronizarEmpleados(req, res));

// Sincronizar fichajes desde terminal
router.post('/:id/sincronizar', writeRoles, (req, res) => terminalesController.sincronizar(req, res));

export default router;
