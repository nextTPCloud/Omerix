import mongoose, { Model } from 'mongoose';
import {
  ParteTrabajo,
  IParteTrabajo,
  EstadoParteTrabajo,
  TipoParteTrabajo,
  Prioridad,
  ILineaPersonal,
  ILineaMaterial,
  ILineaMaquinaria,
  ILineaTransporte,
  ILineaGasto,
  ITotalesParteTrabajo,
} from './ParteTrabajo';
import {
  CreateParteTrabajoDTO,
  UpdateParteTrabajoDTO,
  SearchPartesTrabajoDTO,
  CambiarEstadoParteDTO,
  CompletarParteDTO,
  OpcionesGenerarAlbaranDTO,
  DuplicarParteDTO,
  LineaPersonalDTO,
  LineaMaterialDTO,
  LineaMaquinariaDTO,
  LineaTransporteDTO,
  LineaGastoDTO,
} from './partes-trabajo.dto';
import { IDatabaseConfig } from '@/models/Empresa';
import {
  getParteTrabajoModel,
  getClienteModel,
  getProyectoModel,
  getPersonalModel,
  getProductoModel,
  getAlbaranModel,
  getMaquinariaModel,
  getTipoGastoModel,
  getUserModel,
  getAlmacenModel,
} from '@/utils/dynamic-models.helper';
import { TipoLinea, TipoAlbaran, EstadoAlbaran } from '../albaranes/Albaran';
import { parseAdvancedFilters, mergeFilters } from '@/utils/advanced-filters.helper';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface FindAllResult {
  partes: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PartesTrabajoService {
  /**
   * Obtener modelo de ParteTrabajo para una empresa especifica
   */
  private async getModeloParteTrabajo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IParteTrabajo>> {
    // Registrar modelos referenciados para que populate funcione
    await Promise.all([
      getClienteModel(empresaId, dbConfig),
      getProyectoModel(empresaId, dbConfig),
      getPersonalModel(empresaId, dbConfig),
      getProductoModel(empresaId, dbConfig),
      getMaquinariaModel(empresaId, dbConfig),
      getTipoGastoModel(empresaId, dbConfig),
      getUserModel(empresaId, dbConfig),
      getAlbaranModel(empresaId, dbConfig),
    ]);

    return await getParteTrabajoModel(empresaId, dbConfig);
  }

  // ============================================
  // CALCULOS DE LINEAS Y TOTALES
  // ============================================

  /**
   * Calcular totales del parte de trabajo
   */
  calcularTotales(parte: Partial<IParteTrabajo>): ITotalesParteTrabajo {
    const totales: ITotalesParteTrabajo = {
      costePersonal: 0,
      costeMaterial: 0,
      costeMaquinaria: 0,
      costeTransporte: 0,
      costeGastos: 0,
      costeTotal: 0,
      ventaPersonal: 0,
      ventaMaterial: 0,
      ventaMaquinaria: 0,
      ventaTransporte: 0,
      ventaGastos: 0,
      subtotalVenta: 0,
      totalIva: 0,
      totalVenta: 0,
      margenBruto: 0,
      margenPorcentaje: 0,
    };

    // Personal
    (parte.lineasPersonal || []).forEach((l) => {
      const horas = (l.horasTrabajadas || 0) + (l.horasExtras || 0);
      l.costeTotal = horas * (l.tarifaHoraCoste || 0);
      l.ventaTotal = horas * (l.tarifaHoraVenta || 0);
      totales.costePersonal += l.costeTotal;
      if (l.facturable) {
        totales.ventaPersonal += l.ventaTotal;
      }
    });

    // Material
    (parte.lineasMaterial || []).forEach((l) => {
      l.costeTotal = (l.cantidad || 0) * (l.precioCoste || 0);
      const subtotal = (l.cantidad || 0) * (l.precioVenta || 0);
      const descuentoImporte = subtotal * ((l.descuento || 0) / 100);
      l.ventaTotal = subtotal - descuentoImporte;
      totales.costeMaterial += l.costeTotal;
      if (l.facturable) {
        totales.ventaMaterial += l.ventaTotal;
        totales.totalIva += l.ventaTotal * ((l.iva || 21) / 100);
      }
    });

    // Maquinaria
    (parte.lineasMaquinaria || []).forEach((l) => {
      l.costeTotal = (l.cantidad || 0) * (l.tarifaCoste || 0);
      l.ventaTotal = (l.cantidad || 0) * (l.tarifaVenta || 0);
      totales.costeMaquinaria += l.costeTotal;
      if (l.facturable) {
        totales.ventaMaquinaria += l.ventaTotal;
      }
    });

    // Transporte
    (parte.lineasTransporte || []).forEach((l) => {
      const costeKm = (l.kmRecorridos || 0) * (l.tarifaPorKm || 0);
      l.costeTotal = costeKm + (l.importeFijoViaje || 0) + (l.peajes || 0) + (l.combustible || 0);
      totales.costeTransporte += l.costeTotal;
      if (l.facturable) {
        totales.ventaTransporte += l.precioVenta || 0;
      }
    });

    // Gastos
    (parte.lineasGastos || []).forEach((l) => {
      l.importeFacturable = (l.importe || 0) * (1 + (l.margen || 0) / 100);
      totales.costeGastos += l.importe || 0;
      if (l.facturable) {
        totales.ventaGastos += l.importeFacturable;
        totales.totalIva += l.importeFacturable * ((l.iva || 21) / 100);
      }
    });

    // Totales
    totales.costeTotal = totales.costePersonal + totales.costeMaterial + totales.costeMaquinaria + totales.costeTransporte + totales.costeGastos;
    totales.subtotalVenta = totales.ventaPersonal + totales.ventaMaterial + totales.ventaMaquinaria + totales.ventaTransporte + totales.ventaGastos;

    // Aplicar descuento global
    const descuento = (totales.subtotalVenta * (parte.descuentoGlobalPorcentaje || 0) / 100) + (parte.descuentoGlobalImporte || 0);
    totales.subtotalVenta -= descuento;

    // Total con IVA (servicios llevan 21% por defecto)
    totales.totalIva += (totales.ventaPersonal + totales.ventaMaquinaria + totales.ventaTransporte) * 0.21;
    totales.totalVenta = totales.subtotalVenta + totales.totalIva;

    // Margen
    totales.margenBruto = totales.subtotalVenta - totales.costeTotal;
    totales.margenPorcentaje = totales.subtotalVenta > 0
      ? (totales.margenBruto / totales.subtotalVenta) * 100
      : 0;

    // Redondear valores
    Object.keys(totales).forEach(key => {
      (totales as any)[key] = Math.round((totales as any)[key] * 100) / 100;
    });

    return totales;
  }

  // ============================================
  // CREAR PARTE DE TRABAJO
  // ============================================

  async crear(
    createDto: CreateParteTrabajoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IParteTrabajo> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);
    const ClienteModel = await getClienteModel(String(empresaId), dbConfig);

    // Generar codigo
    const serie = createDto.serie || 'PT';
    const año = new Date().getFullYear();

    const ultimoParte = await ParteTrabajoModel.findOne({
      serie,
      codigo: new RegExp(`^${serie}${año}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numero = 1;
    if (ultimoParte && ultimoParte.numero) {
      numero = ultimoParte.numero + 1;
    }

    const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

    // Obtener datos del cliente
    let clienteData: any = {
      clienteNombre: createDto.clienteNombre,
      clienteNif: createDto.clienteNif,
      clienteEmail: createDto.clienteEmail,
      clienteTelefono: createDto.clienteTelefono,
    };

    if (createDto.clienteId) {
      const cliente = await ClienteModel.findById(createDto.clienteId);
      if (cliente) {
        clienteData = {
          clienteNombre: (cliente as any).nombre || (cliente as any).nombreComercial,
          clienteNif: (cliente as any).nif || (cliente as any).cif,
          clienteEmail: (cliente as any).email,
          clienteTelefono: (cliente as any).telefono,
        };
      }
    }

    // Obtener datos del proyecto si existe
    let proyectoData: any = {};
    if (createDto.proyectoId) {
      const ProyectoModel = await getProyectoModel(String(empresaId), dbConfig);
      const proyecto = await ProyectoModel.findById(createDto.proyectoId).lean();
      if (proyecto) {
        proyectoData = {
          proyectoCodigo: (proyecto as any).codigo,
          proyectoNombre: (proyecto as any).nombre || (proyecto as any).titulo,
        };
      }
    }

    // Obtener datos del responsable si existe
    let responsableData: any = {};
    if (createDto.responsableId) {
      const PersonalModel = await getPersonalModel(String(empresaId), dbConfig);
      const personal = await PersonalModel.findById(createDto.responsableId).lean();
      if (personal) {
        responsableData = {
          responsableNombre: (personal as any).nombre || `${(personal as any).nombre} ${(personal as any).apellidos || ''}`.trim(),
        };
      }
    }

    // Preparar datos del parte
    const parteData: any = {
      _id: new mongoose.Types.ObjectId(),
      codigo,
      serie,
      numero,
      tipo: createDto.tipo || TipoParteTrabajo.SERVICIO,
      estado: createDto.estado || EstadoParteTrabajo.BORRADOR,
      prioridad: createDto.prioridad || Prioridad.MEDIA,
      fecha: createDto.fecha || new Date(),
      fechaInicio: createDto.fechaInicio,
      fechaFin: createDto.fechaFin,
      fechaPrevista: createDto.fechaPrevista,
      clienteId: createDto.clienteId,
      ...clienteData,
      proyectoId: createDto.proyectoId,
      ...proyectoData,
      direccionTrabajo: createDto.direccionTrabajo,
      responsableId: createDto.responsableId,
      ...responsableData,
      titulo: createDto.titulo,
      descripcion: createDto.descripcion,
      trabajoRealizado: createDto.trabajoRealizado,
      observacionesInternas: createDto.observacionesInternas,
      lineasPersonal: createDto.lineasPersonal || [],
      lineasMaterial: createDto.lineasMaterial || [],
      lineasMaquinaria: createDto.lineasMaquinaria || [],
      lineasTransporte: createDto.lineasTransporte || [],
      lineasGastos: createDto.lineasGastos || [],
      descuentoGlobalPorcentaje: createDto.descuentoGlobalPorcentaje || 0,
      descuentoGlobalImporte: createDto.descuentoGlobalImporte || 0,
      tags: createDto.tags,
      mostrarCostes: createDto.mostrarCostes !== false,
      mostrarMargenes: createDto.mostrarMargenes !== false,
      mostrarPrecios: createDto.mostrarPrecios !== false,
      creadoPor: usuarioId,
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Parte de trabajo creado',
        descripcion: `Parte ${codigo} creado`,
      }],
    };

    // Calcular totales
    parteData.totales = this.calcularTotales(parteData);

    const parte = new ParteTrabajoModel(parteData);
    await parte.save();

    return parte;
  }

  // ============================================
  // BUSCAR PARTES DE TRABAJO
  // ============================================

  async buscar(
    searchDto: SearchPartesTrabajoDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<FindAllResult> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);

    const {
      search,
      clienteId,
      proyectoId,
      responsableId,
      estado,
      estados,
      tipo,
      prioridad,
      serie,
      activo = 'true',
      fechaDesde,
      fechaHasta,
      fechaInicioDesde,
      fechaInicioHasta,
      importeMin,
      importeMax,
      tags,
      conFirmaCliente,
      page = 1,
      limit = 20,
      sortBy = 'fecha',
      sortOrder = 'desc',
    } = searchDto;

    // Construir filtro base
    const filter: any = {};

    // Activo
    if (activo === 'true') {
      filter.activo = true;
    } else if (activo === 'false') {
      filter.activo = false;
    }

    // Busqueda por texto
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { codigo: searchRegex },
        { titulo: searchRegex },
        { clienteNombre: searchRegex },
        { proyectoNombre: searchRegex },
        { descripcion: searchRegex },
      ];
    }

    // Filtros especificos
    if (clienteId) filter.clienteId = new mongoose.Types.ObjectId(clienteId);
    if (proyectoId) filter.proyectoId = new mongoose.Types.ObjectId(proyectoId);
    if (responsableId) filter.responsableId = new mongoose.Types.ObjectId(responsableId);
    if (tipo) filter.tipo = tipo;
    if (prioridad) filter.prioridad = prioridad;
    if (serie) filter.serie = serie;

    // Estados
    if (estado) {
      filter.estado = estado;
    } else if (estados) {
      const estadosArray = estados.split(',').map(e => e.trim());
      filter.estado = { $in: estadosArray };
    }

    // Filtros de fecha
    if (fechaDesde || fechaHasta) {
      filter.fecha = {};
      if (fechaDesde) filter.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) filter.fecha.$lte = new Date(fechaHasta);
    }

    if (fechaInicioDesde || fechaInicioHasta) {
      filter.fechaInicio = {};
      if (fechaInicioDesde) filter.fechaInicio.$gte = new Date(fechaInicioDesde);
      if (fechaInicioHasta) filter.fechaInicio.$lte = new Date(fechaInicioHasta);
    }

    // Filtros de importe
    if (importeMin || importeMax) {
      filter['totales.totalVenta'] = {};
      if (importeMin) filter['totales.totalVenta'].$gte = parseFloat(importeMin);
      if (importeMax) filter['totales.totalVenta'].$lte = parseFloat(importeMax);
    }

    // Tags
    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim().toLowerCase());
      filter.tags = { $in: tagsArray };
    }

    // Firma cliente
    if (conFirmaCliente === 'true') {
      filter.firmaCliente = { $exists: true, $ne: null, $ne: '' };
    } else if (conFirmaCliente === 'false') {
      filter.$or = [
        { firmaCliente: { $exists: false } },
        { firmaCliente: null },
        { firmaCliente: '' },
      ];
    }

    // Ordenacion
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginacion
    const skip = (page - 1) * limit;

    // Ejecutar consulta
    const [partes, total] = await Promise.all([
      ParteTrabajoModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clienteId', 'nombre nombreComercial')
        .populate('proyectoId', 'codigo nombre titulo')
        .populate('responsableId', 'nombre apellidos')
        .lean(),
      ParteTrabajoModel.countDocuments(filter),
    ]);

    return {
      partes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async obtenerPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IParteTrabajo | null> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);

    return ParteTrabajoModel.findById(id)
      .populate('clienteId', 'nombre nombreComercial nif cif email telefono')
      .populate('proyectoId', 'codigo nombre titulo')
      .populate('responsableId', 'nombre apellidos codigo')
      .populate('lineasPersonal.personalId', 'nombre apellidos codigo')
      .populate('lineasMaterial.productoId', 'nombre sku precioVenta coste')
      .populate('lineasMaquinaria.maquinariaId', 'nombre codigo matricula')
      .populate('lineasGastos.tipoGastoId', 'nombre codigo')
      .lean();
  }

  // ============================================
  // ACTUALIZAR PARTE
  // ============================================

  async actualizar(
    id: string,
    updateDto: UpdateParteTrabajoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IParteTrabajo | null> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);

    const parteExistente = await ParteTrabajoModel.findById(id);
    if (!parteExistente) {
      throw new Error('Parte de trabajo no encontrado');
    }

    if (parteExistente.bloqueado) {
      throw new Error('El parte de trabajo esta bloqueado y no se puede modificar');
    }

    // Preparar datos actualizados
    const datosActualizados: any = { ...updateDto };

    // Actualizar datos del cliente si se cambia
    if (updateDto.clienteId && updateDto.clienteId !== parteExistente.clienteId?.toString()) {
      const ClienteModel = await getClienteModel(String(empresaId), dbConfig);
      const cliente = await ClienteModel.findById(updateDto.clienteId).lean();
      if (cliente) {
        datosActualizados.clienteNombre = (cliente as any).nombre || (cliente as any).nombreComercial;
        datosActualizados.clienteNif = (cliente as any).nif || (cliente as any).cif;
        datosActualizados.clienteEmail = (cliente as any).email;
        datosActualizados.clienteTelefono = (cliente as any).telefono;
      }
    }

    // Actualizar datos del proyecto si se cambia
    if (updateDto.proyectoId !== undefined) {
      if (updateDto.proyectoId) {
        const ProyectoModel = await getProyectoModel(String(empresaId), dbConfig);
        const proyecto = await ProyectoModel.findById(updateDto.proyectoId).lean();
        if (proyecto) {
          datosActualizados.proyectoCodigo = (proyecto as any).codigo;
          datosActualizados.proyectoNombre = (proyecto as any).nombre || (proyecto as any).titulo;
        }
      } else {
        datosActualizados.proyectoId = null;
        datosActualizados.proyectoCodigo = null;
        datosActualizados.proyectoNombre = null;
      }
    }

    // Actualizar datos del responsable si se cambia
    if (updateDto.responsableId !== undefined) {
      if (updateDto.responsableId) {
        const PersonalModel = await getPersonalModel(String(empresaId), dbConfig);
        const personal = await PersonalModel.findById(updateDto.responsableId).lean();
        if (personal) {
          datosActualizados.responsableNombre = (personal as any).nombre || `${(personal as any).nombre} ${(personal as any).apellidos || ''}`.trim();
        }
      } else {
        datosActualizados.responsableId = null;
        datosActualizados.responsableNombre = null;
      }
    }

    datosActualizados.modificadoPor = usuarioId;
    datosActualizados.fechaModificacion = new Date();

    // Agregar al historial
    datosActualizados.$push = {
      historial: {
        fecha: new Date(),
        usuarioId,
        accion: 'Parte actualizado',
        descripcion: 'Datos del parte de trabajo actualizados',
      },
    };

    const parteActualizado = await ParteTrabajoModel.findByIdAndUpdate(
      id,
      datosActualizados,
      { new: true }
    );

    // Recalcular totales
    if (parteActualizado) {
      parteActualizado.totales = this.calcularTotales(parteActualizado);
      await parteActualizado.save();
    }

    return parteActualizado;
  }

  // ============================================
  // ELIMINAR PARTE (SOFT DELETE)
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IParteTrabajo | null> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);

    return ParteTrabajoModel.findByIdAndUpdate(
      id,
      {
        activo: false,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
        $push: {
          historial: {
            fecha: new Date(),
            usuarioId,
            accion: 'Parte eliminado',
            descripcion: 'Parte de trabajo eliminado (soft delete)',
          },
        },
      },
      { new: true }
    );
  }

  // ============================================
  // ELIMINAR MULTIPLES
  // ============================================

  async eliminarMultiples(
    ids: string[],
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<number> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);

    const result = await ParteTrabajoModel.updateMany(
      { _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } },
      {
        activo: false,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
        $push: {
          historial: {
            fecha: new Date(),
            usuarioId,
            accion: 'Parte eliminado',
            descripcion: 'Parte de trabajo eliminado por operacion masiva',
          },
        },
      }
    );

    return result.modifiedCount;
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(
    id: string,
    dto: CambiarEstadoParteDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IParteTrabajo | null> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);

    const parte = await ParteTrabajoModel.findById(id);
    if (!parte) {
      throw new Error('Parte de trabajo no encontrado');
    }

    const estadoAnterior = parte.estado;

    // Validaciones de transicion de estado
    const transicionesValidas: Record<EstadoParteTrabajo, EstadoParteTrabajo[]> = {
      [EstadoParteTrabajo.BORRADOR]: [EstadoParteTrabajo.PLANIFICADO, EstadoParteTrabajo.EN_CURSO, EstadoParteTrabajo.ANULADO],
      [EstadoParteTrabajo.PLANIFICADO]: [EstadoParteTrabajo.EN_CURSO, EstadoParteTrabajo.ANULADO, EstadoParteTrabajo.BORRADOR],
      [EstadoParteTrabajo.EN_CURSO]: [EstadoParteTrabajo.PAUSADO, EstadoParteTrabajo.COMPLETADO, EstadoParteTrabajo.ANULADO],
      [EstadoParteTrabajo.PAUSADO]: [EstadoParteTrabajo.EN_CURSO, EstadoParteTrabajo.COMPLETADO, EstadoParteTrabajo.ANULADO],
      [EstadoParteTrabajo.COMPLETADO]: [EstadoParteTrabajo.FACTURADO, EstadoParteTrabajo.EN_CURSO],
      [EstadoParteTrabajo.FACTURADO]: [],
      [EstadoParteTrabajo.ANULADO]: [EstadoParteTrabajo.BORRADOR],
    };

    if (!transicionesValidas[estadoAnterior].includes(dto.estado)) {
      throw new Error(`No se puede cambiar de estado ${estadoAnterior} a ${dto.estado}`);
    }

    // Actualizar estado
    const updateData: any = {
      estado: dto.estado,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
      $push: {
        historial: {
          fecha: new Date(),
          usuarioId,
          accion: `Estado cambiado: ${estadoAnterior} -> ${dto.estado}`,
          descripcion: dto.observaciones || `Cambio de estado a ${dto.estado}`,
          datosAnteriores: { estado: estadoAnterior },
        },
      },
    };

    // Si se inicia, registrar fecha de inicio
    if (dto.estado === EstadoParteTrabajo.EN_CURSO && !parte.fechaInicio) {
      updateData.fechaInicio = new Date();
    }

    // Si se completa, registrar fecha de fin
    if (dto.estado === EstadoParteTrabajo.COMPLETADO && !parte.fechaFin) {
      updateData.fechaFin = new Date();
    }

    return ParteTrabajoModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  // ============================================
  // COMPLETAR PARTE (CON FIRMAS)
  // ============================================

  async completar(
    id: string,
    dto: CompletarParteDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IParteTrabajo | null> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);

    const parte = await ParteTrabajoModel.findById(id);
    if (!parte) {
      throw new Error('Parte de trabajo no encontrado');
    }

    const updateData: any = {
      estado: EstadoParteTrabajo.COMPLETADO,
      fechaFin: new Date(),
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
      $push: {
        historial: {
          fecha: new Date(),
          usuarioId,
          accion: 'Parte completado',
          descripcion: dto.observaciones || 'Parte de trabajo completado con firmas',
        },
      },
    };

    if (dto.trabajoRealizado) updateData.trabajoRealizado = dto.trabajoRealizado;
    if (dto.firmaTecnico) {
      updateData.firmaTecnico = dto.firmaTecnico;
      updateData.nombreTecnico = dto.nombreTecnico;
      updateData.fechaFirmaTecnico = new Date();
    }
    if (dto.firmaCliente) {
      updateData.firmaCliente = dto.firmaCliente;
      updateData.nombreCliente = dto.nombreCliente;
      updateData.dniCliente = dto.dniCliente;
      updateData.fechaFirmaCliente = new Date();
    }

    return ParteTrabajoModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  // ============================================
  // GENERAR ALBARAN DESDE PARTE
  // ============================================

  async generarAlbaran(
    id: string,
    opciones: OpcionesGenerarAlbaranDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);
    const AlbaranModel = await getAlbaranModel(String(empresaId), dbConfig);

    const parte = await ParteTrabajoModel.findById(id);
    if (!parte) {
      throw new Error('Parte de trabajo no encontrado');
    }

    // Configuracion por defecto
    const config = {
      incluirPersonal: opciones.incluirPersonal !== false,
      incluirMaterial: opciones.incluirMaterial !== false,
      incluirMaquinaria: opciones.incluirMaquinaria !== false,
      incluirTransporte: opciones.incluirTransporte !== false,
      incluirGastos: opciones.incluirGastos !== false,
      soloFacturables: opciones.soloFacturables !== false,
    };

    // Generar codigo de albaran
    const año = new Date().getFullYear();
    const ultimoAlbaran = await AlbaranModel.findOne({
      serie: 'ALB',
      codigo: new RegExp(`^ALB${año}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numero = 1;
    if (ultimoAlbaran && (ultimoAlbaran as any).numero) {
      numero = (ultimoAlbaran as any).numero + 1;
    }
    const codigoAlbaran = `ALB${año}-${numero.toString().padStart(5, '0')}`;

    // Crear lineas de albaran
    const lineasAlbaran: any[] = [];
    let orden = 0;

    // Personal -> Servicio
    if (config.incluirPersonal) {
      for (const linea of parte.lineasPersonal) {
        if (config.soloFacturables && !linea.facturable) continue;
        if (linea.incluidoEnAlbaran) continue;

        orden++;
        const horas = (linea.horasTrabajadas || 0) + (linea.horasExtras || 0);
        lineasAlbaran.push({
          orden,
          tipo: TipoLinea.SERVICIO,
          nombre: `Mano de obra: ${linea.personalNombre}`,
          descripcion: linea.descripcionTrabajo || `Trabajo realizado el ${new Date(linea.fecha).toLocaleDateString()}`,
          cantidadSolicitada: horas,
          cantidadEntregada: horas,
          unidad: 'h',
          precioUnitario: linea.tarifaHoraVenta || 0,
          costeUnitario: linea.tarifaHoraCoste || 0,
          descuento: 0,
          iva: 21,
          esEditable: true,
          incluidoEnTotal: true,
        });

        // Marcar como incluido
        linea.incluidoEnAlbaran = true;
      }
    }

    // Material -> Producto
    if (config.incluirMaterial) {
      for (const linea of parte.lineasMaterial) {
        if (config.soloFacturables && !linea.facturable) continue;
        if (linea.incluidoEnAlbaran) continue;

        orden++;
        lineasAlbaran.push({
          orden,
          tipo: TipoLinea.PRODUCTO,
          productoId: linea.productoId,
          codigo: linea.productoCodigo,
          nombre: linea.productoNombre,
          descripcion: linea.descripcion,
          cantidadSolicitada: linea.cantidad,
          cantidadEntregada: linea.cantidad,
          unidad: linea.unidad || 'ud',
          precioUnitario: linea.precioVenta || 0,
          costeUnitario: linea.precioCoste || 0,
          descuento: linea.descuento || 0,
          iva: linea.iva || 21,
          lote: linea.lote,
          almacenId: linea.almacenId,
          esEditable: true,
          incluidoEnTotal: true,
        });

        linea.incluidoEnAlbaran = true;
      }
    }

    // Maquinaria -> Servicio
    if (config.incluirMaquinaria) {
      for (const linea of parte.lineasMaquinaria) {
        if (config.soloFacturables && !linea.facturable) continue;
        if (linea.incluidoEnAlbaran) continue;

        orden++;
        const unidadTexto = linea.tipoUnidad === 'horas' ? 'h' : linea.tipoUnidad === 'dias' ? 'd' : linea.tipoUnidad === 'km' ? 'km' : 'ud';
        lineasAlbaran.push({
          orden,
          tipo: TipoLinea.SERVICIO,
          nombre: `Maquinaria: ${linea.nombre}`,
          descripcion: linea.descripcion || `Uso de ${linea.nombre}`,
          cantidadSolicitada: linea.cantidad,
          cantidadEntregada: linea.cantidad,
          unidad: unidadTexto,
          precioUnitario: linea.tarifaVenta || 0,
          costeUnitario: linea.tarifaCoste || 0,
          descuento: 0,
          iva: 21,
          esEditable: true,
          incluidoEnTotal: true,
        });

        linea.incluidoEnAlbaran = true;
      }
    }

    // Transporte -> Servicio
    if (config.incluirTransporte) {
      for (const linea of parte.lineasTransporte) {
        if (config.soloFacturables && !linea.facturable) continue;
        if (linea.incluidoEnAlbaran) continue;

        orden++;
        const descripcion = linea.origen && linea.destino
          ? `Transporte de ${linea.origen} a ${linea.destino}`
          : `Desplazamiento ${linea.vehiculoNombre}`;

        lineasAlbaran.push({
          orden,
          tipo: TipoLinea.SERVICIO,
          nombre: `Transporte: ${linea.vehiculoNombre}`,
          descripcion,
          cantidadSolicitada: 1,
          cantidadEntregada: 1,
          unidad: 'ud',
          precioUnitario: linea.precioVenta || 0,
          costeUnitario: linea.costeTotal || 0,
          descuento: 0,
          iva: 21,
          esEditable: true,
          incluidoEnTotal: true,
        });

        linea.incluidoEnAlbaran = true;
      }
    }

    // Gastos -> Servicio
    if (config.incluirGastos) {
      for (const linea of parte.lineasGastos) {
        if (config.soloFacturables && !linea.facturable) continue;
        if (linea.incluidoEnAlbaran) continue;

        orden++;
        lineasAlbaran.push({
          orden,
          tipo: TipoLinea.SERVICIO,
          nombre: `Gasto: ${linea.tipoGastoNombre}`,
          descripcion: linea.descripcion || linea.tipoGastoNombre,
          cantidadSolicitada: 1,
          cantidadEntregada: 1,
          unidad: 'ud',
          precioUnitario: linea.importeFacturable || linea.importe || 0,
          costeUnitario: linea.importe || 0,
          descuento: 0,
          iva: linea.iva || 21,
          esEditable: true,
          incluidoEnTotal: true,
        });

        linea.incluidoEnAlbaran = true;
      }
    }

    if (lineasAlbaran.length === 0) {
      throw new Error('No hay lineas facturables disponibles para generar el albaran');
    }

    // Crear albaran
    const albaran = new AlbaranModel({
      _id: new mongoose.Types.ObjectId(),
      codigo: codigoAlbaran,
      serie: 'ALB',
      numero,
      tipo: TipoAlbaran.VENTA,
      estado: EstadoAlbaran.BORRADOR,
      fecha: new Date(),
      clienteId: parte.clienteId,
      clienteNombre: parte.clienteNombre,
      clienteNif: parte.clienteNif,
      clienteEmail: parte.clienteEmail,
      clienteTelefono: parte.clienteTelefono,
      proyectoId: parte.proyectoId,
      almacenId: opciones.almacenId,
      titulo: `Albaran del parte ${parte.codigo}`,
      descripcion: parte.titulo || parte.descripcion,
      lineas: lineasAlbaran,
      observaciones: opciones.observaciones || `Generado desde parte de trabajo ${parte.codigo}`,
      creadoPor: usuarioId,
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Albaran creado desde parte de trabajo',
        descripcion: `Generado desde parte ${parte.codigo}`,
      }],
    });

    await albaran.save();

    // Actualizar parte con referencia al albaran
    await ParteTrabajoModel.findByIdAndUpdate(id, {
      $push: {
        albaranesGeneradosIds: albaran._id,
        historial: {
          fecha: new Date(),
          usuarioId,
          accion: 'Albaran generado',
          descripcion: `Albaran ${codigoAlbaran} generado desde este parte`,
        },
      },
      // Guardar las lineas marcadas como incluidas en albaran
      lineasPersonal: parte.lineasPersonal,
      lineasMaterial: parte.lineasMaterial,
      lineasMaquinaria: parte.lineasMaquinaria,
      lineasTransporte: parte.lineasTransporte,
      lineasGastos: parte.lineasGastos,
    });

    return albaran;
  }

  // ============================================
  // DUPLICAR PARTE
  // ============================================

  async duplicar(
    id: string,
    dto: DuplicarParteDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IParteTrabajo> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);

    const parteOriginal = await ParteTrabajoModel.findById(id).lean();
    if (!parteOriginal) {
      throw new Error('Parte de trabajo no encontrado');
    }

    // Generar nuevo codigo
    const serie = parteOriginal.serie || 'PT';
    const año = new Date().getFullYear();

    const ultimoParte = await ParteTrabajoModel.findOne({
      serie,
      codigo: new RegExp(`^${serie}${año}-\\d+$`),
    }).sort({ numero: -1 }).lean();

    let numero = 1;
    if (ultimoParte && ultimoParte.numero) {
      numero = ultimoParte.numero + 1;
    }

    const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

    // Preparar datos del nuevo parte
    const nuevoParteData: any = {
      ...parteOriginal,
      _id: new mongoose.Types.ObjectId(),
      codigo,
      numero,
      estado: EstadoParteTrabajo.BORRADOR,
      fecha: dto.fecha || new Date(),
      fechaInicio: null,
      fechaFin: null,
      firmaTecnico: null,
      nombreTecnico: null,
      fechaFirmaTecnico: null,
      firmaCliente: null,
      nombreCliente: null,
      fechaFirmaCliente: null,
      dniCliente: null,
      albaranesGeneradosIds: [],
      creadoPor: usuarioId,
      modificadoPor: null,
      fechaCreacion: new Date(),
      fechaModificacion: null,
      historial: [{
        fecha: new Date(),
        usuarioId,
        accion: 'Parte duplicado',
        descripcion: `Duplicado desde parte ${parteOriginal.codigo}`,
      }],
    };

    // Actualizar cliente si se especifica
    if (dto.clienteId) {
      const ClienteModel = await getClienteModel(String(empresaId), dbConfig);
      const cliente = await ClienteModel.findById(dto.clienteId).lean();
      if (cliente) {
        nuevoParteData.clienteId = dto.clienteId;
        nuevoParteData.clienteNombre = (cliente as any).nombre || (cliente as any).nombreComercial;
        nuevoParteData.clienteNif = (cliente as any).nif || (cliente as any).cif;
        nuevoParteData.clienteEmail = (cliente as any).email;
        nuevoParteData.clienteTelefono = (cliente as any).telefono;
      }
    }

    // Actualizar proyecto si se especifica
    if (dto.proyectoId !== undefined) {
      if (dto.proyectoId) {
        const ProyectoModel = await getProyectoModel(String(empresaId), dbConfig);
        const proyecto = await ProyectoModel.findById(dto.proyectoId).lean();
        if (proyecto) {
          nuevoParteData.proyectoId = dto.proyectoId;
          nuevoParteData.proyectoCodigo = (proyecto as any).codigo;
          nuevoParteData.proyectoNombre = (proyecto as any).nombre || (proyecto as any).titulo;
        }
      } else {
        nuevoParteData.proyectoId = null;
        nuevoParteData.proyectoCodigo = null;
        nuevoParteData.proyectoNombre = null;
      }
    }

    // Limpiar lineas si no se incluyen
    if (dto.incluirLineas === false) {
      nuevoParteData.lineasPersonal = [];
      nuevoParteData.lineasMaterial = [];
      nuevoParteData.lineasMaquinaria = [];
      nuevoParteData.lineasTransporte = [];
      nuevoParteData.lineasGastos = [];
      nuevoParteData.totales = this.calcularTotales(nuevoParteData);
    } else {
      // Resetear flags de incluidoEnAlbaran en las lineas
      ['lineasPersonal', 'lineasMaterial', 'lineasMaquinaria', 'lineasTransporte', 'lineasGastos'].forEach(key => {
        if (nuevoParteData[key]) {
          nuevoParteData[key] = nuevoParteData[key].map((linea: any) => ({
            ...linea,
            _id: new mongoose.Types.ObjectId(),
            incluidoEnAlbaran: false,
          }));
        }
      });
    }

    const nuevoParte = new ParteTrabajoModel(nuevoParteData);
    await nuevoParte.save();

    return nuevoParte;
  }

  // ============================================
  // ESTADISTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);

    const [
      total,
      porEstado,
      porTipo,
      porPrioridad,
      totales,
      completadosEsteMes,
    ] = await Promise.all([
      ParteTrabajoModel.countDocuments({ activo: true }),
      ParteTrabajoModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$estado', count: { $sum: 1 } } },
      ]),
      ParteTrabajoModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$tipo', count: { $sum: 1 } } },
      ]),
      ParteTrabajoModel.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$prioridad', count: { $sum: 1 } } },
      ]),
      ParteTrabajoModel.aggregate([
        { $match: { activo: true } },
        {
          $group: {
            _id: null,
            totalVenta: { $sum: '$totales.totalVenta' },
            totalCoste: { $sum: '$totales.costeTotal' },
            margenTotal: { $sum: '$totales.margenBruto' },
            totalHoras: { $sum: { $reduce: {
              input: '$lineasPersonal',
              initialValue: 0,
              in: { $add: ['$$value', { $add: [{ $ifNull: ['$$this.horasTrabajadas', 0] }, { $ifNull: ['$$this.horasExtras', 0] }] }] }
            } } },
          },
        },
      ]),
      ParteTrabajoModel.countDocuments({
        activo: true,
        estado: EstadoParteTrabajo.COMPLETADO,
        fechaFin: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ]);

    const estadisticasPorEstado: Record<string, number> = {};
    porEstado.forEach((item: any) => {
      estadisticasPorEstado[item._id] = item.count;
    });

    const estadisticasPorTipo: Record<string, number> = {};
    porTipo.forEach((item: any) => {
      estadisticasPorTipo[item._id] = item.count;
    });

    const estadisticasPorPrioridad: Record<string, number> = {};
    porPrioridad.forEach((item: any) => {
      estadisticasPorPrioridad[item._id] = item.count;
    });

    return {
      total,
      porEstado: estadisticasPorEstado,
      porTipo: estadisticasPorTipo,
      porPrioridad: estadisticasPorPrioridad,
      totalVenta: totales[0]?.totalVenta || 0,
      totalCoste: totales[0]?.totalCoste || 0,
      margenTotal: totales[0]?.margenTotal || 0,
      totalHoras: totales[0]?.totalHoras || 0,
      completadosEsteMes,
      pendientesFacturar: estadisticasPorEstado[EstadoParteTrabajo.COMPLETADO] || 0,
      enCurso: estadisticasPorEstado[EstadoParteTrabajo.EN_CURSO] || 0,
      urgentes: estadisticasPorPrioridad[Prioridad.URGENTE] || 0,
    };
  }

  // ============================================
  // PARTES POR PROYECTO
  // ============================================

  async obtenerPorProyecto(
    proyectoId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IParteTrabajo[]> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);

    return ParteTrabajoModel.find({
      proyectoId: new mongoose.Types.ObjectId(proyectoId),
      activo: true,
    })
      .sort({ fecha: -1 })
      .populate('responsableId', 'nombre apellidos')
      .lean();
  }

  // ============================================
  // PARTES POR CLIENTE
  // ============================================

  async obtenerPorCliente(
    clienteId: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IParteTrabajo[]> {
    const ParteTrabajoModel = await this.getModeloParteTrabajo(String(empresaId), dbConfig);

    return ParteTrabajoModel.find({
      clienteId: new mongoose.Types.ObjectId(clienteId),
      activo: true,
    })
      .sort({ fecha: -1 })
      .populate('proyectoId', 'codigo nombre titulo')
      .populate('responsableId', 'nombre apellidos')
      .lean();
  }
}

// Instancia singleton del servicio
export const partesTrabajoService = new PartesTrabajoService();
