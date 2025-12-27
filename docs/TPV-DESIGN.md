# Documento de Diseño: TPV Tralok

## 1. Visión General

### 1.1 Objetivo
Crear un Terminal Punto de Venta (TPV) robusto, independiente, con capacidad de funcionamiento offline y cumplimiento de la normativa VeriFactu española.

### 1.2 Características Principales
- **App Electron** instalable en equipos Windows/Linux/Mac
- **MongoDB local** para failover cuando no hay conexión
- **Sincronización bidireccional** con servidor central Tralok
- **VeriFactu compliant** con cola de envío para modo offline
- **Escalable** para restauración (comandas, KDS, mesas)

---

## 2. Arquitectura

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVIDOR CENTRAL                               │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────────┐  │
│  │    Tralok     │   │   MongoDB     │   │        VeriFactu          │  │
│  │    Backend    │◄──│   Atlas       │   │     (envío a AEAT)        │  │
│  │   (NestJS)    │   │               │   │                           │  │
│  └───────┬───────┘   └───────────────┘   └───────────────────────────┘  │
│          │                                            ▲                  │
└──────────┼────────────────────────────────────────────┼─────────────────┘
           │ API REST + WebSocket                       │
           │                                            │
┌──────────┴────────────────────────────────────────────┴─────────────────┐
│                           TPV LOCAL (Electron)                           │
│                                                                          │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────────┐  │
│  │   TPV Web     │   │   MongoDB     │   │    Cola VeriFactu         │  │
│  │  (Next.js)    │◄──│   Local       │──►│  (pendientes de envío)    │  │
│  │               │   │  (opcional)   │   │                           │  │
│  └───────┬───────┘   └───────────────┘   └───────────────────────────┘  │
│          │                                                               │
│  ┌───────┴───────┐   ┌───────────────┐   ┌───────────────────────────┐  │
│  │  TPV Backend  │   │  IndexedDB    │   │      Impresoras           │  │
│  │   (Express)   │   │  (cache UI)   │   │   (tickets, cocina)       │  │
│  └───────────────┘   └───────────────┘   └───────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      Estado de Conexión                             │ │
│  │   ● Online  → Operaciones directas al servidor                      │ │
│  │   ● Offline → Operaciones en MongoDB local + cola sync              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Componentes

| Componente | Tecnología | Responsabilidad |
|------------|------------|-----------------|
| TPV Web | Next.js 15 + React 19 | UI del TPV |
| TPV Backend | Express.js | API local, sync, impresión |
| Electron | Electron 33+ | Contenedor de la app |
| BD Local | MongoDB 7+ | Almacenamiento offline |
| Cache UI | IndexedDB + Dexie | Cache de productos para UI |
| Impresión | node-thermal-printer | Tickets ESC/POS |

### 2.3 Modos de Operación

#### Modo Online (Preferido)
1. Venta se registra directamente en servidor central
2. VeriFactu se envía inmediatamente a AEAT
3. Stock se actualiza en tiempo real
4. Sincronización continua de catálogo

#### Modo Offline (Failover)
1. Venta se registra en MongoDB local
2. Hash VeriFactu se genera localmente (encadenado)
3. Venta entra en cola de sincronización
4. Al recuperar conexión:
   - Se sincronizan ventas pendientes
   - Se envían facturas a VeriFactu
   - Se actualizan stocks

---

## 3. Modelo de Datos

### 3.1 Entidades Locales (MongoDB TPV)

#### TPV
```typescript
interface ITPV {
  _id: string;
  codigo: string;              // "TPV-001"
  nombre: string;              // "Caja Principal"
  empresaId: string;           // Referencia a empresa en servidor
  almacenId: string;           // Almacén asociado
  serieFactura: string;        // "FS" (Factura Simplificada)

  // Configuración
  config: {
    permitirDescuentos: boolean;
    descuentoMaximo: number;
    permitirPrecioManual: boolean;
    clientePorDefecto: string;        // ID del cliente genérico
    formaPagoPorDefecto: string;

    // Impresoras
    impresoraTicket?: string;         // Nombre/IP impresora
    impresoraCocina?: string;

    // UI
    productosPorPagina: number;       // 20, 30, 40
    mostrarImagenes: boolean;
    mostrarStock: boolean;
    tecladoRapido: boolean;           // Teclado numérico siempre visible

    // Offline
    modoOfflineActivo: boolean;       // Si permite operar offline
    diasCacheProductos: number;       // Días que mantiene cache
  };

  // Estado
  cajaActiva?: string;                // ID de caja abierta
  ultimaSync: Date;
  estado: 'activo' | 'inactivo';
}
```

#### Caja (Sesión de Caja)
```typescript
interface ICaja {
  _id: string;
  tpvId: string;
  numero: number;                     // Número secuencial de caja

  // Apertura
  fechaApertura: Date;
  usuarioApertura: string;
  fondoInicial: number;

  // Cierre (null si está abierta)
  fechaCierre?: Date;
  usuarioCierre?: string;
  fondoFinal?: number;

  // Totales calculados
  totales: {
    ventasBruto: number;
    descuentos: number;
    ventasNeto: number;
    iva: number;
    totalCobrado: number;

    // Por forma de pago
    efectivo: number;
    tarjeta: number;
    otros: number;

    // Movimientos
    entradas: number;
    salidas: number;

    // Diferencia
    diferencia: number;               // fondoFinal - esperado
  };

  // Estado
  estado: 'abierta' | 'cerrada' | 'cuadrada';
  sincronizada: boolean;

  // Referencia servidor
  cajaServidorId?: string;            // ID en servidor central
}
```

#### Movimiento de Caja
```typescript
interface IMovimientoCaja {
  _id: string;
  cajaId: string;
  tipo: 'entrada' | 'salida';
  concepto: string;                   // "Cambio inicial", "Pago proveedor", etc.
  importe: number;
  fecha: Date;
  usuario: string;
  sincronizado: boolean;
}
```

