'use client';

import { useSkinContext, SkinType, SkinInfo, AVAILABLE_SKINS } from '@/contexts/SkinContext';

/**
 * Hook para gestionar el sistema de skins
 * Proporciona acceso al skin actual y funciones para cambiarlo
 */
export function useSkin() {
  const { currentSkin, setSkin, availableSkins, getSkinInfo } = useSkinContext();

  /**
   * Cambia al siguiente skin en la lista
   */
  const nextSkin = () => {
    const currentIndex = availableSkins.findIndex(s => s.id === currentSkin);
    const nextIndex = (currentIndex + 1) % availableSkins.length;
    setSkin(availableSkins[nextIndex].id);
  };

  /**
   * Cambia al skin anterior en la lista
   */
  const previousSkin = () => {
    const currentIndex = availableSkins.findIndex(s => s.id === currentSkin);
    const prevIndex = (currentIndex - 1 + availableSkins.length) % availableSkins.length;
    setSkin(availableSkins[prevIndex].id);
  };

  /**
   * Verifica si el skin actual es un modo oscuro
   */
  const isDarkMode = currentSkin === 'dark';

  /**
   * Alterna entre el skin actual y el modo oscuro
   */
  const toggleDarkMode = () => {
    if (isDarkMode) {
      setSkin('default');
    } else {
      setSkin('dark');
    }
  };

  /**
   * Resetea al skin por defecto
   */
  const resetToDefault = () => {
    setSkin('default');
  };

  return {
    // Estado actual
    currentSkin,
    currentSkinInfo: getSkinInfo(currentSkin),
    isDarkMode,

    // Lista de skins
    availableSkins,

    // Acciones
    setSkin,
    nextSkin,
    previousSkin,
    toggleDarkMode,
    resetToDefault,

    // Utilidades
    getSkinInfo,
  };
}

// Re-exportar tipos para conveniencia
export type { SkinType, SkinInfo };
export { AVAILABLE_SKINS };
