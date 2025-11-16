# 🔄 Migración a Arquitectura Multi-Base de Datos

## 📋 Resumen de Cambios

Hemos implementado una arquitectura donde **cada empresa tiene su propia base de datos**, mientras que la base de datos principal contiene únicamente:
- Usuarios
- Empresas
- Licencias
- Planes
- Add-ons
- Pagos
- Métodos de pago

## ✅ Archivos Ya Actualizados

### 1. **Modelo Empresa** (`apps/backend/src/models/Empresa.ts`)
```typescript
// Ahora incluye:
databaseConfig: {
  host: string;
  port: number;
  name: string;
  user?: string;
  password?: string; // select: false
  uri?: string; // select: false
}
```

### 2. **Database Manager** (`apps/backend/src/services/database-manager.service.ts`)
- Servicio singleton para gestionar múltiples conexiones
- Cache de conexiones por empresa
- Métodos para crear/obtener/cerrar conexiones
- Generador automático de configuración DB
- Sistema de inicialización de nuevas DBs

### 3. **Config Database** (`apps/backend/src/config/database.ts`)
- Conexión principal registrada en DatabaseManager
- Cierre de todas las conexiones al terminar app

### 4. **Helper Modelos Dinámicos** (`apps/backend/src/utils/dynamic-models.helper.ts`)
- `getClienteModel(empresaId, dbConfig)` - Obtiene modelo de Cliente por empresa
- Preparado para añadir más modelos (Producto, Proveedor, etc.)

### 5. **Middleware Tenant** (`apps/backend/src/middleware/tenant.middleware.ts`)
- Carga `databaseConfig` de la empresa desde DB principal
- Adjunta `req.empresaDbConfig` para que los servicios lo usen
- Verifica estado de la empresa (activa/suspendida/cancelada)

### 6. **Types Express** (`apps/backend/src/types/express.d.ts`)
```typescript
interface Request {
  empresaDbConfig?: IDatabaseConfig; // ← NUEVO
}
```

### 7. **Servicio Clientes** (`apps/backend/src/modules/clientes/clientes.service.ts`)
- Todos los métodos actualizados para recibir `dbConfig`
- Ya NO filtran por `empresaId` (cada empresa tiene su propia DB)
- Usan `getClienteModel()` para obtener modelo dinámico

## 🔨 Archivos Pendientes de Actualizar

### 1. **Controlador de Clientes** (`apps/backend/src/modules/clientes/clientes.controller.ts`)

**Ejemplo de actualización:**

**ANTES:**
```typescript
async create(req: Request, res: Response) {
  const empresaId = new mongoose.Types.ObjectId(req.empresaId);
  const usuarioId = new mongoose.Types.ObjectId(req.userId);

  const cliente = await clientesService.crear(
    req.body,
    empresaId,
    usuarioId
  );
}
```

**DESPUÉS:**
```typescript
async create(req: Request, res: Response) {
  if (!req.empresaDbConfig) {
    return res.status(500).json({
      success: false,
      message: 'Configuración de base de datos no disponible',
    });
  }

  const empresaId = new mongoose.Types.ObjectId(req.empresaId);
  const usuarioId = new mongoose.Types.ObjectId(req.userId);

  const cliente = await clientesService.crear(
    req.body,
    empresaId,
    usuarioId,
    req.empresaDbConfig // ← AÑADIR ESTE PARÁMETRO
  );
}
```

**Actualizar TODOS los métodos del controlador** para pasar `req.empresaDbConfig` como último parámetro.

### 2. **Otros Servicios de Empresa**

Necesitas actualizar estos servicios siguiendo el mismo patrón que `clientes.service.ts`:

- `apps/backend/src/modules/productos/productos.service.ts`
- `apps/backend/src/modules/configuracion-usuario/configuracion-usuario.service.ts`
- `apps/backend/src/modules/vistasGuardadas/vistas-guardadas.service.ts`
- Cualquier otro servicio que maneje datos DE la empresa (no del sistema)

