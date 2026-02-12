// apps/backend/src/modules/informes/informes.service.ts

import { Model, Types, Connection } from 'mongoose';
import InformeModel, {
  IInforme,
  ModuloInforme,
  TipoCampo,
  TipoAgregacion,
  OperadorFiltro,
  CATALOGO_COLECCIONES,
} from './Informe';
import { obtenerInformesPredefinidos } from './informes-predefinidos';
import {
  CreateInformeDTO,
  UpdateInformeDTO,
  SearchInformesDTO,
  EjecutarInformeDTO,
  ExportarInformeDTO,
} from './informes.dto';
import { IDatabaseConfig } from '../../types/express';
import { databaseManager } from '../../services/database-manager.service';
import { exportService } from '../export/export.service';

// ============================================
// INTERFACES
// ============================================

interface ResultadoInforme {
  datos: any[];
  totales?: Record<string, number>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ResultadoExportacion {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

// ============================================
// SERVICIO
// ============================================

class InformesService {
  /**
   * Obtener modelo Informe para una empresa
   */
  private async getModelo(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IInforme>> {
    const connection = await databaseManager.getEmpresaConnection(empresaId, dbConfig);
    return connection.model<IInforme>('Informe', InformeModel.schema);
  }

  /**
   * Obtener colección dinámica para ejecutar consultas
   */
  private async getColeccion(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    coleccion: string
  ): Promise<any> {
    const connection = await databaseManager.getEmpresaConnection(empresaId, dbConfig);
    return connection.collection(coleccion);
  }

  /**
   * Listar informes
   */
  async listar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    params: SearchInformesDTO,
    usuarioId: string
  ): Promise<{ data: IInforme[]; pagination: any }> {
    const InformeM = await this.getModelo(empresaId, dbConfig);

    // No filtramos por empresaId porque cada empresa tiene su propia BD
    const query: any = {};

    // Validar usuarioId
    const usuarioIdValido = usuarioId && Types.ObjectId.isValid(usuarioId);

    // Filtros
    if (params.modulo) {
      query.modulo = params.modulo;
    }
    if (params.tipo) {
      query.tipo = params.tipo;
    }
    if (params.esPlantilla !== undefined) {
      query.esPlantilla = params.esPlantilla;
    }
    if (params.favorito && usuarioIdValido) {
      query.favorito = true;
      query.creadoPor = new Types.ObjectId(usuarioId);
    }
    if (params.busqueda) {
      query.$or = [
        { nombre: { $regex: params.busqueda, $options: 'i' } },
        { descripcion: { $regex: params.busqueda, $options: 'i' } },
      ];
    }

    // Nota: Ya no filtramos por compartido/esPlantilla/creadoPor
    // porque cada empresa tiene su propia BD y todos los informes son accesibles

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const sortDir = params.orderDir === 'desc' ? -1 : 1;
    const sort: any = { [params.orderBy || 'nombre']: sortDir };

    const [data, total] = await Promise.all([
      InformeM.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      InformeM.countDocuments(query),
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
   * Obtener informe por ID
   */
  async obtenerPorId(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string
  ): Promise<IInforme> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('ID de informe no válido');
    }

    const InformeM = await this.getModelo(empresaId, dbConfig);
    // No filtramos por empresaId porque cada empresa tiene su propia BD
    const informe = await InformeM.findById(id).lean();

    if (!informe) {
      throw new Error('Informe no encontrado');
    }

    return informe;
  }

  /**
   * Crear informe
   */
  async crear(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    data: CreateInformeDTO,
    usuarioId: string
  ): Promise<IInforme> {
    const InformeM = await this.getModelo(empresaId, dbConfig);

    // Verificar nombre único
    const existe = await InformeM.findOne({
      empresaId,
      nombre: data.nombre,
    });

    if (existe) {
      throw new Error('Ya existe un informe con ese nombre');
    }

    // Validar usuarioId
    let creadoPorId: Types.ObjectId | undefined;
    if (usuarioId && Types.ObjectId.isValid(usuarioId)) {
      creadoPorId = new Types.ObjectId(usuarioId);
    }

    const informe = new InformeM({
      ...data,
      empresaId,
      creadoPor: creadoPorId,
    });

    await informe.save();
    return informe.toObject();
  }

  /**
   * Actualizar informe
   */
  async actualizar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string,
    data: UpdateInformeDTO,
    usuarioId: string
  ): Promise<IInforme> {
    const InformeM = await this.getModelo(empresaId, dbConfig);

    // Validar id
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('ID de informe no válido');
    }

    // Verificar nombre único si se está cambiando
    if (data.nombre) {
      const existe = await InformeM.findOne({
        empresaId,
        nombre: data.nombre,
        _id: { $ne: new Types.ObjectId(id) },
      });

      if (existe) {
        throw new Error('Ya existe un informe con ese nombre');
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // Añadir modificadoPor solo si es válido
    if (usuarioId && Types.ObjectId.isValid(usuarioId)) {
      updateData.modificadoPor = new Types.ObjectId(usuarioId);
    }

    const informe = await InformeM.findOneAndUpdate(
      { _id: new Types.ObjectId(id), empresaId },
      updateData,
      { new: true }
    ).lean();

    if (!informe) {
      throw new Error('Informe no encontrado');
    }

    return informe;
  }

  /**
   * Eliminar informe
   */
  async eliminar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string
  ): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('ID de informe no válido');
    }

    const InformeM = await this.getModelo(empresaId, dbConfig);

    const result = await InformeM.deleteOne({
      _id: new Types.ObjectId(id),
      empresaId,
    });

    if (result.deletedCount === 0) {
      throw new Error('Informe no encontrado');
    }
  }

