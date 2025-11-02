# 📋 Sistema de Logs - Omerix ERP

Sistema completo de auditoría, monitoreo y logs fiscales con cumplimiento normativo español (Ley 11/2021, TicketBAI, Verifactu).

## 🎯 Características

### ✅ Audit Logs (Logs de Auditoría)
- Trazabilidad completa de todas las operaciones de usuarios
- Registro de cambios (antes/después)
- Filtrado por usuario, módulo, acción, fecha
- Exportación a CSV y JSON
- Estadísticas y actividad de usuarios
- Retención: **2 años** por defecto

### ✅ System Logs (Logs de Sistema)
- Monitoreo técnico de errores
- Health checks del sistema
- Logs por nivel (info, warn, error, fatal, debug)
- Integración con Winston
- TTL automático: **90 días**
- Rotación diaria de archivos

### ✅ Fiscal Logs (Logs Fiscales) 🔐
- **INMUTABLES** - No se pueden modificar ni eliminar
- **Blockchain** - Cada documento referencia al anterior (hash chain)
- Firma digital SHA-256
- Cumplimiento TicketBAI (País Vasco)
- Cumplimiento Verifactu (Nacional)
- Retención: **Mínimo 4 años** (legal)
- Verificación de integridad de cadena

---

## 📦 Instalación

### 1. Dependencias instaladas

Ya instaladas en el proyecto:
```bash
npm install winston winston-daily-rotate-file
```

### 2. Variables de entorno

Añade a tu `.env`:

```env
# Firma digital de documentos fiscales
SIGNATURE_SECRET=tu-secreto-super-seguro-cambiar-en-produccion

# Políticas de retención (opcional, hay valores por defecto)
AUDIT_LOG_RETENTION_DAYS=730
SYSTEM_LOG_RETENTION_DAYS=90
FISCAL_LOG_RETENTION_DAYS=1460
```

### 3. Crear carpeta de logs

```bash
mkdir logs
```

Añade a `.gitignore`:
```
logs/
*.log
```

---

## 🚀 Uso

### API Endpoints

#### **Audit Logs**

```bash
# Listar logs de auditoría
GET /api/logs/audit
  ?page=1
  &limit=20
  &accion=USER_CREATE
  &modulo=users
  &resultado=exito
  &fechaDesde=2025-01-01
  &fechaHasta=2025-12-31

# Mis logs
GET /api/logs/audit/me

# Logs de una entidad
GET /api/logs/audit/entity/Usuario/507f1f77bcf86cd799439011

# Logs de un usuario
GET /api/logs/audit/user/507f1f77bcf86cd799439011

# Estadísticas
GET /api/logs/audit/stats?fechaDesde=2025-01-01&fechaHasta=2025-12-31

# Actividad de usuarios
GET /api/logs/audit/activity?fechaDesde=2025-01-01&fechaHasta=2025-12-31

# Exportar
GET /api/logs/audit/export?format=csv
```

#### **System Logs**

```bash
# Health check
GET /api/logs/system/health

# Resumen de salud completo
GET /api/logs/system/health/summary

# Listar logs de sistema
GET /api/logs/system?nivel=error&page=1&limit=20

# Errores recientes
GET /api/logs/system/errors/recent?minutosAtras=60

# Estadísticas de errores
GET /api/logs/system/stats/errors?horasAtras=24

# Estadísticas por módulo
GET /api/logs/system/stats/modules

# Estadísticas de retención
GET /api/logs/system/retention/stats

# Limpieza manual (solo admin)
POST /api/logs/system/retention/cleanup
```

---

## 💻 Uso Programático

### Crear Audit Logs manualmente

```typescript
import auditLogService from './modules/logs/services/audit-log.service';
import { LogAction, LogModule, LogResult } from './modules/logs/interfaces/log.interface';

// Desde un controller con request
await auditLogService.createFromRequest(
  req,
  LogAction.PRODUCT_CREATE,
  LogModule.PRODUCTS,
  'Producto creado exitosamente',
  {
    entidadTipo: 'Producto',
    entidadId: producto._id,
    datosNuevos: producto,
  }
);

// Log de login exitoso
await auditLogService.logLogin(userId, empresaId, ip, userAgent);

// Log de login fallido
await auditLogService.logLoginFailed(email, ip, 'Contraseña incorrecta', userAgent);

// Log genérico
await auditLogService.create({
  empresaId: '507f1f77bcf86cd799439011',
  usuarioId: '507f1f77bcf86cd799439011',
  accion: LogAction.USER_CREATE,
  modulo: LogModule.USERS,
  descripcion: 'Usuario creado',
  ip: '192.168.1.1',
  resultado: LogResult.SUCCESS,
});
```

### Crear System Logs

```typescript
import systemLogService from './modules/logs/services/system-log.service';
import { LogLevel, LogModule } from './modules/logs/interfaces/log.interface';

// Log de información
await systemLogService.logInfo('Operación completada', LogModule.PRODUCTS);

// Log de error
await systemLogService.logError(
  'Error en base de datos',
  LogModule.SYSTEM,
  error,
  { query: 'SELECT ...' }
);

// Log de advertencia
await systemLogService.logWarn('Timeout en API externa', LogModule.SYSTEM);

// Log de error fatal
await systemLogService.logFatal('Error crítico', LogModule.SYSTEM, error);

// Log de llamada a API externa
await systemLogService.logExternalAPICall(
  'Stripe',
  '/charges',
  true,
  150
);
```

