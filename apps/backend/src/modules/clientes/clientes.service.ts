import mongoose from 'mongoose';
import { CreateClienteDto, UpdateClienteDto, GetClientesQueryDto } from './clientes.dto';
import { Cliente, ICliente } from '@/models/Cliente';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface ObtenerTodosResult {
  clientes: any[];  // ← Tipo flexible para compatibilidad con Mongoose .lean()
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ClientesService {
  
  // ============================================
  // CREAR CLIENTE
  // ============================================
  
  async crear(
    createClienteDto: CreateClienteDto,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId
  ): Promise<ICliente> {
    const clienteData = {
      ...createClienteDto,
      empresaId,
      creadoPor: usuarioId,
      fechaCreacion: new Date(),
    };

    const cliente = new Cliente(clienteData);
    await cliente.save();
    
    return cliente;
  }

  // ============================================
  // OBTENER TODOS CON FILTROS Y PAGINACIÓN
  // ============================================
  
  async obtenerTodos(
    empresaId: mongoose.Types.ObjectId,
    query: Partial<GetClientesQueryDto>
  ): Promise<ObtenerTodosResult> {  // ← TIPO DE RETORNO EXPLÍCITO
    const {
      search,
      sortBy = 'fechaCreacion',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      activo,
      vendedorId,
      categoriaId,
      zona,
      tags,
    } = query;

    // Construir filtro
    const filter: any = { empresaId };

    // Búsqueda por texto
    if (search) {
      filter.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { nombreComercial: { $regex: search, $options: 'i' } },
        { codigo: { $regex: search, $options: 'i' } },
        { nif: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Filtros adicionales
    if (activo !== undefined) {
      filter.activo = activo;
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

    // Ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Paginación
    const skip = (page - 1) * limit;

    // Ejecutar consulta
    const [clientes, total] = await Promise.all([
      Cliente.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('vendedorId', 'nombre email')
        .populate('categoriaId', 'nombre')
        .lean(),
      Cliente.countDocuments(filter),
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
  
  async obtenerPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId
  ): Promise<ICliente | null> {
    const cliente = await Cliente.findOne({
      _id: id,
      empresaId,
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
    usuarioId: mongoose.Types.ObjectId
  ): Promise<ICliente | null> {
    const cliente = await Cliente.findOneAndUpdate(
      { _id: id, empresaId },
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
    empresaId: mongoose.Types.ObjectId
  ): Promise<boolean> {
    const resultado = await Cliente.deleteOne({
      _id: id,
      empresaId,
    });

    return resultado.deletedCount > 0;
  }

  // ============================================
  // ELIMINACIÓN MÚLTIPLE
  // ============================================
  
  async eliminarMultiples(
    ids: string[],
    empresaId: mongoose.Types.ObjectId
  ): Promise<number> {
    const resultado = await Cliente.deleteMany({
      _id: { $in: ids },
      empresaId,
    });

    return resultado.deletedCount || 0;
  }

  // ============================================
  // ACTIVAR/DESACTIVAR
  // ============================================
  
  async cambiarEstado(
    id: string,
    activo: boolean,
    empresaId: mongoose.Types.ObjectId,
    usuarioId: mongoose.Types.ObjectId
  ): Promise<ICliente | null> {
    const cliente = await Cliente.findOneAndUpdate(
      { _id: id, empresaId },
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
    empresaId: mongoose.Types.ObjectId
  ) {
    return await Cliente.obtenerEstadisticas(empresaId);
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
    usuarioId: mongoose.Types.ObjectId
  ): Promise<ICliente | null> {
    const cliente = await Cliente.findOneAndUpdate(
      { _id: id, empresaId },
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
    usuarioId: mongoose.Types.ObjectId
  ): Promise<ICliente | null> {
    const cliente = await Cliente.findOneAndUpdate(
      { _id: id, empresaId },
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
    excludeId?: string
  ): Promise<boolean> {
    const filter: any = { empresaId, nif };
    
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const count = await Cliente.countDocuments(filter);
    return count > 0;
  }

  // ============================================
  // EXPORTAR A CSV
  // ============================================
  
  async exportarCSV(
    empresaId: mongoose.Types.ObjectId,
    filtros?: Partial<GetClientesQueryDto>
  ): Promise<any[]> {
    const filter: any = { empresaId };

    if (filtros?.activo !== undefined) {
      filter.activo = filtros.activo;
    }

    if (filtros?.vendedorId) {
      filter.vendedorId = filtros.vendedorId;
    }

    const clientes = await Cliente.find(filter)
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
    empresaId: mongoose.Types.ObjectId
  ): Promise<ICliente | null> {
    const cliente = await Cliente.findOneAndUpdate(
      { _id: id, empresaId },
      { riesgoActual: nuevoRiesgo },
      { new: true }
    );

    return cliente;
  }
}

export const clientesService = new ClientesService();