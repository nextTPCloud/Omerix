/**
 * Módulo de Exportadores de Contabilidad
 * Exportación a formatos estándar: CSV, A3 y Sage
 */

// Exportador CSV
export {
  exportarAsientosCSV,
  exportarPlanCuentasCSV,
  exportarLibroDiarioCSV,
  ICSVExportOptions,
  ICuentaContableBasica,
  ILibroDiarioResumen,
} from './csv.exporter';

// Exportador A3
export {
  exportarAsientosA3,
  exportarPlanCuentasA3,
  exportarTercerosA3,
  generarNombreArchivoA3,
  IA3ExportOptions,
  ICuentaA3Export,
  ITerceroA3Export,
} from './a3.exporter';

// Exportador Sage
export {
  exportarAsientosSage,
  exportarPlanCuentasSage,
  exportarTercerosSage,
  generarNombreArchivoSage,
  getInfoFormatoSage,
  ISageExportOptions,
  ICuentaSageExport,
  ITerceroSageExport,
} from './sage.exporter';

// Tipos de formato disponibles
export type ExportFormat = 'csv' | 'a3' | 'sage50' | 'sagedespachos' | 'sage200';

// Información de formatos disponibles
export const EXPORT_FORMATS: Record<ExportFormat, {
  nombre: string;
  descripcion: string;
  extension: string;
}> = {
  csv: {
    nombre: 'CSV',
    descripcion: 'Formato CSV genérico, compatible con Excel y otras aplicaciones',
    extension: 'csv',
  },
  a3: {
    nombre: 'A3',
    descripcion: 'Formato XDiario para A3 Asesor / A3Con',
    extension: 'txt',
  },
  sage50: {
    nombre: 'Sage 50',
    descripcion: 'Formato para Sage 50 (ContaPlus)',
    extension: 'txt',
  },
  sagedespachos: {
    nombre: 'Sage Despachos',
    descripcion: 'Formato para Sage Despachos',
    extension: 'dat',
  },
  sage200: {
    nombre: 'Sage 200',
    descripcion: 'Formato para Sage 200',
    extension: 'csv',
  },
};
