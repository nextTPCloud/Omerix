import mongoose, { Model } from 'mongoose';
import { IEtapaPipeline } from './EtapaPipeline';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getEtapaPipelineModel, getOportunidadModel } from '@/utils/dynamic-models.helper';
import {
  CreateEtapaPipelineDTO,
  UpdateEtapaPipelineDTO,
  ReordenarEtapasDTO,
} from './crm.dto';

// ============================================
// TIPOS DE RETORNO
// ============================================

interface EtapasConEstadisticas extends IEtapaPipeline {
  totalOportunidades?: number;
  valorTotal?: number;
}

// ============================================
// ETAPAS POR DEFECTO
// ============================================

const ETAPAS_DEFAULT = [
  { nombre: 'Prospección', color: '#6B7280', orden: 0, probabilidadDefecto: 10, esInicial: true, esFinal: false, esCierrePositivo: false },
  { nombre: 'Calificación', color: '#3B82F6', orden: 1, probabilidadDefecto: 25, esInicial: false, esFinal: false, esCierrePositivo: false },
  { nombre: 'Propuesta', color: '#8B5CF6', orden: 2, probabilidadDefecto: 50, esInicial: false, esFinal: false, esCierrePositivo: false },
  { nombre: 'Negociación', color: '#F59E0B', orden: 3, probabilidadDefecto: 75, esInicial: false, esFinal: false, esCierrePositivo: false },
  { nombre: 'Cierre Ganado', color: '#10B981', orden: 4, probabilidadDefecto: 100, esInicial: false, esFinal: true, esCierrePositivo: true },
  { nombre: 'Cierre Perdido', color: '#EF4444', orden: 5, probabilidadDefecto: 0, esInicial: false, esFinal: true, esCierrePositivo: false },
];

export class PipelineService {