### Crear Fiscal Logs (con blockchain)

```typescript
import fiscalLogService from './modules/logs/services/fiscal-log.service';

// Crear log fiscal simple
const log = await fiscalLogService.create({
  empresaId: '507f1f77bcf86cd799439011',
  usuarioId: '507f1f77bcf86cd799439011',
  documentoTipo: 'factura',
  documentoId: factura._id,
  numeroDocumento: 'FAC-2025-001',
  serie: 'A',
  importe: 100.00,
  iva: 21.00,
  total: 121.00,
});

// Con TicketBAI (País Vasco)
const logTicketBAI = await fiscalLogService.createWithTicketBAI(
  logData,
  'B12345678' // NIF empresa
);

// Con Verifactu (Nacional)
const logVerifactu = await fiscalLogService.createWithVerifactu(
  logData,
  'B12345678' // NIF empresa
);

// Verificar integridad de un documento
const verificacion = await fiscalLogService.verificarDocumento(log._id);
console.log(verificacion.isValid); // true/false

// Verificar toda la cadena blockchain
const cadena = await fiscalLogService.verificarCadena(empresaId);
console.log(cadena.isValid); // true/false
console.log(cadena.totalLogs); // Número de documentos verificados

// Exportar para auditoría
const exportacion = await fiscalLogService.exportarParaAuditoria(
  empresaId,
  new Date('2025-01-01'),
  new Date('2025-12-31')
);
```

---

## 🔧 Middleware de Captura Automática

El sistema captura **automáticamente** todas las operaciones HTTP:

### Captura automática activada en `server.ts`:

```typescript
import { logCaptureMiddleware } from './modules/logs/middleware/log-capture.middleware';

// Después de las rutas
app.use(logCaptureMiddleware);
```

### Middleware específicos para rutas:

```typescript
import { forceAuditLog, captureBeforeData, logAfterSuccess } from './modules/logs/middleware/log-capture.middleware';

// Forzar log de auditoría
router.post('/ruta', 
  forceAuditLog(LogAction.USER_CREATE, LogModule.USERS),
  controller
);

// Capturar datos antes/después de actualizar
router.put('/user/:id',
  captureBeforeData('Usuario', req => req.params.id),
  logAfterSuccess(LogAction.USER_UPDATE, LogModule.USERS),
  controller
);
```

---

## 🧹 Limpieza Automática

### Políticas de retención:

| Tipo de Log | Retención | Método |
|-------------|-----------|--------|
| Audit Logs | 2 años (730 días) | Manual/Programada |
| System Logs | 90 días | TTL MongoDB (automático) |
| Fiscal Logs | 4+ años | **NO SE ELIMINAN** |

### Ejecutar limpieza manual:

```typescript
import logRetentionService from './modules/logs/services/log-retention.service';

// Limpieza completa
const stats = await logRetentionService.cleanOldLogs();
console.log(stats);
// {
//   auditLogsDeleted: 1234,
//   systemLogsDeleted: 0, // TTL automático
//   fiscalLogsRetained: 5678,
//   lastRun: Date
// }

// Verificar logs próximos a expirar
const expiring = await logRetentionService.checkExpiringLogs(30); // 30 días antes

// Recomendaciones de limpieza
const recommendations = await logRetentionService.getCleanupRecommendations();
```

### Programar limpieza con cron job:

Puedes crear un cron job que ejecute la limpieza automáticamente:

```typescript
// Ejemplo con node-cron
import cron from 'node-cron';
import logRetentionService from './modules/logs/services/log-retention.service';

// Ejecutar todos los días a las 3:00 AM
cron.schedule('0 3 * * *', async () => {
  console.log('🧹 Ejecutando limpieza programada de logs...');
  const stats = await logRetentionService.scheduledCleanup();
  console.log('✅ Limpieza completada:', stats);
});
```

---

## 📊 Monitoreo y Health Checks

### Health check básico:

```bash
GET /api/logs/system/health

# Respuesta:
{
  "success": true,
  "data": {
    "status": "healthy", // healthy | warning | critical
    "erroresRecientes": 2,
    "warningsRecientes": 5,
    "totalLogs": 150,
    "timestamp": "2025-10-20T20:00:00.000Z"
  }
}
```

### Integrar con tu monitoreo:

```typescript
import systemLogService from './modules/logs/services/system-log.service';

// En tu endpoint de health check
const health = await systemLogService.checkSystemHealth();

if (health.status === 'critical') {
  // Enviar alerta
  notificarEquipo('Sistema en estado crítico');
}
```

---

## 🔐 Seguridad y Cumplimiento

### Inmutabilidad de Logs Fiscales

Los logs fiscales están protegidos a nivel de código y base de datos:

