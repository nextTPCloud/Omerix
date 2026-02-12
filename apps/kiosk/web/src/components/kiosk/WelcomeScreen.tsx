'use client';

import { ShoppingBag, Utensils } from 'lucide-react';

interface Props {
  onStart: () => void;
  kioskConfig: any;
}

/**
 * Pantalla de bienvenida del Kiosk
 * Invita al cliente a iniciar su pedido
 */
export function WelcomeScreen({ onStart, kioskConfig }: Props) {
  const logo = kioskConfig?.tema?.logoUrl;
  const fondo = kioskConfig?.tema?.fondoUrl;
  const nombre = kioskConfig?.nombre || 'Bienvenido';

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-8"
      style={fondo ? { backgroundImage: `url(${fondo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      onClick={onStart}
    >
      {/* Overlay si hay imagen de fondo */}
      {fondo && <div className="absolute inset-0 bg-black/40" />}

      {/* Contenido */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        {logo ? (
          <img
            src={logo}
            alt="Logo"
            className="w-48 h-48 object-contain mx-auto mb-8"
          />
        ) : (
          <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Utensils className="w-16 h-16 text-white" />
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
    </div>
  );
}
