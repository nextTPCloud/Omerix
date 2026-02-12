'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MobileHeader from '@/components/mobile/MobileHeader';
import { api } from '@/services/api';

interface ParteTrabajo {
  _id: string;
  codigo: string;
  titulo: string;
  estado: string;
  prioridad: string;
  clienteNombre?: string;
  fechaInicio?: string;
}

const ESTADO_COLORES: Record<string, string> = {
  pendiente: 'bg-yellow-600',
  en_curso: 'bg-blue-600',
  completado: 'bg-green-600',
  cancelado: 'bg-red-600',
};

export default function PartesPage() {
  const [partes, setPartes] = useState<ParteTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('');

  const cargarPartes = async () => {
    try {
      const params = new URLSearchParams({ limit: '50', sort: '-createdAt' });
      if (filtro) params.append('estado', filtro);
      const { data } = await api.get(`/partes-trabajo?${params}`);
      if (data.ok) {
        setPartes(data.data || data.partes || []);
      }
    } catch (error) {
      console.error('Error cargando partes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPartes();
  }, [filtro]);

  return (
    <div className="flex flex-col min-h-screen">
      <MobileHeader
        title="Partes de Trabajo"
        actions={
          <Link
            href="/m/partes/nuevo"
            className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        }
      />

      {/* Filtros */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {['', 'pendiente', 'en_curso', 'completado'].map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltro(estado)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filtro === estado ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-400'
            }`}
          >
            {estado === '' ? 'Todos' : estado.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex-1 px-4 space-y-3 pb-4">
        {loading ? (
          <div className="flex justify-center mt-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : partes.length === 0 ? (
          <div className="text-center mt-12 text-gray-500">
            <p>No hay partes de trabajo</p>
          </div>
        ) : (
          partes.map((parte) => (
            <Link
              key={parte._id}
              href={`/m/partes/${parte._id}`}
              className="block bg-slate-800 rounded-xl p-4 active:bg-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{parte.titulo || parte.codigo}</p>
                  <p className="text-sm text-gray-400">{parte.codigo}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${ESTADO_COLORES[parte.estado] || 'bg-gray-600'}`}>
                  {parte.estado?.replace('_', ' ')}
                </span>
              </div>
              {parte.clienteNombre && (
                <p className="text-sm text-gray-500">{parte.clienteNombre}</p>
              )}
            </Link>
          ))
        )}
      </div>

      {/* FAB */}
      <Link
        href="/m/partes/nuevo"
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center z-40"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  );
}
