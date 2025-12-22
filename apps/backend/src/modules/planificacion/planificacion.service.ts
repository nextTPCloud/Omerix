import mongoose from 'mongoose';
import {
  Planificacion,
  IPlanificacionDocument,
  EstadoPlanificacion,
  EstadoAsignacion
} from './Planificacion';
import { Personal } from '../personal/Personal';
import { Departamento } from '../departamentos/Departamento';
import { Turno } from '../turnos/Turno';
import {
  CreatePlanificacionDTO,
  UpdatePlanificacionDTO,
  AgregarAsignacionDTO,
  ActualizarAsignacionDTO,
  CambiarEstadoPlanificacionDTO,
  SearchPlanificacionesParams,
  CopiarSemanaDTO,
} from './planificacion.dto';

class PlanificacionService {
  /**
   * Listar planificaciones con filtros
   */
  async listar(empresaId: mongoose.Types.ObjectId, params: SearchPlanificacionesParams) {
    const {
      q,
      estado,
      tipo,
      departamentoId,
      fechaDesde,
      fechaHasta,
      activo = true,
      page = 1,
      limit = 25,
      sortBy = 'fechaInicio',
      sortOrder = 'desc',
    } = params;

    const query: any = { empresaId, activo };

    if (q) {
      query.$or = [
        { codigo: { $regex: q, $options: 'i' } },
        { nombre: { $regex: q, $options: 'i' } },
      ];
    }

    if (estado) query.estado = estado;
    if (tipo) query.tipo = tipo;
    if (departamentoId) query.departamentoId = new mongoose.Types.ObjectId(departamentoId);

    if (fechaDesde || fechaHasta) {
      query.fechaInicio = {};
      if (fechaDesde) query.fechaInicio.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fechaInicio.$lte = new Date(fechaHasta);
    }

    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [planificaciones, total] = await Promise.all([
      Planificacion.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Planificacion.countDocuments(query),
    ]);

    return {
      data: planificaciones,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener planificacion por ID
   */
  async obtenerPorId(empresaId: mongoose.Types.ObjectId, id: string) {
    const planificacion = await Planificacion.findOne({
      _id: id,
      empresaId,
    }).lean();

    if (!planificacion) {
      throw new Error('Planificacion no encontrada');
    }

    return planificacion;
  }

  /**
   * Sugerir proximo codigo
   */
  async sugerirCodigo(empresaId: mongoose.Types.ObjectId): Promise<string> {
    return await Planificacion.generarCodigo(empresaId);
  }

  /**
   * Crear planificacion
   */
  async crear(
    empresaId: mongoose.Types.ObjectId,
    data: CreatePlanificacionDTO,
    usuarioId: mongoose.Types.ObjectId,
    usuarioNombre: string
  ) {
    // Obtener nombre del departamento si se proporciona
    let departamentoNombre: string | undefined;
    if (data.departamentoId) {
      const departamento = await Departamento.findById(data.departamentoId);
      departamentoNombre = departamento?.nombre;
    }

    // Calcular horas planificadas para cada asignacion
    const asignaciones = await this.procesarAsignaciones(empresaId, data.asignaciones || []);

    const planificacion = new Planificacion({
      empresaId,
      ...data,
      departamentoNombre,
      asignaciones,
      creadoPorId: usuarioId,
      creadoPorNombre: usuarioNombre,
    });

    await planificacion.save();
    return planificacion;
  }

  /**
   * Actualizar planificacion
   */
  async actualizar(
    empresaId: mongoose.Types.ObjectId,
    id: string,
    data: UpdatePlanificacionDTO
  ) {
    const planificacion = await Planificacion.findOne({ _id: id, empresaId });

    if (!planificacion) {
      throw new Error('Planificacion no encontrada');
    }

    if (planificacion.estado === EstadoPlanificacion.CERRADA) {
      throw new Error('No se puede modificar una planificacion cerrada');
    }

    // Actualizar nombre departamento si cambia
    if (data.departamentoId && data.departamentoId !== planificacion.departamentoId?.toString()) {
      const departamento = await Departamento.findById(data.departamentoId);
      (data as any).departamentoNombre = departamento?.nombre;
    }

    // Procesar asignaciones si se proporcionan
    if (data.asignaciones) {
      data.asignaciones = await this.procesarAsignaciones(empresaId, data.asignaciones);
    }

    Object.assign(planificacion, data);
    await planificacion.save();

    return planificacion;
  }

  /**
   * Agregar asignaciones
   */
  async agregarAsignaciones(
    empresaId: mongoose.Types.ObjectId,
    id: string,
    data: AgregarAsignacionDTO
  ) {
    const planificacion = await Planificacion.findOne({ _id: id, empresaId });

    if (!planificacion) {
      throw new Error('Planificacion no encontrada');
    }

    if (planificacion.estado === EstadoPlanificacion.CERRADA) {
      throw new Error('No se puede modificar una planificacion cerrada');
    }

    const nuevasAsignaciones = await this.procesarAsignaciones(empresaId, data.asignaciones);
    planificacion.asignaciones.push(...nuevasAsignaciones as any);
    await planificacion.save();

    return planificacion;
  }

  /**
   * Actualizar una asignacion especifica
   */
  async actualizarAsignacion(
    empresaId: mongoose.Types.ObjectId,
    planId: string,
    asignacionId: string,
    data: ActualizarAsignacionDTO
  ) {
    const planificacion = await Planificacion.findOne({ _id: planId, empresaId });

    if (!planificacion) {
      throw new Error('Planificacion no encontrada');
    }

    if (planificacion.estado === EstadoPlanificacion.CERRADA) {
      throw new Error('No se puede modificar una planificacion cerrada');
    }

    const asignacion = planificacion.asignaciones.find(
      a => a._id?.toString() === asignacionId
    );

    if (!asignacion) {
      throw new Error('Asignacion no encontrada');
    }

    // Actualizar campos
    Object.assign(asignacion, data);

    // Recalcular horas si cambian horarios
    if (data.horaInicio || data.horaFin) {
      asignacion.horasPlanificadas = this.calcularHoras(
        data.horaInicio || asignacion.horaInicio,
        data.horaFin || asignacion.horaFin
      );
    }

    await planificacion.save();
    return planificacion;
  }

  /**
   * Eliminar asignacion
   */
  async eliminarAsignacion(
    empresaId: mongoose.Types.ObjectId,
    planId: string,
    asignacionId: string
  ) {
    const planificacion = await Planificacion.findOne({ _id: planId, empresaId });

    if (!planificacion) {
      throw new Error('Planificacion no encontrada');
    }

    if (planificacion.estado === EstadoPlanificacion.CERRADA) {
      throw new Error('No se puede modificar una planificacion cerrada');
    }

    planificacion.asignaciones = planificacion.asignaciones.filter(
      a => a._id?.toString() !== asignacionId
    );

    await planificacion.save();
    return planificacion;
  }

  /**
   * Cambiar estado
   */
  async cambiarEstado(
    empresaId: mongoose.Types.ObjectId,
    id: string,
    data: CambiarEstadoPlanificacionDTO,
    usuarioId: mongoose.Types.ObjectId,
    usuarioNombre: string
  ) {
    const planificacion = await Planificacion.findOne({ _id: id, empresaId });

    if (!planificacion) {
      throw new Error('Planificacion no encontrada');
    }

    // Validar transiciones de estado
    const transicionesValidas: Record<EstadoPlanificacion, EstadoPlanificacion[]> = {
      [EstadoPlanificacion.BORRADOR]: [EstadoPlanificacion.PUBLICADA, EstadoPlanificacion.CANCELADA],
      [EstadoPlanificacion.PUBLICADA]: [EstadoPlanificacion.CERRADA, EstadoPlanificacion.BORRADOR],
      [EstadoPlanificacion.CERRADA]: [],
      [EstadoPlanificacion.CANCELADA]: [EstadoPlanificacion.BORRADOR],
    };

    if (!transicionesValidas[planificacion.estado].includes(data.estado)) {
      throw new Error(`No se puede cambiar de ${planificacion.estado} a ${data.estado}`);
    }

    planificacion.estado = data.estado;

    if (data.estado === EstadoPlanificacion.PUBLICADA) {
      planificacion.publicadoPorId = usuarioId;
      planificacion.publicadoPorNombre = usuarioNombre;
      planificacion.fechaPublicacion = new Date();

      // Marcar asignaciones como confirmadas
      planificacion.asignaciones.forEach(a => {
        if (a.estado === EstadoAsignacion.PLANIFICADA) {
          a.estado = EstadoAsignacion.CONFIRMADA;
        }
      });
    }

    await planificacion.save();
    return planificacion;
  }

  /**
   * Copiar semana
   */
  async copiarSemana(
    empresaId: mongoose.Types.ObjectId,
    planId: string,
    data: CopiarSemanaDTO
  ) {
    const planificacion = await Planificacion.findOne({ _id: planId, empresaId });

    if (!planificacion) {
      throw new Error('Planificacion no encontrada');
    }

    const fechaOrigen = new Date(data.semanaOrigen);
    const fechaDestino = new Date(data.semanaDestino);
    const diffDias = Math.floor((fechaDestino.getTime() - fechaOrigen.getTime()) / (1000 * 60 * 60 * 24));

    // Filtrar asignaciones de la semana origen
    const asignacionesOrigen = planificacion.asignaciones.filter(a => {
      const fecha = new Date(a.fecha);
      return fecha >= fechaOrigen && fecha < new Date(fechaOrigen.getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    if (asignacionesOrigen.length === 0) {
      throw new Error('No hay asignaciones en la semana origen');
    }

    // Si sobreescribir, eliminar asignaciones existentes en destino
    if (data.sobreescribir) {
      const finDestino = new Date(fechaDestino.getTime() + 7 * 24 * 60 * 60 * 1000);
      planificacion.asignaciones = planificacion.asignaciones.filter(a => {
        const fecha = new Date(a.fecha);
        return fecha < fechaDestino || fecha >= finDestino;
      });
    }

    // Crear nuevas asignaciones
    const nuevasAsignaciones = asignacionesOrigen.map(a => ({
      ...a.toObject ? a.toObject() : a,
      _id: new mongoose.Types.ObjectId(),
      fecha: new Date(new Date(a.fecha).getTime() + diffDias * 24 * 60 * 60 * 1000),
      estado: EstadoAsignacion.PLANIFICADA,
      horasReales: undefined,
      confirmadoPor: undefined,
      confirmadoFecha: undefined,
    }));

    planificacion.asignaciones.push(...nuevasAsignaciones as any);
    await planificacion.save();

    return planificacion;
  }

  /**
   * Eliminar planificacion
   */
  async eliminar(empresaId: mongoose.Types.ObjectId, id: string) {
    const planificacion = await Planificacion.findOne({ _id: id, empresaId });

    if (!planificacion) {
      throw new Error('Planificacion no encontrada');
    }

    if (planificacion.estado === EstadoPlanificacion.CERRADA) {
      throw new Error('No se puede eliminar una planificacion cerrada');
    }

    // Soft delete
    planificacion.activo = false;
    await planificacion.save();
  }

  /**
   * Obtener planificacion actual de un empleado
   */
  async obtenerPlanificacionEmpleado(
    empresaId: mongoose.Types.ObjectId,
    personalId: string,
    fechaDesde?: string,
    fechaHasta?: string
  ) {
    const query: any = {
      empresaId,
      activo: true,
      estado: { $in: [EstadoPlanificacion.PUBLICADA, EstadoPlanificacion.CERRADA] },
      'asignaciones.personalId': new mongoose.Types.ObjectId(personalId),
    };

    if (fechaDesde || fechaHasta) {
      query.fechaInicio = {};
      if (fechaDesde) query.fechaInicio.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fechaFin = { $lte: new Date(fechaHasta) };
    } else {
      // Por defecto, semana actual
      const hoy = new Date();
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6); // Domingo

      query.fechaInicio = { $lte: finSemana };
      query.fechaFin = { $gte: inicioSemana };
    }

    const planificaciones = await Planificacion.find(query).lean();

    // Extraer solo las asignaciones del empleado
    const asignaciones = planificaciones.flatMap(p =>
      p.asignaciones.filter(a => a.personalId.toString() === personalId)
    );

    return asignaciones.sort((a, b) =>
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  }

  /**
   * Obtener resumen semanal
   */
  async obtenerResumenSemanal(
    empresaId: mongoose.Types.ObjectId,
    fechaInicio: string
  ) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 7);

    const planificaciones = await Planificacion.find({
      empresaId,
      activo: true,
      estado: { $in: [EstadoPlanificacion.PUBLICADA, EstadoPlanificacion.BORRADOR] },
      fechaInicio: { $lte: fin },
      fechaFin: { $gte: inicio },
    }).lean();

    // Agrupar por dia y personal
    const resumenPorDia: Record<string, {
      fecha: string;
      empleados: { id: string; nombre: string; horas: number }[];
      totalHoras: number;
    }> = {};

    planificaciones.forEach(p => {
      p.asignaciones.forEach(a => {
        const fecha = new Date(a.fecha);
        if (fecha >= inicio && fecha < fin && !a.esAusencia) {
          const fechaStr = fecha.toISOString().split('T')[0];
          if (!resumenPorDia[fechaStr]) {
            resumenPorDia[fechaStr] = { fecha: fechaStr, empleados: [], totalHoras: 0 };
          }

          resumenPorDia[fechaStr].empleados.push({
            id: a.personalId.toString(),
            nombre: a.personalNombre,
            horas: a.horasPlanificadas,
          });
          resumenPorDia[fechaStr].totalHoras += a.horasPlanificadas;
        }
      });
    });

    return Object.values(resumenPorDia).sort((a, b) =>
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  }

  // ============================================
  // HELPERS
  // ============================================

  private async procesarAsignaciones(
    empresaId: mongoose.Types.ObjectId,
    asignaciones: any[]
  ) {
    const result = [];

    for (const asig of asignaciones) {
      // Obtener nombre del personal
      let personalNombre = asig.personalNombre;
      if (!personalNombre && asig.personalId) {
        const personal = await Personal.findById(asig.personalId);
        personalNombre = personal ?
          `${personal.nombre} ${personal.apellidos || ''}`.trim() :
          'Desconocido';
      }

      // Obtener nombre del turno
      let turnoNombre = asig.turnoNombre;
      if (!turnoNombre && asig.turnoId) {
        const turno = await Turno.findById(asig.turnoId);
        turnoNombre = turno?.nombre;
      }

      // Obtener nombre del departamento
      let departamentoNombre = asig.departamentoNombre;
      if (!departamentoNombre && asig.departamentoId) {
        const departamento = await Departamento.findById(asig.departamentoId);
        departamentoNombre = departamento?.nombre;
      }

      // Calcular horas planificadas
      const horasPlanificadas = asig.horasPlanificadas ||
        this.calcularHoras(asig.horaInicio, asig.horaFin);

      result.push({
        ...asig,
        personalNombre,
        turnoNombre,
        departamentoNombre,
        horasPlanificadas,
        estado: asig.estado || EstadoAsignacion.PLANIFICADA,
        esAusencia: asig.esAusencia || false,
      });
    }

    return result;
  }

  private calcularHoras(horaInicio: string, horaFin: string): number {
    const [hiH, hiM] = horaInicio.split(':').map(Number);
    const [hfH, hfM] = horaFin.split(':').map(Number);

    let inicio = hiH * 60 + hiM;
    let fin = hfH * 60 + hfM;

    // Si fin es menor que inicio, asumimos que cruza medianoche
    if (fin < inicio) {
      fin += 24 * 60;
    }

    return (fin - inicio) / 60;
  }
}

export const planificacionService = new PlanificacionService();
export default planificacionService;
