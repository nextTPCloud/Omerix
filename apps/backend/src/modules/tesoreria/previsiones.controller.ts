import { Request, Response, NextFunction } from 'express';
import { previsionesService, EscenarioSimulacion, MovimientoSimulado } from './previsiones.service';

class PrevisionesController {
  /**
   * Obtener previsión completa de tesorería
   * GET /previsiones
   */
  async getPrevision(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const {
        dias = '90',
        saldoInicial,
        cuentas,
        incluirProbabilidades = 'true',
        umbralAlerta = '0',
      } = req.query;

      const prevision = await previsionesService.getPrevisionCompleta(empresaId, {
        dias: parseInt(dias as string),
        saldoInicial: saldoInicial ? parseFloat(saldoInicial as string) : undefined,
        incluirCuentas: cuentas ? (cuentas as string).split(',') : undefined,
        incluirProbabilidades: incluirProbabilidades === 'true',
        umbralAlerta: parseFloat(umbralAlerta as string),
      });

      return res.json({
        success: true,
        data: prevision,
      });
    } catch (error: any) {
      console.error('Error obteniendo previsión:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener previsión',
      });
    }
  }

  /**
   * Obtener resumen ejecutivo
   * GET /previsiones/resumen
   */
  async getResumenEjecutivo(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const resumen = await previsionesService.getResumenEjecutivo(empresaId);

      return res.json({
        success: true,
        data: resumen,
      });
    } catch (error: any) {
      console.error('Error obteniendo resumen:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener resumen',
      });
    }
  }

  /**
   * Obtener alertas de descubierto
   * GET /previsiones/alertas
   */
  async getAlertas(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { dias = '30', umbral = '0' } = req.query;

      const alertas = await previsionesService.getAlertasDescubierto(
        empresaId,
        parseInt(dias as string),
        parseFloat(umbral as string)
      );

      return res.json({
        success: true,
        data: alertas,
        total: alertas.length,
      });
    } catch (error: any) {
      console.error('Error obteniendo alertas:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener alertas',
      });
    }
  }

  /**
   * Ejecutar simulación what-if
   * POST /previsiones/simular
   */
  async simular(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { escenario, dias = 90 } = req.body;

      if (!escenario || !escenario.movimientos || !Array.isArray(escenario.movimientos)) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un escenario con movimientos',
        });
      }

      // Validar estructura del escenario
      const escenarioValidado: EscenarioSimulacion = {
        id: escenario.id || `sim_${Date.now()}`,
        nombre: escenario.nombre || 'Simulación',
        movimientos: escenario.movimientos.map((m: any, i: number) => ({
          id: m.id || `mov_${i}`,
          fecha: m.fecha,
          importe: parseFloat(m.importe),
          esEntrada: Boolean(m.esEntrada),
          concepto: m.concepto || 'Movimiento simulado',
          probabilidad: m.probabilidad !== undefined ? parseFloat(m.probabilidad) : undefined,
        })),
      };

      const resultado = await previsionesService.ejecutarSimulacion(
        empresaId,
        escenarioValidado,
        parseInt(dias)
      );

      return res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error ejecutando simulación:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al ejecutar simulación',
      });
    }
  }

  /**
   * Comparar múltiples escenarios
   * POST /previsiones/comparar
   */
  async compararEscenarios(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { escenarios, dias = 90 } = req.body;

      if (!escenarios || !Array.isArray(escenarios) || escenarios.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos 2 escenarios para comparar',
        });
      }

      // Validar escenarios
      const escenariosValidados: EscenarioSimulacion[] = escenarios.map(
        (esc: any, idx: number) => ({
          id: esc.id || `esc_${idx}`,
          nombre: esc.nombre || `Escenario ${idx + 1}`,
          movimientos: (esc.movimientos || []).map((m: any, i: number) => ({
            id: m.id || `mov_${i}`,
            fecha: m.fecha,
            importe: parseFloat(m.importe),
            esEntrada: Boolean(m.esEntrada),
            concepto: m.concepto || 'Movimiento simulado',
            probabilidad: m.probabilidad !== undefined ? parseFloat(m.probabilidad) : undefined,
          })),
        })
      );

      const comparativa = await previsionesService.compararEscenarios(
        empresaId,
        escenariosValidados,
        parseInt(dias)
      );

      return res.json({
        success: true,
        data: comparativa,
      });
    } catch (error: any) {
      console.error('Error comparando escenarios:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al comparar escenarios',
      });
    }
  }

  /**
   * Obtener sugerencias para mejorar flujo de caja
   * GET /previsiones/sugerencias
   */
  async getSugerencias(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { dias = '30' } = req.query;

      // Obtener previsión con alertas
      const prevision = await previsionesService.getPrevisionCompleta(empresaId, {
        dias: parseInt(dias as string),
        umbralAlerta: 0,
      });

      // Recopilar todas las sugerencias únicas
      const sugerenciasSet = new Set<string>();
      for (const alerta of prevision.alertasDescubierto) {
        for (const sug of alerta.sugerencias) {
          sugerenciasSet.add(sug);
        }
      }

      // Añadir sugerencias generales basadas en análisis
      const sugerencias: { tipo: string; descripcion: string; impacto: string }[] = [];

      // 1. Si hay muchos cobros pendientes
      const cobrosPendientes = prevision.previsionDiaria.reduce(
        (sum, d) => sum + d.movimientos.filter(m => m.esEntrada).length,
        0
      );
      if (cobrosPendientes > 10) {
        sugerencias.push({
          tipo: 'cobros',
          descripcion: `Tiene ${cobrosPendientes} cobros pendientes en los próximos ${dias} días`,
          impacto: 'Considere automatizar recordatorios de cobro',
        });
      }

      // 2. Si hay descubiertos previstos
      if (prevision.alertasDescubierto.length > 0) {
        sugerencias.push({
          tipo: 'descubierto',
          descripcion: `Se prevén ${prevision.alertasDescubierto.length} día(s) con saldo negativo`,
          impacto: 'Riesgo de cargos bancarios y problemas de liquidez',
        });

        // Añadir sugerencias específicas
        for (const sug of sugerenciasSet) {
          sugerencias.push({
            tipo: 'accion',
            descripcion: sug,
            impacto: 'Puede evitar o reducir el déficit',
          });
        }
      }

      // 3. Análisis de concentración de pagos
      const diasConPagosAltos = prevision.previsionDiaria.filter(
        d => d.salidas > prevision.saldoActualCuentas * 0.5
      );
      if (diasConPagosAltos.length > 0) {
        sugerencias.push({
          tipo: 'concentracion',
          descripcion: `${diasConPagosAltos.length} día(s) con pagos superiores al 50% del saldo actual`,
          impacto: 'Considere distribuir mejor los vencimientos de pago',
        });
      }

      return res.json({
        success: true,
        data: sugerencias,
        resumen: {
          saldoActual: prevision.saldoActualCuentas,
          saldoPrevisto: prevision.resumen.saldoFinal,
          alertasDescubierto: prevision.alertasDescubierto.length,
          riesgo:
            prevision.alertasDescubierto.length > 5
              ? 'alto'
              : prevision.alertasDescubierto.length > 0
              ? 'medio'
              : 'bajo',
        },
      });
    } catch (error: any) {
      console.error('Error obteniendo sugerencias:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener sugerencias',
      });
    }
  }
}

export const previsionesController = new PrevisionesController();
