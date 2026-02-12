'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MobileHeader from '@/components/mobile/MobileHeader';
import CameraCapture from '@/components/mobile/CameraCapture';
import { api } from '@/services/api';

const ESTADOS = ['pendiente', 'en_curso', 'completado', 'cancelado'];
const ESTADO_COLORES: Record<string, string> = {
  pendiente: 'bg-yellow-600',
  en_curso: 'bg-blue-600',
  completado: 'bg-green-600',
  cancelado: 'bg-red-600',
};

export default function DetallePartePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [parte, setParte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarParte();
  }, [id]);

  const cargarParte = async () => {
    try {
      const { data } = await api.get(`/partes-trabajo/${id}`);
      if (data.ok) {
        setParte(data.data || data.parte);
      }
    } catch (error) {
      console.error('Error cargando parte:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (nuevoEstado: string) => {
    try {
      await api.patch(`/partes-trabajo/${id}`, { estado: nuevoEstado });
      setParte((prev: any) => ({ ...prev, estado: nuevoEstado }));
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const agregarNota = async () => {
    if (!nota.trim()) return;
    setGuardando(true);
    try {
      await api.post(`/partes-trabajo/${id}/notas`, { texto: nota });
      setNota('');
      cargarParte();
    } catch (error) {
      console.error('Error agregando nota:', error);
    } finally {
      setGuardando(false);
    }
  };

  const handleAddFoto = async (base64: string) => {
    if (!base64) return;
    try {
      await api.post(`/partes-trabajo/${id}/fotos`, { imagen: base64 });
      cargarParte();
    } catch (error) {
      console.error('Error subiendo foto:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!parte) {
    return (
      <div>
        <MobileHeader title="Parte no encontrado" showBack />
        <div className="text-center mt-12 text-gray-500">
          <p>No se encontro el parte de trabajo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MobileHeader title={parte.codigo || 'Parte'} showBack />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Info principal */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-medium mb-2">{parte.titulo}</h2>
          {parte.descripcion && (
            <p className="text-sm text-gray-400 mb-3">{parte.descripcion}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {parte.clienteNombre && <span>{parte.clienteNombre}</span>}
            {parte.prioridad && (
              <span className="capitalize px-2 py-0.5 bg-slate-700 rounded">
                {parte.prioridad}
              </span>
            )}
          </div>
        </div>

        {/* Cambio de estado */}
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-2">Estado</p>
          <div className="flex gap-2 flex-wrap">
            {ESTADOS.map((estado) => (
              <button
                key={estado}
                onClick={() => cambiarEstado(estado)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                  parte.estado === estado
                    ? ESTADO_COLORES[estado]
                    : 'bg-slate-700 text-gray-400'
                }`}
              >
                {estado.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-2">Notas</p>
          {parte.notas?.map((n: any, i: number) => (
            <div key={i} className="mb-2 p-2 bg-slate-700 rounded text-sm">
              <p>{n.texto}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(n.fecha || n.createdAt).toLocaleString('es-ES')}
              </p>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Agregar nota..."
              className="flex-1 px-3 py-2 bg-slate-700 rounded-lg text-sm border border-slate-600"
            />
            <button
              onClick={agregarNota}
              disabled={guardando || !nota.trim()}
              className="px-4 py-2 bg-blue-600 rounded-lg text-sm disabled:opacity-50"
            >
              {guardando ? '...' : 'Enviar'}
            </button>
          </div>
        </div>

        {/* Fotos */}
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-2">Fotos</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {(parte.fotos || []).map((foto: any, i: number) => (
              <img
                key={i}
                src={typeof foto === 'string' ? foto : foto.url}
                alt={`Foto ${i + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
            ))}
          </div>
          <CameraCapture onCapture={handleAddFoto} label="Agregar foto" />
        </div>
      </div>
    </div>
  );
}
