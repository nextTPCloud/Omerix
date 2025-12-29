'use client';

import { useState, useMemo } from 'react';
import { X, Search, User, Building2, Phone } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';

export interface ClienteSeleccionado {
  id: string;
  codigo: string;
  nombre: string;
  nif?: string;
  telefono?: string;
  email?: string;
  esEmpresa: boolean;
}

interface SelectClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cliente: ClienteSeleccionado | null) => void;
  clienteActual?: ClienteSeleccionado | null;
}

export function SelectClienteModal({
  isOpen,
  onClose,
  onSelect,
  clienteActual,
}: SelectClienteModalProps) {
  const [busqueda, setBusqueda] = useState('');

  // Obtener clientes del dataStore
  const clientesData = useDataStore((state) => state.clientes);

  // Filtrar clientes según búsqueda
  const clientesFiltrados = useMemo(() => {
    if (!busqueda.trim()) {
      // Sin búsqueda, mostrar los primeros 20 clientes
      return clientesData.slice(0, 20).map((c) => ({
        id: c._id,
        codigo: c.codigo,
        nombre: c.nombre,
        nif: c.nif,
        telefono: c.telefono,
        email: c.email,
        esEmpresa: c.nif?.startsWith('B') || c.nif?.startsWith('A') || false,
      }));
    }

    const term = busqueda.toLowerCase();
    return clientesData
      .filter(
        (c) =>
          c.codigo.toLowerCase().includes(term) ||
          c.nombre.toLowerCase().includes(term) ||
          c.nif?.toLowerCase().includes(term) ||
          c.telefono?.includes(term)
      )
      .slice(0, 50)
      .map((c) => ({
        id: c._id,
        codigo: c.codigo,
        nombre: c.nombre,
        nif: c.nif,
        telefono: c.telefono,
        email: c.email,
        esEmpresa: c.nif?.startsWith('B') || c.nif?.startsWith('A') || false,
      }));
  }, [busqueda, clientesData]);

  const handleSelect = (cliente: ClienteSeleccionado) => {
    onSelect(cliente);
    handleClose();
  };

  const handlePublicoGeneral = () => {
    onSelect(null);
    handleClose();
  };

  const handleClose = () => {
    setBusqueda('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Seleccionar Cliente</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cliente actual */}
        {clienteActual && (
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {clienteActual.esEmpresa ? (
                    <Building2 className="w-5 h-5 text-blue-600" />
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-blue-800">{clienteActual.nombre}</p>
                  {clienteActual.nif && (
                    <p className="text-sm text-blue-600">{clienteActual.nif}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handlePublicoGeneral}
                className="text-xs px-2 py-1 bg-blue-200 hover:bg-blue-300 text-blue-700 rounded"
              >
                Quitar
              </button>
            </div>
          </div>
        )}

        {/* Búsqueda */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, NIF, teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="flex-1 overflow-y-auto p-2">
          {clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Search className="w-12 h-12 mb-2" />
              <p>No se encontraron clientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clientesFiltrados.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => handleSelect(cliente)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        cliente.esEmpresa ? 'bg-purple-100' : 'bg-gray-100'
                      }`}
                    >
                      {cliente.esEmpresa ? (
                        <Building2 className="w-5 h-5 text-purple-600" />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{cliente.nombre}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {cliente.nif && <span>{cliente.nif}</span>}
                        {cliente.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {cliente.telefono}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{cliente.codigo}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handlePublicoGeneral}
            className="w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
          >
            Público General
          </button>
        </div>
      </div>
    </div>
  );
}
