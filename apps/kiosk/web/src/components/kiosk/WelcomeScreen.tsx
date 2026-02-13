'use client';

import { ShoppingBag, Utensils } from 'lucide-react';

interface Props {
  onStart: () => void;
  kioskConfig: any;
  empresaLogo?: string | null;
}

/** Icono SVG de Tralok inline */
function TralokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.15"/>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>
      <rect x="14" y="28" width="4" height="10" rx="1.5" fill="currentColor"/>
      <rect x="20" y="23" width="4" height="15" rx="1.5" fill="currentColor"/>
      <rect x="26" y="18" width="4" height="20" rx="1.5" fill="currentColor"/>
      <circle cx="34" cy="15" r="3" fill="currentColor"/>
    </svg>
  );
}

/**
 * Pantalla de bienvenida del Kiosk
 * Invita al cliente a iniciar su pedido
 */
export function WelcomeScreen({ onStart, kioskConfig, empresaLogo }: Props) {
  const kioskLogo = kioskConfig?.tema?.logoUrl;
  const fondo = kioskConfig?.tema?.fondoUrl;
  const nombre = kioskConfig?.nombre || 'Bienvenido';

  // Prioridad: 1) logo del kiosk, 2) logo de la empresa, 3) fallback Tralok
  const logoUrl = kioskLogo || empresaLogo;

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-8 relative"
      style={fondo ? { backgroundImage: `url(${fondo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      onClick={onStart}
    >
      {/* Overlay si hay imagen de fondo */}
      {fondo && <div className="absolute inset-0 bg-black/40" />}

      {/* Contenido */}
      <div className="relative z-10 text-center flex-1 flex flex-col items-center justify-center">
        {/* Logo */}
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="w-48 h-48 object-contain mx-auto mb-8"
          />
        ) : (
          <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8">
            <TralokIcon className="w-16 h-16 text-white" />
          </div>
        )}

        {/* Mensaje */}
        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
          {nombre}
        </h1>
        <p className="text-2xl text-white/90 mb-12 drop-shadow">
          Toca la pantalla para comenzar
        </p>

        {/* Boton animado */}
        <button
          onClick={onStart}
          className="group bg-white text-gray-800 px-12 py-6 rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-4 mx-auto"
        >
          <ShoppingBag className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold">Hacer Pedido</span>
        </button>

        {/* Animacion de touch */}
        <div className="mt-12 animate-bounce">
          <div className="w-12 h-12 border-4 border-white rounded-full mx-auto opacity-50"></div>
        </div>
      </div>

      {/* Powered by Tralok */}
      <div className="relative z-10 flex items-center gap-1.5 pb-4">
        <span className="text-xs text-white/40">Powered by</span>
        <TralokIcon className="w-3.5 h-3.5 text-white/40" />
        <span className="text-xs font-medium text-white/40">Tralok</span>
      </div>
    </div>
  );
}
