// ============================================
// SERVICIO DE RESTAURACIÓN PARA TPV
// ============================================

import Empresa from '../empresa/Empresa';
import {
  getSalonModel,
  getMesaModel,
  getCamareroModel,
  getSugerenciaModel,
  getComandaCocinaModel,
} from '../../utils/dynamic-models.helper';

interface ISalonTPV {
  _id: string;
  nombre: string;
  color?: string;
  capacidadTotal: number;
  activo: boolean;
  plano?: { ancho: number; alto: number; escala: number; imagenFondo?: string };
}

interface IMesaTPV {
  _id: string;
  numero: string;
  salonId: string;
  salonNombre?: string;
  capacidad: number;
  estado: 'libre' | 'ocupada' | 'reservada' | 'bloqueada' | 'cuenta_pedida' | 'por_limpiar' | 'fuera_servicio';
  posicion?: { x: number; y: number; rotacion?: number };
  forma?: string;
  dimensiones?: { ancho: number; alto: number };
  activa: boolean;
  ventaActualId?: string;
  camareroId?: string;
  reservaId?: string;
  estadoInfo?: {
    horaOcupacion?: Date;
    numComensales?: number;
    clienteNombre?: string;
    importePendiente?: number;
  };
  grupo?: { grupoId?: string; esPrincipal?: boolean };
}

interface ICamareroTPV {
  _id: string;
  nombre: string;
  alias?: string;
  color?: string;
  estado: string;
  salonesAsignados: string[];
}

interface ISugerenciaTPV {
  _id: string;
  productoOrigenId: string;
  productoSugeridoId: string;
  productoSugeridoNombre: string;
  productoSugeridoPrecio: number;
  tipo: string;
  mensaje?: string;
  prioridad: number;
}

class TPVRestauracionService {
  /**
   * Obtiene todos los salones activos de la empresa
   */
  async getSalones(empresaId: string): Promise<ISalonTPV[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Salon = await getSalonModel(empresaId, dbConfig);

    const salones = await Salon.find({ activo: true })
      .select('nombre color capacidadTotal activo plano')
      .lean();

    return salones.map((s: any) => ({
      _id: s._id.toString(),
      nombre: s.nombre,
      color: s.color,
      capacidadTotal: s.capacidadTotal || 0,
      activo: s.activo,
      plano: s.plano ? {
        ancho: s.plano.ancho || 800,
        alto: s.plano.alto || 600,
        escala: s.plano.escala || 1,
        imagenFondo: s.plano.imagenFondo,
      } : undefined,
    }));
  }

  /**
   * Obtiene las mesas de un salón o todas las mesas
   */
  async getMesas(empresaId: string, salonId?: string): Promise<IMesaTPV[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Mesa = await getMesaModel(empresaId, dbConfig);

    const query: any = { activo: true };
    if (salonId) {
      query.salonId = salonId;
    }

    const mesas = await Mesa.find(query)
      .populate('salonId', 'nombre')
      .select('numero salonId capacidadMaxima capacidadMinima estado posicion forma dimensiones activo estadoInfo grupo')
      .lean();

    return mesas.map((m: any) => ({
      _id: m._id.toString(),
      numero: m.numero,
      salonId: typeof m.salonId === 'object' ? m.salonId._id.toString() : m.salonId,
      salonNombre: typeof m.salonId === 'object' ? m.salonId.nombre : undefined,
      capacidad: m.capacidadMaxima || m.capacidadMinima || 4,
      estado: m.estado,
      posicion: m.posicion ? {
        x: m.posicion.x || 0,
        y: m.posicion.y || 0,
        rotacion: m.posicion.rotacion || 0,
      } : undefined,
      forma: m.forma,
      dimensiones: m.dimensiones ? {
        ancho: m.dimensiones.ancho || 2,
        alto: m.dimensiones.alto || 2,
      } : undefined,
      activa: m.activo,
      ventaActualId: m.estadoInfo?.pedidoId?.toString(),
      camareroId: m.estadoInfo?.camareroId?.toString(),
      reservaId: m.estadoInfo?.reservaId?.toString(),
      estadoInfo: {
        horaOcupacion: m.estadoInfo?.horaOcupacion,
        numComensales: m.estadoInfo?.numComensales,
        clienteNombre: m.estadoInfo?.clienteNombre,
        importePendiente: m.estadoInfo?.importePendiente,
      },
      grupo: m.grupo?.grupoId ? {
        grupoId: m.grupo.grupoId.toString(),
        esPrincipal: m.grupo.esPrincipal || false,
      } : undefined,
    }));
  }

