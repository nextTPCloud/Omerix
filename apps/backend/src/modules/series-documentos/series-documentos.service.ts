import mongoose, { Types } from 'mongoose';
import { SerieDocumento, ISerieDocumento, TipoDocumentoSerie } from './SerieDocumento';
import {
  CreateSerieDocumentoDTO,
  UpdateSerieDocumentoDTO,
  SearchSeriesDocumentosDTO,
} from './series-documentos.dto';
import { getDynamicModel } from '@/utils/dynamic-models.helper';

// ============================================
// SERVICIO DE SERIES DE DOCUMENTOS
// ============================================

class SeriesDocumentosService {
  // ============================================
  // OBTENER MODELO DINÁMICO
  // ============================================
  private getModel(dbConfig: any) {
    return getDynamicModel<ISerieDocumento>('SerieDocumento', SerieDocumento.schema, dbConfig);
  }

  // ============================================
  // CRUD BÁSICO
  // ============================================

  /**
   * Crear una nueva serie de documentos
   */
  async crear(
    data: CreateSerieDocumentoDTO,
    usuarioId: Types.ObjectId,
    dbConfig: any
  ): Promise<ISerieDocumento> {
    const Model = this.getModel(dbConfig);

    // Verificar código único para el tipo de documento
    const existente = await Model.findOne({
      codigo: data.codigo.toUpperCase(),
      tipoDocumento: data.tipoDocumento,
    });

    if (existente) {
      throw new Error(`Ya existe una serie con código "${data.codigo}" para este tipo de documento`);
    }

    const serie = new Model({
      ...data,
      codigo: data.codigo.toUpperCase(),
      creadoPor: usuarioId,
      actualizadoPor: usuarioId,
    });

    await serie.save();
    return serie;
  }