**Pasos para cada servicio:**
1. Crear getter en `dynamic-models.helper.ts`
2. Añadir parámetro `dbConfig: IDatabaseConfig` a todos los métodos
3. Usar `await getXxxModel(empresaId, dbConfig)` en lugar del modelo estático
4. Eliminar filtros por `empresaId` (ya no necesarios)
5. Actualizar controlador correspondiente para pasar `req.empresaDbConfig`

### 3. **Crear Empresa con DB Automática**

Cuando se cree una nueva empresa, debe generarse automáticamente su DB:

```typescript
// En el servicio/controlador de creación de empresa:
import { databaseManager } from '@/services/database-manager.service';

// Generar configuración de DB
const dbConfig = DatabaseManagerService.generateDatabaseConfig(
  empresaId,
  {
    host: process.env.MONGODB_HOST,
    port: parseInt(process.env.MONGODB_PORT || '27017'),
    user: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD,
  }
);

// Crear empresa con dbConfig
const nuevaEmpresa = await Empresa.create({
  ...empresaData,
  databaseConfig: dbConfig,
});

// Inicializar DB de la empresa
await databaseManager.initializeEmpresaDatabase(
  empresaId,
  dbConfig
);
```

## 🔄 Script de Migración de Datos Existentes

Si ya tienes datos en una base de datos multitenant (con `empresaId`), necesitas migrarlos:

**Archivo:** `apps/backend/src/scripts/migrateToMultiDB.ts`

```typescript
import mongoose from 'mongoose';
import Empresa from '../models/Empresa';
import { Cliente } from '../modules/clientes/Cliente';
import { databaseManager, DatabaseManagerService } from '../services/database-manager.service';
import { config } from '../config/env';
import { logger } from '../config/logger';

async function migrateToMultiDB() {
  try {
    // 1. Conectar a DB principal
    await mongoose.connect(config.database.uri);
    logger.info('✅ Conectado a DB principal');

    // 2. Obtener todas las empresas
    const empresas = await Empresa.find({});
    logger.info(`📊 Encontradas ${empresas.length} empresas`);

    for (const empresa of empresas) {
      logger.info(`\n🏢 Procesando empresa: ${empresa.nombre} (${empresa._id})`);

      // 3. Generar configuración de DB para esta empresa
      const dbConfig = DatabaseManagerService.generateDatabaseConfig(
        String(empresa._id),
        {
          host: process.env.MONGODB_HOST,
          port: parseInt(process.env.MONGODB_PORT || '27017'),
          user: process.env.MONGODB_USER,
          password: process.env.MONGODB_PASSWORD,
        }
      );

      // 4. Guardar dbConfig en la empresa
      empresa.databaseConfig = dbConfig;
      await empresa.save();
      logger.info(`💾 Configuración de DB guardada para ${empresa.nombre}`);

      // 5. Inicializar DB de la empresa
      await databaseManager.initializeEmpresaDatabase(
        String(empresa._id),
        dbConfig
      );

      // 6. Migrar clientes de esta empresa
      const clientesAntiguos = await Cliente.find({ empresaId: empresa._id });
      logger.info(`📦 Encontrados ${clientesAntiguos.length} clientes para migrar`);

      if (clientesAntiguos.length > 0) {
        const ClienteModel = await databaseManager.getModel(
          String(empresa._id),
          dbConfig,
          'Cliente',
          Cliente.schema
        );

        // Insertar en la nueva DB
        await ClienteModel.insertMany(clientesAntiguos);
        logger.info(`✅ ${clientesAntiguos.length} clientes migrados`);
      }

      // 7. Repetir para otros modelos (Productos, Vistas, etc.)
      // ... (similar al paso 6)
    }

    logger.info('\n\n🎉 ¡Migración completada!');
    logger.info('⚠️  IMPORTANTE: Verifica los datos antes de eliminar la DB antigua');

  } catch (error) {
    logger.error('❌ Error en migración:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    await databaseManager.closeAllEmpresaConnections();
  }
}

// Ejecutar
migrateToMultiDB()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## 📝 Checklist de Migración

### Código
- [x] Modelo Empresa actualizado con `databaseConfig`
- [x] DatabaseManager service creado
- [x] Config database actualizado
- [x] Helper de modelos dinámicos creado
- [x] Middleware tenant actualizado
- [x] Types Express actualizado
- [x] Servicio Clientes actualizado
- [ ] **Controlador Clientes actualizado** (pasar `req.empresaDbConfig`)
- [ ] **Otros servicios actualizados** (Productos, Vistas, etc.)
- [ ] **Otros controladores actualizados**
- [ ] **Creación de empresa con DB automática**

### Base de Datos
- [ ] **Ejecutar script de migración** de datos existentes
- [ ] **Verificar** que los datos se migraron correctamente
- [ ] **Backup** de la base de datos antigua
- [ ] **Eliminar** datos antiguos (opcional, después de verificar)

### Testing
- [ ] **Probar creación** de nuevos clientes
- [ ] **Probar lectura** de clientes migrados
- [ ] **Probar actualización** de clientes
- [ ] **Probar eliminación** de clientes
- [ ] **Probar** con múltiples empresas simultáneamente
- [ ] **Verificar** que cada empresa solo ve sus datos

## 🚀 Comandos

```bash
# Ejecutar migración de datos
npm run migrate:multidb

