import mongoose, { Model } from 'mongoose';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { databaseManager } from '@/services/database-manager.service';
import {
  RestooConnectionSchema,
  RestooSyncLogSchema,
  RestooMapeoSalonSchema,
  IRestooConnection,
  IRestooSyncLog,
  IRestooMapeoSalon,
  TipoSyncRestoo,
  DireccionSyncRestoo,
  EstadoSyncRestoo,
} from './RestooConnection';
import { RestooConnector, RestooReservation } from './restoo.connector';
import { getReservaModel, getClienteModel, getSalonModel, getMesaModel } from '@/utils/dynamic-models.helper';
import { EstadoReserva } from '@/modules/reservas/Reserva';

export class RestooService {
  // ============================================
  // MODELOS DINAMICOS
  // ============================================

  private async getConnectionModel(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IRestooConnection>> {
    return databaseManager.getModel<IRestooConnection>(
      empresaId,
      dbConfig,
      'RestooConnection',
      RestooConnectionSchema
    );
  }

  private async getSyncLogModel(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IRestooSyncLog>> {
    return databaseManager.getModel<IRestooSyncLog>(
      empresaId,
      dbConfig,
      'RestooSyncLog',
      RestooSyncLogSchema
    );
  }

  private async getMapeoSalonModel(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IRestooMapeoSalon>> {
    return databaseManager.getModel<IRestooMapeoSalon>(
      empresaId,
      dbConfig,
      'RestooMapeoSalon',
      RestooMapeoSalonSchema
    );
  }

  /**
   * Crear instancia del conector Restoo a partir de una conexión
   */
  private createConnector(conexion: IRestooConnection): RestooConnector {
    return new RestooConnector(
      conexion.apiUrl,
      conexion.apiKey,
      conexion.restauranteIdRestoo,
      conexion.apiSecret
    );
  }

  // ============================================
  // CRUD CONEXIONES
  // ============================================

  async crearConexion(data: any, empresaId: string, dbConfig: IDatabaseConfig) {
    const ConnectionModel = await this.getConnectionModel(empresaId, dbConfig);
    const conexion = new ConnectionModel({
      ...data,
      empresaId,
    });
    return conexion.save();
  }

  async obtenerConexiones(empresaId: string, dbConfig: IDatabaseConfig) {
    const ConnectionModel = await this.getConnectionModel(empresaId, dbConfig);
    return ConnectionModel.find({ empresaId }).sort({ createdAt: -1 });
  }

  async obtenerConexion(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ConnectionModel = await this.getConnectionModel(empresaId, dbConfig);
    return ConnectionModel.findById(id);
  }

  async actualizarConexion(id: string, data: any, empresaId: string, dbConfig: IDatabaseConfig) {
    const ConnectionModel = await this.getConnectionModel(empresaId, dbConfig);
    return ConnectionModel.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async eliminarConexion(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ConnectionModel = await this.getConnectionModel(empresaId, dbConfig);
    // Eliminar también mapeos y logs asociados
    const MapeoModel = await this.getMapeoSalonModel(empresaId, dbConfig);
    const LogModel = await this.getSyncLogModel(empresaId, dbConfig);
    await MapeoModel.deleteMany({ conexionId: id });
    await LogModel.deleteMany({ conexionId: id });
    return ConnectionModel.findByIdAndDelete(id);
  }

  // ============================================
  // TEST CONEXION
  // ============================================

  async testConexion(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const conexion = await this.obtenerConexion(id, empresaId, dbConfig);
    if (!conexion) throw new Error('Conexion no encontrada');

    const connector = this.createConnector(conexion);
    return connector.testConnection();
  }

  // ============================================
  // SINCRONIZACIÓN DE RESERVAS
  // ============================================

  async sincronizarReservas(conexionId: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ConnectionModel = await this.getConnectionModel(empresaId, dbConfig);
    const LogModel = await this.getSyncLogModel(empresaId, dbConfig);
    const ReservaModel = await getReservaModel(empresaId, dbConfig);
    const ClienteModel = await getClienteModel(empresaId, dbConfig);
    const MapeoModel = await this.getMapeoSalonModel(empresaId, dbConfig);

    const conexion = await ConnectionModel.findById(conexionId);
    if (!conexion) throw new Error('Conexion no encontrada');

    const connector = this.createConnector(conexion);

    // Crear log de sincronización
    const log = new LogModel({
      conexionId,
      tipo: TipoSyncRestoo.RESERVAS,
      direccion: DireccionSyncRestoo.PULL,
      estado: EstadoSyncRestoo.EXITO,
      fechaInicio: new Date(),
      resultados: { total: 0, exitosos: 0, fallidos: 0, omitidos: 0 },
      detalles: [],
      empresaId,
    });

    try {
      // Obtener reservas desde Restoo (desde la última sync)
      const reservations = await connector.getReservations(conexion.ultimaSync || undefined);
      log.resultados.total = reservations.length;

      // Obtener mapeos de salones para asignar correctamente
      const mapeos = await MapeoModel.find({ conexionId }).lean();

      for (const restooRes of reservations) {
        try {
          await this.procesarReserva(
            restooRes,
            ReservaModel,
            ClienteModel,
            conexion,
            mapeos
          );
          log.resultados.exitosos++;
          log.detalles.push({
            reservaId: restooRes.id,
            accion: 'sync',
            resultado: 'exito',
          } as any);
        } catch (error: any) {
          log.resultados.fallidos++;
          log.detalles.push({
            reservaId: restooRes.id,
            accion: 'sync',
            resultado: 'error',
            mensaje: error.message,
          } as any);
        }
      }

      // Determinar estado del log
      if (log.resultados.fallidos > 0 && log.resultados.exitosos > 0) {
        log.estado = EstadoSyncRestoo.PARCIAL;
      } else if (log.resultados.fallidos > 0 && log.resultados.exitosos === 0) {
        log.estado = EstadoSyncRestoo.ERROR;
      }

      // Actualizar estadísticas de la conexión
      await ConnectionModel.findByIdAndUpdate(conexionId, {
        $set: { ultimaSync: new Date() },
        $inc: { 'estadisticas.reservasSincronizadas': log.resultados.exitosos },
      });
    } catch (error: any) {
      log.estado = EstadoSyncRestoo.ERROR;
      await ConnectionModel.findByIdAndUpdate(conexionId, {
        $set: {
          'estadisticas.ultimoError': error.message,
          'estadisticas.ultimoErrorFecha': new Date(),
        },
      });
    }

    log.fechaFin = new Date();
    await log.save();
    return log;
  }

  /**
   * Procesar una reserva individual de Restoo
   */
  private async procesarReserva(
    restooRes: RestooReservation,
    ReservaModel: Model<any>,
    ClienteModel: Model<any>,
    conexion: IRestooConnection,
    mapeos: IRestooMapeoSalon[]
  ) {
    // Buscar si ya existe la reserva por restooReservaId
    const existente = await ReservaModel.findOne({ restooReservaId: restooRes.id });

    // Mapear estado de Restoo a estado local
    const estadoLocal = this.mapearEstadoRestoo(restooRes.status);

    // Mapear zona/mesa de Restoo a salón/mesa local
    const { salonId, mesasIds } = this.mapearSalonMesa(restooRes, mapeos, conexion);

    // Buscar/crear cliente si está configurado
    let clienteId: mongoose.Types.ObjectId | undefined;
    if (conexion.configuracion.crearClientesSiNoExisten && restooRes.customer) {
      clienteId = await this.buscarOCrearCliente(
        restooRes.customer,
        ClienteModel
      );
    }

    if (existente) {
      // Actualizar reserva existente si cambió
      const updates: any = {};
      if (existente.estado !== estadoLocal) updates.estado = estadoLocal;
      if (restooRes.guests !== existente.comensales) updates.comensales = restooRes.guests;
      if (restooRes.notes && restooRes.notes !== existente.notas) updates.notas = restooRes.notes;
      if (restooRes.specialRequests && restooRes.specialRequests !== existente.peticionesEspeciales) {
        updates.peticionesEspeciales = restooRes.specialRequests;
      }

      if (Object.keys(updates).length > 0) {
        await ReservaModel.findByIdAndUpdate(existente._id, { $set: updates });
      }
    } else {
      // Crear nueva reserva
      const nuevaReserva = new ReservaModel({
        clienteId,
        clienteNombre: restooRes.customer?.name || 'Sin nombre',
        clienteTelefono: restooRes.customer?.phone || '',
        clienteEmail: restooRes.customer?.email,
        fecha: new Date(restooRes.date),
        horaInicio: restooRes.time,
        duracionMinutos: restooRes.duration || 90,
        comensales: restooRes.guests,
        salonId,
        mesasIds: mesasIds || [],
        estado: estadoLocal,
        origen: 'restoo',
        notas: restooRes.notes,
        peticionesEspeciales: restooRes.specialRequests,
        restooReservaId: restooRes.id,
      });
      await nuevaReserva.save();
    }
  }

  /**
   * Mapear estado de Restoo a EstadoReserva local
   */
  private mapearEstadoRestoo(status: string): EstadoReserva {
    const mapa: Record<string, EstadoReserva> = {
      'pending': EstadoReserva.PENDIENTE,
      'confirmed': EstadoReserva.CONFIRMADA,
      'cancelled': EstadoReserva.CANCELADA,
      'no_show': EstadoReserva.NO_SHOW,
      'completed': EstadoReserva.COMPLETADA,
      'in_progress': EstadoReserva.EN_CURSO,
    };
    return mapa[status] || EstadoReserva.PENDIENTE;
  }

  /**
   * Mapear zona/mesa de Restoo a salón/mesa local usando mapeo configurado
   */
  private mapearSalonMesa(
    restooRes: RestooReservation,
    mapeos: IRestooMapeoSalon[],
    conexion: IRestooConnection
  ): { salonId?: mongoose.Types.ObjectId; mesasIds?: mongoose.Types.ObjectId[] } {
    if (!restooRes.zoneId && !restooRes.tableId) {
      // Sin zona ni mesa, usar salón por defecto
      return {
        salonId: conexion.configuracion.salonPorDefecto || undefined,
      };
    }

    // Buscar mapeo de zona
    const mapeoZona = mapeos.find(m => m.zonaIdRestoo === restooRes.zoneId);
    if (!mapeoZona) {
      return {
        salonId: conexion.configuracion.salonPorDefecto || undefined,
      };
    }

    const result: { salonId?: mongoose.Types.ObjectId; mesasIds?: mongoose.Types.ObjectId[] } = {
      salonId: mapeoZona.salonIdLocal,
    };

    // Buscar mapeo de mesa
    if (restooRes.tableId && mapeoZona.mesasMapeo?.length) {
      const mapeoMesa = mapeoZona.mesasMapeo.find(m => m.mesaIdRestoo === restooRes.tableId);
      if (mapeoMesa) {
        result.mesasIds = [mapeoMesa.mesaIdLocal];
      }
    }

    return result;
  }

  /**
   * Buscar cliente por teléfono/email o crear uno nuevo
   */
  private async buscarOCrearCliente(
    customer: { name: string; phone: string; email?: string },
    ClienteModel: Model<any>
  ): Promise<mongoose.Types.ObjectId | undefined> {
    try {
      // Buscar por teléfono primero
      let cliente = await ClienteModel.findOne({
        $or: [
          ...(customer.phone ? [{ telefono: customer.phone }] : []),
          ...(customer.email ? [{ email: customer.email }] : []),
        ],
      });

      if (cliente) return cliente._id;

      // Crear nuevo cliente
      const nuevo = new ClienteModel({
        nombre: customer.name,
        telefono: customer.phone || '',
        email: customer.email,
        tipo: 'particular',
        origenAlta: 'restoo',
      });
      const saved = await nuevo.save();
      return saved._id;
    } catch {
      return undefined;
    }
  }

  // ============================================
  // SINCRONIZACIÓN DE DISPONIBILIDAD
  // ============================================

  async sincronizarDisponibilidad(conexionId: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ConnectionModel = await this.getConnectionModel(empresaId, dbConfig);
    const LogModel = await this.getSyncLogModel(empresaId, dbConfig);
    const MapeoModel = await this.getMapeoSalonModel(empresaId, dbConfig);
    const MesaModel = await getMesaModel(empresaId, dbConfig);

    const conexion = await ConnectionModel.findById(conexionId);
    if (!conexion) throw new Error('Conexion no encontrada');

    const connector = this.createConnector(conexion);

    const log = new LogModel({
      conexionId,
      tipo: TipoSyncRestoo.DISPONIBILIDAD,
      direccion: DireccionSyncRestoo.PUSH,
      estado: EstadoSyncRestoo.EXITO,
      fechaInicio: new Date(),
      resultados: { total: 0, exitosos: 0, fallidos: 0, omitidos: 0 },
      detalles: [],
      empresaId,
    });

    try {
      const mapeos = await MapeoModel.find({ conexionId }).lean();
      if (mapeos.length === 0) {
        log.estado = EstadoSyncRestoo.ERROR;
        log.detalles.push({
          accion: 'push-disponibilidad',
          resultado: 'error',
          mensaje: 'No hay mapeos de salones configurados',
        } as any);
      } else {
        // Construir datos de disponibilidad
        const availability: any[] = [];
        for (const mapeo of mapeos) {
          for (const mesaMapeo of mapeo.mesasMapeo) {
            const mesa = await MesaModel.findById(mesaMapeo.mesaIdLocal).lean() as any;
            if (mesa) {
              availability.push({
                zoneId: mapeo.zonaIdRestoo,
                tableId: mesaMapeo.mesaIdRestoo,
                available: mesa.estado === 'libre' || mesa.estado === 'disponible',
                seats: mesa.capacidad || mesa.comensales || 4,
              });
              log.resultados.total++;
            }
          }
        }

        const success = await connector.pushTableAvailability({
          restaurantId: conexion.restauranteIdRestoo,
          tables: availability,
        });

        if (success) {
          log.resultados.exitosos = log.resultados.total;
        } else {
          log.estado = EstadoSyncRestoo.ERROR;
          log.resultados.fallidos = log.resultados.total;
        }
      }
    } catch (error: any) {
      log.estado = EstadoSyncRestoo.ERROR;
      await ConnectionModel.findByIdAndUpdate(conexionId, {
        $set: {
          'estadisticas.ultimoError': error.message,
          'estadisticas.ultimoErrorFecha': new Date(),
        },
      });
    }

    log.fechaFin = new Date();
    await log.save();
    return log;
  }

  // ============================================
  // MAPEO DE SALONES
  // ============================================

  async obtenerSalonesRestoo(conexionId: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const conexion = await this.obtenerConexion(conexionId, empresaId, dbConfig);
    if (!conexion) throw new Error('Conexion no encontrada');

    const connector = this.createConnector(conexion);
    return connector.getZones();
  }

  async guardarMapeoSalones(
    conexionId: string,
    mapeos: Array<{
      salonIdLocal: string;
      zonaIdRestoo: string;
      nombreRestoo: string;
      mesasMapeo?: Array<{ mesaIdLocal: string; mesaIdRestoo: string }>;
    }>,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ) {
    const MapeoModel = await this.getMapeoSalonModel(empresaId, dbConfig);

    // Eliminar mapeos anteriores de esta conexión
    await MapeoModel.deleteMany({ conexionId });

    // Crear nuevos mapeos
    const nuevosMapeos = mapeos.map(m => new MapeoModel({
      conexionId,
      salonIdLocal: m.salonIdLocal,
      zonaIdRestoo: m.zonaIdRestoo,
      nombreRestoo: m.nombreRestoo,
      mesasMapeo: m.mesasMapeo || [],
      empresaId,
    }));

    return Promise.all(nuevosMapeos.map(m => m.save()));
  }

  async obtenerMapeoSalones(conexionId: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const MapeoModel = await this.getMapeoSalonModel(empresaId, dbConfig);
    return MapeoModel.find({ conexionId }).lean();
  }

  // ============================================
  // LOGS
  // ============================================

  async obtenerLogs(
    conexionId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    page = 1,
    limit = 20
  ) {
    const LogModel = await this.getSyncLogModel(empresaId, dbConfig);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      LogModel.find({ conexionId })
        .sort({ fechaInicio: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LogModel.countDocuments({ conexionId }),
    ]);

    return { logs, total, page, limit };
  }
}

export const restooService = new RestooService();
