import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Definición de una regla de validación
 */
export interface ValidationRule {
  field: string;
  label: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  custom?: (value: any, formData: any) => string | null;
}

/**
 * Errores de validación por campo
 */
export interface ValidationErrors {
  [field: string]: string;
}

/**
 * Hook para validación de formularios con mensajes bonitos
 */
export function useFormValidation<T extends Record<string, any>>(rules: ValidationRule[]) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Valida un campo específico
   */
  const validateField = useCallback((field: string, value: any, formData: T): string | null => {
    const rule = rules.find(r => r.field === field);
    if (!rule) return null;

    // Validar requerido
    if (rule.required) {
      if (value === undefined || value === null || value === '' ||
          (typeof value === 'string' && value.trim() === '')) {
        return `El campo "${rule.label}" es obligatorio`;
      }
    }

    // Si no hay valor y no es requerido, no validar más
    if (value === undefined || value === null || value === '') {
      return null;
    }

    // Validar longitud mínima
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      return `El campo "${rule.label}" debe tener al menos ${rule.minLength} caracteres`;
    }

    // Validar longitud máxima
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      return `El campo "${rule.label}" no puede tener más de ${rule.maxLength} caracteres`;
    }

    // Validar patrón
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return rule.patternMessage || `El campo "${rule.label}" tiene un formato inválido`;
    }

    // Validación personalizada
    if (rule.custom) {
      return rule.custom(value, formData);
    }

    return null;
  }, [rules]);

  /**
   * Valida todos los campos y muestra toast con errores
   */
  const validate = useCallback((formData: T): boolean => {
    const newErrors: ValidationErrors = {};
    const errorMessages: string[] = [];

    for (const rule of rules) {
      const value = getNestedValue(formData, rule.field);
      const error = validateField(rule.field, value, formData);

      if (error) {
        newErrors[rule.field] = error;
        errorMessages.push(error);
      }
    }

    setErrors(newErrors);

    if (errorMessages.length > 0) {
      // Mostrar toast con los errores formateados
      const errorCount = errorMessages.length;

      if (errorCount === 1) {
        toast.error(errorMessages[0]);
      } else {
        // Formatear múltiples errores como texto
        const errorsToShow = errorMessages.slice(0, 5);
        const message = `Por favor corrige los siguientes errores:\n• ${errorsToShow.join('\n• ')}${errorCount > 5 ? `\n...y ${errorCount - 5} más` : ''}`;
        toast.error(message);
      }
      return false;
    }

    return true;
  }, [rules, validateField]);

  /**
   * Valida un campo individual (para validación en tiempo real)
   */
  const validateSingleField = useCallback((field: string, value: any, formData: T) => {
    const error = validateField(field, value, formData);
    setErrors(prev => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
    });
    return !error;
  }, [validateField]);

  /**
   * Limpia todos los errores
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Limpia el error de un campo específico
   */
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Obtiene el error de un campo específico
   */
  const getFieldError = useCallback((field: string): string | undefined => {
    return errors[field];
  }, [errors]);

  /**
   * Verifica si un campo tiene error
   */
  const hasFieldError = useCallback((field: string): boolean => {
    return !!errors[field];
  }, [errors]);

  return {
    errors,
    validate,
    validateSingleField,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasFieldError,
  };
}

/**
 * Obtiene un valor anidado de un objeto usando notación de punto
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Reglas de validación comunes predefinidas
 */
export const commonValidations = {
  email: (label: string = 'Email'): ValidationRule => ({
    field: 'email',
    label,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: `El ${label.toLowerCase()} no tiene un formato válido`,
  }),

  telefono: (field: string = 'telefono', label: string = 'Teléfono'): ValidationRule => ({
    field,
    label,
    pattern: /^[+]?[\d\s()-]{6,20}$/,
    patternMessage: `El ${label.toLowerCase()} no tiene un formato válido`,
  }),

  codigoPostal: (field: string = 'codigoPostal', label: string = 'Código Postal'): ValidationRule => ({
    field,
    label,
    pattern: /^\d{4,10}$/,
    patternMessage: `El ${label.toLowerCase()} debe contener solo números`,
  }),

  porcentaje: (field: string, label: string): ValidationRule => ({
    field,
    label,
    custom: (value) => {
      const num = parseFloat(value);
      if (isNaN(num)) return `El ${label.toLowerCase()} debe ser un número`;
      if (num < 0 || num > 100) return `El ${label.toLowerCase()} debe estar entre 0 y 100`;
      return null;
    },
  }),

  precioPositivo: (field: string, label: string): ValidationRule => ({
    field,
    label,
    custom: (value) => {
      const num = parseFloat(value);
      if (isNaN(num)) return `El ${label.toLowerCase()} debe ser un número`;
      if (num < 0) return `El ${label.toLowerCase()} no puede ser negativo`;
      return null;
    },
  }),
};
