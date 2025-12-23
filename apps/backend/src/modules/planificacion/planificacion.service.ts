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
import { databaseManager } from '../../services/database-manager.service';
import { IDatabaseConfig } from '../empresa/Empresa';
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

  /**
   * Obtener vista completa de la semana con partes de trabajo y tareas
   * Este método agrega información de otros módulos para mostrar qué tiene que hacer cada empleado
   */
  async obtenerVistaCompletaSemana(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    fechaInicio: string,
    fechaFin: string
  ) {
    const empresaObjectId = new mongoose.Types.ObjectId(empresaId);
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    // Obtener conexión a la base de datos de la empresa
    const empresaConnection = await databaseManager.getEmpresaConnection(empresaId, dbConfig);

    // Obtener modelos dinámicos
    const ParteTrabajo = empresaConnection.models.ParteTrabajo ||
      empresaConnection.model('ParteTrabajo', require('../partes-trabajo/ParteTrabajo').ParteTrabajo.schema);
    const Tarea = empresaConnection.models.Tarea ||
      empresaConnection.model('Tarea', require('../tareas/Tarea').Tarea.schema);

    // 1. Obtener planificaciones de la semana (del modelo principal)
    const planificaciones = await Planificacion.find({
      empresaId: empresaObjectId,
      activo: true,
      fechaInicio: { $lte: fin },
      fechaFin: { $gte: inicio },
    }).lean();

    // 2. Obtener personal activo
    const PersonalModel = empresaConnection.models.Personal ||
      empresaConnection.model('Personal', require('../personal/Personal').Personal.schema);
    const personal = await PersonalModel.find({ activo: true }).lean();

    // 3. Obtener partes de trabajo del período
    const partesTrabajo = await ParteTrabajo.find({
      activo: true,
      $or: [
        { fechaInicio: { $gte: inicio, $lte: fin } },
        { fechaPrevista: { $gte: inicio, $lte: fin } },
        { fecha: { $gte: inicio, $lte: fin } },
      ],
      estado: { $nin: ['anulado', 'facturado'] }
    }).select({
      codigo: 1,
      titulo: 1,
      clienteNombre: 1,
      direccionTrabajo: 1,
      estado: 1,
      prioridad: 1,
      fechaInicio: 1,
      fechaPrevista: 1,
      fecha: 1,
      responsableId: 1,
      responsableNombre: 1,
      'lineasPersonal.personalId': 1,
      'lineasPersonal.personalNombre': 1,
      'lineasPersonal.fecha': 1,
      'lineasPersonal.horaInicio': 1,
      'lineasPersonal.horaFin': 1,
      'lineasPersonal.descripcionTrabajo': 1,
    }).lean();

    // 4. Obtener tareas del período
    const tareas = await Tarea.find({
      activo: true,
      $or: [
        { fechaVencimiento: { $gte: inicio, $lte: fin } },
        { fechaInicio: { $gte: inicio, $lte: fin } },
      ],
      estado: { $nin: ['completada', 'cancelada'] }
    }).select({
      titulo: 1,
      tipo: 1,
      prioridad: 1,
      estado: 1,
      fechaVencimiento: 1,
      fechaInicio: 1,
      asignadoAId: 1,
      asignadoANombre: 1,
      clienteNombre: 1,
      descripcion: 1,
    }).lean();

    // 5. Construir vista por empleado y día
    const vistaEmpleados: any[] = [];

    for (const emp of personal) {
      const empleadoId = emp._id.toString();
      const empleadoVista: any = {
        _id: empleadoId,
        nombre: emp.nombre,
        apellidos: emp.apellidos,
        nombreCompleto: `${emp.nombre} ${emp.apellidos || ''}`.trim(),
        cargo: emp.cargo,
        dias: {},
      };

      // Generar días de la semana
      const currentDate = new Date(inicio);
      while (currentDate <= fin) {
        const fechaStr = currentDate.toISOString().split('T')[0];
        empleadoVista.dias[fechaStr] = {
          fecha: fechaStr,
          asignacion: null,
          partesTrabajo: [],
          tareas: [],
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Agregar asignaciones de planificación
      planificaciones.forEach(plan => {
        plan.asignaciones.forEach(asig => {
          if (asig.personalId.toString() === empleadoId) {
            const fechaAsig = new Date(asig.fecha).toISOString().split('T')[0];
            if (empleadoVista.dias[fechaAsig]) {
              empleadoVista.dias[fechaAsig].asignacion = {
                horaInicio: asig.horaInicio,
                horaFin: asig.horaFin,
                horas: asig.horasPlanificadas,
                turnoNombre: asig.turnoNombre,
                ubicacion: asig.ubicacion,
                estado: asig.estado,
                esAusencia: asig.esAusencia,
                tipoAusencia: asig.tipoAusencia,
                notas: asig.notas,
              };
            }
          }
        });
      });

      // Agregar partes de trabajo
      partesTrabajo.forEach((parte: any) => {
        // Verificar si el empleado es responsable
        if (parte.responsableId?.toString() === empleadoId) {
          const fechaParte = parte.fechaInicio || parte.fechaPrevista || parte.fecha;
          if (fechaParte) {
            const fechaStr = new Date(fechaParte).toISOString().split('T')[0];
            if (empleadoVista.dias[fechaStr]) {
              empleadoVista.dias[fechaStr].partesTrabajo.push({
                _id: parte._id,
                codigo: parte.codigo,
                titulo: parte.titulo,
                cliente: parte.clienteNombre,
                direccion: parte.direccionTrabajo?.ciudad || parte.direccionTrabajo?.calle,
                estado: parte.estado,
                prioridad: parte.prioridad,
                rol: 'responsable',
              });
            }
          }
        }

        // Verificar en líneas de personal
        (parte.lineasPersonal || []).forEach((linea: any) => {
          if (linea.personalId?.toString() === empleadoId) {
            const fechaLinea = linea.fecha;
            if (fechaLinea) {
              const fechaStr = new Date(fechaLinea).toISOString().split('T')[0];
              if (empleadoVista.dias[fechaStr]) {
                // Evitar duplicados
                const yaExiste = empleadoVista.dias[fechaStr].partesTrabajo.some(
                  (p: any) => p._id.toString() === parte._id.toString()
                );
                if (!yaExiste) {
                  empleadoVista.dias[fechaStr].partesTrabajo.push({
                    _id: parte._id,
                    codigo: parte.codigo,
                    titulo: parte.titulo,
                    cliente: parte.clienteNombre,
                    direccion: parte.direccionTrabajo?.ciudad || parte.direccionTrabajo?.calle,
                    estado: parte.estado,
                    prioridad: parte.prioridad,
                    rol: 'asignado',
                    horaInicio: linea.horaInicio,
                    horaFin: linea.horaFin,
                    descripcionTrabajo: linea.descripcionTrabajo,
                  });
                }
              }
            }
          }
        });
      });

      // Agregar tareas
      tareas.forEach((tarea: any) => {
        if (tarea.asignadoAId?.toString() === empleadoId) {
          const fechaTarea = tarea.fechaVencimiento || tarea.fechaInicio;
          if (fechaTarea) {
            const fechaStr = new Date(fechaTarea).toISOString().split('T')[0];
            if (empleadoVista.dias[fechaStr]) {
              empleadoVista.dias[fechaStr].tareas.push({
                _id: tarea._id,
                titulo: tarea.titulo,
                tipo: tarea.tipo,
                prioridad: tarea.prioridad,
                estado: tarea.estado,
                cliente: tarea.clienteNombre,
              });
            }
          }
        }
      });

      vistaEmpleados.push(empleadoVista);
    }

    return {
      fechaInicio,
      fechaFin,
      empleados: vistaEmpleados,
      resumen: {
        totalEmpleados: personal.length,
        totalPartesTrabajo: partesTrabajo.length,
        totalTareas: tareas.length,
      }
    };
  }

  // ============================================
  // ENVIO DE EMAILS
  // ============================================

  /**
   * Enviar planificación por email a empleados
   */
  async enviarPorEmail(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    fechaInicio: string,
    fechaFin: string,
    empleadoIds?: string[],
    mensaje?: string
  ): Promise<{ total: number; enviados: number; errores: string[] }> {
    // Importar utilidades de email
    const { sendEmail, emailTemplates } = await import('../../utils/email');

    // Obtener empresa para nombre
    const EmpresaModel = (await import('../empresa/Empresa')).default;
    const empresa = await EmpresaModel.findById(empresaId);
    const empresaNombre = empresa?.nombre || 'Omerix ERP';

    // Obtener vista completa
    const vistaCompleta = await this.obtenerVistaCompletaSemana(
      empresaId,
      dbConfig,
      fechaInicio,
      fechaFin
    );

    // Filtrar empleados si se especificaron IDs
    let empleadosAEnviar = vistaCompleta.empleados;
    if (empleadoIds && empleadoIds.length > 0) {
      empleadosAEnviar = empleadosAEnviar.filter(e =>
        empleadoIds.includes(e._id.toString())
      );
    }

    // Obtener conexión a la base de datos del tenant
    const empresaConnection = await databaseManager.getEmpresaConnection(empresaId, dbConfig);
    const PersonalModel = empresaConnection.model('Personal', Personal.schema);

    // Obtener emails de empleados desde la BD del tenant
    // El email está en contacto.email o contacto.emailCorporativo
    const personal = await PersonalModel.find({
      _id: { $in: empleadosAEnviar.map(e => e._id) }
    }).select('_id nombre apellidos contacto');

    const emailMap = new Map<string, string>();
    personal.forEach((p: any) => {
      // Priorizar email corporativo, si no usar email personal
      const email = p.contacto?.emailCorporativo || p.contacto?.email;
      if (email) {
        emailMap.set(p._id.toString(), email);
      }
    });

    const resultado = {
      total: empleadosAEnviar.length,
      enviados: 0,
      errores: [] as string[],
    };

    // Formatear fechas para mostrar
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const formatoFecha = (d: Date) => d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const formatoMes = (d: Date) => d.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });

    const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

    // Enviar emails a cada empleado
    for (const empleado of empleadosAEnviar) {
      const email = emailMap.get(empleado._id.toString());

      if (!email) {
        resultado.errores.push(`${empleado.nombreCompleto}: sin email configurado`);
        continue;
      }

      // Construir datos de días planificados
      const diasPlanificados: Array<{
        fecha: string;
        diaSemana: string;
        horaInicio: string;
        horaFin: string;
        horas: number;
        turno?: string;
        partes?: Array<{ codigo: string; cliente: string }>;
        tareas?: Array<{ titulo: string }>;
      }> = [];

      let totalHoras = 0;

      Object.entries(empleado.dias).forEach(([fecha, diaInfo]) => {
        // Incluir día si tiene asignación, partes o tareas
        const tieneAsignacion = !!diaInfo.asignacion;
        const tienePartes = diaInfo.partesTrabajo && diaInfo.partesTrabajo.length > 0;
        const tieneTareas = diaInfo.tareas && diaInfo.tareas.length > 0;

        if (tieneAsignacion || tienePartes || tieneTareas) {
          const fechaObj = new Date(fecha);
          diasPlanificados.push({
            fecha: formatoFecha(fechaObj),
            diaSemana: DIAS_SEMANA[fechaObj.getDay()],
            horaInicio: diaInfo.asignacion?.horaInicio || '-',
            horaFin: diaInfo.asignacion?.horaFin || '-',
            horas: diaInfo.asignacion?.horas || 0,
            turno: diaInfo.asignacion?.turnoNombre,
            partes: (diaInfo.partesTrabajo || []).map(p => ({
              codigo: p.codigo,
              cliente: p.cliente,
            })),
            tareas: (diaInfo.tareas || []).map(t => ({
              titulo: t.titulo,
            })),
          });
          totalHoras += diaInfo.asignacion?.horas || 0;
        }
      });

      if (diasPlanificados.length === 0) {
        resultado.errores.push(`${empleado.nombreCompleto}: sin días planificados`);
        continue;
      }

      // Generar HTML del email
      const html = emailTemplates.planificacionJornadas({
        empleadoNombre: empleado.nombreCompleto,
        periodo: formatoMes(inicio),
        fechaInicio: formatoFecha(inicio),
        fechaFin: formatoFecha(fin),
        diasPlanificados,
        totalHoras,
        empresaNombre,
        mensaje,
      });

      // Enviar email
      const result = await sendEmail(
        email,
        `Planificación de Jornadas - ${formatoMes(inicio)}`,
        html
      );

      if (result.success) {
        resultado.enviados++;
      } else {
        resultado.errores.push(`${empleado.nombreCompleto}: ${result.message}`);
      }
    }

    return resultado;
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
