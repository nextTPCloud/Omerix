# Tralok TPV

Punto de Venta con soporte offline y VeriFactu para el ERP Tralok.

## Arquitectura

```
apps/tpv/
├── backend/          # API local Express + MongoDB
├── web/              # Frontend Next.js + Electron
├── shared/           # Tipos compartidos
└── package.json      # Workspace principal
```

## Requisitos

- Node.js 18+
- MongoDB 7+ (local)
- Electron 28+

## Instalación

```bash
# Desde el directorio raíz del monorepo
cd apps/tpv

# Instalar dependencias
npm install

# Copiar configuración
cp .env.example .env
```

## Desarrollo

```bash
# Iniciar backend y frontend
npm run dev

# Solo backend
npm run dev:backend

# Solo frontend
npm run dev:web

# Electron (desarrollo)
cd web && npm run electron:dev
```

## Producción

```bash
# Compilar todo
npm run build

# Crear instalador Windows
npm run package
```

## Características

- **Modo Offline**: Funciona sin conexión a internet
- **VeriFactu**: Cumplimiento normativo español
- **Sincronización**: Cola automática de sincronización
- **Periféricos**: Soporte para impresora, cajón, visor, báscula, datáfono

## Estructura del Frontend

```
web/src/
├── app/              # Páginas Next.js
├── components/       # Componentes React
│   ├── ventas/       # Componentes de venta
│   ├── caja/         # Componentes de caja
│   ├── productos/    # Catálogo de productos
│   └── ui/           # Componentes base
├── stores/           # Estado Zustand
│   ├── ventaStore    # Venta actual
│   ├── cajaStore     # Estado de caja
│   └── syncStore     # Sincronización
├── services/         # APIs
└── hooks/            # Hooks personalizados
```

## Documentación

Ver [TPV-DESIGN.md](../../docs/TPV-DESIGN.md) para documentación completa.
