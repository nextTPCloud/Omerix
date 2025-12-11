'use client';

import { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AddFilterPopover } from './AddFilterPopover';
import { FilterChips } from './FilterChip';
import {
  ActiveFilter,
  AdvancedFiltersProps,
  filtersToQueryParams,
} from './types';

// Generar ID único para filtros
function generateFilterId(): string {
  return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function AdvancedFilters({
  fields,
  filters,
  onFiltersChange,
  className,
  searchPlaceholder = 'Buscar...',
  searchValue = '',
  onSearchChange,
  onSaveView,
}: AdvancedFiltersProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');

  // Añadir un nuevo filtro
  const handleAddFilter = useCallback((filter: Omit<ActiveFilter, 'id'>) => {
    const newFilter: ActiveFilter = {
      ...filter,
      id: generateFilterId(),
    };
    onFiltersChange([...filters, newFilter]);
  }, [filters, onFiltersChange]);

  // Eliminar un filtro
  const handleRemoveFilter = useCallback((filterId: string) => {
    onFiltersChange(filters.filter(f => f.id !== filterId));
  }, [filters, onFiltersChange]);

  // Limpiar todos los filtros
  const handleClearAll = useCallback(() => {
    onFiltersChange([]);
    if (onSearchChange) {
      onSearchChange('');
    }
  }, [onFiltersChange, onSearchChange]);

  // Guardar vista
  const handleSaveView = () => {
    if (onSaveView && viewName.trim()) {
      onSaveView(viewName.trim(), filters);
      setShowSaveDialog(false);
      setViewName('');
    }
  };

  const hasActiveFilters = filters.length > 0 || searchValue.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Barra principal de filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Búsqueda global */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => onSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Botón añadir filtro */}
        <AddFilterPopover
          fields={fields}
          onAddFilter={handleAddFilter}
          existingFilters={filters}
        />

        {/* Indicador de filtros activos */}
        {filters.length > 0 && (
          <Badge variant="secondary" className="h-8 gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {filters.length} filtro{filters.length > 1 ? 's' : ''}
          </Badge>
        )}

        {/* Botón guardar vista */}
        {onSaveView && hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground"
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar vista
          </Button>
        )}

        {/* Botón limpiar todo */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-destructive"
            onClick={handleClearAll}
          >
            <X className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Chips de filtros activos */}
      {filters.length > 0 && (
        <FilterChips
          filters={filters}
          fields={fields}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAll}
        />
      )}

      {/* Dialog para guardar vista */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Guardar vista personalizada</DialogTitle>
            <DialogDescription>
              Guarda los filtros actuales como una vista para acceder rápidamente en el futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nombre de la vista (ej: Presupuestos pendientes)"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              autoFocus
            />
            {filters.length > 0 && (
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-2">Filtros incluidos:</p>
                <div className="flex flex-wrap gap-1">
                  {filters.map((filter) => {
                    const field = fields.find(f => f.key === filter.field);
                    return (
                      <Badge key={filter.id} variant="outline" className="text-xs">
                        {field?.label}: {filter.displayValue || filter.value}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveView} disabled={!viewName.trim()}>
              Guardar vista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Re-exportar utilidades y tipos
export { filtersToQueryParams };
export type { ActiveFilter, FilterableField, AdvancedFiltersProps } from './types';