  /**
   * Duplicar informe
   */
  async duplicar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string,
    usuarioId: string
  ): Promise<IInforme> {
    const original = await this.obtenerPorId(empresaId, dbConfig, id);
    const InformeM = await this.getModelo(empresaId, dbConfig);

    // Buscar nombre único (sin filtrar por empresaId, cada empresa tiene su BD)
    let nuevoNombre = `${original.nombre} (copia)`;
    let contador = 1;
    while (await InformeM.findOne({ nombre: nuevoNombre })) {
      contador++;
      nuevoNombre = `${original.nombre} (copia ${contador})`;
    }

    // Validar usuarioId
    let creadoPorId: Types.ObjectId | undefined;
    if (usuarioId && Types.ObjectId.isValid(usuarioId)) {
      creadoPorId = new Types.ObjectId(usuarioId);
    }

    const nuevoInforme = new InformeM({
      ...original,
      _id: new Types.ObjectId(),
      nombre: nuevoNombre,
      esPlantilla: false,
      creadoPor: creadoPorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await nuevoInforme.save();
    return nuevoInforme.toObject();
  }

  /**
   * Marcar/desmarcar como favorito
   */
  async toggleFavorito(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string
  ): Promise<IInforme> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('ID de informe no válido');
    }

    const InformeM = await this.getModelo(empresaId, dbConfig);

    const informe = await InformeM.findOne({
      _id: new Types.ObjectId(id),
      empresaId,
    });

    if (!informe) {
      throw new Error('Informe no encontrado');
    }

    informe.favorito = !informe.favorito;
    await informe.save();

    return informe.toObject();
  }

  /**
   * Ejecutar informe y obtener datos
   */
  async ejecutar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string,
    params: EjecutarInformeDTO
  ): Promise<ResultadoInforme> {
    const informe = await this.obtenerPorId(empresaId, dbConfig, id);
    return this.ejecutarDefinicion(empresaId, dbConfig, informe, params);
  }

  /**
   * Ejecutar definición de informe (usado también por IA)
   */
  async ejecutarDefinicion(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    informe: Partial<IInforme>,
    params: EjecutarInformeDTO
  ): Promise<ResultadoInforme> {
    const coleccion = await this.getColeccion(
      empresaId,
      dbConfig,
      informe.fuente!.coleccion
    );

    // Construir pipeline de agregación
    const pipeline: any[] = [];

    // Match inicial (sin empresaId, cada empresa tiene su propia BD)
    const matchStage: any = {};

    // Aplicar filtros definidos
    if (informe.filtros && informe.filtros.length > 0) {
      for (const filtro of informe.filtros) {
        // Si es un parámetro, usar el valor proporcionado
        const valor = filtro.parametro && params.parametros
          ? params.parametros[filtro.parametro]
          : filtro.valor;

        if (valor !== undefined && valor !== null && valor !== '') {
          const condicion = this.construirCondicionFiltro(
            filtro.campo,
            filtro.operador,
            valor,
            filtro.valor2
          );
          Object.assign(matchStage, condicion);
        }
      }
    }

    // Aplicar parámetros adicionales
    if (params.parametros) {
      for (const [key, value] of Object.entries(params.parametros)) {
        if (value !== undefined && value !== null && value !== '') {
          // Detectar si es fecha
          if (key.toLowerCase().includes('fecha')) {
            if (key.toLowerCase().includes('desde') || key.toLowerCase().includes('inicio')) {
              matchStage.fecha = { ...matchStage.fecha, $gte: new Date(value) };
            } else if (key.toLowerCase().includes('hasta') || key.toLowerCase().includes('fin')) {
              matchStage.fecha = { ...matchStage.fecha, $lte: new Date(value) };
            }
          } else {
            // Otros parámetros (estado, serie, etc.) se aplican directamente
            // Solo aplicar si el campo no está ya filtrado
            if (!matchStage[key]) {
              // Buscar definición del parámetro para saber si es texto (búsqueda parcial)
              const paramDef = informe.parametros?.find(p => p.nombre === key);
              if (paramDef?.tipo === 'texto' && typeof value === 'string') {
                // Para campos de texto usar búsqueda parcial (regex)
                matchStage[key] = { $regex: value, $options: 'i' };
              } else {
                matchStage[key] = value;
              }
            }
          }
        }
      }
    }

    pipeline.push({ $match: matchStage });

    // Unwind de array embebido (útil para líneas de facturas, etc.)
    if (informe.fuente?.unwindArray) {
      pipeline.push({
        $unwind: {
          path: `$${informe.fuente.unwindArray}`,
          preserveNullAndEmptyArrays: false,
        },
      });
    }

    // Joins (lookups)
    if (informe.fuente?.joins && informe.fuente.joins.length > 0) {
      for (const join of informe.fuente.joins) {
        pipeline.push({
          $lookup: {
            from: join.coleccion,
            localField: join.campoLocal,
            foreignField: join.campoForaneo,
            as: join.alias,
          },
        });
        pipeline.push({
          $unwind: {
            path: `$${join.alias}`,
            preserveNullAndEmptyArrays: true,
          },
        });
      }
    }

    // Agrupaciones
    if (informe.agrupaciones && informe.agrupaciones.length > 0) {
      const groupId: any = {};
      const groupFields: any = {};

      for (const agrup of informe.agrupaciones) {
        // Aplanar campo de agrupación si contiene puntos
        const campoAplanado = agrup.campo.includes('.') ? agrup.campo.replace(/\./g, '_') : agrup.campo;
        groupId[campoAplanado] = `$${agrup.campo}`;
      }

      // Campos con agregaciones
      // IMPORTANTE: MongoDB no permite crear campos con puntos en el nombre
      // Por eso usamos campoAplanado como key, pero el valor referencia el campo original
      for (const campo of informe.campos || []) {
        if (campo.agregacion && campo.agregacion !== TipoAgregacion.NINGUNA) {
          const agregFunc = this.obtenerFuncionAgregacion(campo.agregacion);
          // Usar campo aplanado como key (sin puntos) pero referencia al campo original
          const campoAplanado = campo.campo.includes('.') ? campo.campo.replace(/\./g, '_') : campo.campo;
          groupFields[campoAplanado] = { [agregFunc]: `$${campo.campo}` };
        }
      }

      if (Object.keys(groupFields).length > 0) {
        pipeline.push({
          $group: {
            _id: Object.keys(groupId).length > 0 ? groupId : null,
            ...groupFields,
            count: { $sum: 1 },
          },
        });

        // Si hubo agrupación, necesitamos proyectar los campos aplanados con sus nombres originales
        // para que la proyección posterior funcione correctamente
        const projectAfterGroup: any = { _id: 0 };
        for (const agrup of informe.agrupaciones) {
          const campoAplanado = agrup.campo.includes('.') ? agrup.campo.replace(/\./g, '_') : agrup.campo;
          projectAfterGroup[agrup.campo] = `$_id.${campoAplanado}`;
        }
        for (const campo of informe.campos || []) {
          if (campo.agregacion && campo.agregacion !== TipoAgregacion.NINGUNA) {
            const campoAplanado = campo.campo.includes('.') ? campo.campo.replace(/\./g, '_') : campo.campo;
            projectAfterGroup[campo.campo] = `$${campoAplanado}`;
          }
        }
        projectAfterGroup.count = 1;
        pipeline.push({ $project: projectAfterGroup });
      }
    }

    // Proyección de campos (aplanando campos anidados)
    if (informe.campos && informe.campos.length > 0) {
      const project: any = { _id: 0 };
      for (const campo of informe.campos) {
        if (campo.visible) {
          // Si el campo contiene punto, es un campo anidado - usamos alias para aplanarlo
          if (campo.campo.includes('.')) {
            project[campo.campo.replace(/\./g, '_')] = `$${campo.campo}`;
          } else {
            project[campo.campo] = 1;
          }
        }
      }
      if (Object.keys(project).length > 1) {
        pipeline.push({ $project: project });
      }
    }

    // Ordenamiento (usando campos aplanados si contienen puntos)
    if (informe.ordenamiento && informe.ordenamiento.length > 0) {
      const sort: any = {};
      for (const ord of informe.ordenamiento) {
        // Aplanar nombre del campo si contiene puntos (después de $project)
        const campoOrden = ord.campo.includes('.') ? ord.campo.replace(/\./g, '_') : ord.campo;
        sort[campoOrden] = ord.direccion === 'desc' ? -1 : 1;
      }
      pipeline.push({ $sort: sort });
    }

    // Facet para paginación y totales
    const page = params.page || 1;
    const limit = params.limit || 100;
    const skip = (page - 1) * limit;

    const facetPipeline = [
      ...pipeline,
      {
        $facet: {
          datos: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: 'count' }],
          totales: this.construirPipelineTotales(informe.campos || []),
        },
      },
    ];

    const result = await coleccion.aggregate(facetPipeline).toArray();

    const datos = result[0]?.datos || [];
    const totalCount = result[0]?.total[0]?.count || 0;
    const totalesRaw = result[0]?.totales[0] || {};

    // Procesar totales
    const totales: Record<string, number> = {};
    for (const campo of informe.campos || []) {
      if (campo.agregacion && campo.agregacion !== TipoAgregacion.NINGUNA) {
        // Usar clave aplanada para acceder a los totales
        const campoAplanado = campo.campo.replace(/\./g, '_');
        totales[campo.campo] = totalesRaw[`total_${campoAplanado}`] || 0;
      }
    }

    return {
      datos,
      totales: Object.keys(totales).length > 0 ? totales : undefined,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Construir condición de filtro MongoDB
   */
  private construirCondicionFiltro(
    campo: string,
    operador: OperadorFiltro,
    valor: any,
    valor2?: any
  ): any {
    switch (operador) {
      case OperadorFiltro.IGUAL:
        return { [campo]: valor };
      case OperadorFiltro.DIFERENTE:
        return { [campo]: { $ne: valor } };
      case OperadorFiltro.CONTIENE:
        return { [campo]: { $regex: valor, $options: 'i' } };
      case OperadorFiltro.COMIENZA:
        return { [campo]: { $regex: `^${valor}`, $options: 'i' } };
      case OperadorFiltro.TERMINA:
        return { [campo]: { $regex: `${valor}$`, $options: 'i' } };
      case OperadorFiltro.MAYOR:
        return { [campo]: { $gt: valor } };
      case OperadorFiltro.MAYOR_IGUAL:
        return { [campo]: { $gte: valor } };
      case OperadorFiltro.MENOR:
        return { [campo]: { $lt: valor } };
      case OperadorFiltro.MENOR_IGUAL:
        return { [campo]: { $lte: valor } };
      case OperadorFiltro.ENTRE:
        return { [campo]: { $gte: valor, $lte: valor2 } };
      case OperadorFiltro.EN:
        return { [campo]: { $in: Array.isArray(valor) ? valor : [valor] } };
      case OperadorFiltro.NO_EN:
        return { [campo]: { $nin: Array.isArray(valor) ? valor : [valor] } };
      case OperadorFiltro.EXISTE:
        return { [campo]: { $exists: true, $ne: null } };
      case OperadorFiltro.NO_EXISTE:
        return { [campo]: { $exists: false } };
      default:
        return { [campo]: valor };
    }
  }

  /**
   * Obtener función de agregación MongoDB
   */
  private obtenerFuncionAgregacion(tipo: TipoAgregacion): string {
    switch (tipo) {
      case TipoAgregacion.SUMA:
        return '$sum';
      case TipoAgregacion.PROMEDIO:
        return '$avg';
      case TipoAgregacion.CONTEO:
        return '$sum';
      case TipoAgregacion.MIN:
        return '$min';
      case TipoAgregacion.MAX:
        return '$max';
      default:
        return '$sum';
    }
  }

  /**
   * Construir pipeline para totales
   * IMPORTANTE: Este pipeline se ejecuta después de la proyección que aplana campos anidados
   * Por lo tanto, debemos usar el nombre aplanado del campo (con _ en lugar de .)
   */
  private construirPipelineTotales(campos: any[]): any[] {
    const totalesGroup: any = { _id: null };

    for (const campo of campos) {
      if (campo.agregacion && campo.agregacion !== TipoAgregacion.NINGUNA) {
        const func = this.obtenerFuncionAgregacion(campo.agregacion);
        // Aplanar nombre del campo - tanto para la clave como para la referencia
        // porque el $facet opera sobre datos ya proyectados donde los campos
        // con puntos fueron renombrados a guiones bajos
        const campoAplanado = campo.campo.replace(/\./g, '_');
        // Usar el campo aplanado en la referencia $ también
        totalesGroup[`total_${campoAplanado}`] = { [func]: `$${campoAplanado}` };
      }
    }

    if (Object.keys(totalesGroup).length <= 1) {
      // No hay campos con agregación - retornar pipeline que no devuelve documentos
      // Usamos $limit: 1 y $group para devolver un documento vacío
      return [{ $group: { _id: null } }];
    }

    return [{ $group: totalesGroup }];
  }

  /**
   * Exportar informe
   */
  async exportar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    id: string,
    params: ExportarInformeDTO
  ): Promise<ResultadoExportacion> {
    const informe = await this.obtenerPorId(empresaId, dbConfig, id);

    // Ejecutar informe sin paginación
    const resultado = await this.ejecutarDefinicion(empresaId, dbConfig, informe, {
      parametros: params.parametros,
      limit: 10000, // Límite máximo para exportación
    });

    // Preparar columnas para exportación
    // Usar claves aplanadas para campos anidados (dot -> underscore)
    const columns = (informe.campos || [])
      .filter(c => c.visible)
      .map(c => ({
        key: c.campo.includes('.') ? c.campo.replace(/\./g, '_') : c.campo,
        label: c.etiqueta,
        format: (value: any) => this.formatearValor(value, c.tipo),
      }));

    // Preparar estadísticas si hay totales
    const stats = resultado.totales
      ? Object.entries(resultado.totales).map(([key, value]) => {
          const campo = informe.campos?.find(c => c.campo === key);
          return {
            label: campo?.etiqueta || key,
            value: this.formatearValor(value, campo?.tipo || TipoCampo.NUMERO),
          };
        })
      : undefined;

    const filename = `${informe.nombre}_${new Date().toISOString().split('T')[0]}`;

    switch (params.formato) {
      case 'excel':
        const excelBuffer = await exportService.exportToExcel({
          filename,
          title: informe.nombre,
          subtitle: informe.descripcion,
          columns,
          data: resultado.datos,
          stats,
        });
        return {
          buffer: excelBuffer,
          filename: `${filename}.xlsx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

      case 'pdf':
        const pdfBuffer = await exportService.exportToPDF({
          filename,
          title: informe.nombre,
          subtitle: informe.descripcion,
          columns,
          data: resultado.datos,
          stats,
        });
        return {
          buffer: pdfBuffer,
          filename: `${filename}.pdf`,
          mimeType: 'application/pdf',
        };

      case 'csv':
      default:
        const csvBuffer = await exportService.exportToCSV({
          filename,
          columns,
          data: resultado.datos,
        });
        return {
          buffer: csvBuffer,
          filename: `${filename}.csv`,
          mimeType: 'text/csv',
        };
    }
  }

  /**
   * Formatear valor según tipo
   */
  private formatearValor(valor: any, tipo: TipoCampo): string {
    if (valor === null || valor === undefined) return '';

    switch (tipo) {
      case TipoCampo.MONEDA:
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }).format(valor);
      case TipoCampo.NUMERO:
        return new Intl.NumberFormat('es-ES').format(valor);
      case TipoCampo.PORCENTAJE:
        // El valor ya viene como porcentaje (ej: 35.07 = 35.07%), no multiplicar por 100
        return `${Number(valor).toFixed(2)}%`;
      case TipoCampo.FECHA:
        return new Date(valor).toLocaleDateString('es-ES');
      case TipoCampo.BOOLEAN:
        return valor ? 'Sí' : 'No';
      default:
        return String(valor);
    }
  }

  /**
   * Obtener plantillas predefinidas
   */
  async obtenerPlantillas(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    modulo?: ModuloInforme
  ): Promise<IInforme[]> {
    const InformeM = await this.getModelo(empresaId, dbConfig);

    const query: any = {
      empresaId,
      esPlantilla: true,
    };

    if (modulo) {
      query.modulo = modulo;
    }

    return InformeM.find(query).sort({ orden: 1, nombre: 1 }).lean();
  }

  /**
   * Obtener catálogo de colecciones y campos disponibles
   */
  obtenerCatalogo(modulo?: ModuloInforme): typeof CATALOGO_COLECCIONES | any {
    if (modulo) {
      return CATALOGO_COLECCIONES[modulo] || [];
    }
    return CATALOGO_COLECCIONES;
  }

  /**
   * Debug: obtener info directa de la colección (TEMPORAL)
   */
  async debug(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<any> {
    const InformeM = await this.getModelo(empresaId, dbConfig);

    // Contar documentos (cada empresa tiene su propia BD, no necesita filtrar por empresaId)
    const total = await InformeM.countDocuments({});
    const plantillas = await InformeM.countDocuments({ esPlantilla: true });
    const compartidos = await InformeM.countDocuments({ compartido: true });

    // Obtener un ejemplo de documento
    const ejemplo = await InformeM.findOne({}).lean();

    // Obtener los primeros 5 informes
    const primeros5 = await InformeM.find({}).limit(5).lean();

    return {
      total,
      plantillas,
      compartidos,
      ejemplo: ejemplo ? {
        _id: ejemplo._id,
        nombre: ejemplo.nombre,
        modulo: ejemplo.modulo,
        esPlantilla: ejemplo.esPlantilla,
        compartido: ejemplo.compartido,
      } : null,
      primeros5: primeros5.map(i => ({
        _id: i._id,
        nombre: i.nombre,
        modulo: i.modulo,
        esPlantilla: i.esPlantilla,
        compartido: i.compartido,
      })),
    };
  }

  /**
   * Inicializar plantillas predefinidas para una empresa
   * Se llama automáticamente cuando se crea una empresa nueva
   */
  async inicializarPlantillas(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    usuarioId?: string,
    forzar: boolean = false
  ): Promise<{ insertados: number; existentes: number; eliminados?: number }> {
    const InformeM = await this.getModelo(empresaId, dbConfig);

    // Verificar cuántas plantillas ya existen (sin filtrar por empresaId, cada empresa tiene su BD)
    const existentes = await InformeM.countDocuments({ esPlantilla: true });

    // Si se fuerza, eliminar las plantillas existentes primero
    let eliminados = 0;
    if (forzar && existentes > 0) {
      const resultadoEliminacion = await InformeM.deleteMany({ esPlantilla: true });
      eliminados = resultadoEliminacion.deletedCount || 0;
    } else if (existentes > 0) {
      return { insertados: 0, existentes };
    }

    // Obtener todos los informes predefinidos (sin empresaId, cada empresa tiene su BD)
    const informesPredefinidos = obtenerInformesPredefinidos();

    // Añadir creadoPor si se proporciona
    const informesParaInsertar = informesPredefinidos.map(informe => ({
      ...informe,
      creadoPor: usuarioId && Types.ObjectId.isValid(usuarioId)
        ? new Types.ObjectId(usuarioId)
        : undefined,
    }));

    // Insertar todos los informes
    try {
      const resultado = await InformeM.insertMany(informesParaInsertar);
      return { insertados: resultado.length, existentes: 0, eliminados };
    } catch (error: any) {
      // Si falla inserción masiva, intentar uno a uno
      let insertados = 0;
      for (const informe of informesParaInsertar) {
        try {
          await InformeM.create(informe);
          insertados++;
        } catch (err: any) {
          // Ignorar errores individuales
        }
      }
      return { insertados, existentes: 0, eliminados };
    }
  }
}

export const informesService = new InformesService();
export default informesService;
