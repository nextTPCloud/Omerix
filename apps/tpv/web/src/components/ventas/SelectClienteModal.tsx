'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Search, User, Plus, Building2, Phone, Mail, Loader2 } from 'lucide-react';

interface Cliente {
  id: string;
  codigo: string;
  nombre: string;
  nif?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  esEmpresa: boolean;
}

interface SelectClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cliente: Cliente | null) => void;
  clienteActual?: Cliente | null;
}

// Clientes de ejemplo
const clientesEjemplo: Cliente[] = [
  {
    id: '1',
    codigo: 'CLI001',
    nombre: 'Juan García López',
    nif: '12345678A',
    telefono: '612345678',
    email: 'juan@email.com',
    esEmpresa: false,
  },
  {
    id: '2',
    codigo: 'CLI002',
    nombre: 'Empresa ABC S.L.',
    nif: 'B12345678',
    telefono: '912345678',
    email: 'info@empresaabc.com',
    direccion: 'Calle Principal 123, Madrid',
    esEmpresa: true,
  },
  {
    id: '3',
    codigo: 'CLI003',
    nombre: 'María Rodríguez',
    nif: '87654321B',
    telefono: '698765432',
    esEmpresa: false,
  },
  {
    id: '4',
    codigo: 'CLI004',
    nombre: 'Comercios XYZ S.A.',
    nif: 'A87654321',
    telefono: '913456789',
    email: 'contacto@xyz.es',
    direccion: 'Av. de la Industria 45, Barcelona',
    esEmpresa: true,
  },
];

export function SelectClienteModal({
  isOpen,
  onClose,
  onSelect,
  clienteActual,
}: SelectClienteModalProps) {
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar clientes
  useEffect(() => {
    if (!busqueda.trim()) {
      setClientes([]);
      return;
    }

    setLoading(true);
    // Simular búsqueda
    const timer = setTimeout(() => {
      const filtrados = clientesEjemplo.filter(
        (c) =>
          c.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
          c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          c.nif?.toLowerCase().includes(busqueda.toLowerCase()) ||
          c.telefono?.includes(busqueda)
      );
      setClientes(filtrados);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  const handleSelect = (cliente: Cliente) => {
    onSelect(cliente);
    handleClose();
  };

  const handlePublicoGeneral = () => {
    onSelect(null);
    handleClose();
  };

  const handleClose = () => {
    setBusqueda('');
    setClientes([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Seleccionar Cliente" size="lg">
      <div className="p-6">
        {/* Cliente actual */}
        {clienteActual && (
          <div className="mb-4 p-4 bg-primary-50 rounded-xl">
            <p className="text-sm text-primary-600 mb-1">Cliente actual</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  {clienteActual.esEmpresa ? (
                    <Building2 className="w-5 h-5 text-primary-600" />
                  ) : (
                    <User className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-primary-800">{clienteActual.nombre}</p>
                  {clienteActual.nif && (
                    <p className="text-sm text-primary-600">{clienteActual.nif}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handlePublicoGeneral}>
                Quitar
              </Button>
            </div>
          </div>
        )}

        {/* Búsqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, NIF, teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full h-12 pl-10 pr-4 border rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
            autoFocus
          />
        </div>

        {/* Resultados */}
        <div className="min-h-[300px] max-h-[400px] overflow-y-auto custom-scroll">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          )}

          {/* Sin búsqueda */}
          {!loading && !busqueda && (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <User className="w-12 h-12 mb-2" />
              <p>Introduce un término de búsqueda</p>
            </div>
          )}

          {/* Sin resultados */}
          {!loading && busqueda && clientes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Search className="w-12 h-12 mb-2" />
              <p>No se encontraron clientes</p>
            </div>
          )}

          {/* Lista de clientes */}
          {!loading && clientes.length > 0 && (
            <div className="space-y-2">
              {clientes.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => handleSelect(cliente)}
                  className="w-full p-4 bg-white border rounded-xl hover:border-primary-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        cliente.esEmpresa ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      {cliente.esEmpresa ? (
                        <Building2 className="w-6 h-6 text-blue-600" />
                      ) : (
                        <User className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{cliente.nombre}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
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

        {/* Acciones */}
        <div className="flex gap-3 mt-6 pt-6 border-t">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={handlePublicoGeneral}
          >
            Público General
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            icon={<Plus className="w-5 h-5" />}
          >
            Nuevo Cliente
          </Button>
        </div>
      </div>
    </Modal>
  );
}
