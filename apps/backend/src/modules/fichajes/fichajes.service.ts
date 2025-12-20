import mongoose from 'mongoose';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getModeloFichaje, IFichaje } from './Fichaje';
import { getPersonalModel } from '@/utils/dynamic-models.helper';
import { getModeloDepartamento } from '../departamentos/Departamento';
import { getModeloTurno } from '../turnos/Turno';
import { ValidacionFichajeService } from './validacion-fichaje.service';
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
  private _validacionService: ValidacionFichajeService | null = null;

  constructor(empresaId: mongoose.Types.ObjectId, dbConfig: IDatabaseConfig) {
    this.empresaId = empresaId;
    this.dbConfig = dbConfig;
  }

  /**
   * Obtener el servicio de validación (lazy loading)
   */
  private getValidacionService(): ValidacionFichajeService {
    if (!this._validacionService) {
      this._validacionService = new ValidacionFichajeService(this.empresaId, this.dbConfig);
    }
    return this._validacionService;
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
    const validacionService = this.getValidacionService();

    // Obtener turno aplicable
    const { turno, origen: turnoOrigen } = await validacionService.obtenerTurnoAplicable(
      data.personalId,
      ahora
    );

    // Verificar si es festivo
    const festivoInfo = await validacionService.esFestivoParaEmpleado(data.personalId, ahora);

    // Calcular retraso si hay turno
    let minutosRetraso = 0;
    let horasTeoricas = 0;
    if (turno) {
      const esDiaLaboral = validacionService.esDiaLaboral(turno, ahora);
      if (!festivoInfo.esFestivo && esDiaLaboral) {
        horasTeoricas = turno.horasTeoricas;
        const tolerancia = await validacionService.obtenerToleranciaRetraso(data.personalId);
        minutosRetraso = validacionService.calcularRetraso(ahora, turno.horaEntrada, tolerancia);
      }
    }

    const Turno = await getModeloTurno(this.empresaId, this.dbConfig);
    const turnoDoc = turno ? await Turno.findById(turno._id) : null;

    const fichaje = new Fichaje({
      personalId: new mongoose.Types.ObjectId(data.personalId),
      personalNombre: `${personal.nombre} ${personal.apellidos}`,
      personalCodigo: personal.codigo,
      departamentoId: departamentoId,
      departamentoNombre: departamentoNombre,
      turnoId: turnoDoc?._id,
      turnoNombre: turnoDoc?.nombre,
      fecha: new Date(ahora.toDateString()),
      horaEntrada: ahora,
      tipo: data.tipo || 'normal',
      estado: 'abierto',
      ubicacionEntrada: data.ubicacion,
      ipEntrada: ip,
      observaciones: data.observaciones,
      // Campos de validación
      horasTeoricas,
      minutosRetraso,
      esFestivoTrabajado: festivoInfo.esFestivo,
      festivoNombre: festivoInfo.festivo?.nombre,
      validado: !!turno,
      incidenciaTipo: minutosRetraso > 0 ? 'retraso' : (festivoInfo.esFestivo ? 'festivo' : undefined),
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

    // Validar salida y calcular horas extra
    const validacionService = this.getValidacionService();

    // Calcular anticipación en salida si hay turno
    if (fichaje.turnoId) {
      const Turno = await getModeloTurno(this.empresaId, this.dbConfig);
      const turno = await Turno.findById(fichaje.turnoId);
      if (turno) {
        fichaje.minutosAnticipacion = validacionService.calcularAnticipacion(ahora, turno.horaSalida);

        // Actualizar tipo de incidencia si hay salida anticipada y no había retraso
        if (fichaje.minutosAnticipacion > 0 && !fichaje.incidenciaTipo) {
          fichaje.incidenciaTipo = 'salida_anticipada';
        }
      }
    }

    // Calcular horas extra
    // Si es festivo, 100% de las horas son extra
    // Si no, solo el exceso sobre las teóricas
    if (fichaje.horasTrabajadas) {
      if (fichaje.esFestivoTrabajado) {
        // Festivo: todas las horas son extra
        fichaje.horasExtra = fichaje.horasTrabajadas;
      } else if (fichaje.horasTeoricas && fichaje.horasTeoricas > 0) {
        // Normal: solo el exceso
        const diferencia = fichaje.horasTrabajadas - fichaje.horasTeoricas;
        fichaje.horasExtra = diferencia > 0 ? Math.round(diferencia * 100) / 100 : 0;
      }
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
   * Aprobar fichaje
   */
  async aprobar(id: string, usuarioId: mongoose.Types.ObjectId) {
    const Fichaje = await this.getFichajeModel();
    const fichaje = await Fichaje.findById(id);
    if (!fichaje) {
      throw new Error('Fichaje no encontrado');
    }

    if (fichaje.estado === 'abierto') {
      throw new Error('No se puede aprobar un fichaje abierto. Debe estar cerrado primero.');
    }

    if (fichaje.estado === 'aprobado') {
      throw new Error('El fichaje ya está aprobado');
    }

    fichaje.estado = 'aprobado';
    fichaje.aprobadoPor = usuarioId;
    fichaje.fechaAprobacion = new Date();
    fichaje.modificadoPor = usuarioId;

    return fichaje.save();
  }

  /**
   * Rechazar fichaje
   */
  async rechazar(id: string, usuarioId: mongoose.Types.ObjectId, motivo?: string) {
    const Fichaje = await this.getFichajeModel();
    const fichaje = await Fichaje.findById(id);
    if (!fichaje) {
      throw new Error('Fichaje no encontrado');
    }

    if (fichaje.estado === 'abierto') {
      throw new Error('No se puede rechazar un fichaje abierto. Debe estar cerrado primero.');
    }

    if (fichaje.estado === 'rechazado') {
      throw new Error('El fichaje ya está rechazado');
    }

    fichaje.estado = 'rechazado';
    fichaje.modificadoPor = usuarioId;
    if (motivo) {
      fichaje.incidencia = motivo;
    }

    return fichaje.save();
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

    // Horas trabajadas totales
    const totalHoras = fichajes.reduce((sum, f) => sum + (f.horasTrabajadas || 0), 0);

    // Corregido: contar fechas únicas en vez de documentos
    const fechasUnicas = new Set(
      fichajes
        .filter(f => f.estado === 'cerrado' || f.estado === 'aprobado')
        .map(f => new Date(f.fecha).toISOString().split('T')[0])
    );
    const diasTrabajados = fechasUnicas.size;

    // Horas extra
    const horasExtra = fichajes.reduce((sum, f) => sum + (f.horasExtra || 0), 0);

    // Horas teóricas (suma de los fichajes validados)
    const horasTeoricas = fichajes.reduce((sum, f) => sum + (f.horasTeoricas || 0), 0);

    // Festivos trabajados (contar fechas únicas con esFestivoTrabajado)
    const festivosTrabajadosSet = new Set(
      fichajes
        .filter(f => f.esFestivoTrabajado)
        .map(f => new Date(f.fecha).toISOString().split('T')[0])
    );
    const festivosTrabajados = festivosTrabajadosSet.size;

    // Calcular estadísticas del período usando el servicio de validación
    const validacionService = this.getValidacionService();
    const estadisticasPeriodo = await validacionService.calcularEstadisticasPeriodo(
      personalId,
      inicio,
      fin
    );

    // Ausencias: días laborables sin fichaje
    const fechasFichaje = new Set(
      fichajes.map(f => new Date(f.fecha).toISOString().split('T')[0])
    );

    // Contar ausencias (días laborables sin ningún fichaje)
    let ausencias = 0;
    const fechaActual = new Date(inicio);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    while (fechaActual <= fin && fechaActual <= hoy) {
      const fechaStr = fechaActual.toISOString().split('T')[0];
      const { turno } = await validacionService.obtenerTurnoAplicable(personalId, fechaActual);
      const festivoInfo = await validacionService.esFestivoParaEmpleado(personalId, fechaActual);

      // Es día laborable si hay turno, es día del turno y no es festivo
      if (turno && validacionService.esDiaLaboral(turno, fechaActual) && !festivoInfo.esFestivo) {
        if (!fechasFichaje.has(fechaStr)) {
          ausencias++;
        }
      }

      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    // Diferencia entre horas reales y teóricas
    const diferencia = totalHoras - estadisticasPeriodo.horasTeoricas;

    return {
      mes: mesActual,
      anio: anioActual,
      // Horas
      totalHoras: Math.round(totalHoras * 100) / 100,
      horasTeoricas: Math.round(estadisticasPeriodo.horasTeoricas * 100) / 100,
      diferencia: Math.round(diferencia * 100) / 100,
      horasExtra: Math.round(horasExtra * 100) / 100,
      // Días
      diasTrabajados,
      diasLaborables: estadisticasPeriodo.diasLaborables,
      festivosEnPeriodo: estadisticasPeriodo.festivosEnPeriodo,
      festivosTrabajados,
      ausencias,
      // Detalle
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