#### Venta (Ticket/Factura Simplificada)
```typescript
interface IVenta {
  _id: string;
  numero: string;                     // "FS-TPV001-00001"
  fecha: Date;
  tpvId: string;
  cajaId: string;
  usuarioId: string;

  // Cliente
  clienteId?: string;                 // null = cliente genérico
  clienteNombre?: string;
  clienteNif?: string;

  // Líneas
  lineas: ILineaVenta[];

  // Totales
  subtotal: number;                   // Sin IVA
  descuentoGlobal: number;
  totalDescuentos: number;
  baseImponible: number;
  totalIva: number;
  total: number;

  // Desglose IVA
  desgloseIva: {
    tipo: number;                     // 21, 10, 4, 0
    base: number;
    cuota: number;
  }[];

  // Pagos
  pagos: IPagoVenta[];
  cambio: number;

  // VeriFactu
  verifactu: {
    hash: string;                     // Hash de esta factura
    hashAnterior?: string;            // Hash de la anterior (encadenado)
    estado: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado' | 'error';
    csv?: string;                     // Código Seguro Verificación
    fechaEnvio?: Date;
    intentos: number;
    ultimoError?: string;
    qrData: string;                   // Datos para QR
  };

  // Sincronización
  sincronizada: boolean;
  ventaServidorId?: string;           // ID en servidor central

  // Estado
  estado: 'completada' | 'anulada';
  fechaAnulacion?: Date;
  motivoAnulacion?: string;
}

interface ILineaVenta {
  productoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;             // Sin IVA
  descuento: number;                  // Porcentaje
  importeDescuento: number;
  tipoIva: number;
  subtotal: number;                   // cantidad * precio - descuento
  iva: number;
  total: number;

  // Variante (si aplica)
  varianteId?: string;
  varianteNombre?: string;

  // Modificadores
  modificadores?: {
    id: string;
    nombre: string;
    precio: number;
  }[];

  // Kit (si es producto kit)
  esKit: boolean;
  componentesKit?: {
    productoId: string;
    nombre: string;
    cantidad: number;
  }[];
}

interface IPagoVenta {
  formaPago: string;                  // 'efectivo', 'tarjeta', 'bizum', etc.
  importe: number;
  referencia?: string;                // Número de operación tarjeta
}
```

#### Cola de Sincronización
```typescript
interface IColaSync {
  _id: string;
  tipo: 'venta' | 'caja' | 'movimiento' | 'cobro';
  entidadId: string;                  // ID del documento a sincronizar
  prioridad: number;                  // 1 = alta, 5 = baja
  intentos: number;
  ultimoIntento?: Date;
  error?: string;
  createdAt: Date;
}
```

#### Cache de Productos (para UI rápida)
```typescript
interface IProductoCache {
  _id: string;                        // Mismo ID que en servidor
  codigo: string;
  nombre: string;
  familiaId: string;
  familiaNombre: string;

  // Precios
  pvp: number;                        // PVP con IVA
  precioSinIva: number;
  tipoIva: number;

  // Configuración TPV
  usarEnTPV: boolean;
  permiteDescuento: boolean;
  precioModificable: boolean;

  // Stock (última sincronización)
  stock: number;
  stockMinimo: number;

  // Variantes
  tieneVariantes: boolean;
  variantes?: {
    _id: string;
    nombre: string;
    sku: string;
    pvp: number;
    stock: number;
  }[];

  // Kit
  esKit: boolean;
  componentesKit?: {
    productoId: string;
    cantidad: number;
  }[];

  // Modificadores aplicables
  gruposModificadores?: string[];

  // Visual
  imagen?: string;
  color?: string;

  // Metadata sync
  ultimaActualizacion: Date;
}
```

### 3.2 Sincronización con Servidor Central

#### Datos que se DESCARGAN del servidor:
- Productos (filtrados por `usarEnTPV: true`)
- Familias
- Clientes (frecuentes o todos según config)
- Formas de pago
- Tarifas de precios
- Tipos de IVA
- Modificadores y grupos
- Configuración del TPV
- Series de documentos

#### Datos que se SUBEN al servidor:
- Ventas/Tickets
- Cierres de caja
- Movimientos de caja
- Cobros de facturas
- Estados de VeriFactu

---

## 4. Flujos de Operación

### 4.1 Flujo de Venta (Online)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Selección  │────►│   Carrito   │────►│    Pago     │────►│   Ticket    │
│  Productos  │     │             │     │             │     │  Impreso    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Consulta    │     │ Validación  │     │  Registro   │     │  VeriFactu  │
│ Stock Server│     │ Descuentos  │     │  Servidor   │     │  Envío AEAT │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 4.2 Flujo de Venta (Offline)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Selección  │────►│   Carrito   │────►│    Pago     │────►│   Ticket    │
│  Productos  │     │             │     │             │     │  Impreso    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Cache Local │     │ Validación  │     │  MongoDB    │     │ Hash Local  │
│ (IndexedDB) │     │ Local       │     │  Local      │     │ Cola Sync   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                  │
                                              ┌───────────────────┘
                                              ▼ (cuando hay conexión)
                                        ┌─────────────┐
                                        │  Sync al    │
                                        │  Servidor   │
                                        └─────────────┘
```

### 4.3 Flujo de Apertura de Caja

```
1. Usuario inicia sesión en TPV
2. Sistema verifica si hay caja abierta
   - Si hay: Continúa con esa caja
   - Si no: Solicita apertura
3. Usuario introduce fondo inicial
4. Sistema crea registro de caja
5. TPV queda operativo
```

### 4.4 Flujo de Cierre de Caja

```
1. Usuario solicita cierre
2. Sistema muestra resumen:
   - Ventas del día
   - Desglose por forma de pago
   - Movimientos entrada/salida
   - Total esperado en caja
3. Usuario introduce fondo final contado
4. Sistema calcula diferencia
5. Si hay diferencia, solicita justificación
6. Se genera informe de cierre
7. Se sincroniza con servidor
8. Caja queda cerrada
```

### 4.5 Flujo de Sincronización

```
┌─────────────────────────────────────────────────────────────┐
│                    SINCRONIZACIÓN                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. VERIFICAR CONEXIÓN                                       │
│     └─► Ping al servidor central                             │
│                                                              │
│  2. SUBIR PENDIENTES (prioridad)                            │
│     ├─► Ventas no sincronizadas                             │
│     ├─► Cierres de caja                                     │
│     ├─► Movimientos de caja                                 │
│     └─► Cobros de facturas                                  │
│                                                              │
│  3. ENVIAR VERIFACTU                                        │
│     └─► Facturas en cola → AEAT                             │
│                                                              │
│  4. DESCARGAR ACTUALIZACIONES                               │
│     ├─► Productos modificados desde última sync             │
│     ├─► Clientes nuevos/modificados                         │
│     ├─► Configuración actualizada                           │
│     └─► Stocks actuales                                     │
│                                                              │
│  5. ACTUALIZAR TIMESTAMP ÚLTIMA SYNC                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. VeriFactu - Cumplimiento Normativo

