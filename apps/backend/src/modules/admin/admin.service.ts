import Empresa, { IEmpresa } from '@/modules/empresa/Empresa';
import Usuario from '@/modules/usuarios/Usuario';
import UsuarioEmpresa from '@/modules/usuarios/UsuarioEmpresa';
import Plan from '@/modules/licencias/Plan';
import Licencia from '@/modules/licencias/Licencia';
import { GetEmpresasQueryDto, AdminUpdateEmpresaDto, UpdateEmpresaEstadoDto, CreateEmpresaDto } from './admin.dto';
import { DatabaseManagerService, databaseManager } from '@/services/database-manager.service';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt';
import { informesService } from '@/modules/informes/informes.service';
import { plantillasDocumentoService } from '@/modules/plantillas-documento/plantillas-documento.service';
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

  /**
   * Crear nueva empresa de negocio (para superadmin)
   * Crea la empresa, su base de datos, asigna el superadmin y crea licencia trial
   */
  async createEmpresa(data: CreateEmpresaDto, superadminId: string) {
    // Verificar si el NIF ya existe
    const empresaExistente = await Empresa.findOne({ nif: data.nif });
    if (empresaExistente) {
      throw new Error('Ya existe una empresa con este NIF');
    }

    // 1. Generar configuración de base de datos
    const tempEmpresaId = new mongoose.Types.ObjectId();
    const databaseConfig = DatabaseManagerService.generateDatabaseConfig(
      String(tempEmpresaId),
      {
        host: process.env.MONGODB_HOST || 'localhost',
        port: parseInt(process.env.MONGODB_PORT || '27017'),
        user: process.env.MONGODB_USER,
        password: process.env.MONGODB_PASSWORD,
      }
    );

    console.log(`🔧 Configuración de DB generada: ${databaseConfig.name}`);

    // 2. Crear empresa con configuración de DB
    const empresa = await Empresa.create({
      _id: tempEmpresaId,
      nombre: data.nombre,
      nif: data.nif,
      email: data.email,
      telefono: data.telefono,
      tipoNegocio: data.tipoNegocio,
      estado: 'activa',
      direccion: data.direccion,
      databaseConfig,
    });

    console.log(`✅ Empresa creada: ${empresa.nombre} (${empresa._id})`);

    // 3. Inicializar base de datos de la empresa
    try {
      await databaseManager.initializeEmpresaDatabase(
        String(empresa._id),
        databaseConfig
      );
      console.log(`✅ Base de datos inicializada: ${databaseConfig.name}`);
    } catch (error: any) {
      console.error('❌ Error inicializando base de datos:', error);
      await Empresa.deleteOne({ _id: empresa._id });
      throw new Error('Error al inicializar la base de datos de la empresa');
    }

    // 3.1 Inicializar informes predefinidos
    try {
      const resultadoInformes = await informesService.inicializarPlantillas(
        String(empresa._id),
        databaseConfig,
        superadminId
      );
      console.log(`✅ Informes inicializados: ${resultadoInformes.insertados} plantillas creadas`);
    } catch (error: any) {
      console.error('⚠️ Error inicializando informes (no crítico):', error.message);
      // No lanzamos error porque no es crítico para la creación de la empresa
    }

    // 3.2 Inicializar plantillas de documentos predefinidas
    try {
      const resultadoPlantillas = await plantillasDocumentoService.inicializarPlantillas(
        String(empresa._id),
        databaseConfig,
        superadminId
      );
      console.log(`✅ Plantillas de documentos inicializadas: ${resultadoPlantillas.insertadas} plantillas creadas`);
    } catch (error: any) {
      console.error('⚠️ Error inicializando plantillas de documentos (no crítico):', error.message);
      // No lanzamos error porque no es crítico para la creación de la empresa
    }

    // 4. Asignar superadmin a la empresa
    const superadmin = await Usuario.findById(superadminId);
    if (superadmin) {
      await UsuarioEmpresa.create({
        usuarioId: superadmin._id,
        empresaId: empresa._id,
        rol: 'admin',
        esPrincipal: true,
        activo: true,
        fechaAsignacion: new Date(),
      });

      // Actualizar empresaId del superadmin
      superadmin.empresaId = empresa._id;
      await superadmin.save();

      console.log(`✅ Superadmin asignado a la empresa`);
    }

    // 5. Crear licencia - Enterprise para superadmin (sin restricciones)
    // Buscar plan Enterprise (el maximo) para superadmin
    let planSeleccionado = await Plan.findOne({ slug: 'enterprise' });

    // Si no existe Enterprise, buscar el plan con mas modulos
    if (!planSeleccionado) {
      planSeleccionado = await Plan.findOne({ slug: 'profesional' });
    }
    if (!planSeleccionado) {
      planSeleccionado = await Plan.findOne({ slug: 'basico' });
    }
    if (!planSeleccionado) {
      planSeleccionado = await Plan.findOne({ slug: 'demo' });
    }

    if (planSeleccionado) {
      await Licencia.create({
        empresaId: empresa._id,
        planId: planSeleccionado._id,
        estado: 'activa', // Activa directamente, no trial para superadmin
        esTrial: false,
        tipoSuscripcion: 'anual',
        fechaInicio: new Date(),
        // Fecha muy lejana para que nunca expire
        fechaRenovacion: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        usoActual: {
          usuariosSimultaneos: 0,
          usuariosTotales: 1,
          facturasEsteMes: 0,
          productosActuales: 0,
          almacenesActuales: 0,
          clientesActuales: 0,
          tpvsActuales: 0,
          almacenamientoUsadoGB: 0,
          llamadasAPIHoy: 0,
          emailsEsteMes: 0,
          smsEsteMes: 0,
          whatsappEsteMes: 0,
        },
        historial: [
          {
            fecha: new Date(),
            accion: 'CREACION',
            planNuevo: planSeleccionado.nombre,
            motivo: `Empresa creada por superadmin - Licencia completa sin restricciones`,
          },
        ],
      });

      console.log(`✅ Licencia ${planSeleccionado.nombre} creada para superadmin`);
    }

    // 6. Generar nuevos tokens con la nueva empresaId
    // Recargar el superadmin para tener los datos actualizados
    const superadminActualizado = await Usuario.findById(superadminId);
    let newTokens = null;

    if (superadminActualizado) {
      const accessToken = generateAccessToken(superadminActualizado);
      const refreshToken = generateRefreshToken(superadminActualizado);
      newTokens = { accessToken, refreshToken };
      console.log(`✅ Nuevos tokens generados con empresaId: ${empresa._id}`);
    }

    return {
      empresa: {
        id: String(empresa._id),
        nombre: empresa.nombre,
        nif: empresa.nif,
        email: empresa.email,
        tipoNegocio: empresa.tipoNegocio,
      },
      plan: planSeleccionado?.nombre || 'Enterprise',
      licenciaActiva: true,
      // Nuevos tokens para que el frontend actualice la sesion
      ...newTokens,
    };
  }
}

export default new AdminService();