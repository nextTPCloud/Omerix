import { Request, Response } from 'express';
import { agentesService } from './agentes-comerciales.service';
import {
  CreateAgenteComercialSchema,
  UpdateAgenteComercialSchema,
  GetAgentesQuerySchema,
  BulkDeleteAgentesSchema,
  ChangeStatusSchema,
  AsignarClientesSchema,
  RegistrarVentaSchema
} from './agentes-comerciales.dto';

// ============================================
// CREAR AGENTE
// ============================================
export const create = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId;
    const userId = req.userId;

    if (!empresaId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const dbConfig = req.empresaDbConfig;
    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    // Validar datos
    const validatedData = CreateAgenteComercialSchema.parse(req.body);

    // Verificar NIF duplicado
    if (validatedData.nif) {
      const duplicado = await agentesService.verificarDuplicados(
        validatedData.nif,
        empresaId,
        dbConfig
      );
      if (duplicado) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un agente con ese NIF'
        });
      }
    }

    const agente = await agentesService.crear(validatedData, empresaId, userId, dbConfig);

    return res.status(201).json({
      success: true,
      data: agente
    });
  } catch (error: any) {
    console.error('Error al crear agente comercial:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al crear agente comercial'
    });
  }
};

// ============================================
// LISTAR AGENTES
// ============================================
export const findAll = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId;
    const dbConfig = req.empresaDbConfig;

    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const query = GetAgentesQuerySchema.parse(req.query);
    const result = await agentesService.findAll(empresaId, dbConfig, query);

    return res.json({
      success: true,
      data: result.agentes,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error al listar agentes:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al listar agentes'
    });
  }
};

// ============================================
// OBTENER POR ID
// ============================================
export const findById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.empresaId;
    const dbConfig = req.empresaDbConfig;

    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const agente = await agentesService.findById(id, empresaId, dbConfig);

    if (!agente) {
      return res.status(404).json({
        success: false,
        message: 'Agente no encontrado'
      });
    }

    return res.json({
      success: true,
      data: agente
    });
  } catch (error: any) {
    console.error('Error al obtener agente:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener agente'
    });
  }
};

// ============================================
// ACTUALIZAR
// ============================================
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.empresaId;
    const userId = req.userId;
    const dbConfig = req.empresaDbConfig;

    if (!empresaId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const validatedData = UpdateAgenteComercialSchema.parse(req.body);

    // Verificar NIF duplicado si cambia
    if (validatedData.nif) {
      const duplicado = await agentesService.verificarDuplicados(
        validatedData.nif,
        empresaId,
        dbConfig,
        id
      );
      if (duplicado) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un agente con ese NIF'
        });
      }
    }

    const agente = await agentesService.actualizar(id, validatedData, empresaId, userId, dbConfig);

    if (!agente) {
      return res.status(404).json({
        success: false,
        message: 'Agente no encontrado'
      });
    }

    return res.json({
      success: true,
      data: agente
    });
  } catch (error: any) {
    console.error('Error al actualizar agente:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar agente'
    });
  }
};

// ============================================
// ELIMINAR
// ============================================
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.empresaId;
    const dbConfig = req.empresaDbConfig;

    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const eliminado = await agentesService.eliminar(id, empresaId, dbConfig);

    if (!eliminado) {
      return res.status(404).json({
        success: false,
        message: 'Agente no encontrado'
      });
    }

    return res.json({
      success: true,
      message: 'Agente eliminado correctamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar agente:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar agente'
    });
  }
};

// ============================================
// ELIMINAR MÚLTIPLES
// ============================================
export const bulkDelete = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId;
    const dbConfig = req.empresaDbConfig;

    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const { ids } = BulkDeleteAgentesSchema.parse(req.body);
    const count = await agentesService.eliminarMultiples(ids, empresaId, dbConfig);

    return res.json({
      success: true,
      message: `${count} agente(s) eliminado(s)`,
      count
    });
  } catch (error: any) {
    console.error('Error al eliminar agentes:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar agentes'
    });
  }
};

// ============================================
// CAMBIAR ESTADO
// ============================================
export const changeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.empresaId;
    const userId = req.userId;
    const dbConfig = req.empresaDbConfig;

    if (!empresaId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const { activo } = ChangeStatusSchema.parse(req.body);
    const agente = await agentesService.cambiarEstado(id, activo, empresaId, userId, dbConfig);

    if (!agente) {
      return res.status(404).json({
        success: false,
        message: 'Agente no encontrado'
      });
    }

    return res.json({
      success: true,
      data: agente,
      message: activo ? 'Agente activado' : 'Agente desactivado'
    });
  } catch (error: any) {
    console.error('Error al cambiar estado:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al cambiar estado'
    });
  }
};