### 5.1 Requisitos VeriFactu

1. **Hash encadenado**: Cada factura incluye el hash de la anterior
2. **Envío a AEAT**: En tiempo real o máximo 4 días
3. **QR de verificación**: En cada ticket impreso
4. **Registro inalterable**: No se pueden modificar facturas enviadas
5. **Anulación**: Solo mediante factura rectificativa

### 5.2 Implementación Offline

```typescript
// Al crear una venta offline:
async function crearVentaOffline(venta: IVenta) {
  // 1. Obtener última venta para hash encadenado
  const ultimaVenta = await getUltimaVenta();

  // 2. Generar hash de esta factura
  const datosHash = {
    nif: empresa.nif,
    numero: venta.numero,
    fecha: venta.fecha,
    total: venta.total,
    hashAnterior: ultimaVenta?.verifactu.hash || 'INICIO'
  };

  venta.verifactu = {
    hash: generateSHA256(datosHash),
    hashAnterior: ultimaVenta?.verifactu.hash,
    estado: 'pendiente',
    intentos: 0,
    qrData: generateQRData(venta)
  };

  // 3. Guardar en MongoDB local
  await ventasCollection.insertOne(venta);

  // 4. Añadir a cola de sincronización
  await colaSync.insertOne({
    tipo: 'venta',
    entidadId: venta._id,
    prioridad: 1,
    intentos: 0,
    createdAt: new Date()
  });

  // 5. Intentar envío inmediato si hay conexión
  if (await checkConnection()) {
    await sincronizarVenta(venta);
  }
}
```

### 5.3 Cola de Envío VeriFactu

```typescript
// Proceso de envío (ejecutado periódicamente)
async function procesarColaVeriFactu() {
  const pendientes = await ventasCollection.find({
    'verifactu.estado': { $in: ['pendiente', 'error'] },
    'verifactu.intentos': { $lt: 5 }
  }).sort({ fecha: 1 }); // Orden cronológico obligatorio

  for (const venta of pendientes) {
    try {
      const resultado = await verifactuService.enviarFactura(venta);

      if (resultado.exito) {
        await ventasCollection.updateOne(
          { _id: venta._id },
          {
            $set: {
              'verifactu.estado': 'aceptado',
              'verifactu.csv': resultado.csv,
              'verifactu.fechaEnvio': new Date()
            }
          }
        );
      } else {
        await ventasCollection.updateOne(
          { _id: venta._id },
          {
            $set: {
              'verifactu.estado': 'error',
              'verifactu.ultimoError': resultado.mensaje
            },
            $inc: { 'verifactu.intentos': 1 }
          }
        );
      }
    } catch (error) {
      // Reintentar más tarde
    }
  }
}
```

---

## 6. API Endpoints

### 6.1 TPV Backend Local (Express)

```typescript
// Ventas
POST   /api/ventas              // Crear venta
GET    /api/ventas              // Listar ventas del día
GET    /api/ventas/:id          // Obtener venta
POST   /api/ventas/:id/anular   // Anular venta

// Caja
POST   /api/caja/abrir          // Abrir caja
POST   /api/caja/cerrar         // Cerrar caja
GET    /api/caja/actual         // Obtener caja activa
GET    /api/caja/:id/resumen    // Resumen de caja
POST   /api/caja/movimiento     // Entrada/salida de dinero

// Productos (cache local)
GET    /api/productos           // Listar productos TPV
GET    /api/productos/:id       // Obtener producto
GET    /api/productos/buscar    // Búsqueda por código/nombre
GET    /api/familias            // Listar familias

// Clientes
GET    /api/clientes            // Listar clientes
GET    /api/clientes/buscar     // Búsqueda de cliente
GET    /api/clientes/:id        // Obtener cliente

// Sincronización
GET    /api/sync/status         // Estado de conexión y sync
POST   /api/sync/forzar         // Forzar sincronización
GET    /api/sync/pendientes     // Operaciones pendientes

// Stocks
GET    /api/stocks/:productoId  // Stock del producto (consulta servidor)
POST   /api/stocks/reservar     // Reservar stock

// Cobros
GET    /api/cobros/facturas-pendientes  // Facturas por cobrar
POST   /api/cobros/registrar            // Registrar cobro

// Impresión
POST   /api/print/ticket        // Imprimir ticket
POST   /api/print/cierre        // Imprimir cierre de caja
POST   /api/print/test          // Test de impresora
```

### 6.2 Servidor Central (Endpoints adicionales para TPV)

```typescript
// Sincronización TPV
POST   /api/tpv/sync/upload     // Subir ventas, cierres, etc.
GET    /api/tpv/sync/download   // Descargar actualizaciones
GET    /api/tpv/sync/productos  // Productos para TPV
GET    /api/tpv/sync/clientes   // Clientes para TPV

// VeriFactu (ya existe)
POST   /api/verifactu/enviar    // Enviar factura a AEAT
GET    /api/verifactu/estado    // Estado de factura

// Stock
GET    /api/stocks/consulta     // Consulta en tiempo real
POST   /api/stocks/reserva      // Reservar para TPV

// Cobros
POST   /api/pagos/registrar     // Registrar pago de factura
```

---

## 7. UI/UX Design

