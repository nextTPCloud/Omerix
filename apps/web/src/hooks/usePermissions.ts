'use client';

import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { IPermisosEspeciales, RecursoSistema, AccionRecurso } from '@/types/permissions.types';

/**
 * Hook para acceder a los permisos del usuario actual
 * Proporciona funciones helper para verificar permisos específicos
 */
export function usePermissions() {
  const {
    permisos,
    rolCustom,
    isLoading,
    can,
    canResource,
    getDescuentoMaximo,
    refreshPermissions,
  } = usePermissionsContext();

  return {
    // Estado
    permisos,
    rolCustom,
    isLoading,

    // Funciones genéricas
    can,
    canResource,
    getDescuentoMaximo,
    refreshPermissions,

    // ==========================================
    // HELPERS PARA PERMISOS DE VISIBILIDAD
    // ==========================================

    /**
     * Verificar si puede ver costes
     */
    canVerCostes: (): boolean => can('verCostes'),

    /**
     * Verificar si puede ver márgenes
     */
    canVerMargenes: (): boolean => can('verMargenes'),

    /**
     * Verificar si puede ver datos de facturación
     */
    canVerDatosFacturacion: (): boolean => can('verDatosFacturacion'),

    /**
     * Verificar si puede ver historial de cambios
     */
    canVerHistorialCambios: (): boolean => can('verHistorialCambios'),

    // ==========================================
    // HELPERS PARA PERMISOS DE EDICIÓN
    // ==========================================

    /**
     * Verificar si puede modificar PVP
     */
    canModificarPVP: (): boolean => can('modificarPVP'),

    /**
     * Verificar si puede modificar precio de compra
     */
    canModificarPrecioCompra: (): boolean => can('modificarPrecioCompra'),

    /**
     * Verificar si puede aplicar descuentos
     */
    canAplicarDescuentos: (): boolean => can('aplicarDescuentos'),

    /**
     * Verificar si un descuento específico está permitido
     */
    isDescuentoPermitido: (descuento: number): boolean => {
      if (!can('aplicarDescuentos')) return false;
      return descuento <= getDescuentoMaximo();
    },

    // ==========================================
    // HELPERS PARA PERMISOS DE GESTIÓN
    // ==========================================

    /**
     * Verificar si puede acceder a configuración
     */
    canAccederConfiguracion: (): boolean => can('accederConfiguracion'),

    /**
     * Verificar si puede gestionar usuarios
     */
    canGestionarUsuarios: (): boolean => can('gestionarUsuarios'),

    /**
     * Verificar si puede gestionar roles
     */
    canGestionarRoles: (): boolean => can('gestionarRoles'),

    /**
     * Verificar si puede exportar datos
     */
    canExportarDatos: (): boolean => can('exportarDatos'),

    /**
     * Verificar si puede importar datos
     */
    canImportarDatos: (): boolean => can('importarDatos'),

    // ==========================================
    // HELPERS PARA PERMISOS DE OPERACIONES
    // ==========================================

    /**
     * Verificar si puede anular documentos
     */
    canAnularDocumentos: (): boolean => can('anularDocumentos'),

    /**
     * Verificar si puede eliminar documentos
     */
    canEliminarDocumentos: (): boolean => can('eliminarDocumentos'),

    // ==========================================
    // HELPERS PARA ACCESO A MÓDULOS
    // ==========================================

    /**
     * Verificar si puede acceder a ventas
     */
    canAccesoVentas: (): boolean => can('accesoVentas'),

    /**
     * Verificar si puede acceder a compras
     */
    canAccesoCompras: (): boolean => can('accesoCompras'),

    /**
     * Verificar si puede acceder a almacén
     */
    canAccesoAlmacen: (): boolean => can('accesoAlmacen'),

    /**
     * Verificar si puede acceder a contabilidad
     */
    canAccesoContabilidad: (): boolean => can('accesoContabilidad'),

    /**
     * Verificar si puede acceder al TPV
     */
    canAccesoTPV: (): boolean => can('accesoTPV'),

    // ==========================================
    // HELPERS PARA RECURSOS
    // ==========================================

    /**
     * Verificar si puede crear un recurso
     */
    canCreate: (recurso: RecursoSistema): boolean => canResource(recurso, 'create'),

    /**
     * Verificar si puede leer un recurso
     */
    canRead: (recurso: RecursoSistema): boolean => canResource(recurso, 'read'),

    /**
     * Verificar si puede actualizar un recurso
     */
    canUpdate: (recurso: RecursoSistema): boolean => canResource(recurso, 'update'),

    /**
     * Verificar si puede eliminar un recurso
     */
    canDelete: (recurso: RecursoSistema): boolean => canResource(recurso, 'delete'),

    /**
     * Verificar si puede exportar un recurso
     */
    canExport: (recurso: RecursoSistema): boolean => canResource(recurso, 'export'),

    /**
     * Verificar si puede importar un recurso
     */
    canImport: (recurso: RecursoSistema): boolean => canResource(recurso, 'import'),
  };
}

export default usePermissions;
