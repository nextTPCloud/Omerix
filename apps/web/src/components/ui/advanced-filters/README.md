# Sistema de Filtros Avanzados

Componente reutilizable para filtrar datos en cualquier módulo del ERP.

## Características

- **Filtros por tipo de campo**: texto, número, fecha, selección, booleano
- **Operadores avanzados**: contiene, mayor que, entre, últimos N días, etc.
- **Chips visuales**: muestra filtros activos como badges eliminables
- **Guardar vistas**: permite guardar combinaciones de filtros
- **Conversión a API**: convierte filtros a query params para el backend

## Uso básico

```tsx
import { useState } from 'react';
import {
  AdvancedFilters,
  ActiveFilter,
  FilterableField,
  filtersToQueryParams
} from '@/components/ui/advanced-filters';

// 1. Definir campos filtrables
const FILTERABLE_FIELDS: FilterableField[] = [
  { key: 'codigo', label: 'Código', type: 'text' },
  { key: 'clienteNombre', label: 'Cliente', type: 'text' },
  { key: 'estado', label: 'Estado', type: 'select', options: [
    { value: 'borrador', label: 'Borrador' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'aceptado', label: 'Aceptado' },
  ]},
  { key: 'fecha', label: 'Fecha', type: 'date' },
  { key: 'total', label: 'Total', type: 'currency' },
  { key: 'activo', label: 'Activo', type: 'boolean' },
];

// 2. En tu componente
function MiPagina() {
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [search, setSearch] = useState('');

  // Convertir filtros a query params para la API
  const queryParams = filtersToQueryParams(filters);

  // Ejemplo: { estado: 'aceptado', totalMin: '100', totalMax: '500' }

  return (
    <AdvancedFilters
      fields={FILTERABLE_FIELDS}
      filters={filters}
      onFiltersChange={setFilters}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar presupuestos..."
      onSaveView={(name, filters) => {
        // Guardar vista en backend o localStorage
        console.log('Guardar vista:', name, filters);
      }}
    />
  );
}
```

## Tipos de operadores por campo

### Texto
- `contains` - Contiene
- `not_contains` - No contiene
- `equals` - Es exactamente
- `not_equals` - No es
- `starts_with` - Empieza por
- `ends_with` - Termina en
- `is_empty` - Está vacío
- `is_not_empty` - No está vacío

### Número / Moneda
- `equals` - Igual a
- `not_equals` - Distinto de
- `greater_than` - Mayor que
- `greater_or_equal` - Mayor o igual que
- `less_than` - Menor que
- `less_or_equal` - Menor o igual que
- `between` - Entre (dos valores)
- `is_empty` - Está vacío
- `is_not_empty` - No está vacío

### Fecha
- `equals` - Es
- `before` - Antes de
- `after` - Después de
- `between` - Entre (dos fechas)
- `last_n_days` - Últimos N días
- `next_n_days` - Próximos N días
- `this_week` - Esta semana
- `this_month` - Este mes
- `this_year` - Este año
- `is_empty` - Está vacío
- `is_not_empty` - No está vacío

### Selección
- `equals` - Es
- `not_equals` - No es
- `in` - Es alguno de
- `not_in` - No es ninguno de
- `is_empty` - Está vacío
- `is_not_empty` - No está vacío

### Booleano
- `is_true` - Sí
- `is_false` - No

## Conversión a Query Params

La función `filtersToQueryParams` convierte los filtros activos a parámetros que el backend puede procesar:

```tsx
// Ejemplo de filtros activos
const filters: ActiveFilter[] = [
  { id: '1', field: 'estado', fieldLabel: 'Estado', operator: 'equals', value: 'aceptado' },
  { id: '2', field: 'total', fieldLabel: 'Total', operator: 'between', value: 100, valueTo: 500 },
  { id: '3', field: 'fecha', fieldLabel: 'Fecha', operator: 'last_n_days', value: 30 },
];

// Resultado
const params = filtersToQueryParams(filters);
// {
//   estado: 'aceptado',
//   totalMin: '100',
//   totalMax: '500',
//   fechaDesde: '2024-11-10' // fecha de hace 30 días
// }
```

## Integración con backend existente

El sistema genera parámetros compatibles con los filtros existentes del backend:

| Operador | Parámetro generado | Ejemplo |
|----------|-------------------|---------|
| `equals` | `campo=valor` | `estado=aceptado` |
| `not_equals` | `campo_ne=valor` | `estado_ne=borrador` |
| `greater_than` | `campo_gt=valor` | `total_gt=100` |
| `greater_or_equal` | `campo_gte=valor` | `total_gte=100` |
| `less_than` | `campo_lt=valor` | `total_lt=500` |
| `less_or_equal` | `campo_lte=valor` | `total_lte=500` |
| `between` (números) | `campoMin` y `campoMax` | `totalMin=100&totalMax=500` |
| `between` (fechas) | `campoDesde` y `campoHasta` | `fechaDesde=2024-01-01&fechaHasta=2024-12-31` |
| `before` | `campoHasta=valor` | `fechaHasta=2024-06-01` |
| `after` | `campoDesde=valor` | `fechaDesde=2024-01-01` |

## Archivos

```
components/ui/advanced-filters/
├── index.ts              # Exportaciones
├── types.ts              # Tipos y helpers
├── AdvancedFilters.tsx   # Componente principal
├── AddFilterPopover.tsx  # Popover para añadir filtros
├── FilterChip.tsx        # Chips de filtros activos
└── README.md             # Esta documentación
```
