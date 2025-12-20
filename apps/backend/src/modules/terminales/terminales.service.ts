import mongoose from 'mongoose';
import { IDatabaseConfig } from '@/models/Empresa';
import { getModeloTerminal, ITerminal, IHistorialSync } from './Terminal';
import { getPersonalModel } from '@/utils/dynamic-models.helper';
import { getModeloFichaje } from '../fichajes/Fichaje';
import { getModeloDepartamento } from '../departamentos/Departamento';
import {
  CreateTerminalDto,
  UpdateTerminalDto,
  TerminalQueryDto,
  SincronizarEmpleadosDto,
  SincronizarAsistenciaDto,
  PUERTOS_DEFAULT,
} from './terminales.dto';
import { createTerminalDriver, ITerminalDriver, DeviceInfo } from './drivers';
import { logger } from '@/config/logger';

// ============================================
// SERVICIO DE TERMINALES
// ============================================

export class TerminalesService {
  private empresaId: mongoose.Types.ObjectId;
  private dbConfig: IDatabaseConfig;
  private _terminal: mongoose.Model<ITerminal> | null = null;

  constructor(empresaId: mongoose.Types.ObjectId, dbConfig: IDatabaseConfig) {
    this.empresaId = empresaId;
    this.dbConfig = dbConfig;
  }

  private async getTerminalModel(): Promise<mongoose.Model<ITerminal>> {
    if (!this._terminal) {
      this._terminal = await getModeloTerminal(this.empresaId, this.dbConfig);
    }
    return this._terminal;
  }

  // ============================================
  // CRUD BÁSICO
  // ============================================

