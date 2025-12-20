import mongoose from 'mongoose';
import Empresa, { IDatabaseConfig } from '@/modules/empresa/Empresa';
import { getModeloTerminal, ITerminal } from './Terminal';
import { TerminalesService } from './terminales.service';
import { logger } from '@/config/logger';

// ============================================
// SCHEDULER DE SINCRONIZACIÓN DE TERMINALES
// ============================================

interface ScheduledTerminal {
  empresaId: mongoose.Types.ObjectId;
  terminalId: mongoose.Types.ObjectId;
  dbConfig: IDatabaseConfig;
  frecuenciaMinutos: number;
  ultimaEjecucion: Date;
  sincronizarAsistencia: boolean;
  sincronizarEmpleados: boolean;
}

class TerminalSyncScheduler {
  private terminales: Map<string, ScheduledTerminal> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private running: boolean = false;
  private checkIntervalMs: number = 60000; // Verificar cada minuto

  /**
   * Iniciar el scheduler
   */
  async start(): Promise<void> {
    if (this.running) {
      logger.warn('Terminal sync scheduler ya está ejecutándose');
      return;
    }

    logger.info('🔄 Iniciando scheduler de sincronización de terminales...');
    this.running = true;

    // Cargar terminales de todas las empresas
    await this.loadAllTerminales();

    // Iniciar el intervalo de verificación
    this.intervalId = setInterval(() => {
      this.checkAndExecuteSync();
    }, this.checkIntervalMs);

    logger.info(`✅ Scheduler iniciado. ${this.terminales.size} terminales programados.`);
  }

  /**
   * Detener el scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    this.terminales.clear();
    logger.info('⏹️ Scheduler de terminales detenido');
  }

  /**
   * Cargar todos los terminales activos de todas las empresas
   */
  private async loadAllTerminales(): Promise<void> {
    try {
      // Obtener empresas activas
      const empresas = await Empresa.find({ estado: 'activa' });

      for (const empresa of empresas) {
        if (!empresa.databaseConfig) continue;

        try {
          await this.loadTerminalesEmpresa(empresa._id, empresa.databaseConfig);
        } catch (error: any) {
          logger.error(`Error cargando terminales de empresa ${empresa.nombre}: ${error.message}`);
        }
      }
    } catch (error: any) {
      logger.error(`Error cargando terminales: ${error.message}`);
    }
  }

