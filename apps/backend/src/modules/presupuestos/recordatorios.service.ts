import mongoose, { Model } from 'mongoose';
import { IPresupuesto, EstadoPresupuesto, IRecordatorioEnviado } from './Presupuesto';
import { sendEmail, emailTemplates } from '@/utils/email';
import { IDatabaseConfig } from '@/models/Empresa';
import { getPresupuestoModel, getAgenteComercialModel } from '@/utils/dynamic-models.helper';
import Empresa from '@/models/Empresa';

// Configuración por defecto para recordatorios
const DEFAULT_CONFIG = {
  diasAntesExpiracion: 7,
  diasSinRespuesta: 14,
  maxRecordatoriosPorPresupuesto: 3,
  intervaloDiasEntreRecordatorios: 3,
};

interface RecordatorioResult {
  presupuestoId: string;
  codigo: string;
  tipo: 'expiracion' | 'seguimiento' | 'sin_respuesta';
  destinatario: string;
  success: boolean;
  message: string;
}

interface IEmpresa {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  nombreComercial?: string;
  email?: string;
  telefono?: string;
  emailConfig?: {
    fromEmail?: string;
    fromName?: string;
  };
}

interface IAgenteComercial {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  apellidos?: string;
  email?: string;
  activo: boolean;
}

class RecordatoriosService {
  /**
   * Obtener presupuestos próximos a expirar que necesitan recordatorio
   */
  async getPresupuestosProximosExpirar(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    diasAlerta: number = DEFAULT_CONFIG.diasAntesExpiracion
  ): Promise<IPresupuesto[]> {
    const PresupuestoModel = await getPresupuestoModel(empresaId.toString(), dbConfig);

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAlerta);

    const presupuestos = await PresupuestoModel.find({
      activo: true,
      estado: { $in: [EstadoPresupuesto.ENVIADO, EstadoPresupuesto.PENDIENTE] },
      fechaValidez: { $lte: fechaLimite, $gte: new Date() },
      'recordatoriosConfig.activo': { $ne: false },
      clienteEmail: { $exists: true, $ne: '' },
    }).lean() as IPresupuesto[];

    // Filtrar los que ya tienen el máximo de recordatorios de expiración
    return presupuestos.filter(p => {
      const recordatoriosExpiracion = (p.recordatoriosEnviados || []).filter(
        (r: IRecordatorioEnviado) => r.tipo === 'expiracion' && r.enviado
      );
      const maxRecordatorios = p.recordatoriosConfig?.maxRecordatorios || DEFAULT_CONFIG.maxRecordatoriosPorPresupuesto;

      if (recordatoriosExpiracion.length >= maxRecordatorios) return false;

      // Verificar intervalo mínimo entre recordatorios
      const ultimoRecordatorio = recordatoriosExpiracion[recordatoriosExpiracion.length - 1];
      if (ultimoRecordatorio) {
        const diasDesdeUltimo = Math.floor(
          (new Date().getTime() - new Date(ultimoRecordatorio.fecha).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diasDesdeUltimo < DEFAULT_CONFIG.intervaloDiasEntreRecordatorios) return false;
      }

      return true;
    });
  }

  /**
   * Obtener presupuestos sin respuesta que necesitan seguimiento
   */
  async getPresupuestosSinRespuesta(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    diasSinRespuesta: number = DEFAULT_CONFIG.diasSinRespuesta
  ): Promise<IPresupuesto[]> {
    const PresupuestoModel = await getPresupuestoModel(empresaId.toString(), dbConfig);

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasSinRespuesta);

    const presupuestos = await PresupuestoModel.find({
      activo: true,
      estado: { $in: [EstadoPresupuesto.ENVIADO, EstadoPresupuesto.PENDIENTE] },
      fechaEnvio: { $lte: fechaLimite },
      fechaValidez: { $gte: new Date() }, // Aún vigente
      'recordatoriosConfig.activo': { $ne: false },
      clienteEmail: { $exists: true, $ne: '' },
    }).lean() as IPresupuesto[];

    // Filtrar los que ya tienen el máximo de recordatorios de seguimiento
    return presupuestos.filter(p => {
      const recordatoriosSeguimiento = (p.recordatoriosEnviados || []).filter(
        (r: IRecordatorioEnviado) => r.tipo === 'sin_respuesta' && r.enviado
      );
      const maxRecordatorios = p.recordatoriosConfig?.maxRecordatorios || DEFAULT_CONFIG.maxRecordatoriosPorPresupuesto;

      if (recordatoriosSeguimiento.length >= maxRecordatorios) return false;

      // Verificar intervalo mínimo entre recordatorios
      const ultimoRecordatorio = recordatoriosSeguimiento[recordatoriosSeguimiento.length - 1];
      if (ultimoRecordatorio) {
        const diasDesdeUltimo = Math.floor(
          (new Date().getTime() - new Date(ultimoRecordatorio.fecha).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diasDesdeUltimo < DEFAULT_CONFIG.intervaloDiasEntreRecordatorios) return false;
      }

      return true;
    });
  }

