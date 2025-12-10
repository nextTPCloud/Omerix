// backend/src/modules/certificados/index.ts

export { default as certificadosRoutes } from './certificados.routes';
export { default as certificadosController } from './certificados.controller';
export { default as certificadosService } from './certificados.service';
export {
  CertificadoElectronico,
  ICertificadoElectronico,
  TipoCertificado,
  EstadoCertificado,
  UsosCertificado,
} from './certificados.schema';
