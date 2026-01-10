import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { partesTrabajoService } from './partes-trabajo.service';
import {
  CreateParteTrabajoDTO,
  UpdateParteTrabajoDTO,
  SearchPartesTrabajoDTO,
  CambiarEstadoParteDTO,
  CompletarParteDTO,
  OpcionesGenerarAlbaranDTO,
  DuplicarParteDTO,
  BulkDeletePartesDTO,
  BulkCambiarEstadoDTO,
  EnviarEmailParteDTO,
} from './partes-trabajo.dto';
import { EstadoParteTrabajo } from './ParteTrabajo';
import { sendEmail, emailTemplates } from '../../utils/email';
import { getEmpresa } from '../empresa/Empresa';
import { JornadaCalendarSyncService } from './jornada-calendar-sync.service';

// ============================================
// CONTROLADORES
// ============================================

export const partesTrabajoController = {
  /**
   * Crear un nuevo parte de trabajo
   */
  async crear(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const createDto: CreateParteTrabajoDTO = req.body;

      const parte = await partesTrabajoService.crear(
        createDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: parte,
        message: 'Parte de trabajo creado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear parte de trabajo:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear el parte de trabajo',
      });
    }
  },

  /**
   * Obtener todos los partes con filtros y paginacion
   */
  async buscar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no encontrada',
        });
      }

      const empresaId = req.empresaId!;

      const searchDto: SearchPartesTrabajoDTO = {
        search: req.query.search as string,
        clienteId: req.query.clienteId as string,
        proyectoId: req.query.proyectoId as string,
        responsableId: req.query.responsableId as string,
        estado: req.query.estado as EstadoParteTrabajo,
        estados: req.query.estados as string,
        tipo: req.query.tipo as any,
        prioridad: req.query.prioridad as any,
        serie: req.query.serie as string,
        activo: req.query.activo as 'true' | 'false' | 'all',
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        fechaInicioDesde: req.query.fechaInicioDesde as string,
        fechaInicioHasta: req.query.fechaInicioHasta as string,
        importeMin: req.query.importeMin as string,
        importeMax: req.query.importeMax as string,
        tags: req.query.tags as string,
        conFirmaCliente: req.query.conFirmaCliente as 'true' | 'false',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await partesTrabajoService.buscar(
        searchDto,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: result.partes,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error: any) {
      console.error('Error al buscar partes de trabajo:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar partes de trabajo',
      });
    }
  },

  /**
   * Obtener un parte por ID
   */
  async obtenerPorId(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { id } = req.params;

      const parte = await partesTrabajoService.obtenerPorId(
        id,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      if (!parte) {
        return res.status(404).json({
          success: false,
          error: 'Parte de trabajo no encontrado',
        });
      }

      return res.json({
        success: true,
        data: parte,
      });
    } catch (error: any) {
      console.error('Error al obtener parte de trabajo:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener el parte de trabajo',
      });
    }
  },

  /**
   * Actualizar un parte
   */
  async actualizar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id } = req.params;
      const updateDto: UpdateParteTrabajoDTO = req.body;

      const parte = await partesTrabajoService.actualizar(
        id,
        updateDto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: parte,
        message: 'Parte de trabajo actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar parte de trabajo:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar el parte de trabajo',
      });
    }
  },

  /**
   * Eliminar un parte (soft delete)
   */
  async eliminar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id } = req.params;

      await partesTrabajoService.eliminar(
        id,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        message: 'Parte de trabajo eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar parte de trabajo:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar el parte de trabajo',
      });
    }
  },

  /**
   * Eliminar multiples partes
   */
  async eliminarMultiples(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { ids }: BulkDeletePartesDTO = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere un array de IDs',
        });
      }

      const count = await partesTrabajoService.eliminarMultiples(
        ids,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        message: `${count} partes de trabajo eliminados correctamente`,
        count,
      });
    } catch (error: any) {
      console.error('Error al eliminar partes de trabajo:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar los partes de trabajo',
      });
    }
  },

  /**
   * Cambiar estado de un parte
   */
  async cambiarEstado(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id } = req.params;
      const dto: CambiarEstadoParteDTO = req.body;

      const parte = await partesTrabajoService.cambiarEstado(
        id,
        dto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: parte,
        message: `Estado cambiado a ${dto.estado} correctamente`,
      });
    } catch (error: any) {
      console.error('Error al cambiar estado del parte:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al cambiar el estado del parte',
      });
    }
  },

  /**
   * Completar un parte (con firmas)
   */
  async completar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id } = req.params;
      const dto: CompletarParteDTO = req.body;

      const parte = await partesTrabajoService.completar(
        id,
        dto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: parte,
        message: 'Parte de trabajo completado correctamente',
      });
    } catch (error: any) {
      console.error('Error al completar parte:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al completar el parte',
      });
    }
  },

  /**
   * Reasignar fecha/hora de un parte (desde planificacion)
   */
  async reasignarFechaHora(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id } = req.params;
      const { fecha, hora, responsableId } = req.body;

      if (!fecha) {
        return res.status(400).json({
          success: false,
          error: 'La fecha es requerida',
        });
      }

      const parte = await partesTrabajoService.reasignarFechaHora(
        id,
        fecha,
        hora || '',
        responsableId || null,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: parte,
        message: 'Parte reasignado correctamente',
      });
    } catch (error: any) {
      console.error('Error al reasignar parte:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al reasignar el parte',
      });
    }
  },

  /**
   * Generar albaran desde parte de trabajo
   */
  async generarAlbaran(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id } = req.params;
      const opciones: OpcionesGenerarAlbaranDTO = req.body;

      const albaran = await partesTrabajoService.generarAlbaran(
        id,
        opciones,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: albaran,
        message: 'Albaran generado correctamente desde el parte de trabajo',
      });
    } catch (error: any) {
      console.error('Error al generar albaran:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al generar el albaran',
      });
    }
  },

  /**
   * Duplicar un parte de trabajo
   */
  async duplicar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const usuarioId = req.userId!;
      const { id } = req.params;
      const dto: DuplicarParteDTO = req.body;

      const nuevoParte = await partesTrabajoService.duplicar(
        id,
        dto,
        new mongoose.Types.ObjectId(empresaId),
        new mongoose.Types.ObjectId(usuarioId),
        req.empresaDbConfig
      );

      return res.status(201).json({
        success: true,
        data: nuevoParte,
        message: 'Parte de trabajo duplicado correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar parte:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al duplicar el parte',
      });
    }
  },

  /**
   * Verificar disponibilidad de personal
   */
  async verificarDisponibilidad(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { personalIds, fecha, horaInicio, horaFin, parteIdExcluir } = req.body;

      if (!personalIds || !Array.isArray(personalIds) || personalIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere al menos un ID de personal',
        });
      }

      if (!fecha) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere una fecha',
        });
      }

      const resultado = await partesTrabajoService.verificarDisponibilidadPersonal(
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig,
        personalIds,
        fecha,
        horaInicio || '00:00',
        horaFin || '23:59',
        parteIdExcluir
      );

      return res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al verificar disponibilidad:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al verificar disponibilidad',
      });
    }
  },

  /**
   * Obtener estadisticas
   */
  async estadisticas(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;

      const estadisticas = await partesTrabajoService.obtenerEstadisticas(
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      console.error('Error al obtener estadisticas:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadisticas',
      });
    }
  },

  /**
   * Obtener partes de un proyecto
   */
  async obtenerPorProyecto(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { proyectoId } = req.params;

      const partes = await partesTrabajoService.obtenerPorProyecto(
        proyectoId,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: partes,
      });
    } catch (error: any) {
      console.error('Error al obtener partes del proyecto:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener partes del proyecto',
      });
    }
  },

  /**
   * Obtener partes de un cliente
   */
  async obtenerPorCliente(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { clienteId } = req.params;

      const partes = await partesTrabajoService.obtenerPorCliente(
        clienteId,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      return res.json({
        success: true,
        data: partes,
      });
    } catch (error: any) {
      console.error('Error al obtener partes del cliente:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener partes del cliente',
      });
    }
  },

  /**
   * Enviar parte de trabajo por email
   */
  async enviarEmail(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { id } = req.params;
      const dto: EnviarEmailParteDTO = req.body;

      // Validar que haya destinatarios
      if (!dto.destinatarios || dto.destinatarios.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere al menos un destinatario',
        });
      }

      // Obtener el parte
      const parte = await partesTrabajoService.obtenerPorId(
        id,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      if (!parte) {
        return res.status(404).json({
          success: false,
          error: 'Parte de trabajo no encontrado',
        });
      }

      // Obtener datos de la empresa
      const empresa = await getEmpresa(empresaId);
      if (!empresa) {
        return res.status(404).json({
          success: false,
          error: 'Empresa no encontrada',
        });
      }

      // Formatear moneda
      const formatCurrency = (value: number) => {
        return (value || 0).toLocaleString('es-ES', {
          style: 'currency',
          currency: 'EUR',
        });
      };

      // Mapeo de estados
      const estadosLabel: Record<string, string> = {
        borrador: 'Borrador',
        planificado: 'Planificado',
        en_curso: 'En Curso',
        pausado: 'Pausado',
        completado: 'Completado',
        facturado: 'Facturado',
        anulado: 'Anulado',
      };

      // Mapeo de tipos
      const tiposLabel: Record<string, string> = {
        mantenimiento: 'Mantenimiento',
        instalacion: 'Instalación',
        reparacion: 'Reparación',
        servicio: 'Servicio',
        proyecto: 'Proyecto',
        otro: 'Otro',
      };

      // Generar HTML del email
      const html = emailTemplates.parteTrabajo({
        clienteNombre: parte.clienteNombre,
        codigoParte: parte.codigo,
        tituloParte: parte.titulo,
        tipoParte: tiposLabel[parte.tipo] || parte.tipo,
        fecha: new Date(parte.fecha).toLocaleDateString('es-ES'),
        estado: estadosLabel[parte.estado] || parte.estado,
        totalVenta: formatCurrency(parte.totales?.totalVenta || 0),
        empresaNombre: empresa.nombre,
        empresaEmail: empresa.email,
        empresaTelefono: empresa.telefono,
        urlParte: dto.urlParte,
        mensaje: dto.mensaje,
        trabajoRealizado: parte.trabajoRealizado,
        lineasResumen: {
          personal: parte.lineasPersonal?.length || 0,
          material: parte.lineasMaterial?.length || 0,
          maquinaria: parte.lineasMaquinaria?.length || 0,
          transporte: parte.lineasTransporte?.length || 0,
          gastos: parte.lineasGastos?.length || 0,
        },
      });

      // Asunto del email
      const asunto = dto.asunto || `Parte de Trabajo ${parte.codigo} - ${empresa.nombre}`;

      // Enviar a todos los destinatarios
      const resultados: { email: string; success: boolean; message: string }[] = [];

      for (const destinatario of dto.destinatarios) {
        const result = await sendEmail(destinatario, asunto, html);
        resultados.push({
          email: destinatario,
          success: result.success,
          message: result.message,
        });
      }

      // Enviar copias CC si hay
      if (dto.cc && dto.cc.length > 0) {
        for (const ccEmail of dto.cc) {
          const result = await sendEmail(ccEmail, asunto, html);
          resultados.push({
            email: ccEmail,
            success: result.success,
            message: result.message + ' (CC)',
          });
        }
      }

      // Verificar si hubo errores
      const errores = resultados.filter(r => !r.success);
      const exitos = resultados.filter(r => r.success);

      if (errores.length === resultados.length) {
        return res.status(500).json({
          success: false,
          error: 'No se pudo enviar ningún email',
          detalles: errores,
        });
      }

      return res.json({
        success: true,
        message: `Email enviado a ${exitos.length} destinatario(s)`,
        enviados: exitos.length,
        errores: errores.length,
        detalles: resultados,
      });
    } catch (error: any) {
      console.error('Error al enviar email del parte:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar el email',
      });
    }
  },

  // ============================================
  // SINCRONIZACIÓN DE JORNADAS CON GOOGLE CALENDAR
  // ============================================

  /**
   * Sincronizar todas las jornadas de un parte con Google Calendar
   */
  async sincronizarJornadasCalendar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { id } = req.params;

      // Crear servicio de sincronización
      const syncService = new JornadaCalendarSyncService(empresaId);

      // Sincronizar todas las jornadas
      const resultados = await syncService.sincronizarTodasLasJornadas(id);

      // Contar resultados
      let exitosos = 0;
      let errores = 0;
      for (const jornadaResult of resultados) {
        for (const personalResult of jornadaResult.resultados) {
          if (personalResult.success) {
            exitosos++;
          } else {
            errores++;
          }
        }
      }

      return res.json({
        success: true,
        data: resultados,
        message: `Sincronización completada: ${exitosos} eventos sincronizados, ${errores} errores`,
        stats: {
          jornadasProcesadas: resultados.length,
          eventosSincronizados: exitosos,
          errores,
        },
      });
    } catch (error: any) {
      console.error('Error al sincronizar jornadas con Calendar:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al sincronizar con Google Calendar',
      });
    }
  },

  /**
   * Sincronizar una jornada específica con Google Calendar
   */
  async sincronizarJornadaCalendar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { id, jornadaIndex } = req.params;

      // Obtener el parte
      const parte = await partesTrabajoService.obtenerPorId(
        id,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      if (!parte) {
        return res.status(404).json({
          success: false,
          error: 'Parte de trabajo no encontrado',
        });
      }

      // Crear servicio de sincronización
      const syncService = new JornadaCalendarSyncService(empresaId);

      // Sincronizar la jornada específica
      const resultado = await syncService.sincronizarJornada(parte, parseInt(jornadaIndex));

      return res.json({
        success: true,
        data: resultado,
        message: resultado.sincronizadoCalendar
          ? 'Jornada sincronizada con Google Calendar'
          : 'Sincronización parcial - algunos calendarios no disponibles',
      });
    } catch (error: any) {
      console.error('Error al sincronizar jornada con Calendar:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al sincronizar con Google Calendar',
      });
    }
  },

  /**
   * Obtener partes para planificación (calendario)
   */
  async obtenerParaPlanificacion(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          error: 'Configuracion de base de datos no disponible',
        });
      }

      const empresaId = req.empresaId!;
      const { fechaDesde, fechaHasta, personalId, tipo } = req.query;

      if (!fechaDesde || !fechaHasta) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere fechaDesde y fechaHasta',
        });
      }

      // Construir query
      const searchDto: SearchPartesTrabajoDTO = {
        fechaInicioDesde: fechaDesde as string,
        fechaInicioHasta: fechaHasta as string,
        responsableId: personalId as string,
        tipo: tipo as any,
        estados: 'planificado,en_curso',
        activo: 'true',
        limit: 500,
        page: 1,
      };

      const result = await partesTrabajoService.buscar(
        searchDto,
        new mongoose.Types.ObjectId(empresaId),
        req.empresaDbConfig
      );

      // Transformar para el calendario
      const eventos = result.partes.map(parte => ({
        id: parte._id,
        titulo: parte.titulo || `${parte.tipo} - ${parte.clienteNombre}`,
        codigo: parte.codigo,
        tipo: parte.tipo,
        prioridad: parte.prioridad,
        estado: parte.estado,
        clienteNombre: parte.clienteNombre,
        clienteId: parte.clienteId,
        responsableNombre: parte.responsableNombre,
        responsableId: parte.responsableId,
        fecha: parte.fechaInicio || parte.fecha,
        fechaFin: parte.fechaFin,
        esMultiDia: parte.esMultiDia,
        jornadas: parte.jornadas?.map(j => ({
          _id: j._id,
          fecha: j.fecha,
          horaInicio: j.horaInicio,
          horaFin: j.horaFin,
          estado: j.estado,
          personalCount: j.personal?.length || 0,
        })) || [],
      }));

      return res.json({
        success: true,
        data: eventos,
        total: eventos.length,
      });
    } catch (error: any) {
      console.error('Error al obtener partes para planificación:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener partes para planificación',
      });
    }
  },
};
