// ===========================================
// TPV OMERIX - BACKEND LOCAL
// ===========================================

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.TPV_PORT || 3011;
const MONGODB_URI = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/omerix-tpv';

// Middleware
app.use(cors());
app.use(express.json());

// Estado de conexión
let mongoConnected = false;
let cloudConnected = false;

// Conexión a MongoDB local
async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    mongoConnected = true;
    console.log('✅ Conectado a MongoDB local');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    mongoConnected = false;
    // Reintentar en 5 segundos
    setTimeout(connectMongoDB, 5000);
  }
}

// Verificar conexión a cloud
async function checkCloudConnection() {
  try {
    const response = await fetch(process.env.CLOUD_API_URL + '/health');
    cloudConnected = response.ok;
  } catch {
    cloudConnected = false;
  }
}

// ===========================================
// RUTAS
// ===========================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoConnected,
    cloud: cloudConnected,
    timestamp: new Date().toISOString(),
  });
});

// Estado de sincronización
app.get('/sync/status', async (req, res) => {
  // TODO: Implementar estado de sincronización
  res.json({
    online: cloudConnected,
    ultimaSync: null,
    pendientes: 0,
    errores: 0,
  });
});

// ===========================================
// RUTAS DE VENTAS
// ===========================================

// TODO: Implementar rutas de ventas
// POST /ventas - Crear venta
// GET /ventas - Listar ventas
// GET /ventas/:id - Obtener venta
// POST /ventas/:id/anular - Anular venta
// POST /ventas/:id/ticket - Reimprimir ticket

// ===========================================
// RUTAS DE CAJA
// ===========================================

// TODO: Implementar rutas de caja
// GET /caja - Estado actual de la caja
// POST /caja/abrir - Abrir caja
// POST /caja/cerrar - Cerrar caja
// POST /caja/movimiento - Registrar movimiento
// GET /caja/movimientos - Listar movimientos

// ===========================================
// RUTAS DE PRODUCTOS
// ===========================================

// TODO: Implementar rutas de productos
// GET /productos - Listar productos
// GET /productos/:codigo - Buscar por código/barras
// GET /productos/stock/:almacenId - Stock por almacén

// ===========================================
// RUTAS DE PERIFÉRICOS
// ===========================================

// TODO: Implementar rutas de periféricos
// GET /perifericos/status - Estado de periféricos
// POST /perifericos/impresora/test - Test de impresora
// POST /perifericos/cajon/abrir - Abrir cajón
// POST /perifericos/visor/mensaje - Mostrar mensaje en visor
// GET /perifericos/bascula/peso - Obtener peso de báscula

// ===========================================
// INICIAR SERVIDOR
// ===========================================

async function start() {
  await connectMongoDB();

  // Verificar conexión cloud periódicamente
  setInterval(checkCloudConnection, 30000);
  checkCloudConnection();

  app.listen(PORT, () => {
    console.log(`🚀 TPV Backend corriendo en http://localhost:${PORT}`);
  });
}

start();
