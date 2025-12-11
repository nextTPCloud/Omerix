// backend/src/server.ts

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/database';
import { swaggerSpec, serveSwaggerJSON } from './config/swagger';
import Empresa from './models/Empresa';

// Importar rutas
import authRoutes from './modules/auth/auth.routes';
import logsRoutes from './modules/logs/logs.routes'; // 🆕 NUEVO
import licenciasRoutes from './modules/licencias/licencias.routes';
import pagosRoutes from './modules/pagos/pagos.routes'; // ← AÑADIR
import adminRoutes from './modules/admin/admin.routes'; // 🆕 Panel de administración

// Importar rutas de operatividad
import clientesRoutes from './modules/clientes/clientes.routes';
import productosRoutes from './modules/productos/productos.routes';
import familiasRoutes from './modules/familias/familias.routes';
import tiposImpuestoRoutes from './modules/tipos-impuesto/tipos-impuesto.routes';
import almacenesRoutes from './modules/almacenes/almacenes.routes';
import configuracionUsuarioRoutes from './modules/configuracion-usuario/configuracion-usuario.routes';
import vistas from './modules/vistasGuardadas/vistas-guardadas.routes';
import exportRoutes from './modules/export/export.routes';
import estadosRoutes from './modules/estados/estados.routes';
import situacionesRoutes from './modules/situaciones/situaciones.routes';
import clasificacionesRoutes from './modules/clasificaciones/clasificaciones.routes';

// Importar rutas de restauración/TPV
import variantesRoutes from './modules/variantes/variantes.routes';
import impresorasRoutes from './modules/impresoras/impresoras.routes';
import zonasPreparacionRoutes from './modules/zonas-preparacion/zonas-preparacion.routes';
import modificadoresRoutes from './modules/modificadores/modificadores.routes';
import gruposModificadoresRoutes from './modules/grupos-modificadores/grupos-modificadores.routes';
import alergenosRoutes from './modules/alergenos/alergenos.routes';
import terminosPagoRoutes from './modules/terminos-pago/terminos-pago.routes';
import formasPagoRoutes from './modules/formas-pago/formas-pago.routes';
import vencimientosRoutes from './modules/tesoreria/vencimientos.routes';

// Importar rutas de RRHH y comercial
import agentesRoutes from './modules/agentes-comerciales/agentes-comerciales.routes';
import personalRoutes from './modules/personal/personal.routes';

// Importar rutas de proyectos y presupuestos
import proyectosRoutes from './modules/proyectos/proyectos.routes';
import presupuestosRoutes from './modules/presupuestos/presupuestos.routes';
import plantillasPresupuestoRoutes from './modules/presupuestos/plantillas-presupuesto.routes';
import portalClienteRoutes from './modules/presupuestos/portal-cliente.routes';

// Importar rutas de pedidos
import pedidosRoutes from './modules/pedidos/pedidos.routes';

// Importar rutas de albaranes
import albaranesRoutes from './modules/albaranes/albaranes.routes';

// Importar rutas de facturas
import facturasRoutes from './modules/facturas/facturas.routes';

// Importar rutas de series de documentos
import seriesDocumentosRoutes from './modules/series-documentos/series-documentos.routes';

// Importar rutas de empresa
import empresaRoutes from './modules/empresa/empresa.routes';

// Importar rutas de certificados electrónicos
import certificadosRoutes from './modules/certificados/certificados.routes';

// Importar rutas de VeriFactu (AEAT)
import verifactuRoutes from './modules/verifactu/verifactu.routes';

// Importar rutas de IA
import aiRoutes from './modules/ai/ai.routes';

// Importar rutas de proveedores
import proveedoresRoutes from './modules/proveedores/proveedores.routes';

// Importar rutas de compras
import pedidosCompraRoutes from './modules/pedidos-compra/pedidos-compra.routes';
import albaranesCompraRoutes from './modules/albaranes-compra/albaranes-compra.routes';
import facturasCompraRoutes from './modules/facturas-compra/facturas-compra.routes';

// Importar middlewares de logs
import { logCaptureMiddleware } from './modules/logs/middleware/log-capture.middleware'; // 🆕 NUEVO
import logger, { httpLoggerMiddleware, logStartup, logShutdown } from './utils/logger/winston.config'; // 🆕 NUEVO
import config from './config/env';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';

// Cargar variables de entorno
dotenv.config();

const app: Express = express();
const PORT = config.port;

// ============================================
// MIDDLEWARES BÁSICOS
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(generalLimiter);

// ============================================
// MIDDLEWARE DE LOGGING HTTP (WINSTON)
// ============================================
// 🆕 NUEVO: Logging HTTP con Winston
app.use(httpLoggerMiddleware);

// ============================================
// SWAGGER DOCUMENTATION
// ============================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Omerix ERP API Docs',
}));

// Endpoint para obtener el JSON de Swagger
app.get('/api-docs.json', serveSwaggerJSON);

// ============================================
// RUTAS BÁSICAS
// ============================================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check del servidor
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Backend Omerix funcionando correctamente
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend Omerix funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test de conexión a MongoDB
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Conexión exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 empresasEnDB:
 *                   type: number
 *                 timestamp:
 *                   type: string
 */