  /**
   * Actualiza el estado de una mesa
   */
  async actualizarEstadoMesa(
    empresaId: string,
    mesaId: string,
    estado: IMesaTPV['estado'],
    datos?: { ventaActualId?: string; camareroId?: string }
  ): Promise<IMesaTPV | null> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Mesa = await getMesaModel(empresaId, dbConfig);

    const updateData: any = { estado, 'estadoInfo.horaUltimaActualizacion': new Date() };

    if (datos?.ventaActualId !== undefined) {
      updateData['estadoInfo.pedidoId'] = datos.ventaActualId || null;
    }
    if (datos?.camareroId !== undefined) {
      updateData['estadoInfo.camareroId'] = datos.camareroId || null;
    }

    // Si se libera la mesa, limpiar datos
    if (estado === 'libre') {
      updateData['estadoInfo.pedidoId'] = null;
      updateData['estadoInfo.camareroId'] = null;
      updateData['estadoInfo.clienteNombre'] = null;
      updateData['estadoInfo.numComensales'] = null;
      updateData['estadoInfo.importePendiente'] = null;
    }

    if (estado === 'ocupada') {
      updateData['estadoInfo.horaOcupacion'] = new Date();
    }

    const mesa = await Mesa.findByIdAndUpdate(mesaId, updateData, { new: true })
      .populate('salonId', 'nombre')
      .lean();

    if (!mesa) return null;

