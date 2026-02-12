// apps/backend/src/modules/plantillas-documento/plantillas-documento.service.ts
// Servicio para gestión de plantillas de diseño de documentos

import { Model, Types } from 'mongoose';
import PlantillaDocumentoModel, {
  IPlantillaDocumento,
  TipoDocumentoPlantilla,
  EstiloPlantilla,
} from './PlantillaDocumento';
import { obtenerPlantillasDocumentoPredefinidas } from './plantillas-predefinidas';
import { IDatabaseConfig } from '../../types/express';
import { databaseManager } from '../../services/database-manager.service';

// ============================================
// INTERFACES
// ============================================

export interface CreatePlantillaDTO {
  nombre: string;
  descripcion?: string;
  codigo: string;
  tipoDocumento: TipoDocumentoPlantilla;
  estilo?: EstiloPlantilla;
  colores?: Partial<IPlantillaDocumento['colores']>;
  fuentes?: Partial<IPlantillaDocumento['fuentes']>;
  cabecera?: Partial<IPlantillaDocumento['cabecera']>;
  cliente?: Partial<IPlantillaDocumento['cliente']>;
  lineas?: Partial<IPlantillaDocumento['lineas']>;
  totales?: Partial<IPlantillaDocumento['totales']>;
  pie?: Partial<IPlantillaDocumento['pie']>;
  textos?: Partial<IPlantillaDocumento['textos']>;
  margenes?: Partial<IPlantillaDocumento['margenes']>;
  papel?: Partial<IPlantillaDocumento['papel']>;
  esPredeterminada?: boolean;
}

export interface UpdatePlantillaDTO extends Partial<CreatePlantillaDTO> {}

export interface SearchPlantillasDTO {
  tipoDocumento?: TipoDocumentoPlantilla;
  estilo?: EstiloPlantilla;
  activa?: boolean;
  busqueda?: string;
  page?: number;
  limit?: number;
}

// ============================================
// SERVICIO
// ============================================

