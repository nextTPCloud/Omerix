// apps/backend/src/modules/recordatorios/recordatorios.service.ts

import mongoose from 'mongoose';
import {
  Recordatorio,
  AlertaConfig,
  IRecordatorio,
  IAlertaConfig,
  TipoRecordatorio,
  PrioridadRecordatorio,
  EstadoRecordatorio,
  CanalNotificacion,
} from './Recordatorio';
import { sendEmail, emailTemplates } from '@/utils/email';
import { getDynamicModel } from '@/utils/dynamic-models.helper';
import Empresa, { IDatabaseConfig } from '@/modules/empresa/Empresa';

// ============================================
// INTERFACES DE ENTRADA
// ============================================

interface CrearRecordatorioDTO {
  tipo: TipoRecordatorio;
  prioridad?: PrioridadRecordatorio;
  titulo: string;
  mensaje: string;
  icono?: string;
  color?: string;
  entidadTipo?: string;
  entidadId?: string;
  entidadNombre?: string;
  fechaProgramada: Date;
  repetir?: boolean;
  frecuenciaRepeticion?: 'diario' | 'semanal' | 'mensual' | 'anual';
  finRepeticion?: Date;
  canales?: CanalNotificacion[];
  usuarioId?: string;
  metadata?: Record<string, any>;
}

interface FiltrosRecordatorios {
  tipo?: TipoRecordatorio | TipoRecordatorio[];
  estado?: EstadoRecordatorio | EstadoRecordatorio[];
  prioridad?: PrioridadRecordatorio | PrioridadRecordatorio[];
  fechaDesde?: Date;
  fechaHasta?: Date;
  entidadTipo?: string;
  entidadId?: string;
  soloNoLeidos?: boolean;
}

// ============================================
// SERVICIO
// ============================================

class RecordatoriosUnificadosService {
  // ============================================
  // CRUD RECORDATORIOS
  // ============================================

  /**
   * Crear un recordatorio
   */
  async crear(
    empresaId: string,
    usuarioId: string,
    data: CrearRecordatorioDTO
  ): Promise<IRecordatorio> {
    const recordatorio = new Recordatorio({
      empresaId: new mongoose.Types.ObjectId(empresaId),
      tipo: data.tipo,
      prioridad: data.prioridad || PrioridadRecordatorio.NORMAL,
      titulo: data.titulo,
      mensaje: data.mensaje,
      icono: data.icono,
      color: data.color,
      entidadTipo: data.entidadTipo,
      entidadId: data.entidadId ? new mongoose.Types.ObjectId(data.entidadId) : undefined,
      entidadNombre: data.entidadNombre,
      fechaProgramada: data.fechaProgramada,
      repetir: data.repetir || false,
      frecuenciaRepeticion: data.frecuenciaRepeticion,
      finRepeticion: data.finRepeticion,
      canales: data.canales || [CanalNotificacion.APP],
      usuarioId: new mongoose.Types.ObjectId(data.usuarioId || usuarioId),
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      estado: EstadoRecordatorio.PENDIENTE,
    });

    await recordatorio.save();
    return recordatorio;
  }

  /**
   * Obtener recordatorios del usuario
   */
  async listar(
    empresaId: string,
    usuarioId: string,
    filtros: FiltrosRecordatorios = {},
    paginacion: { pagina?: number; limite?: number } = {}
  ): Promise<{ recordatorios: IRecordatorio[]; total: number }> {
    const { pagina = 1, limite = 20 } = paginacion;
    const skip = (pagina - 1) * limite;

    const query: any = {
      empresaId: new mongoose.Types.ObjectId(empresaId),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
    };

    if (filtros.tipo) {
      query.tipo = Array.isArray(filtros.tipo) ? { $in: filtros.tipo } : filtros.tipo;
    }

    if (filtros.estado) {
      query.estado = Array.isArray(filtros.estado) ? { $in: filtros.estado } : filtros.estado;
    }

    if (filtros.prioridad) {
      query.prioridad = Array.isArray(filtros.prioridad) ? { $in: filtros.prioridad } : filtros.prioridad;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      query.fechaProgramada = {};
      if (filtros.fechaDesde) query.fechaProgramada.$gte = filtros.fechaDesde;
      if (filtros.fechaHasta) query.fechaProgramada.$lte = filtros.fechaHasta;
    }

    if (filtros.entidadTipo) query.entidadTipo = filtros.entidadTipo;
    if (filtros.entidadId) query.entidadId = new mongoose.Types.ObjectId(filtros.entidadId);

    if (filtros.soloNoLeidos) {
      query.estado = { $nin: [EstadoRecordatorio.LEIDO, EstadoRecordatorio.COMPLETADO, EstadoRecordatorio.DESCARTADO] };
    }

    const [recordatorios, total] = await Promise.all([
      Recordatorio.find(query)
        .sort({ fechaProgramada: 1, prioridad: -1 })
        .skip(skip)
        .limit(limite)
        .lean(),
      Recordatorio.countDocuments(query),
    ]);

    return { recordatorios: recordatorios as IRecordatorio[], total };
  }

