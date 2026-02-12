'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    chatwootSDK: {
      run: (config: { websiteToken: string; baseUrl: string; locale?: string }) => void;
    };
    $chatwoot: {
      toggle: (state?: 'open' | 'close') => void;
      setUser: (id: string, data: { name?: string; email?: string }) => void;
      setLocale: (locale: string) => void;
      reset: () => void;
      isOpen: boolean;
    };
    chatwootSettings: {
      hideMessageBubble?: boolean;
      position?: 'left' | 'right';
      locale?: string;
      type?: 'standard' | 'expanded_bubble';
    };
  }
}

const CHATWOOT_TOKEN = 'EoZ8t5p2RAErMRexkJnbPUrG';
const CHATWOOT_BASE_URL = 'https://app.chatwoot.com';

export function ChatwootWidget() {
  useEffect(() => {
    // Evitar cargar múltiples veces
    if (document.getElementById('chatwoot-sdk')) return;

    // Configuración previa al SDK
    window.chatwootSettings = {
      hideMessageBubble: true,
      position: 'right',
      locale: 'es',
      type: 'standard',
    };

    const script = document.createElement('script');
    script.id = 'chatwoot-sdk';
    script.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.chatwootSDK.run({
        websiteToken: CHATWOOT_TOKEN,
        baseUrl: CHATWOOT_BASE_URL,
        locale: 'es',
      });
    };

    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById('chatwoot-sdk');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null;
}

// Función para abrir/cerrar el chat de soporte (toggle)
export function toggleSupportChat() {
  if (window.$chatwoot) {
    window.$chatwoot.toggle();
  }
}

// Función para abrir el chat de soporte
export function openSupportChat() {
  if (window.$chatwoot) {
    window.$chatwoot.toggle('open');
  }
}

// Función para cerrar el chat
export function closeSupportChat() {
  if (window.$chatwoot) {
    window.$chatwoot.toggle('close');
  }
}
