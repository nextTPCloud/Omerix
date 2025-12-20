import mongoose from 'mongoose';
import { IDatabaseConfig } from '@/models/Empresa';
import { getModeloFichaje, IFichaje } from './Fichaje';
import { getPersonalModel } from '@/utils/dynamic-models.helper';
import { getModeloDepartamento } from '../departamentos/Departamento';
import {
  CreateFichajeDTO,
  RegistrarEntradaDTO,
  RegistrarSalidaDTO,
  RegistrarPausaDTO,
  UpdateFichajeDTO,
  FichajeQueryDTO,
} from './fichajes.dto';

// ============================================
// SERVICIO DE FICHAJES
// ============================================

export class FichajesService {
  private empresaId: mongoose.Types.ObjectId;
  private dbConfig: IDatabaseConfig;
  private _fichaje: mongoose.Model<IFichaje> | null = null;

  constructor(empresaId: mongoose.Types.ObjectId, dbConfig: IDatabaseConfig) {
    this.empresaId = empresaId;
    this.dbConfig = dbConfig;
  }

  /**
   * Obtener el modelo de Fichaje (lazy loading)
   */
  private async getFichajeModel(): Promise<mongoose.Model<IFichaje>> {
    if (!this._fichaje) {
      this._fichaje = await getModeloFichaje(this.empresaId, this.dbConfig);
    }
    return this._fichaje;
  }

  /**
   * Obtener fichajes con filtros y paginacion
   */
  async getAll(query: FichajeQueryDTO) {
    const Fichaje = await this.getFichajeModel();

    const {
      personalId,
      departamentoId,
      fechaDesde,
      fechaHasta,
      estado,
      tipo,
      page = 1,
      limit = 25,
      sortBy = 'fecha',
      sortOrder = 'desc',
    } = query;

    const filter: any = {};

    if (personalId) {
      filter.personalId = new mongoose.Types.ObjectId(personalId);
    }

    if (departamentoId) {
      filter.departamentoId = new mongoose.Types.ObjectId(departamentoId);
    }

    if (fechaDesde || fechaHasta) {
      filter.fecha = {};
      if (fechaDesde) filter.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) filter.fecha.$lte = new Date(fechaHasta + 'T23:59:59');
    }

    if (estado && estado !== 'all') {
      filter.estado = estado;
    }

