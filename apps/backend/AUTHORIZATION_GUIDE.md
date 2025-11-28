# Guía de Sistema de Autorización Robusto - Omerix ERP

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Principales](#componentes-principales)
4. [Implementación en Rutas](#implementación-en-rutas)
5. [Implementación en Controladores](#implementación-en-controladores)
6. [Roles y Permisos](#roles-y-permisos)
7. [Mejores Prácticas](#mejores-prácticas)
8. [Protecciones de Seguridad](#protecciones-de-seguridad)

---

## 🎯 Introducción

Este sistema de autorización implementa **múltiples capas de seguridad** para proteger los recursos del ERP:

1. **Autenticación**: Verificar identidad del usuario
2. **Autorización por Roles**: Verificar permisos según rol
3. **Ownership Validation**: Verificar que el recurso pertenece a la empresa del usuario
4. **Input Validation**: Prevenir inyección y datos maliciosos
5. **Rate Limiting**: Prevenir abuso y ataques de fuerza bruta
6. **Audit Logging**: Registrar operaciones críticas

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente HTTP                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  1. authMiddleware (JWT + Usuario Activo + Rate Limiting)   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  2. tenantMiddleware (Configuración DB de Empresa)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  3. requireAuth (Validar userId + empresaId)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  4. requirePermission (Verificar Rol + Acción)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  5. requireOwnership (Validar Recurso de Empresa)           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  6. validateBody (Zod Schema + Sanitización)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Controller (Lógica de Negocio + Audit Log)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  8. Service Layer (Acceso a Base de Datos)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Componentes Principales

### 1. Sistema de Permisos (`types/permissions.types.ts`)

Define roles, recursos y acciones del sistema:

```typescript
// Roles disponibles (orden jerárquico)
type Role =
  | 'superadmin'    // Acceso total al sistema
  | 'admin'         // Administrador de empresa
  | 'gerente'       // Gerente con permisos amplios
  | 'vendedor'      // Vendedor con permisos limitados
  | 'tecnico'       // Técnico con permisos específicos
  | 'almacenero'    // Gestión de almacén
  | 'visualizador'; // Solo lectura

// Recursos del sistema
type Resource =
  | 'clientes' | 'productos' | 'familias' | 'almacenes'
  | 'tipos-impuesto' | 'facturas' | 'presupuestos' | 'pedidos'
  | 'usuarios' | 'configuracion' | 'reportes' | 'licencias';

// Acciones posibles
type Action = 'create' | 'read' | 'update' | 'delete' | 'export' | 'import';
```

**Funciones útiles:**
- `hasPermission(role, resource, action)`: Verifica si un rol tiene permiso
- `hasRoleLevel(userRole, requiredRole)`: Verifica jerarquía de roles
- `getRolePermissions(role)`: Obtiene todos los permisos de un rol

### 2. Middleware de Autenticación (`middleware/auth.middleware.ts`)

**Responsabilidades:**
- ✅ Verificar JWT válido
- ✅ Validar formato de IDs
- ✅ Verificar usuario existe y está activo
- ✅ Verificar consistencia de datos token vs BD
- ✅ Rate limiting por usuario (1000 req/min)
- ✅ Añadir datos de usuario al request

```typescript
// Uso en rutas
router.use(authMiddleware);
```

### 3. Middleware de Autorización (`middleware/authorization.middleware.ts`)

#### 3.1 `requirePermission(resource, action)`

Verifica que el rol del usuario tenga permiso para realizar una acción:

```typescript
// Ejemplo: Solo usuarios con permiso 'create' en 'clientes' pueden crear
router.post(
  '/clientes',
  requirePermission('clientes', 'create'),
  controller.create
);
```

#### 3.2 `requireOwnership(Model, paramName)`

Verifica que el recurso pertenezca a la empresa del usuario:

```typescript
// Ejemplo: Solo puede editar clientes de su propia empresa
router.put(
  '/clientes/:id',
  requireOwnership(getClientesModel, 'id'),
  controller.update
);
```

**Beneficios:**
- Previene acceso cruzado entre empresas
- El recurso validado se añade a `req.resource` (evita consultas duplicadas)
- Validación automática de formato de ID

#### 3.3 `requireRoleLevel(minimumRole)`

Verifica que el usuario tenga un rol de nivel mínimo:

```typescript
// Ejemplo: Solo admin o superior puede acceder
router.get(
  '/admin/configuracion',
  requireRoleLevel('admin'),
  controller.getConfig
);
```

#### 3.4 `requireUserModificationPermission`

Middleware especializado para modificación de usuarios:

```typescript
router.put(
  '/usuarios/:id',
  requireUserModificationPermission,
  controller.updateUser
);
```

**Reglas:**
- Superadmin puede modificar a todos
- Admin puede modificar usuarios de su empresa (excepto superadmins)
- Usuarios pueden modificar solo datos básicos propios

### 4. Helper de Autorización (`utils/authorization.helper.ts`)

Clase con métodos útiles para validaciones:

```typescript
// Validar formato de ObjectId
AuthorizationHelper.isValidObjectId(id);

// Validar ownership
AuthorizationHelper.validateResourceOwnership(resource, empresaId);

// Validar permisos
AuthorizationHelper.validateUserPermission(role, resource, action);

// Sanitizar datos de usuario
AuthorizationHelper.sanitizeUserData(user);

// Validar entrada (prevenir inyección)
AuthorizationHelper.validateInput(data);

// Log de auditoría
AuthorizationHelper.logSecurityEvent(userId, 'DELETE', 'clientes', { id });

// Rate limiting por usuario
AuthorizationHelper.checkUserRateLimit(userId, 100, 60000);
```

---

## 🛣️ Implementación en Rutas

### Ejemplo Completo: Tipos de Impuesto

```typescript
import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import {
  requirePermission,
  requireOwnership,
  requireAuth,
} from '@/middleware/authorization.middleware';

const router = Router();

// Middlewares globales
router.use(authMiddleware);      // 1. Autenticación
router.use(tenantMiddleware);    // 2. Multi-tenant
router.use(requireAuth);         // 3. Validar datos completos

// Listar (solo lectura)
router.get(
  '/',
  requirePermission('tipos-impuesto', 'read'),
  controller.getAll
);

// Obtener uno (lectura + ownership)
router.get(
  '/:id',
  requirePermission('tipos-impuesto', 'read'),
  requireOwnership(getTiposImpuestoModel, 'id'),
  controller.getOne
);

// Crear (permiso de creación)
router.post(
  '/',
  requirePermission('tipos-impuesto', 'create'),
  validateBody(CreateSchema),
  controller.create
);

// Actualizar (permiso + ownership)
router.put(
  '/:id',
  requirePermission('tipos-impuesto', 'update'),
  requireOwnership(getTiposImpuestoModel, 'id'),
  validateBody(UpdateSchema),
  controller.update
);

// Eliminar (permiso + ownership)
router.delete(
  '/:id',
  requirePermission('tipos-impuesto', 'delete'),
  requireOwnership(getTiposImpuestoModel, 'id'),
  controller.delete
);

export default router;
```

---

## 🎮 Implementación en Controladores

### Ejemplo de Controlador Seguro

```typescript
export class TiposImpuestoController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Los middlewares ya validaron:
      // ✅ Usuario autenticado
      // ✅ Empresa configurada
      // ✅ Permisos de creación

      const empresaId = req.empresaId!;
      const userId = req.userId!;

      // Parsear y validar datos
      const data = CreateSchema.parse(req.body);

      // 🔒 Validación adicional contra inyección
      const validation = AuthorizationHelper.validateInput(data);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      // Ejecutar lógica de negocio
      const result = await service.create(empresaId, data);

      // 📝 Log de auditoría
      AuthorizationHelper.logSecurityEvent(
        userId,
        'CREATE',
        'tipos-impuesto',
        { id: result._id }
      );

      res.status(201).json({
        success: true,
        data: result,
      });

    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      // Los middlewares ya validaron:
      // ✅ Usuario autenticado
      // ✅ Permisos de actualización
      // ✅ Ownership (recurso pertenece a la empresa)

      const empresaId = req.empresaId!;
      const userId = req.userId!;
      const resourceId = req.params.id;

      // req.resource ya contiene el recurso validado
      // (evitamos consulta duplicada)

      const data = UpdateSchema.parse(req.body);

      const result = await service.update(resourceId, empresaId, data);

      // 📝 Log de auditoría
      AuthorizationHelper.logSecurityEvent(
        userId,
        'UPDATE',
        'tipos-impuesto',
        { id: resourceId, changes: Object.keys(data) }
      );

      res.json({ success: true, data: result });

    } catch (error) {
      next(error);
    }
  }
}
```

---

## 👥 Roles y Permisos

### Matriz de Permisos por Rol

| Recurso | Superadmin | Admin | Gerente | Vendedor | Técnico | Almacenero | Visualizador |
|---------|-----------|-------|---------|----------|---------|------------|--------------|
| **Clientes** |
| create  | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| read    | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| update  | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| delete  | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| export  | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Productos** |
| create  | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| read    | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| update  | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| delete  | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Usuarios** |
| create  | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| read    | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| update  | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| delete  | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Jerarquía de Roles

```
superadmin (7) ──> Acceso total al sistema
    │
    ├─> admin (6) ──> Administrador de empresa
    │       │
    │       └─> gerente (5) ──> Gestión amplia
    │               │
    │               └─> vendedor (4) ──> Ventas
    │                       │
    │                       └─> tecnico (3) ──> Soporte técnico
    │                               │
    │                               └─> almacenero (2) ──> Almacén
    │                                       │
    │                                       └─> visualizador (1) ──> Solo lectura
```

---

## ✅ Mejores Prácticas

### 1. Orden de Middlewares

**SIEMPRE** mantener este orden en las rutas:

```typescript
router.use(authMiddleware);       // 1. Autenticación
router.use(tenantMiddleware);     // 2. Multi-tenant
router.use(requireAuth);          // 3. Validar datos

router.METHOD(
  '/path/:id',
  requirePermission(...),         // 4. Permisos
  requireOwnership(...),          // 5. Ownership
  validateBody(...),              // 6. Validación
  controller.method               // 7. Lógica
);
```

### 2. Validación en Capas

```typescript
// Capa 1: Middleware de validación (Zod)
validateBody(CreateSchema)

// Capa 2: Validación contra inyección
AuthorizationHelper.validateInput(data)

// Capa 3: Validación de negocio (en service)
if (await service.exists(nif)) {
  throw new Error('NIF duplicado');
}
```

### 3. Logs de Auditoría

Registrar operaciones críticas:

```typescript
// CREATE, UPDATE, DELETE de recursos importantes
AuthorizationHelper.logSecurityEvent(
  userId,
  'DELETE',
  'clientes',
  { id, motivo: 'Solicitud de cliente' }
);
```

### 4. Sanitización de Datos

```typescript
// Antes de devolver usuarios
const usuarios = await service.getAll();
const sanitized = AuthorizationHelper.sanitizeUsersData(usuarios);
res.json({ data: sanitized });
```

### 5. Manejo de Errores

```typescript
// En controladores, pasar errores al middleware global
try {
  // ...
} catch (error) {
  next(error); // ← ErrorHandler middleware lo procesará
}
```

---

## 🔒 Protecciones de Seguridad

### 1. Autenticación Robusta

✅ **JWT con validación en BD**
- Verifica que el token sea válido
- Verifica que el usuario exista y esté activo
- Verifica consistencia entre token y BD

✅ **Rate Limiting**
- Global: 100 req/15min por IP
- Por usuario: 1000 req/min

✅ **Tokens con expiración**
- Access Token: 1 hora
- Refresh Token: 7 días

### 2. Autorización Multi-Capa

✅ **Permisos por Rol**
- Matriz de permisos granular
- Verificación automática en middlewares

✅ **Ownership Validation**
- Recursos aislados por empresa
- Previene acceso cruzado

✅ **Validación de Jerarquía**
- Admin no puede modificar superadmin
- Usuarios solo modifican datos propios (limitados)

### 3. Prevención de Ataques

✅ **SQL/NoSQL Injection**
```typescript
// Detecta operadores MongoDB peligrosos
AuthorizationHelper.validateInput(data);
// Rechaza: { $where, $regex, $ne, $gt, etc. }
```

✅ **Insecure Direct Object Reference (IDOR)**
```typescript
// Valida ownership antes de permitir acceso
requireOwnership(Model, 'id')
```

✅ **Mass Assignment**
```typescript
// Schemas Zod estrictos
const UpdateSchema = z.object({
  nombre: z.string(),
  // Solo campos permitidos
}).strict(); // ← Rechaza campos extra
```

✅ **Privilege Escalation**
```typescript
// Validación de permisos en cada endpoint
requirePermission('usuarios', 'delete')
```

### 4. Auditoría y Monitoreo

✅ **Logs Estructurados**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "userId": "507f1f77bcf86cd799439011",
  "action": "DELETE",
  "resource": "clientes",
  "details": { "id": "...", "nif": "..." }
}
```

✅ **Eventos de Seguridad**
- Token inválido
- Intentos de acceso no autorizado
- Operaciones críticas (DELETE, cambio de permisos)

---

## 🚀 Migración de Código Existente

### Paso 1: Actualizar Rutas

```typescript
// ANTES
router.delete('/:id', controller.delete);

// DESPUÉS
router.delete(
  '/:id',
  requirePermission('clientes', 'delete'),
  requireOwnership(getClientesModel, 'id'),
  controller.delete
);
```

### Paso 2: Actualizar Controladores

```typescript
// ANTES
async delete(req, res) {
  const id = req.params.id;
  await service.delete(id);
  res.json({ success: true });
}

// DESPUÉS
async delete(req, res, next) {
  try {
    const empresaId = req.empresaId!;
    const userId = req.userId!;
    const id = req.params.id;

    await service.delete(id, empresaId);

    AuthorizationHelper.logSecurityEvent(
      userId, 'DELETE', 'clientes', { id }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
```

---

## 📚 Referencias

- **Archivos de ejemplo:**
  - `tipos-impuesto.routes.example.ts` - Rutas con autorización
  - `tipos-impuesto.controller.example.ts` - Controlador seguro

- **Tipos y utilidades:**
  - `types/permissions.types.ts` - Sistema de permisos
  - `middleware/authorization.middleware.ts` - Middlewares
  - `utils/authorization.helper.ts` - Funciones helper

- **Documentación OWASP:**
  - [Top 10 Web Application Security Risks](https://owasp.org/www-project-top-ten/)
  - [Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

---

## ❓ FAQ

**P: ¿Debo usar todos los middlewares en cada ruta?**
R: No siempre. Los básicos (auth, tenant, requireAuth) sí. Los demás según necesidad:
- `requirePermission`: Siempre que haya permisos por rol
- `requireOwnership`: Solo en rutas con `:id` que acceden a recursos específicos
- `validateBody`: Solo en POST/PUT/PATCH con body

**P: ¿Cómo agrego un nuevo recurso?**
R:
1. Añade el recurso a `Resource` type en `permissions.types.ts`
2. Define permisos por rol en `ROLE_PERMISSIONS`
3. Usa `requirePermission(nuevoRecurso, action)` en rutas

**P: ¿Puedo personalizar permisos por usuario?**
R: Sí, el modelo Usuario tiene campo `permisos: any`. Puedes implementar lógica adicional en `hasPermission()` para verificar permisos personalizados.

**P: ¿El sistema afecta el rendimiento?**
R: Mínimamente. Las validaciones son muy rápidas. El authMiddleware hace 1 consulta a BD por request, pero puedes implementar caché si es necesario.

---

**Última actualización:** 2024-01-15
**Versión:** 1.0.0