    const m = mesa as any;
    return {
      _id: m._id.toString(),
      numero: m.numero,
      salonId: typeof m.salonId === 'object' ? m.salonId._id.toString() : m.salonId,
      salonNombre: typeof m.salonId === 'object' ? m.salonId.nombre : undefined,
      capacidad: m.capacidadMaxima || m.capacidadMinima || 4,
      estado: m.estado,
      posicion: m.posicion,
      forma: m.forma,
      activa: m.activo,
      ventaActualId: m.estadoInfo?.pedidoId?.toString(),
      camareroId: m.estadoInfo?.camareroId?.toString(),
      reservaId: m.estadoInfo?.reservaId?.toString(),
    };
  }

  /**
   * Obtiene los camareros activos
   */
  async getCamareros(empresaId: string): Promise<ICamareroTPV[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Camarero = await getCamareroModel(empresaId, dbConfig);

    const camareros = await Camarero.find({
      activo: true,
      estado: { $in: ['activo', 'en_descanso'] }, // Solo activos o en descanso
    })
      .select('nombre alias color estado salonesAsignados')
      .lean();

    return camareros.map((c: any) => ({
      _id: c._id.toString(),
      nombre: c.nombre,
      alias: c.alias,
      color: c.color,
      estado: c.estado,
      salonesAsignados: c.salonesAsignados?.map((s: any) => s.toString()) || [],
    }));
  }

  /**
   * Registra propina para un camarero
   */
  async registrarPropina(
    empresaId: string,
    camareroId: string,
    importe: number,
    ventaId: string
  ): Promise<boolean> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Camarero = await getCamareroModel(empresaId, dbConfig);

    const result = await Camarero.findByIdAndUpdate(camareroId, {
      $inc: {
        'propinas.total': importe,
        'propinas.cantidad': 1,
      },
      $push: {
        'propinas.historial': {
          fecha: new Date(),
          importe,
          ventaId,
        },
      },
    });

    return !!result;
  }

  /**
   * Obtiene sugerencias para un producto
   */
  async getSugerenciasProducto(empresaId: string, productoId: string): Promise<ISugerenciaTPV[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Sugerencia = await getSugerenciaModel(empresaId, dbConfig);

    const sugerencias = await Sugerencia.find({
      productoOrigenId: productoId,
      activa: true,
    })
      .populate('productoSugeridoId', 'nombre precios.pvp precios.venta')
      .sort({ prioridad: 1 })
      .limit(5)
      .lean();

    return sugerencias.map((s: any) => {
      const productoSugerido = s.productoSugeridoId;
      return {
        _id: s._id.toString(),
        productoOrigenId: s.productoOrigenId.toString(),
        productoSugeridoId: productoSugerido?._id?.toString() || s.productoSugeridoId.toString(),
        productoSugeridoNombre: productoSugerido?.nombre || 'Producto',
        productoSugeridoPrecio: productoSugerido?.precios?.pvp || productoSugerido?.precios?.venta || 0,
        tipo: s.tipo,
        mensaje: s.mensaje,
        prioridad: s.prioridad,
      };
    });
  }

  /**
   * Registra que una sugerencia fue aceptada
   */
  async aceptarSugerencia(empresaId: string, sugerenciaId: string): Promise<boolean> {
    const dbConfig = await this.getDbConfig(empresaId);
    const Sugerencia = await getSugerenciaModel(empresaId, dbConfig);

    const result = await Sugerencia.findByIdAndUpdate(sugerenciaId, {
      $inc: { vecesAceptada: 1 },
      ultimaAceptacion: new Date(),
    });

    return !!result;
  }

  /**
   * Crea una comanda de cocina
   */
  async crearComandaCocina(
    empresaId: string,
    comanda: {
      lineas: {
        productoId: string;
        nombre: string;
        cantidad: number;
        notas?: string;
        modificadores?: { modificadorId: string; nombre: string; precioExtra: number }[];
        alergenosNombres?: string[];
      }[];
      mesaId?: string;
      mesaNumero?: string;
      salonNombre?: string;
      camareroNombre?: string;
      camareroId?: string;
      notas?: string;
      urgente?: boolean;
      tipoServicio?: 'mesa' | 'barra' | 'llevar' | 'recoger';
    }
  ): Promise<{ comandaId: string | null; pdfBase64?: string }> {
    const dbConfig = await this.getDbConfig(empresaId);
    const ComandaCocina = await getComandaCocinaModel(empresaId, dbConfig);

    // Obtener siguiente número de comanda del día
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const ultimaComanda = await ComandaCocina.findOne({
      createdAt: { $gte: hoy },
    }).sort({ numeroComanda: -1 }).select('numeroComanda').lean();
    const numeroComanda = ((ultimaComanda as any)?.numeroComanda || 0) + 1;

    // Resolver zonaPreparacionId de los productos si no viene del cliente
    let zonaPreparacionId: string | undefined;
    try {
      const { getProductoModel, getZonaPreparacionModel } = await import('../../utils/dynamic-models.helper');
      const ProductoModel = await getProductoModel(empresaId, dbConfig);
      // Buscar zona del primer producto que tenga una configurada
      for (const linea of comanda.lineas) {
        const prod = await ProductoModel.findById(linea.productoId)
          .select('restauracion.zonaPreparacionId')
          .lean();
        if ((prod as any)?.restauracion?.zonaPreparacionId) {
          zonaPreparacionId = (prod as any).restauracion.zonaPreparacionId.toString();
          break;
        }
      }
      // Si no hay zona en productos, usar la primera zona activa
      if (!zonaPreparacionId) {
        const ZonaModel = await getZonaPreparacionModel(empresaId, dbConfig);
        const primeraZona = await ZonaModel.findOne({ activo: true }).select('_id').lean();
        if (primeraZona) {
          zonaPreparacionId = (primeraZona as any)._id.toString();
        }
      }
    } catch (error) {
      console.error('[TPV Restauracion] Error resolviendo zona de preparación:', error);
    }

    // Si no hay zona, no podemos crear la comanda (campo requerido)
    if (!zonaPreparacionId) {
      console.error('[TPV Restauracion] No se encontró zona de preparación');
      return { comandaId: null };
    }

    const nuevaComanda = new ComandaCocina({
      empresaId,
      zonaPreparacionId,
      numeroComanda,
      lineas: comanda.lineas.map((l) => ({
        productoId: l.productoId,
        nombreProducto: l.nombre,
        cantidad: l.cantidad,
        comentario: l.notas,
        modificadores: l.modificadores,
        alergenosNombres: l.alergenosNombres || [],
        estado: 'pendiente',
        prioridad: comanda.urgente ? 'urgente' : 'normal',
      })),
      mesaId: comanda.mesaId,
      numeroMesa: comanda.mesaNumero,
      tipoServicio: comanda.tipoServicio || (comanda.mesaId ? 'mesa' : 'barra'),
      notas: comanda.notas,
      prioridad: comanda.urgente ? 'urgente' : 'normal',
      estado: 'pendiente',
      horaRecepcion: new Date(),
      creadoPor: comanda.camareroId && /^[0-9a-fA-F]{24}$/.test(comanda.camareroId)
        ? comanda.camareroId
        : empresaId, // Usar empresaId como fallback (siempre es un ObjectId válido)
    });

    await nuevaComanda.save();
    const comandaId = nuevaComanda._id?.toString() || null;

    // Marcar la mesa como ocupada si tiene mesaId
    if (comanda.mesaId) {
      try {
        await this.actualizarEstadoMesa(empresaId, comanda.mesaId, 'ocupada', {
          camareroId: comanda.camareroId,
        });
      } catch (error) {
        console.error('[TPV Restauracion] Error actualizando estado de mesa:', error);
      }
    }

    // Generar PDF de ticket de cocina
    let pdfBase64: string | undefined;
    try {
      const { comandaPdfService } = await import('../comandas-cocina/comanda-pdf.service');
      // Poblar datos para el PDF
      const comandaCompleta = await ComandaCocina.findById(comandaId)
        .populate('mesaId', 'numero')
        .populate('zonaPreparacionId', 'nombre')
        .lean();
      if (comandaCompleta) {
        const pdfBuffer = await comandaPdfService.generar(comandaCompleta);
        pdfBase64 = pdfBuffer.toString('base64');
      }
    } catch (error) {
      console.error('[TPV Restauracion] Error generando PDF comanda:', error);
    }

    // Emitir evento SSE
    try {
      const { sseManager } = await import('../../services/sse-manager.service');
      sseManager.broadcastToEmpresa(empresaId, 'nueva-comanda', {
        comandaId,
        numeroComanda,
        mesaId: comanda.mesaId,
        mesaNumero: comanda.mesaNumero,
        zonaPreparacionId,
        camareroId: comanda.camareroId,
        camareroNombre: comanda.camareroNombre,
        tipoServicio: comanda.tipoServicio || (comanda.mesaId ? 'mesa' : 'barra'),
        // Incluir lineas para que el TPV pueda crear la venta local
        lineas: comanda.lineas.map((l: any) => ({
          productoId: l.productoId,
          nombre: l.nombre,
          cantidad: l.cantidad,
          notas: l.notas,
        })),
      });
      if (zonaPreparacionId) {
        sseManager.broadcastToKDS(empresaId, zonaPreparacionId, 'nueva-comanda', {
          comandaId,
          numeroComanda,
        });
      }
    } catch (error) {
      console.error('[TPV Restauracion] Error emitiendo SSE:', error);
    }

    return { comandaId, pdfBase64 };
  }

  /**
   * Obtiene las comandas activas de una mesa (del día actual, no canceladas)
   */
  async getComandasMesa(empresaId: string, mesaId: string): Promise<any[]> {
    const dbConfig = await this.getDbConfig(empresaId);
    const ComandaCocina = await getComandaCocinaModel(empresaId, dbConfig);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const comandas = await ComandaCocina.find({
      mesaId,
      estado: { $nin: ['cancelado'] },
      createdAt: { $gte: hoy },
    })
      .sort({ horaRecepcion: -1 })
      .select('numeroComanda lineas estado horaRecepcion prioridad creadoPor')
      .lean();

    return comandas.map((c: any) => ({
      _id: c._id.toString(),
      numeroComanda: c.numeroComanda,
      estado: c.estado,
      horaRecepcion: c.horaRecepcion,
      prioridad: c.prioridad,
      creadoPor: c.creadoPor?.toString() || 'TPV',
      lineas: (c.lineas || []).map((l: any) => ({
        productoId: l.productoId?.toString(),
        nombreProducto: l.nombreProducto,
        cantidad: l.cantidad,
        estado: l.estado,
        comentario: l.comentario,
        alergenosNombres: l.alergenosNombres,
      })),
    }));
  }

  // Helper para obtener configuración de base de datos de la empresa
  private async getDbConfig(empresaId: string): Promise<any> {
    const empresa = await Empresa.findById(empresaId).lean();
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }

    return {
      host: (empresa as any).database?.host || 'localhost',
      port: (empresa as any).database?.port || 27017,
      name: (empresa as any).database?.name || `empresa_${empresaId}`,
    };
  }
}

export const tpvRestauracionService = new TPVRestauracionService();