  /**
   * Cargar terminales de una empresa específica
   */
  private async loadTerminalesEmpresa(
    empresaId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<void> {
    const Terminal = await getModeloTerminal(empresaId, dbConfig);

    const terminalesActivos = await Terminal.find({
      activo: true,
      estado: 'activo',
      $or: [
        { 'configuracion.sincronizarAsistencia': true },
        { 'configuracion.sincronizarEmpleados': true },
      ],
    });

    for (const terminal of terminalesActivos) {
      const key = `${empresaId.toString()}_${terminal._id.toString()}`;

      this.terminales.set(key, {
        empresaId,
        terminalId: terminal._id,
        dbConfig,
        frecuenciaMinutos: terminal.configuracion?.frecuenciaMinutos || 15,
        ultimaEjecucion: terminal.ultimaSincronizacion || new Date(0),
        sincronizarAsistencia: terminal.configuracion?.sincronizarAsistencia ?? true,
        sincronizarEmpleados: terminal.configuracion?.sincronizarEmpleados ?? true,
      });
    }
  }

  /**
   * Verificar y ejecutar sincronizaciones pendientes
   */
  private async checkAndExecuteSync(): Promise<void> {
    const ahora = new Date();

    for (const [key, terminal] of this.terminales) {
      try {
        const tiempoTranscurrido = (ahora.getTime() - terminal.ultimaEjecucion.getTime()) / 60000;

        if (tiempoTranscurrido >= terminal.frecuenciaMinutos) {
          await this.ejecutarSync(key, terminal);
        }
      } catch (error: any) {
        logger.error(`Error en sync de terminal ${key}: ${error.message}`);
      }
    }
  }

  /**
   * Ejecutar sincronización de un terminal
   */
  private async ejecutarSync(key: string, terminal: ScheduledTerminal): Promise<void> {
    logger.info(`🔄 Ejecutando sync automático para terminal ${terminal.terminalId}`);

    const service = new TerminalesService(terminal.empresaId, terminal.dbConfig);

    // Crear un usuario "sistema" para las operaciones automáticas
    const sistemaUserId = new mongoose.Types.ObjectId('000000000000000000000000');

    try {
      // Sincronizar asistencia (fichajes)
      if (terminal.sincronizarAsistencia) {
        try {
          const resultado = await service.sincronizarAsistencia(
            terminal.terminalId.toString(),
            {},
            sistemaUserId
          );
          logger.info(
            `  ✅ Asistencia: ${resultado.registrosNuevos} nuevos de ${resultado.registrosProcesados} procesados`
          );
        } catch (error: any) {
          logger.error(`  ❌ Error sync asistencia: ${error.message}`);
        }
      }

      // Sincronizar empleados (menos frecuente, cada 4 ciclos)
      if (terminal.sincronizarEmpleados) {
        const ciclos = Math.floor(
          (new Date().getTime() - terminal.ultimaEjecucion.getTime()) /
            (terminal.frecuenciaMinutos * 60000 * 4)
        );

        if (ciclos >= 1) {
          try {
            const resultado = await service.sincronizarEmpleados(
              terminal.terminalId.toString(),
              {},
              sistemaUserId
            );
            logger.info(
              `  ✅ Empleados: ${resultado.registrosNuevos} nuevos de ${resultado.registrosProcesados} procesados`
            );
          } catch (error: any) {
            logger.error(`  ❌ Error sync empleados: ${error.message}`);
          }
        }
      }

      // Actualizar última ejecución
      terminal.ultimaEjecucion = new Date();
      this.terminales.set(key, terminal);
    } catch (error: any) {
      logger.error(`Error ejecutando sync: ${error.message}`);
    }
  }

  /**
   * Recargar la configuración de un terminal específico
   */
  async reloadTerminal(
    empresaId: mongoose.Types.ObjectId,
    terminalId: mongoose.Types.ObjectId,
    dbConfig: IDatabaseConfig
  ): Promise<void> {
    const key = `${empresaId.toString()}_${terminalId.toString()}`;

    // Eliminar el terminal existente
    this.terminales.delete(key);

    // Recargar desde la BD
    const Terminal = await getModeloTerminal(empresaId, dbConfig);
    const terminal = await Terminal.findById(terminalId);

    if (terminal && terminal.activo && terminal.estado === 'activo') {
      const debeSync =
        terminal.configuracion?.sincronizarAsistencia ||
        terminal.configuracion?.sincronizarEmpleados;

      if (debeSync) {
        this.terminales.set(key, {
          empresaId,
          terminalId: terminal._id,
          dbConfig,
          frecuenciaMinutos: terminal.configuracion?.frecuenciaMinutos || 15,
          ultimaEjecucion: terminal.ultimaSincronizacion || new Date(0),
          sincronizarAsistencia: terminal.configuracion?.sincronizarAsistencia ?? true,
          sincronizarEmpleados: terminal.configuracion?.sincronizarEmpleados ?? true,
        });
        logger.info(`Terminal ${terminalId} recargado en scheduler`);
      }
    }
  }

  /**
   * Eliminar un terminal del scheduler
   */
  removeTerminal(empresaId: mongoose.Types.ObjectId, terminalId: mongoose.Types.ObjectId): void {
    const key = `${empresaId.toString()}_${terminalId.toString()}`;
    this.terminales.delete(key);
    logger.info(`Terminal ${terminalId} eliminado del scheduler`);
  }

  /**
   * Obtener estado del scheduler
   */
  getStatus(): {
    running: boolean;
    terminalesCount: number;
    terminales: Array<{
      key: string;
      frecuenciaMinutos: number;
      ultimaEjecucion: Date;
      proximaEjecucion: Date;
    }>;
  } {
    const terminalesInfo = Array.from(this.terminales.entries()).map(([key, t]) => ({
      key,
      frecuenciaMinutos: t.frecuenciaMinutos,
      ultimaEjecucion: t.ultimaEjecucion,
      proximaEjecucion: new Date(
        t.ultimaEjecucion.getTime() + t.frecuenciaMinutos * 60000
      ),
    }));

    return {
      running: this.running,
      terminalesCount: this.terminales.size,
      terminales: terminalesInfo,
    };
  }

  /**
   * Forzar sincronización inmediata de un terminal
   */
  async forceSync(
    empresaId: mongoose.Types.ObjectId,
    terminalId: mongoose.Types.ObjectId
  ): Promise<void> {
    const key = `${empresaId.toString()}_${terminalId.toString()}`;
    const terminal = this.terminales.get(key);

    if (terminal) {
      await this.ejecutarSync(key, terminal);
    } else {
      logger.warn(`Terminal ${terminalId} no encontrado en scheduler`);
    }
  }
}

// Instancia singleton
export const terminalSyncScheduler = new TerminalSyncScheduler();
export default terminalSyncScheduler;
