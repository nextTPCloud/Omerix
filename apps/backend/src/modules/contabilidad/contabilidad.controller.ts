/**
 * Controller de Contabilidad
 */

import { Request, Response } from 'express';
import { contabilidadService } from './contabilidad.service';
import {
  CrearCuentaSchema,
  ActualizarCuentaSchema,
  FiltrosCuentasSchema,
  CrearAsientoSchema,
  FiltrosAsientosSchema,
  AnularAsientoSchema,
  ActualizarConfigSchema,
  FiltrosInformesSchema,
} from './contabilidad.dto';
import {
  libroDiarioService,
  libroMayorService,
  sumasSaldosService,
  balanceSituacionService,
  cuentaResultadosService,
} from './informes';
import {
  exportarAsientosCSV,
  exportarPlanCuentasCSV,
  exportarAsientosA3,
  exportarPlanCuentasA3,
  generarNombreArchivoA3,
  exportarAsientosSage,
  exportarPlanCuentasSage,
  generarNombreArchivoSage,
  EXPORT_FORMATS,
  ExportFormat,
} from './exportadores';

export class ContabilidadController {
  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * Obtener configuración contable
   */
  async getConfig(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;

      const config = await contabilidadService.getConfig(empresaId, empresaDbConfig);

      res.json(config);
    } catch (error: any) {
      console.error('[Contabilidad] Error obteniendo config:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Actualizar configuración contable
   */
  async actualizarConfig(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig, usuarioId } = req as any;

      const datos = ActualizarConfigSchema.parse(req.body);

      const config = await contabilidadService.actualizarConfig(
        empresaId,
        empresaDbConfig,
        datos,
        usuarioId
      );

      res.json(config);
    } catch (error: any) {
      console.error('[Contabilidad] Error actualizando config:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Inicializar plan de cuentas PGC 2007
   */
  async inicializarPlanCuentas(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig, usuarioId } = req as any;

      const resultado = await contabilidadService.inicializarPlanCuentas(
        empresaId,
        empresaDbConfig,
        usuarioId
      );

      res.json({
        mensaje: `Plan de cuentas inicializado. ${resultado.cuentasCreadas} cuentas creadas.`,
        ...resultado,
      });
    } catch (error: any) {
      console.error('[Contabilidad] Error inicializando plan:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  // ============================================
  // CUENTAS CONTABLES
  // ============================================

  /**
   * Listar cuentas contables
   */
  async listarCuentas(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;

      const filtros = FiltrosCuentasSchema.parse(req.query);

      const cuentas = await contabilidadService.listarCuentas(
        empresaId,
        empresaDbConfig,
        filtros
      );

      res.json(cuentas);
    } catch (error: any) {
      console.error('[Contabilidad] Error listando cuentas:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener cuenta por ID
   */
  async obtenerCuenta(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;
      const { id } = req.params;

      const cuenta = await contabilidadService.obtenerCuenta(
        empresaId,
        empresaDbConfig,
        id
      );

      if (!cuenta) {
        return res.status(404).json({ error: 'Cuenta no encontrada' });
      }

      res.json(cuenta);
    } catch (error: any) {
      console.error('[Contabilidad] Error obteniendo cuenta:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Crear subcuenta
   */
  async crearCuenta(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig, usuarioId } = req as any;

      const datos = CrearCuentaSchema.parse(req.body);

      const cuenta = await contabilidadService.crearCuenta(
        empresaId,
        empresaDbConfig,
        datos,
        usuarioId
      );

      res.status(201).json(cuenta);
    } catch (error: any) {
      console.error('[Contabilidad] Error creando cuenta:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Actualizar cuenta
   */
  async actualizarCuenta(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig, usuarioId } = req as any;
      const { id } = req.params;

      const datos = ActualizarCuentaSchema.parse(req.body);

      const cuenta = await contabilidadService.actualizarCuenta(
        empresaId,
        empresaDbConfig,
        id,
        datos,
        usuarioId
      );

      res.json(cuenta);
    } catch (error: any) {
      console.error('[Contabilidad] Error actualizando cuenta:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Desactivar cuenta
   */
  async desactivarCuenta(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig, usuarioId } = req as any;
      const { id } = req.params;

      const cuenta = await contabilidadService.desactivarCuenta(
        empresaId,
        empresaDbConfig,
        id,
        usuarioId
      );

      res.json(cuenta);
    } catch (error: any) {
      console.error('[Contabilidad] Error desactivando cuenta:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // ============================================
  // ASIENTOS CONTABLES
  // ============================================

  /**
   * Listar asientos
   */
  async listarAsientos(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;

      const filtros = FiltrosAsientosSchema.parse(req.query);

      const resultado = await contabilidadService.listarAsientos(
        empresaId,
        empresaDbConfig,
        filtros
      );

      res.json(resultado);
    } catch (error: any) {
      console.error('[Contabilidad] Error listando asientos:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener asiento por ID
   */
  async obtenerAsiento(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;
      const { id } = req.params;

      const asiento = await contabilidadService.obtenerAsiento(
        empresaId,
        empresaDbConfig,
        id
      );

      if (!asiento) {
        return res.status(404).json({ error: 'Asiento no encontrado' });
      }

      res.json(asiento);
    } catch (error: any) {
      console.error('[Contabilidad] Error obteniendo asiento:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Crear asiento manual
   */
  async crearAsiento(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig, usuarioId } = req as any;

      const datos = CrearAsientoSchema.parse(req.body);

      const asiento = await contabilidadService.crearAsiento(
        empresaId,
        empresaDbConfig,
        datos,
        usuarioId
      );

      res.status(201).json(asiento);
    } catch (error: any) {
      console.error('[Contabilidad] Error creando asiento:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Anular asiento
   */
  async anularAsiento(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig, usuarioId } = req as any;
      const { id } = req.params;

      const { motivo } = AnularAsientoSchema.parse(req.body);

      const contraAsiento = await contabilidadService.anularAsiento(
        empresaId,
        empresaDbConfig,
        id,
        motivo,
        usuarioId
      );

      res.json({
        mensaje: 'Asiento anulado correctamente',
        contraAsiento,
      });
    } catch (error: any) {
      console.error('[Contabilidad] Error anulando asiento:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // ============================================
  // INFORMES CONTABLES
  // ============================================

  /**
   * Obtener libro diario
   */
  async libroDiario(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;

      const filtros = FiltrosInformesSchema.parse(req.query);

      const resultado = await libroDiarioService.generar(empresaId, empresaDbConfig, {
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        ejercicio: filtros.ejercicio,
        incluirAnulados: false,
        pagina: 1,
        limite: 1000,
      });

      res.json(resultado);
    } catch (error: any) {
      console.error('[Contabilidad] Error generando libro diario:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener libro mayor de una cuenta
   */
  async libroMayor(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;
      const { cuenta } = req.params;

      const filtros = FiltrosInformesSchema.parse(req.query);

      const resultado = await libroMayorService.generarPorCuenta(
        empresaId,
        empresaDbConfig,
        cuenta,
        {
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
          ejercicio: filtros.ejercicio,
          incluirAnulados: false,
        }
      );

      if (!resultado) {
        return res.status(404).json({ error: 'Cuenta no encontrada' });
      }

      res.json(resultado);
    } catch (error: any) {
      console.error('[Contabilidad] Error generando libro mayor:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener libro mayor general (todas las cuentas)
   */
  async libroMayorGeneral(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;

      const filtros = FiltrosInformesSchema.parse(req.query);

      const resultado = await libroMayorService.generar(empresaId, empresaDbConfig, {
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        ejercicio: filtros.ejercicio,
        nivel: filtros.nivel,
        cuentaDesde: filtros.cuentaDesde,
        cuentaHasta: filtros.cuentaHasta,
        incluirCuentasSinMovimiento: filtros.incluirCuentasSinMovimiento,
        incluirAnulados: false,
      });

      res.json(resultado);
    } catch (error: any) {
      console.error('[Contabilidad] Error generando libro mayor general:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener balance de sumas y saldos
   */
  async sumasSaldos(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;

      const filtros = FiltrosInformesSchema.parse(req.query);

      const resultado = await sumasSaldosService.generar(empresaId, empresaDbConfig, {
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        ejercicio: filtros.ejercicio,
        nivel: filtros.nivel,
        cuentaDesde: filtros.cuentaDesde,
        cuentaHasta: filtros.cuentaHasta,
        soloConMovimiento: true,
        agruparPorGrupo: true,
      });

      res.json(resultado);
    } catch (error: any) {
      console.error('[Contabilidad] Error generando sumas y saldos:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener balance de situación
   */
  async balanceSituacion(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;

      const filtros = FiltrosInformesSchema.parse(req.query);

      const resultado = await balanceSituacionService.generar(empresaId, empresaDbConfig, {
        fechaHasta: filtros.fechaHasta,
        ejercicio: filtros.ejercicio,
        nivelDetalle: filtros.nivel || 3,
        incluirCuentasVacias: false,
      });

      res.json(resultado);
    } catch (error: any) {
      console.error('[Contabilidad] Error generando balance:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener cuenta de pérdidas y ganancias
   */
  async cuentaResultados(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;

      const filtros = FiltrosInformesSchema.parse(req.query);

      const resultado = await cuentaResultadosService.generar(empresaId, empresaDbConfig, {
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        ejercicio: filtros.ejercicio,
        nivelDetalle: filtros.nivel || 3,
        compararEjercicioAnterior: false,
      });

      res.json(resultado);
    } catch (error: any) {
      console.error('[Contabilidad] Error generando PyG:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener cuenta de resultados resumida
   */
  async cuentaResultadosResumida(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;

      const filtros = FiltrosInformesSchema.parse(req.query);

      const resultado = await cuentaResultadosService.generarResumido(
        empresaId,
        empresaDbConfig,
        {
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
          ejercicio: filtros.ejercicio,
        }
      );

      res.json(resultado);
    } catch (error: any) {
      console.error('[Contabilidad] Error generando PyG resumido:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  // ============================================
  // EXPORTACIÓN
  // ============================================

  /**
   * Obtener formatos de exportación disponibles
   */
  async getFormatosExportacion(_req: Request, res: Response) {
    try {
      res.json(EXPORT_FORMATS);
    } catch (error: any) {
      console.error('[Contabilidad] Error obteniendo formatos:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Exportar asientos contables
   */
  async exportarAsientos(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;
      const formato = (req.query.formato || 'csv') as ExportFormat;
      const codigoEmpresa = (req.query.codigoEmpresa as string) || '001';

      const filtros = FiltrosInformesSchema.parse(req.query);

      // Obtener asientos
      const { asientos } = await contabilidadService.listarAsientos(
        empresaId,
        empresaDbConfig,
        {
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
          ejercicio: filtros.ejercicio,
          limite: 100000, // Sin límite práctico para exportación
        }
      );

      if (asientos.length === 0) {
        return res.status(404).json({ error: 'No hay asientos para exportar con los filtros indicados' });
      }

      const ejercicio = filtros.ejercicio || new Date().getFullYear();
      let contenido: string;
      let nombreArchivo: string;
      let contentType: string;

      switch (formato) {
        case 'a3':
          contenido = exportarAsientosA3(asientos, { codigoEmpresa, ejercicio });
          nombreArchivo = generarNombreArchivoA3('diario', codigoEmpresa, ejercicio);
          contentType = 'text/plain; charset=utf-8';
          break;

        case 'sage50':
        case 'sagedespachos':
        case 'sage200':
          contenido = exportarAsientosSage(asientos, {
            codigoEmpresa,
            ejercicio,
            formato,
            incluirCabecera: formato === 'sage200',
          });
          nombreArchivo = generarNombreArchivoSage('asientos', formato, codigoEmpresa, ejercicio);
          contentType = formato === 'sage200' ? 'text/csv; charset=utf-8' : 'text/plain; charset=utf-8';
          break;

        case 'csv':
        default:
          contenido = exportarAsientosCSV(asientos, {
            incluirCabecera: true,
            formatoFecha: 'es',
          });
          nombreArchivo = `asientos_${ejercicio}.csv`;
          contentType = 'text/csv; charset=utf-8';
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.send(contenido);
    } catch (error: any) {
      console.error('[Contabilidad] Error exportando asientos:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Exportar plan de cuentas
   */
  async exportarPlanCuentas(req: Request, res: Response) {
    try {
      const { empresaId, empresaDbConfig } = req as any;
      const formato = (req.query.formato || 'csv') as ExportFormat;
      const codigoEmpresa = (req.query.codigoEmpresa as string) || '001';
      const ejercicio = parseInt(req.query.ejercicio as string) || new Date().getFullYear();

      // Obtener cuentas
      const cuentas = await contabilidadService.listarCuentas(
        empresaId,
        empresaDbConfig,
        { activa: true }
      );

      if (cuentas.length === 0) {
        return res.status(404).json({ error: 'No hay cuentas para exportar' });
      }

      let contenido: string;
      let nombreArchivo: string;
      let contentType: string;

      switch (formato) {
        case 'a3':
          contenido = exportarPlanCuentasA3(
            cuentas.map(c => ({
              codigo: c.codigo,
              nombre: c.nombre,
              esTitulo: !c.esMovimiento,
            })),
            { codigoEmpresa, ejercicio }
          );
          nombreArchivo = generarNombreArchivoA3('cuentas', codigoEmpresa, ejercicio);
          contentType = 'text/plain; charset=utf-8';
          break;

        case 'sage50':
        case 'sagedespachos':
        case 'sage200':
          contenido = exportarPlanCuentasSage(
            cuentas.map(c => ({
              codigo: c.codigo,
              nombre: c.nombre,
              nivel: c.nivel,
              esTitulo: !c.esMovimiento,
              activa: c.activa,
            })),
            { codigoEmpresa, ejercicio, formato, incluirCabecera: true }
          );
          nombreArchivo = generarNombreArchivoSage('cuentas', formato, codigoEmpresa, ejercicio);
          contentType = formato === 'sage200' ? 'text/csv; charset=utf-8' : 'text/plain; charset=utf-8';
          break;

        case 'csv':
        default:
          contenido = exportarPlanCuentasCSV(
            cuentas.map(c => ({
              codigo: c.codigo,
              nombre: c.nombre,
              tipo: c.tipo,
              nivel: c.nivel,
              esTitulo: !c.esMovimiento,
              activa: c.activa,
            })),
            { incluirCabecera: true }
          );
          nombreArchivo = `plan_cuentas_${ejercicio}.csv`;
          contentType = 'text/csv; charset=utf-8';
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.send(contenido);
    } catch (error: any) {
      console.error('[Contabilidad] Error exportando plan de cuentas:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
}

export const contabilidadController = new ContabilidadController();
