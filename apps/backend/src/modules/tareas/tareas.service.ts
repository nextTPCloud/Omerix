import { Connection, Types } from 'mongoose';
import { Tarea, ITarea, EstadoTarea, RecurrenciaTarea } from './Tarea';
import {
  CreateTareaDTO,
  UpdateTareaDTO,
  CambiarEstadoTareaDTO,
  AgregarComentarioDTO,
  SearchTareasDTO,
} from './tareas.dto';
import { getEmpresaConnection, EmpresaDbConfig } from '../../config/database';

class TareasService {
  /**
   * Obtener el modelo de Tarea para una empresa
   */
  private getModel(connection: Connection) {
    return connection.model<ITarea>('Tarea', Tarea.schema);
  }

  /**
   * Listar tareas con filtros
   */
  async listar(filters: SearchTareasDTO, usuarioId: string, empresaId: string, dbConfig: EmpresaDbConfig) {
    const connection = await getEmpresaConnection(dbConfig);
    const Model = this.getModel(connection);

    const query: any = {};

    // Búsqueda de texto
    if (filters.q) {
      query.$or = [
        { titulo: { $regex: filters.q, $options: 'i' } },
        { descripcion: { $regex: filters.q, $options: 'i' } },
        { clienteNombre: { $regex: filters.q, $options: 'i' } },
      ];
    }

    // Filtros básicos
    if (filters.estado) {
      query.estado = filters.estado;
    }
    if (filters.prioridad) {
      query.prioridad = filters.prioridad;
    }
    if (filters.tipo) {
      query.tipo = filters.tipo;
    }
    if (filters.asignadoAId) {
      query.asignadoAId = new Types.ObjectId(filters.asignadoAId);
    }
    if (filters.creadoPorId) {
      query.creadoPorId = new Types.ObjectId(filters.creadoPorId);
    }
    if (filters.clienteId) {
      query.clienteId = new Types.ObjectId(filters.clienteId);
    }
    if (filters.proyectoId) {
      query.proyectoId = new Types.ObjectId(filters.proyectoId);
    }
    if (filters.departamentoId) {
      query.departamentoId = new Types.ObjectId(filters.departamentoId);
    }

    // Mis tareas
    if (filters.misTareas) {
      query.$or = [
        { asignadoAId: new Types.ObjectId(usuarioId) },
        { creadoPorId: new Types.ObjectId(usuarioId) },
      ];
    }

    // Filtros de fecha
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const finHoy = new Date(hoy.getTime() + 24 * 60 * 60 * 1000 - 1);
    const finSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (filters.vencidas) {
      query.fechaVencimiento = { $lt: hoy };
      query.estado = { $in: [EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO] };
    } else if (filters.hoy) {
      query.fechaVencimiento = { $gte: hoy, $lte: finHoy };
    } else if (filters.semana) {
      query.fechaVencimiento = { $gte: hoy, $lte: finSemana };
    } else if (filters.fechaDesde || filters.fechaHasta) {
      query.fechaVencimiento = {};
      if (filters.fechaDesde) {
        query.fechaVencimiento.$gte = new Date(filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        query.fechaVencimiento.$lte = new Date(filters.fechaHasta + 'T23:59:59');
      }
    }

    const sort: any = {};
    sort[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;

    const skip = (filters.page - 1) * filters.limit;

    const [data, total] = await Promise.all([
      Model.find(query)
        .sort(sort)
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      Model.countDocuments(query),
    ]);

    return { data, total };
  }

  /**
   * Obtener tarea por ID
   */
  async obtenerPorId(id: string, empresaId: string, dbConfig: EmpresaDbConfig) {
    const connection = await getEmpresaConnection(dbConfig);
    const Model = this.getModel(connection);
    return Model.findById(id).lean();
  }

  /**
   * Crear tarea
   */
  async crear(
    data: CreateTareaDTO,
    usuarioId: string,
    usuarioNombre: string,
    empresaId: string,
    dbConfig: EmpresaDbConfig
  ) {
    const connection = await getEmpresaConnection(dbConfig);
    const Model = this.getModel(connection);

    // Obtener nombres relacionados si hay IDs
    let asignadoANombre: string | undefined;
    let departamentoNombre: string | undefined;
    let clienteNombre: string | undefined;
    let proveedorNombre: string | undefined;
    let proyectoNombre: string | undefined;

    if (data.asignadoAId) {
      const PersonalModel = connection.model('Personal');
      const personal = await PersonalModel.findById(data.asignadoAId).lean() as any;
      asignadoANombre = personal?.nombre;
    }

    if (data.departamentoId) {
      const DepartamentoModel = connection.model('Departamento');
      const depto = await DepartamentoModel.findById(data.departamentoId).lean() as any;
      departamentoNombre = depto?.nombre;
    }

    if (data.clienteId) {
      const ClienteModel = connection.model('Cliente');
      const cliente = await ClienteModel.findById(data.clienteId).lean() as any;
      clienteNombre = cliente?.nombre || cliente?.razonSocial;
    }

    if (data.proveedorId) {
      const ProveedorModel = connection.model('Proveedor');
      const proveedor = await ProveedorModel.findById(data.proveedorId).lean() as any;
      proveedorNombre = proveedor?.nombre || proveedor?.razonSocial;
    }

    if (data.proyectoId) {
      const ProyectoModel = connection.model('Proyecto');
      const proyecto = await ProyectoModel.findById(data.proyectoId).lean() as any;
      proyectoNombre = proyecto?.nombre;
    }

    const tarea = new Model({
      ...data,
      fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined,
      fechaRecordatorio: data.fechaRecordatorio ? new Date(data.fechaRecordatorio) : undefined,
      fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
      creadoPorId: new Types.ObjectId(usuarioId),
      creadoPorNombre: usuarioNombre,
      asignadoAId: data.asignadoAId ? new Types.ObjectId(data.asignadoAId) : undefined,
      asignadoANombre,
      departamentoId: data.departamentoId ? new Types.ObjectId(data.departamentoId) : undefined,
      departamentoNombre,
      clienteId: data.clienteId ? new Types.ObjectId(data.clienteId) : undefined,
      clienteNombre,
      proveedorId: data.proveedorId ? new Types.ObjectId(data.proveedorId) : undefined,
      proveedorNombre,
      proyectoId: data.proyectoId ? new Types.ObjectId(data.proyectoId) : undefined,
      proyectoNombre,
      documentoId: data.documentoId ? new Types.ObjectId(data.documentoId) : undefined,
    });

    // Calcular próxima recurrencia si aplica
    if (data.recurrencia && data.recurrencia !== 'ninguna' && data.fechaVencimiento) {
      tarea.proximaRecurrencia = tarea.calcularProximaRecurrencia?.();
    }

    await tarea.save();
    return tarea.toObject();
  }

  /**
   * Actualizar tarea
   */
  async actualizar(id: string, data: UpdateTareaDTO, empresaId: string, dbConfig: EmpresaDbConfig) {
    const connection = await getEmpresaConnection(dbConfig);
    const Model = this.getModel(connection);

    const tarea = await Model.findById(id);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    // Actualizar campos
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        if (key.endsWith('Id') && value) {
          (tarea as any)[key] = new Types.ObjectId(value);
        } else if (['fechaVencimiento', 'fechaRecordatorio', 'fechaInicio'].includes(key) && value) {
          (tarea as any)[key] = new Date(value);
        } else {
          (tarea as any)[key] = value;
        }
      }
    });

