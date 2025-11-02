import { StripeService } from './stripe/stripe.service';
import Pago from '../../models/Pago';
import MetodoPago from '../../models/MetodoPago';

export class PagosService {
  private stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  }

  // ============================================
  // OBTENER HISTORIAL DE TODOS LOS PAGOS
  // ============================================

  async getAllPayments(empresaId: string, filters?: {
    pasarela?: string;
    estado?: string;
    concepto?: string;
    limit?: number;
  }) {
    const query: any = { empresaId };

    if (filters?.pasarela) query.pasarela = filters.pasarela;
    if (filters?.estado) query.estado = filters.estado;
    if (filters?.concepto) query.concepto = filters.concepto;

    const limit = filters?.limit || 50;

    const pagos = await Pago.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return pagos;
  }

  // ============================================
  // OBTENER TODOS LOS MÉTODOS DE PAGO
  // ============================================

  async getAllPaymentMethods(empresaId: string) {
    const metodos = await MetodoPago.find({
      empresaId,
      activo: true,
    }).sort({ predeterminado: -1, createdAt: -1 });

    return metodos;
  }

  // ============================================
  // OBTENER ESTADÍSTICAS DE PAGOS
  // ============================================

  async getPaymentStats(empresaId: string) {
    const [
      totalPagos,
      pagosCompletados,
      pagosPendientes,
      pagosFallidos,
      totalIngresado,
      totalReembolsado,
    ] = await Promise.all([
      Pago.countDocuments({ empresaId }),
      Pago.countDocuments({ empresaId, estado: 'completado' }),
      Pago.countDocuments({ empresaId, estado: 'pendiente' }),
      Pago.countDocuments({ empresaId, estado: 'fallido' }),
      Pago.aggregate([
        { $match: { empresaId: empresaId as any, estado: 'completado' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Pago.aggregate([
        { $match: { empresaId: empresaId as any, estado: 'reembolsado' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    return {
      totalPagos,
      pagosCompletados,
      pagosPendientes,
      pagosFallidos,
      totalIngresado: totalIngresado[0]?.total || 0,
      totalReembolsado: totalReembolsado[0]?.total || 0,
      ingresoNeto: (totalIngresado[0]?.total || 0) - (totalReembolsado[0]?.total || 0),
    };
  }

  // ============================================
  // OBTENER DETALLE DE UN PAGO
  // ============================================

  async getPaymentById(empresaId: string, pagoId: string) {
    const pago = await Pago.findOne({
      _id: pagoId,
      empresaId,
    });

    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    return pago;
  }
}