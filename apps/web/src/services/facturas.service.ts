import { api } from './api';
import {
  IFactura,
  CreateFacturaDTO,
  UpdateFacturaDTO,
  SearchFacturasParams,
  CrearDesdeAlbaranesParams,
  CrearRectificativaParams,
  RegistrarCobroParams,
  EmitirFacturaParams,
  AnularFacturaParams,
  CambiarEstadoFacturaParams,
  FacturaEstadisticas,
  IVeriFactu,
  ITicketBAI,
} from '@/types/factura.types';

// ============================================
// TIPOS DE RESPUESTA
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface QRResponse {
  success: boolean;
  data: {
    codigoQR: string;
    urlVerificacion: string;
    verifactu?: IVeriFactu;
    ticketbai?: ITicketBAI;
  };
}

// ============================================
// SERVICIO DE FACTURAS
// ============================================

class FacturasService {
  private baseUrl = '/facturas';

  // ============================================
  // CRUD BÁSICO
  // ============================================

  /**
   * Obtiene todas las facturas con paginación y filtros opcionales
   */
  async getAll(params?: SearchFacturasParams): Promise<PaginatedResponse<IFactura>> {
    try {
      const response = await api.get<PaginatedResponse<IFactura>>(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      throw error;
    }
  }

  /**
   * Obtiene una factura por su ID
   */
  async getById(id: string): Promise<ApiResponse<IFactura>> {
    try {
      const response = await api.get<ApiResponse<IFactura>>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener factura:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva factura
   */
  async create(data: CreateFacturaDTO): Promise<ApiResponse<IFactura>> {
    try {
      const response = await api.post<ApiResponse<IFactura>>(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error al crear factura:', error);
      throw error;
    }
  }

  /**
   * Actualiza una factura existente (solo borradores)
   */
  async update(id: string, data: UpdateFacturaDTO): Promise<ApiResponse<IFactura>> {
    try {
      const response = await api.put<ApiResponse<IFactura>>(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar factura:', error);
      throw error;
    }
  }

  /**
   * Elimina una factura (solo borradores)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      throw error;
    }
  }

  // ============================================
  // ACCIONES ESPECIALES
  // ============================================

  /**
   * Emite una factura (genera datos fiscales VeriFactu/TicketBAI)
   * Una vez emitida, la factura se vuelve INMUTABLE
   */
  async emitir(id: string, data?: EmitirFacturaParams): Promise<ApiResponse<IFactura>> {
    try {
      const response = await api.post<ApiResponse<IFactura>>(`${this.baseUrl}/${id}/emitir`, data || {});
      return response.data;
    } catch (error) {
      console.error('Error al emitir factura:', error);
      throw error;
    }
  }

  /**
   * Registra un cobro en la factura
   */
  async registrarCobro(id: string, data: RegistrarCobroParams): Promise<ApiResponse<IFactura>> {
    try {
      const response = await api.post<ApiResponse<IFactura>>(`${this.baseUrl}/${id}/cobro`, data);
      return response.data;
    } catch (error) {
      console.error('Error al registrar cobro:', error);
      throw error;
    }
  }

  /**
   * Anula una factura
   */
  async anular(id: string, data: AnularFacturaParams): Promise<ApiResponse<IFactura>> {
    try {
      const response = await api.post<ApiResponse<IFactura>>(`${this.baseUrl}/${id}/anular`, data);
      return response.data;
    } catch (error) {
      console.error('Error al anular factura:', error);
      throw error;
    }
  }

  /**
   * Cambia el estado de una factura
   */
  async cambiarEstado(id: string, data: CambiarEstadoFacturaParams): Promise<ApiResponse<IFactura>> {
    try {
      const response = await api.patch<ApiResponse<IFactura>>(`${this.baseUrl}/${id}/estado`, data);
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      throw error;
    }
  }

  /**
   * Obtiene el código QR de verificación de la factura
   */
  async getQR(id: string): Promise<QRResponse> {
    try {
      const response = await api.get<QRResponse>(`${this.baseUrl}/${id}/qr`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener QR:', error);
      throw error;
    }
  }

  // ============================================
  // CREACIÓN DESDE OTROS DOCUMENTOS
  // ============================================

  /**
   * Crea facturas desde albaranes
   */
  async crearDesdeAlbaranes(data: CrearDesdeAlbaranesParams): Promise<ApiResponse<IFactura[]>> {
    try {
      const response = await api.post<ApiResponse<IFactura[]>>(`${this.baseUrl}/desde-albaranes`, data);
      return response.data;
    } catch (error) {
      console.error('Error al crear facturas desde albaranes:', error);
      throw error;
    }
  }

  /**
   * Crea factura directa desde albaranes (emitida, no borrador)
   * Útil para facturación rápida donde no se necesita revisar el borrador
   */
  async crearFacturaDirecta(data: CrearDesdeAlbaranesParams & {
    sistemaFiscal?: 'verifactu' | 'ticketbai' | 'sii' | 'ninguno';
    enviarAAEAT?: boolean;
  }): Promise<ApiResponse<IFactura[]>> {
    try {
      const response = await api.post<ApiResponse<IFactura[]>>(`${this.baseUrl}/factura-directa`, data);
      return response.data;
    } catch (error) {
      console.error('Error al crear factura directa:', error);
      throw error;
    }
  }

  /**
   * Crea una factura rectificativa
   */
  async crearRectificativa(data: CrearRectificativaParams): Promise<ApiResponse<IFactura>> {
    try {
      const response = await api.post<ApiResponse<IFactura>>(`${this.baseUrl}/rectificativa`, data);
      return response.data;
    } catch (error) {
      console.error('Error al crear rectificativa:', error);
      throw error;
    }
  }

  /**
   * Crea factura directamente desde un presupuesto (sin pasar por pedido/albarán)
   */
  async crearDesdePresupuesto(presupuestoId: string, params?: {
    copiarNotas?: boolean;
    emitirDirectamente?: boolean;
  }): Promise<ApiResponse<IFactura>> {
    try {
      const response = await api.post<ApiResponse<IFactura>>(
        `${this.baseUrl}/desde-presupuesto/${presupuestoId}`,
        params || {}
      );
      return response.data;
    } catch (error) {
      console.error('Error al crear factura desde presupuesto:', error);
      throw error;
    }
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Obtiene estadísticas de facturas
   */
  async getEstadisticas(): Promise<ApiResponse<FacturaEstadisticas>> {
    try {
      const response = await api.get<ApiResponse<FacturaEstadisticas>>(`${this.baseUrl}/estadisticas`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtener alertas de facturas (pendientes cobro, vencidas, próximas a vencer)
   */
  async getAlertas(diasAlerta: number = 7): Promise<ApiResponse<{
    alertas: {
      pendientesCobro: IFactura[];
      vencidas: IFactura[];
      proximasVencer: IFactura[];
    };
    resumen: {
      pendientesCobro: number;
      vencidas: number;
      proximasVencer: number;
      total: number;
    };
  }>> {
    try {
      const response = await api.get<ApiResponse<{
        alertas: {
          pendientesCobro: IFactura[];
          vencidas: IFactura[];
          proximasVencer: IFactura[];
        };
        resumen: {
          pendientesCobro: number;
          vencidas: number;
          proximasVencer: number;
          total: number;
        };
      }>>(`${this.baseUrl}/alertas`, { params: { diasAlerta } });
      return response.data;
    } catch (error) {
      console.error('Error al obtener alertas de facturas:', error);
      throw error;
    }
  }

  // ============================================
  // BÚSQUEDAS ESPECIALIZADAS
  // ============================================

  /**
   * Obtiene facturas pendientes de cobro
   */
  async getPendientesCobro(params?: Omit<SearchFacturasParams, 'cobrada'>): Promise<PaginatedResponse<IFactura>> {
    return this.getAll({
      ...params,
      cobrada: 'false',
      sortBy: 'fechaVencimiento',
      sortOrder: 'asc',
    });
  }

  /**
   * Obtiene facturas vencidas
   */
  async getVencidas(params?: Omit<SearchFacturasParams, 'vencida'>): Promise<PaginatedResponse<IFactura>> {
    return this.getAll({
      ...params,
      vencida: 'true',
      sortBy: 'fechaVencimiento',
      sortOrder: 'asc',
    });
  }

  /**
   * Obtiene facturas por cliente
   */
  async getByCliente(clienteId: string, params?: Omit<SearchFacturasParams, 'clienteId'>): Promise<PaginatedResponse<IFactura>> {
    return this.getAll({
      ...params,
      clienteId,
    });
  }

  /**
   * Obtiene facturas rectificativas
   */
  async getRectificativas(params?: Omit<SearchFacturasParams, 'rectificativa'>): Promise<PaginatedResponse<IFactura>> {
    return this.getAll({
      ...params,
      rectificativa: 'true',
    });
  }

  /**
   * Obtiene facturas de un período
   */
  async getByPeriodo(fechaDesde: string, fechaHasta: string, params?: Omit<SearchFacturasParams, 'fechaDesde' | 'fechaHasta'>): Promise<PaginatedResponse<IFactura>> {
    return this.getAll({
      ...params,
      fechaDesde,
      fechaHasta,
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Duplica una factura (crea una nueva en borrador basada en otra)
   */
  async duplicar(id: string): Promise<ApiResponse<IFactura>> {
    try {
      const facturaOriginal = await this.getById(id);
      if (!facturaOriginal.data) {
        throw new Error('Factura no encontrada');
      }

      const { _id, codigo, serie, numero, estado, fecha, fechaVencimiento, inmutable, codigoQR, urlVerificacion, verifactu, ticketbai, fiscalLogId, historial, cobros, importeCobrado, importePendiente, ...datosFactura } = facturaOriginal.data;

      const nuevaFactura: CreateFacturaDTO = {
        ...datosFactura,
        clienteId: typeof datosFactura.clienteId === 'string' ? datosFactura.clienteId : datosFactura.clienteId._id,
        proyectoId: datosFactura.proyectoId ? (typeof datosFactura.proyectoId === 'string' ? datosFactura.proyectoId : datosFactura.proyectoId._id) : undefined,
        agenteComercialId: datosFactura.agenteComercialId ? (typeof datosFactura.agenteComercialId === 'string' ? datosFactura.agenteComercialId : datosFactura.agenteComercialId._id) : undefined,
        facturaRectificadaId: datosFactura.facturaRectificadaId ? (typeof datosFactura.facturaRectificadaId === 'string' ? datosFactura.facturaRectificadaId : (datosFactura.facturaRectificadaId as any)._id) : undefined,
        fecha: new Date().toISOString(),
        vencimientos: datosFactura.vencimientos?.map(v => ({
          ...v,
          cobrado: false,
          fechaCobro: undefined,
          referenciaPago: undefined,
        })),
      } as CreateFacturaDTO;

      return this.create(nuevaFactura);
    } catch (error) {
      console.error('Error al duplicar factura:', error);
      throw error;
    }
  }

  /**
   * Envía la factura por email con PDF adjunto
   */
  async enviarPorEmail(id: string, options?: {
    emailDestino?: string;
    asunto?: string;
    mensaje?: string;
    pdfOptions?: {
      mostrarDescripcion?: 'ninguna' | 'corta' | 'larga';
      mostrarReferencias?: boolean;
      mostrarCondiciones?: boolean;
      mostrarCuentaBancaria?: boolean;
      mostrarLOPD?: boolean;
      mostrarRegistroMercantil?: boolean;
    };
  }): Promise<ApiResponse<{ enviado: boolean; mensaje: string }>> {
    try {
      const response = await api.post<ApiResponse<{ enviado: boolean; mensaje: string }>>(`${this.baseUrl}/${id}/enviar-email`, options || {});
      return response.data;
    } catch (error) {
      console.error('Error al enviar factura por email:', error);
      throw error;
    }
  }

  /**
   * Calcula los totales a partir de las líneas
   */
  calcularTotales(lineas: IFactura['lineas'], descuentoGlobalPorcentaje: number = 0, retencionIRPF: number = 0) {
    let subtotalBruto = 0;
    let totalDescuentos = 0;
    let costeTotalMateriales = 0;
    let costeTotalServicios = 0;
    let costeTotalKits = 0;
    let totalRecargoEquivalencia = 0;

    const ivaAgrupado: Record<number, { base: number; cuota: number; recargo: number; cuotaRecargo: number }> = {};

    for (const linea of lineas) {
      if (!linea.incluidoEnTotal) continue;

      subtotalBruto += linea.cantidad * linea.precioUnitario;
      totalDescuentos += linea.descuentoImporte;
      totalRecargoEquivalencia += linea.recargoImporte || 0;

      const tipoIva = linea.iva || 21;
      if (!ivaAgrupado[tipoIva]) {
        ivaAgrupado[tipoIva] = { base: 0, cuota: 0, recargo: linea.recargoEquivalencia || 0, cuotaRecargo: 0 };
      }
      ivaAgrupado[tipoIva].base += linea.subtotal;
      ivaAgrupado[tipoIva].cuota += linea.ivaImporte;
      ivaAgrupado[tipoIva].cuotaRecargo += linea.recargoImporte || 0;

      switch (linea.tipo) {
        case 'servicio':
          costeTotalServicios += linea.costeTotalLinea;
          break;
        case 'kit':
          costeTotalKits += linea.costeTotalLinea;
          break;
        default:
          costeTotalMateriales += linea.costeTotalLinea;
      }
    }

    const subtotalNeto = subtotalBruto - totalDescuentos;
    const descuentoGlobalImporte = subtotalNeto * (descuentoGlobalPorcentaje / 100);
    const subtotalNetoConDescuento = subtotalNeto - descuentoGlobalImporte;

    const factorDescuento = subtotalNeto > 0 ? subtotalNetoConDescuento / subtotalNeto : 1;
    const desgloseIva = Object.entries(ivaAgrupado).map(([tipo, valores]) => ({
      tipo: Number(tipo),
      base: Math.round(valores.base * factorDescuento * 100) / 100,
      cuota: Math.round(valores.cuota * factorDescuento * 100) / 100,
      recargo: valores.recargo,
      cuotaRecargo: Math.round(valores.cuotaRecargo * factorDescuento * 100) / 100,
    }));

    const totalIva = desgloseIva.reduce((sum, item) => sum + item.cuota, 0);
    const totalRecargoAjustado = desgloseIva.reduce((sum, item) => sum + item.cuotaRecargo, 0);

    const importeRetencion = subtotalNetoConDescuento * (retencionIRPF / 100);
    const totalFactura = subtotalNetoConDescuento + totalIva + totalRecargoAjustado - importeRetencion;

    const costeTotal = costeTotalMateriales + costeTotalServicios + costeTotalKits;
    const margenBruto = subtotalNetoConDescuento - costeTotal;
    const margenPorcentaje = costeTotal > 0 ? (margenBruto / costeTotal) * 100 : 0;

    return {
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
      totalDescuentos: Math.round((totalDescuentos + descuentoGlobalImporte) * 100) / 100,
      subtotalNeto: Math.round(subtotalNetoConDescuento * 100) / 100,
      desgloseIva,
      totalIva: Math.round(totalIva * 100) / 100,
      totalRecargoEquivalencia: Math.round(totalRecargoAjustado * 100) / 100,
      totalFactura: Math.round(totalFactura * 100) / 100,
      costeTotalMateriales: Math.round(costeTotalMateriales * 100) / 100,
      costeTotalServicios: Math.round(costeTotalServicios * 100) / 100,
      costeTotalKits: Math.round(costeTotalKits * 100) / 100,
      costeTotal: Math.round(costeTotal * 100) / 100,
      margenBruto: Math.round(margenBruto * 100) / 100,
      margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
    };
  }
}

export const facturasService = new FacturasService();
export default facturasService;