### 7.1 Pantalla Principal TPV

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ● Online  │  Caja: #1234  │  Usuario: Juan  │  14:35:22  │  [⚙️] [🔄]  │
├─────────────────────────────────────────────────────────────────────────┤
│                              │                                          │
│  ┌─────────────────────────┐ │  ┌────────────────────────────────────┐ │
│  │     FAMILIAS            │ │  │           CARRITO                   │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐│ │  │  ┌──────────────────────────────┐  │ │
│  │  │ 🍕  │ │ 🍔  │ │ 🥤  ││ │  │  │ Hamburguesa Classic    x2    │  │ │
│  │  │Pizza│ │Burger│ │Bebid││ │  │  │    12.00€              24.00€│  │ │
│  │  └─────┘ └─────┘ └─────┘│ │  │  ├──────────────────────────────┤  │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐│ │  │  │ Coca-Cola 500ml        x1    │  │ │
│  │  │ 🍦  │ │ 🍟  │ │ ALL ││ │  │  │     2.50€               2.50€│  │ │
│  │  │Postr│ │Extra│ │TODOS││ │  │  └──────────────────────────────┘  │ │
│  │  └─────┘ └─────┘ └─────┘│ │  │                                     │ │
│  └─────────────────────────┘ │  │  ─────────────────────────────────  │ │
│                              │  │  Subtotal:               26.50€     │ │
│  ┌─────────────────────────┐ │  │  IVA (10%):               2.65€     │ │
│  │     PRODUCTOS           │ │  │  ═══════════════════════════════   │ │
│  │  ┌───────┐ ┌───────┐    │ │  │  TOTAL:                 29.15€     │ │
│  │  │ 🍔    │ │ 🍔    │    │ │  │                                     │ │
│  │  │Classic│ │Cheese │    │ │  │  ┌─────────────────────────────┐   │ │
│  │  │ 12.00€│ │ 13.50€│    │ │  │  │         COBRAR              │   │ │
│  │  │  [3]  │ │  [5]  │    │ │  │  │         29.15€              │   │ │
│  │  └───────┘ └───────┘    │ │  │  └─────────────────────────────┘   │ │
│  │  ┌───────┐ ┌───────┐    │ │  │                                     │ │
│  │  │ 🍔    │ │ 🍔    │    │ │  │  [Aparcar] [Desc.] [Cliente]       │ │
│  │  │Bacon  │ │Double │    │ │  │                                     │ │
│  │  │ 14.00€│ │ 16.00€│    │ │  └────────────────────────────────────┘ │
│  │  │  [8]  │ │  [2]  │    │ │                                          │
│  │  └───────┘ └───────┘    │ │  ┌────────────────────────────────────┐ │
│  │                          │ │  │  7  8  9  │  [CE]  │  [CANT]      │ │
│  │  [← Pág]    [Pág →]     │ │  │  4  5  6  │  [%]   │  [PRECIO]    │ │
│  │                          │ │  │  1  2  3  │  [€]   │  [BUSCAR]    │ │
│  └─────────────────────────┘ │  │  0  00  .  │  [DEL] │  [LECTOR]    │ │
│                              │  └────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Modal de Cobro

```
┌─────────────────────────────────────────────────────────────┐
│                     COBRO - 29.15€                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Formas de Pago:                                           │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│   │  💵      │ │  💳      │ │  📱      │ │  🎁      │      │
│   │ EFECTIVO │ │ TARJETA  │ │  BIZUM   │ │  VALE    │      │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Entregado:  [         50.00€        ]               │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Total:           29.15€                             │  │
│   │  Entregado:       50.00€                             │  │
│   │  ─────────────────────────                           │  │
│   │  CAMBIO:          20.85€                             │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   Pagos aplicados:                                          │
│   • Efectivo: 50.00€                                        │
│                                                              │
│   ┌────────────────┐                    ┌────────────────┐  │
│   │    CANCELAR    │                    │    FINALIZAR   │  │
│   └────────────────┘                    └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Pantalla de Cierre de Caja

```
┌─────────────────────────────────────────────────────────────┐
│                   CIERRE DE CAJA #1234                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Resumen de Operaciones:                                   │
│   ├── Ventas realizadas:          45                        │
│   ├── Tickets emitidos:           45                        │
│   ├── Tickets anulados:            2                        │
│   └── Total bruto:          1,234.50€                       │
│                                                              │
│   Desglose por Forma de Pago:                               │
│   ├── Efectivo:               856.30€                       │
│   ├── Tarjeta:                298.20€                       │
│   └── Bizum:                   80.00€                       │
│                                                              │
│   Movimientos de Caja:                                      │
│   ├── Fondo inicial:          100.00€                       │
│   ├── Entradas:                50.00€  (cambio extra)       │
│   └── Salidas:                -25.00€  (pago proveedor)     │
│                                                              │
│   ═══════════════════════════════════════════════════════   │
│   TOTAL ESPERADO EN CAJA:     981.30€                       │
│   ═══════════════════════════════════════════════════════   │
│                                                              │
│   Fondo final contado:  [         980.00€        ]          │
│                                                              │
│   Diferencia:  -1.30€  ⚠️                                   │
│   Motivo: [  Posible error de cambio                    ]   │
│                                                              │
│   ┌────────────────┐                    ┌────────────────┐  │
│   │    CANCELAR    │                    │  CERRAR CAJA   │  │
│   └────────────────┘                    └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Tecnologías y Dependencias

### 8.1 TPV Backend (package.json)

```json
{
  "name": "@omerix/tpv-backend",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "node-thermal-printer": "^4.4.2",
    "escpos": "^3.0.0-alpha.6",
    "ws": "^8.14.2",
    "node-schedule": "^2.1.1",
    "axios": "^1.6.2",
    "uuid": "^9.0.0",
    "crypto-js": "^4.2.0"
  }
}
```

### 8.2 TPV Web (package.json)

```json
{
  "name": "@omerix/tpv-web",
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "electron": "^33.0.0",
    "electron-builder": "^24.9.1",
    "zustand": "^4.4.7",
    "dexie": "^4.0.1",
    "dexie-react-hooks": "^1.1.7",
    "@tanstack/react-query": "^5.0.0",
    "socket.io-client": "^4.7.2",
    "sonner": "^1.2.4",
    "lucide-react": "^0.294.0",
    "@radix-ui/react-dialog": "^1.0.5"
  }
}
```

---

## 9. Autenticación y Registro de TPV

### 9.1 Flujo de Registro de un Nuevo TPV

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE REGISTRO TPV                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. ADMIN GENERA TOKEN DE ACTIVACIÓN (desde Tralok Web)                     │
│     └─► POST /api/tpv/generar-token → { activationToken: "ABC123XYZ" }      │
│         ├─► Verifica licencia tiene TPVs disponibles                        │
│         ├─► Token válido 24h, un solo uso                                   │
│         └─► Token corto (8 chars) para escribir manualmente                 │
│                                                                              │
│  2. OPERADOR ACTIVA TPV (en el equipo físico)                               │
│     └─► Pantalla inicial muestra "Activar TPV"                              │
│     └─► Introduce: token + nombre TPV + almacén                             │
│     └─► POST /api/tpv/activar { token, nombre, almacenId }                  │
│         ├─► Servidor valida token no usado y no expirado                    │
│         ├─► Crea registro TPVRegistrado en BD central                       │
│         ├─► Incrementa usoActual.tpvsActuales en licencia                   │
│         └─► Devuelve { tpvId, tpvSecret, empresaId, config }                │
│                                                                              │
│  3. TPV GUARDA CREDENCIALES LOCALMENTE (cifradas)                           │
│     ├─► tpvId (identificador único)                                         │
│     ├─► tpvSecret (secreto para generar tokens)                             │
│     ├─► empresaId                                                           │
│     └─► serverUrl (URL del servidor Tralok)                                 │
│                                                                              │
│  4. SINCRONIZACIÓN INICIAL                                                   │
│     └─► Descarga productos, familias, clientes, usuarios                    │
│     └─► Descarga certificado VeriFactu de la empresa                        │
│     └─► TPV queda listo para operar                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Modelo de Datos - Servidor Central