app.get('/api/test', async (req: Request, res: Response) => {
  try {
    const count = await Empresa.countDocuments();
    
    res.json({
      success: true,
      message: '✅ Conexión a MongoDB exitosa',
      empresasEnDB: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error conectando a MongoDB',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/test:
 *   post:
 *     summary: Crear empresa de prueba
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               nif:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Empresa creada
 */
app.post('/api/test', async (req: Request, res: Response) => {
  try {
    const empresa = await Empresa.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Empresa creada exitosamente',
      data: empresa,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creando empresa',
      error: error.message,
    });
  }
});

// ============================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ============================================

// Portal de cliente - acceso público mediante token
app.use('/api/portal', portalClienteRoutes);

// ============================================
// RUTAS DE LA API
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // 🆕 Panel de administración (requiere superadmin)
app.use('/api/licencias', licenciasRoutes); // ← AÑADIR
app.use('/api/logs', logsRoutes); // 🆕 NUEVO: Rutas de logs
app.use('/api/clientes', clientesRoutes); // ← AÑADIR
app.use('/api/productos', productosRoutes);
app.use('/api/familias', familiasRoutes);
app.use('/api/tipos-impuesto', tiposImpuestoRoutes);
app.use('/api/almacenes', almacenesRoutes);
app.use('/api/pagos', pagosRoutes); // ← AÑADIR
app.use('/api/configuraciones', configuracionUsuarioRoutes);
app.use('/api/vistas-guardadas',vistas)
app.use('/api/export', exportRoutes)
app.use('/api/estados', estadosRoutes);
app.use('/api/situaciones', situacionesRoutes);
app.use('/api/clasificaciones', clasificacionesRoutes);

// Rutas de restauración/TPV
app.use('/api/variantes', variantesRoutes);
app.use('/api/impresoras', impresorasRoutes);
app.use('/api/zonas-preparacion', zonasPreparacionRoutes);
app.use('/api/modificadores', modificadoresRoutes);
app.use('/api/grupos-modificadores', gruposModificadoresRoutes);
app.use('/api/alergenos', alergenosRoutes);
app.use('/api/terminos-pago', terminosPagoRoutes);
app.use('/api/formas-pago', formasPagoRoutes);

// Rutas de tesorería
app.use('/api/vencimientos', vencimientosRoutes);

// Rutas de RRHH y comercial
app.use('/api/agentes-comerciales', agentesRoutes);
app.use('/api/personal', personalRoutes);

// Rutas de proyectos y presupuestos
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/presupuestos', presupuestosRoutes);
app.use('/api/plantillas-presupuesto', plantillasPresupuestoRoutes);

// Rutas de pedidos
app.use('/api/pedidos', pedidosRoutes);

// Rutas de albaranes
app.use('/api/albaranes', albaranesRoutes);

// Rutas de facturas
app.use('/api/facturas', facturasRoutes);

// Rutas de proveedores
app.use('/api/proveedores', proveedoresRoutes);

// Rutas de compras
app.use('/api/pedidos-compra', pedidosCompraRoutes);
app.use('/api/albaranes-compra', albaranesCompraRoutes);
app.use('/api/facturas-compra', facturasCompraRoutes);

// Rutas de series de documentos
app.use('/api/series-documentos', seriesDocumentosRoutes);

// Rutas de empresa (configuración, email, etc.)
app.use('/api/empresa', empresaRoutes);

// Rutas de certificados electrónicos
app.use('/api/certificados', certificadosRoutes);

// Rutas de VeriFactu (comunicación con AEAT)
app.use('/api/verifactu', verifactuRoutes);

// Rutas de IA
app.use('/api/ai', aiRoutes);

// ============================================
// MIDDLEWARE DE CAPTURA AUTOMÁTICA DE LOGS
// ============================================
// 🆕 NUEVO: Este middleware debe ir DESPUÉS de las rutas
// Captura automáticamente todas las operaciones
app.use(logCaptureMiddleware);

// ============================================
// RUTA 404
// ============================================
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
  });
});

// Manejo de errores 404
app.use(notFoundHandler);

// Manejo global de errores
app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================
const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();
    
    // Iniciar servidor Express
    app.listen(PORT, () => {
      const environment = process.env.NODE_ENV || 'development';
      
      logger.info(`🚀 Servidor backend corriendo en puerto ${PORT}`);
      logger.info(`📍 URL: http://localhost:${PORT}`);
      logger.info(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      logger.info(`📋 Logs API: http://localhost:${PORT}/api/logs`); // 🆕 NUEVO
      logger.info(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
      logger.info(`🌍 Entorno: ${environment}\n`);
      
      // 🆕 NUEVO: Log de inicio con Winston
      logStartup(Number(PORT), environment);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// ============================================
// MANEJO DE CIERRE GRACEFUL
// ============================================
// 🆕 NUEVO: Manejo de cierre del servidor
process.on('SIGINT', async () => {
  console.log('\n⏸️  Señal SIGINT recibida: cerrando servidor...');
  logShutdown('SIGINT signal received');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏸️  Señal SIGTERM recibida: cerrando servidor...');
  logShutdown('SIGTERM signal received');
  process.exit(0);
});

startServer();