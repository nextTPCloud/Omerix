'use client';

import { useRef, useEffect } from 'react';
import type { Familia } from '@/stores/dataStore';

interface Props {
  familias: Familia[];
  selectedFamilia: string | null;
  onSelectFamilia: (familiaId: string) => void;
}

/**
 * Tabs de familias de productos
 * Scrollable horizontalmente
 */
export function FamilyTabs({ familias, selectedFamilia, onSelectFamilia }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll al elemento seleccionado
  useEffect(() => {
    if (selectedFamilia && scrollRef.current) {
      const selectedElement = scrollRef.current.querySelector(
        `[data-familia="${selectedFamilia}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedFamilia]);

  if (familias.length === 0) {
    return null;
  }

  return (
    <div
      ref={scrollRef}
      className="bg-white border-b border-gray-200 flex overflow-x-auto scrollbar-hide"
    >
      {familias.map((familia) => {
        const isSelected = familia._id === selectedFamilia;
        return (
          <button
            key={familia._id}
            data-familia={familia._id}
            onClick={() => onSelectFamilia(familia._id)}
            className={`flex-shrink-0 px-6 py-4 font-medium transition-all border-b-2 ${
              isSelected
                ? 'text-primary border-primary bg-primary/5'
                : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50'
            }`}
            style={isSelected && familia.color ? { borderColor: familia.color, color: familia.color } : {}}
          >
            {familia.nombre}
          </button>
        );
      })}
    </div>
  );
}
