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
  Filter,
  Globe,
  Store,
  Loader2,
} from 'lucide-react';
import { useCajaStore } from '@/stores/cajaStore';
import { useAuthStore } from '@/stores/authStore';
import { tpvApi } from '@/services/api';
import { printerService } from '@/services/printer.service';
import { useDataStore } from '@/stores/dataStore';

interface HistorialTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Ticket {
  id: string;
  numero: string;
  serie: string;
  fecha: Date;
  usuarioNombre: string;
  tpvNombre: string;
  total: number;
  metodoPago: string;
  lineas: Array<{
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
    componentesKit?: Array<{ nombre: string; cantidad: number }>;
  }>;
  clienteNombre?: string;
}

type ModoVista = 'sesion' | 'busqueda';

export function HistorialTicketsModal({ isOpen, onClose }: HistorialTicketsModalProps) {
  const [busqueda, setBusqueda] = useState('');
  const [modoVista, setModoVista] = useState<ModoVista>('sesion');
  const [ticketsSesion, setTicketsSesion] = useState<Ticket[]>([]);
  const [ticketsBusqueda, setTicketsBusqueda] = useState<Ticket[]>([]);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

  const { movimientos } = useCajaStore();
  const tpvConfig = useAuthStore((state) => state.tpvConfig);
  const empresaConfig = useDataStore((state) => state.empresaConfig);

  // Cargar tickets de la sesion actual (desde movimientos de caja)
  useEffect(() => {
    if (isOpen) {
      const ticketsVenta = movimientos
        .filter((m) => m.tipo === 'venta')
        .map((m, index) => ({
          id: m.id,
          numero: String(index + 1).padStart(4, '0'),
          serie: tpvConfig?.serieFactura || 'FS',
          fecha: new Date(m.fecha),
          usuarioNombre: m.usuarioNombre,
          tpvNombre: tpvConfig?.tpvNombre || 'TPV',
          total: m.importe,
          metodoPago: m.metodoPago || 'efectivo',
          lineas: [], // No tenemos las lineas en el movimiento
        }))
        .reverse();

      setTicketsSesion(ticketsVenta);
    }
  }, [isOpen, movimientos, tpvConfig]);

  // Buscar tickets en el backend
  const handleBuscarTickets = async () => {
    if (!busqueda.trim()) return;

    setCargandoBusqueda(true);
    try {
      // TODO: Implementar llamada al backend para buscar tickets
      // const response = await tpvApi.buscarTickets(busqueda);
      // setTicketsBusqueda(response.tickets);

      // Por ahora simulamos
      console.log('Buscando tickets:', busqueda);
      setTicketsBusqueda([]);
    } catch (error) {
      console.error('Error buscando tickets:', error);
    } finally {
      setCargandoBusqueda(false);
    }
  };

  // Reimprimir ticket
  const handleReimprimir = (ticket: Ticket) => {
    const datosTicket = {
      empresa: {
        nombre: empresaConfig?.empresaNombre || tpvConfig?.empresaNombre || 'Empresa',
        nombreComercial: empresaConfig?.empresaNombreComercial,
        nif: empresaConfig?.empresaCif || '',
        direccion: empresaConfig?.empresaDireccion || '',
        telefono: empresaConfig?.empresaTelefono,
        email: empresaConfig?.empresaEmail,
        textoLOPD: empresaConfig?.textoLOPD,
      },
      numero: ticket.numero,
      serie: ticket.serie,
      fecha: ticket.fecha,
      cajaNombre: ticket.tpvNombre,
      vendedorNombre: ticket.usuarioNombre,
      clienteNombre: ticket.clienteNombre,
      lineas: ticket.lineas.map(l => ({
        codigo: '',
        nombre: l.nombre,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        total: l.total,
        componentesKit: l.componentesKit,
      })),
      subtotal: ticket.total,
      descuento: 0,
      impuestos: [{
        nombre: 'IVA',
        porcentaje: 21,
        base: Number((ticket.total / 1.21).toFixed(2)),
        cuota: Number((ticket.total - ticket.total / 1.21).toFixed(2)),
      }],
      total: ticket.total,
      pagos: [{ metodo: ticket.metodoPago, importe: ticket.total }],
      cambio: 0,
    };

    printerService.printBrowser(datosTicket);
  };

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'tarjeta':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'bizum':
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      case 'efectivo':
      default:
        return <Banknote className="w-4 h-4 text-green-500" />;
    }
  };

  const tickets = modoVista === 'sesion' ? ticketsSesion : ticketsBusqueda;

  // Filtrar tickets
  const ticketsFiltrados = modoVista === 'sesion'
    ? tickets.filter((t) => {
        if (!busqueda) return true;
        const term = busqueda.toLowerCase();
        return (
          t.numero.toLowerCase().includes(term) ||
          t.usuarioNombre.toLowerCase().includes(term)
        );
      })
    : tickets;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historial de Tickets" size="xl">
      <div className="p-4">
        {/* Tabs de modo */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setModoVista('sesion')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              modoVista === 'sesion'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Store className="w-4 h-4" />
            Esta sesion
          </button>
          <button
            onClick={() => setModoVista('busqueda')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              modoVista === 'busqueda'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Buscar ticket
          </button>
        </div>

        {/* Barra de busqueda */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={
                modoVista === 'sesion'
                  ? 'Filtrar por numero o usuario...'
                  : 'Buscar por numero de ticket (ej: FS-000123)...'
              }
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && modoVista === 'busqueda') {
                  handleBuscarTickets();
                }
              }}
            />
          </div>
          {modoVista === 'busqueda' && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleBuscarTickets}
              disabled={cargandoBusqueda || !busqueda.trim()}
              icon={cargandoBusqueda ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            >
              Buscar
            </Button>
          )}
        </div>

        {/* Modo busqueda: instrucciones */}
        {modoVista === 'busqueda' && ticketsBusqueda.length === 0 && !cargandoBusqueda && (
          <div className="text-center py-12 text-gray-500">
            <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Buscar tickets de cualquier caja</p>
            <p className="text-sm mt-2">
              Introduce el numero de ticket (ej: FS-000123) para buscar
              <br />
              y poder reimprimir tickets de cualquier TPV
            </p>
          </div>
        )}

        {/* Lista de tickets */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {cargandoBusqueda ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : ticketsFiltrados.length === 0 && modoVista === 'sesion' ? (
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
                      <p className="font-bold text-lg">{ticket.serie}-{ticket.numero}</p>
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
                        {modoVista === 'busqueda' && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Store className="w-3 h-3" />
                            {ticket.tpvNombre}
                          </span>
                        )}
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

        {/* Resumen (solo en modo sesion) */}
        {modoVista === 'sesion' && ticketsSesion.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total de la sesion</p>
              <p className="text-lg font-bold">
                {ticketsSesion.length} tickets - {ticketsSesion.reduce((acc, t) => acc + t.total, 0).toFixed(2)} EUR
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
