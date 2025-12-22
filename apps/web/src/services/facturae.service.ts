import { api } from './api';
import {
  IGenerarFacturaEResult,
  IFirmarFacturaEResult,
  IEnvioFACEResult,
  IConsultaEstadoFACE,
  IVerificacionRequisitos,
  ICertificadoInfo,
  IHistorialFacturaElectronica,
} from '@/types/facturae.types';

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

class FacturaEService {
  private baseUrl = '/facturae';

  /**
   * Genera un documento FacturaE a partir de una factura
   */
  async generarFacturaE(
    facturaId: string,
    options?: { firmar?: boolean; certificadoId?: string }
  ): Promise<SingleResponse<IGenerarFacturaEResult>> {
    const response = await api.post(`${this.baseUrl}/${facturaId}/generar`, options || {});
    return response.data;
  }

  /**
   * Descarga el XML de FacturaE
   */
  async descargarFacturaE(facturaId: string): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/${facturaId}/descargar`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Genera un lote de facturas FacturaE
   */
  async generarLote(facturaIds: string[]): Promise<SingleResponse<IGenerarFacturaEResult>> {
    const response = await api.post(`${this.baseUrl}/lote`, { facturaIds });
    return response.data;
  }

  /**
   * Valida un documento FacturaE
   */
  async validarFacturaE(xml: string): Promise<SingleResponse<{
    valido: boolean;
    erroresEstructura?: string[];
    erroresFirma?: string[];
    advertencias?: string[];
  }>> {
    const response = await api.post(`${this.baseUrl}/validar`, { xml });
    return response.data;
  }

  /**
   * Firma un documento FacturaE con XAdES-EPES
   */
  async firmarFacturaE(
    facturaId: string,
    certificadoId: string
  ): Promise<SingleResponse<IFirmarFacturaEResult>> {
    const response = await api.post(`${this.baseUrl}/${facturaId}/firmar`, { certificadoId });
    return response.data;
  }

  /**
   * Obtiene los certificados disponibles para firmar
   */
  async getCertificadosDisponibles(): Promise<SingleResponse<ICertificadoInfo[]>> {
    const response = await api.get(`${this.baseUrl}/certificados`);
    return response.data;
  }

  /**
   * Verifica los requisitos para enviar a FACE
   */
  async verificarRequisitos(facturaId: string): Promise<SingleResponse<IVerificacionRequisitos>> {
    const response = await api.get(`${this.baseUrl}/${facturaId}/face/verificar`);
    return response.data;
  }

  /**
   * Envía una factura a FACE
   */
  async enviarAFACE(
    facturaId: string,
    certificadoId: string,
    entorno: 'produccion' | 'pruebas' = 'pruebas'
  ): Promise<SingleResponse<IEnvioFACEResult>> {
    const response = await api.post(`${this.baseUrl}/${facturaId}/face/enviar`, {
      certificadoId,
      entorno,
    });
    return response.data;
  }

  /**
   * Consulta el estado de una factura en FACE
   */
  async consultarEstadoFACE(
    facturaId: string,
    certificadoId?: string,
    entorno: 'produccion' | 'pruebas' = 'pruebas'
  ): Promise<SingleResponse<IConsultaEstadoFACE>> {
    const params = new URLSearchParams();
    if (certificadoId) params.append('certificadoId', certificadoId);
    params.append('entorno', entorno);

    const response = await api.get(`${this.baseUrl}/${facturaId}/face/estado?${params.toString()}`);
    return response.data;
  }

  /**
   * Anula una factura en FACE
   */
  async anularEnFACE(
    facturaId: string,
    motivo: string,
    certificadoId: string,
    entorno: 'produccion' | 'pruebas' = 'pruebas'
  ): Promise<SingleResponse<{
    exito: boolean;
    codigoResultado?: string;
    descripcionResultado?: string;
    errores?: string[];
  }>> {
    const response = await api.post(`${this.baseUrl}/${facturaId}/face/anular`, {
      motivo,
      certificadoId,
      entorno,
    });
    return response.data;
  }

  /**
   * Obtiene el historial de estados FACE de una factura
   */
  async getHistorialFACE(facturaId: string): Promise<SingleResponse<IHistorialFacturaElectronica[]>> {
    const response = await api.get(`${this.baseUrl}/${facturaId}/face/historial`);
    return response.data;
  }

  /**
   * Genera y descarga FacturaE como archivo
   */
  async descargarComoArchivo(facturaId: string, nombreArchivo?: string): Promise<void> {
    try {
      const blob = await this.descargarFacturaE(facturaId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo || `FacturaE_${facturaId}.xsig`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando FacturaE:', error);
      throw error;
    }
  }
}

export const facturaEService = new FacturaEService();
export default facturaEService;