```typescript
// ❌ ESTO FALLARÁ (protegido por middleware)
await FiscalLog.findByIdAndUpdate(id, { total: 999 });
// Error: Los logs fiscales son INMUTABLES

// ❌ ESTO TAMBIÉN FALLARÁ
await FiscalLog.findByIdAndDelete(id);
// Error: Los logs fiscales no pueden eliminarse
```

### Verificación de Integridad

```typescript
// Verificar un documento específico
const result = await fiscalLogService.verificarDocumento(documentoId);

if (!result.isValid) {
  console.error('🚨 ALERTA: Documento alterado');
  console.error(result.message);
  // Tomar acciones correctivas
}

// Verificar toda la cadena (recomendado cada noche)
const cadena = await fiscalLogService.verificarCadena(empresaId);

if (!cadena.isValid) {
  console.error('🚨 ALERTA CRÍTICA: Cadena blockchain rota');
  console.error(`Rota en documento ${cadena.brokenAt}: ${cadena.brokenLog}`);
  // Notificar urgentemente
}
```

---

## 📚 Documentación API (Swagger)

Toda la API está documentada en Swagger:

```
http://localhost:5000/api-docs
```

Secciones disponibles:
- **Audit Logs** - 15 endpoints documentados
- **System Logs** - 15 endpoints documentados
- **Fiscal Logs** - (Próximamente, al integrar con ventas)

---

## 🧪 Testing

### Probar Audit Logs:

```bash
# Registrar un usuario (auto-genera log)
POST http://localhost:5000/api/auth/register

# Ver mis logs
GET http://localhost:5000/api/logs/audit/me
Authorization: Bearer <token>

# Ver estadísticas
GET http://localhost:5000/api/logs/audit/stats?fechaDesde=2025-01-01&fechaHasta=2025-12-31
Authorization: Bearer <token>
```

### Probar System Logs:

```bash
# Health check
GET http://localhost:5000/api/logs/system/health
Authorization: Bearer <token>

# Ver errores recientes
GET http://localhost:5000/api/logs/system/errors/recent
Authorization: Bearer <token>
```

---

## 🎓 Ejemplos Prácticos

### Ejemplo 1: Auditar cambio de contraseña

```typescript
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    // Cambiar contraseña
    await user.changePassword(req.body.newPassword);

    // Log automático (por logCaptureMiddleware)
    // O manual si quieres más control:
    await auditLogService.createFromRequest(
      req,
      LogAction.PASSWORD_CHANGE,
      LogModule.AUTH,
      'Contraseña cambiada exitosamente'
    );

    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});
```

### Ejemplo 2: Crear factura con log fiscal

```typescript
router.post('/facturas', authMiddleware, async (req, res) => {
  try {
    // 1. Crear factura
    const factura = await Factura.create(req.body);

    // 2. Crear log fiscal (OBLIGATORIO)
    const fiscalLog = await fiscalLogService.createWithVerifactu({
      empresaId: req.empresaId,
      usuarioId: req.userId,
      documentoTipo: 'factura',
      documentoId: factura._id,
      numeroDocumento: factura.numero,
      serie: factura.serie,
      importe: factura.base,
      iva: factura.iva,
      total: factura.total,
    }, req.empresa.nif);

    // 3. Guardar referencia en factura
    factura.fiscalLogId = fiscalLog._id;
    await factura.save();

    res.status(201).json({
      success: true,
      data: factura,
      fiscalLog: fiscalLog,
    });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});
```

---

## 🐛 Troubleshooting

### Problema: Logs no se crean automáticamente

**Solución:** Verifica que el middleware esté instalado después de las rutas:

```typescript
// ✅ CORRECTO
app.use('/api/auth', authRoutes);
app.use(logCaptureMiddleware);

// ❌ INCORRECTO
app.use(logCaptureMiddleware);
app.use('/api/auth', authRoutes);
```

### Problema: Error "Cannot read property 'empresaId' of undefined"

**Solución:** Asegúrate que `authMiddleware` y `tenantMiddleware` estén antes de los logs:

```typescript
router.use(authMiddleware);
router.use(tenantMiddleware);
// Ahora req.empresaId y req.userId están disponibles
```

### Problema: Archivos de log muy grandes

**Solución:** Los archivos se rotan automáticamente. Para limpiar manualmente:

```bash
# Eliminar logs de Winston antiguos
rm logs/*.log.gz
rm logs/*-old-*.log
```

---

## 📈 Mejores Prácticas

1. ✅ **Siempre crear log fiscal** al emitir documentos fiscales
2. ✅ **Verificar cadena blockchain** periódicamente (diariamente)
3. ✅ **Monitorear health checks** en producción
4. ✅ **Exportar logs fiscales** antes de cambios de sistema
5. ✅ **No modificar** la configuración de inmutabilidad
6. ✅ **Hacer backup** de logs fiscales regularmente
7. ✅ **Revisar estadísticas** de errores semanalmente

---

## 📞 Soporte

Para problemas o dudas:
- Email: soporte@omerix.com
- Documentación: https://docs.omerix.com
- Issues: https://github.com/omerix/erp/issues

---

## 📜 Licencia

MIT License - Omerix ERP © 2025