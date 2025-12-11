// Exportación principal del sistema de filtros avanzados
export { AdvancedFilters, filtersToQueryParams } from './AdvancedFilters';
export { AddFilterPopover } from './AddFilterPopover';
export { FilterChip, FilterChips } from './FilterChip';
export * from './types';

// Re-exportar helpers de persistencia
export { filtersToSaved, savedToFilters } from './types';
