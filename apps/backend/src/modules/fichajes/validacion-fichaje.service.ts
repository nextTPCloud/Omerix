import mongoose from 'mongoose';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getModeloTurno, getModeloHorarioPersonal, ITurno, IHorarioPersonal } from '../turnos/Turno';
import { getModeloCalendarioLaboral, ICalendarioLaboral, IFestivo } from '../calendarios/CalendarioLaboral';
import { getModeloDepartamento } from '../departamentos/Departamento';
import { getPersonalModel } from '@/utils/dynamic-models.helper';

// ============================================
// INTERFACES DE RESULTADO
// ============================================

export interface TurnoAplicable {
  turno: ITurno | null;
  origen: 'horario_personal' | 'personal' | 'departamento' | 'ninguno';
}

export interface FestivoInfo {
  esFestivo: boolean;
  festivo?: IFestivo;
}

export interface ValidacionResult {
  valido: boolean;
  horasTeoricas: number;
  minutosRetraso: number;
  minutosAnticipacion: number;
  esFestivoTrabajado: boolean;
  festivoNombre?: string;
  horasExtra: number;
  incidenciaTipo?: 'retraso' | 'salida_anticipada' | 'sin_salida' | 'festivo' | 'otro';
  observaciones?: string;
}

// ============================================
// SERVICIO DE VALIDACIÓN DE FICHAJES
// ============================================

export class ValidacionFichajeService {
  private empresaId: mongoose.Types.ObjectId;
  private dbConfig: IDatabaseConfig;

  constructor(empresaId: mongoose.Types.ObjectId, dbConfig: IDatabaseConfig) {
    this.empresaId = empresaId;
    this.dbConfig = dbConfig;
  }

  /**
   * Obtener el turno aplicable para un empleado en una fecha
   * Orden de prioridad: HorarioPersonal > Personal.turnoDefectoId > Departamento.turnoDefectoId
   */
  async obtenerTurnoAplicable(
    personalId: string,
    fecha: Date
  ): Promise<TurnoAplicable> {
    const Turno = await getModeloTurno(this.empresaId, this.dbConfig);
    const HorarioPersonal = await getModeloHorarioPersonal(this.empresaId, this.dbConfig);
    const Personal = await getPersonalModel(this.empresaId.toString(), this.dbConfig);
    const Departamento = await getModeloDepartamento(this.empresaId, this.dbConfig);

    // 1. Buscar en HorarioPersonal (asignación temporal/específica)
    const horario = await HorarioPersonal.findOne({
      personalId: new mongoose.Types.ObjectId(personalId),
      fechaInicio: { $lte: fecha },
      $or: [
        { fechaFin: { $gte: fecha } },
        { fechaFin: null },
      ],
      activo: true,
    }).sort({ fechaInicio: -1 });

    if (horario && horario.turnoId) {
      const turno = await Turno.findById(horario.turnoId);
      if (turno && turno.activo) {
        return { turno, origen: 'horario_personal' };
      }
    }

    // 2. Buscar en Personal.datosLaborales.turnoDefectoId
    const personal = await Personal.findById(personalId);
    if (personal?.datosLaborales?.turnoDefectoId) {
      const turno = await Turno.findById(personal.datosLaborales.turnoDefectoId);
      if (turno && turno.activo) {
        return { turno, origen: 'personal' };
      }
    }

    // 3. Buscar en Departamento.turnoDefectoId (herencia)
    if (personal?.datosLaborales?.departamentoId) {
      const departamento = await Departamento.findById(personal.datosLaborales.departamentoId);
      if (departamento?.turnoDefectoId) {
        const turno = await Turno.findById(departamento.turnoDefectoId);
        if (turno && turno.activo) {
          return { turno, origen: 'departamento' };
        }
      }
    }

    return { turno: null, origen: 'ninguno' };
  }

