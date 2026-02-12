'use client';

import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/mobile/MobileHeader';
import { useAuthStore } from '@/stores/authStore';
import { getAll } from '@/lib/offline-queue';
import { useState, useEffect } from 'react';

export default function PerfilPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    getAll().then(ops => setPendientes(ops.length)).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MobileHeader title="Perfil" />

      <div className="flex-1 px-4 py-6 space-y-4">
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold">
            {(user?.nombre || 'U')[0].toUpperCase()}
          </div>
          <h2 className="text-lg font-semibold">{user?.nombre}</h2>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <p className="text-xs text-gray-500 mt-1 capitalize">{user?.rol}</p>
        </div>

        {pendientes > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4">
            <p className="text-yellow-400 text-sm">
              {pendientes} operacion(es) pendiente(s) de sincronizar
            </p>
          </div>
        )}

        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-3 text-left text-sm flex items-center justify-between border-b border-slate-700"
          >
            <span>Ir a version escritorio</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 bg-red-800 rounded-xl text-sm font-medium"
        >
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
