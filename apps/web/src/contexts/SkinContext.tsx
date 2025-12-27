'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Tipos de skins disponibles
export type SkinType =
  | 'default'
  | 'dark'
  | 'corporate-blue'
  | 'modern-green'
  | 'warm-orange'
  | 'purple-elegant';

// Información de cada skin
export interface SkinInfo {
  id: SkinType;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    background: string;
  };
}

// Lista de skins disponibles con su información
export const AVAILABLE_SKINS: SkinInfo[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Estilo profesional neutro',
    preview: {
      primary: '#1a1a2e',
      secondary: '#f5f5f7',
      background: '#ffffff',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Modo oscuro elegante',
    preview: {
      primary: '#6366f1',
      secondary: '#2d2d3d',
      background: '#1a1a24',
    },
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Estilo corporativo profesional',
    preview: {
      primary: '#2563eb',
      secondary: '#e0e7ff',
      background: '#f8fafc',
    },
  },
  {
    id: 'modern-green',
    name: 'Modern Green',
    description: 'Estilo fresco y moderno',
    preview: {
      primary: '#10b981',
      secondary: '#d1fae5',
      background: '#f0fdf4',
    },
  },
  {
    id: 'warm-orange',
    name: 'Warm Orange',
    description: 'Estilo cálido y acogedor',
    preview: {
      primary: '#f97316',
      secondary: '#fed7aa',
      background: '#fffbeb',
    },
  },
  {
    id: 'purple-elegant',
    name: 'Purple Elegant',
    description: 'Estilo elegante y sofisticado',
    preview: {
      primary: '#8b5cf6',
      secondary: '#e9d5ff',
      background: '#faf5ff',
    },
  },
];

// Interfaz del contexto
interface SkinContextType {
  currentSkin: SkinType;
  setSkin: (skin: SkinType) => void;
  availableSkins: SkinInfo[];
  getSkinInfo: (skinId: SkinType) => SkinInfo | undefined;
}

// Crear el contexto
const SkinContext = createContext<SkinContextType | undefined>(undefined);

// Clave para localStorage
const SKIN_STORAGE_KEY = 'tralok-skin';

// Props del provider
interface SkinProviderProps {
  children: React.ReactNode;
  defaultSkin?: SkinType;
}

// Provider del contexto
export function SkinProvider({ children, defaultSkin = 'default' }: SkinProviderProps) {
  const [currentSkin, setCurrentSkin] = useState<SkinType>(defaultSkin);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar skin guardado en localStorage al montar
  useEffect(() => {
    const savedSkin = localStorage.getItem(SKIN_STORAGE_KEY) as SkinType | null;
    if (savedSkin && AVAILABLE_SKINS.some(s => s.id === savedSkin)) {
      setCurrentSkin(savedSkin);
    }
    setIsHydrated(true);
  }, []);

  // Aplicar la clase del skin al documento
  useEffect(() => {
    if (!isHydrated) return;

    const root = document.documentElement;

    // Remover todas las clases de skin existentes
    AVAILABLE_SKINS.forEach(skin => {
      root.classList.remove(`skin-${skin.id}`);
    });

    // Agregar la clase del skin actual
    root.classList.add(`skin-${currentSkin}`);

    // Guardar en localStorage
    localStorage.setItem(SKIN_STORAGE_KEY, currentSkin);
  }, [currentSkin, isHydrated]);

  // Función para cambiar el skin
  const setSkin = useCallback((skin: SkinType) => {
    if (AVAILABLE_SKINS.some(s => s.id === skin)) {
      setCurrentSkin(skin);
    }
  }, []);

  // Función para obtener información de un skin
  const getSkinInfo = useCallback((skinId: SkinType) => {
    return AVAILABLE_SKINS.find(s => s.id === skinId);
  }, []);

  const value: SkinContextType = {
    currentSkin,
    setSkin,
    availableSkins: AVAILABLE_SKINS,
    getSkinInfo,
  };

  return (
    <SkinContext.Provider value={value}>
      {children}
    </SkinContext.Provider>
  );
}

// Hook para usar el contexto
export function useSkinContext() {
  const context = useContext(SkinContext);
  if (context === undefined) {
    throw new Error('useSkinContext debe usarse dentro de un SkinProvider');
  }
  return context;
}