# (Añadir al package.json)
# "migrate:multidb": "ts-node apps/backend/src/scripts/migrateToMultiDB.ts"
```

## ⚠️ Consideraciones Importantes

### Seguridad
- Las contraseñas de DB están en `select: false` y no se devuelven en las API
- Cada empresa solo puede acceder a su propia DB
- El middleware valida el estado de la empresa (activa/suspendida)

### Performance
- Las conexiones se cachean por empresa
- Pool de conexiones configurado (min: 2, max: 10)
- Reconexión automática si se pierde la conexión

### Escalabilidad
- Cada empresa puede estar en un servidor MongoDB diferente
- Fácil migrar empresas grandes a servidores dedicados
- Backups independientes por empresa

### Índices
- **IMPORTANTE**: Los índices `{ empresaId: 1, ... }` YA NO son necesarios en los modelos de empresa
- Los nuevos índices deben ser sin `empresaId`:
  ```typescript
  // ANTES (multi-tenant):
  ClienteSchema.index({ empresaId: 1, codigo: 1 }, { unique: true });

  // DESPUÉS (multi-DB):
  ClienteSchema.index({ codigo: 1 }, { unique: true });
  ```

## 📊 Estructura Final

```
MongoDB Principal (omerix_main)
├── empresas
│   ├── _id: "60d5ec49f7b3b"
│   │   └── databaseConfig: { name: "omerix_empresa_60d5ec49f7b3b", ... }
│   └── _id: "60d5ec55f8c4c"
│       └── databaseConfig: { name: "omerix_empresa_60d5ec55f8c4c", ... }
├── usuarios
├── licencias
├── planes
└── pagos

MongoDB Empresa 1 (omerix_empresa_60d5ec49f7b3b)
├── clientes
├── productos
├── presupuestos
├── facturas
└── vistas_guardadas

MongoDB Empresa 2 (omerix_empresa_60d5ec55f8c4c)
├── clientes
├── productos
├── presupuestos
├── facturas
└── vistas_guardadas
```

## 🤝 Soporte

Si encuentras problemas durante la migración:
1. Revisa los logs del servidor
2. Verifica las conexiones activas: `databaseManager.getConnectionsInfo()`
3. Comprueba que `req.empresaDbConfig` existe en el middleware

---

**Fecha:** 2025-01-14
**Versión:** 1.0.0