import mongoose, { Model } from 'mongoose';
import { CreateClienteDto, UpdateClienteDto, GetClientesQueryDto } from './clientes.dto';
import { Cliente, ICliente } from '@/modules/clientes/Cliente';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getClienteModel, getTarifaModel, getUserModel } from '@/utils/dynamic-models.helper';
import { parseAdvancedFilters, mergeFilters } from '@/utils/advanced-filters.helper';
import {
  checkClienteIntegrity,
  ReferentialIntegrityError
} from '@/utils/referential-integrity.helper';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface findAllResult {
  clientes: any[];  // ← Tipo flexible para compatibilidad con Mongoose .lean()
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ClientesService {

  /**
   * Obtener modelo de Cliente para una empresa específica
   */
  private async getModeloCliente(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<ICliente>> {
    return await getClienteModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR CLIENTE
  // ============================================

  async crear(
    createClienteDto: CreateClienteDto,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICliente> {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    const clienteData = {
      ...createClienteDto,
      empresaId,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    };

    const cliente = new ClienteModel(clienteData);
    await cliente.save();

    return cliente;
  }

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACIÓN
  // ============================================

  async findAll(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    query: Partial<GetClientesQueryDto>
  ) {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    const {
      search,
      sortBy = 'fechaCreacion',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      activo,
      tipoCliente,
      formaPago,
      vendedorId,
      categoriaId,
      zona,
      tags,
    } = query;

    // Construir filtro (YA NO necesitamos empresaId porque cada empresa tiene su propia DB)
    const filter: any = {};

    // Búsqueda por texto - INCLUYE TODOS LOS CAMPOS
    if (search) {
      filter.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { nombreComercial: { $regex: search, $options: 'i' } },
        { codigo: { $regex: search, $options: 'i' } },
        { nif: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { telefono: { $regex: search, $options: 'i' } },
        { 'direccion.calle': { $regex: search, $options: 'i' } },
        { 'direccion.ciudad': { $regex: search, $options: 'i' } },
        { 'direccion.provincia': { $regex: search, $options: 'i' } },
        { 'direccion.codigoPostal': { $regex: search, $options: 'i' } },
      ];
    }

    // Filtros adicionales
    if (activo !== undefined) {
      filter.activo = activo;
    }

    if (tipoCliente) {
      filter.tipoCliente = tipoCliente;
    }

    if (formaPago) {
      filter.formaPago = formaPago;
    }

    if (vendedorId) {
      filter.vendedorId = vendedorId;
    }

    if (categoriaId) {
      filter.categoriaId = categoriaId;
    }

    if (zona) {
      filter.zona = zona;
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // FILTROS AVANZADOS - Procesar operadores como _ne, _gt, _lt, etc.
    const allowedAdvancedFields = [
      'codigo', 'nombre', 'nombreComercial', 'nif', 'email', 'telefono',
      'tipoCliente', 'riesgoActual', 'limiteCredito', 'activo', 'createdAt',
    ];
    const advancedFilters = parseAdvancedFilters(query as any, allowedAdvancedFields);

    // Combinar filtros existentes con filtros avanzados
    const finalFilter = mergeFilters(filter, advancedFilters);

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar consulta
    const [clientes, total] = await Promise.all([
      ClienteModel.find(finalFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('vendedorId', 'nombre email')
        .populate('categoriaId', 'nombre')
        .lean(),
      ClienteModel.countDocuments(finalFilter),
    ]);

    return {
      clientes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async findById(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICliente | null> {
    const empresaIdStr = String(empresaId);

    // Registrar modelos necesarios para populate en la conexión de la empresa
    // Esto debe hacerse ANTES del populate para que Mongoose encuentre los schemas
    const [ClienteModel] = await Promise.all([
      this.getModeloCliente(empresaIdStr, dbConfig),
      getTarifaModel(empresaIdStr, dbConfig),
      getUserModel(empresaIdStr, dbConfig),
    ]);

    const cliente = await ClienteModel.findOne({
      _id: id,
    })
      .populate('vendedorId', 'nombre email')
      .populate('categoriaId', 'nombre')
      .populate('tarifaId', 'nombre');

    return cliente;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(
    id: string,
    updateClienteDto: UpdateClienteDto,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICliente | null> {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    const cliente = await ClienteModel.findOneAndUpdate(
      { _id: id },
      {
        ...updateClienteDto,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true, runValidators: true }
    );

    return cliente;
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    // Verificar integridad referencial antes de eliminar
    const integrityCheck = await checkClienteIntegrity(
      id,
      String(empresaId),
      dbConfig
    );

    if (!integrityCheck.canDelete) {
      throw new ReferentialIntegrityError(
        'el cliente',
        id,
        integrityCheck.relatedRecords
      );
    }

    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    const resultado = await ClienteModel.deleteOne({
      _id: id,
    });

    return resultado.deletedCount > 0;
  }

  // ============================================
  // ELIMINACIÓN MÚLTIPLE
  // ============================================

  async eliminarMultiples(
    ids: string[],
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{ deleted: number; errors: Array<{ id: string; error: string }> }> {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);
    const errors: Array<{ id: string; error: string }> = [];
    const idsToDelete: string[] = [];

    // Verificar integridad referencial de cada cliente
    for (const id of ids) {
      try {
        const integrityCheck = await checkClienteIntegrity(
          id,
          String(empresaId),
          dbConfig
        );

        if (integrityCheck.canDelete) {
          idsToDelete.push(id);
        } else {
          const messages = integrityCheck.relatedRecords.map(r =>
            `${r.count} ${r.documentType}${r.count > 1 ? 's' : ''}`
          );
          errors.push({
            id,
            error: `Tiene ${messages.join(', ')} asociados`,
          });
        }
      } catch (error: any) {
        errors.push({ id, error: error.message });
      }
    }

    // Eliminar solo los que no tienen dependencias
    let deletedCount = 0;
    if (idsToDelete.length > 0) {
      const resultado = await ClienteModel.deleteMany({
        _id: { $in: idsToDelete },
      });
      deletedCount = resultado.deletedCount || 0;
    }

    return { deleted: deletedCount, errors };
  }

  // ============================================
  // ACTIVAR/DESACTIVAR
  // ============================================

  async cambiarEstado(
    id: string,
    activo: boolean,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICliente | null> {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    const cliente = await ClienteModel.findOneAndUpdate(
      { _id: id },
      {
        activo,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );

    return cliente;
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ) {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    // Recrear el método estático en el modelo dinámico
    const [totales, activos, inactivos, excedenCredito] = await Promise.all([
      ClienteModel.countDocuments({}),
      ClienteModel.countDocuments({ activo: true }),
      ClienteModel.countDocuments({ activo: false }),
      ClienteModel.countDocuments({
        activo: true,
        $expr: { $gt: ['$riesgoActual', '$limiteCredito'] }
      })
    ]);

    const riesgoTotal = await ClienteModel.aggregate([
      { $match: { activo: true } },
      { $group: { _id: null, total: { $sum: '$riesgoActual' } } }
    ]);

    return {
      total: totales,
      activos,
      inactivos,
      excedenCredito,
      riesgoTotal: riesgoTotal[0]?.total || 0
    };
  }

  // ============================================
  // SUBIR ARCHIVO
  // ============================================

  async subirArchivo(
    id: string,
    archivo: {
      nombre: string;
      url: string;
      tipo: string;
      tamaño: number;
    },
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICliente | null> {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    const cliente = await ClienteModel.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          archivos: {
            ...archivo,
            fechaSubida: new Date(),
            subidoPor: usuarioId,
          },
        },
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );

    return cliente;
  }

  // ============================================
  // ELIMINAR ARCHIVO
  // ============================================

  async eliminarArchivo(
    id: string,
    archivoUrl: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICliente | null> {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    const cliente = await ClienteModel.findOneAndUpdate(
      { _id: id },
      {
        $pull: {
          archivos: { url: archivoUrl },
        },
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    );

    return cliente;
  }

  // ============================================
  // VERIFICAR DUPLICADOS
  // ============================================

  async verificarDuplicados(
    nif: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    excludeId?: string
  ): Promise<boolean> {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    const filter: any = { nif };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const count = await ClienteModel.countDocuments(filter);
    return count > 0;
  }

  // ============================================
  // EXPORTAR A CSV
  // ============================================

  async exportarCSV(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    filtros?: Partial<GetClientesQueryDto>
  ): Promise<any[]> {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    const filter: any = {};

    if (filtros?.activo !== undefined) {
      filter.activo = filtros.activo;
    }

    if (filtros?.vendedorId) {
      filter.vendedorId = filtros.vendedorId;
    }

    const clientes = await ClienteModel.find(filter)
      .populate('vendedorId', 'nombre')
      .populate('categoriaId', 'nombre')
      .lean();

    return clientes as any[];
  }

  // ============================================
  // ACTUALIZAR RIESGO
  // ============================================

  async actualizarRiesgo(
    id: string,
    nuevoRiesgo: number,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<ICliente | null> {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    const cliente = await ClienteModel.findOneAndUpdate(
      { _id: id },
      { riesgoActual: nuevoRiesgo },
      { new: true }
    );

    return cliente;
  }

  // ============================================
  // SUGERIR SIGUIENTE CÓDIGO
  // ============================================

  async sugerirSiguienteCodigo(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    prefijo?: string
  ): Promise<string> {
    const ClienteModel = await this.getModeloCliente(String(empresaId), dbConfig);

    // Si no se proporciona prefijo, buscar el patrón más común
    if (!prefijo || prefijo.trim() === '') {
      // Buscar todos los códigos y extraer el prefijo más común
      const clientes = await ClienteModel.find({})
        .select('codigo')
        .sort({ codigo: -1 })
        .limit(10)
        .lean();

      if (clientes.length === 0) {
        return 'CLI-001';
      }

      // Intentar detectar el patrón más común (ej: CLI-, C-, etc.)
      const patrones = clientes
        .map(c => {
          const match = c.codigo?.match(/^([A-Za-z]+-)/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      if (patrones.length > 0) {
        // Usar el patrón más frecuente
        const patronMasComun = patrones.sort(
          (a, b) =>
            patrones.filter(v => v === a).length - patrones.filter(v => v === b).length
        )[patrones.length - 1];

        prefijo = patronMasComun!;
      } else {
        prefijo = 'CLI-';
      }
    }

    // Buscar el último código con ese prefijo
    const regex = new RegExp(`^${prefijo}(\\d+)$`, 'i');
    const clientes = await ClienteModel.find({
      codigo: regex,
    })
      .select('codigo')
      .sort({ codigo: -1 })
      .lean();

    if (clientes.length === 0) {
      // Primer código con este prefijo
      return `${prefijo}001`;
    }

    // Extraer todos los números y encontrar el máximo
    const numeros = clientes
      .map(c => {
        const match = c.codigo?.match(regex);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));

    const maxNumero = Math.max(...numeros);
    const siguienteNumero = maxNumero + 1;

    // Formatear con ceros a la izquierda (mínimo 3 dígitos)
    const digitosMinimos = 3;
    const numeroStr = siguienteNumero.toString().padStart(digitosMinimos, '0');

    return `${prefijo}${numeroStr}`;
  }
}

export const clientesService = new ClientesService();