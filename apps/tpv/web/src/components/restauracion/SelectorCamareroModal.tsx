'use client';

import { useEffect } from 'react';
import { X, User, RefreshCw, Coffee, Clock, Ban } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRestauracionStore } from '@/stores/restauracionStore';
import { Camarero } from '@/services/restauracion.service';

interface SelectorCamareroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (camarero: Camarero | null) => void;
  camareroActual?: Camarero | null;
  salonId?: string;
}

export function SelectorCamareroModal({
  isOpen,
  onClose,
  onSelect,
  camareroActual,
  salonId,
}: SelectorCamareroModalProps) {
  const { camareros, cargando, cargarDatosRestauracion } = useRestauracionStore();

  // Cargar datos si no hay
  useEffect(() => {
    if (isOpen && camareros.length === 0) {
      cargarDatosRestauracion();
    }
  }, [isOpen, camareros.length, cargarDatosRestauracion]);

  // Filtrar camareros por salón si se especifica
  const camarerosFiltrados = salonId
    ? camareros.filter(
        (c) => c.salonesAsignados.length === 0 || c.salonesAsignados.includes(salonId)
      )
    : camareros;

  // Ordenar: primero activos, luego otros
  const camarerosOrdenados = [...camarerosFiltrados].sort((a, b) => {
    const orden: Record<Camarero['estado'], number> = {
      activo: 0,
      en_descanso: 1,
      fuera_turno: 2,
      inactivo: 3,
    };
    return orden[a.estado] - orden[b.estado];
  });

  const handleSeleccionar = (camarero: Camarero) => {
    if (camarero.estado === 'activo') {
      onSelect(camarero);
      onClose();
    }
  };

  const getEstadoInfo = (estado: Camarero['estado']) => {
    switch (estado) {
      case 'activo':
        return {
          label: 'Activo',
          color: 'bg-green-100 text-green-700 border-green-300',
          icon: User,
        };
      case 'en_descanso':
        return {
          label: 'En descanso',
          color: 'bg-amber-100 text-amber-700 border-amber-300',
          icon: Coffee,
        };
      case 'fuera_turno':
        return {
          label: 'Fuera de turno',
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          icon: Clock,
        };
      case 'inactivo':
        return {
          label: 'Inactivo',
          color: 'bg-gray-100 text-gray-500 border-gray-300',
          icon: Ban,
        };
      default:
        return {
          label: estado,
          color: 'bg-gray-100 text-gray-500 border-gray-300',
          icon: User,
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Seleccionar Camarero</h2>
              <p className="text-sm text-gray-500">
                {camareroActual ? `Actual: ${camareroActual.nombre}` : 'Asigna un camarero a la venta'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Lista de camareros */}
        <div className="flex-1 overflow-y-auto p-4">
          {cargando ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : camarerosOrdenados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <User className="w-12 h-12 mb-2 opacity-50" />
              <p>No hay camareros disponibles</p>
            </div>
          ) : (
            <div className="space-y-2">
              {camarerosOrdenados.map((camarero) => {
                const estadoInfo = getEstadoInfo(camarero.estado);
                const EstadoIcon = estadoInfo.icon;
                const esSeleccionado = camareroActual?._id === camarero._id;
                const puedeSeleccionar = camarero.estado === 'activo';

                return (
                  <button
                    key={camarero._id}
                    onClick={() => handleSeleccionar(camarero)}
                    disabled={!puedeSeleccionar}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                      ${puedeSeleccionar ? 'hover:border-primary-400 hover:bg-primary-50 cursor-pointer' : 'opacity-60 cursor-not-allowed'}
                      ${esSeleccionado ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' : 'border-gray-200'}
                    `}
                  >
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        backgroundColor: camarero.color || '#6366f1',
                      }}
                    >
                      {camarero.alias?.[0] || camarero.nombre[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-800">
                        {camarero.nombre}
                        {camarero.alias && (
                          <span className="text-gray-500 font-normal"> ({camarero.alias})</span>
                        )}
                      </div>
                      {camarero.salonesAsignados.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {camarero.salonesAsignados.length} salón(es) asignado(s)
                        </div>
                      )}
                    </div>

                    {/* Estado */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm ${estadoInfo.color}`}
                    >
                      <EstadoIcon className="w-3.5 h-3.5" />
                      <span>{estadoInfo.label}</span>
                    </div>

                    {/* Indicador de selección */}
                    {esSeleccionado && (
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
          {camareroActual && (
            <Button
              variant="ghost"
              onClick={() => {
                onSelect(null);
                onClose();
              }}
            >
              Sin camarero
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
