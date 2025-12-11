'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ActiveFilter, FilterableField, formatFilterDisplay } from './types';

interface FilterChipProps {
  filter: ActiveFilter;
  field: FilterableField;
  onRemove: () => void;
  onClick?: () => void;
  className?: string;
}

export function FilterChip({ filter, field, onRemove, onClick, className }: FilterChipProps) {
  const displayText = formatFilterDisplay(filter, field);

  return (
    <Badge
      variant="secondary"
      className={cn(
        'pl-2.5 pr-1 py-1 h-7 gap-1 font-normal text-xs cursor-pointer hover:bg-secondary/80 transition-colors',
        className
      )}
      onClick={onClick}
    >
      <span className="max-w-[200px] truncate">{displayText}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 p-0 hover:bg-destructive/20 rounded-full ml-1"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
}

interface FilterChipsProps {
  filters: ActiveFilter[];
  fields: FilterableField[];
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
  onFilterClick?: (filter: ActiveFilter) => void;
  className?: string;
}

export function FilterChips({
  filters,
  fields,
  onRemoveFilter,
  onClearAll,
  onFilterClick,
  className,
}: FilterChipsProps) {
  if (filters.length === 0) return null;

  const getField = (fieldKey: string) => fields.find(f => f.key === fieldKey);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {filters.map((filter) => {
        const field = getField(filter.field);
        if (!field) return null;

        return (
          <FilterChip
            key={filter.id}
            filter={filter}
            field={field}
            onRemove={() => onRemoveFilter(filter.id)}
            onClick={() => onFilterClick?.(filter)}
          />
        );
      })}

      {filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClearAll}
        >
          Limpiar todos
        </Button>
      )}
    </div>
  );
}
