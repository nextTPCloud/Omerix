'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useComanderoStore } from '../../stores/comanderoStore';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import ComanderoLoginPIN from '../../components/comandero/ComanderoLoginPIN';
import MesasView from '../../components/comandero/MesasView';
import ComandaEditor from '../../components/comandero/ComandaEditor';
import EstadoCocinaView from '../../components/comandero/EstadoCocinaView';
import PedidoRapidoView from '../../components/comandero/PedidoRapidoView';

type Tab = 'mesas' | 'comanda' | 'cocina' | 'rapido';

// Logo SVG reutilizable
function TralokLogo() {
  return (
    <svg
      width="220" height="56" viewBox="0 0 220 56"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className="h-14 w-auto"
    >
      <style>{`
        @font-face {
          font-family: 'GameOfSquids';
          src: url('/fonts/GameOfSquids.woff2') format('woff2'),
              url('/fonts/GameOfSquids.woff') format('woff');
          font-weight: 700;
          font-style: bold;
        }
      `}</style>
      <circle cx="28" cy="28" r="22" stroke="#1e40af" strokeWidth="2.5" fill="none" opacity="0.15"/>
      <circle cx="28" cy="28" r="22" stroke="#1e40af" strokeWidth="2.5" fill="none" strokeDasharray="105 35" strokeLinecap="round"/>
      <rect x="17" y="32" width="5" height="12" rx="1.5" fill="#1e40af"/>
      <rect x="24" y="26" width="5" height="18" rx="1.5" fill="#1e40af"/>
      <rect x="31" y="20" width="5" height="24" rx="1.5" fill="#1e40af"/>
      <circle cx="40" cy="17" r="3.5" fill="#1e40af"/>
      <text x="60" y="42" fontFamily="GameOfSquids" fontSize="38" fontWeight="700" fill="#1e3a8a" letterSpacing="1">Tralok</text>
    </svg>
  );
}

// Pantalla de carga mientras sincroniza datos
function PantallaCarga({ mensaje }: { mensaje: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <TralokLogo />
        </div>
        <div className="flex items-center justify-center gap-3 text-white">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-lg">{mensaje}</span>
        </div>
      </div>
    </div>
  );
}

// Mini formulario de activacion para comandero movil
function ActivacionComandero() {
  const { activarTPV } = useAuthStore();
  const [token, setToken] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleActivar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setCargando(true);
    setError('');
    try {
      const ok = await activarTPV(token.trim().toUpperCase(), nombre.trim() || 'Comandero Móvil');
      if (!ok) {
        setError('Token inválido o expirado');
        setCargando(false);
      }
      // No hacer setCargando(false) si ok: el componente se desmontará
      // y ComanderoPage mostrará la pantalla de sincronización
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <form onSubmit={handleActivar} className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <TralokLogo />
          </div>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            Comandero
          </span>
          <p className="text-gray-500 mt-3">Introduce el token de activación del TPV</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token de activación
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
            placeholder="XXXXXXXX"
            className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={8}
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1 text-center">
            Token de 8 caracteres generado en Configuración → TPV
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del dispositivo
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Comandero Juan"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={cargando || !token.trim()}
          className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {cargando ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Activando...
            </span>
          ) : (
            'Activar Comandero'
          )}
        </button>

        <div className="mt-2 text-center text-sm text-gray-500">
          <p>¿No tienes un token?</p>
          <p className="mt-1">
            Genera uno desde <span className="text-blue-600">Configuración → TPV</span> en la web
          </p>
        </div>
      </form>
    </div>
  );
}

