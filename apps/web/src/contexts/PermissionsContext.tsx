'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  IPermisosEspeciales,
  IRol,
  PERMISOS_ESPECIALES_DEFAULT,
  PERMISOS_ESPECIALES_ADMIN,
  PERMISOS_POR_ROL,
  ROLE_PERMISSIONS,
  RecursoSistema,
  AccionRecurso,
} from '@/types/permissions.types';
import { rolesService } from '@/services/roles.service';

/**
 * Contexto de permisos
 */
interface PermissionsContextValue {
  // Permisos efectivos del usuario
  permisos: IPermisosEspeciales;

  // Rol personalizado (si existe)
  rolCustom: IRol | null;

  // Estado de carga
  isLoading: boolean;

  // Funciones de verificación
  can: (permiso: keyof IPermisosEspeciales) => boolean;
  canResource: (recurso: RecursoSistema, accion: AccionRecurso) => boolean;
  getDescuentoMaximo: () => number;

  // Recargar permisos
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

interface PermissionsProviderProps {
  children: React.ReactNode;
}

/**
 * Obtener permisos efectivos basados en rol del usuario
 */
function getPermisosEfectivos(
  rol: string,
  rolCustom: IRol | null,
  permisosUsuario?: Partial<IPermisosEspeciales>
): IPermisosEspeciales {
  // Superadmin siempre tiene todos los permisos
  if (rol === 'superadmin') {
    return PERMISOS_ESPECIALES_ADMIN;
  }

  // Obtener permisos base del rol
  const permisosBase = {
    ...PERMISOS_ESPECIALES_DEFAULT,
    ...(PERMISOS_POR_ROL[rol] || {}),
  };

  // Si tiene rol personalizado, combinar
  let permisosEfectivos = permisosBase;
  if (rolCustom?.permisos?.especiales) {
    permisosEfectivos = {
      ...permisosBase,
      ...rolCustom.permisos.especiales,
    };
  }

  // Aplicar permisos específicos del usuario
  if (permisosUsuario) {
    return {
      ...permisosEfectivos,
      ...permisosUsuario,
    };
  }

  return permisosEfectivos;
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const [rolCustom, setRolCustom] = useState<IRol | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar rol personalizado si el usuario tiene rolId
  const loadRolCustom = useCallback(async () => {
    if (!user?.rolId) {
      setRolCustom(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await rolesService.getById(user.rolId);
      if (response.success && response.data) {
        setRolCustom(response.data);
      }
    } catch (error) {
      console.error('Error cargando rol personalizado:', error);
      setRolCustom(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.rolId]);

  // Cargar rol al cambiar usuario
  useEffect(() => {
    if (isAuthenticated && isHydrated && user) {
      loadRolCustom();
    } else {
      setRolCustom(null);
    }
  }, [isAuthenticated, isHydrated, user, loadRolCustom]);

  // Calcular permisos efectivos
  const permisos = useMemo(() => {
    if (!user || !isAuthenticated) {
      return PERMISOS_ESPECIALES_DEFAULT;
    }

    return getPermisosEfectivos(
      user.rol,
      rolCustom,
      user.permisos?.especiales
    );
  }, [user, isAuthenticated, rolCustom]);

  // Verificar permiso especial
  const can = useCallback((permiso: keyof IPermisosEspeciales): boolean => {
    // Superadmin siempre puede todo
    if (user?.rol === 'superadmin') return true;

    const valor = permisos[permiso];
    if (permiso === 'descuentoMaximo') {
      return (valor as number) > 0;
    }
    return !!valor;
  }, [permisos, user?.rol]);

  // Verificar permiso sobre recurso
  const canResource = useCallback((recurso: RecursoSistema, accion: AccionRecurso): boolean => {
    // Superadmin siempre puede todo
    if (user?.rol === 'superadmin') return true;

    // Si tiene rol personalizado, verificar permisos de recursos
    if (rolCustom?.permisos?.recursos) {
      const permisosRecurso = rolCustom.permisos.recursos[recurso];
      if (Array.isArray(permisosRecurso)) {
        return permisosRecurso.includes(accion);
      }
    }

    // Usar permisos del rol base desde ROLE_PERMISSIONS
    const rolBase = user?.rol || 'visualizador';
    const rolePerms = ROLE_PERMISSIONS[rolBase];
    if (rolePerms?.resources) {
      const permisosRecurso = rolePerms.resources[recurso];
      if (Array.isArray(permisosRecurso)) {
        return permisosRecurso.includes(accion);
      }
    }

    // Por defecto, denegar si no hay permisos definidos
    return false;
  }, [rolCustom, user?.rol]);

  // Obtener descuento máximo
  const getDescuentoMaximo = useCallback((): number => {
    if (user?.rol === 'superadmin') return 100;
    return permisos.descuentoMaximo || 0;
  }, [permisos, user?.rol]);

  // Recargar permisos
  const refreshPermissions = useCallback(async () => {
    await loadRolCustom();
  }, [loadRolCustom]);

  const value: PermissionsContextValue = {
    permisos,
    rolCustom,
    isLoading,
    can,
    canResource,
    getDescuentoMaximo,
    refreshPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de permisos
 */
export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext debe usarse dentro de un PermissionsProvider');
  }
  return context;
}