#### TPV Registrado
```typescript
interface ITPVRegistrado {
  _id: string;
  empresaId: string;

  // Identificación
  codigo: string;              // "TPV-001" (auto-generado)
  nombre: string;              // "Caja Principal"
  deviceId: string;            // UUID único generado en activación

  // Autenticación
  secretHash: string;          // Hash del tpvSecret
  tokenVersion: number;        // Para invalidar tokens (se incrementa al revocar)

  // Configuración asignada
  almacenId: string;
  serieFactura: string;        // Serie para facturas simplificadas
  config: {
    permitirDescuentos: boolean;
    descuentoMaximo: number;
    permitirPrecioManual: boolean;
    modoOfflinePermitido: boolean;
    diasCacheProductos: number;
    impresoraTicket?: IConfigImpresora;
    impresoraCocina?: IConfigImpresora;
  };

  // Estado y monitoreo
  estado: 'activo' | 'suspendido' | 'desactivado';
  ultimoAcceso: Date;
  ultimaIP: string;
  ultimaSync: Date;
  versionApp: string;          // Versión del software TPV

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  desactivadoPor?: string;
  motivoDesactivacion?: string;
}
```

#### Token de Activación
```typescript
interface ITPVActivationToken {
  _id: string;
  empresaId: string;

  // Token
  token: string;               // 8 caracteres alfanuméricos (fácil de escribir)
  tokenHash: string;           // Hash para validación

  // Estado
  usado: boolean;
  tpvId?: string;              // Se llena cuando se usa

  // Expiración
  expiraEn: Date;              // 24h desde creación

  // Auditoría
  creadoPor: string;           // userId del admin
  usadoEn?: Date;
  usadoDesdeIP?: string;

  createdAt: Date;
}
```

### 9.3 Autenticación de Usuarios en TPV

#### Modelo de Usuario TPV (cache local)
```typescript
interface IUsuarioTPVCache {
  _id: string;                 // Mismo ID que en servidor
  empresaId: string;

  // Datos básicos
  nombre: string;
  email: string;
  avatar?: string;

  // Autenticación TPV
  pinHash: string;             // Hash del PIN (4-6 dígitos)
  pinSalt: string;

  // Permisos TPV
  permisos: IPermisosTPV;

  // Control
  activo: boolean;
  ultimoAcceso?: Date;

  // Sync
  ultimaActualizacion: Date;
}
```

#### Flujo de Login en TPV
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE LOGIN USUARIO TPV                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MODO ONLINE:                                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Usuario    │───►│  Validar    │───►│  Verificar  │───►│  Crear      │  │
│  │  ingresa    │    │  PIN en     │    │  usuarios   │    │  sesión     │  │
│  │  PIN        │    │  servidor   │    │  simultáneos│    │  local      │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                            │                  │                              │
│                            │         Si excede límite:                       │
│                            │         "Límite de usuarios                     │
│                            │          simultáneos alcanzado"                 │
│                            │                                                 │
│  MODO OFFLINE:                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                      │
│  │  Usuario    │───►│  Validar    │───►│  Crear      │                      │
│  │  ingresa    │    │  PIN en     │    │  sesión     │                      │
│  │  PIN        │    │  cache local│    │  local      │                      │
│  └─────────────┘    └─────────────┘    └─────────────┘                      │
│                                              │                               │
│                     ⚠️ Al recuperar conexión, se valida con servidor        │
│                        Si el usuario fue desactivado → cerrar sesión        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.4 Control de Usuarios Simultáneos

> **REGLA IMPORTANTE**: Cada TPV contratado incrementa automáticamente el límite de usuarios simultáneos en 1.
> Esto garantiza que siempre haya al menos un usuario disponible por cada TPV.

**Ejemplo de cálculo:**
- Plan Básico: 2 usuarios simultáneos
- TPVs contratados (add-on): 3
- **Total usuarios simultáneos**: 2 + 3 = 5

```typescript
// En servidor central
interface ISesionTPV {
  _id: string;
  empresaId: string;
  usuarioId: string;
  tpvId: string;

  // Sesión
  inicioSesion: Date;
  ultimaActividad: Date;
  activa: boolean;

  // Para detectar sesiones zombies
  heartbeatUltimo: Date;       // Ping cada 30 segundos

  // Metadata
  ip: string;
  tpvNombre: string;
}

// Lógica de control
async function validarLoginTPV(empresaId: string, usuarioId: string, tpvId: string) {
  // 1. Obtener licencia y límites
  const licencia = await Licencia.findOne({ empresaId }).populate('planId');
  const plan = licencia.planId;

  // 2. Calcular límite de usuarios simultáneos
  let limiteUsuarios = plan.limites.usuariosSimultaneos;

  // Sumar usuarios extra contratados como add-on
  const addonUsuarios = licencia.addOns.find(a => a.slug === 'usuarios-extra' && a.activo);
  if (addonUsuarios) {
    limiteUsuarios += addonUsuarios.cantidad;
  }

  // IMPORTANTE: Cada TPV contratado añade 1 usuario simultáneo
  const addonTPV = licencia.addOns.find(a => a.slug === 'tpv-extra' && a.activo);
  if (addonTPV) {
    limiteUsuarios += addonTPV.cantidad;
  }

  // También contar TPVs del plan base
  limiteUsuarios += plan.limites.tpvs || 0;

  // 3. Contar sesiones activas (excluyendo este usuario si ya tiene sesión)
  const sesionesActivas = await SesionTPV.countDocuments({
    empresaId,
    activa: true,
    usuarioId: { $ne: usuarioId },
    heartbeatUltimo: { $gte: new Date(Date.now() - 60000) } // Últimos 60s
  });

  // 4. Verificar límite
  if (sesionesActivas >= limiteUsuarios) {
    throw new Error(`Límite de ${limiteUsuarios} usuarios simultáneos alcanzado`);
  }

  // 5. Crear/actualizar sesión
  await SesionTPV.findOneAndUpdate(
    { empresaId, usuarioId, tpvId },
    {
      inicioSesion: new Date(),
      ultimaActividad: new Date(),
      activa: true,
      heartbeatUltimo: new Date()
    },
    { upsert: true }
  );

  return { ok: true };
}
```

