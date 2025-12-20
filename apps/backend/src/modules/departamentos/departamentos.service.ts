import mongoose from 'mongoose';
import { IDatabaseConfig } from '@/models/Empresa';
import { getModeloDepartamento, IDepartamento } from './Departamento';
import {
  CreateDepartamentoDTO,
  UpdateDepartamentoDTO,
  SearchDepartamentosDTO,
} from './departamentos.dto';

// ============================================
// SERVICIO DE DEPARTAMENTOS
// ============================================

export const departamentosService = {
  /**
   * Crear un nuevo departamento
   */
  async crear(
    data: CreateDepartamentoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IDepartamento> {
    const Departamento = await getModeloDepartamento(empresaId, dbConfig);

    // Generar código si no se proporciona
    let codigo = data.codigo;
    if (!codigo) {
      codigo = await (Departamento as any).generarCodigo();
    }

    // Limpiar campos ObjectId vacíos
    const cleanData: any = { ...data };
    if (!cleanData.responsableId) {
      delete cleanData.responsableId;
    }

    const departamento = new Departamento({
      ...cleanData,
      codigo,
      creadoPor: usuarioId,
      modificadoPor: usuarioId,
    });

    await departamento.save();
    return departamento;
  },

  /**
   * Buscar departamentos con filtros y paginación
   */
  async buscar(
    params: SearchDepartamentosDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{
    departamentos: IDepartamento[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const Departamento = await getModeloDepartamento(empresaId, dbConfig);

    const {
      search,
      activo = 'true',
      responsableId,
      page = 1,
      limit = 50,
      sortBy = 'orden',
      sortOrder = 'asc',
    } = params;

    // Construir query
    const query: any = {};

    // Filtro de búsqueda
    if (search) {
      query.$or = [
        { codigo: { $regex: search, $options: 'i' } },
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
      ];
    }

    // Filtro de activo
    if (activo !== 'all') {
      query.activo = activo === 'true';
    }

    // Filtro de responsable
    if (responsableId) {
      query.responsableId = new mongoose.Types.ObjectId(responsableId);
    }

    // Ejecutar query
    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [departamentos, total] = await Promise.all([
      Departamento.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Departamento.countDocuments(query),
    ]);

    return {
      departamentos: departamentos as IDepartamento[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Obtener un departamento por ID
   */
  async obtenerPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IDepartamento | null> {
    const Departamento = await getModeloDepartamento(empresaId, dbConfig);
    return Departamento.findById(id).lean() as Promise<IDepartamento | null>;
  },

  /**
   * Actualizar un departamento
   */
  async actualizar(
    id: string,
    data: UpdateDepartamentoDTO,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IDepartamento | null> {
    const Departamento = await getModeloDepartamento(empresaId, dbConfig);

    // Limpiar campos ObjectId vacíos
    const cleanData: any = { ...data };
    if (cleanData.responsableId === '') {
      cleanData.responsableId = null;
    }

    const departamento = await Departamento.findByIdAndUpdate(
      id,
      {
        ...cleanData,
        modificadoPor: usuarioId,
        fechaModificacion: new Date(),
      },
      { new: true }
    ).lean();

    return departamento as IDepartamento | null;
  },

  /**
   * Eliminar un departamento (soft delete)
   */
  async eliminar(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const Departamento = await getModeloDepartamento(empresaId, dbConfig);

    const result = await Departamento.findByIdAndUpdate(id, {
      activo: false,
      modificadoPor: usuarioId,
      fechaModificacion: new Date(),
    });

    return !!result;
  },

  /**
   * Obtener todos los departamentos activos (para selects)
   */
  async obtenerActivos(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IDepartamento[]> {
    const Departamento = await getModeloDepartamento(empresaId, dbConfig);

    return Departamento.find({ activo: true })
      .sort({ orden: 1, nombre: 1 })
      .lean() as Promise<IDepartamento[]>;
  },

  /**
   * Sugerir siguiente código
   */
  async sugerirCodigo(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<string> {
    const Departamento = await getModeloDepartamento(empresaId, dbConfig);
    return (Departamento as any).generarCodigo();
  },

  /**
   * Buscar códigos existentes por prefijo
   */
  async searchCodigos(
    prefix: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<string[]> {
    const Departamento = await getModeloDepartamento(empresaId, dbConfig);

    // Si no hay prefijo, sugerir el siguiente código
    if (!prefix) {
      const codigo = await (Departamento as any).generarCodigo();
      return [codigo];
    }

    // Buscar códigos que coincidan con el prefijo
    const departamentos = await Departamento.find({
      codigo: { $regex: `^${prefix}`, $options: 'i' },
    })
      .select('codigo')
      .sort({ codigo: 1 })
      .limit(10)
      .lean();

    const codigos = departamentos.map((d) => d.codigo);

    // Si no hay resultados, sugerir el siguiente código basado en el prefijo
    if (codigos.length === 0) {
      return [`${prefix.toUpperCase()}001`];
    }

    // Agregar sugerencia del siguiente código
    const ultimoCodigo = codigos[codigos.length - 1];
    const match = ultimoCodigo.match(/(\D+)(\d+)$/);
    if (match) {
      const baseCode = match[1];
      const numero = parseInt(match[2]) + 1;
      const siguienteCodigo = `${baseCode}${numero.toString().padStart(match[2].length, '0')}`;
      if (!codigos.includes(siguienteCodigo)) {
        codigos.push(siguienteCodigo);
      }
    }

    return codigos;
  },
};
