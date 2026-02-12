'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/mobile/MobileHeader';
import CameraCapture from '@/components/mobile/CameraCapture';
import { api } from '@/services/api';

export default function NuevoPartePage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('normal');
  const [fotos, setFotos] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  const handleAddFoto = (base64: string) => {
    if (base64) {
      setFotos(prev => [...prev, base64]);
    }
  };

  const handleGuardar = async () => {
    if (!titulo.trim()) return;
    setGuardando(true);
    try {
      const { data } = await api.post('/partes-trabajo', {
        titulo,
        descripcion,
        prioridad,
        fotos,
      });
      if (data.ok) {
        router.push('/m/partes');
      }
    } catch (error) {
      console.error('Error creando parte:', error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MobileHeader title="Nuevo Parte" showBack />

      <div className="flex-1 px-4 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Titulo</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-3 py-3 bg-slate-800 rounded-lg border border-slate-700 text-white"
            placeholder="Descripcion breve del trabajo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Descripcion</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="w-full px-3 py-3 bg-slate-800 rounded-lg border border-slate-700 text-white resize-none"
            placeholder="Detalles del trabajo..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Prioridad</label>
          <div className="flex gap-2">
            {['baja', 'normal', 'alta', 'urgente'].map((p) => (
              <button
                key={p}
                onClick={() => setPrioridad(p)}
                className={`flex-1 py-2 rounded-lg text-sm capitalize ${
                  prioridad === p ? 'bg-blue-600' : 'bg-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Fotos</label>
          <div className="space-y-2">
            {fotos.map((foto, i) => (
              <div key={i} className="relative">
                <img src={foto} alt={`Foto ${i + 1}`} className="w-full rounded-lg max-h-32 object-cover" />
                <button
                  onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>
            ))}
            {fotos.length < 5 && (
              <CameraCapture onCapture={handleAddFoto} label="Agregar foto" />
            )}
          </div>
        </div>
      </div>

      {/* Boton guardar fijo */}
      <div className="sticky bottom-16 px-4 py-3 bg-slate-950 border-t border-slate-800">
        <button
          onClick={handleGuardar}
          disabled={guardando || !titulo.trim()}
          className="w-full py-3 bg-blue-600 rounded-lg font-medium disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Crear Parte'}
        </button>
      </div>
    </div>
  );
}
