// ============================================
// TIPOS PARA FILTROS AVANZADOS
// ============================================

// Operadores disponibles según tipo de campo
export type TextOperator = 'contains' | 'not_contains' | 'equals' | 'not_equals' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty';
export type NumberOperator = 'equals' | 'not_equals' | 'greater_than' | 'greater_or_equal' | 'less_than' | 'less_or_equal' | 'between' | 'is_empty' | 'is_not_empty';
export type DateOperator = 'equals' | 'before' | 'after' | 'between' | 'last_n_days' | 'next_n_days' | 'this_week' | 'this_month' | 'this_year' | 'is_empty' | 'is_not_empty';
export type SelectOperator = 'equals' | 'not_equals' | 'in' | 'not_in' | 'is_empty' | 'is_not_empty';
export type BooleanOperator = 'is_true' | 'is_false';

export type FilterOperator = TextOperator | NumberOperator | DateOperator | SelectOperator | BooleanOperator;

// Tipo de campo
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'currency';

// Definición de un campo filtrable
export interface FilterableField {
  key: string;
  label: string;
  type: FieldType;
  // Para campos select, opciones disponibles
  options?: { value: string; label: string }[];
  // Placeholder personalizado
  placeholder?: string;
  // Si el campo es de moneda (para formatear)
  isCurrency?: boolean;
}

// Un filtro activo
export interface ActiveFilter {
  id: string; // UUID único para identificar el filtro
  field: string; // key del campo
  fieldLabel: string; // label del campo
  operator: FilterOperator;
  value: string | number | boolean | string[];
  // Para operadores "between"
  valueTo?: string | number;
  // Label formateado del valor (ej: "Aceptado" en vez de "aceptado")
  displayValue?: string;
}

// Props del componente principal
export interface AdvancedFiltersProps {
  fields: FilterableField[];
  filters: ActiveFilter[];
  onFiltersChange: (filters: ActiveFilter[]) => void;
  className?: string;
  // Texto del placeholder de búsqueda global
  searchPlaceholder?: string;
  // Valor de búsqueda global
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  // Callback para guardar vista
  onSaveView?: (name: string, filters: ActiveFilter[]) => void;
}

// ============================================
// CONFIGURACIÓN DE OPERADORES POR TIPO
// ============================================

export const TEXT_OPERATORS: { value: TextOperator; label: string }[] = [
  { value: 'contains', label: 'Contiene' },
  { value: 'not_contains', label: 'No contiene' },
  { value: 'equals', label: 'Es exactamente' },
  { value: 'not_equals', label: 'No es' },
  { value: 'starts_with', label: 'Empieza por' },
  { value: 'ends_with', label: 'Termina en' },
  { value: 'is_empty', label: 'Está vacío' },
  { value: 'is_not_empty', label: 'No está vacío' },
];

export const NUMBER_OPERATORS: { value: NumberOperator; label: string }[] = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Distinto de' },
  { value: 'greater_than', label: 'Mayor que' },
  { value: 'greater_or_equal', label: 'Mayor o igual que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'less_or_equal', label: 'Menor o igual que' },
  { value: 'between', label: 'Entre' },
  { value: 'is_empty', label: 'Está vacío' },
  { value: 'is_not_empty', label: 'No está vacío' },
];

export const DATE_OPERATORS: { value: DateOperator; label: string }[] = [
  { value: 'equals', label: 'Es' },
  { value: 'before', label: 'Antes de' },
  { value: 'after', label: 'Después de' },
  { value: 'between', label: 'Entre' },
  { value: 'last_n_days', label: 'Últimos N días' },
  { value: 'next_n_days', label: 'Próximos N días' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'this_year', label: 'Este año' },
  { value: 'is_empty', label: 'Está vacío' },
  { value: 'is_not_empty', label: 'No está vacío' },
];

export const SELECT_OPERATORS: { value: SelectOperator; label: string }[] = [
  { value: 'equals', label: 'Es' },
  { value: 'not_equals', label: 'No es' },
  { value: 'in', label: 'Es alguno de' },
  { value: 'not_in', label: 'No es ninguno de' },
  { value: 'is_empty', label: 'Está vacío' },
  { value: 'is_not_empty', label: 'No está vacío' },
];

export const BOOLEAN_OPERATORS: { value: BooleanOperator; label: string }[] = [
  { value: 'is_true', label: 'Sí' },
  { value: 'is_false', label: 'No' },
];

// Obtener operadores según tipo de campo
export function getOperatorsForType(type: FieldType) {
  switch (type) {
    case 'text':
      return TEXT_OPERATORS;
    case 'number':
    case 'currency':
      return NUMBER_OPERATORS;
    case 'date':
      return DATE_OPERATORS;
    case 'select':
      return SELECT_OPERATORS;
    case 'boolean':
      return BOOLEAN_OPERATORS;
    default:
      return TEXT_OPERATORS;
  }
}

// Operadores que no necesitan valor
export const NO_VALUE_OPERATORS: FilterOperator[] = [
  'is_empty',
  'is_not_empty',
  'this_week',
  'this_month',
  'this_year',
  'is_true',
  'is_false',
];

// Operadores que necesitan dos valores (between)
export const RANGE_OPERATORS: FilterOperator[] = ['between'];

// ============================================
// HELPERS PARA FORMATEAR FILTROS
// ============================================

