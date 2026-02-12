import { IDatabaseConfig } from '@/types/express';
import { getProyectoModel, getClienteModel } from '@/utils/dynamic-models.helper';

export class ProyectosDashboardService {
  async getDashboardData(empresaId: string, dbConfig: IDatabaseConfig) {
    const Proyecto = await getProyectoModel(empresaId, dbConfig);
    // Registrar modelo Cliente para que populate funcione
    await getClienteModel(empresaId, dbConfig);

    // Ejecutar todas las consultas en paralelo para rendimiento
    const [
      totalProyectos,
      distribucionEstado,
      distribucionTipo,
      proyectosPorMes,
      resumenFinanciero,
      proyectosRecientes,
    ] = await Promise.all([
      // Total y conteos por estado
      Proyecto.aggregate([
        { $match: { activo: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            activos: { $sum: { $cond: [{ $in: ['$estado', ['planificacion', 'en_curso', 'pausado']] }, 1, 0] } },
            completados: { $sum: { $cond: [{ $eq: ['$estado', 'completado'] }, 1, 0] } },
            enCurso: { $sum: { $cond: [{ $eq: ['$estado', 'en_curso'] }, 1, 0] } },
            progresoPromedio: { $avg: '$progreso' },
            horasEstimadasTotal: { $sum: { $ifNull: ['$horasEstimadas', 0] } },
            horasRealesTotal: { $sum: { $ifNull: ['$horasReales', 0] } },
          }
        }
      ]),

      // Distribución por estado (para gráfico dona)
      Proyecto.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$estado', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Distribución por tipo
      Proyecto.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$tipo', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Proyectos creados por mes (últimos 12 meses)
      Proyecto.aggregate([
        {
          $match: {
            fechaCreacion: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$fechaCreacion' },
              month: { $month: '$fechaCreacion' },
            },
            count: { $sum: 1 },
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      // Resumen financiero
      Proyecto.aggregate([
        { $match: { activo: true } },
        {
          $group: {
            _id: null,
            presupuestoTotal: { $sum: { $ifNull: ['$presupuestoAprobado', { $ifNull: ['$presupuestoEstimado', 0] }] } },
            costeTotal: { $sum: { $ifNull: ['$costeReal', 0] } },
          }
        }
      ]),

      // Proyectos recientes (últimos 10, con populate de cliente)
      Proyecto.find({ activo: true })
        .sort({ fechaCreacion: -1 })
        .limit(10)
        .select('codigo nombre estado progreso fechaInicio fechaFinPrevista presupuestoAprobado costeReal clienteId prioridad')
        .populate('clienteId', 'nombre nombreComercial')
        .lean(),
    ]);

    const totales = totalProyectos[0] || {
      total: 0, activos: 0, completados: 0, enCurso: 0,
      progresoPromedio: 0, horasEstimadasTotal: 0, horasRealesTotal: 0
    };

    const financiero = resumenFinanciero[0] || { presupuestoTotal: 0, costeTotal: 0 };

    return {
      kpis: {
        total: totales.total,
        activos: totales.activos,
        completados: totales.completados,
        enCurso: totales.enCurso,
        progresoPromedio: Math.round(totales.progresoPromedio || 0),
        presupuestoTotal: financiero.presupuestoTotal,
        costeTotal: financiero.costeTotal,
        margen: financiero.presupuestoTotal - financiero.costeTotal,
        horasEstimadas: totales.horasEstimadasTotal,
        horasReales: totales.horasRealesTotal,
      },
      distribucionEstado: distribucionEstado.map((d: any) => ({
        estado: d._id,
        count: d.count,
      })),
      distribucionTipo: distribucionTipo.map((d: any) => ({
        tipo: d._id,
        count: d.count,
      })),
      proyectosPorMes: proyectosPorMes.map((d: any) => ({
        year: d._id.year,
        month: d._id.month,
        count: d.count,
      })),
      proyectosRecientes,
    };
  }
}

export const proyectosDashboardService = new ProyectosDashboardService();