  /**
   * Enviar recordatorio de expiración a un presupuesto
   */
  async enviarRecordatorioExpiracion(
    presupuesto: IPresupuesto,
    empresa: IEmpresa,
    dbConfig: IDatabaseConfig
  ): Promise<RecordatorioResult> {
    const diasRestantes = Math.ceil(
      (new Date(presupuesto.fechaValidez).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

    const formatDate = (date: Date) =>
      new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    try {
      // Enviar al cliente
      if (presupuesto.clienteEmail && presupuesto.recordatoriosConfig?.enviarAlCliente !== false) {
        const html = emailTemplates.presupuestoExpiracion({
          clienteNombre: presupuesto.clienteNombre,
          codigoPresupuesto: presupuesto.codigo,
          tituloPresupuesto: presupuesto.titulo,
          fechaValidez: formatDate(presupuesto.fechaValidez),
          diasRestantes,
          totalPresupuesto: formatCurrency(presupuesto.totales?.totalPresupuesto || 0),
          empresaNombre: empresa.nombreComercial || empresa.nombre,
          contactoEmail: empresa.email,
          contactoTelefono: empresa.telefono,
        });

        const result = await sendEmail(
          presupuesto.clienteEmail,
          `⏰ Recordatorio: Su presupuesto ${presupuesto.codigo} expira pronto`,
          html
        );

        // Registrar el recordatorio enviado
        const PresupuestoModel = await getPresupuestoModel(empresa._id.toString(), dbConfig);
        await PresupuestoModel.updateOne(
          { _id: presupuesto._id },
          {
            $push: {
              recordatoriosEnviados: {
                fecha: new Date(),
                tipo: 'expiracion',
                destinatario: presupuesto.clienteEmail,
                enviado: result.success,
                error: result.success ? undefined : result.message,
              },
            },
          }
        );

        return {
          presupuestoId: presupuesto._id.toString(),
          codigo: presupuesto.codigo,
          tipo: 'expiracion',
          destinatario: presupuesto.clienteEmail,
          success: result.success,
          message: result.message,
        };
      }

      return {
        presupuestoId: presupuesto._id.toString(),
        codigo: presupuesto.codigo,
        tipo: 'expiracion',
        destinatario: '',
        success: false,
        message: 'Sin email de cliente configurado',
      };
    } catch (error: any) {
      return {
        presupuestoId: presupuesto._id.toString(),
        codigo: presupuesto.codigo,
        tipo: 'expiracion',
        destinatario: presupuesto.clienteEmail || '',
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Enviar recordatorio de seguimiento (sin respuesta)
   */
  async enviarRecordatorioSeguimiento(
    presupuesto: IPresupuesto,
    empresa: IEmpresa,
    dbConfig: IDatabaseConfig
  ): Promise<RecordatorioResult> {
    const diasSinRespuesta = presupuesto.fechaEnvio
      ? Math.floor((new Date().getTime() - new Date(presupuesto.fechaEnvio).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

    const formatDate = (date: Date) =>
      new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    try {
      if (presupuesto.clienteEmail && presupuesto.recordatoriosConfig?.enviarAlCliente !== false) {
        const html = emailTemplates.presupuestoSinRespuesta({
          clienteNombre: presupuesto.clienteNombre,
          codigoPresupuesto: presupuesto.codigo,
          tituloPresupuesto: presupuesto.titulo,
          fechaEnvio: presupuesto.fechaEnvio ? formatDate(presupuesto.fechaEnvio) : 'N/A',
          diasSinRespuesta,
          totalPresupuesto: formatCurrency(presupuesto.totales?.totalPresupuesto || 0),
          empresaNombre: empresa.nombreComercial || empresa.nombre,
          contactoEmail: empresa.email,
          contactoTelefono: empresa.telefono,
        });

        const result = await sendEmail(
          presupuesto.clienteEmail,
          `📋 Seguimiento: Presupuesto ${presupuesto.codigo}`,
          html
        );

        // Registrar el recordatorio enviado
        const PresupuestoModel = await getPresupuestoModel(empresa._id.toString(), dbConfig);
        await PresupuestoModel.updateOne(
          { _id: presupuesto._id },
          {
            $push: {
              recordatoriosEnviados: {
                fecha: new Date(),
                tipo: 'sin_respuesta',
                destinatario: presupuesto.clienteEmail,
                enviado: result.success,
                error: result.success ? undefined : result.message,
              },
            },
          }
        );

        return {
          presupuestoId: presupuesto._id.toString(),
          codigo: presupuesto.codigo,
          tipo: 'sin_respuesta',
          destinatario: presupuesto.clienteEmail,
          success: result.success,
          message: result.message,
        };
      }

      return {
        presupuestoId: presupuesto._id.toString(),
        codigo: presupuesto.codigo,
        tipo: 'sin_respuesta',
        destinatario: '',
        success: false,
        message: 'Sin email de cliente configurado',
      };
    } catch (error: any) {
      return {
        presupuestoId: presupuesto._id.toString(),
        codigo: presupuesto.codigo,
        tipo: 'sin_respuesta',
        destinatario: presupuesto.clienteEmail || '',
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Enviar notificación a agentes comerciales con sus presupuestos pendientes
   */
  async notificarAgentes(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    empresa: IEmpresa
  ): Promise<RecordatorioResult[]> {
    const results: RecordatorioResult[] = [];

    const [proximosExpirar, sinRespuesta] = await Promise.all([
      this.getPresupuestosProximosExpirar(empresaId, dbConfig),
      this.getPresupuestosSinRespuesta(empresaId, dbConfig),
    ]);

    // Agrupar por agente
    const presupuestosPorAgente = new Map<string, IPresupuesto[]>();

    const todosPendientes = [...proximosExpirar, ...sinRespuesta];
    for (const p of todosPendientes) {
      if (p.agenteComercialId) {
        const agenteId = p.agenteComercialId.toString();
        if (!presupuestosPorAgente.has(agenteId)) {
          presupuestosPorAgente.set(agenteId, []);
        }
        presupuestosPorAgente.get(agenteId)!.push(p);
      }
    }

    // Enviar notificación a cada agente
    const AgenteModel = await getAgenteComercialModel(empresaId.toString(), dbConfig);

    for (const [agenteId, presupuestos] of presupuestosPorAgente) {
      try {
        const agente = await AgenteModel.findById(agenteId).lean() as IAgenteComercial | null;
        if (!agente?.email || !agente.activo) continue;

        const formatCurrency = (amount: number) =>
          new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

        const presupuestosData = presupuestos.map(p => {
          const diasRestantes = Math.ceil(
            (new Date(p.fechaValidez).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          const diasSinRespuesta = p.fechaEnvio
            ? Math.floor((new Date().getTime() - new Date(p.fechaEnvio).getTime()) / (1000 * 60 * 60 * 24))
            : undefined;

          return {
            codigo: p.codigo,
            clienteNombre: p.clienteNombre,
            total: formatCurrency(p.totales?.totalPresupuesto || 0),
            diasRestantes: diasRestantes > 0 ? diasRestantes : undefined,
            diasSinRespuesta,
          };
        });

        const html = emailTemplates.recordatorioAgente({
          agenteNombre: `${agente.nombre}${agente.apellidos ? ' ' + agente.apellidos : ''}`,
          tipoRecordatorio: 'expiracion',
          presupuestos: presupuestosData,
          empresaNombre: empresa.nombreComercial || empresa.nombre,
        });

        const result = await sendEmail(
          agente.email,
          `🔔 Tienes ${presupuestos.length} presupuesto(s) pendientes de atención`,
          html
        );

        results.push({
          presupuestoId: '',
          codigo: `Agente: ${agente.nombre}`,
          tipo: 'seguimiento',
          destinatario: agente.email,
          success: result.success,
          message: result.message,
        });
      } catch (error: any) {
        results.push({
          presupuestoId: '',
          codigo: `Agente: ${agenteId}`,
          tipo: 'seguimiento',
          destinatario: '',
          success: false,
          message: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Ejecutar todos los recordatorios pendientes
   */
  async ejecutarRecordatorios(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    opciones?: {
      enviarExpiracion?: boolean;
      enviarSeguimiento?: boolean;
      notificarAgentes?: boolean;
    }
  ): Promise<{
    expiracion: RecordatorioResult[];
    seguimiento: RecordatorioResult[];
    agentes: RecordatorioResult[];
    resumen: {
      total: number;
      enviados: number;
      fallidos: number;
    };
  }> {
    const opts = {
      enviarExpiracion: opciones?.enviarExpiracion ?? true,
      enviarSeguimiento: opciones?.enviarSeguimiento ?? true,
      notificarAgentes: opciones?.notificarAgentes ?? true,
    };

    const empresa = await Empresa.findById(empresaId).lean() as IEmpresa | null;

    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }

    const results = {
      expiracion: [] as RecordatorioResult[],
      seguimiento: [] as RecordatorioResult[],
      agentes: [] as RecordatorioResult[],
    };

    // Recordatorios de expiración
    if (opts.enviarExpiracion) {
      const proximosExpirar = await this.getPresupuestosProximosExpirar(empresaId, dbConfig);
      for (const presupuesto of proximosExpirar) {
        const result = await this.enviarRecordatorioExpiracion(presupuesto, empresa, dbConfig);
        results.expiracion.push(result);
      }
    }

    // Recordatorios de seguimiento
    if (opts.enviarSeguimiento) {
      const sinRespuesta = await this.getPresupuestosSinRespuesta(empresaId, dbConfig);
      for (const presupuesto of sinRespuesta) {
        const result = await this.enviarRecordatorioSeguimiento(presupuesto, empresa, dbConfig);
        results.seguimiento.push(result);
      }
    }

    // Notificaciones a agentes
    if (opts.notificarAgentes) {
      results.agentes = await this.notificarAgentes(empresaId, dbConfig, empresa);
    }

    // Calcular resumen
    const todosResultados = [...results.expiracion, ...results.seguimiento, ...results.agentes];

    return {
      ...results,
      resumen: {
        total: todosResultados.length,
        enviados: todosResultados.filter(r => r.success).length,
        fallidos: todosResultados.filter(r => !r.success).length,
      },
    };
  }

  /**
   * Obtener historial de recordatorios de un presupuesto
   */
  async getHistorialRecordatorios(
    empresaId: mongoose.Types.ObjectId,
    presupuestoId: string,
    dbConfig: IDatabaseConfig
  ): Promise<IRecordatorioEnviado[]> {
    const PresupuestoModel = await getPresupuestoModel(empresaId.toString(), dbConfig);
    const presupuesto = await PresupuestoModel.findById(presupuestoId)
      .select('recordatoriosEnviados')
      .lean() as IPresupuesto | null;

    return presupuesto?.recordatoriosEnviados || [];
  }

  /**
   * Actualizar configuración de recordatorios de un presupuesto
   */
  async actualizarConfigRecordatorios(
    empresaId: mongoose.Types.ObjectId,
    presupuestoId: string,
    config: {
      activo?: boolean;
      diasAntesExpiracion?: number;
      enviarAlCliente?: boolean;
      enviarAlAgente?: boolean;
      maxRecordatorios?: number;
    },
    dbConfig: IDatabaseConfig
  ): Promise<IPresupuesto | null> {
    const PresupuestoModel = await getPresupuestoModel(empresaId.toString(), dbConfig);

    return await PresupuestoModel.findByIdAndUpdate(
      presupuestoId,
      { $set: { recordatoriosConfig: config } },
      { new: true }
    );
  }

  /**
   * Enviar recordatorio manual a un presupuesto específico
   */
  async enviarRecordatorioManual(
    empresaId: mongoose.Types.ObjectId,
    presupuestoId: string,
    tipo: 'expiracion' | 'seguimiento',
    dbConfig: IDatabaseConfig
  ): Promise<RecordatorioResult> {
    const PresupuestoModel = await getPresupuestoModel(empresaId.toString(), dbConfig);
    const presupuesto = await PresupuestoModel.findById(presupuestoId).lean() as IPresupuesto | null;

    if (!presupuesto) {
      return {
        presupuestoId,
        codigo: '',
        tipo,
        destinatario: '',
        success: false,
        message: 'Presupuesto no encontrado',
      };
    }

    const empresa = await Empresa.findById(empresaId).lean() as IEmpresa | null;

    if (!empresa) {
      return {
        presupuestoId,
        codigo: presupuesto.codigo,
        tipo,
        destinatario: '',
        success: false,
        message: 'Empresa no encontrada',
      };
    }

    if (tipo === 'expiracion') {
      return await this.enviarRecordatorioExpiracion(presupuesto, empresa, dbConfig);
    } else {
      return await this.enviarRecordatorioSeguimiento(presupuesto, empresa, dbConfig);
    }
  }

  /**
   * Obtener resumen de recordatorios pendientes
   */
  async getResumenPendientes(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{
    proximosExpirar: number;
    sinRespuesta: number;
    totalPendientes: number;
  }> {
    const [proximosExpirar, sinRespuesta] = await Promise.all([
      this.getPresupuestosProximosExpirar(empresaId, dbConfig),
      this.getPresupuestosSinRespuesta(empresaId, dbConfig),
    ]);

    // Eliminar duplicados
    const idsUnicos = new Set([
      ...proximosExpirar.map(p => p._id.toString()),
      ...sinRespuesta.map(p => p._id.toString()),
    ]);

    return {
      proximosExpirar: proximosExpirar.length,
      sinRespuesta: sinRespuesta.length,
      totalPendientes: idsUnicos.size,
    };
  }
}

export const recordatoriosService = new RecordatoriosService();
export default recordatoriosService;
