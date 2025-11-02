import mongoose from 'mongoose';
import { Cliente, ICliente } from '../../models/Cliente';
import {
  CreateClienteDTO,
  UpdateClienteDTO,
  ClienteQueryDTO,
  ClienteResponse,
} from './clientes.dto';

export class ClienteService {
  /**
   * Crear un nuevo cliente
   */
  async create(
    empresaId: string,
    usuarioId: string,
    data: CreateClienteDTO
  ): Promise<ICliente> {
    // Validar que el NIF no exista ya en la empresa
    const existeNIF = await Cliente.findOne({
      empresaId,
      nif: data.nif.toUpperCase(),
    });

    if (existeNIF) {
      throw new Error(`Ya existe un cliente con el NIF ${data.nif}`);
    }

    // Si no se proporciona código, se generará automáticamente en el pre-save hook
    const cliente = new Cliente({
      ...data,
      empresaId,
      creadoPor: usuarioId,
      riesgoActual: 0, // Inicializar riesgo en 0
    });

    await cliente.save();
    return cliente;
  }

  /**
   * Obtener cliente por ID
   */
  async findById(empresaId: string, clienteId: string): Promise<ICliente | null> {
    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
      throw new Error('ID de cliente inválido');
    }

    const cliente = await Cliente.findOne({
      _id: clienteId,
      empresaId,
    })
      .populate('categoriaId', 'nombre')
      .populate('vendedorId', 'nombre email')
      .populate('tarifaId', 'nombre');

