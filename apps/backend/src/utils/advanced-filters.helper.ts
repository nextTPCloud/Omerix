/**
 * Helper para procesar filtros avanzados del frontend
 * Convierte operadores como _ne, _gt, _lt, etc. a queries de MongoDB
 */

export interface AdvancedFilterResult {
  [key: string]: any;
}

/**
 * Procesa los query params y extrae los filtros avanzados
 * @param query - Query params del request
 * @param allowedFields - Lista de campos permitidos para filtrar
 * @returns Objeto con filtros MongoDB
 */
export function parseAdvancedFilters(
  query: Record<string, any>,
  allowedFields: string[]
): AdvancedFilterResult {
  const filters: AdvancedFilterResult = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;

    // Detectar operador en el key
    const operatorMatch = key.match(/^(.+)_(ne|gt|gte|lt|lte|in|nin|sw|ew|nc|empty|exists)$/);

    if (operatorMatch) {
      const [, fieldName, operator] = operatorMatch;

      // Verificar si el campo está permitido
      if (!allowedFields.includes(fieldName)) continue;

      switch (operator) {
        case 'ne': // Not equals
          filters[fieldName] = { $ne: value };
          break;

        case 'gt': // Greater than
          if (!filters[fieldName]) filters[fieldName] = {};
          filters[fieldName].$gt = isNaN(Number(value)) ? value : Number(value);
          break;

        case 'gte': // Greater than or equal
          if (!filters[fieldName]) filters[fieldName] = {};
          filters[fieldName].$gte = isNaN(Number(value)) ? value : Number(value);
          break;

        case 'lt': // Less than
          if (!filters[fieldName]) filters[fieldName] = {};
          filters[fieldName].$lt = isNaN(Number(value)) ? value : Number(value);
          break;

        case 'lte': // Less than or equal
          if (!filters[fieldName]) filters[fieldName] = {};
          filters[fieldName].$lte = isNaN(Number(value)) ? value : Number(value);
          break;

        case 'in': // In array
          const inValues = String(value).split(',').map(v => v.trim());
          filters[fieldName] = { $in: inValues };
          break;

        case 'nin': // Not in array
          const ninValues = String(value).split(',').map(v => v.trim());
          filters[fieldName] = { $nin: ninValues };
          break;

        case 'sw': // Starts with
          filters[fieldName] = { $regex: `^${escapeRegex(value)}`, $options: 'i' };
          break;

        case 'ew': // Ends with
          filters[fieldName] = { $regex: `${escapeRegex(value)}$`, $options: 'i' };
          break;

        case 'nc': // Not contains
          filters[fieldName] = { $not: { $regex: escapeRegex(value), $options: 'i' } };
          break;

        case 'empty': // Is empty/null
          if (value === 'true') {
            filters[fieldName] = { $in: [null, '', undefined] };
          }
          break;

        case 'exists': // Is not empty
          if (value === 'true') {
            filters[fieldName] = { $nin: [null, '', undefined], $exists: true };
          }
          break;
      }
    }
  }

  return filters;
}

/**
 * Procesa filtros de rango (Min/Max, Desde/Hasta)
 * @param query - Query params del request
 * @param fieldMappings - Mapeo de campos { queryPrefix: mongoField }
 * @returns Objeto con filtros MongoDB
 */
export function parseRangeFilters(
  query: Record<string, any>,
  fieldMappings: Record<string, string>
): AdvancedFilterResult {
  const filters: AdvancedFilterResult = {};

  for (const [prefix, mongoField] of Object.entries(fieldMappings)) {
    const minKey = `${prefix}Min`;
    const maxKey = `${prefix}Max`;
    const desdeKey = `${prefix}Desde`;
    const hastaKey = `${prefix}Hasta`;

    // Procesar Min/Max (para números)
    if (query[minKey] || query[maxKey]) {
      if (!filters[mongoField]) filters[mongoField] = {};
      if (query[minKey]) filters[mongoField].$gte = Number(query[minKey]);
      if (query[maxKey]) filters[mongoField].$lte = Number(query[maxKey]);
    }

    // Procesar Desde/Hasta (para fechas)
    if (query[desdeKey] || query[hastaKey]) {
      if (!filters[mongoField]) filters[mongoField] = {};
      if (query[desdeKey]) filters[mongoField].$gte = new Date(query[desdeKey]);
      if (query[hastaKey]) filters[mongoField].$lte = new Date(query[hastaKey]);
    }
  }

  return filters;
}

/**
 * Escapa caracteres especiales de regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Combina filtros existentes con filtros avanzados
 * @param existingFilters - Filtros ya construidos
 * @param advancedFilters - Filtros avanzados parseados
 * @returns Filtros combinados
 */
export function mergeFilters(
  existingFilters: Record<string, any>,
  advancedFilters: AdvancedFilterResult
): Record<string, any> {
  const merged = { ...existingFilters };

  for (const [key, value] of Object.entries(advancedFilters)) {
    if (merged[key]) {
      // Si ya existe el filtro, combinar si ambos son objetos
      if (typeof merged[key] === 'object' && typeof value === 'object') {
        merged[key] = { ...merged[key], ...value };
      } else {
        // El filtro avanzado tiene prioridad
        merged[key] = value;
      }
    } else {
      merged[key] = value;
    }
  }

  return merged;
}
