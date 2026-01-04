// apps/backend/src/modules/recordatorios/crm-integration.ts
// Integración entre el sistema de recordatorios y CRM

import { recordatoriosUnificadosService } from './recordatorios.service';
import { IActividad, TipoActividad } from '../crm/Actividad';
import { ILead } from '../crm/Lead';
import { IOportunidad } from '../crm/Oportunidad';

/**
 * Crear recordatorio automático desde actividad CRM
 */
export async function crearRecordatorioDesdeActividad(
  empresaId: string,
  actividad: IActividad,
  leadInfo?: { nombre?: string; empresa?: string },
  oportunidadInfo?: { nombre?: string },
  clienteInfo?: { nombre?: string }
): Promise<void> {
  // Solo crear recordatorio si tiene fecha programada y está asignada
  if (!actividad.fechaProgramada || !actividad.asignadoA) {
    return;
  }

  const entidadNombre = leadInfo?.nombre || oportunidadInfo?.nombre || clienteInfo?.nombre;
  const entidadTipo = actividad.leadId
    ? 'lead'
    : actividad.oportunidadId
    ? 'oportunidad'
    : 'cliente';
  const entidadId = actividad.leadId?.toString() ||
    actividad.oportunidadId?.toString() ||
    actividad.clienteId?.toString();

  try {
    await recordatoriosUnificadosService.crearDesdeActividadCRM(
      empresaId,
      actividad.asignadoA.toString(),
      {
        id: actividad._id.toString(),
        tipo: actividad.tipo,
        asunto: actividad.asunto,
        fechaProgramada: actividad.fechaProgramada,
        [`${entidadTipo}Id`]: entidadId,
        [`${entidadTipo}Nombre`]: entidadNombre,
      } as any
    );
  } catch (error) {
    console.error('Error creando recordatorio desde actividad CRM:', error);
  }
}

/**
 * Crear recordatorio de seguimiento para lead sin contacto reciente
 */
export async function crearRecordatorioSeguimientoLead(
  empresaId: string,
  usuarioId: string,
  lead: ILead & { ultimaActividad?: Date }
): Promise<void> {
  const ahora = new Date();
  const diasSinContacto = lead.ultimaActividad
    ? Math.floor((ahora.getTime() - new Date(lead.ultimaActividad).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Solo crear si han pasado más de 7 días
  if (diasSinContacto < 7) return;

  try {
    await recordatoriosUnificadosService.crearSeguimientoLead(
      empresaId,
      usuarioId,
      {
        id: lead._id.toString(),
        nombre: lead.nombre,
        empresa: lead.empresa,
        diasSinContacto,
      }
    );
  } catch (error) {
    console.error('Error creando recordatorio de seguimiento lead:', error);
  }
}

/**
 * Crear alerta de oportunidad próxima a cerrar
 */
export async function crearAlertaOportunidadCierre(
  empresaId: string,
  usuarioId: string,
  oportunidad: IOportunidad
): Promise<void> {
  if (!oportunidad.fechaCierreEstimado) return;

  const ahora = new Date();
  const diasRestantes = Math.ceil(
    (new Date(oportunidad.fechaCierreEstimado).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Solo crear si quedan menos de 14 días
  if (diasRestantes > 14 || diasRestantes < 0) return;

  try {
    await recordatoriosUnificadosService.crearAlertaOportunidadCierre(
      empresaId,
      usuarioId,
      {
        id: oportunidad._id.toString(),
        nombre: oportunidad.nombre,
        valor: oportunidad.valorEstimado || 0,
        fechaCierreEstimado: new Date(oportunidad.fechaCierreEstimado),
        diasRestantes,
      }
    );
  } catch (error) {
    console.error('Error creando alerta de cierre de oportunidad:', error);
  }
}