  /**
   * Obtener modelo de EtapaPipeline para una empresa específica
   */
  private async getModeloEtapa(
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<Model<IEtapaPipeline>> {
    return await getEtapaPipelineModel(empresaId, dbConfig);
  }

  // ============================================
  // CREAR ETAPA
  // ============================================

  async crearEtapa(
    data: CreateEtapaPipelineDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IEtapaPipeline> {
    const EtapaModel = await this.getModeloEtapa(String(empresaId), dbConfig);

    // Si no se especifica orden, poner al final
    if (data.orden === undefined || data.orden === 0) {
      const maxOrden = await EtapaModel.findOne({ activo: true })
        .sort({ orden: -1 })
        .select('orden')
        .lean();
      data.orden = maxOrden ? (maxOrden.orden || 0) + 1 : 0;
    }

    // Si es inicial, desmarcar otras iniciales
    if (data.esInicial) {
      await EtapaModel.updateMany(
        { esInicial: true },
        { esInicial: false }
      );
    }

    const etapaData = {
      ...data,
      empresaId,
    };

    const etapa = new EtapaModel(etapaData);
    await etapa.save();

    return etapa;
  }

  // ============================================
  // OBTENER ETAPAS (ordenadas)
  // ============================================

  async obtenerEtapas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig,
    soloActivas: boolean = true
  ): Promise<IEtapaPipeline[]> {
    const EtapaModel = await this.getModeloEtapa(String(empresaId), dbConfig);

    const filtro: any = {};
    if (soloActivas) {
      filtro.activo = true;
    }

    const etapas = await EtapaModel.find(filtro)
      .sort({ orden: 1 })
      .lean();

    return etapas;
  }

  // ============================================
  // OBTENER ETAPAS CON ESTADÍSTICAS
  // ============================================

  async obtenerEtapasConEstadisticas(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<EtapasConEstadisticas[]> {
    const EtapaModel = await this.getModeloEtapa(String(empresaId), dbConfig);
    const OportunidadModel = await getOportunidadModel(String(empresaId), dbConfig);

    const etapas = await EtapaModel.find({ activo: true })
      .sort({ orden: 1 })
      .lean();

    // Obtener estadísticas de oportunidades por etapa
    const stats = await OportunidadModel.aggregate([
      { $match: { estado: 'abierta' } },
      {
        $group: {
          _id: '$etapaId',
          totalOportunidades: { $sum: 1 },
          valorTotal: { $sum: '$valorEstimado' },
        },
      },
    ]);

    const statsMap = new Map(
      stats.map((s) => [String(s._id), { total: s.totalOportunidades, valor: s.valorTotal }])
    );

    return etapas.map((etapa) => ({
      ...etapa,
      totalOportunidades: statsMap.get(String(etapa._id))?.total || 0,
      valorTotal: statsMap.get(String(etapa._id))?.valor || 0,
    }));
  }

  // ============================================
  // OBTENER ETAPA POR ID
  // ============================================

  async obtenerEtapaPorId(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IEtapaPipeline | null> {
    const EtapaModel = await this.getModeloEtapa(String(empresaId), dbConfig);

    const etapa = await EtapaModel.findOne({ _id: id });

    return etapa;
  }

  // ============================================
  // OBTENER ETAPA INICIAL
  // ============================================

  async obtenerEtapaInicial(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IEtapaPipeline | null> {
    const EtapaModel = await this.getModeloEtapa(String(empresaId), dbConfig);

    // Buscar etapa marcada como inicial
    let etapa = await EtapaModel.findOne({ esInicial: true, activo: true });

    // Si no hay, tomar la primera por orden
    if (!etapa) {
      etapa = await EtapaModel.findOne({ activo: true }).sort({ orden: 1 });
    }

    return etapa;
  }

  // ============================================
  // ACTUALIZAR ETAPA
  // ============================================

  async actualizarEtapa(
    id: string,
    data: UpdateEtapaPipelineDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IEtapaPipeline | null> {
    const EtapaModel = await this.getModeloEtapa(String(empresaId), dbConfig);

    // Si se marca como inicial, desmarcar otras
    if (data.esInicial) {
      await EtapaModel.updateMany(
        { _id: { $ne: id }, esInicial: true },
        { esInicial: false }
      );
    }

    const etapa = await EtapaModel.findOneAndUpdate(
      { _id: id },
      { ...data },
      { new: true, runValidators: true }
    );

    return etapa;
  }

  // ============================================
  // ELIMINAR ETAPA
  // ============================================

  async eliminarEtapa(
    id: string,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<{ eliminada: boolean; error?: string }> {
    const EtapaModel = await this.getModeloEtapa(String(empresaId), dbConfig);
    const OportunidadModel = await getOportunidadModel(String(empresaId), dbConfig);

    // Verificar que no tenga oportunidades asociadas
    const oportunidadesCount = await OportunidadModel.countDocuments({
      etapaId: id,
      estado: 'abierta',
    });

    if (oportunidadesCount > 0) {
      return {
        eliminada: false,
        error: `No se puede eliminar la etapa porque tiene ${oportunidadesCount} oportunidades abiertas asociadas`,
      };
    }

    const resultado = await EtapaModel.deleteOne({ _id: id });

    return { eliminada: resultado.deletedCount > 0 };
  }

  // ============================================
  // REORDENAR ETAPAS
  // ============================================

  async reordenarEtapas(
    data: ReordenarEtapasDTO,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<boolean> {
    const EtapaModel = await this.getModeloEtapa(String(empresaId), dbConfig);

    const operaciones = data.etapas.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { orden: item.orden },
      },
    }));

    await EtapaModel.bulkWrite(operaciones);

    return true;
  }

  // ============================================
  // INICIALIZAR PIPELINE POR DEFECTO
  // ============================================

  async inicializarPipelineDefault(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IEtapaPipeline[]> {
    const EtapaModel = await this.getModeloEtapa(String(empresaId), dbConfig);

    // Verificar si ya existen etapas
    const existentes = await EtapaModel.countDocuments({});
    if (existentes > 0) {
      return await this.obtenerEtapas(empresaId, dbConfig, false);
    }

    // Crear etapas por defecto
    const etapasCreadas = await EtapaModel.insertMany(
      ETAPAS_DEFAULT.map((etapa) => ({
        ...etapa,
        empresaId,
        activo: true,
      }))
    );

    return etapasCreadas;
  }

  // ============================================
  // ACTIVAR/DESACTIVAR ETAPA
  // ============================================

  async cambiarEstadoEtapa(
    id: string,
    activo: boolean,
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<IEtapaPipeline | null> {
    const EtapaModel = await this.getModeloEtapa(String(empresaId), dbConfig);

    // Si se desactiva, verificar que no tenga oportunidades
    if (!activo) {
      const OportunidadModel = await getOportunidadModel(String(empresaId), dbConfig);
      const oportunidadesCount = await OportunidadModel.countDocuments({
        etapaId: id,
        estado: 'abierta',
      });

      if (oportunidadesCount > 0) {
        throw new Error(`No se puede desactivar la etapa porque tiene ${oportunidadesCount} oportunidades abiertas`);
      }
    }

    const etapa = await EtapaModel.findOneAndUpdate(
      { _id: id },
      { activo },
      { new: true }
    );

    return etapa;
  }
}

export const pipelineService = new PipelineService();