  /**
   * Obtener recordatorios pendientes para hoy/próximos
   */
  async getPendientes(
    empresaId: string,
    usuarioId: string,
    diasProximos: number = 7
  ): Promise<IRecordatorio[]> {
    const ahora = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasProximos);

    const recordatorios = await Recordatorio.find({
      empresaId: new mongoose.Types.ObjectId(empresaId),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      estado: { $in: [EstadoRecordatorio.PENDIENTE, EstadoRecordatorio.ENVIADO, EstadoRecordatorio.POSPUESTO] },
      fechaProgramada: { $lte: fechaLimite },
    })
      .sort({ fechaProgramada: 1, prioridad: -1 })
      .lean();

    return recordatorios as IRecordatorio[];
  }

  /**
   * Marcar como leído
   */
  async marcarLeido(
    empresaId: string,
    usuarioId: string,
    recordatorioId: string
  ): Promise<IRecordatorio | null> {
    return await Recordatorio.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(recordatorioId),
        empresaId: new mongoose.Types.ObjectId(empresaId),
        usuarioId: new mongoose.Types.ObjectId(usuarioId),
      },
      {
        estado: EstadoRecordatorio.LEIDO,
        fechaLeido: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Marcar como completado
   */
  async completar(
    empresaId: string,
    usuarioId: string,
    recordatorioId: string
  ): Promise<IRecordatorio | null> {
    const recordatorio = await Recordatorio.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(recordatorioId),
        empresaId: new mongoose.Types.ObjectId(empresaId),
        usuarioId: new mongoose.Types.ObjectId(usuarioId),
      },
      {
        estado: EstadoRecordatorio.COMPLETADO,
        fechaCompletado: new Date(),
      },
      { new: true }
    );

    // Si es repetitivo, crear el siguiente
    if (recordatorio?.repetir && recordatorio.frecuenciaRepeticion) {
      await this.crearSiguienteRepeticion(recordatorio);
    }

    return recordatorio;
  }

  /**
   * Posponer recordatorio
   */
  async posponer(
    empresaId: string,
    usuarioId: string,
    recordatorioId: string,
    nuevaFecha: Date
  ): Promise<IRecordatorio | null> {
    return await Recordatorio.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(recordatorioId),
        empresaId: new mongoose.Types.ObjectId(empresaId),
        usuarioId: new mongoose.Types.ObjectId(usuarioId),
      },
      {
        estado: EstadoRecordatorio.POSPUESTO,
        fechaProgramada: nuevaFecha,
      },
      { new: true }
    );
  }

  /**
   * Descartar recordatorio
   */
  async descartar(
    empresaId: string,
    usuarioId: string,
    recordatorioId: string
  ): Promise<IRecordatorio | null> {
    return await Recordatorio.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(recordatorioId),
        empresaId: new mongoose.Types.ObjectId(empresaId),
        usuarioId: new mongoose.Types.ObjectId(usuarioId),
      },
      {
        estado: EstadoRecordatorio.DESCARTADO,
      },
      { new: true }
    );
  }

  /**
   * Eliminar recordatorio
   */
  async eliminar(
    empresaId: string,
    usuarioId: string,
    recordatorioId: string
  ): Promise<boolean> {
    const result = await Recordatorio.deleteOne({
      _id: new mongoose.Types.ObjectId(recordatorioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
    });

    return result.deletedCount > 0;
  }

  // ============================================
  // CREAR RECORDATORIOS AUTOMÁTICOS
  // ============================================

  /**
   * Crear recordatorio desde actividad CRM
   */
  async crearDesdeActividadCRM(
    empresaId: string,
    usuarioId: string,
    actividad: {
      id: string;
      tipo: string;
      asunto: string;
      fechaProgramada: Date;
      leadId?: string;
      oportunidadId?: string;
      clienteId?: string;
      leadNombre?: string;
      oportunidadNombre?: string;
      clienteNombre?: string;
    }
  ): Promise<IRecordatorio> {
    const entidadNombre = actividad.leadNombre || actividad.oportunidadNombre || actividad.clienteNombre;
    const entidadTipo = actividad.leadId ? 'lead' : actividad.oportunidadId ? 'oportunidad' : 'cliente';
    const entidadId = actividad.leadId || actividad.oportunidadId || actividad.clienteId;

    return await this.crear(empresaId, usuarioId, {
      tipo: TipoRecordatorio.ACTIVIDAD_CRM,
      titulo: `${this.capitalizarTipo(actividad.tipo)}: ${actividad.asunto}`,
      mensaje: `Tienes ${actividad.tipo === 'llamada' ? 'una' : 'un'} ${actividad.tipo} programad${actividad.tipo === 'llamada' ? 'a' : 'o'} ${entidadNombre ? `con ${entidadNombre}` : ''}`,
      icono: this.getIconoActividad(actividad.tipo),
      color: this.getColorActividad(actividad.tipo),
      entidadTipo: 'actividad_crm',
      entidadId: actividad.id,
      entidadNombre: actividad.asunto,
      fechaProgramada: actividad.fechaProgramada,
      prioridad: PrioridadRecordatorio.NORMAL,
      canales: [CanalNotificacion.APP, CanalNotificacion.EMAIL],
      metadata: {
        tipoActividad: actividad.tipo,
        [`${entidadTipo}Id`]: entidadId,
        [`${entidadTipo}Nombre`]: entidadNombre,
      },
    });
  }

  /**
   * Crear recordatorio para seguimiento de lead
   */
  async crearSeguimientoLead(
    empresaId: string,
    usuarioId: string,
    lead: {
      id: string;
      nombre: string;
      empresa?: string;
      diasSinContacto: number;
    }
  ): Promise<IRecordatorio> {
    return await this.crear(empresaId, usuarioId, {
      tipo: TipoRecordatorio.SEGUIMIENTO_LEAD,
      prioridad: lead.diasSinContacto > 14 ? PrioridadRecordatorio.ALTA : PrioridadRecordatorio.NORMAL,
      titulo: `Seguimiento pendiente: ${lead.nombre}`,
      mensaje: `Han pasado ${lead.diasSinContacto} días sin contactar a ${lead.nombre}${lead.empresa ? ` de ${lead.empresa}` : ''}. Considera programar una llamada o email.`,
      icono: 'user-check',
      color: '#f59e0b',
      entidadTipo: 'lead',
      entidadId: lead.id,
      entidadNombre: lead.nombre,
      fechaProgramada: new Date(),
      canales: [CanalNotificacion.APP],
    });
  }

  // ============================================
  // RECORDATORIOS PARA DOCUMENTOS COMERCIALES
  // ============================================

  /**
   * Crear recordatorio para presupuesto próximo a expirar
   */
  async crearAlertaPresupuestoExpiracion(
    empresaId: string,
    usuarioId: string,
    presupuesto: {
      id: string;
      numero: string;
      clienteNombre: string;
      fechaValidez: Date;
      total: number;
      diasRestantes: number;
    }
  ): Promise<IRecordatorio> {
    const prioridad = presupuesto.diasRestantes <= 1
      ? PrioridadRecordatorio.URGENTE
      : presupuesto.diasRestantes <= 3
        ? PrioridadRecordatorio.ALTA
        : PrioridadRecordatorio.NORMAL;

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

    return await this.crear(empresaId, usuarioId, {
      tipo: TipoRecordatorio.PRESUPUESTO_EXPIRACION,
      prioridad,
      titulo: `Presupuesto ${presupuesto.numero} próximo a expirar`,
      mensaje: `El presupuesto para ${presupuesto.clienteNombre} (${formatCurrency(presupuesto.total)}) expira en ${presupuesto.diasRestantes} día${presupuesto.diasRestantes !== 1 ? 's' : ''}. Considera contactar al cliente.`,
      icono: 'file-text',
      color: presupuesto.diasRestantes <= 1 ? '#ef4444' : '#f59e0b',
      entidadTipo: 'presupuesto',
      entidadId: presupuesto.id,
      entidadNombre: `${presupuesto.numero} - ${presupuesto.clienteNombre}`,
      fechaProgramada: new Date(),
      canales: [CanalNotificacion.APP, CanalNotificacion.EMAIL],
      metadata: {
        presupuestoNumero: presupuesto.numero,
        clienteNombre: presupuesto.clienteNombre,
        total: presupuesto.total,
        fechaValidez: presupuesto.fechaValidez,
      },
    });
  }

  /**
   * Crear recordatorio para seguimiento de presupuesto enviado
   */
  async crearSeguimientoPresupuesto(
    empresaId: string,
    usuarioId: string,
    presupuesto: {
      id: string;
      numero: string;
      clienteNombre: string;
      diasDesdeEnvio: number;
    }
  ): Promise<IRecordatorio> {
    return await this.crear(empresaId, usuarioId, {
      tipo: TipoRecordatorio.PRESUPUESTO_SEGUIMIENTO,
      prioridad: presupuesto.diasDesdeEnvio > 7 ? PrioridadRecordatorio.ALTA : PrioridadRecordatorio.NORMAL,
      titulo: `Seguimiento presupuesto ${presupuesto.numero}`,
      mensaje: `Han pasado ${presupuesto.diasDesdeEnvio} días desde que enviaste el presupuesto a ${presupuesto.clienteNombre}. Considera hacer seguimiento.`,
      icono: 'file-text',
      color: '#3b82f6',
      entidadTipo: 'presupuesto',
      entidadId: presupuesto.id,
      entidadNombre: `${presupuesto.numero} - ${presupuesto.clienteNombre}`,
      fechaProgramada: new Date(),
      canales: [CanalNotificacion.APP],
    });
  }

  /**
   * Crear recordatorio para factura con vencimiento próximo
   */
  async crearAlertaFacturaVencimiento(
    empresaId: string,
    usuarioId: string,
    factura: {
      id: string;
      numero: string;
      clienteNombre: string;
      fechaVencimiento: Date;
      pendiente: number;
      diasRestantes: number;
    }
  ): Promise<IRecordatorio> {
    const prioridad = factura.diasRestantes <= 0
      ? PrioridadRecordatorio.URGENTE
      : factura.diasRestantes <= 3
        ? PrioridadRecordatorio.ALTA
        : PrioridadRecordatorio.NORMAL;

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

    const mensaje = factura.diasRestantes <= 0
      ? `La factura ${factura.numero} de ${factura.clienteNombre} (${formatCurrency(factura.pendiente)}) está VENCIDA desde hace ${Math.abs(factura.diasRestantes)} día${Math.abs(factura.diasRestantes) !== 1 ? 's' : ''}.`
      : `La factura ${factura.numero} de ${factura.clienteNombre} (${formatCurrency(factura.pendiente)}) vence en ${factura.diasRestantes} día${factura.diasRestantes !== 1 ? 's' : ''}.`;

    return await this.crear(empresaId, usuarioId, {
      tipo: TipoRecordatorio.FACTURA_VENCIMIENTO,
      prioridad,
      titulo: factura.diasRestantes <= 0
        ? `Factura ${factura.numero} VENCIDA`
        : `Factura ${factura.numero} próxima a vencer`,
      mensaje,
      icono: 'alert-triangle',
      color: factura.diasRestantes <= 0 ? '#ef4444' : '#f59e0b',
      entidadTipo: 'factura',
      entidadId: factura.id,
      entidadNombre: `${factura.numero} - ${factura.clienteNombre}`,
      fechaProgramada: new Date(),
      canales: [CanalNotificacion.APP, CanalNotificacion.EMAIL],
      metadata: {
        facturaNumero: factura.numero,
        clienteNombre: factura.clienteNombre,
        pendiente: factura.pendiente,
        fechaVencimiento: factura.fechaVencimiento,
      },
    });
  }

  /**
   * Crear recordatorio para cobro pendiente
   */
  async crearAlertaCobroPendiente(
    empresaId: string,
    usuarioId: string,
    cobro: {
      id: string;
      clienteNombre: string;
      importe: number;
      diasPendiente: number;
      facturaNumero?: string;
    }
  ): Promise<IRecordatorio> {
    const prioridad = cobro.diasPendiente > 30
      ? PrioridadRecordatorio.URGENTE
      : cobro.diasPendiente > 15
        ? PrioridadRecordatorio.ALTA
        : PrioridadRecordatorio.NORMAL;

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

    return await this.crear(empresaId, usuarioId, {
      tipo: TipoRecordatorio.COBRO_PENDIENTE,
      prioridad,
      titulo: `Cobro pendiente de ${cobro.clienteNombre}`,
      mensaje: `Tienes un cobro pendiente de ${formatCurrency(cobro.importe)} de ${cobro.clienteNombre}${cobro.facturaNumero ? ` (Factura ${cobro.facturaNumero})` : ''} con ${cobro.diasPendiente} días de antigüedad.`,
      icono: 'credit-card',
      color: cobro.diasPendiente > 30 ? '#ef4444' : '#f59e0b',
      entidadTipo: 'cobro',
      entidadId: cobro.id,
      entidadNombre: `${formatCurrency(cobro.importe)} - ${cobro.clienteNombre}`,
      fechaProgramada: new Date(),
      canales: [CanalNotificacion.APP],
      metadata: {
        clienteNombre: cobro.clienteNombre,
        importe: cobro.importe,
        facturaNumero: cobro.facturaNumero,
      },
    });
  }

  /**
   * Crear recordatorio para parte de trabajo pendiente
   */
  async crearAlertaParteTrabajo(
    empresaId: string,
    usuarioId: string,
    parte: {
      id: string;
      numero: string;
      clienteNombre: string;
      descripcion: string;
      fechaProgramada: Date;
    }
  ): Promise<IRecordatorio> {
    return await this.crear(empresaId, usuarioId, {
      tipo: TipoRecordatorio.PARTE_TRABAJO,
      prioridad: PrioridadRecordatorio.NORMAL,
      titulo: `Parte de trabajo ${parte.numero}`,
      mensaje: `Tienes programado el parte de trabajo "${parte.descripcion}" para ${parte.clienteNombre}.`,
      icono: 'wrench',
      color: '#10b981',
      entidadTipo: 'parte_trabajo',
      entidadId: parte.id,
      entidadNombre: `${parte.numero} - ${parte.clienteNombre}`,
      fechaProgramada: parte.fechaProgramada,
      canales: [CanalNotificacion.APP],
    });
  }

  /**
   * Crear recordatorio para cierre de oportunidad
   */
  async crearAlertaOportunidadCierre(
    empresaId: string,
    usuarioId: string,
    oportunidad: {
      id: string;
      nombre: string;
      valor: number;
      fechaCierreEstimado: Date;
      diasRestantes: number;
    }
  ): Promise<IRecordatorio> {
    const prioridad = oportunidad.diasRestantes <= 3
      ? PrioridadRecordatorio.URGENTE
      : oportunidad.diasRestantes <= 7
        ? PrioridadRecordatorio.ALTA
        : PrioridadRecordatorio.NORMAL;

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

    return await this.crear(empresaId, usuarioId, {
      tipo: TipoRecordatorio.OPORTUNIDAD_CIERRE,
      prioridad,
      titulo: `Oportunidad próxima a cerrar: ${oportunidad.nombre}`,
      mensaje: `La oportunidad "${oportunidad.nombre}" (${formatCurrency(oportunidad.valor)}) tiene fecha de cierre estimada en ${oportunidad.diasRestantes} días.`,
      icono: 'target',
      color: '#10b981',
      entidadTipo: 'oportunidad',
      entidadId: oportunidad.id,
      entidadNombre: oportunidad.nombre,
      fechaProgramada: new Date(),
      canales: [CanalNotificacion.APP, CanalNotificacion.EMAIL],
      metadata: {
        valor: oportunidad.valor,
        fechaCierreEstimado: oportunidad.fechaCierreEstimado,
      },
    });
  }

  // ============================================
  // PROCESAMIENTO DE RECORDATORIOS
  // ============================================

  /**
   * Procesar y enviar recordatorios pendientes
   */
  async procesarPendientes(): Promise<{
    procesados: number;
    enviados: number;
    errores: number;
  }> {
    const ahora = new Date();

    const recordatoriosPendientes = await Recordatorio.find({
      estado: EstadoRecordatorio.PENDIENTE,
      fechaProgramada: { $lte: ahora },
    }).lean();

    let enviados = 0;
    let errores = 0;

    for (const recordatorio of recordatoriosPendientes) {
      try {
        await this.enviarNotificaciones(recordatorio as IRecordatorio);
        await Recordatorio.updateOne(
          { _id: recordatorio._id },
          {
            estado: EstadoRecordatorio.ENVIADO,
            fechaEnvio: new Date(),
          }
        );
        enviados++;
      } catch (error) {
        errores++;
        console.error(`Error enviando recordatorio ${recordatorio._id}:`, error);
      }
    }

    return {
      procesados: recordatoriosPendientes.length,
      enviados,
      errores,
    };
  }

  /**
   * Enviar notificaciones por los canales configurados
   */
  private async enviarNotificaciones(recordatorio: IRecordatorio): Promise<void> {
    const notificacionesEnviadas: IRecordatorio['notificacionesEnviadas'] = [];

    for (const canal of recordatorio.canales) {
      try {
        switch (canal) {
          case CanalNotificacion.EMAIL:
            await this.enviarEmail(recordatorio);
            break;
          case CanalNotificacion.APP:
            // Las notificaciones in-app se muestran automáticamente
            // al consultar los recordatorios del usuario
            break;
          case CanalNotificacion.PUSH:
            // TODO: Implementar push notifications
            break;
        }

        notificacionesEnviadas.push({
          canal,
          fecha: new Date(),
          exito: true,
        });
      } catch (error: any) {
        notificacionesEnviadas.push({
          canal,
          fecha: new Date(),
          exito: false,
          error: error.message,
        });
      }
    }

    await Recordatorio.updateOne(
      { _id: recordatorio._id },
      { $push: { notificacionesEnviadas: { $each: notificacionesEnviadas } } }
    );
  }

  /**
   * Enviar recordatorio por email
   */
  private async enviarEmail(recordatorio: IRecordatorio): Promise<void> {
    // Obtener email del usuario
    const Usuario = mongoose.model('Usuario');
    const usuario = await Usuario.findById(recordatorio.usuarioId).select('email nombre').lean() as any;

    if (!usuario?.email) {
      throw new Error('Usuario sin email');
    }

    const empresa = await Empresa.findById(recordatorio.empresaId).select('nombre nombreComercial').lean() as any;

    const html = this.generarEmailRecordatorio(recordatorio, usuario.nombre, empresa?.nombreComercial || empresa?.nombre);

    await sendEmail(
      usuario.email,
      `🔔 Recordatorio: ${recordatorio.titulo}`,
      html
    );
  }

  /**
   * Generar HTML para email de recordatorio
   */
  private generarEmailRecordatorio(
    recordatorio: IRecordatorio,
    nombreUsuario: string,
    nombreEmpresa?: string
  ): string {
    const prioridadColor = {
      [PrioridadRecordatorio.BAJA]: '#6b7280',
      [PrioridadRecordatorio.NORMAL]: '#3b82f6',
      [PrioridadRecordatorio.ALTA]: '#f59e0b',
      [PrioridadRecordatorio.URGENTE]: '#ef4444',
    };

    const fechaFormateada = new Date(recordatorio.fechaProgramada).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recordatorio</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Recordatorio</h1>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin-top: 0;">Hola ${nombreUsuario},</p>

          <div style="background: #f9fafb; border-left: 4px solid ${recordatorio.color || prioridadColor[recordatorio.prioridad]}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">
              ${recordatorio.titulo}
            </h2>
            <p style="margin: 0; color: #4b5563;">
              ${recordatorio.mensaje}
            </p>
          </div>

          <div style="display: flex; gap: 20px; margin: 20px 0;">
            <div style="flex: 1;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Fecha</p>
              <p style="color: #1f2937; font-weight: 500; margin: 0;">${fechaFormateada}</p>
            </div>
            <div>
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Prioridad</p>
              <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; background: ${prioridadColor[recordatorio.prioridad]}20; color: ${prioridadColor[recordatorio.prioridad]};">
                ${recordatorio.prioridad.toUpperCase()}
              </span>
            </div>
          </div>

          ${recordatorio.entidadNombre ? `
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #0369a1; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Relacionado con</p>
            <p style="color: #0c4a6e; font-weight: 500; margin: 0;">${recordatorio.entidadNombre}</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/recordatorios" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              Ver en la aplicación
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Este email fue enviado por ${nombreEmpresa || 'Omerix'}</p>
          <p style="margin: 5px 0 0 0;">Puedes configurar tus preferencias de notificación en la aplicación.</p>
        </div>
      </body>
      </html>
    `;
  }

  // ============================================
  // CONFIGURACIÓN DE ALERTAS
  // ============================================

  /**
   * Obtener configuración de alertas del usuario
   */
  async getConfiguracion(
    empresaId: string,
    usuarioId: string
  ): Promise<IAlertaConfig | null> {
    return await AlertaConfig.findOne({
      empresaId: new mongoose.Types.ObjectId(empresaId),
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
    });
  }

  /**
   * Actualizar configuración de alertas
   */
  async actualizarConfiguracion(
    empresaId: string,
    usuarioId: string,
    config: Partial<IAlertaConfig>
  ): Promise<IAlertaConfig> {
    return await AlertaConfig.findOneAndUpdate(
      {
        empresaId: new mongoose.Types.ObjectId(empresaId),
        usuarioId: new mongoose.Types.ObjectId(usuarioId),
      },
      { $set: config },
      { new: true, upsert: true }
    );
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Obtener estadísticas de recordatorios
   */
  async getEstadisticas(
    empresaId: string,
    usuarioId: string
  ): Promise<{
    pendientes: number;
    completadosHoy: number;
    completadosSemana: number;
    porTipo: { tipo: string; count: number }[];
    porPrioridad: { prioridad: string; count: number }[];
  }> {
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const inicioSemana = new Date(inicioHoy);
    inicioSemana.setDate(inicioSemana.getDate() - 7);

    const empresaObjId = new mongoose.Types.ObjectId(empresaId);
    const usuarioObjId = new mongoose.Types.ObjectId(usuarioId);

    const [pendientes, completadosHoy, completadosSemana, porTipo, porPrioridad] = await Promise.all([
      Recordatorio.countDocuments({
        empresaId: empresaObjId,
        usuarioId: usuarioObjId,
        estado: { $in: [EstadoRecordatorio.PENDIENTE, EstadoRecordatorio.ENVIADO, EstadoRecordatorio.POSPUESTO] },
      }),
      Recordatorio.countDocuments({
        empresaId: empresaObjId,
        usuarioId: usuarioObjId,
        estado: EstadoRecordatorio.COMPLETADO,
        fechaCompletado: { $gte: inicioHoy },
      }),
      Recordatorio.countDocuments({
        empresaId: empresaObjId,
        usuarioId: usuarioObjId,
        estado: EstadoRecordatorio.COMPLETADO,
        fechaCompletado: { $gte: inicioSemana },
      }),
      Recordatorio.aggregate([
        { $match: { empresaId: empresaObjId, usuarioId: usuarioObjId } },
        { $group: { _id: '$tipo', count: { $sum: 1 } } },
        { $project: { tipo: '$_id', count: 1, _id: 0 } },
      ]),
      Recordatorio.aggregate([
        {
          $match: {
            empresaId: empresaObjId,
            usuarioId: usuarioObjId,
            estado: { $in: [EstadoRecordatorio.PENDIENTE, EstadoRecordatorio.ENVIADO] },
          },
        },
        { $group: { _id: '$prioridad', count: { $sum: 1 } } },
        { $project: { prioridad: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    return {
      pendientes,
      completadosHoy,
      completadosSemana,
      porTipo,
      porPrioridad,
    };
  }

  /**
   * Obtener contadores rápidos para el navbar
   */
  async getContadores(
    empresaId: string,
    usuarioId: string
  ): Promise<{
    total: number;
    sinLeer: number;
    urgentes: number;
  }> {
    const empresaObjId = new mongoose.Types.ObjectId(empresaId);
    const usuarioObjId = new mongoose.Types.ObjectId(usuarioId);

    const [total, sinLeer, urgentes] = await Promise.all([
      Recordatorio.countDocuments({
        empresaId: empresaObjId,
        usuarioId: usuarioObjId,
        estado: { $in: [EstadoRecordatorio.PENDIENTE, EstadoRecordatorio.ENVIADO, EstadoRecordatorio.POSPUESTO] },
      }),
      Recordatorio.countDocuments({
        empresaId: empresaObjId,
        usuarioId: usuarioObjId,
        estado: { $in: [EstadoRecordatorio.PENDIENTE, EstadoRecordatorio.ENVIADO] },
      }),
      Recordatorio.countDocuments({
        empresaId: empresaObjId,
        usuarioId: usuarioObjId,
        estado: { $in: [EstadoRecordatorio.PENDIENTE, EstadoRecordatorio.ENVIADO] },
        prioridad: PrioridadRecordatorio.URGENTE,
      }),
    ]);

    return { total, sinLeer, urgentes };
  }

  // ============================================
  // HELPERS
  // ============================================

  private async crearSiguienteRepeticion(recordatorio: IRecordatorio): Promise<void> {
    if (!recordatorio.frecuenciaRepeticion) return;

    const siguienteFecha = new Date(recordatorio.fechaProgramada);

    switch (recordatorio.frecuenciaRepeticion) {
      case 'diario':
        siguienteFecha.setDate(siguienteFecha.getDate() + 1);
        break;
      case 'semanal':
        siguienteFecha.setDate(siguienteFecha.getDate() + 7);
        break;
      case 'mensual':
        siguienteFecha.setMonth(siguienteFecha.getMonth() + 1);
        break;
      case 'anual':
        siguienteFecha.setFullYear(siguienteFecha.getFullYear() + 1);
        break;
    }

    // Verificar si ya pasó la fecha de fin
    if (recordatorio.finRepeticion && siguienteFecha > recordatorio.finRepeticion) {
      return;
    }

    await this.crear(
      recordatorio.empresaId.toString(),
      recordatorio.creadoPor.toString(),
      {
        tipo: recordatorio.tipo,
        prioridad: recordatorio.prioridad,
        titulo: recordatorio.titulo,
        mensaje: recordatorio.mensaje,
        icono: recordatorio.icono,
        color: recordatorio.color,
        entidadTipo: recordatorio.entidadTipo,
        entidadId: recordatorio.entidadId?.toString(),
        entidadNombre: recordatorio.entidadNombre,
        fechaProgramada: siguienteFecha,
        repetir: true,
        frecuenciaRepeticion: recordatorio.frecuenciaRepeticion,
        finRepeticion: recordatorio.finRepeticion,
        canales: recordatorio.canales,
        usuarioId: recordatorio.usuarioId.toString(),
        metadata: recordatorio.metadata,
      }
    );
  }

  private capitalizarTipo(tipo: string): string {
    const tipos: Record<string, string> = {
      llamada: 'Llamada',
      email: 'Email',
      reunion: 'Reunión',
      visita: 'Visita',
      tarea: 'Tarea',
      nota: 'Nota',
      whatsapp: 'WhatsApp',
    };
    return tipos[tipo] || tipo;
  }

  private getIconoActividad(tipo: string): string {
    const iconos: Record<string, string> = {
      llamada: 'phone',
      email: 'mail',
      reunion: 'users',
      visita: 'map-pin',
      tarea: 'check-square',
      nota: 'file-text',
      whatsapp: 'message-circle',
    };
    return iconos[tipo] || 'calendar';
  }

  private getColorActividad(tipo: string): string {
    const colores: Record<string, string> = {
      llamada: '#f59e0b',
      email: '#8b5cf6',
      reunion: '#3b82f6',
      visita: '#10b981',
      tarea: '#6366f1',
      nota: '#6b7280',
      whatsapp: '#22c55e',
    };
    return colores[tipo] || '#3b82f6';
  }
}

export const recordatoriosUnificadosService = new RecordatoriosUnificadosService();
export default recordatoriosUnificadosService;
