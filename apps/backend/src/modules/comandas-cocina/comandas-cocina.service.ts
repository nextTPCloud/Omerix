import { Model, Types } from 'mongoose';
import { IComandaCocina } from './ComandaCocina';
import {
  CreateComandaDTO,
  UpdateComandaDTO,
  UpdateLineaComandaDTO,
  SearchComandasDTO,
  ComandasKDSDTO,
  EstadoComanda,
} from './comandas-cocina.dto';
import { IDatabaseConfig } from '../../types/express';
import { getComandaCocinaModel } from '../../utils/dynamic-models.helper';
import { sseManager } from '../../services/sse-manager.service';

export class ComandasCocinaService {
  private async getModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IComandaCocina>> {
    return await getComandaCocinaModel(empresaId, dbConfig);
  }

  /**
   * Obtener siguiente numero de comanda del dia
   */
  async getNextNumeroComanda(empresaId: string, dbConfig: IDatabaseConfig): Promise<number> {
    const ComandaModel = await this.getModelo(empresaId, dbConfig);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ultimaComanda = await ComandaModel.findOne({
      createdAt: { $gte: hoy },
    })
      .sort({ numeroComanda: -1 })
      .select('numeroComanda')
      .lean();

    return (ultimaComanda?.numeroComanda || 0) + 1;
  }

