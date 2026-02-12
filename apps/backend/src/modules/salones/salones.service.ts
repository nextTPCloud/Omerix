import { Model, Types } from 'mongoose';
import { ISalon } from './Salon';
import { IMesa } from './Mesa';
import {
  CreateSalonDTO,
  UpdateSalonDTO,
  SearchSalonesDTO,
  CreateMesaDTO,
  UpdateMesaDTO,
  SearchMesasDTO,
  CambiarEstadoMesaDTO,
  MoverMesaDTO,
  AgruparMesasDTO,
} from './salones.dto';
import { IDatabaseConfig } from '../../types/express';
import { getSalonModel, getMesaModel, getZonaPreparacionModel, getAlmacenModel, getTPVRegistradoModel } from '../../utils/dynamic-models.helper';

export class SalonesService {
  // ============================================
  // SALONES
  // ============================================

  private async getSalonModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<ISalon>> {
    return await getSalonModel(empresaId, dbConfig);
  }

  private async getMesaModelo(empresaId: string, dbConfig: IDatabaseConfig): Promise<Model<IMesa>> {
    return await getMesaModel(empresaId, dbConfig);
  }

  async findAllSalones(empresaId: string, filters: SearchSalonesDTO, dbConfig: IDatabaseConfig) {
    // Registrar modelos relacionados para populate
    await Promise.all([
      getAlmacenModel(empresaId, dbConfig),
      getTPVRegistradoModel(empresaId, dbConfig),
      getZonaPreparacionModel(empresaId, dbConfig),
    ]);

    const SalonModel = await this.getSalonModelo(empresaId, dbConfig);
    const { q, activo, almacenId, tpvId, page = 1, limit = 50, sortBy = 'orden', sortOrder = 'asc' } = filters;

    const query: any = {};

    if (q) {
      query.$or = [
        { nombre: { $regex: q, $options: 'i' } },
        { codigo: { $regex: q, $options: 'i' } },
      ];
    }

    if (activo !== undefined) query.activo = activo;
    if (almacenId) query.almacenId = new Types.ObjectId(almacenId);
    if (tpvId) query.tpvsIds = new Types.ObjectId(tpvId);

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      SalonModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('almacenId', 'nombre')
        .populate('tpvsIds', 'nombre codigo')
        .populate('zonasPreparacionIds', 'nombre color')
        .lean(),
      SalonModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneSalon(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    // Registrar modelos relacionados para populate
    await Promise.all([
      getAlmacenModel(empresaId, dbConfig),
      getTPVRegistradoModel(empresaId, dbConfig),
      getZonaPreparacionModel(empresaId, dbConfig),
    ]);

    const SalonModel = await this.getSalonModelo(empresaId, dbConfig);
    const salon = await SalonModel.findById(id)
      .populate('almacenId', 'nombre')
      .populate('tpvsIds', 'nombre codigo')
      .populate('zonasPreparacionIds', 'nombre color')
      .lean();

    if (!salon) throw new Error('Salon no encontrado');
    return salon;
  }

  /**
   * Sugerir el siguiente código de salón
   */
  async sugerirSiguienteCodigo(empresaId: string, dbConfig: IDatabaseConfig, prefijo: string = 'SAL') {
    const SalonModel = await this.getSalonModelo(empresaId, dbConfig);

    // Buscar el último código con el prefijo dado
    const ultimoSalon = await SalonModel.findOne({
      codigo: { $regex: `^${prefijo}`, $options: 'i' }
    })
      .sort({ codigo: -1 })
      .select('codigo')
      .lean();

    if (!ultimoSalon || !ultimoSalon.codigo) {
      return `${prefijo}001`;
    }

    // Extraer el número del código
    const match = ultimoSalon.codigo.match(/(\d+)$/);
    if (!match) {
      return `${prefijo}001`;
    }

    const numero = parseInt(match[1], 10) + 1;
    const longitudNumero = match[1].length;
    return `${prefijo}${numero.toString().padStart(longitudNumero, '0')}`;
  }

  async createSalon(empresaId: string, data: CreateSalonDTO, dbConfig: IDatabaseConfig) {
    const SalonModel = await this.getSalonModelo(empresaId, dbConfig);

    const existente = await SalonModel.findOne({ nombre: data.nombre });
    if (existente) throw new Error(`Ya existe un salon con el nombre ${data.nombre}`);

    const salon = new SalonModel({
      ...data,
      almacenId: data.almacenId ? new Types.ObjectId(data.almacenId) : undefined,
      tpvsIds: data.tpvsIds?.map(id => new Types.ObjectId(id)),
      zonasPreparacionIds: data.zonasPreparacionIds?.map(id => new Types.ObjectId(id)),
    });

    await salon.save();
    return salon.toObject();
  }

  async updateSalon(id: string, empresaId: string, data: UpdateSalonDTO, dbConfig: IDatabaseConfig) {
    const SalonModel = await this.getSalonModelo(empresaId, dbConfig);

    if (data.nombre) {
      const existente = await SalonModel.findOne({
        nombre: data.nombre,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existente) throw new Error(`Ya existe un salon con el nombre ${data.nombre}`);
    }

    const updateData: any = { ...data };
    if (data.almacenId) updateData.almacenId = new Types.ObjectId(data.almacenId);
    if (data.tpvsIds) updateData.tpvsIds = data.tpvsIds.map(id => new Types.ObjectId(id));
    if (data.zonasPreparacionIds) updateData.zonasPreparacionIds = data.zonasPreparacionIds.map(id => new Types.ObjectId(id));

    const salon = await SalonModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!salon) throw new Error('Salon no encontrado');
    return salon;
  }

  async deleteSalon(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const SalonModel = await this.getSalonModelo(empresaId, dbConfig);
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);

    // Verificar si tiene mesas
    const mesasCount = await MesaModel.countDocuments({ salonId: new Types.ObjectId(id) });
    if (mesasCount > 0) {
      throw new Error(`No se puede eliminar el salon porque tiene ${mesasCount} mesas asignadas`);
    }

    const salon = await SalonModel.findByIdAndDelete(id);
    if (!salon) throw new Error('Salon no encontrado');
    return { message: 'Salon eliminado correctamente' };
  }

