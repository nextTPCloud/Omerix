# 🧪 Guía de Testing - Multi-Base de Datos

## 📝 Resumen

Ahora **TODO está implementado** para la arquitectura multi-base de datos. Esta guía te ayudará a probar todo el sistema desde cero.

## ✅ Lo que YA está hecho

1. ✅ Modelo Empresa con `databaseConfig`
2. ✅ DatabaseManager service
3. ✅ Middleware tenant actualizado
4. ✅ Servicio Clientes actualizado
5. ✅ **Controlador Clientes actualizado (COMPLETO)**
6. ✅ Script de migración
7. ✅ Helper de modelos dinámicos

## 🚀 Opción 1: Testing con Datos Nuevos (RECOMENDADO para Dev)

Como estás en modo desarrollo con datos ficticios, **es más simple empezar de cero**.

### Paso 1: Limpiar Base de Datos

```bash
# Conectarte a MongoDB
mongosh

# Eliminar base de datos actual (datos de prueba)
use omerix_dev  # o el nombre de tu DB actual
db.dropDatabase()

# Salir
exit
```

### Paso 2: Arrancar el Backend

```bash
cd apps/backend
npm run dev
```

### Paso 3: Registrar Primera Empresa

**POST** `http://localhost:3000/api/auth/register` (o la ruta de registro que uses)

```json
{
  "email": "admin@empresa1.com",
  "password": "Password123!",
  "nombre": "Juan Pérez",
  "empresa": {
    "nombre": "Empresa Demo 1",
    "nif": "B12345678",
    "email": "contacto@empresa1.com",
    "telefono": "912345678",
    "tipoNegocio": "retail"
  }
}
```

**¿Qué debe pasar?**
- Se crea el usuario en DB principal
- Se crea la empresa con `databaseConfig` generado automáticamente
- Se inicializa la DB de la empresa (`omerix_empresa_{empresaId}`)
- Recibes un token JWT

**Verificación en MongoDB:**
```bash
mongosh

# Ver DB principal
use omerix_dev
db.empresas.find().pretty()
# Deberías ver databaseConfig con host, port, name, etc.

# Ver que se creó la DB de la empresa
show dbs
# Deberías ver algo como: omerix_empresa_67e...
```

### Paso 4: Login

**POST** `http://localhost:3000/api/auth/login`

```json
{
  "email": "admin@empresa1.com",
  "password": "Password123!"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "...",
    "empresaId": "...",
    "email": "admin@empresa1.com"
  }
}
```

**Guarda el token** - lo necesitarás para todas las peticiones.

### Paso 5: Crear Primer Cliente

**POST** `http://localhost:3000/api/clientes`

**Headers:**
```
Authorization: Bearer {tu_token}
Content-Type: application/json
```

**Body:**
```json
{
  "tipoCliente": "empresa",
  "nombre": "Cliente Demo S.L.",
  "nif": "B87654321",
  "email": "cliente@demo.com",
  "telefono": "923456789",
  "direccion": {
    "calle": "Calle Mayor",
    "numero": "123",
    "codigoPostal": "28001",
    "ciudad": "Madrid",
    "provincia": "Madrid",
    "pais": "España"
  },
  "formaPago": "transferencia",
  "diasPago": 30
}
```

**✅ Si todo funciona:**
- Recibes status 201
- El cliente se guarda en `omerix_empresa_{empresaId}` (NO en la DB principal)
- El código se genera automáticamente (CLI-001)

**Verificación:**
```bash
mongosh

# Conectar a DB de la empresa
use omerix_empresa_67e...  # El ID que viste antes
db.clientes.find().pretty()
# Deberías ver el cliente creado
```

### Paso 6: Listar Clientes

**GET** `http://localhost:3000/api/clientes`

**Headers:**
```
Authorization: Bearer {tu_token}
```

**✅ Respuesta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "codigo": "CLI-001",
      "nombre": "Cliente Demo S.L.",
      "nif": "B87654321",
      // ... resto de datos
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Paso 7: Probar Aislamiento (Múltiples Empresas)

Para verificar que cada empresa solo ve sus datos:

#### 7.1 Registrar Segunda Empresa