    // Recalcular próxima recurrencia
    if (tarea.recurrencia !== RecurrenciaTarea.NINGUNA && tarea.fechaVencimiento) {
      tarea.proximaRecurrencia = tarea.calcularProximaRecurrencia?.();
    }

    await tarea.save();
    return tarea.toObject();
  }

  /**
   * Cambiar estado de tarea
   */
  async cambiarEstado(
    id: string,
    data: CambiarEstadoTareaDTO,
    usuarioId: string,
    usuarioNombre: string,
    empresaId: string,
    dbConfig: EmpresaDbConfig
  ) {
    const connection = await getEmpresaConnection(dbConfig);
    const Model = this.getModel(connection);

    const tarea = await Model.findById(id);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    const estadoAnterior = tarea.estado;
    tarea.estado = data.estado as EstadoTarea;

    // Si se completa
    if (data.estado === EstadoTarea.COMPLETADA) {
      tarea.fechaCompletada = new Date();
      tarea.porcentajeCompletado = 100;

      // Si tiene recurrencia, crear la siguiente tarea
      if (tarea.recurrencia !== RecurrenciaTarea.NINGUNA && tarea.proximaRecurrencia) {
        await this.crearTareaRecurrente(tarea, usuarioId, usuarioNombre, connection);
      }
    }

    // Agregar comentario si se proporciona
    if (data.comentario) {
      tarea.comentarios.push({
        usuarioId: new Types.ObjectId(usuarioId),
        usuarioNombre,
        texto: `Estado cambiado de "${estadoAnterior}" a "${data.estado}". ${data.comentario}`,
        fecha: new Date(),
      });
    }

    await tarea.save();
    return tarea.toObject();
  }

  /**
   * Crear tarea recurrente
   */
  private async crearTareaRecurrente(tareaOriginal: ITarea, usuarioId: string, usuarioNombre: string, connection: Connection) {
    const Model = this.getModel(connection);

    const nuevaTarea = new Model({
      titulo: tareaOriginal.titulo,
      descripcion: tareaOriginal.descripcion,
      tipo: tareaOriginal.tipo,
      estado: EstadoTarea.PENDIENTE,
      prioridad: tareaOriginal.prioridad,
      fechaVencimiento: tareaOriginal.proximaRecurrencia,
      recurrencia: tareaOriginal.recurrencia,
      tareaOrigenId: tareaOriginal._id,
      creadoPorId: new Types.ObjectId(usuarioId),
      creadoPorNombre: usuarioNombre,
      asignadoAId: tareaOriginal.asignadoAId,
      asignadoANombre: tareaOriginal.asignadoANombre,
      departamentoId: tareaOriginal.departamentoId,
      departamentoNombre: tareaOriginal.departamentoNombre,
      clienteId: tareaOriginal.clienteId,
      clienteNombre: tareaOriginal.clienteNombre,
      proveedorId: tareaOriginal.proveedorId,
      proveedorNombre: tareaOriginal.proveedorNombre,
      proyectoId: tareaOriginal.proyectoId,
      proyectoNombre: tareaOriginal.proyectoNombre,
      horasEstimadas: tareaOriginal.horasEstimadas,
      enviarRecordatorio: tareaOriginal.enviarRecordatorio,
      notificarAlCompletar: tareaOriginal.notificarAlCompletar,
      etiquetas: tareaOriginal.etiquetas,
      color: tareaOriginal.color,
    });

    // Calcular próxima recurrencia
    nuevaTarea.proximaRecurrencia = nuevaTarea.calcularProximaRecurrencia?.();

    await nuevaTarea.save();
    return nuevaTarea;
  }

  /**
   * Agregar comentario
   */
  async agregarComentario(
    id: string,
    data: AgregarComentarioDTO,
    usuarioId: string,
    usuarioNombre: string,
    empresaId: string,
    dbConfig: EmpresaDbConfig
  ) {
    const connection = await getEmpresaConnection(dbConfig);
    const Model = this.getModel(connection);

    const tarea = await Model.findById(id);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    tarea.comentarios.push({
      usuarioId: new Types.ObjectId(usuarioId),
      usuarioNombre,
      texto: data.texto,
      fecha: new Date(),
    });

    await tarea.save();
    return tarea.toObject();
  }

  /**
   * Eliminar tarea
   */
  async eliminar(id: string, empresaId: string, dbConfig: EmpresaDbConfig) {
    const connection = await getEmpresaConnection(dbConfig);
    const Model = this.getModel(connection);
    return Model.findByIdAndDelete(id);
  }

  /**
   * Obtener estadísticas
   */
  async obtenerEstadisticas(usuarioId: string, empresaId: string, dbConfig: EmpresaDbConfig) {
    const connection = await getEmpresaConnection(dbConfig);
    const Model = this.getModel(connection);

    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const finHoy = new Date(hoy.getTime() + 24 * 60 * 60 * 1000 - 1);
    const finSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      pendientes,
      enProgreso,
      completadasHoy,
      vencidas,
      paraHoy,
      paraSemana,
      urgentes,
    ] = await Promise.all([
      Model.countDocuments({ estado: EstadoTarea.PENDIENTE }),
      Model.countDocuments({ estado: EstadoTarea.EN_PROGRESO }),
      Model.countDocuments({
        estado: EstadoTarea.COMPLETADA,
        fechaCompletada: { $gte: hoy, $lte: finHoy }
      }),
      Model.countDocuments({
        fechaVencimiento: { $lt: hoy },
        estado: { $in: [EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO] }
      }),
      Model.countDocuments({
        fechaVencimiento: { $gte: hoy, $lte: finHoy },
        estado: { $in: [EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO] }
      }),
      Model.countDocuments({
        fechaVencimiento: { $gte: hoy, $lte: finSemana },
        estado: { $in: [EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO] }
      }),
      Model.countDocuments({
        prioridad: 'urgente',
        estado: { $in: [EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO] }
      }),
    ]);

    return {
      pendientes,
      enProgreso,
      completadasHoy,
      vencidas,
      paraHoy,
      paraSemana,
      urgentes,
    };
  }

  /**
   * Obtener tareas para el widget del dashboard
   */
  async obtenerParaWidget(usuarioId: string, empresaId: string, dbConfig: EmpresaDbConfig) {
    const connection = await getEmpresaConnection(dbConfig);
    const Model = this.getModel(connection);

    const ahora = new Date();
    const finSemana = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Tareas próximas a vencer o vencidas, ordenadas por prioridad y fecha
    const tareas = await Model.find({
      estado: { $in: [EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO] },
      $or: [
        { fechaVencimiento: { $lte: finSemana } },
        { prioridad: 'urgente' },
        { prioridad: 'alta' },
      ]
    })
      .sort({ prioridad: -1, fechaVencimiento: 1 })
      .limit(10)
      .lean();

    return tareas;
  }
}

export const tareasService = new TareasService();
export default tareasService;
