'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, ChevronRight, Calendar, Hash, Type, List, ToggleLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import {
  ActiveFilter,
  FilterableField,
  FilterOperator,
  FieldType,
  getOperatorsForType,
  NO_VALUE_OPERATORS,
  RANGE_OPERATORS,
} from './types';

// Iconos por tipo de campo
const fieldTypeIcons: Record<FieldType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  currency: <Hash className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  select: <List className="h-4 w-4" />,
  boolean: <ToggleLeft className="h-4 w-4" />,
};

interface AddFilterPopoverProps {
  fields: FilterableField[];
  onAddFilter: (filter: Omit<ActiveFilter, 'id'>) => void;
  existingFilters?: ActiveFilter[];
  className?: string;
}

type Step = 'field' | 'operator' | 'value';

export function AddFilterPopover({
  fields,
  onAddFilter,
  existingFilters = [],
  className,
}: AddFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('field');
  const [selectedField, setSelectedField] = useState<FilterableField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator | null>(null);
  const [value, setValue] = useState<string>('');
  const [valueTo, setValueTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('field');
        setSelectedField(null);
        setSelectedOperator(null);
        setValue('');
        setValueTo('');
        setSearchQuery('');
      }, 200);
    }
  }, [open]);

  // Filtrar campos disponibles (excluyendo los que ya tienen filtro simple)
  const availableFields = fields.filter(field => {
    // Permitir múltiples filtros del mismo campo si son operadores diferentes
    return true;
  });

  const filteredFields = availableFields.filter(field =>
    field.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectField = (field: FilterableField) => {
    setSelectedField(field);
    setStep('operator');
  };

  const handleSelectOperator = (operator: FilterOperator) => {
    setSelectedOperator(operator);

    // Si el operador no necesita valor, añadir filtro directamente
    if (NO_VALUE_OPERATORS.includes(operator)) {
      handleAddFilter(operator, null, null);
    } else {
      setStep('value');
    }
  };

  const handleAddFilter = (
    operator: FilterOperator = selectedOperator!,
    val: string | null = value,
    valTo: string | null = valueTo
  ) => {
    if (!selectedField) return;

    // Obtener label del valor para campos select
    let displayValue: string | undefined;
    if (selectedField.type === 'select' && selectedField.options) {
      const option = selectedField.options.find(o => o.value === val);
      displayValue = option?.label;
    }

    onAddFilter({
      field: selectedField.key,
      fieldLabel: selectedField.label,
      operator,
      value: val ?? '',
      valueTo: RANGE_OPERATORS.includes(operator) && valTo ? valTo : undefined,
      displayValue,
    });

    setOpen(false);
  };

  const operators = selectedField ? getOperatorsForType(selectedField.type) : [];
  const needsRangeValue = selectedOperator && RANGE_OPERATORS.includes(selectedOperator);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8 border-dashed', className)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir filtro
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        {/* Step 1: Seleccionar campo */}
        {step === 'field' && (
          <Command>
            <CommandInput
              placeholder="Buscar campo..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No se encontraron campos.</CommandEmpty>
              <CommandGroup heading="Campos disponibles">
                {filteredFields.map((field) => (
                  <CommandItem
                    key={field.key}
                    value={field.key}
                    onSelect={() => handleSelectField(field)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-muted-foreground">
                      {fieldTypeIcons[field.type]}
                    </span>
                    <span>{field.label}</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}

        {/* Step 2: Seleccionar operador */}
        {step === 'operator' && selectedField && (
          <div className="p-2">
            <div className="flex items-center gap-2 px-2 py-1.5 mb-2 bg-muted rounded-md">
              <span className="text-muted-foreground">
                {fieldTypeIcons[selectedField.type]}
              </span>
              <span className="font-medium text-sm">{selectedField.label}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-xs"
                onClick={() => setStep('field')}
              >
                Cambiar
              </Button>
            </div>
            <div className="space-y-1">
              {operators.map((op) => (
                <button
                  key={op.value}
                  className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-muted transition-colors"
                  onClick={() => handleSelectOperator(op.value)}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Introducir valor */}
        {step === 'value' && selectedField && selectedOperator && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-muted rounded-md">
              <span className="text-muted-foreground">
                {fieldTypeIcons[selectedField.type]}
              </span>
              <span className="font-medium text-sm">{selectedField.label}</span>
              <span className="text-muted-foreground text-sm">
                {operators.find(o => o.value === selectedOperator)?.label.toLowerCase()}
              </span>
            </div>

            {/* Campo de valor según tipo */}
            <div className="space-y-2">
              {selectedField.type === 'select' && selectedField.options ? (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedField.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : selectedField.type === 'date' ? (
                <div className="space-y-2">
                  {selectedOperator === 'last_n_days' || selectedOperator === 'next_n_days' ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Número de días"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        min={1}
                      />
                      <span className="text-sm text-muted-foreground">días</span>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="date"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                      />
                      {needsRangeValue && (
                        <>
                          <Label className="text-xs text-muted-foreground">hasta</Label>
                          <Input
                            type="date"
                            value={valueTo}
                            onChange={(e) => setValueTo(e.target.value)}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              ) : selectedField.type === 'number' || selectedField.type === 'currency' ? (
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder={selectedField.placeholder || 'Valor'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    step={selectedField.type === 'currency' ? '0.01' : '1'}
                  />
                  {needsRangeValue && (
                    <>
                      <Label className="text-xs text-muted-foreground">y</Label>
                      <Input
                        type="number"
                        placeholder="Hasta"
                        value={valueTo}
                        onChange={(e) => setValueTo(e.target.value)}
                        step={selectedField.type === 'currency' ? '0.01' : '1'}
                      />
                    </>
                  )}
                </div>
              ) : (
                <Input
                  type="text"
                  placeholder={selectedField.placeholder || 'Valor'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('operator')}
              >
                Atrás
              </Button>
              <Button
                size="sm"
                onClick={() => handleAddFilter()}
                disabled={!value && !NO_VALUE_OPERATORS.includes(selectedOperator)}
              >
                Aplicar filtro
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