### 9.5 Control de TPVs en Licencia

```typescript
// Al generar token de activación
async function generarTokenActivacionTPV(empresaId: string, usuarioId: string) {
  // 1. Verificar licencia activa
  const licencia = await Licencia.findOne({ empresaId }).populate('planId');

  if (!licencia.isActive()) {
    throw new Error('Licencia no activa');
  }

  // 2. Calcular límite de TPVs
  const plan = licencia.planId;
  let limiteTPVs = plan.limites.tpvs || 0;

  // Sumar TPVs extra contratados como add-on
  const addonTPV = licencia.addOns.find(a => a.slug === 'tpv-extra' && a.activo);
  if (addonTPV) {
    limiteTPVs += addonTPV.cantidad;
  }

  // 3. Verificar TPVs actuales
  if (licencia.usoActual.tpvsActuales >= limiteTPVs) {
    throw new Error(`Límite de ${limiteTPVs} TPVs alcanzado. Contrata más TPVs.`);
  }

  // 4. Verificar usuarios disponibles para el TPV
  // Si contratan más TPVs que usuarios, alertar
  if (licencia.usoActual.tpvsActuales >= plan.limites.usuariosSimultaneos) {
    // No bloquear, pero advertir
    console.warn(`Empresa ${empresaId}: Más TPVs que usuarios simultáneos permitidos`);
  }

  // 5. Generar token
  const token = generarTokenCorto(8); // ABC12XYZ

  await TPVActivationToken.create({
    empresaId,
    token,
    tokenHash: hashToken(token),
    usado: false,
    expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    creadoPor: usuarioId
  });

  return { token, expiraEn: '24 horas' };
}

// Al activar TPV
async function activarTPV(token: string, nombre: string, almacenId: string, deviceInfo: any) {
  // 1. Buscar y validar token
  const activationToken = await TPVActivationToken.findOne({
    tokenHash: hashToken(token),
    usado: false,
    expiraEn: { $gte: new Date() }
  });

  if (!activationToken) {
    throw new Error('Token inválido o expirado');
  }

  // 2. Crear TPV
  const tpvSecret = generarSecretoSeguro(32);
  const tpvCount = await TPVRegistrado.countDocuments({ empresaId: activationToken.empresaId });

  const tpv = await TPVRegistrado.create({
    empresaId: activationToken.empresaId,
    codigo: `TPV-${String(tpvCount + 1).padStart(3, '0')}`,
    nombre,
    deviceId: generarUUID(),
    secretHash: hashSecret(tpvSecret),
    tokenVersion: 1,
    almacenId,
    serieFactura: 'FS', // Factura Simplificada por defecto
    config: await getConfiguracionTPVDefecto(activationToken.empresaId),
    estado: 'activo',
    ultimaIP: deviceInfo.ip,
    versionApp: deviceInfo.version
  });

  // 3. Marcar token como usado
  activationToken.usado = true;
  activationToken.tpvId = tpv._id;
  activationToken.usadoEn = new Date();
  activationToken.usadoDesdeIP = deviceInfo.ip;
  await activationToken.save();

  // 4. Actualizar contador en licencia
  await Licencia.updateOne(
    { empresaId: activationToken.empresaId },
    { $inc: { 'usoActual.tpvsActuales': 1 } }
  );

  // 5. Obtener datos iniciales para el TPV
  const empresa = await Empresa.findById(activationToken.empresaId);

  return {
    tpvId: tpv._id,
    tpvSecret,  // ⚠️ Solo se devuelve UNA vez, el TPV debe guardarlo
    empresaId: activationToken.empresaId,
    empresaNombre: empresa.nombre,
    serverUrl: process.env.API_URL,
    config: tpv.config
  };
}
```

