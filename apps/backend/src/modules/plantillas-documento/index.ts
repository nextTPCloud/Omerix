// apps/backend/src/modules/plantillas-documento/index.ts
// Exportaciones del módulo de plantillas de documentos

export { default as PlantillaDocumentoModel } from './PlantillaDocumento';
export {
  IPlantillaDocumento,
  TipoDocumentoPlantilla,
  EstiloPlantilla,
  IConfiguracionColores,
  IConfiguracionFuentes,
  IConfiguracionCabecera,
  IConfiguracionCliente,
  IConfiguracionLineas,
  IConfiguracionTotales,
  IConfiguracionPie,
} from './PlantillaDocumento';

export { plantillasDocumentoService } from './plantillas-documento.service';
export { plantillasDocumentoController } from './plantillas-documento.controller';
export { obtenerPlantillasDocumentoPredefinidas } from './plantillas-predefinidas';
export { default as plantillasDocumentoRoutes } from './plantillas-documento.routes';

export * from './plantillas-documento.dto';