// ============================================
// ESTADÍSTICAS
// ============================================
export const getEstadisticas = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId;
    const dbConfig = req.empresaDbConfig;

    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const estadisticas = await agentesService.obtenerEstadisticas(empresaId, dbConfig);

    return res.json({
      success: true,
      data: estadisticas
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener estadísticas'
    });
  }
};

// ============================================
// SUGERIR CÓDIGO
// ============================================
export const sugerirCodigo = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId;
    const dbConfig = req.empresaDbConfig;
    const { prefijo } = req.query;

    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const codigo = await agentesService.sugerirSiguienteCodigo(
      empresaId,
      dbConfig,
      prefijo as string
    );

    return res.json({
      success: true,
      data: { codigo }
    });
  } catch (error: any) {
    console.error('Error al sugerir código:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al sugerir código'
    });
  }
};

// ============================================
// DUPLICAR
// ============================================
export const duplicar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.empresaId;
    const userId = req.userId;
    const dbConfig = req.empresaDbConfig;

    if (!empresaId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const agente = await agentesService.duplicar(id, empresaId, userId, dbConfig);

    if (!agente) {
      return res.status(404).json({
        success: false,
        message: 'Agente original no encontrado'
      });
    }

    return res.status(201).json({
      success: true,
      data: agente,
      message: 'Agente duplicado correctamente'
    });
  } catch (error: any) {
    console.error('Error al duplicar agente:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al duplicar agente'
    });
  }
};

// ============================================
// ASIGNAR CLIENTES
// ============================================
export const asignarClientes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.empresaId;
    const userId = req.userId;
    const dbConfig = req.empresaDbConfig;

    if (!empresaId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const { clienteIds } = AsignarClientesSchema.parse(req.body);
    const agente = await agentesService.asignarClientes(id, clienteIds, empresaId, userId, dbConfig);

    if (!agente) {
      return res.status(404).json({
        success: false,
        message: 'Agente no encontrado'
      });
    }

    return res.json({
      success: true,
      data: agente,
      message: 'Clientes asignados correctamente'
    });
  } catch (error: any) {
    console.error('Error al asignar clientes:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al asignar clientes'
    });
  }
};

// ============================================
// REGISTRAR VENTA
// ============================================
export const registrarVenta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.empresaId;
    const userId = req.userId;
    const dbConfig = req.empresaDbConfig;

    if (!empresaId || !userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const { importe, comision } = RegistrarVentaSchema.parse(req.body);
    const agente = await agentesService.registrarVenta(
      id,
      importe,
      comision || 0,
      empresaId,
      userId,
      dbConfig
    );

    if (!agente) {
      return res.status(404).json({
        success: false,
        message: 'Agente no encontrado'
      });
    }

    return res.json({
      success: true,
      data: agente,
      message: 'Venta registrada correctamente'
    });
  } catch (error: any) {
    console.error('Error al registrar venta:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar venta'
    });
  }
};

// ============================================
// EXPORTAR CSV
// ============================================
export const exportarCSV = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId;
    const dbConfig = req.empresaDbConfig;

    if (!empresaId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!dbConfig) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos'
      });
    }

    const filtros = GetAgentesQuerySchema.parse(req.query);
    const agentes = await agentesService.exportarCSV(empresaId, dbConfig, filtros);

    // Generar CSV
    const headers = ['Código', 'Nombre', 'Apellidos', 'NIF', 'Tipo', 'Estado', 'Email', 'Teléfono', 'Comisión %', 'Ventas Totales', 'Comisiones'];
    const rows = agentes.map((a: any) => [
      a.codigo,
      a.nombre,
      a.apellidos || '',
      a.nif || '',
      a.tipo,
      a.estado,
      a.contacto?.email || '',
      a.contacto?.telefono || '',
      a.comision?.porcentaje || 0,
      a.ventasTotales || 0,
      a.comisionesAcumuladas || 0
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=agentes-comerciales.csv');
    return res.send('\uFEFF' + csv); // BOM para Excel
  } catch (error: any) {
    console.error('Error al exportar CSV:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al exportar CSV'
    });
  }
};