  async getAll(query: TerminalQueryDto) {
    const Terminal = await this.getTerminalModel();

    const {
      search,
      marca,
      estado,
      activo,
      page = 1,
      limit = 25,
      sortBy = 'nombre',
      sortOrder = 'asc',
    } = query;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { nombre: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } },
      ];
    }

    if (marca) filter.marca = marca;
    if (estado) filter.estado = estado;
    if (activo !== undefined) filter.activo = activo;

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [terminales, total] = await Promise.all([
      Terminal.find(filter)
        .select('-historialSync')  // Excluir historial para lista
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Terminal.countDocuments(filter),
    ]);

    return {
      data: terminales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getActivos() {
    const Terminal = await this.getTerminalModel();
    return Terminal.find({ activo: true, estado: { $ne: 'inactivo' } })
      .select('-historialSync')
      .sort({ orden: 1, nombre: 1 });
  }

  async getById(id: string) {
    const Terminal = await this.getTerminalModel();
    return Terminal.findById(id);
  }

  async sugerirCodigo(prefijo: string = 'TRM') {
    const Terminal = await this.getTerminalModel();

    const regex = new RegExp(`^${prefijo}\\d+$`, 'i');
    const ultimo = await Terminal.findOne({ codigo: regex })
      .sort({ codigo: -1 })
      .select('codigo');

    if (!ultimo) {
      return `${prefijo}001`;
    }

    const numActual = parseInt(ultimo.codigo.replace(prefijo, ''), 10);
    const numNuevo = (numActual + 1).toString().padStart(3, '0');
    return `${prefijo}${numNuevo}`;
  }

  async create(data: CreateTerminalDto, usuarioId: mongoose.Types.ObjectId) {
    const Terminal = await this.getTerminalModel();

    // Generar código si no se proporciona
    if (!data.codigo) {
      data.codigo = await this.sugerirCodigo('TRM');
    }

    // Asignar puerto por defecto según marca
    if (!data.puerto && data.marca) {
      data.puerto = PUERTOS_DEFAULT[data.marca] || 4370;
    }

    const terminal = new Terminal({
      ...data,
      configuracion: data.configuracion || {},
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    });

    return terminal.save();
  }

  async update(id: string, data: UpdateTerminalDto, usuarioId: mongoose.Types.ObjectId) {
    const Terminal = await this.getTerminalModel();
    return Terminal.findByIdAndUpdate(
      id,
      {
        ...data,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );
  }

  async delete(id: string) {
    const Terminal = await this.getTerminalModel();
    return Terminal.findByIdAndUpdate(id, { activo: false }, { new: true });
  }

  async deletePermanente(id: string) {
    const Terminal = await this.getTerminalModel();
    return Terminal.findByIdAndDelete(id);
  }

  // ============================================
  // CONEXIÓN Y PRUEBAS
  // ============================================

  async probarConexion(id: string): Promise<{ success: boolean; info?: DeviceInfo; error?: string }> {
    const Terminal = await this.getTerminalModel();
    const terminal = await Terminal.findById(id);

    if (!terminal) {
      return { success: false, error: 'Terminal no encontrado' };
    }

    let driver: ITerminalDriver | null = null;

    try {
      driver = createTerminalDriver(terminal.marca, {
        ip: terminal.ip,
        port: terminal.puerto,
        timeout: 10000,
      });

      await driver.connect();
      const info = await driver.getDeviceInfo();

      // Actualizar estado y última conexión
      terminal.estadoConexion = 'conectado';
      terminal.ultimaConexion = new Date();
      terminal.ultimoError = undefined;
      if (info.serialNumber) terminal.numeroSerie = info.serialNumber;
      if (info.firmware) terminal.firmware = info.firmware;
      await terminal.save();

      return { success: true, info };
    } catch (error: any) {
      // Actualizar estado de error
      terminal.estadoConexion = 'desconectado';
      terminal.ultimoError = error.message;
      await terminal.save();

      return { success: false, error: error.message };
    } finally {
      if (driver) {
        await driver.disconnect();
      }
    }
  }

  // ============================================
  // SINCRONIZACIÓN DE EMPLEADOS
  // ============================================

  async sincronizarEmpleados(
    terminalId: string,
    data: SincronizarEmpleadosDto,
    usuarioId: mongoose.Types.ObjectId
  ) {
    const Terminal = await this.getTerminalModel();
    const terminal = await Terminal.findById(terminalId);

    if (!terminal) {
      throw new Error('Terminal no encontrado');
    }

    const inicio = Date.now();
    let driver: ITerminalDriver | null = null;
    const resultado: IHistorialSync = {
      fecha: new Date(),
      tipo: 'empleados',
      direccion: 'carga',
      estado: 'exitoso',
      registrosProcesados: 0,
      registrosNuevos: 0,
      registrosError: 0,
      duracionMs: 0,
    };

    try {
      driver = createTerminalDriver(terminal.marca, {
        ip: terminal.ip,
        port: terminal.puerto,
        timeout: 30000,
      });

      await driver.connect();

      // Obtener personal a sincronizar
      const Personal = await getPersonalModel(this.empresaId.toString(), this.dbConfig);
      let filtro: any = { activo: true };

      if (data.personalIds && data.personalIds.length > 0) {
        filtro._id = { $in: data.personalIds.map(id => new mongoose.Types.ObjectId(id)) };
      }

      if (data.soloConFoto) {
        filtro.foto = { $exists: true, $ne: '' };
      }

      const empleados = await Personal.find(filtro).select('_id codigo nombre apellidos foto datosLaborales');

      // Obtener empleados actuales en el terminal
      const empleadosEnTerminal = await driver.getEmployees();
      const idsEnTerminal = new Set(empleadosEnTerminal.map(e => e.id));

      // Mapeo de personal a código de terminal
      const empleadosSincronizados = terminal.empleadosSincronizados || [];
      const mapeoExistente = new Map(
        empleadosSincronizados.map(e => [e.personalId.toString(), e])
      );

      // Determinar próximo ID disponible en el terminal
      let proximoId = Math.max(0, ...empleadosEnTerminal.map(e => e.id)) + 1;

      for (const emp of empleados) {
        try {
          let codigoTerminal: number;
          const existente = mapeoExistente.get(emp._id.toString());

          if (existente) {
            codigoTerminal = existente.codigoTerminal;
          } else {
            codigoTerminal = proximoId++;
          }

          // Enviar al terminal
          await driver.setEmployee({
            id: codigoTerminal,
            name: `${emp.nombre} ${emp.apellidos}`.substring(0, 24),
            privilege: 0,
          });

          // Actualizar mapeo
          if (!existente) {
            empleadosSincronizados.push({
              personalId: emp._id,
              codigoTerminal,
              sincronizadoEn: new Date(),
              conFoto: !!emp.foto,
            });
            resultado.registrosNuevos++;
          } else {
            existente.sincronizadoEn = new Date();
          }

          resultado.registrosProcesados++;
        } catch (error: any) {
          logger.error(`Error sincronizando empleado ${emp._id}: ${error.message}`);
          resultado.registrosError++;
        }
      }

      // Eliminar empleados que ya no están activos si se solicita
      if (data.eliminarNoIncluidos) {
        const idsASincronizar = new Set(empleados.map(e => e._id.toString()));
        const aEliminar = empleadosSincronizados.filter(
          e => !idsASincronizar.has(e.personalId.toString())
        );

        for (const emp of aEliminar) {
          try {
            await driver.deleteEmployee(emp.codigoTerminal);
            const idx = empleadosSincronizados.findIndex(
              e => e.personalId.toString() === emp.personalId.toString()
            );
            if (idx >= 0) {
              empleadosSincronizados.splice(idx, 1);
            }
          } catch (error: any) {
            logger.error(`Error eliminando empleado del terminal: ${error.message}`);
          }
        }
      }

      // Actualizar terminal
      terminal.empleadosSincronizados = empleadosSincronizados;
      terminal.ultimaSincronizacion = new Date();
      terminal.estadoConexion = 'conectado';

      resultado.duracionMs = Date.now() - inicio;
      resultado.estado = resultado.registrosError > 0 ? 'parcial' : 'exitoso';
      terminal.historialSync.push(resultado);

      await terminal.save();

      return resultado;
    } catch (error: any) {
      resultado.estado = 'error';
      resultado.error = error.message;
      resultado.duracionMs = Date.now() - inicio;

      terminal.ultimoError = error.message;
      terminal.historialSync.push(resultado);
      await terminal.save();

      throw error;
    } finally {
      if (driver) {
        await driver.disconnect();
      }
    }
  }

  // ============================================
  // SINCRONIZACIÓN DE ASISTENCIAS/FICHAJES
  // ============================================

  async sincronizarAsistencia(
    terminalId: string,
    data: SincronizarAsistenciaDto,
    usuarioId: mongoose.Types.ObjectId
  ) {
    const Terminal = await this.getTerminalModel();
    const terminal = await Terminal.findById(terminalId);

    if (!terminal) {
      throw new Error('Terminal no encontrado');
    }

    const inicio = Date.now();
    let driver: ITerminalDriver | null = null;
    const resultado: IHistorialSync = {
      fecha: new Date(),
      tipo: 'asistencia',
      direccion: 'descarga',
      estado: 'exitoso',
      registrosProcesados: 0,
      registrosNuevos: 0,
      registrosError: 0,
      duracionMs: 0,
    };

    try {
      driver = createTerminalDriver(terminal.marca, {
        ip: terminal.ip,
        port: terminal.puerto,
        timeout: 60000,
      });

      await driver.connect();

      // Obtener asistencias del terminal
      const desde = data.desde ? new Date(data.desde) : terminal.ultimaSincronizacion;
      let asistencias = desde
        ? await driver.getAttendancesSince(desde)
        : await driver.getAttendances();

      if (data.hasta) {
        const hasta = new Date(data.hasta);
        asistencias = asistencias.filter(a => a.timestamp <= hasta);
      }

      resultado.registrosProcesados = asistencias.length;

      // Crear mapeo de código terminal -> personalId
      const mapeoEmpleados = new Map(
        terminal.empleadosSincronizados.map(e => [e.codigoTerminal, e.personalId])
      );

      // Obtener modelos
      const Fichaje = await getModeloFichaje(this.empresaId, this.dbConfig);
      const Personal = await getPersonalModel(this.empresaId.toString(), this.dbConfig);
      const Departamento = await getModeloDepartamento(this.empresaId, this.dbConfig);

      for (const asistencia of asistencias) {
        try {
          const personalId = mapeoEmpleados.get(asistencia.id);

          if (!personalId) {
            logger.warn(`Empleado con código terminal ${asistencia.id} no encontrado en mapeo`);
            resultado.registrosError++;
            continue;
          }

          // Verificar si ya existe este fichaje
          const fechaFichaje = new Date(asistencia.timestamp);
          fechaFichaje.setSeconds(0, 0);

          const fichajeExistente = await Fichaje.findOne({
            personalId,
            $or: [
              {
                horaEntrada: {
                  $gte: new Date(fechaFichaje.getTime() - 60000),
                  $lte: new Date(fechaFichaje.getTime() + 60000),
                },
              },
              {
                horaSalida: {
                  $gte: new Date(fechaFichaje.getTime() - 60000),
                  $lte: new Date(fechaFichaje.getTime() + 60000),
                },
              },
            ],
          });

          if (fichajeExistente) {
            // Ya existe, saltar
            continue;
          }

          // Obtener datos del personal
          const personal = await Personal.findById(personalId);
          if (!personal) {
            resultado.registrosError++;
            continue;
          }

          // Obtener departamento si existe
          let departamentoNombre: string | undefined;
          const departamentoId = personal.datosLaborales?.departamentoId;
          if (departamentoId) {
            const depto = await Departamento.findById(departamentoId);
            if (depto) departamentoNombre = depto.nombre;
          }

          // Determinar si es entrada o salida
          // state 0 = check-in, state 1 = check-out (puede variar según terminal)
          const esEntrada = asistencia.state === 0 || asistencia.state === undefined;

          // Buscar fichaje abierto del día
          const inicioDia = new Date(asistencia.timestamp);
          inicioDia.setHours(0, 0, 0, 0);

          const fichajeAbierto = await Fichaje.findOne({
            personalId,
            fecha: { $gte: inicioDia },
            estado: 'abierto',
          });

          if (esEntrada && !fichajeAbierto) {
            // Crear nuevo fichaje de entrada
            await Fichaje.create({
              personalId,
              personalNombre: `${personal.nombre} ${personal.apellidos}`,
              personalCodigo: personal.codigo,
              departamentoId,
              departamentoNombre,
              fecha: inicioDia,
              horaEntrada: asistencia.timestamp,
              tipo: 'normal',
              estado: 'abierto',
              ubicacionEntrada: `terminal:${terminal.codigo}`,
              creadoPor: usuarioId,
            });
            resultado.registrosNuevos++;
          } else if (!esEntrada && fichajeAbierto) {
            // Registrar salida
            fichajeAbierto.horaSalida = asistencia.timestamp;
            fichajeAbierto.ubicacionSalida = `terminal:${terminal.codigo}`;
            fichajeAbierto.estado = 'cerrado';

            // Calcular horas
            if (fichajeAbierto.horaEntrada) {
              let minutos = (asistencia.timestamp.getTime() - fichajeAbierto.horaEntrada.getTime()) / (1000 * 60);
              if (fichajeAbierto.pausaInicio && fichajeAbierto.pausaFin) {
                const pausaMinutos = (fichajeAbierto.pausaFin.getTime() - fichajeAbierto.pausaInicio.getTime()) / (1000 * 60);
                minutos -= pausaMinutos;
              }
              fichajeAbierto.horasTrabajadas = Math.max(0, Math.round(minutos / 60 * 100) / 100);
            }

            await fichajeAbierto.save();
            resultado.registrosNuevos++;
          } else if (esEntrada && fichajeAbierto) {
            // Ya hay un fichaje abierto, ignorar
            logger.info(`Ignorando entrada duplicada para ${personal.codigo}`);
          } else {
            // Es salida pero no hay fichaje abierto, crear fichaje completo
            await Fichaje.create({
              personalId,
              personalNombre: `${personal.nombre} ${personal.apellidos}`,
              personalCodigo: personal.codigo,
              departamentoId,
              departamentoNombre,
              fecha: inicioDia,
              horaSalida: asistencia.timestamp,
              tipo: 'normal',
              estado: 'cerrado',
              ubicacionSalida: `terminal:${terminal.codigo}`,
              observaciones: 'Fichaje solo con salida desde terminal',
              creadoPor: usuarioId,
            });
            resultado.registrosNuevos++;
          }
        } catch (error: any) {
          logger.error(`Error procesando asistencia: ${error.message}`);
          resultado.registrosError++;
        }
      }

      // Limpiar registros del terminal si se solicita
      if (data.limpiarDespues && asistencias.length > 0) {
        try {
          await driver.clearAttendances();
          resultado.detalles = 'Registros limpiados del terminal';
        } catch (error: any) {
          logger.error(`Error limpiando asistencias: ${error.message}`);
        }
      }

      // Actualizar terminal
      terminal.ultimaSincronizacion = new Date();
      terminal.estadoConexion = 'conectado';

      resultado.duracionMs = Date.now() - inicio;
      resultado.estado = resultado.registrosError > 0 ? 'parcial' : 'exitoso';
      terminal.historialSync.push(resultado);

      await terminal.save();

      return resultado;
    } catch (error: any) {
      resultado.estado = 'error';
      resultado.error = error.message;
      resultado.duracionMs = Date.now() - inicio;

      terminal.ultimoError = error.message;
      terminal.estadoConexion = 'desconectado';
      terminal.historialSync.push(resultado);
      await terminal.save();

      throw error;
    } finally {
      if (driver) {
        await driver.disconnect();
      }
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  async getHistorial(id: string, limite: number = 50) {
    const Terminal = await this.getTerminalModel();
    const terminal = await Terminal.findById(id).select('historialSync');

    if (!terminal) {
      throw new Error('Terminal no encontrado');
    }

    return terminal.historialSync.slice(-limite).reverse();
  }

  async getEmpleadosSincronizados(id: string) {
    const Terminal = await this.getTerminalModel();
    const terminal = await Terminal.findById(id).select('empleadosSincronizados');

    if (!terminal) {
      throw new Error('Terminal no encontrado');
    }

    // Poblar con datos del personal
    const Personal = await getPersonalModel(this.empresaId.toString(), this.dbConfig);
    const empleados = await Promise.all(
      terminal.empleadosSincronizados.map(async (e) => {
        const personal = await Personal.findById(e.personalId).select('codigo nombre apellidos foto');
        return {
          ...e.toObject(),
          personal: personal ? {
            _id: personal._id,
            codigo: personal.codigo,
            nombre: personal.nombre,
            apellidos: personal.apellidos,
            foto: personal.foto,
          } : null,
        };
      })
    );

    return empleados;
  }
}
