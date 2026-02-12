'use client';

import { useState, useEffect, useCallback } from 'react';
import MobileHeader from '@/components/mobile/MobileHeader';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { enqueue } from '@/lib/offline-queue';

interface FichajeActivo {
  _id: string;
  tipo: 'entrada';
  fecha: string;
  horaEntrada: string;
  ubicacionEntrada?: { lat: number; lng: number };
}

export default function FichajePage() {
  const { user } = useAuthStore();
  const [fichando, setFichando] = useState(false);
  const [fichajeActivo, setFichajeActivo] = useState<FichajeActivo | null>(null);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState('00:00:00');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar fichaje activo
  const cargarFichajeActivo = useCallback(async () => {
    try {
      const { data } = await api.get('/fichajes/activo');
      if (data.ok && data.fichaje) {
        setFichajeActivo(data.fichaje);
      } else {
        setFichajeActivo(null);
      }
    } catch {
      // Si falla, intentar offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarFichajeActivo();
  }, [cargarFichajeActivo]);

  // Timer
  useEffect(() => {
    if (!fichajeActivo) {
      setTiempoTranscurrido('00:00:00');
      return;
    }

    const calcular = () => {
      const inicio = new Date(fichajeActivo.horaEntrada).getTime();
      const diff = Date.now() - inicio;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTiempoTranscurrido(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [fichajeActivo]);

  // Obtener GPS
  const obtenerUbicacion = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGpsStatus('error');
        resolve(null);
        return;
      }
      setGpsStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUbicacion(loc);
          setGpsStatus('ok');
          resolve(loc);
        },
        () => {
          setGpsStatus('error');
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  const handleFichar = async () => {
    setFichando(true);
    try {
      const loc = await obtenerUbicacion();

      if (fichajeActivo) {
        // Fichaje de SALIDA
        try {
          await api.post('/fichajes/salida', {
            fichajeId: fichajeActivo._id,
            ubicacionSalida: loc,
          });
          setFichajeActivo(null);
        } catch {
          // Offline: encolar
          await enqueue({
            url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/fichajes/salida`,
            method: 'POST',
            body: { fichajeId: fichajeActivo._id, ubicacionSalida: loc },
          });
          setFichajeActivo(null);
        }
      } else {
        // Fichaje de ENTRADA
        try {
          const { data } = await api.post('/fichajes/entrada', {
            ubicacionEntrada: loc,
          });
          if (data.ok && data.fichaje) {
            setFichajeActivo(data.fichaje);
          }
        } catch {
          // Offline: encolar
          const id = await enqueue({
            url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/fichajes/entrada`,
            method: 'POST',
            body: { ubicacionEntrada: loc },
          });
          // Simular fichaje activo local
          setFichajeActivo({
            _id: id,
            tipo: 'entrada',
            fecha: new Date().toISOString(),
            horaEntrada: new Date().toISOString(),
            ubicacionEntrada: loc || undefined,
          });
        }
      }
    } finally {
      setFichando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MobileHeader title="Fichaje" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Saludo */}
        <p className="text-gray-400 mb-2">Hola, {user?.nombre?.split(' ')[0] || 'Usuario'}</p>

        {/* Timer */}
        <div className="text-5xl font-mono font-bold mb-8 tabular-nums">
          {tiempoTranscurrido}
        </div>

        {/* Estado */}
        <div className="mb-8 text-center">
          {fichajeActivo ? (
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="font-medium">Trabajando</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-3 h-3 bg-gray-500 rounded-full" />
              <span>Sin fichar</span>
            </div>
          )}
        </div>

        {/* Boton grande fichar */}
        <button
          onClick={handleFichar}
          disabled={fichando}
          className={`w-48 h-48 rounded-full text-white text-xl font-bold shadow-lg transition-all active:scale-95 ${
            fichajeActivo
              ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
          } disabled:opacity-50`}
        >
          {fichando ? (
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto" />
          ) : fichajeActivo ? (
            'Fichar Salida'
          ) : (
            'Fichar Entrada'
          )}
        </button>

        {/* GPS status */}
        <div className="mt-6 flex items-center gap-2 text-sm">
          {gpsStatus === 'loading' && <span className="text-yellow-400">Obteniendo ubicacion...</span>}
          {gpsStatus === 'ok' && (
            <span className="text-green-400">
              GPS: {ubicacion?.lat.toFixed(4)}, {ubicacion?.lng.toFixed(4)}
            </span>
          )}
          {gpsStatus === 'error' && <span className="text-red-400">GPS no disponible</span>}
          {gpsStatus === 'idle' && <span className="text-gray-600">GPS se activara al fichar</span>}
        </div>

        {/* Indicador offline */}
        {typeof navigator !== 'undefined' && !navigator.onLine && (
          <div className="mt-4 px-4 py-2 bg-yellow-900/50 rounded-lg text-yellow-400 text-sm">
            Modo offline - se sincronizara al recuperar conexion
          </div>
        )}
      </div>
    </div>
  );
}