  /**
   * Obtener el calendario laboral aplicable para un empleado
   * Orden: Personal.calendarioLaboralId > Departamento.calendarioLaboralId > Por defecto del año
   */
  async obtenerCalendarioAplicable(
    personalId: string,
    fecha: Date
  ): Promise<ICalendarioLaboral | null> {
    const CalendarioLaboral = await getModeloCalendarioLaboral(this.empresaId, this.dbConfig);
    const Personal = await getPersonalModel(this.empresaId.toString(), this.dbConfig);
    const Departamento = await getModeloDepartamento(this.empresaId, this.dbConfig);

    const anio = fecha.getFullYear();

    // 1. Calendario asignado al empleado
    const personal = await Personal.findById(personalId);
    if (personal?.datosLaborales?.calendarioLaboralId) {
      const calendario = await CalendarioLaboral.findOne({
        _id: personal.datosLaborales.calendarioLaboralId,
        anio,
        activo: true,
      });
      if (calendario) return calendario;
    }

    // 2. Calendario del departamento (herencia)
    if (personal?.datosLaborales?.departamentoId) {
      const departamento = await Departamento.findById(personal.datosLaborales.departamentoId);
      if (departamento?.calendarioLaboralId) {
        const calendario = await CalendarioLaboral.findOne({
          _id: departamento.calendarioLaboralId,
          anio,
          activo: true,
        });
        if (calendario) return calendario;
      }
    }

    // 3. Calendario por defecto del año
    const calendarioDefecto = await CalendarioLaboral.findOne({
      anio,
      esDefecto: true,
      activo: true,
    });

    return calendarioDefecto;
  }

  /**
   * Verificar si una fecha es festivo para un empleado
   */
  async esFestivoParaEmpleado(
    personalId: string,
    fecha: Date
  ): Promise<FestivoInfo> {
    const calendario = await this.obtenerCalendarioAplicable(personalId, fecha);

    if (!calendario || !calendario.festivos || calendario.festivos.length === 0) {
      return { esFestivo: false };
    }

    // Normalizar fecha a solo día (sin hora)
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setHours(0, 0, 0, 0);

    const festivo = calendario.festivos.find((f) => {
      const fechaFestivo = new Date(f.fecha);
      fechaFestivo.setHours(0, 0, 0, 0);
      return fechaFestivo.getTime() === fechaNormalizada.getTime();
    });

    if (festivo) {
      return { esFestivo: true, festivo };
    }

    return { esFestivo: false };
  }

  /**
   * Obtener tolerancia de retraso para un empleado
   * Orden: Personal > Departamento > Default (5 min)
   */
  async obtenerToleranciaRetraso(personalId: string): Promise<number> {
    const Personal = await getPersonalModel(this.empresaId.toString(), this.dbConfig);
    const Departamento = await getModeloDepartamento(this.empresaId, this.dbConfig);

    const personal = await Personal.findById(personalId);

    // Tolerancia del empleado
    if (personal?.datosLaborales?.toleranciaRetrasoMinutos !== undefined) {
      return personal.datosLaborales.toleranciaRetrasoMinutos;
    }

    // Tolerancia del departamento
    if (personal?.datosLaborales?.departamentoId) {
      const departamento = await Departamento.findById(personal.datosLaborales.departamentoId);
      if (departamento?.toleranciaRetrasoMinutos !== undefined) {
        return departamento.toleranciaRetrasoMinutos;
      }
    }

    // Default
    return 5;
  }

  /**
   * Calcular minutos de retraso respecto a hora teórica
   * Retorna 0 si no hay retraso, positivo si hay retraso
   */
  calcularRetraso(
    horaReal: Date,
    horaTeorica: string,
    toleranciaMinutos: number
  ): number {
    const [horaT, minutoT] = horaTeorica.split(':').map(Number);
    const fechaTeorica = new Date(horaReal);
    fechaTeorica.setHours(horaT, minutoT, 0, 0);

    // Añadir tolerancia
    fechaTeorica.setMinutes(fechaTeorica.getMinutes() + toleranciaMinutos);

    const diffMs = horaReal.getTime() - fechaTeorica.getTime();
    const diffMinutos = Math.round(diffMs / (1000 * 60));

    return diffMinutos > 0 ? diffMinutos : 0;
  }

  /**
   * Calcular minutos de anticipación en la salida
   * Retorna 0 si no hay anticipación, positivo si salió antes
   */
  calcularAnticipacion(
    horaReal: Date,
    horaTeorica: string
  ): number {
    const [horaT, minutoT] = horaTeorica.split(':').map(Number);
    const fechaTeorica = new Date(horaReal);
    fechaTeorica.setHours(horaT, minutoT, 0, 0);

    const diffMs = fechaTeorica.getTime() - horaReal.getTime();
    const diffMinutos = Math.round(diffMs / (1000 * 60));

    return diffMinutos > 0 ? diffMinutos : 0;
  }

