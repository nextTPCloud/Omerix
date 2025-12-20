'use client';

import { useMemo, useCallback } from 'react';

/**
 * ============================================
 * CUSTOM HOOK: useFormatNumber
 * ============================================
 *
 * Hook para formatear numeros segun la configuracion de la empresa
 * - decimalesCantidad: decimales para cantidades (default: 2)
 * - decimalesPrecios: decimales para precios e importes (default: 2)
 * - moneda: moneda a usar (default: EUR)
 *
 * Uso:
 * const { formatCantidad, formatPrecio, formatImporte } = useFormatNumber();
 * formatCantidad(10.5)      // "10,50"
 * formatPrecio(99.99)       // "99,99"
 * formatImporte(1234.56)    // "1.234,56 €"
 */

interface UseFormatNumberOptions {
  // Forzar decimales especificos (ignora configuracion de empresa)
  decimalesCantidadOverride?: number;
  decimalesPreciosOverride?: number;
}

interface FormatNumberResult {
  // Configuracion actual
  decimalesCantidad: number;
  decimalesPrecios: number;
  moneda: string;

  // Funciones de formateo
  formatCantidad: (value: number | string | undefined | null) => string;
  formatPrecio: (value: number | string | undefined | null) => string;
  formatImporte: (value: number | string | undefined | null) => string;

  // Funciones para redondear (devuelven numero)
  toFixedCantidad: (value: number | string | undefined | null) => number;
  toFixedPrecio: (value: number | string | undefined | null) => number;

  // Parsear string a numero
  parseNumber: (value: string) => number;
}

export function useFormatNumber(options: UseFormatNumberOptions = {}): FormatNumberResult {
  // TODO: Cargar configuración de empresa cuando esté disponible
  // Por ahora usamos valores por defecto
  const empresaConfig = useMemo(() => {
    return {
      decimalesCantidad: options.decimalesCantidadOverride ?? 2,
      decimalesPrecios: options.decimalesPreciosOverride ?? 2,
      moneda: 'EUR',
      formatoNumero: 'es-ES',
    };
  }, [
    options.decimalesCantidadOverride,
    options.decimalesPreciosOverride,
  ]);

  // Simbolo de moneda
  const simboloMoneda = useMemo(() => {
    const simbolos: Record<string, string> = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      MXN: '$',
      COP: '$',
      ARS: '$',
      CLP: '$',
      PEN: 'S/',
      BRL: 'R$',
    };
    return simbolos[empresaConfig.moneda] || empresaConfig.moneda;
  }, [empresaConfig.moneda]);

  // Parsear valor a numero
  const toNumber = useCallback((value: number | string | undefined | null): number => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;

    // Convertir string a numero (soporta formato europeo e ingles)
    const cleanValue = String(value)
      .replace(/[^\d.,-]/g, '') // Eliminar todo excepto digitos, puntos y comas
      .replace(/\.(?=.*\.)/g, '') // Eliminar puntos duplicados excepto el ultimo
      .replace(/,(?=.*,)/g, ''); // Eliminar comas duplicadas excepto la ultima

    // Detectar formato: si hay coma seguida de 2 digitos al final, es decimal europeo
    if (/,\d{1,2}$/.test(cleanValue)) {
      const parsed = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }

    const parsed = parseFloat(cleanValue.replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  // Formatear como cantidad
  const formatCantidad = useCallback((value: number | string | undefined | null): string => {
    const num = toNumber(value);
    return num.toLocaleString(empresaConfig.formatoNumero, {
      minimumFractionDigits: empresaConfig.decimalesCantidad,
      maximumFractionDigits: empresaConfig.decimalesCantidad,
    });
  }, [toNumber, empresaConfig.formatoNumero, empresaConfig.decimalesCantidad]);

  // Formatear como precio (sin simbolo de moneda)
  const formatPrecio = useCallback((value: number | string | undefined | null): string => {
    const num = toNumber(value);
    return num.toLocaleString(empresaConfig.formatoNumero, {
      minimumFractionDigits: empresaConfig.decimalesPrecios,
      maximumFractionDigits: empresaConfig.decimalesPrecios,
    });
  }, [toNumber, empresaConfig.formatoNumero, empresaConfig.decimalesPrecios]);

  // Formatear como importe (con simbolo de moneda)
  const formatImporte = useCallback((value: number | string | undefined | null): string => {
    const num = toNumber(value);
    const formatted = num.toLocaleString(empresaConfig.formatoNumero, {
      minimumFractionDigits: empresaConfig.decimalesPrecios,
      maximumFractionDigits: empresaConfig.decimalesPrecios,
    });
    return `${formatted} ${simboloMoneda}`;
  }, [toNumber, empresaConfig.formatoNumero, empresaConfig.decimalesPrecios, simboloMoneda]);

  // Redondear a decimales de cantidad
  const toFixedCantidad = useCallback((value: number | string | undefined | null): number => {
    const num = toNumber(value);
    const factor = Math.pow(10, empresaConfig.decimalesCantidad);
    return Math.round(num * factor) / factor;
  }, [toNumber, empresaConfig.decimalesCantidad]);

  // Redondear a decimales de precio
  const toFixedPrecio = useCallback((value: number | string | undefined | null): number => {
    const num = toNumber(value);
    const factor = Math.pow(10, empresaConfig.decimalesPrecios);
    return Math.round(num * factor) / factor;
  }, [toNumber, empresaConfig.decimalesPrecios]);

  // Parsear string a numero
  const parseNumber = useCallback((value: string): number => {
    return toNumber(value);
  }, [toNumber]);

  return {
    decimalesCantidad: empresaConfig.decimalesCantidad,
    decimalesPrecios: empresaConfig.decimalesPrecios,
    moneda: empresaConfig.moneda,
    formatCantidad,
    formatPrecio,
    formatImporte,
    toFixedCantidad,
    toFixedPrecio,
    parseNumber,
  };
}

// Exportar funcion standalone para uso sin hook (valores por defecto)
export function formatNumber(
  value: number | string | undefined | null,
  decimales: number = 2,
  locale: string = 'es-ES'
): string {
  if (value === undefined || value === null || value === '') return '0';
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return '0';
  return num.toLocaleString(locale, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function formatCurrency(
  value: number | string | undefined | null,
  decimales: number = 2,
  moneda: string = 'EUR',
  locale: string = 'es-ES'
): string {
  const simbolos: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
  };
  const simbolo = simbolos[moneda] || moneda;
  return `${formatNumber(value, decimales, locale)} ${simbolo}`;
}
