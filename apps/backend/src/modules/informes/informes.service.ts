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

    const query: any = { empresaId };

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

    // Si no es plantilla, filtrar por usuario o compartidos
    if (!params.esPlantilla) {
      const orConditions: any[] = [
        { compartido: true },
        { esPlantilla: true },
      ];
      if (usuarioIdValido) {
        orConditions.push({ creadoPor: new Types.ObjectId(usuarioId) });
      }
      query.$or = orConditions;
    }

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
    const informe = await InformeM.findOne({
      _id: new Types.ObjectId(id),
      empresaId,
    }).lean();

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

    // Buscar nombre único
    let nuevoNombre = `${original.nombre} (copia)`;
    let contador = 1;
    while (await InformeM.findOne({ empresaId, nombre: nuevoNombre })) {
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

    // Match inicial con empresaId
    const matchStage: any = { empresaId };

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
        if (value !== undefined && value !== null && !matchStage[key]) {
          // Detectar si es fecha
          if (key.toLowerCase().includes('fecha')) {
            if (key.toLowerCase().includes('desde') || key.toLowerCase().includes('inicio')) {
              matchStage.fecha = { ...matchStage.fecha, $gte: new Date(value) };
            } else if (key.toLowerCase().includes('hasta') || key.toLowerCase().includes('fin')) {
              matchStage.fecha = { ...matchStage.fecha, $lte: new Date(value) };
            }
          }
        }
      }
    }

    pipeline.push({ $match: matchStage });

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
        groupId[agrup.campo] = `$${agrup.campo}`;
      }

      // Campos con agregaciones
      for (const campo of informe.campos || []) {
        if (campo.agregacion && campo.agregacion !== TipoAgregacion.NINGUNA) {
          const agregFunc = this.obtenerFuncionAgregacion(campo.agregacion);
          groupFields[campo.campo] = { [agregFunc]: `$${campo.campo}` };
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
      }
    }

    // Proyección de campos
    if (informe.campos && informe.campos.length > 0) {
      const project: any = {};
      for (const campo of informe.campos) {
        if (campo.visible) {
          project[campo.campo] = 1;
        }
      }
      if (Object.keys(project).length > 0) {
        pipeline.push({ $project: project });
      }
    }

    // Ordenamiento
    if (informe.ordenamiento && informe.ordenamiento.length > 0) {
      const sort: any = {};
      for (const ord of informe.ordenamiento) {
        sort[ord.campo] = ord.direccion === 'desc' ? -1 : 1;
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
        totales[campo.campo] = totalesRaw[`total_${campo.campo}`] || 0;
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
   */
  private construirPipelineTotales(campos: any[]): any[] {
    const totalesGroup: any = { _id: null };

    for (const campo of campos) {
      if (campo.agregacion && campo.agregacion !== TipoAgregacion.NINGUNA) {
        const func = this.obtenerFuncionAgregacion(campo.agregacion);
        totalesGroup[`total_${campo.campo}`] = { [func]: `$${campo.campo}` };
      }
    }

    if (Object.keys(totalesGroup).length <= 1) {
      return [{ $limit: 0 }];
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
    const columns = (informe.campos || [])
      .filter(c => c.visible)
      .map(c => ({
        key: c.campo,
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
        return `${(valor * 100).toFixed(2)}%`;
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
   * Inicializar plantillas predefinidas para una empresa
   */
  async inicializarPlantillas(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    usuarioId: string
  ): Promise<void> {
    const InformeM = await this.getModelo(empresaId, dbConfig);

    // Verificar si ya existen plantillas
    const existentes = await InformeM.countDocuments({ empresaId, esPlantilla: true });
    if (existentes > 0) return;

    // Crear plantillas básicas
    const plantillas = this.obtenerPlantillasBase(usuarioId, empresaId);
    await InformeM.insertMany(plantillas);
  }

  /**
   * Obtener plantillas base para inicialización
   */
  private obtenerPlantillasBase(usuarioId: string, empresaId: string): any[] {
    return [
      // Ventas por período
      {
        empresaId,
        nombre: 'Ventas por Período',
        descripcion: 'Resumen de ventas agrupadas por fecha',
        modulo: ModuloInforme.VENTAS,
        tipo: 'mixto',
        icono: 'TrendingUp',
        fuente: { coleccion: 'facturas' },
        campos: [
          { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA, visible: true, agregacion: TipoAgregacion.NINGUNA },
          { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA },
          { campo: 'baseImponible', etiqueta: 'Base', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA },
        ],
        filtros: [],
        parametros: [
          { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: true },
          { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: true },
        ],
        agrupaciones: [{ campo: 'fecha', orden: 'asc' }],
        ordenamiento: [{ campo: 'fecha', direccion: 'asc' }],
        grafico: { tipo: 'linea', ejeX: 'fecha', ejeY: ['total'], mostrarLeyenda: true },
        config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['pdf', 'excel', 'csv'] },
        esPlantilla: true,
        compartido: true,
        favorito: false,
        orden: 1,
        creadoPor: new Types.ObjectId(usuarioId),
      },
      // Top Clientes
      {
        empresaId,
        nombre: 'Top Clientes',
        descripcion: 'Ranking de clientes por volumen de facturación',
        modulo: ModuloInforme.CLIENTES,
        tipo: 'tabla',
        icono: 'Users',
        fuente: { coleccion: 'facturas' },
        campos: [
          { campo: 'clienteNombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA },
          { campo: 'total', etiqueta: 'Total Facturado', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA },
          { campo: '_id', etiqueta: 'Nº Facturas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.CONTEO },
        ],
        filtros: [],
        parametros: [
          { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
          { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
        ],
        agrupaciones: [{ campo: 'clienteNombre', orden: 'desc' }],
        ordenamiento: [{ campo: 'total', direccion: 'desc' }],
        config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['pdf', 'excel', 'csv'], limite: 20 },
        esPlantilla: true,
        compartido: true,
        favorito: false,
        orden: 2,
        creadoPor: new Types.ObjectId(usuarioId),
      },
      // Stock Valorado
      {
        empresaId,
        nombre: 'Stock Valorado',
        descripcion: 'Inventario actual con valoración',
        modulo: ModuloInforme.STOCK,
        tipo: 'tabla',
        icono: 'Package',
        fuente: { coleccion: 'productos' },
        campos: [
          { campo: 'sku', etiqueta: 'SKU', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA },
          { campo: 'nombre', etiqueta: 'Producto', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA },
          { campo: 'stockActual', etiqueta: 'Stock', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA },
          { campo: 'precioCoste', etiqueta: 'Coste Unit.', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.NINGUNA },
          { campo: 'valorStock', etiqueta: 'Valor Total', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA },
        ],
        filtros: [{ campo: 'activo', operador: OperadorFiltro.IGUAL, valor: true }],
        parametros: [],
        agrupaciones: [],
        ordenamiento: [{ campo: 'valorStock', direccion: 'desc' }],
        config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['pdf', 'excel', 'csv'] },
        esPlantilla: true,
        compartido: true,
        favorito: false,
        orden: 3,
        creadoPor: new Types.ObjectId(usuarioId),
      },
      // Horas por Empleado
      {
        empresaId,
        nombre: 'Horas por Empleado',
        descripcion: 'Resumen de horas trabajadas por empleado',
        modulo: ModuloInforme.PERSONAL,
        tipo: 'mixto',
        icono: 'Clock',
        fuente: { coleccion: 'partes_trabajo' },
        campos: [
          { campo: 'empleadoNombre', etiqueta: 'Empleado', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA },
          { campo: 'horas', etiqueta: 'Horas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.SUMA },
          { campo: 'coste', etiqueta: 'Coste', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA },
        ],
        filtros: [],
        parametros: [
          { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: true },
          { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: true },
        ],
        agrupaciones: [{ campo: 'empleadoNombre', orden: 'asc' }],
        ordenamiento: [{ campo: 'horas', direccion: 'desc' }],
        grafico: { tipo: 'barra_horizontal', ejeX: 'empleadoNombre', ejeY: ['horas'], mostrarLeyenda: false },
        config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['pdf', 'excel', 'csv'] },
        esPlantilla: true,
        compartido: true,
        favorito: false,
        orden: 4,
        creadoPor: new Types.ObjectId(usuarioId),
      },
      // Compras por Proveedor
      {
        empresaId,
        nombre: 'Compras por Proveedor',
        descripcion: 'Ranking de proveedores por volumen de compras',
        modulo: ModuloInforme.COMPRAS,
        tipo: 'tabla',
        icono: 'ShoppingCart',
        fuente: { coleccion: 'facturas_compra' },
        campos: [
          { campo: 'proveedorNombre', etiqueta: 'Proveedor', tipo: TipoCampo.TEXTO, visible: true, agregacion: TipoAgregacion.NINGUNA },
          { campo: 'total', etiqueta: 'Total Comprado', tipo: TipoCampo.MONEDA, visible: true, agregacion: TipoAgregacion.SUMA },
          { campo: '_id', etiqueta: 'Nº Facturas', tipo: TipoCampo.NUMERO, visible: true, agregacion: TipoAgregacion.CONTEO },
        ],
        filtros: [],
        parametros: [
          { nombre: 'fechaDesde', etiqueta: 'Desde', tipo: 'fecha', requerido: false },
          { nombre: 'fechaHasta', etiqueta: 'Hasta', tipo: 'fecha', requerido: false },
        ],
        agrupaciones: [{ campo: 'proveedorNombre', orden: 'desc' }],
        ordenamiento: [{ campo: 'total', direccion: 'desc' }],
        config: { paginacion: true, mostrarTotales: true, exportable: true, formatos: ['pdf', 'excel', 'csv'], limite: 20 },
        esPlantilla: true,
        compartido: true,
        favorito: false,
        orden: 5,
        creadoPor: new Types.ObjectId(usuarioId),
      },
    ];
  }
}

export const informesService = new InformesService();
export default informesService;