  /**
   * Buscar comandas
   */
  async findAll(empresaId: string, filters: SearchComandasDTO, dbConfig: IDatabaseConfig) {
    const ComandaModel = await this.getModelo(empresaId, dbConfig);
    const {
      zonaPreparacionId,
      estado,
      estados,
      prioridad,
      tipoServicio,
      mesaId,
      pedidoId,
      desde,
      hasta,
      page = 1,
      limit = 50,
      sortBy = 'horaRecepcion',
      sortOrder = 'desc',
    } = filters;

    const query: any = {};

    if (zonaPreparacionId) query.zonaPreparacionId = new Types.ObjectId(zonaPreparacionId);
    if (estado) query.estado = estado;
    if (estados && estados.length > 0) query.estado = { $in: estados };
    if (prioridad) query.prioridad = prioridad;
    if (tipoServicio) query.tipoServicio = tipoServicio;
    if (mesaId) query.mesaId = new Types.ObjectId(mesaId);
    if (pedidoId) query.pedidoId = new Types.ObjectId(pedidoId);

    if (desde || hasta) {
      query.horaRecepcion = {};
      if (desde) query.horaRecepcion.$gte = new Date(desde);
      if (hasta) query.horaRecepcion.$lte = new Date(hasta);
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      ComandaModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('zonaPreparacionId', 'nombre color')
        .populate('mesaId', 'numero')
        .populate('creadoPor', 'nombre apellidos')
        .lean(),
      ComandaModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Obtener comandas para KDS (pendientes y en preparacion)
   */
  async findForKDS(empresaId: string, params: ComandasKDSDTO, dbConfig: IDatabaseConfig) {
    const ComandaModel = await this.getModelo(empresaId, dbConfig);
    const { zonaPreparacionId, estados = ['pendiente', 'en_preparacion', 'parcial'], limit = 50 } = params;

    const comandas = await ComandaModel.find({
      zonaPreparacionId: new Types.ObjectId(zonaPreparacionId),
      estado: { $in: estados },
    })
      .sort({ prioridad: -1, horaRecepcion: 1 }) // Urgentes primero, luego por hora
      .limit(limit)
      .populate('mesaId', 'numero')
      .lean();

    // Calcular tiempo transcurrido para cada comanda
    const ahora = new Date();
    const comandasConTiempo = comandas.map((c) => ({
      ...c,
      tiempoTranscurrido: Math.round((ahora.getTime() - new Date(c.horaRecepcion).getTime()) / 60000),
      estaRetrasada: c.tiempoObjetivo
        ? Math.round((ahora.getTime() - new Date(c.horaRecepcion).getTime()) / 60000) > c.tiempoObjetivo
        : false,
    }));

    return comandasConTiempo;
  }

  /**
   * Obtener una comanda por ID
   */
  async findOne(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ComandaModel = await this.getModelo(empresaId, dbConfig);
    const comanda = await ComandaModel.findById(id)
      .populate('zonaPreparacionId', 'nombre color')
      .populate('mesaId', 'numero salonId')
      .populate('pedidoId', 'codigo total')
      .populate('creadoPor', 'nombre apellidos')
      .populate('lineas.preparadoPor', 'nombre apellidos')
      .lean();

    if (!comanda) throw new Error('Comanda no encontrada');
    return comanda;
  }

  /**
   * Crear nueva comanda
   */
  async create(empresaId: string, userId: string, data: CreateComandaDTO, dbConfig: IDatabaseConfig) {
    const ComandaModel = await this.getModelo(empresaId, dbConfig);

    const numeroComanda = await this.getNextNumeroComanda(empresaId, dbConfig);

    const comanda = new ComandaModel({
      ...data,
      numeroComanda,
      zonaPreparacionId: new Types.ObjectId(data.zonaPreparacionId),
      mesaId: data.mesaId ? new Types.ObjectId(data.mesaId) : undefined,
      pedidoId: data.pedidoId ? new Types.ObjectId(data.pedidoId) : undefined,
      lineas: data.lineas.map((l) => ({
        ...l,
        productoId: new Types.ObjectId(l.productoId),
        modificadores: l.modificadores?.map((m) => ({
          ...m,
          modificadorId: new Types.ObjectId(m.modificadorId),
        })),
      })),
      horaRecepcion: new Date(),
      estado: 'pendiente',
      creadoPor: new Types.ObjectId(userId),
    });

    await comanda.save();

    // Emitir eventos SSE
    try {
      const zonaId = data.zonaPreparacionId;
      sseManager.broadcastToKDS(empresaId, zonaId, 'nueva-comanda', {
        comandaId: comanda._id?.toString(),
        numeroComanda,
      });
      sseManager.broadcastToEmpresa(empresaId, 'nueva-comanda', {
        comandaId: comanda._id?.toString(),
        numeroComanda,
        mesaId: data.mesaId,
        zonaPreparacionId: zonaId,
      });
    } catch (e) {
      console.error('[Comandas SSE] Error emitiendo nueva-comanda:', e);
    }

    return comanda.toObject();
  }

  /**
   * Actualizar comanda
   */
  async update(id: string, empresaId: string, data: UpdateComandaDTO, dbConfig: IDatabaseConfig) {
    const ComandaModel = await this.getModelo(empresaId, dbConfig);

    const updateData: any = { ...data };

    // Actualizar tiempos segun el estado
    if (data.estado === 'en_preparacion' && !updateData.horaInicio) {
      updateData.horaInicio = new Date();
    }
    if (data.estado === 'listo' && !updateData.horaFin) {
      updateData.horaFin = new Date();
    }
    if (data.estado === 'servido' && !updateData.horaServido) {
      updateData.horaServido = new Date();
    }

    const comanda = await ComandaModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!comanda) throw new Error('Comanda no encontrada');
    return comanda;
  }

  /**
   * Actualizar estado de una linea de comanda
   */
  async updateLinea(
    comandaId: string,
    lineaId: string,
    empresaId: string,
    userId: string,
    data: UpdateLineaComandaDTO,
    dbConfig: IDatabaseConfig
  ) {
    const ComandaModel = await this.getModelo(empresaId, dbConfig);

    const updateData: any = {
      'lineas.$.estado': data.estado,
    };

    if (data.estado === 'en_preparacion') {
      updateData['lineas.$.inicioPreparacion'] = new Date();
    }
    if (data.estado === 'listo') {
      updateData['lineas.$.finPreparacion'] = new Date();
      updateData['lineas.$.preparadoPor'] = new Types.ObjectId(userId);
    }

    await ComandaModel.findOneAndUpdate(
      { _id: new Types.ObjectId(comandaId), 'lineas._id': new Types.ObjectId(lineaId) },
      { $set: updateData }
    );

    // Recalcular estado de la comanda
    const comanda = await ComandaModel.findById(comandaId).lean();
    if (comanda) {
      const estadosLineas = comanda.lineas.map((l) => l.estado);
      let nuevoEstado: EstadoComanda = 'pendiente';

      if (estadosLineas.every((e) => e === 'listo' || e === 'servido')) {
        nuevoEstado = 'listo';
      } else if (estadosLineas.every((e) => e === 'servido')) {
        nuevoEstado = 'servido';
      } else if (estadosLineas.some((e) => e === 'listo')) {
        nuevoEstado = 'parcial';
      } else if (estadosLineas.some((e) => e === 'en_preparacion')) {
        nuevoEstado = 'en_preparacion';
      }

      if (comanda.estado !== nuevoEstado) {
        await this.update(comandaId, empresaId, { estado: nuevoEstado }, dbConfig);
      }

      // Emitir evento SSE de comanda actualizada
      try {
        const zonaId = comanda.zonaPreparacionId?.toString();
        if (zonaId) {
          sseManager.broadcastToKDS(empresaId, zonaId, 'comanda-actualizada', {
            comandaId,
            lineaId,
            estado: data.estado,
          });
        }
        // Si la comanda está lista, notificar al TPV
        if (nuevoEstado === 'listo') {
          sseManager.broadcastToEmpresa(empresaId, 'comanda-lista', {
            comandaId,
            numeroComanda: comanda.numeroComanda,
            mesaId: comanda.mesaId?.toString(),
          });
        }
      } catch (e) {
        console.error('[Comandas SSE] Error emitiendo comanda-actualizada:', e);
      }
    }

    return this.findOne(comandaId, empresaId, dbConfig);
  }

  /**
   * Marcar comanda como lista
   */
  async marcarLista(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    return this.update(id, empresaId, { estado: 'listo' }, dbConfig);
  }

  /**
   * Marcar comanda como servida
   */
  async marcarServida(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    return this.update(id, empresaId, { estado: 'servido' }, dbConfig);
  }

  /**
   * Cancelar comanda
   */
  async cancelar(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    return this.update(id, empresaId, { estado: 'cancelado' }, dbConfig);
  }

  /**
   * Reimprimir comanda
   */
  async reimprimir(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ComandaModel = await this.getModelo(empresaId, dbConfig);

    const comanda = await ComandaModel.findByIdAndUpdate(
      id,
      { $inc: { vecesPimpreso: 1 } },
      { new: true }
    ).lean();

    if (!comanda) throw new Error('Comanda no encontrada');
    return { ...comanda, impreso: true };
  }

  /**
   * Obtener estadisticas del KDS
   */
  async getEstadisticasKDS(zonaPreparacionId: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const ComandaModel = await this.getModelo(empresaId, dbConfig);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [pendientes, enPreparacion, listas, servidas, canceladas] = await Promise.all([
      ComandaModel.countDocuments({
        zonaPreparacionId: new Types.ObjectId(zonaPreparacionId),
        estado: 'pendiente',
        createdAt: { $gte: hoy },
      }),
      ComandaModel.countDocuments({
        zonaPreparacionId: new Types.ObjectId(zonaPreparacionId),
        estado: 'en_preparacion',
        createdAt: { $gte: hoy },
      }),
      ComandaModel.countDocuments({
        zonaPreparacionId: new Types.ObjectId(zonaPreparacionId),
        estado: 'listo',
        createdAt: { $gte: hoy },
      }),
      ComandaModel.countDocuments({
        zonaPreparacionId: new Types.ObjectId(zonaPreparacionId),
        estado: 'servido',
        createdAt: { $gte: hoy },
      }),
      ComandaModel.countDocuments({
        zonaPreparacionId: new Types.ObjectId(zonaPreparacionId),
        estado: 'cancelado',
        createdAt: { $gte: hoy },
      }),
    ]);

    // Tiempo medio de preparacion de comandas servidas hoy
    const comandasServidas = await ComandaModel.find({
      zonaPreparacionId: new Types.ObjectId(zonaPreparacionId),
      estado: 'servido',
      createdAt: { $gte: hoy },
      horaFin: { $exists: true },
    })
      .select('horaRecepcion horaFin')
      .lean();

    let tiempoMedioPreparacion = 0;
    if (comandasServidas.length > 0) {
      const tiemposPreparacion = comandasServidas.map((c) =>
        Math.round((new Date(c.horaFin!).getTime() - new Date(c.horaRecepcion).getTime()) / 60000)
      );
      tiempoMedioPreparacion = Math.round(
        tiemposPreparacion.reduce((a, b) => a + b, 0) / tiemposPreparacion.length
      );
    }

    return {
      pendientes,
      enPreparacion,
      listas,
      servidas,
      canceladas,
      totalHoy: pendientes + enPreparacion + listas + servidas,
      tiempoMedioPreparacion,
    };
  }
}

export const comandasCocinaService = new ComandasCocinaService();
