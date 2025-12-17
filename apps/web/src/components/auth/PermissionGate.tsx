'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { IPermisosEspeciales, RecursoSistema, AccionRecurso } from '@/types/permissions.types';

interface BasePermissionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface SpecialPermissionGateProps extends BasePermissionGateProps {
  permiso: keyof IPermisosEspeciales;
  recurso?: never;
  accion?: never;
}

interface ResourcePermissionGateProps extends BasePermissionGateProps {
  recurso: RecursoSistema;
  accion: AccionRecurso;
  permiso?: never;
}

type PermissionGateProps = SpecialPermissionGateProps | ResourcePermissionGateProps;

/**
 * Componente que renderiza su contenido solo si el usuario tiene el permiso especificado
 *
 * @example
 * // Verificar permiso especial
 * <PermissionGate permiso="verCostes">
 *   <span>{formatCurrency(coste)}</span>
 * </PermissionGate>
 *
 * @example
 * // Verificar permiso sobre recurso
 * <PermissionGate recurso="clientes" accion="delete">
 *   <Button onClick={handleDelete}>Eliminar</Button>
 * </PermissionGate>
 *
 * @example
 * // Con fallback
 * <PermissionGate permiso="modificarPVP" fallback={<span>{precio}</span>}>
 *   <Input value={precio} onChange={handleChange} />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  fallback = null,
  ...props
}: PermissionGateProps) {
  const { can, canResource } = usePermissions();

  // Verificar permiso especial
  if ('permiso' in props && props.permiso) {
    if (!can(props.permiso)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // Verificar permiso sobre recurso
  if ('recurso' in props && props.recurso && props.accion) {
    if (!canResource(props.recurso, props.accion)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // Sin permiso especificado, mostrar children
  return <>{children}</>;
}

/**
 * Componente específico para verificar si puede ver costes
 */
export function CanVerCostes({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permiso="verCostes" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Componente específico para verificar si puede ver márgenes
 */
export function CanVerMargenes({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permiso="verMargenes" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Componente específico para verificar si puede modificar PVP
 */
export function CanModificarPVP({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permiso="modificarPVP" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Componente específico para verificar si puede aplicar descuentos
 */
export function CanAplicarDescuentos({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permiso="aplicarDescuentos" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Componente específico para verificar si puede eliminar documentos
 */
export function CanEliminarDocumentos({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permiso="eliminarDocumentos" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Componente específico para verificar si puede anular documentos
 */
export function CanAnularDocumentos({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permiso="anularDocumentos" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Componente específico para acceso a módulo de ventas
 */
export function CanAccesoVentas({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permiso="accesoVentas" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Componente específico para acceso a módulo de compras
 */
export function CanAccesoCompras({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permiso="accesoCompras" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Componente específico para acceso a configuración
 */
export function CanAccederConfiguracion({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permiso="accederConfiguracion" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Componente específico para gestionar usuarios
 */
export function CanGestionarUsuarios({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permiso="gestionarUsuarios" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Componente específico para gestionar roles
 */
export function CanGestionarRoles({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permiso="gestionarRoles" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export default PermissionGate;
