'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { useCartStore } from '@/stores/cartStore';
import { ProductGrid } from './ProductGrid';
import { Cart } from './Cart';
import { FamilyTabs } from './FamilyTabs';
import { Header } from './Header';
import { WelcomeScreen } from './WelcomeScreen';
import { CheckoutModal } from './CheckoutModal';

/**
 * Componente principal del Kiosk
 * Gestiona la interfaz segun el tipo de kiosk
 */
export function KioskMain() {
  const { kioskConfig, empresaLogo } = useAuthStore();
  const { familias, isLoading: isDataLoading } = useDataStore();
  const { items, total } = useCartStore();

  // Estado local
  const [selectedFamilia, setSelectedFamilia] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  // La sincronizacion inicial se maneja en page.tsx

  // Seleccionar primera familia por defecto
  useEffect(() => {
    if (familias.length > 0 && !selectedFamilia) {
      setSelectedFamilia(familias[0]._id);
    }
  }, [familias, selectedFamilia]);

  // Timer de inactividad
  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      // Solo activar si hay items en el carrito o no esta en welcome
      if (!showWelcome || items.length > 0) {
        const timeout = kioskConfig?.config.tiempoInactividad || 120;
        const timer = setTimeout(() => {
          // Volver a pantalla de bienvenida
          setShowWelcome(true);
          setShowCheckout(false);
        }, timeout * 1000);
        setInactivityTimer(timer);
      }
    };

    // Eventos de actividad
    const events = ['touchstart', 'click', 'mousemove', 'keydown'];
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [showWelcome, items.length, kioskConfig?.config.tiempoInactividad]);

  // Aplicar tema del kiosk
  useEffect(() => {
    if (kioskConfig?.tema) {
      const root = document.documentElement;
      if (kioskConfig.tema.colorPrimario) {
        root.style.setProperty('--color-primary', kioskConfig.tema.colorPrimario);
      }
      if (kioskConfig.tema.colorSecundario) {
        root.style.setProperty('--color-secondary', kioskConfig.tema.colorSecundario);
      }
    }
  }, [kioskConfig?.tema]);

  // Handlers
  const handleStartOrder = () => {
    setShowWelcome(false);
  };

  const handleGoToCheckout = () => {
    if (items.length > 0) {
      setShowCheckout(true);
    }
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
  };

  // Pantalla de bienvenida
  if (showWelcome) {
    return (
      <WelcomeScreen
        onStart={handleStartOrder}
        kioskConfig={kioskConfig}
        empresaLogo={empresaLogo}
      />
    );
  }

  // Si es menu digital, no mostrar carrito
  const isMenuOnly = kioskConfig?.tipo === 'menu_digital';

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <Header
        kioskConfig={kioskConfig}
        empresaLogo={empresaLogo}
        onBackToWelcome={() => setShowWelcome(true)}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel de productos */}
        <div className={`flex-1 flex flex-col ${isMenuOnly ? 'w-full' : ''}`}>
          {/* Tabs de familias */}
          <FamilyTabs
            familias={familias}
            selectedFamilia={selectedFamilia}
            onSelectFamilia={setSelectedFamilia}
          />

          {/* Grid de productos */}
          <div className="flex-1 overflow-auto p-4">
            {isDataLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando productos...</p>
                </div>
              </div>
            ) : (
              <ProductGrid
                familiaId={selectedFamilia}
                showPrices={kioskConfig?.config.mostrarPrecios ?? true}
                showAlergenos={kioskConfig?.config.mostrarAlergenos ?? true}
                allowComments={kioskConfig?.config.permitirComentarios ?? true}
                isMenuOnly={isMenuOnly}
              />
            )}
          </div>
        </div>

        {/* Panel de carrito (si no es solo menu) */}
        {!isMenuOnly && (
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            <Cart onCheckout={handleGoToCheckout} />
          </div>
        )}
      </div>

      {/* Modal de checkout */}
      {showCheckout && (
        <CheckoutModal
          onClose={handleCloseCheckout}
          kioskConfig={kioskConfig}
        />
      )}
    </div>
  );
}
