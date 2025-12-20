import Empresa, { IEmpresa } from '@/modules/empresa/Empresa';
import Usuario from '@/modules/usuarios/Usuario';
import { GetEmpresasQueryDto, AdminUpdateEmpresaDto, UpdateEmpresaEstadoDto } from './admin.dto';
import mongoose from 'mongoose';

/**
 * ============================================
 * ADMIN SERVICE
 * ============================================
 * Servicio para gestión administrativa de empresas
 */

class AdminService {
  /**
   * Obtener todas las empresas con paginación y filtros
   */
  async getAllEmpresas(query: GetEmpresasQueryDto) {
    const { page = 1, limit = 10, search, estado, tipoNegocio } = query;

    const filter: any = {};

    // Filtro de búsqueda (nombre, email o NIF)
    if (search) {
      filter.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { nif: { $regex: search, $options: 'i' } },
      ];
    }

    // Filtro por estado
    if (estado) {
      filter.estado = estado;
    }

    // Filtro por tipo de negocio
    if (tipoNegocio) {
      filter.tipoNegocio = tipoNegocio;
    }

    const skip = (page - 1) * limit;

    const [empresas, total] = await Promise.all([
      Empresa.find(filter)
        .select('-databaseConfig.password -databaseConfig.uri') // No devolver contraseñas
        .sort({ fechaAlta: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Empresa.countDocuments(filter),
    ]);

    // Obtener estadísticas de usuarios por empresa
    const empresasConStats = await Promise.all(
      empresas.map(async (empresa) => {
        const [totalUsuarios, usuariosActivos] = await Promise.all([
          Usuario.countDocuments({ empresaId: empresa._id }),
          Usuario.countDocuments({ empresaId: empresa._id, activo: true }),
        ]);

        return {
          ...empresa,
          stats: {
            totalUsuarios,
            usuariosActivos,
          },
        };
      })
    );

    return {
      empresas: empresasConStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener detalles completos de una empresa
   */
  async getEmpresaById(empresaId: string) {
    const empresa = await Empresa.findById(empresaId)
      .select('-databaseConfig.password -databaseConfig.uri') // No devolver contraseñas
      .lean();

    if (!empresa) {
      return null;
    }

    // Obtener usuarios de la empresa
    const usuarios = await Usuario.find({ empresaId: new mongoose.Types.ObjectId(empresaId) })
      .select('nombre apellidos email rol activo twoFactorEnabled createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Estadísticas
    const [totalUsuarios, usuariosActivos, adminCount] = await Promise.all([
      Usuario.countDocuments({ empresaId: new mongoose.Types.ObjectId(empresaId) }),
      Usuario.countDocuments({ empresaId: new mongoose.Types.ObjectId(empresaId), activo: true }),
      Usuario.countDocuments({ empresaId: new mongoose.Types.ObjectId(empresaId), rol: 'admin' }),
    ]);

    return {
      ...empresa,
      usuarios,
      stats: {
        totalUsuarios,
        usuariosActivos,
        adminCount,
      },
    };
  }

  /**
   * Actualizar estado de una empresa
   */
  async updateEmpresaEstado(
    empresaId: string,
    data: UpdateEmpresaEstadoDto,
    adminId: string
  ): Promise<IEmpresa | null> {
    const empresa = await Empresa.findById(empresaId);

    if (!empresa) {
      return null;
    }

    empresa.estado = data.estado;
    await empresa.save();

    // TODO: Registrar acción en log de auditoría
    // AuditLog.create({
    //   accion: 'CAMBIO_ESTADO_EMPRESA',
    //   usuarioId: adminId,
    //   empresaId,
    //   detalles: { estadoAnterior: empresa.estado, estadoNuevo: data.estado, razon: data.razon }
    // });

    return empresa;
  }

  /**
   * Actualizar datos de una empresa
   */
  async updateEmpresa(
    empresaId: string,
    data: AdminUpdateEmpresaDto
  ): Promise<IEmpresa | null> {
    const empresa = await Empresa.findByIdAndUpdate(
      empresaId,
      { $set: data },
      { new: true, runValidators: true }
    ).select('-databaseConfig.password -databaseConfig.uri');

    return empresa;
  }

  /**
   * Obtener estadísticas generales del sistema
   */
  async getSystemStats() {
    const [
      totalEmpresas,
      empresasActivas,
      empresasSuspendidas,
      empresasCanceladas,
      totalUsuarios,
      usuariosActivos,
    ] = await Promise.all([
      Empresa.countDocuments(),
      Empresa.countDocuments({ estado: 'activa' }),
      Empresa.countDocuments({ estado: 'suspendida' }),
      Empresa.countDocuments({ estado: 'cancelada' }),
      Usuario.countDocuments(),
      Usuario.countDocuments({ activo: true }),
    ]);

    // Empresas por tipo de negocio
    const empresasPorTipo = await Empresa.aggregate([
      {
        $group: {
          _id: '$tipoNegocio',
          count: { $sum: 1 },
        },
      },
    ]);

    // Empresas registradas por mes (últimos 6 meses)
    const seisMonthsAgo = new Date();
    seisMonthsAgo.setMonth(seisMonthsAgo.getMonth() - 6);

    const empresasPorMes = await Empresa.aggregate([
      {
        $match: {
          fechaAlta: { $gte: seisMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$fechaAlta' },
            month: { $month: '$fechaAlta' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    return {
      empresas: {
        total: totalEmpresas,
        activas: empresasActivas,
        suspendidas: empresasSuspendidas,
        canceladas: empresasCanceladas,
      },
      usuarios: {
        total: totalUsuarios,
        activos: usuariosActivos,
      },
      empresasPorTipo,
      empresasPorMes,
    };
  }

  /**
   * Eliminar empresa (solo para super admin)
   */
  async deleteEmpresa(empresaId: string): Promise<boolean> {
    // Primero eliminar todos los usuarios de la empresa
    await Usuario.deleteMany({ empresaId: new mongoose.Types.ObjectId(empresaId) });

    // Luego eliminar la empresa
    const result = await Empresa.deleteOne({ _id: empresaId });

    // TODO: Eliminar base de datos dedicada de la empresa
    // await databaseManager.dropEmpresaDatabase(empresaId);

    return result.deletedCount > 0;
  }
}

export default new AdminService();