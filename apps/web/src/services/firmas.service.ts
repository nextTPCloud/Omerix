import { api } from './api';

class FirmasService {
  // ===== Rutas publicas (sin auth) =====

  async getSolicitudPorToken(token: string) {
    try {
      const { data } = await api.get(`/firmas/firmar/${token}`);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async firmarManuscrita(token: string, datos: { imagenFirma: string; nombre: string; nif?: string }) {
    try {
      const { data } = await api.post(`/firmas/firmar/${token}/manuscrita`, datos);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async firmarConCertificado(token: string, datos: { certificadoBase64: string; password: string }) {
    try {
      const { data } = await api.post(`/firmas/firmar/${token}/certificado`, datos);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  // ===== Rutas protegidas =====

  async getSolicitudes(filtros?: { estado?: string; tipoDocumento?: string }) {
    try {
      const params = new URLSearchParams();
      if (filtros?.estado) params.append('estado', filtros.estado);
      if (filtros?.tipoDocumento) params.append('tipoDocumento', filtros.tipoDocumento);
      const { data } = await api.get(`/firmas/solicitudes?${params}`);
      return { success: true, data: data.solicitudes };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async crearSolicitud(datos: {
    documentoId: string;
    tipoDocumento: string;
    codigoDocumento: string;
    firmantes: Array<{ nombre: string; email?: string; telefono?: string }>;
    fechaExpiracion?: string;
    mensajePersonalizado?: string;
  }) {
    try {
      const { data } = await api.post('/firmas/solicitudes', datos);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async reenviarNotificacion(solicitudId: string, firmanteIndex: number) {
    try {
      const { data } = await api.post(`/firmas/solicitudes/${solicitudId}/reenviar/${firmanteIndex}`);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async getFirmasDocumento(tipoDocumento: string, documentoId: string) {
    try {
      const { data } = await api.get(`/firmas/documento/${tipoDocumento}/${documentoId}`);
      return { success: true, data: data.firmas };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async firmarInterna(datos: {
    documentoId: string;
    tipoDocumento: string;
    imagenFirma: string;
    firmante: { nombre: string; nif?: string };
  }) {
    try {
      const { data } = await api.post('/firmas/interna', datos);
      return { success: true, data: data.firma };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
}

export const firmasService = new FirmasService();