  /**
   * Calcular horas extra
   * Si es festivo, todas las horas trabajadas son extra
   * Si no, horas extra = trabajadas - teóricas (si es positivo)
   */
  calcularHorasExtra(
    horasTrabajadas: number,
    horasTeoricas: number,
    esFestivo: boolean
  ): number {
    if (esFestivo) {
      // Festivo: 100% de las horas son extras
      return horasTrabajadas;
    }

    // Normal: solo el exceso sobre las teóricas
    const diferencia = horasTrabajadas - horasTeoricas;
    return diferencia > 0 ? Math.round(diferencia * 100) / 100 : 0;
  }

  /**
   * Verificar si el día es laboral según el turno
   */
  esDiaLaboral(turno: ITurno, fecha: Date): boolean {
    const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ...
    return turno.diasSemana.includes(diaSemana);
  }

  /**
   * Validación completa de un fichaje
   */
  async validarFichaje(
    personalId: string,
    fecha: Date,
    horaEntrada?: Date,
    horaSalida?: Date,
    horasTrabajadas?: number
  ): Promise<ValidacionResult> {
    const result: ValidacionResult = {
      valido: true,
      horasTeoricas: 0,
      minutosRetraso: 0,
      minutosAnticipacion: 0,
      esFestivoTrabajado: false,
      horasExtra: 0,
    };

    // 1. Obtener turno aplicable
    const { turno, origen } = await this.obtenerTurnoAplicable(personalId, fecha);
    if (!turno) {
      result.observaciones = 'Sin turno asignado';
      return result;
    }

    // 2. Verificar si es festivo
    const festivoInfo = await this.esFestivoParaEmpleado(personalId, fecha);
    if (festivoInfo.esFestivo && festivoInfo.festivo) {
      result.esFestivoTrabajado = true;
      result.festivoNombre = festivoInfo.festivo.nombre;
      result.incidenciaTipo = 'festivo';
    }

    // 3. Horas teóricas del turno (0 si es festivo o no es día laboral)
    const esDiaLaboral = this.esDiaLaboral(turno, fecha);
    if (festivoInfo.esFestivo || !esDiaLaboral) {
      result.horasTeoricas = 0;
    } else {
      result.horasTeoricas = turno.horasTeoricas;
    }

    // 4. Calcular retraso si hay hora de entrada
    if (horaEntrada && !festivoInfo.esFestivo && esDiaLaboral) {
      const tolerancia = await this.obtenerToleranciaRetraso(personalId);
      result.minutosRetraso = this.calcularRetraso(horaEntrada, turno.horaEntrada, tolerancia);

      if (result.minutosRetraso > 0) {
        result.incidenciaTipo = 'retraso';
      }
    }

    // 5. Calcular anticipación en salida
    if (horaSalida && !festivoInfo.esFestivo && esDiaLaboral) {
      result.minutosAnticipacion = this.calcularAnticipacion(horaSalida, turno.horaSalida);

      if (result.minutosAnticipacion > 0 && !result.incidenciaTipo) {
        result.incidenciaTipo = 'salida_anticipada';
      }
    }

    // 6. Calcular horas extra
    if (horasTrabajadas !== undefined && horasTrabajadas > 0) {
      result.horasExtra = this.calcularHorasExtra(
        horasTrabajadas,
        result.horasTeoricas,
        result.esFestivoTrabajado
      );
    }

    // 7. Marcar como validado
    result.valido = true;

    return result;
  }

  /**
   * Calcular estadísticas de un período para un empleado
   */
  async calcularEstadisticasPeriodo(
    personalId: string,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<{
    diasLaborables: number;
    festivosEnPeriodo: number;
    horasTeoricas: number;
  }> {
    let diasLaborables = 0;
    let festivosEnPeriodo = 0;
    let horasTeoricas = 0;

    const fechaActual = new Date(fechaInicio);
    fechaActual.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    while (fechaActual <= fin) {
      const { turno } = await this.obtenerTurnoAplicable(personalId, fechaActual);
      const festivoInfo = await this.esFestivoParaEmpleado(personalId, fechaActual);

      if (festivoInfo.esFestivo) {
        festivosEnPeriodo++;
      } else if (turno && this.esDiaLaboral(turno, fechaActual)) {
        diasLaborables++;
        horasTeoricas += turno.horasTeoricas;
      }

      // Siguiente día
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return {
      diasLaborables,
      festivosEnPeriodo,
      horasTeoricas: Math.round(horasTeoricas * 100) / 100,
    };
  }
}