export default function ComanderoPage() {
  const { activado } = useAuthStore();
  const { logueado, camarero, logout } = useComanderoStore();
  const [tabActivo, setTabActivo] = useState<Tab>('mesas');
  const productos = useDataStore((s) => s.productos);
  const ofertas = useDataStore((s) => s.ofertas);
  const sincronizando = useDataStore((s) => s.sincronizando);
  const sincronizarDatos = useDataStore((s) => s.sincronizarDatos);
  const [datosCargados, setDatosCargados] = useState(false);
  const syncIniciado = useRef(false);

  // Detectar happy hours activas ahora
  const happyHoursActivas = useMemo(() => {
    const ahora = new Date();
    const horaActualMin = ahora.getHours() * 60 + ahora.getMinutes();
    const diaActual = ahora.getDay();

    return ofertas.filter((o) => {
      if (!o.esHappyHour) return false;
      const inicio = new Date(o.fechaInicio);
      const fin = o.fechaFin ? new Date(o.fechaFin) : null;
      if (ahora < inicio) return false;
      if (fin && ahora > fin) return false;
      if (o.diasSemana && o.diasSemana.length > 0 && !o.diasSemana.includes(diaActual)) return false;
      if (o.horaDesde) {
        const [h, m] = o.horaDesde.split(':').map(Number);
        if (horaActualMin < h * 60 + m) return false;
      }
      if (o.horaHasta) {
        const [h, m] = o.horaHasta.split(':').map(Number);
        if (horaActualMin > h * 60 + m) return false;
      }
      return true;
    });
  }, [ofertas]);

  // Sincronizar datos cuando el TPV está activado pero no hay productos
  useEffect(() => {
    if (!activado) return;

    // Si ya hay productos (del persist), marcar como cargados
    if (productos.length > 0) {
      setDatosCargados(true);
      return;
    }

    // Evitar doble sync
    if (syncIniciado.current) return;
    syncIniciado.current = true;

    sincronizarDatos(false).then((ok) => {
      setDatosCargados(true);
      if (!ok) {
        console.error('[Comandero] Error sincronizando datos');
      }
    });
  }, [activado, productos.length, sincronizarDatos]);

  // TPV no activado: mostrar formulario de activacion
  if (!activado) {
    return <ActivacionComandero />;
  }

  // Sincronizando datos: mostrar pantalla de carga
  if (!datosCargados || sincronizando) {
    return <PantallaCarga mensaje="Cargando productos..." />;
  }

  // No logueado: mostrar PIN pad
  if (!logueado) {
    return <ComanderoLoginPIN />;
  }

  // Logueado: interfaz de comandero
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header - compacto en movil */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="font-bold text-sm sm:text-lg">Comandero</span>
          <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">|</span>
          <span className="text-xs sm:text-sm text-blue-400 truncate">{camarero?.alias || camarero?.nombre}</span>
        </div>
        <button
          onClick={logout}
          className="px-2 sm:px-3 py-1 rounded-lg bg-red-800 hover:bg-red-700 text-xs sm:text-sm transition-colors flex-shrink-0"
        >
          Salir
        </button>
      </div>

      {/* Banner Happy Hour */}
      {happyHoursActivas.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-600 text-black text-xs font-bold flex-shrink-0 overflow-x-auto">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <span className="whitespace-nowrap">HAPPY HOUR</span>
          <span className="text-amber-900 whitespace-nowrap truncate">
            {happyHoursActivas.map(h => h.nombre).join(' · ')}
          </span>
        </div>
      )}

      {/* Contenido segun tab */}
      <div className="flex-1 overflow-hidden">
        {tabActivo === 'mesas' && <MesasView onMesaSeleccionada={() => setTabActivo('comanda')} />}
        {tabActivo === 'comanda' && <ComandaEditor />}
        {tabActivo === 'cocina' && <EstadoCocinaView />}
        {tabActivo === 'rapido' && <PedidoRapidoView />}
      </div>

      {/* Tab bar inferior - compacto en movil */}
      <div className="flex border-t border-gray-700 bg-gray-800 flex-shrink-0">
        {([
          { id: 'mesas' as Tab, label: 'Mesas', icon: '🪑' },
          { id: 'comanda' as Tab, label: 'Comanda', icon: '📝' },
          { id: 'rapido' as Tab, label: 'Rápido', icon: '⚡' },
          { id: 'cocina' as Tab, label: 'Cocina', icon: '👨‍🍳' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActivo(tab.id)}
            className={`flex-1 py-2 sm:py-3 text-center transition-colors ${
              tabActivo === tab.id ? 'bg-gray-700 text-white' : 'text-gray-400'
            }`}
          >
            <div className="text-base sm:text-lg">{tab.icon}</div>
            <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">{tab.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