class PlantillasDocumentoService {
  /**
   * Obtener modelo PlantillaDocumento para una empresa
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IPlantillaDocumento>> {
    const connection = await databaseManager.getEmpresaConnection(empresaId, dbConfig);
    return connection.model<IPlantillaDocumento>('PlantillaDocumento', PlantillaDocumentoModel.schema);
  }

  /**
   * Listar plantillas con filtros
   */
  async listar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    params: SearchPlantillasDTO
  ): Promise<{ data: IPlantillaDocumento[]; pagination: any }> {
    const PlantillaM = await this.getModelo(empresaId, dbConfig);

    const query: any = { empresaId };

    if (params.tipoDocumento) {
      query.tipoDocumento = params.tipoDocumento;
    }
    if (params.estilo) {
      query.estilo = params.estilo;
    }
    if (params.activa !== undefined) {
      query.activa = params.activa;
    }
    if (params.busqueda) {
      query.$or = [
        { nombre: { $regex: params.busqueda, $options: 'i' } },
        { descripcion: { $regex: params.busqueda, $options: 'i' } },
        { codigo: { $regex: params.busqueda, $options: 'i' } },
      ];
    }

    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      PlantillaM.find(query)
        .sort({ tipoDocumento: 1, esPredeterminada: -1, nombre: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PlantillaM.countDocuments(query),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener plantilla por ID
   */
  async obtenerPorId(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string
  ): Promise<IPlantillaDocumento> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('ID de plantilla no válido');
    }

    const PlantillaM = await this.getModelo(empresaId, dbConfig);
    const plantilla = await PlantillaM.findOne({
      _id: new Types.ObjectId(id),
      empresaId,
    }).lean();

    if (!plantilla) {
      throw new Error('Plantilla no encontrada');
    }

    return plantilla;
  }

  /**
   * Obtener plantilla predeterminada por tipo de documento
   */
  async obtenerPredeterminada(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    tipoDocumento: TipoDocumentoPlantilla
  ): Promise<IPlantillaDocumento | null> {
    const PlantillaM = await this.getModelo(empresaId, dbConfig);

    // Buscar la plantilla predeterminada
    let plantilla = await PlantillaM.findOne({
      empresaId,
      tipoDocumento,
      esPredeterminada: true,
      activa: true,
    }).lean();

    // Si no hay predeterminada, buscar la primera activa
    if (!plantilla) {
      plantilla = await PlantillaM.findOne({
        empresaId,
        tipoDocumento,
        activa: true,
      }).lean();
    }

    return plantilla;
  }

  /**
   * Crear nueva plantilla
   */
  async crear(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    data: CreatePlantillaDTO,
    usuarioId?: string
  ): Promise<IPlantillaDocumento> {
    const PlantillaM = await this.getModelo(empresaId, dbConfig);

    // Verificar código único
    const existe = await PlantillaM.findOne({
      empresaId,
      codigo: data.codigo,
    });

    if (existe) {
      throw new Error('Ya existe una plantilla con ese código');
    }

    // Si es predeterminada, quitar predeterminada de otras del mismo tipo
    if (data.esPredeterminada) {
      await PlantillaM.updateMany(
        { empresaId, tipoDocumento: data.tipoDocumento },
        { esPredeterminada: false }
      );
    }

    const plantilla = new PlantillaM({
      ...data,
      empresaId,
      creadoPor: usuarioId && Types.ObjectId.isValid(usuarioId)
        ? new Types.ObjectId(usuarioId)
        : undefined,
    });

    await plantilla.save();
    return plantilla.toObject();
  }

  /**
   * Actualizar plantilla
   */
  async actualizar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string,
    data: UpdatePlantillaDTO,
    usuarioId?: string
  ): Promise<IPlantillaDocumento> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('ID de plantilla no válido');
    }

    const PlantillaM = await this.getModelo(empresaId, dbConfig);

    // Verificar que existe y no es de sistema
    const plantillaActual = await PlantillaM.findOne({
      _id: new Types.ObjectId(id),
      empresaId,
    });

    if (!plantillaActual) {
      throw new Error('Plantilla no encontrada');
    }

    // Verificar código único si se está cambiando
    if (data.codigo && data.codigo !== plantillaActual.codigo) {
      const existe = await PlantillaM.findOne({
        empresaId,
        codigo: data.codigo,
        _id: { $ne: new Types.ObjectId(id) },
      });

      if (existe) {
        throw new Error('Ya existe una plantilla con ese código');
      }
    }

    // Si es predeterminada, quitar predeterminada de otras del mismo tipo
    if (data.esPredeterminada) {
      await PlantillaM.updateMany(
        {
          empresaId,
          tipoDocumento: plantillaActual.tipoDocumento,
          _id: { $ne: new Types.ObjectId(id) },
        },
        { esPredeterminada: false }
      );
    }

    // Preparar actualización
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    if (usuarioId && Types.ObjectId.isValid(usuarioId)) {
      updateData.modificadoPor = new Types.ObjectId(usuarioId);
    }

    const plantilla = await PlantillaM.findOneAndUpdate(
      { _id: new Types.ObjectId(id), empresaId },
      updateData,
      { new: true }
    ).lean();

    if (!plantilla) {
      throw new Error('Error al actualizar la plantilla');
    }

    return plantilla;
  }

  /**
   * Eliminar plantilla
   */
  async eliminar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string
  ): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('ID de plantilla no válido');
    }

    const PlantillaM = await this.getModelo(empresaId, dbConfig);

    // Verificar que existe y no es de sistema
    const plantilla = await PlantillaM.findOne({
      _id: new Types.ObjectId(id),
      empresaId,
    });

    if (!plantilla) {
      throw new Error('Plantilla no encontrada');
    }

    if (plantilla.esPlantillaSistema) {
      throw new Error('No se puede eliminar una plantilla del sistema');
    }

    await PlantillaM.deleteOne({ _id: new Types.ObjectId(id), empresaId });
  }

  /**
   * Duplicar plantilla
   */
  async duplicar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string,
    usuarioId?: string
  ): Promise<IPlantillaDocumento> {
    const original = await this.obtenerPorId(empresaId, dbConfig, id);
    const PlantillaM = await this.getModelo(empresaId, dbConfig);

    // Generar nuevo código único
    let nuevoCodigo = `${original.codigo}_COPIA`;
    let contador = 1;
    while (await PlantillaM.findOne({ empresaId, codigo: nuevoCodigo })) {
      contador++;
      nuevoCodigo = `${original.codigo}_COPIA_${contador}`;
    }

    const nuevaPlantilla = new PlantillaM({
      ...original,
      _id: new Types.ObjectId(),
      nombre: `${original.nombre} (copia)`,
      codigo: nuevoCodigo,
      esPredeterminada: false,
      esPlantillaSistema: false,
      creadoPor: usuarioId && Types.ObjectId.isValid(usuarioId)
        ? new Types.ObjectId(usuarioId)
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await nuevaPlantilla.save();
    return nuevaPlantilla.toObject();
  }

  /**
   * Establecer plantilla como predeterminada
   */
  async establecerPredeterminada(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string
  ): Promise<IPlantillaDocumento> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('ID de plantilla no válido');
    }

    const PlantillaM = await this.getModelo(empresaId, dbConfig);

    const plantilla = await PlantillaM.findOne({
      _id: new Types.ObjectId(id),
      empresaId,
    });

    if (!plantilla) {
      throw new Error('Plantilla no encontrada');
    }

    // Quitar predeterminada de otras del mismo tipo
    await PlantillaM.updateMany(
      { empresaId, tipoDocumento: plantilla.tipoDocumento },
      { esPredeterminada: false }
    );

    // Establecer esta como predeterminada
    plantilla.esPredeterminada = true;
    await plantilla.save();

    return plantilla.toObject();
  }

  /**
   * Obtener plantillas por tipo de documento
   */
  async obtenerPorTipo(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    tipoDocumento: TipoDocumentoPlantilla
  ): Promise<IPlantillaDocumento[]> {
    const PlantillaM = await this.getModelo(empresaId, dbConfig);

    return PlantillaM.find({
      empresaId,
      tipoDocumento,
      activa: true,
    })
      .sort({ esPredeterminada: -1, nombre: 1 })
      .lean();
  }

  /**
   * Obtener estilos disponibles
   */
  obtenerEstilosDisponibles(): { valor: EstiloPlantilla; etiqueta: string }[] {
    return [
      { valor: EstiloPlantilla.MODERNO, etiqueta: 'Moderno' },
      { valor: EstiloPlantilla.CLASICO, etiqueta: 'Clásico' },
      { valor: EstiloPlantilla.MINIMALISTA, etiqueta: 'Minimalista' },
      { valor: EstiloPlantilla.CORPORATIVO, etiqueta: 'Corporativo' },
      { valor: EstiloPlantilla.COLORIDO, etiqueta: 'Colorido' },
    ];
  }

  /**
   * Obtener tipos de documento disponibles
   */
  obtenerTiposDocumento(): { valor: TipoDocumentoPlantilla; etiqueta: string }[] {
    return [
      { valor: TipoDocumentoPlantilla.FACTURA, etiqueta: 'Factura' },
      { valor: TipoDocumentoPlantilla.PRESUPUESTO, etiqueta: 'Presupuesto' },
      { valor: TipoDocumentoPlantilla.ALBARAN, etiqueta: 'Albarán' },
      { valor: TipoDocumentoPlantilla.PEDIDO, etiqueta: 'Pedido' },
      { valor: TipoDocumentoPlantilla.FACTURA_COMPRA, etiqueta: 'Factura de Compra' },
      { valor: TipoDocumentoPlantilla.PEDIDO_COMPRA, etiqueta: 'Pedido de Compra' },
      { valor: TipoDocumentoPlantilla.PARTE_TRABAJO, etiqueta: 'Parte de Trabajo' },
    ];
  }

  /**
   * Inicializar plantillas predefinidas para una empresa
   * Se llama automáticamente cuando se crea una empresa nueva
   */
  async inicializarPlantillas(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    usuarioId?: string
  ): Promise<{ insertadas: number; existentes: number }> {
    const PlantillaM = await this.getModelo(empresaId, dbConfig);

    // Verificar cuántas plantillas ya existen
    const existentes = await PlantillaM.countDocuments({ empresaId });
    if (existentes > 0) {
      return { insertadas: 0, existentes };
    }

    // Obtener todas las plantillas predefinidas
    const plantillasPredefinidas = obtenerPlantillasDocumentoPredefinidas(empresaId);

    // Añadir creadoPor si se proporciona
    const plantillasParaInsertar = plantillasPredefinidas.map(plantilla => ({
      ...plantilla,
      creadoPor: usuarioId && Types.ObjectId.isValid(usuarioId)
        ? new Types.ObjectId(usuarioId)
        : undefined,
    }));

    // Insertar todas las plantillas
    try {
      await PlantillaM.insertMany(plantillasParaInsertar);
      return { insertadas: plantillasParaInsertar.length, existentes: 0 };
    } catch (error: any) {
      console.error('Error al insertar plantillas predefinidas:', error.message);
      // Si falla inserción masiva, intentar uno a uno
      let insertadas = 0;
      for (const plantilla of plantillasParaInsertar) {
        try {
          await PlantillaM.create(plantilla);
          insertadas++;
        } catch (err) {
          // Ignorar duplicados
        }
      }
      return { insertadas, existentes: 0 };
    }
  }
}

export const plantillasDocumentoService = new PlantillasDocumentoService();
export default plantillasDocumentoService;