    return cliente;
  }

  /**
   * Listar clientes con filtros y paginación
   */
  async findAll(
    empresaId: string,
    query: ClienteQueryDTO
  ): Promise<{
    clientes: ICliente[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const {
      search,
      tipoCliente,
      activo,
      formaPago,
      categoriaId,
      vendedorId,
      zona,
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Construir filtro base
    const filter: any = { empresaId };

    // Búsqueda general
    if (search) {
      filter.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { nombreComercial: { $regex: search, $options: 'i' } },
        { nif: { $regex: search, $options: 'i' } },
        { codigo: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Filtros específicos
    if (tipoCliente) filter.tipoCliente = tipoCliente;
    if (activo !== undefined) filter.activo = activo;
    if (formaPago) filter.formaPago = formaPago;
    if (categoriaId) filter.categoriaId = categoriaId;
    if (vendedorId) filter.vendedorId = vendedorId;
    if (zona) filter.zona = zona;

    // Calcular skip
    const skip = (page - 1) * limit;

    // Construir ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar consulta con paginación
    const [clientes, total] = await Promise.all([
      Cliente.find(filter)
        .populate('categoriaId', 'nombre')
        .populate('vendedorId', 'nombre email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Cliente.countDocuments(filter),
    ]);

    return {
      clientes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Actualizar cliente
   */
  async update(
    empresaId: string,
    clienteId: string,
    usuarioId: string,
    data: UpdateClienteDTO
  ): Promise<ICliente | null> {
    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
      throw new Error('ID de cliente inválido');
    }

    // Si se actualiza el NIF, verificar que no exista otro cliente con ese NIF
    if (data.nif) {
      const existeNIF = await Cliente.findOne({
        empresaId,
        nif: data.nif.toUpperCase(),
        _id: { $ne: clienteId },
      });

      if (existeNIF) {
        throw new Error(`Ya existe otro cliente con el NIF ${data.nif}`);
      }
    }

    const cliente = await Cliente.findOneAndUpdate(
      {
        _id: clienteId,
        empresaId,
      },
      {
        ...data,
        modificadoPor: usuarioId,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return cliente;
  }

  /**
   * Eliminar cliente (soft delete)
   */
  async delete(empresaId: string, clienteId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
      throw new Error('ID de cliente inválido');
    }

    // Verificar que el cliente no tenga documentos asociados
    // TODO: Implementar validación con Facturas, Albaranes, etc.

    const result = await Cliente.findOneAndUpdate(
      {
        _id: clienteId,
        empresaId,
      },
      {
        activo: false,
      },
      {
        new: true,
      }
    );

    return !!result;
  }

  /**
   * Eliminar cliente permanentemente
   */
  async deletePermanently(empresaId: string, clienteId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
      throw new Error('ID de cliente inválido');
    }

    const result = await Cliente.deleteOne({
      _id: clienteId,
      empresaId,
    });

    return result.deletedCount > 0;
  }

  /**
   * Verificar si un NIF ya existe
   */
  async nifExists(empresaId: string, nif: string, excludeId?: string): Promise<boolean> {
    const filter: any = {
      empresaId,
      nif: nif.toUpperCase(),
    };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const count = await Cliente.countDocuments(filter);
    return count > 0;
  }

  /**
   * Obtener estadísticas de clientes
   */
  async getEstadisticas(empresaId: string) {
    const [
      total,
      activos,
      inactivos,
      empresas,
      particulares,
      conRiesgo,
    ] = await Promise.all([
      Cliente.countDocuments({ empresaId }),
      Cliente.countDocuments({ empresaId, activo: true }),
      Cliente.countDocuments({ empresaId, activo: false }),
      Cliente.countDocuments({ empresaId, tipoCliente: 'empresa' }),
      Cliente.countDocuments({ empresaId, tipoCliente: 'particular' }),
      Cliente.countDocuments({
        empresaId,
        $expr: { $gt: ['$riesgoActual', '$limiteCredito'] },
      }),
    ]);

    return {
      total,
      activos,
      inactivos,
      empresas,
      particulares,
      conRiesgo,
    };
  }

  /**
   * Actualizar riesgo actual de un cliente
   */
  async actualizarRiesgo(
    empresaId: string,
    clienteId: string,
    nuevoRiesgo: number
  ): Promise<ICliente | null> {
    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
      throw new Error('ID de cliente inválido');
    }

    const cliente = await Cliente.findOneAndUpdate(
      {
        _id: clienteId,
        empresaId,
      },
      {
        riesgoActual: nuevoRiesgo,
      },
      {
        new: true,
      }
    );

    return cliente;
  }

  /**
   * Obtener clientes con riesgo excedido
   */
  async getClientesConRiesgo(empresaId: string): Promise<ICliente[]> {
    const clientes = await Cliente.find({
      empresaId,
      activo: true,
      limiteCredito: { $exists: true, $ne: null },
      $expr: { $gt: ['$riesgoActual', '$limiteCredito'] },
    });

    return clientes;
  }

  /**
   * Buscar clientes por nombre o NIF
   */
  async search(empresaId: string, termino: string, limit: number = 10): Promise<ICliente[]> {
    const clientes = await Cliente.find({
      empresaId,
      activo: true,
      $or: [
        { nombre: { $regex: termino, $options: 'i' } },
        { nombreComercial: { $regex: termino, $options: 'i' } },
        { nif: { $regex: termino, $options: 'i' } },
        { codigo: { $regex: termino, $options: 'i' } },
      ],
    })
      .limit(limit)
      .sort({ nombre: 1 });

    return clientes;
  }

  /**
   * Exportar clientes a CSV
   */
  async exportToCSV(empresaId: string): Promise<string> {
    const clientes = await Cliente.find({ empresaId }).lean();

    // Cabeceras
    const headers = [
      'Código',
      'Nombre',
      'NIF',
      'Email',
      'Teléfono',
      'Ciudad',
      'Provincia',
      'Forma de Pago',
      'Días de Pago',
      'Activo',
    ];

    // Crear filas
    const rows = clientes.map(c => [
      c.codigo,
      c.nombre,
      c.nif,
      c.email || '',
      c.telefono || '',
      c.direccion.ciudad,
      c.direccion.provincia,
      c.formaPago,
      c.diasPago,
      c.activo ? 'Sí' : 'No',
    ]);

    // Unir todo
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Formatear cliente para respuesta
   */
  formatClienteResponse(cliente: ICliente): ClienteResponse {
    return {
      _id: (cliente._id as mongoose.Types.ObjectId).toString(),
      empresaId: cliente.empresaId.toString(),
      tipoCliente: cliente.tipoCliente,
      codigo: cliente.codigo,
      nombre: cliente.nombre,
      nombreComercial: cliente.nombreComercial,
      nif: cliente.nif,
      email: cliente.email,
      telefono: cliente.telefono,
      movil: cliente.movil,
      web: cliente.web,
      direccion: cliente.direccion,
      direccionEnvio: cliente.direccionEnvio,
      formaPago: cliente.formaPago,
      diasPago: cliente.diasPago,
      descuentoGeneral: cliente.descuentoGeneral,
      limiteCredito: cliente.limiteCredito,
      riesgoActual: cliente.riesgoActual,
      activo: cliente.activo,
      observaciones: cliente.observaciones,
      tags: cliente.tags,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
    };
  }
}