### 9.6 Datos Locales para Modo Offline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ALMACENAMIENTO LOCAL TPV                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MongoDB Local (puerto 27018 para no conflictar):                           │
│  ├── tpv_credenciales    → Credenciales cifradas del TPV                    │
│  ├── tpv_config          → Configuración del TPV                            │
│  ├── usuarios            → Usuarios con acceso (nombre, PIN, permisos)      │
│  ├── productos           → Catálogo de productos (usarEnTPV: true)          │
│  ├── familias            → Familias de productos                            │
│  ├── clientes            → Clientes (al menos el genérico)                  │
│  ├── formas_pago         → Formas de pago configuradas                      │
│  ├── tipos_iva           → Tipos de IVA                                     │
│  ├── series              → Series de documentos                             │
│  ├── ventas              → Ventas realizadas                                │
│  ├── cajas               → Sesiones de caja                                 │
│  ├── movimientos_caja    → Entradas/salidas de caja                         │
│  ├── cola_sync           → Operaciones pendientes de sincronizar            │
│  └── verifactu_log       → Log de envíos VeriFactu                          │
│                                                                              │
│  Credenciales (cifradas con clave derivada del hardware):                   │
│  ├── tpvId                                                                  │
│  ├── tpvSecret                                                              │
│  ├── empresaId                                                              │
│  ├── serverUrl                                                              │
│  └── certificadoVeriFactu (PKCS#12)                                         │
│                                                                              │
│  IndexedDB (cache para UI - acceso rápido):                                 │
│  ├── productos_ui        → Productos con imágenes                           │
│  ├── familias_ui         → Familias con iconos                              │
│  └── clientes_recientes  → Últimos clientes usados                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.7 Sincronización Bidireccional

```typescript
// Proceso de sincronización (ejecutado cada 30 segundos si hay conexión)
async function sincronizarTPV() {
  const estado = await checkConexion();

  if (!estado.online) {
    updateUIEstado('offline');
    return;
  }

  try {
    // 1. SUBIR: Operaciones pendientes (prioridad)
    await subirVentasPendientes();
    await subirCierresCajaPendientes();
    await subirMovimientosCajaPendientes();

    // 2. VERIFACTU: Enviar facturas pendientes
    await procesarColaVeriFactu();

    // 3. DESCARGAR: Actualizaciones del servidor
    const ultimaSync = await getUltimaSync();

    const actualizaciones = await api.get('/tpv/sync/descargar', {
      params: { desde: ultimaSync }
    });

    if (actualizaciones.productos.length > 0) {
      await actualizarProductosLocales(actualizaciones.productos);
    }

    if (actualizaciones.usuarios.length > 0) {
      await actualizarUsuariosLocales(actualizaciones.usuarios);
    }

    if (actualizaciones.config) {
      await actualizarConfigTPV(actualizaciones.config);
    }

    // 4. Actualizar timestamp
    await setUltimaSync(new Date());

    updateUIEstado('online', { ultimaSync: new Date() });

  } catch (error) {
    console.error('Error en sincronización:', error);
    updateUIEstado('error', { mensaje: error.message });
  }
}

// Heartbeat para control de sesiones (cada 30 segundos)
async function enviarHeartbeat() {
  if (!sesionActiva) return;

  try {
    await api.post('/tpv/heartbeat', {
      tpvId: getTpvId(),
      usuarioId: getUsuarioActivo(),
      cajaId: getCajaActiva()
    });
  } catch (error) {
    // Si falla, no es crítico - el servidor limpiará sesiones zombies
  }
}
```

---

## 10. Seguridad

### 10.1 Autenticación Local
- PIN de usuario (4-6 dígitos) para operaciones rápidas
- Token JWT firmado con tpvSecret para comunicación con servidor
- Certificado PKCS#12 para firma VeriFactu

### 10.2 Datos Sensibles
- Certificados almacenados cifrados (AES-256)
- tpvSecret cifrado con clave derivada del hardware
- Base de datos local con autenticación
- Comunicación HTTPS con servidor

### 10.3 Auditoría
- Log de todas las operaciones
- Registro de accesos (login/logout)
- Trazabilidad de cambios
- Eventos enviados al servidor para auditoría central

---

## 11. Periféricos TPV

### 11.1 Dispositivos Soportados

#### Impresora de Tickets
```typescript
interface IImpresoraTicket {
  tipo: 'usb' | 'red' | 'bluetooth' | 'serial';
  marca: string;                    // 'epson', 'star', 'bixolon', etc.
  modelo: string;
  conexion: {
    // USB
    vendorId?: string;
    productId?: string;
    // Red
    ip?: string;
    puerto?: number;                // Default 9100
    // Serial
    puerto_serie?: string;          // COM1, /dev/ttyUSB0
    baudRate?: number;
    // Bluetooth
    mac?: string;
  };
  config: {
    anchoTicket: 58 | 80;           // mm
    corteParcial: boolean;
    corteTotal: boolean;
    abrirCajon: boolean;            // Enviar pulso al imprimir
    logo?: string;                  // Base64 del logo
  };
}
```

#### Cajón Portamonedas
```typescript
interface ICajonPortamonedas {
  tipo: 'impresora' | 'usb' | 'serial';

  // Si es por impresora (RJ11 conectado a impresora)
  impresoraAsociada?: string;

  // Si es USB/Serial directo
  conexion?: {
    tipo: 'usb' | 'serial';
    puerto?: string;
  };

  // Configuración de pulso
  pulso: {
    pin: 2 | 5;                     // Pin del conector RJ11
    duracion: number;               // ms (default 100)
  };
}
```

#### Visor de Cliente
```typescript
interface IVisorCliente {
  tipo: 'serie' | 'usb' | 'red';
  protocolo: 'lcd' | 'vfd' | 'pole';
  conexion: {
    puerto?: string;                // COM1, /dev/ttyUSB0
    ip?: string;
    baudRate?: number;              // Default 9600
  };
  config: {
    lineas: 2 | 4;                  // Número de líneas
    caracteres: 20 | 40;            // Caracteres por línea
    mensajeBienvenida?: string;
    mensajeReposo?: string;
  };
}
```

#### Lector de Código de Barras
```typescript
interface ILectorCodigoBarras {
  tipo: 'usb' | 'bluetooth' | 'integrado';
  modo: 'teclado' | 'serial';       // Emulación teclado o comunicación serie
  sufijo?: string;                  // Carácter añadido al final (Enter, Tab)
  prefijo?: string;
}
```

#### Báscula
```typescript
interface IBascula {
  tipo: 'serie' | 'usb';
  protocolo: 'dialog06' | 'sics' | 'toledo' | 'custom';
  conexion: {
    puerto: string;
    baudRate: number;
  };
  config: {
    unidad: 'kg' | 'g' | 'lb';
    decimales: number;
  };
}
```

#### Datáfono / Terminal de Pago
```typescript
interface IDatafono {
  tipo: 'integrado' | 'standalone';
  protocolo?: 'redsys' | 'ceca' | 'addon' | 'ingenico';
  conexion?: {
    tipo: 'serie' | 'red';
    puerto?: string;
    ip?: string;
  };
}
```

### 11.2 Configuración de Periféricos en TPV

```typescript
interface IConfigPerifericosTPV {
  // Impresoras
  impresoraTicket?: IImpresoraTicket;
  impresoraCocina?: IImpresoraTicket;     // Para futuro restauración
  impresoraFactura?: IImpresoraTicket;    // Impresora A4

  // Cajón
  cajon?: ICajonPortamonedas;

  // Visor
  visor?: IVisorCliente;

  // Lectores
  lectorCodigoBarras?: ILectorCodigoBarras;
  lectorTarjetas?: ILectorCodigoBarras;   // Para tarjetas de fidelización

  // Otros
  bascula?: IBascula;
  datafono?: IDatafono;
}
```

### 11.3 Comandos ESC/POS para Impresora

```typescript
// Ejemplo de impresión de ticket con comandos ESC/POS
const ESC = '\x1B';
const GS = '\x1D';

const comandos = {
  init: ESC + '@',                         // Inicializar
  centrar: ESC + 'a' + '\x01',            // Centrar texto
  izquierda: ESC + 'a' + '\x00',          // Alinear izquierda
  derecha: ESC + 'a' + '\x02',            // Alinear derecha
  negrita: ESC + 'E' + '\x01',            // Negrita ON
  negritan: ESC + 'E' + '\x00',           // Negrita OFF
  dobleAlto: ESC + '!' + '\x10',          // Doble altura
  normal: ESC + '!' + '\x00',             // Tamaño normal
  corteParcial: GS + 'V' + '\x01',        // Corte parcial
  corteTotal: GS + 'V' + '\x00',          // Corte total
  abrirCajon: ESC + 'p' + '\x00\x19\xFA', // Pulso cajón pin 2
};
```

---

## 12. Stocks y Permisos

### 12.1 Consulta de Stock por Almacén

```typescript
// Endpoint para consulta de stock
GET /api/stocks/producto/:productoId

// Response
interface IStockResponse {
  productoId: string;
  nombre: string;
  stockTotal: number;
  almacenes: {
    almacenId: string;
    nombre: string;
    stock: number;
    reservado: number;
    disponible: number;
    ubicacion?: string;
  }[];
  // Solo si tiene permiso verCostes
  coste?: number;
  margen?: number;
}
```

### 12.2 Permisos de Usuario TPV

```typescript
interface IPermisosTPV {
  // Ventas
  realizarVentas: boolean;
  anularVentas: boolean;
  aplicarDescuentos: boolean;
  descuentoMaximo: number;            // Porcentaje máximo
  modificarPrecios: boolean;

  // Caja
  abrirCaja: boolean;
  cerrarCaja: boolean;
  movimientosCaja: boolean;
  verCajaOtros: boolean;              // Ver cajas de otros usuarios

  // Stocks
  consultarStock: boolean;
  verStockPorAlmacen: boolean;        // Ver desglose por almacén
  reservarStock: boolean;

  // Datos financieros
  verCostes: boolean;
  verMargenes: boolean;

  // Clientes
  crearClientes: boolean;
  verHistorialCliente: boolean;

  // Cobros
  cobrarFacturas: boolean;

  // Administración
  configurarTPV: boolean;
  accederConfiguracion: boolean;
}
```

### 12.3 UI Stock por Almacén

```
┌─────────────────────────────────────────────────────────────┐
│            STOCK - Hamburguesa Classic                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Stock Total: 45 unidades                                   │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Almacén              Stock   Reservado  Disponible │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │  🏪 Tienda Principal    20         2          18    │   │
│   │  🏭 Almacén Central     25         5          20    │   │
│   │  📦 Cocina               0         0           0    │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   [Solo si tiene permiso verCostes]                         │
│   ─────────────────────────────────                         │
│   Coste: 4.50€  │  PVP: 12.00€  │  Margen: 62.5%           │
│                                                              │
│   ┌────────────────┐                    ┌────────────────┐  │
│   │    CERRAR      │                    │    RESERVAR    │  │
│   └────────────────┘                    └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Roadmap Futuro - Restauración

> **NOTA**: Esta sección es un placeholder para futuras implementaciones.
> No se desarrollará en la fase inicial del TPV.

### 13.1 Funcionalidades Planificadas

#### Gestión de Salones
- Diseñador visual de salones (drag & drop)
- Mesas con estados (libre, ocupada, reservada, cuenta pedida)
- Zonas (terraza, interior, barra, VIP)
- Capacidad por mesa/zona

#### Comanderos / PDAs
- App Android para toma de comandas
- Sincronización en tiempo real
- Envío directo a cocina/barra
- Modificadores y notas de cocina

#### Kitchen Display System (KDS)
- Pantallas de cocina
- Estados de preparación
- Tiempos y alertas
- Priorización automática

#### Mesas y Cuentas
- Múltiples cuentas por mesa
- División de cuentas
- Transferir entre mesas
- Unir mesas

#### Reservas
- Calendario de reservas
- Gestión de disponibilidad
- Confirmación automática

### 13.2 Modelo de Datos Futuro (Restauración)

```typescript
// Solo referencia para futuro
interface ISalon {
  _id: string;
  nombre: string;
  plano: {
    ancho: number;
    alto: number;
    elementos: IElementoSalon[];
  };
}

interface IMesa {
  _id: string;
  salonId: string;
  numero: number;
  capacidad: number;
  posicion: { x: number; y: number };
  estado: 'libre' | 'ocupada' | 'reservada' | 'cuenta_pedida';
}

interface IComanda {
  _id: string;
  mesaId: string;
  lineas: ILineaComanda[];
  estado: 'abierta' | 'enviada' | 'preparando' | 'servida' | 'cerrada';
}
```

---

## 14. Próximos Pasos

### Fase 1: Estructura Base (Sprint 1)
- [ ] Crear workspace `apps/tpv`
- [ ] Configurar Electron + Next.js
- [ ] Configurar MongoDB local
- [ ] Crear modelos de datos

### Fase 2: UI TPV Core (Sprint 2)
- [ ] Pantalla principal de ventas
- [ ] Grid de productos/familias
- [ ] Carrito de compra
- [ ] Modal de cobro

### Fase 3: Caja (Sprint 3)
- [ ] Apertura/cierre de caja
- [ ] Movimientos entrada/salida
- [ ] Informe de cierre

### Fase 4: Sincronización (Sprint 4)
- [ ] Descarga de catálogo
- [ ] Subida de ventas
- [ ] Indicador de estado
- [ ] Resolución de conflictos

### Fase 5: VeriFactu (Sprint 5)
- [ ] Hash encadenado local
- [ ] Cola de envío
- [ ] Generación QR
- [ ] Envío a AEAT

### Fase 6: Extras (Sprint 6)
- [ ] Cobro de facturas
- [ ] Consulta de stocks
- [ ] Variantes y kits
- [ ] Modificadores

---

## Apéndice A: Configuración Electron

```javascript
// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // Quitar marco de ventana para look de kiosco
    frame: false,
    // Pantalla completa opcional
    fullscreen: false,
    // Icono de la app
    icon: path.join(__dirname, '../public/icon.png')
  });

  // En desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3001');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, cargar desde build de Next.js
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

---

## Apéndice B: Scripts de Desarrollo

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:web\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:web": "cd web && npm run dev",
    "dev:electron": "cd web && npm run electron:dev",
    "build": "npm run build:backend && npm run build:web",
    "build:backend": "cd backend && npm run build",
    "build:web": "cd web && npm run build && npm run electron:build",
    "package:win": "cd web && electron-builder --win",
    "package:mac": "cd web && electron-builder --mac",
    "package:linux": "cd web && electron-builder --linux"
  }
}
```
