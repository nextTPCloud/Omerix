'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Settings,
  Printer,
  Monitor,
  Database,
  RefreshCw,
  Key,
  Bell,
  Wifi,
  Save,
  RotateCcw,
  Layers,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Star,
  RotateCw,
  UtensilsCrossed,
  Split,
  Merge,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { usePerfilStore } from '@/stores/perfilStore';

interface AjustesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'perfil' | 'restauracion' | 'perifericos' | 'seguridad' | 'sync';

export function AjustesModal({ isOpen, onClose }: AjustesModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [pinPorTicket, setPinPorTicket] = useState(false);
  const [sonidosActivos, setSonidosActivos] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [intervaloSync, setIntervaloSync] = useState(5);
  const [guardando, setGuardando] = useState(false);

  // Configuración de restauración
  const [permiteDividirMesas, setPermiteDividirMesas] = useState(true);
  const [permiteUnirMesas, setPermiteUnirMesas] = useState(true);
  const [requiereMesaParaVenta, setRequiereMesaParaVenta] = useState(false);
  const [requiereCamareroParaVenta, setRequiereCamareroParaVenta] = useState(false);

  const tpvConfig = useAuthStore((state) => state.tpvConfig);
  const { sincronizarDatos, sincronizando, ultimaSync, familias, productos } = useDataStore();

  // Perfil store
  const {
    familias: familiasPerfil,
    inicializarFamilias,
    setFamiliaVisible,
    moverFamilia,
    resetFamilias,
    esFamiliaVisible,
    productosDestacados,
    toggleProductoDestacado,
    esProductoDestacado,
  } = usePerfilStore();

  // Inicializar familias del perfil cuando se carguen
  useEffect(() => {
    if (familias.length > 0) {
      inicializarFamilias(familias.map((f) => f._id));
    }
  }, [familias, inicializarFamilias]);

  // Familias ordenadas para el perfil
  const familiasOrdenadas = useMemo(() => {
    // Combinar datos de familias con configuración del perfil
    return familias
      .map((f) => {
        const config = familiasPerfil.find((fp) => fp.familiaId === f._id);
        return {
          ...f,
          visible: config ? config.visible : true,
          orden: config ? config.orden : 999,
        };
      })
      .sort((a, b) => a.orden - b.orden);
  }, [familias, familiasPerfil]);

  // Cargar configuracion guardada
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tpv_settings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          setPinPorTicket(settings.pinPorTicket ?? false);
          setSonidosActivos(settings.sonidosActivos ?? true);
          setAutoSync(settings.autoSync ?? true);
          setIntervaloSync(settings.intervaloSync ?? 5);
          // Restauración
          setPermiteDividirMesas(settings.permiteDividirMesas ?? true);
          setPermiteUnirMesas(settings.permiteUnirMesas ?? true);
          setRequiereMesaParaVenta(settings.requiereMesaParaVenta ?? false);
          setRequiereCamareroParaVenta(settings.requiereCamareroParaVenta ?? false);
        } catch (e) {
          console.error('Error cargando ajustes:', e);
        }
      }
    }
  }, [isOpen]);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const settings = {
        pinPorTicket,
        sonidosActivos,
        autoSync,
        intervaloSync,
        // Restauración
        permiteDividirMesas,
        permiteUnirMesas,
        requiereMesaParaVenta,
        requiereCamareroParaVenta,
      };
      localStorage.setItem('tpv_settings', JSON.stringify(settings));
      // Simular guardado
      await new Promise((resolve) => setTimeout(resolve, 500));
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  const [mensajeSync, setMensajeSync] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const handleSincronizar = async () => {
    setMensajeSync(null);
    const exito = await sincronizarDatos(false); // Sync completa, no incremental
    if (exito) {
      setMensajeSync({ tipo: 'exito', texto: 'Sincronización completada correctamente' });
    } else {
      setMensajeSync({ tipo: 'error', texto: 'Error al sincronizar. Verifica la conexión.' });
    }
    // Limpiar mensaje después de 5 segundos
    setTimeout(() => setMensajeSync(null), 5000);
  };

  // Detectar si tiene módulo de restauración
  const tieneRestauracion = tpvConfig?.tieneRestauracion ?? false;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'perfil', label: 'Perfil', icon: Layers },
    ...(tieneRestauracion ? [{ id: 'restauracion', label: 'Restauración', icon: UtensilsCrossed }] : []),
    { id: 'perifericos', label: 'Periféricos', icon: Printer },
    { id: 'seguridad', label: 'Seguridad', icon: Key },
    { id: 'sync', label: 'Sincronización', icon: Database },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajustes del TPV" size="xl">
      <div className="flex h-[500px]">
        {/* Sidebar */}
        <div className="w-48 border-r bg-gray-50 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Configuracion General</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Nombre del TPV</p>
                      <p className="text-sm text-gray-500">{tpvConfig?.tpvNombre || 'Caja Principal'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Almacen asignado</p>
                      <p className="text-sm text-gray-500">
                        {(() => {
                          const almacen = useDataStore.getState().almacenes.find((a: any) => a._id === tpvConfig?.almacenId);
                          return almacen?.nombre || tpvConfig?.almacenId || 'No asignado';
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Serie de facturas</p>
                      <p className="text-sm text-gray-500">{tpvConfig?.serieFactura || 'No configurada'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Sonidos</p>
                        <p className="text-sm text-gray-500">Reproducir sonidos en operaciones</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sonidosActivos}
                        onChange={(e) => setSonidosActivos(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Perfil - Configurar familias y favoritos */}
          {activeTab === 'perfil' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Familias visibles</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFamilias}
                    icon={<RotateCw className="w-4 h-4" />}
                  >
                    Restablecer
                  </Button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Configura qué familias mostrar y en qué orden. Arrastra para reordenar.
                </p>

                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {familiasOrdenadas.map((familia, index) => (
                    <div
                      key={familia._id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        familia.visible
                          ? 'bg-white border-gray-200'
                          : 'bg-gray-50 border-gray-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: familia.color || '#6b7280' }}
                        />
                        <span className={familia.visible ? 'font-medium' : 'text-gray-500'}>
                          {familia.nombre}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Mover arriba/abajo */}
                        <button
                          onClick={() => moverFamilia(familia._id, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moverFamilia(familia._id, 'down')}
                          disabled={index === familiasOrdenadas.length - 1}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* Toggle visibilidad */}
                        <button
                          onClick={() => setFamiliaVisible(familia._id, !familia.visible)}
                          className={`p-1 rounded ${
                            familia.visible
                              ? 'hover:bg-gray-100 text-gray-600'
                              : 'hover:bg-gray-200 text-gray-400'
                          }`}
                        >
                          {familia.visible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  {familiasOrdenadas.length === 0 && (
                    <p className="text-center text-gray-400 py-4">
                      No hay familias. Sincroniza los datos primero.
                    </p>
                  )}
                </div>
              </div>

              {/* Productos favoritos */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Productos favoritos</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Los productos favoritos aparecen en una sección especial para acceso rápido.
                </p>

                {productosDestacados.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {productosDestacados.map((pd) => {
                      const producto = productos.find((p: any) => p._id === pd.productoId);
                      if (!producto) return null;
                      return (
                        <div
                          key={pd.productoId}
                          className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full"
                        >
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-sm">{producto.nombre}</span>
                          <button
                            onClick={() => toggleProductoDestacado(pd.productoId)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Mantén pulsado un producto en la pantalla principal para añadirlo a favoritos.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Restauración */}
          {activeTab === 'restauracion' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Configuración de Restauración</h3>

                <div className="space-y-4">
                  {/* Dividir Mesas */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Split className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="font-medium">Permitir dividir mesas</p>
                        <p className="text-sm text-gray-500">
                          Mover productos de una mesa a otra
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permiteDividirMesas}
                        onChange={(e) => setPermiteDividirMesas(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Unir Mesas */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Merge className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Permitir unir mesas</p>
                        <p className="text-sm text-gray-500">
                          Fusionar tickets de varias mesas en una
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permiteUnirMesas}
                        onChange={(e) => setPermiteUnirMesas(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Separador */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Requisitos para ventas</h4>
                  </div>

                  {/* Requiere Mesa */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">#</span>
                      </div>
                      <div>
                        <p className="font-medium">Requiere mesa asignada</p>
                        <p className="text-sm text-gray-500">
                          No permitir ventas sin seleccionar mesa
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiereMesaParaVenta}
                        onChange={(e) => setRequiereMesaParaVenta(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Requiere Camarero */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">C</span>
                      </div>
                      <div>
                        <p className="font-medium">Requiere camarero asignado</p>
                        <p className="text-sm text-gray-500">
                          No permitir ventas sin seleccionar camarero
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiereCamareroParaVenta}
                        onChange={(e) => setRequiereCamareroParaVenta(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-700">
                      Estas opciones solo aplican cuando el módulo de restauración está activo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Perifericos */}
          {activeTab === 'perifericos' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Perifericos</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Printer className="w-5 h-5 text-gray-500" />
                      <p className="font-medium">Impresora de Tickets</p>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">
                      No configurada
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Monitor className="w-5 h-5 text-gray-500" />
                      <p className="font-medium">Visor de Cliente</p>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">
                      No configurado
                    </p>
                  </div>

                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    La configuracion de perifericos se realiza desde el panel de administracion web.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seguridad */}
          {activeTab === 'seguridad' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Seguridad</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">PIN por cada ticket</p>
                        <p className="text-sm text-gray-500">
                          Solicitar PIN del usuario antes de cada venta
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pinPorTicket}
                        onChange={(e) => setPinPorTicket(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Activa esta opcion si la caja es compartida por varios usuarios.
                      Cada venta quedara registrada con el usuario que introduzca su PIN.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sincronizacion */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Sincronizacion</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Wifi className="w-5 h-5 text-gray-500" />
                        <p className="font-medium">Ultima sincronizacion</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSincronizar}
                        disabled={sincronizando}
                        icon={<RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />}
                      >
                        {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">
                      {ultimaSync
                        ? new Date(ultimaSync).toLocaleString('es-ES')
                        : 'Nunca sincronizado'}
                    </p>
                  </div>

                  {/* Mensaje de feedback */}
                  {mensajeSync && (
                    <div
                      className={`p-3 rounded-lg text-sm font-medium ${
                        mensajeSync.tipo === 'exito'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {mensajeSync.texto}
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Sincronizacion automatica</p>
                        <p className="text-sm text-gray-500">
                          Sincronizar datos periodicamente
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSync}
                        onChange={(e) => setAutoSync(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {autoSync && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block mb-2 font-medium">Intervalo (minutos)</label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={intervaloSync}
                        onChange={(e) => setIntervaloSync(parseInt(e.target.value) || 5)}
                        className="w-24 p-2 border rounded-lg text-center"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-4 border-t">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleGuardar}
          disabled={guardando}
          icon={guardando ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </Modal>
  );
}