export function getOperatorLabel(operator: FilterOperator, type: FieldType): string {
  const operators = getOperatorsForType(type);
  const found = operators.find(op => op.value === operator);
  return found?.label || operator;
}

export function formatFilterDisplay(filter: ActiveFilter, field: FilterableField): string {
  const operatorLabel = getOperatorLabel(filter.operator, field.type);

  if (NO_VALUE_OPERATORS.includes(filter.operator)) {
    return `${field.label} ${operatorLabel.toLowerCase()}`;
  }

  if (RANGE_OPERATORS.includes(filter.operator) && filter.valueTo !== undefined) {
    return `${field.label} ${operatorLabel.toLowerCase()} ${filter.value} y ${filter.valueTo}`;
  }

  const displayValue = filter.displayValue || filter.value;
  return `${field.label} ${operatorLabel.toLowerCase()} ${displayValue}`;
}

// ============================================
// CONVERSIÓN PARA PERSISTENCIA
// ============================================

// Re-exportar el tipo desde configuracion.service para consistencia
import type { SavedAdvancedFilter } from '@/services/configuracion.service';
export type { SavedAdvancedFilter };

// Convertir ActiveFilter[] a formato guardable (sin ids temporales)
export function filtersToSaved(filters: ActiveFilter[]): SavedAdvancedFilter[] {
  return filters.map(f => ({
    field: f.field,
    operator: f.operator,
    value: f.value,
    valueTo: f.valueTo,
  }));
}

// Restaurar ActiveFilter[] desde formato guardado
export function savedToFilters(
  saved: SavedAdvancedFilter[],
  fields: FilterableField[]
): ActiveFilter[] {
  return saved.map((s, index) => {
    const field = fields.find(f => f.key === s.field);
    const displayValue = field?.options?.find(o => o.value === s.value)?.label;

    return {
      id: `restored_${Date.now()}_${index}`,
      field: s.field,
      fieldLabel: field?.label || s.field,
      operator: s.operator as FilterOperator,
      value: s.value,
      valueTo: s.valueTo,
      displayValue,
    };
  });
}

// ============================================
// CONVERSIÓN A QUERY PARAMS PARA API
// ============================================

export function filtersToQueryParams(filters: ActiveFilter[]): Record<string, string> {
  const params: Record<string, string> = {};

  filters.forEach(filter => {
    const key = filter.field;
    const op = filter.operator;
    const val = filter.value;
    const valTo = filter.valueTo;

    // Mapear operadores a formato de query que el backend entienda
    switch (op) {
      case 'contains':
        params[key] = String(val);
        break;
      case 'equals':
        params[key] = String(val);
        break;
      case 'not_equals':
        params[`${key}_ne`] = String(val);
        break;
      case 'greater_than':
        params[`${key}_gt`] = String(val);
        break;
      case 'greater_or_equal':
        params[`${key}_gte`] = String(val);
        break;
      case 'less_than':
        params[`${key}_lt`] = String(val);
        break;
      case 'less_or_equal':
        params[`${key}_lte`] = String(val);
        break;
      case 'between':
        if (key.includes('fecha') || key.includes('date')) {
          params[`${key}Desde`] = String(val);
          params[`${key}Hasta`] = String(valTo);
        } else {
          params[`${key}Min`] = String(val);
          params[`${key}Max`] = String(valTo);
        }
        break;
      case 'before':
        params[`${key}Hasta`] = String(val);
        break;
      case 'after':
        params[`${key}Desde`] = String(val);
        break;
      case 'last_n_days':
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - Number(val));
        params[`${key}Desde`] = daysAgo.toISOString().split('T')[0];
        break;
      case 'next_n_days':
        const daysAhead = new Date();
        daysAhead.setDate(daysAhead.getDate() + Number(val));
        params[`${key}Hasta`] = daysAhead.toISOString().split('T')[0];
        break;
      case 'this_week':
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        params[`${key}Desde`] = weekStart.toISOString().split('T')[0];
        params[`${key}Hasta`] = weekEnd.toISOString().split('T')[0];
        break;
      case 'this_month':
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        params[`${key}Desde`] = monthStart.toISOString().split('T')[0];
        params[`${key}Hasta`] = monthEnd.toISOString().split('T')[0];
        break;
      case 'this_year':
        const yearStart = new Date(new Date().getFullYear(), 0, 1);
        const yearEnd = new Date(new Date().getFullYear(), 11, 31);
        params[`${key}Desde`] = yearStart.toISOString().split('T')[0];
        params[`${key}Hasta`] = yearEnd.toISOString().split('T')[0];
        break;
      case 'in':
        if (Array.isArray(val)) {
          params[`${key}_in`] = val.join(',');
        }
        break;
      case 'not_in':
        if (Array.isArray(val)) {
          params[`${key}_nin`] = val.join(',');
        }
        break;
      case 'is_empty':
        params[`${key}_empty`] = 'true';
        break;
      case 'is_not_empty':
        params[`${key}_exists`] = 'true';
        break;
      case 'is_true':
        params[key] = 'true';
        break;
      case 'is_false':
        params[key] = 'false';
        break;
      case 'starts_with':
        params[`${key}_sw`] = String(val);
        break;
      case 'ends_with':
        params[`${key}_ew`] = String(val);
        break;
      case 'not_contains':
        params[`${key}_nc`] = String(val);
        break;
    }
  });

  return params;
}