    if (tipo && tipo !== 'all') {
      filter.tipo = tipo;
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [fichajes, total] = await Promise.all([
      Fichaje.find(filter).sort(sort).skip(skip).limit(limit),
      Fichaje.countDocuments(filter),
    ]);

    return {
      data: fichajes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener fichaje por ID
   */
  async getById(id: string) {
    const Fichaje = await this.getFichajeModel();
    return Fichaje.findById(id);
  }

  /**
   * Obtener fichaje abierto de un empleado
   */
  async getFichajeAbierto(personalId: string) {
    const Fichaje = await this.getFichajeModel();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return Fichaje.findOne({
      personalId: new mongoose.Types.ObjectId(personalId),
      fecha: { $gte: hoy },
      estado: 'abierto',
    });
  }

  /**
   * Registrar entrada (fichar)
   */
  async registrarEntrada(
    data: RegistrarEntradaDTO,
    usuarioId: mongoose.Types.ObjectId,
    ip?: string
  ) {
    const Fichaje = await this.getFichajeModel();

    // Verificar si ya tiene fichaje abierto
    const fichajeExistente = await this.getFichajeAbierto(data.personalId);
    if (fichajeExistente) {
      throw new Error('Ya existe un fichaje abierto para hoy');
    }

    // Obtener datos del personal para campos desnormalizados
    const Personal = await getPersonalModel(this.empresaId.toString(), this.dbConfig);
    const personal = await Personal.findById(data.personalId);
    if (!personal) {
      throw new Error('Personal no encontrado');
    }

    // Validar ubicación obligatoria
    if (personal.datosLaborales?.ubicacionObligatoria && !data.ubicacion) {
      throw new Error('La ubicación es obligatoria para fichar');
    }

    // Obtener nombre del departamento si existe
    let departamentoNombre: string | undefined;
    const departamentoId = personal.datosLaborales?.departamentoId;
    if (departamentoId) {
      const Departamento = await getModeloDepartamento(this.empresaId, this.dbConfig);
      const depto = await Departamento.findById(departamentoId);
      if (depto) {
        departamentoNombre = depto.nombre;
      }
    }

    const ahora = new Date();
    const fichaje = new Fichaje({
      personalId: new mongoose.Types.ObjectId(data.personalId),
      personalNombre: `${personal.nombre} ${personal.apellidos}`,
      personalCodigo: personal.codigo,
      departamentoId: departamentoId,
      departamentoNombre: departamentoNombre,
      fecha: new Date(ahora.toDateString()),
      horaEntrada: ahora,
      tipo: data.tipo || 'normal',
      estado: 'abierto',
      ubicacionEntrada: data.ubicacion,
      ipEntrada: ip,
      observaciones: data.observaciones,
      creadoPor: usuarioId,
    });

    return fichaje.save();
  }

  /**
   * Registrar salida
   */
  async registrarSalida(
    data: RegistrarSalidaDTO,
    usuarioId: mongoose.Types.ObjectId,
    ip?: string
  ) {
    const Fichaje = await this.getFichajeModel();
    const fichaje = await Fichaje.findById(data.fichajeId);
    if (!fichaje) {
      throw new Error('Fichaje no encontrado');
    }

    if (fichaje.estado !== 'abierto') {
      throw new Error('El fichaje ya está cerrado');
    }

    const ahora = new Date();
    fichaje.horaSalida = ahora;
    fichaje.ubicacionSalida = data.ubicacion;
    fichaje.ipSalida = ip;
    fichaje.estado = 'cerrado';
    fichaje.modificadoPor = usuarioId;

    if (data.observaciones) {
      fichaje.observaciones = (fichaje.observaciones || '') + '\n' + data.observaciones;
    }

    // Calcular horas trabajadas
    if (fichaje.horaEntrada) {
      let minutos = (ahora.getTime() - fichaje.horaEntrada.getTime()) / (1000 * 60);

      // Restar pausa si existe
      if (fichaje.pausaInicio && fichaje.pausaFin) {
        const pausaMinutos = (fichaje.pausaFin.getTime() - fichaje.pausaInicio.getTime()) / (1000 * 60);
        minutos -= pausaMinutos;
      }

      fichaje.horasTrabajadas = Math.max(0, Math.round(minutos / 60 * 100) / 100);
    }

    return fichaje.save();
  }

  /**
   * Registrar pausa
   */
  async registrarPausa(
    data: RegistrarPausaDTO,
    usuarioId: mongoose.Types.ObjectId
  ) {
    const Fichaje = await this.getFichajeModel();
    const fichaje = await Fichaje.findById(data.fichajeId);
    if (!fichaje) {
      throw new Error('Fichaje no encontrado');
    }

    if (fichaje.estado !== 'abierto') {
      throw new Error('El fichaje ya está cerrado');
    }

    const ahora = new Date();

    if (data.tipo === 'inicio') {
      if (fichaje.pausaInicio && !fichaje.pausaFin) {
        throw new Error('Ya hay una pausa en curso');
      }
      fichaje.pausaInicio = ahora;
      fichaje.pausaFin = undefined;
    } else {
      if (!fichaje.pausaInicio) {
        throw new Error('No hay una pausa iniciada');
      }
      fichaje.pausaFin = ahora;
    }

    fichaje.modificadoPor = usuarioId;
    return fichaje.save();
  }

  /**
   * Actualizar fichaje (manual)
   */
  async update(
    id: string,
    data: UpdateFichajeDTO,
    usuarioId: mongoose.Types.ObjectId
  ) {
    const Fichaje = await this.getFichajeModel();
    const fichaje = await Fichaje.findById(id);
    if (!fichaje) {
      throw new Error('Fichaje no encontrado');
    }

    if (data.horaEntrada) {
      fichaje.horaEntrada = new Date(data.horaEntrada);
    }
    if (data.horaSalida) {
      fichaje.horaSalida = new Date(data.horaSalida);
    }
    if (data.pausaInicio) {
      fichaje.pausaInicio = new Date(data.pausaInicio);
    }
    if (data.pausaFin) {
      fichaje.pausaFin = new Date(data.pausaFin);
    }
    if (data.tipo) {
      fichaje.tipo = data.tipo;
    }
    if (data.estado) {
      fichaje.estado = data.estado;
      if (data.estado === 'aprobado') {
        fichaje.aprobadoPor = usuarioId;
        fichaje.fechaAprobacion = new Date();
      }
    }
    if (data.observaciones !== undefined) {
      fichaje.observaciones = data.observaciones;
    }
    if (data.incidencia !== undefined) {
      fichaje.incidencia = data.incidencia;
    }

    // Recalcular horas si hay entrada y salida
    if (fichaje.horaEntrada && fichaje.horaSalida) {
      let minutos = (fichaje.horaSalida.getTime() - fichaje.horaEntrada.getTime()) / (1000 * 60);
      if (fichaje.pausaInicio && fichaje.pausaFin) {
        const pausaMinutos = (fichaje.pausaFin.getTime() - fichaje.pausaInicio.getTime()) / (1000 * 60);
        minutos -= pausaMinutos;
      }
      fichaje.horasTrabajadas = Math.max(0, Math.round(minutos / 60 * 100) / 100);
    }

    fichaje.modificadoPor = usuarioId;
    return fichaje.save();
  }

  /**
   * Eliminar fichaje
   */
  async delete(id: string) {
    const Fichaje = await this.getFichajeModel();
    return Fichaje.findByIdAndDelete(id);
  }

  /**
   * Obtener resumen de fichajes de un empleado
   */
  async getResumenEmpleado(personalId: string, mes?: number, anio?: number) {
    const Fichaje = await this.getFichajeModel();
    const ahora = new Date();
    const mesActual = mes ?? ahora.getMonth() + 1;
    const anioActual = anio ?? ahora.getFullYear();

    const inicio = new Date(anioActual, mesActual - 1, 1);
    const fin = new Date(anioActual, mesActual, 0, 23, 59, 59);

    const fichajes = await Fichaje.find({
      personalId: new mongoose.Types.ObjectId(personalId),
      fecha: { $gte: inicio, $lte: fin },
    }).sort({ fecha: 1 });

    const totalHoras = fichajes.reduce((sum, f) => sum + (f.horasTrabajadas || 0), 0);
    const diasTrabajados = fichajes.filter(f => f.estado === 'cerrado' || f.estado === 'aprobado').length;
    const horasExtra = fichajes.reduce((sum, f) => sum + (f.horasExtra || 0), 0);

    return {
      mes: mesActual,
      anio: anioActual,
      totalHoras: Math.round(totalHoras * 100) / 100,
      diasTrabajados,
      horasExtra: Math.round(horasExtra * 100) / 100,
      fichajes,
    };
  }

  /**
   * Obtener estado actual de fichaje del empleado
   */
  async getEstadoActual(personalId: string) {
    const fichajeAbierto = await this.getFichajeAbierto(personalId);

    if (!fichajeAbierto) {
      return {
        fichando: false,
        enPausa: false,
        fichaje: null,
      };
    }

    const enPausa = fichajeAbierto.pausaInicio && !fichajeAbierto.pausaFin;

    return {
      fichando: true,
      enPausa,
      fichaje: fichajeAbierto,
    };
  }
}