  // ============================================
  // MESAS
  // ============================================

  async findAllMesas(empresaId: string, filters: SearchMesasDTO, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);
    const { q, salonId, estado, activo, esVIP, camareroId, page = 1, limit = 100, sortBy = 'orden', sortOrder = 'asc' } = filters;

    const query: any = {};

    if (q) {
      query.$or = [
        { numero: { $regex: q, $options: 'i' } },
        { nombre: { $regex: q, $options: 'i' } },
      ];
    }

    if (salonId) query.salonId = new Types.ObjectId(salonId);
    if (estado) query.estado = estado;
    if (activo !== undefined) query.activo = activo;
    if (esVIP !== undefined) query['configuracion.esVIP'] = esVIP;
    if (camareroId) query['estadoInfo.camareroId'] = new Types.ObjectId(camareroId);

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      MesaModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('salonId', 'nombre color')
        .populate('estadoInfo.camareroId', 'nombre apellidos')
        .populate('estadoInfo.pedidoId', 'codigo total')
        .lean(),
      MesaModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findMesasBySalon(salonId: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);

    const mesas = await MesaModel.find({
      salonId: new Types.ObjectId(salonId),
      activo: true,
    })
      .sort({ orden: 1, numero: 1 })
      .populate('estadoInfo.camareroId', 'nombre apellidos')
      .populate('estadoInfo.pedidoId', 'codigo total')
      .lean();

