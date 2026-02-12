'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Search,
  Receipt,
  Calendar,
  User,
  CreditCard,
  Banknote,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  Smartphone,
} from 'lucide-react';
import { tpvApi, IVencimientoTPV } from '@/services/api';
import { useDataStore } from '@/stores/dataStore';

interface CobroVencimientosModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo?: 'cobro' | 'pago' | 'todos';
}

export function CobroVencimientosModal({
  isOpen,
  onClose,
  tipo = 'todos',
}: CobroVencimientosModalProps) {
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'cobro' | 'pago'>(
    tipo === 'todos' ? 'todos' : tipo
  );
  const [vencimientos, setVencimientos] = useState<IVencimientoTPV[]>([]);
  const [vencimientoSeleccionado, setVencimientoSeleccionado] =
    useState<IVencimientoTPV | null>(null);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [formaPagoId, setFormaPagoId] = useState('');

  const formasPago = useDataStore((state) => state.formasPago);

  // Cargar vencimientos al abrir
  useEffect(() => {
    if (isOpen) {
      cargarVencimientos();
    } else {
      // Limpiar al cerrar
      setVencimientos([]);
      setBusqueda('');
      setVencimientoSeleccionado(null);
      setError(null);
      setExito(null);
    }
  }, [isOpen, tipoFiltro]);

  const cargarVencimientos = async () => {
    setCargando(true);
    setError(null);
    try {
      const response = await tpvApi.obtenerVencimientosPendientes({
        tipo: tipoFiltro === 'todos' ? undefined : tipoFiltro,
        busqueda: busqueda || undefined,
        limite: 50,
      });
      setVencimientos(Array.isArray(response?.vencimientos) ? response.vencimientos : []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar vencimientos');
      setVencimientos([]);
    } finally {
      setCargando(false);
    }
  };

  // Buscar por numero de factura
  const handleBuscarFactura = async () => {
    if (!busqueda.trim()) {
      cargarVencimientos();
      return;
    }

    setCargando(true);
    setError(null);
    try {
      const response = await tpvApi.buscarVencimientoPorFactura(busqueda);
      setVencimientos(Array.isArray(response?.vencimientos) ? response.vencimientos : []);
    } catch (err: any) {
      setError(err.message || 'Error al buscar factura');
      setVencimientos([]);
    } finally {
      setCargando(false);
    }
  };

  // Procesar cobro/pago
  const handleCobrar = async () => {
    if (!vencimientoSeleccionado || !formaPagoId) return;

    setProcesando(true);
    setError(null);
    try {
      const response = await tpvApi.cobrarVencimiento({
        vencimientoId: vencimientoSeleccionado._id,
        formaPagoId,
      });

      // Mostrar exito
      const tipoAccion = vencimientoSeleccionado.tipo === 'cobro' ? 'Cobro' : 'Pago';
      setExito(
        `${tipoAccion} registrado correctamente. Movimiento: ${response.movimiento.codigo}`
      );

      // Quitar de la lista
      setVencimientos((prev) =>
        prev.filter((v) => v._id !== vencimientoSeleccionado._id)
      );
      setVencimientoSeleccionado(null);
      setFormaPagoId('');

      // Limpiar mensaje de exito despues de 3 segundos
      setTimeout(() => setExito(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el cobro');
    } finally {
      setProcesando(false);
    }
  };

  const getEstadoBadge = (vencimiento: IVencimientoTPV) => {
    const esVencido = vencimiento.estado === 'vencido' || (vencimiento.diasVencido && vencimiento.diasVencido > 0);

    if (esVencido) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertCircle className="w-3 h-3" />
          Vencido ({vencimiento.diasVencido} dias)
        </span>
      );
    }

    if (vencimiento.estado === 'parcial') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <Clock className="w-3 h-3" />
          Pago parcial
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Clock className="w-3 h-3" />
        Pendiente
      </span>
    );
  };

  const getTipoIcon = (vencimiento: IVencimientoTPV) => {
    if (vencimiento.tipo === 'cobro') {
      return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
    }
    return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
  };

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'tarjeta':
        return <CreditCard className="w-4 h-4" />;
      case 'bizum':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Banknote className="w-4 h-4" />;
    }
  };

  // Filtrar formas de pago segun tipo de vencimiento
  const formasPagoFiltradas = vencimientoSeleccionado
    ? formasPago.filter((fp) => {
        if (vencimientoSeleccionado.tipo === 'cobro') {
          return fp.tipo === 'cobro' || fp.tipo === 'ambos';
        }
        return fp.tipo === 'pago' || fp.tipo === 'ambos';
      })
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        tipo === 'cobro'
          ? 'Cobrar Facturas Pendientes'
          : tipo === 'pago'
          ? 'Pagar Facturas Pendientes'
          : 'Vencimientos Pendientes'
      }
      size="xl"
    >
      <div className="p-4">
        {/* Mensajes de error/exito */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        {exito && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            {exito}
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {tipo === 'todos' && (
            <>
              <button
                onClick={() => setTipoFiltro('todos')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tipoFiltro === 'todos'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTipoFiltro('cobro')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  tipoFiltro === 'cobro'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" />
                Cobros
              </button>
              <button
                onClick={() => setTipoFiltro('pago')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  tipoFiltro === 'pago'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                Pagos
              </button>
            </>
          )}
        </div>

        {/* Barra de busqueda */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por numero de factura, cliente o proveedor..."
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBuscarFactura();
                }
              }}
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleBuscarFactura}
            disabled={cargando}
            icon={
              cargando ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )
            }
          >
            Buscar
          </Button>
        </div>

        {/* Lista de vencimientos */}
        <div className="grid grid-cols-2 gap-4">
          {/* Columna izquierda: Lista */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {cargando ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : vencimientos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay vencimientos pendientes</p>
                <p className="text-sm">
                  {busqueda
                    ? 'No se encontraron resultados para la busqueda'
                    : 'Los vencimientos pendientes apareceran aqui'}
                </p>
              </div>
            ) : (
              (vencimientos || []).map((venc) => (
                <div
                  key={venc._id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    vencimientoSeleccionado?._id === venc._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => {
                    setVencimientoSeleccionado(venc);
                    setFormaPagoId('');
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getTipoIcon(venc)}</div>
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          {venc.documentoNumero || 'Sin numero'}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {venc.entidadNombre || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Vence: {new Date(venc.fechaVencimiento).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          venc.tipo === 'cobro' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {venc.importePendiente.toFixed(2)} EUR
                      </p>
                      {getEstadoBadge(venc)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Columna derecha: Detalle y accion */}
          <div className="border-l pl-4">
            {vencimientoSeleccionado ? (
              <div>
                <h3 className="text-lg font-bold mb-4">
                  {vencimientoSeleccionado.tipo === 'cobro'
                    ? 'Registrar Cobro'
                    : 'Registrar Pago'}
                </h3>

                {/* Detalle del vencimiento */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Documento</p>
                      <p className="font-medium">
                        {vencimientoSeleccionado.documentoNumero || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">
                        {vencimientoSeleccionado.tipo === 'cobro'
                          ? 'Cliente'
                          : 'Proveedor'}
                      </p>
                      <p className="font-medium">
                        {vencimientoSeleccionado.entidadNombre || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Importe total</p>
                      <p className="font-medium">
                        {vencimientoSeleccionado.importe.toFixed(2)} EUR
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ya pagado</p>
                      <p className="font-medium">
                        {vencimientoSeleccionado.importePagado.toFixed(2)} EUR
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Pendiente a {vencimientoSeleccionado.tipo === 'cobro' ? 'cobrar' : 'pagar'}</p>
                      <p
                        className={`text-2xl font-bold ${
                          vencimientoSeleccionado.tipo === 'cobro'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {vencimientoSeleccionado.importePendiente.toFixed(2)} EUR
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selector de forma de pago */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de pago
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {formasPagoFiltradas.map((fp) => (
                      <button
                        key={fp._id}
                        onClick={() => setFormaPagoId(fp._id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                          formaPagoId === fp._id
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {getMetodoPagoIcon(fp.metodo)}
                        <span className="font-medium">{fp.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Boton de accion */}
                <Button
                  variant={
                    vencimientoSeleccionado.tipo === 'cobro' ? 'success' : 'danger'
                  }
                  size="lg"
                  fullWidth
                  onClick={handleCobrar}
                  disabled={!formaPagoId || procesando}
                  icon={
                    procesando ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : vencimientoSeleccionado.tipo === 'cobro' ? (
                      <ArrowDownCircle className="w-5 h-5" />
                    ) : (
                      <ArrowUpCircle className="w-5 h-5" />
                    )
                  }
                >
                  {procesando
                    ? 'Procesando...'
                    : vencimientoSeleccionado.tipo === 'cobro'
                    ? `Cobrar ${vencimientoSeleccionado.importePendiente.toFixed(2)} EUR`
                    : `Pagar ${vencimientoSeleccionado.importePendiente.toFixed(2)} EUR`}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Receipt className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Selecciona un vencimiento</p>
                <p className="text-sm text-center">
                  Selecciona un vencimiento de la lista
                  <br />
                  para registrar su cobro o pago
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
