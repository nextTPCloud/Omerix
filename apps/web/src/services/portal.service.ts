import axios from 'axios';

// Cliente axios sin autenticación para el portal público
const portalApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

interface PresupuestoPortal {
  _id: string;
  codigo: string;
  serie: string;
  numero: number;
  fecha: string;
  fechaValidez: string;
  estado: string;
  clienteNombre: string;
  clienteNif: string;
  titulo?: string;
  descripcion?: string;
  lineas: Array<{
    _id?: string;
    nombre: string;
    descripcion?: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
    iva: number;
    ivaImporte: number;
    total: number;
    unidad?: string;
  }>;
  totales: {
    subtotalBruto: number;
    totalDescuentos: number;
    subtotalNeto: number;
    desgloseIva: Array<{
      tipo: number;
      base: number;
      cuota: number;
    }>;
    totalIva: number;
    totalPresupuesto: number;
  };
  condiciones?: {
    validezDias?: number;
    tiempoEntrega?: string;
    garantia?: string;
    portesPagados?: boolean;
    portesImporte?: number;
  };
  introduccion?: string;
  piePagina?: string;
  condicionesLegales?: string;
  respuestaCliente?: {
    fecha: string;
    aceptado: boolean;
    comentarios?: string;
    nombreFirmante?: string;
  };
}

interface EmpresaPortal {
  nombre: string;
  nif?: string;
  logo?: string;
  email?: string;
  telefono?: string;
  direccion?: {
    calle?: string;
    ciudad?: string;
    codigoPostal?: string;
    provincia?: string;
    pais?: string;
  };
  web?: string;
}

interface PortalResponse {
  success: boolean;
  data?: {
    presupuesto: PresupuestoPortal;
    empresa: EmpresaPortal;
    puedeResponder: boolean;
  };
  message?: string;
}

interface ResponderResponse {
  success: boolean;
  message: string;
}

export const portalService = {
  /**
   * Obtener presupuesto por token (público)
   */
  async obtenerPresupuesto(token: string): Promise<PortalResponse> {
    try {
      const response = await portalApi.get<PortalResponse>(`/portal/presupuesto/${token}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener el presupuesto',
      };
    }
  },

  /**
   * Registrar respuesta del cliente (público)
   */
  async responderPresupuesto(
    token: string,
    respuesta: {
      aceptado: boolean;
      comentarios?: string;
      nombreFirmante?: string;
    }
  ): Promise<ResponderResponse> {
    try {
      const response = await portalApi.post<ResponderResponse>(
        `/portal/presupuesto/${token}/responder`,
        respuesta
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al registrar la respuesta',
      };
    }
  },
};

export default portalService;
export type { PresupuestoPortal, EmpresaPortal, PortalResponse };