    return mesas;
  }

  async findOneMesa(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);
    const mesa = await MesaModel.findById(id)
      .populate('salonId', 'nombre color')
      .populate('estadoInfo.camareroId', 'nombre apellidos')
      .populate('estadoInfo.pedidoId', 'codigo total estado lineas')
      .lean();

    if (!mesa) throw new Error('Mesa no encontrada');
    return mesa;
  }

  async createMesa(empresaId: string, data: CreateMesaDTO, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);
    const SalonModel = await this.getSalonModelo(empresaId, dbConfig);

    // Verificar que el salon existe
    const salon = await SalonModel.findById(data.salonId);
    if (!salon) throw new Error('Salon no encontrado');

    // Verificar numero unico en el salon
    const existente = await MesaModel.findOne({
      salonId: new Types.ObjectId(data.salonId),
      numero: data.numero,
    });
    if (existente) throw new Error(`Ya existe una mesa con el numero ${data.numero} en este salon`);

    const mesa = new MesaModel({
      ...data,
      salonId: new Types.ObjectId(data.salonId),
    });

    await mesa.save();
    return mesa.toObject();
  }

  async createMesasBulk(empresaId: string, salonId: string, cantidad: number, prefijo: string, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);
    const SalonModel = await this.getSalonModelo(empresaId, dbConfig);

    // Verificar que el salon existe
    const salon = await SalonModel.findById(salonId);
    if (!salon) throw new Error('Salon no encontrado');

    // Obtener el ultimo numero de mesa
    const ultimaMesa = await MesaModel.findOne({ salonId: new Types.ObjectId(salonId) })
      .sort({ orden: -1 })
      .lean();

    const ultimoOrden = ultimaMesa?.orden || 0;

    const mesas = [];
    for (let i = 1; i <= cantidad; i++) {
      const numero = `${prefijo}${i}`;
      // Verificar que no existe
      const existe = await MesaModel.findOne({
        salonId: new Types.ObjectId(salonId),
        numero,
      });
      if (!existe) {
        mesas.push({
          numero,
          salonId: new Types.ObjectId(salonId),
          posicion: { x: (i - 1) % 5 * 3, y: Math.floor((i - 1) / 5) * 3, rotacion: 0 },
          orden: ultimoOrden + i,
        });
      }
    }

    if (mesas.length > 0) {
      await MesaModel.insertMany(mesas);
    }

    return { created: mesas.length, message: `Se crearon ${mesas.length} mesas` };
  }

  async updateMesa(id: string, empresaId: string, data: UpdateMesaDTO, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);

    if (data.numero && data.salonId) {
      const existente = await MesaModel.findOne({
        salonId: new Types.ObjectId(data.salonId),
        numero: data.numero,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existente) throw new Error(`Ya existe una mesa con el numero ${data.numero} en este salon`);
    }

    const updateData: any = { ...data };
    if (data.salonId) updateData.salonId = new Types.ObjectId(data.salonId);
    if (data.estadoInfo?.pedidoId) updateData['estadoInfo.pedidoId'] = new Types.ObjectId(data.estadoInfo.pedidoId);
    if (data.estadoInfo?.camareroId) updateData['estadoInfo.camareroId'] = new Types.ObjectId(data.estadoInfo.camareroId);
    if (data.estadoInfo?.reservaId) updateData['estadoInfo.reservaId'] = new Types.ObjectId(data.estadoInfo.reservaId);

    const mesa = await MesaModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!mesa) throw new Error('Mesa no encontrada');
    return mesa;
  }

  async deleteMesa(id: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);

    const mesa = await MesaModel.findById(id);
    if (!mesa) throw new Error('Mesa no encontrada');

    if (mesa.estado === 'ocupada') {
      throw new Error('No se puede eliminar una mesa ocupada');
    }

    await MesaModel.findByIdAndDelete(id);
    return { message: 'Mesa eliminada correctamente' };
  }

  // ============================================
  // OPERACIONES DE ESTADO DE MESA
  // ============================================

  async cambiarEstadoMesa(id: string, empresaId: string, data: CambiarEstadoMesaDTO, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);

    const updateData: any = {
      estado: data.estado,
      'estadoInfo.horaUltimaActualizacion': new Date(),
    };

    if (data.estado === 'ocupada') {
      updateData['estadoInfo.horaOcupacion'] = new Date();
      if (data.numComensales) updateData['estadoInfo.numComensales'] = data.numComensales;
      if (data.clienteNombre) updateData['estadoInfo.clienteNombre'] = data.clienteNombre;
      if (data.camareroId) updateData['estadoInfo.camareroId'] = new Types.ObjectId(data.camareroId);
      if (data.pedidoId) updateData['estadoInfo.pedidoId'] = new Types.ObjectId(data.pedidoId);
      if (data.notasServicio) updateData['estadoInfo.notasServicio'] = data.notasServicio;
    } else if (data.estado === 'reservada') {
      if (data.reservaId) updateData['estadoInfo.reservaId'] = new Types.ObjectId(data.reservaId);
      if (data.clienteNombre) updateData['estadoInfo.clienteNombre'] = data.clienteNombre;
      if (data.numComensales) updateData['estadoInfo.numComensales'] = data.numComensales;
    } else if (data.estado === 'libre') {
      // Limpiar estado al liberar
      updateData['estadoInfo'] = {
        horaUltimaActualizacion: new Date(),
      };
      // Incrementar estadisticas
      updateData.$inc = { 'estadisticas.ocupacionesHoy': 1 };
    }

    const mesa = await MesaModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!mesa) throw new Error('Mesa no encontrada');
    return mesa;
  }

  async moverMesa(id: string, empresaId: string, data: MoverMesaDTO, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);

    const mesa = await MesaModel.findByIdAndUpdate(
      id,
      {
        $set: {
          'posicion.x': data.x,
          'posicion.y': data.y,
          'posicion.rotacion': data.rotacion ?? 0,
        },
      },
      { new: true }
    ).lean();

    if (!mesa) throw new Error('Mesa no encontrada');
    return mesa;
  }

  async actualizarPosicionesMesas(empresaId: string, mesas: Array<{ id: string; x: number; y: number; rotacion?: number }>, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);

    const operations = mesas.map(m => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(m.id) },
        update: {
          $set: {
            'posicion.x': m.x,
            'posicion.y': m.y,
            'posicion.rotacion': m.rotacion ?? 0,
          },
        },
      },
    }));

    await MesaModel.bulkWrite(operations);
    return { updated: mesas.length, message: `Se actualizaron ${mesas.length} posiciones` };
  }

  async agruparMesas(empresaId: string, data: AgruparMesasDTO, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);

    const grupoId = new Types.ObjectId().toString();

    // Marcar la mesa principal
    await MesaModel.findByIdAndUpdate(data.mesaPrincipalId, {
      $set: {
        'grupo.grupoId': grupoId,
        'grupo.mesasPrincipales': data.mesasIds.map(id => new Types.ObjectId(id)),
        'grupo.esPrincipal': true,
      },
    });

    // Marcar las mesas secundarias
    for (const mesaId of data.mesasIds) {
      if (mesaId !== data.mesaPrincipalId) {
        await MesaModel.findByIdAndUpdate(mesaId, {
          $set: {
            'grupo.grupoId': grupoId,
            'grupo.esPrincipal': false,
            estado: 'fuera_servicio', // Las secundarias se ocultan
          },
        });
      }
    }

    return { grupoId, message: 'Mesas agrupadas correctamente' };
  }

  async desagruparMesas(grupoId: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);

    await MesaModel.updateMany(
      { 'grupo.grupoId': grupoId },
      {
        $unset: { grupo: 1 },
        $set: { estado: 'libre' },
      }
    );

    return { message: 'Mesas desagrupadas correctamente' };
  }

  // ============================================
  // ESTADISTICAS
  // ============================================

  async getEstadisticasSalon(salonId: string, empresaId: string, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);

    const mesas = await MesaModel.find({
      salonId: new Types.ObjectId(salonId),
      activo: true,
    }).lean();

    const stats = {
      totalMesas: mesas.length,
      mesasLibres: mesas.filter(m => m.estado === 'libre').length,
      mesasOcupadas: mesas.filter(m => m.estado === 'ocupada').length,
      mesasReservadas: mesas.filter(m => m.estado === 'reservada').length,
      mesasPorLimpiar: mesas.filter(m => m.estado === 'por_limpiar').length,
      mesasCuentaPedida: mesas.filter(m => m.estado === 'cuenta_pedida').length,
      mesasFueraServicio: mesas.filter(m => m.estado === 'fuera_servicio').length,
      capacidadTotal: mesas.reduce((acc, m) => acc + (m.capacidadMaxima || 0), 0),
      comensalesActuales: mesas
        .filter(m => m.estado === 'ocupada')
        .reduce((acc, m) => acc + (m.estadoInfo?.numComensales || 0), 0),
      importePendienteTotal: mesas.reduce((acc, m) => acc + (m.estadoInfo?.importePendiente || 0), 0),
    };

    return stats;
  }

  async resetearEstadisticasDiarias(empresaId: string, dbConfig: IDatabaseConfig) {
    const MesaModel = await this.getMesaModelo(empresaId, dbConfig);

    await MesaModel.updateMany(
      {},
      { $set: { 'estadisticas.ocupacionesHoy': 0 } }
    );

    return { message: 'Estadisticas diarias reseteadas' };
  }
}

export const salonesService = new SalonesService();
