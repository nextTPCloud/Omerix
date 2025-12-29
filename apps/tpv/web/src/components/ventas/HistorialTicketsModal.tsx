'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Receipt,
  Search,
  Printer,
  Eye,
  Calendar,
  Clock,
  User,
  CreditCard,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import { useCajaStore } from '@/stores/cajaStore';

interface HistorialTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Ticket {
  id: string;
  numero: string;
  fecha: Date;
  usuarioNombre: string;
  total: number;
  metodoPago: string;
  lineas: number;
}

export function HistorialTicketsModal({ isOpen, onClose }: HistorialTicketsModalProps) {
  const [busqueda, setBusqueda] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(null);
  const [cargando, setCargando] = useState(false);

  const { movimientos } = useCajaStore();

  // Cargar tickets de los movimientos de venta
  useEffect(() => {
    if (isOpen) {
      const ticketsVenta = movimientos
        .filter((m) => m.tipo === 'venta')
        .map((m, index) => ({
          id: m.id,
          numero: `T-${String(index + 1).padStart(4, '0')}`,
          fecha: new Date(m.fecha),
          usuarioNombre: m.usuarioNombre,
          total: m.importe,
          metodoPago: m.metodoPago || 'efectivo',
          lineas: 1, // Simplificado
        }))
        .reverse(); // Mas recientes primero

      setTickets(ticketsVenta);
    }
  }, [isOpen, movimientos]);

  // Filtrar tickets
  const ticketsFiltrados = tickets.filter((t) => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      t.numero.toLowerCase().includes(term) ||
      t.usuarioNombre.toLowerCase().includes(term)
    );
  });

  const handleReimprimir = (ticket: Ticket) => {
    console.log('Reimprimir ticket:', ticket);
    // TODO: Implementar reimpresion
    alert(`Reimprimiendo ticket ${ticket.numero}...`);
  };

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'tarjeta':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'efectivo':
      default:
        return <Banknote className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historial de Tickets" size="xl">
      <div className="p-4">
        {/* Barra de busqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por numero de ticket o usuario..."
            className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Lista de tickets */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {ticketsFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No hay tickets</p>
              <p className="text-sm">Los tickets de esta sesion apareceran aqui</p>
            </div>
          ) : (
            ticketsFiltrados.map((ticket) => (
              <div
                key={ticket.id}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  ticketSeleccionado?.id === ticket.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setTicketSeleccionado(ticket)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{ticket.numero}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ticket.fecha.toLocaleDateString('es-ES')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ticket.fecha.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ticket.usuarioNombre}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary-600">
                        {ticket.total.toFixed(2)} EUR
                      </p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        {getMetodoPagoIcon(ticket.metodoPago)}
                        <span className="capitalize">{ticket.metodoPago}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTicketSeleccionado(ticket);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReimprimir(ticket);
                        }}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumen */}
        {tickets.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total de la sesion</p>
              <p className="text-lg font-bold">
                {tickets.length} tickets - {tickets.reduce((acc, t) => acc + t.total, 0).toFixed(2)} EUR
              </p>
            </div>
            <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />}>
              Actualizar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