**POST** `http://localhost:3000/api/auth/register`

```json
{
  "email": "admin@empresa2.com",
  "password": "Password123!",
  "nombre": "María García",
  "empresa": {
    "nombre": "Empresa Demo 2",
    "nif": "B99999999",
    "email": "contacto@empresa2.com",
    "tipoNegocio": "servicios"
  }
}
```

#### 7.2 Login con Empresa 2

**POST** `http://localhost:3000/api/auth/login`

```json
{
  "email": "admin@empresa2.com",
  "password": "Password123!"
}
```

Guarda este **segundo token**.

#### 7.3 Crear Cliente en Empresa 2

**POST** `http://localhost:3000/api/clientes`

**Headers:**
```
Authorization: Bearer {token_empresa_2}
```

**Body:**
```json
{
  "tipoCliente": "particular",
  "nombre": "Pedro Martínez",
  "nif": "12345678A",
  "direccion": {
    "calle": "Av. Libertad",
    "numero": "45",
    "codigoPostal": "46001",
    "ciudad": "Valencia",
    "provincia": "Valencia",
    "pais": "España"
  },
  "formaPago": "contado",
  "diasPago": 0
}
```

#### 7.4 Verificar Aislamiento

**Con token de Empresa 1:**
```bash
GET /api/clientes
Authorization: Bearer {token_empresa_1}

# Debe devolver SOLO "Cliente Demo S.L." (1 cliente)
```

**Con token de Empresa 2:**
```bash
GET /api/clientes
Authorization: Bearer {token_empresa_2}

# Debe devolver SOLO "Pedro Martínez" (1 cliente)
```

**✅ ÉXITO si:**
- Cada empresa solo ve sus propios clientes
- No hay contaminación de datos entre empresas

**Verificación en MongoDB:**
```bash
mongosh

# Ver empresas
use omerix_dev
db.empresas.find({}, {nombre: 1, "databaseConfig.name": 1})

# Deberías ver:
# { nombre: "Empresa Demo 1", databaseConfig: { name: "omerix_empresa_67e..." } }
# { nombre: "Empresa Demo 2", databaseConfig: { name: "omerix_empresa_78f..." } }

# Ver clientes de Empresa 1
use omerix_empresa_67e...
db.clientes.find({}, {codigo: 1, nombre: 1})
# Solo CLI-001 Cliente Demo S.L.

# Ver clientes de Empresa 2
use omerix_empresa_78f...
db.clientes.find({}, {codigo: 1, nombre: 1})
# Solo CLI-001 Pedro Martínez
# NOTA: Ambos pueden tener CLI-001 porque son DBs separadas!
```

### Paso 8: Probar Actualización

**PUT** `http://localhost:3000/api/clientes/{clienteId}`

**Headers:**
```
Authorization: Bearer {tu_token}
```

**Body:**
```json
{
  "telefono": "999888777",
  "email": "nuevo@email.com"
}
```

### Paso 9: Probar Eliminación

**DELETE** `http://localhost:3000/api/clientes/{clienteId}`

**Headers:**
```
Authorization: Bearer {tu_token}
```

### Paso 10: Probar Estadísticas

**GET** `http://localhost:3000/api/clientes/estadisticas`

**Headers:**
```
Authorization: Bearer {tu_token}
```

---

## 🔄 Opción 2: Migrar Datos Existentes

Si ya tienes datos y quieres migrarlos:

### Paso 1: Añadir Script al package.json

```json
// apps/backend/package.json
{
  "scripts": {
    "migrate:multidb": "ts-node src/scripts/migrateToMultiDB.ts"
  }
}
```

### Paso 2: Ejecutar Migración

```bash
cd apps/backend
npm run migrate:multidb
```

### Paso 3: Verificar en Logs

Deberías ver:
```
✅ MongoDB PRINCIPAL conectado correctamente
📊 Encontradas 2 empresas para migrar
==========================================================
🏢 Procesando empresa: Empresa Demo 1
   ID: 67e...
==========================================================
🔧 Configuración de DB generada:
   Nombre: omerix_empresa_67e...
💾 Configuración guardada en el modelo Empresa
📦 Migrando clientes...
   Encontrados: 25 clientes
   ✅ 25 clientes migrados correctamente
...
🎉 ¡MIGRACIÓN COMPLETADA!
📊 Empresas migradas: 2/2
👥 Clientes migrados: 50
```