  /**
   * Buscar series con filtros y paginación
   */
  async buscar(
    params: SearchSeriesDocumentosDTO,
    dbConfig: any
  ): Promise<{
    data: ISerieDocumento[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const Model = this.getModel(dbConfig);

    const {
      q,
      tipoDocumento,
      activo,
      predeterminada,
      page = 1,
      limit = 25,
      sortBy = 'codigo',
      sortOrder = 'asc',
    } = params;

    const query: any = {};

    // Búsqueda general
    if (q) {
      query.$or = [
        { codigo: { $regex: q, $options: 'i' } },
        { nombre: { $regex: q, $options: 'i' } },
        { descripcion: { $regex: q, $options: 'i' } },
      ];
    }

    // Filtro por tipo de documento
    if (tipoDocumento) {
      query.tipoDocumento = tipoDocumento;
    }

    // Filtro por activo
    if (activo && activo !== 'all') {
      query.activo = activo === 'true';
    }

    // Filtro por predeterminada
    if (predeterminada && predeterminada !== 'all') {
      query.predeterminada = predeterminada === 'true';
    }

    const total = await Model.countDocuments(query);
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const data = await Model.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Añadir previsualización del código
    const dataConPrevisualizacion = data.map((serie: any) => ({
      ...serie,
      previsualizacion: this.generarPrevisualizacion(serie),
    }));

    return {
      data: dataConPrevisualizacion as ISerieDocumento[],
      total,
      page,
      limit,
      pages,
    };
  }

  /**
   * Obtener una serie por ID
   */
  async obtenerPorId(
    id: string,
    dbConfig: any
  ): Promise<ISerieDocumento | null> {
    const Model = this.getModel(dbConfig);

    const serie = await Model.findById(id).lean();
    if (!serie) return null;

    return {
      ...serie,
      previsualizacion: this.generarPrevisualizacion(serie),
    } as ISerieDocumento;
  }

  /**
   * Actualizar una serie
   */
  async actualizar(
    id: string,
    data: UpdateSerieDocumentoDTO,
    usuarioId: Types.ObjectId,
    dbConfig: any
  ): Promise<ISerieDocumento | null> {
    const Model = this.getModel(dbConfig);

    const serie = await Model.findById(id);
    if (!serie) return null;

    // Verificar código único si se está cambiando
    if (data.codigo && data.codigo.toUpperCase() !== serie.codigo) {
      const existente = await Model.findOne({
        codigo: data.codigo.toUpperCase(),
        tipoDocumento: serie.tipoDocumento,
        _id: { $ne: id },
      });

      if (existente) {
        throw new Error(`Ya existe una serie con código "${data.codigo}" para este tipo de documento`);
      }
    }

    // Actualizar campos
    Object.keys(data).forEach((key) => {
      if ((data as any)[key] !== undefined) {
        if (key === 'codigo') {
          (serie as any)[key] = (data as any)[key].toUpperCase();
        } else {
          (serie as any)[key] = (data as any)[key];
        }
      }
    });

    serie.actualizadoPor = usuarioId;
    await serie.save();

    const resultado = serie.toObject();
    return {
      ...resultado,
      previsualizacion: this.generarPrevisualizacion(resultado),
    } as ISerieDocumento;
  }

  /**
   * Eliminar una serie (solo si no está en uso)
   */
  async eliminar(
    id: string,
    dbConfig: any
  ): Promise<boolean> {
    const Model = this.getModel(dbConfig);

    const serie = await Model.findById(id);
    if (!serie) return false;

    // Verificar si es predeterminada
    if (serie.predeterminada) {
      throw new Error('No se puede eliminar la serie predeterminada. Establezca otra como predeterminada primero.');
    }

    await Model.findByIdAndDelete(id);
    return true;
  }

  // ============================================
  // OPERACIONES ESPECIALES
  // ============================================

  /**
   * Obtener series por tipo de documento
   */
  async obtenerPorTipoDocumento(
    tipoDocumento: TipoDocumentoSerie,
    soloActivas: boolean = true,
    dbConfig: any
  ): Promise<ISerieDocumento[]> {
    const Model = this.getModel(dbConfig);

    const query: any = { tipoDocumento };
    if (soloActivas) {
      query.activo = true;
    }

    const series = await Model.find(query)
      .sort({ predeterminada: -1, codigo: 1 })
      .lean();

    return series.map((serie: any) => ({
      ...serie,
      previsualizacion: this.generarPrevisualizacion(serie),
    })) as ISerieDocumento[];
  }

  /**
   * Obtener serie predeterminada para un tipo de documento
   */
  async obtenerPredeterminada(
    tipoDocumento: TipoDocumentoSerie,
    dbConfig: any
  ): Promise<ISerieDocumento | null> {
    const Model = this.getModel(dbConfig);

    const serie = await Model.findOne({
      tipoDocumento,
      predeterminada: true,
      activo: true,
    }).lean();

    if (!serie) return null;

    return {
      ...serie,
      previsualizacion: this.generarPrevisualizacion(serie),
    } as ISerieDocumento;
  }

  /**
   * Establecer serie como predeterminada
   */
  async establecerPredeterminada(
    id: string,
    usuarioId: Types.ObjectId,
    dbConfig: any
  ): Promise<ISerieDocumento | null> {
    const Model = this.getModel(dbConfig);

    const serie = await Model.findById(id);
    if (!serie) return null;

    serie.predeterminada = true;
    serie.actualizadoPor = usuarioId;
    await serie.save(); // El middleware se encarga de quitar predeterminada a las otras

    const resultado = serie.toObject();
    return {
      ...resultado,
      previsualizacion: this.generarPrevisualizacion(resultado),
    } as ISerieDocumento;
  }

  /**
   * Generar siguiente código para una serie
   */
  async generarSiguienteCodigo(
    id: string,
    dbConfig: any
  ): Promise<{ codigo: string; siguienteNumero: number }> {
    const Model = this.getModel(dbConfig);

    const serie = await Model.findById(id);
    if (!serie) {
      throw new Error('Serie no encontrada');
    }

    if (!serie.activo) {
      throw new Error('La serie no está activa');
    }

    const anioActual = new Date().getFullYear();

    // Reiniciar si es necesario
    if (serie.reiniciarAnualmente && serie.ultimoAnioReinicio !== anioActual) {
      serie.siguienteNumero = 1;
      serie.ultimoAnioReinicio = anioActual;
    }

    const codigo = this.generarPrevisualizacion(serie);
    const siguienteNumero = serie.siguienteNumero;

    // Incrementar el número
    serie.siguienteNumero += 1;
    await serie.save();

    return { codigo, siguienteNumero };
  }

  /**
   * Generar código para un tipo de documento usando la serie predeterminada
   */
  async generarCodigoParaTipo(
    tipoDocumento: TipoDocumentoSerie,
    serieId: string | null,
    dbConfig: any
  ): Promise<{ codigo: string; serieId: string; siguienteNumero: number }> {
    const Model = this.getModel(dbConfig);

    let serie: ISerieDocumento | null = null;

    // Si se especifica una serie, usar esa
    if (serieId) {
      serie = await Model.findById(serieId);
      if (!serie) {
        throw new Error('Serie especificada no encontrada');
      }
    } else {
      // Buscar serie predeterminada
      serie = await Model.findOne({
        tipoDocumento,
        predeterminada: true,
        activo: true,
      });

      if (!serie) {
        // Si no hay predeterminada, buscar la primera activa
        serie = await Model.findOne({
          tipoDocumento,
          activo: true,
        }).sort({ codigo: 1 });

        if (!serie) {
          throw new Error(`No hay series configuradas para ${tipoDocumento}`);
        }
      }
    }

    const { codigo, siguienteNumero } = await this.generarSiguienteCodigo(
      serie._id.toString(),
      dbConfig
    );

    return {
      codigo,
      serieId: serie._id.toString(),
      siguienteNumero,
    };
  }

  /**
   * Sugerir próximo código (sin incrementar)
   */
  async sugerirCodigo(
    tipoDocumento: TipoDocumentoSerie,
    serieId: string | null,
    dbConfig: any
  ): Promise<{ codigo: string; serieId: string; siguienteNumero: number }> {
    const Model = this.getModel(dbConfig);

    let serie: ISerieDocumento | null = null;

    if (serieId) {
      serie = await Model.findById(serieId);
    } else {
      serie = await Model.findOne({
        tipoDocumento,
        predeterminada: true,
        activo: true,
      });

      if (!serie) {
        serie = await Model.findOne({
          tipoDocumento,
          activo: true,
        }).sort({ codigo: 1 });
      }
    }

    if (!serie) {
      throw new Error(`No hay series configuradas para ${tipoDocumento}`);
    }

    const codigo = this.generarPrevisualizacion(serie);

    return {
      codigo,
      serieId: serie._id.toString(),
      siguienteNumero: serie.siguienteNumero,
    };
  }

  /**
   * Duplicar una serie
   */
  async duplicar(
    id: string,
    usuarioId: Types.ObjectId,
    dbConfig: any
  ): Promise<ISerieDocumento> {
    const Model = this.getModel(dbConfig);

    const serieOriginal = await Model.findById(id);
    if (!serieOriginal) {
      throw new Error('Serie no encontrada');
    }

    // Generar código único
    let nuevoCodigo = `${serieOriginal.codigo}_COPIA`;
    let contador = 1;
    while (await Model.findOne({ codigo: nuevoCodigo, tipoDocumento: serieOriginal.tipoDocumento })) {
      nuevoCodigo = `${serieOriginal.codigo}_COPIA${contador}`;
      contador++;
    }

    const nuevaSerie = new Model({
      codigo: nuevoCodigo,
      nombre: `${serieOriginal.nombre} (Copia)`,
      descripcion: serieOriginal.descripcion,
      tipoDocumento: serieOriginal.tipoDocumento,
      prefijo: serieOriginal.prefijo,
      sufijo: serieOriginal.sufijo,
      longitudNumero: serieOriginal.longitudNumero,
      siguienteNumero: 1, // Reiniciar numeración
      incluirAnio: serieOriginal.incluirAnio,
      separadorAnio: serieOriginal.separadorAnio,
      reiniciarAnualmente: serieOriginal.reiniciarAnualmente,
      activo: false, // Crear inactiva por seguridad
      predeterminada: false,
      creadoPor: usuarioId,
      actualizadoPor: usuarioId,
    });

    await nuevaSerie.save();

    const resultado = nuevaSerie.toObject();
    return {
      ...resultado,
      previsualizacion: this.generarPrevisualizacion(resultado),
    } as ISerieDocumento;
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Generar previsualización del código
   */
  private generarPrevisualizacion(serie: any): string {
    const anioActual = new Date().getFullYear();

    let numero = serie.siguienteNumero;

    // Simular reinicio anual
    if (serie.reiniciarAnualmente && serie.ultimoAnioReinicio !== anioActual) {
      numero = 1;
    }

    let codigo = '';

    // Prefijo
    if (serie.prefijo) {
      codigo += serie.prefijo;
    }

    // Año
    if (serie.incluirAnio) {
      codigo += anioActual.toString() + (serie.separadorAnio || '/');
    }

    // Número con padding
    codigo += numero.toString().padStart(serie.longitudNumero || 5, '0');

    // Sufijo
    if (serie.sufijo) {
      codigo += serie.sufijo;
    }

    return codigo;
  }

  /**
   * Crear series por defecto para una empresa nueva
   */
  async crearSeriesPorDefecto(
    usuarioId: Types.ObjectId,
    dbConfig: any
  ): Promise<void> {
    const seriesPorDefecto = [
      {
        codigo: 'A',
        nombre: 'Serie Principal Presupuestos',
        tipoDocumento: 'presupuesto' as TipoDocumentoSerie,
        prefijo: 'PRES',
        predeterminada: true,
      },
      {
        codigo: 'A',
        nombre: 'Serie Principal Pedidos',
        tipoDocumento: 'pedido' as TipoDocumentoSerie,
        prefijo: 'PED',
        predeterminada: true,
      },
      {
        codigo: 'A',
        nombre: 'Serie Principal Albaranes',
        tipoDocumento: 'albaran' as TipoDocumentoSerie,
        prefijo: 'ALB',
        predeterminada: true,
      },
      {
        codigo: 'A',
        nombre: 'Serie Principal Facturas',
        tipoDocumento: 'factura' as TipoDocumentoSerie,
        prefijo: 'FAC',
        predeterminada: true,
      },
      {
        codigo: 'R',
        nombre: 'Serie Facturas Rectificativas',
        tipoDocumento: 'factura_rectificativa' as TipoDocumentoSerie,
        prefijo: 'RECT',
        predeterminada: true,
      },
    ];

    for (const serieData of seriesPorDefecto) {
      try {
        await this.crear(serieData, usuarioId, dbConfig);
      } catch (error) {
        // Ignorar si ya existe
        console.log(`Serie ${serieData.codigo} para ${serieData.tipoDocumento} ya existe`);
      }
    }
  }
}

export const seriesDocumentosService = new SeriesDocumentosService();
export default seriesDocumentosService;