---

## ❌ Troubleshooting

### Error: "Configuración de base de datos no disponible"

**Causa:** El middleware `tenantMiddleware` no está cargando el `databaseConfig`.

**Solución:**
1. Verifica que el middleware esté registrado en las rutas:
   ```typescript
   router.use(authMiddleware);  // Primero auth
   router.use(tenantMiddleware); // Luego tenant
   ```

2. Verifica en MongoDB que la empresa tiene `databaseConfig`:
   ```bash
   mongosh
   use omerix_dev
   db.empresas.findOne({}, {databaseConfig: 1})
   ```

### Error: "Cannot read property 'empresaDbConfig' of undefined"

**Causa:** El `tenantMiddleware` no se está ejecutando.

**Solución:**
- Asegúrate de que las rutas tengan el middleware:
  ```typescript
  // clientes.routes.ts
  router.get('/', authMiddleware, tenantMiddleware, clientesController.findAll);
  ```

### Error al conectar a MongoDB de empresa

**Causa:** Configuración de DB incorrecta.

**Solución:**
1. Verifica variables de entorno:
   ```bash
   MONGODB_HOST=localhost
   MONGODB_PORT=27017
   MONGODB_USER=  # Vacío si no tienes auth
   MONGODB_PASSWORD=  # Vacío si no tienes auth
   ```

2. Verifica que MongoDB esté corriendo:
   ```bash
   mongosh
   ```

### Los datos no se aíslan entre empresas

**Causa:** El middleware no está pasando `empresaDbConfig`.

**Solución:**
- Revisa los logs del servidor al hacer una petición:
  ```
  🏢 Tenant: 67e... | DB: omerix_empresa_67e...
  ```
  Si no ves esto, el middleware no se está ejecutando.

---

## 📊 Testing Checklist

- [ ] Registrar primera empresa → Ver `databaseConfig` en MongoDB
- [ ] Login → Recibir token válido
- [ ] Crear cliente → Verificar en DB de empresa (NO en principal)
- [ ] Listar clientes → Ver solo clientes de mi empresa
- [ ] Actualizar cliente → Cambios reflejados
- [ ] Eliminar cliente → Cliente eliminado
- [ ] Obtener estadísticas → Números correctos
- [ ] **Registrar segunda empresa**
- [ ] **Login con empresa 2**
- [ ] **Crear cliente en empresa 2**
- [ ] **Verificar aislamiento** (cada empresa ve solo sus datos)
- [ ] **Con token de empresa 1** → Solo ver clientes de empresa 1
- [ ] **Con token de empresa 2** → Solo ver clientes de empresa 2

---

## 🎯 Comando Rápido para Probar

```bash
# Terminal 1: Backend
cd apps/backend
npm run dev

# Terminal 2: Frontend
cd apps/web
npm run dev

# Navegador: http://localhost:3000
# Registra empresa → Login → Crear cliente → ¡Listo!
```

---

## 📝 Notas Importantes

1. **Datos de desarrollo**: Como dices que son ficticios, **empieza de cero** es más simple.

2. **Cada empresa puede tener CLI-001**: Como ahora cada empresa tiene su propia DB, los códigos pueden repetirse entre empresas (pero no dentro de la misma empresa).

3. **Performance**: La primera vez que accedes a una empresa, se crea la conexión. Las siguientes peticiones usan la conexión en cache (muy rápido).

4. **Seguridad**: Las contraseñas de DB están en `select: false`, nunca se devuelven en las APIs.

5. **MongoDB**: Puedes ver todas las DBs con:
   ```bash
   mongosh
   show dbs
   # omerix_dev              ← Principal (usuarios, empresas, licencias)
   # omerix_empresa_67e...   ← Empresa 1 (clientes, productos, etc.)
   # omerix_empresa_78f...   ← Empresa 2 (clientes, productos, etc.)
   ```

---

¿Necesitas ayuda con algún paso? ¡Empieza probando y me cuentas si encuentras algún error!