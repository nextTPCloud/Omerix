import { Request, Response } from 'express';
import { personalService } from './personal.service';
import {
  CreatePersonalSchema,
  UpdatePersonalSchema,
  GetPersonalQuerySchema,
  BulkDeletePersonalSchema,
  ChangeStatusPersonalSchema,
  RegistrarAusenciaSchema,
  RegistrarVacacionesSchema,
  RegistrarEvaluacionSchema
} from './personal.dto';
import storageService from '@/services/storage.service';

// ============================================
// CREAR EMPLEADO
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
    const validatedData = CreatePersonalSchema.parse(req.body);

    // Verificar NIF duplicado
    if (validatedData.documentacion?.nif) {
      const duplicado = await personalService.verificarDuplicados(
        validatedData.documentacion.nif,
        empresaId,
        dbConfig
      );
      if (duplicado) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un empleado con ese NIF'
        });
      }
    }

    const empleado = await personalService.crear(validatedData, empresaId, userId, dbConfig);

    return res.status(201).json({
      success: true,
      data: empleado
    });
  } catch (error: any) {
    console.error('Error al crear empleado:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al crear empleado'
    });
  }
};

// ============================================
// LISTAR PERSONAL
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

    const query = GetPersonalQuerySchema.parse(req.query);
    const result = await personalService.findAll(empresaId, dbConfig, query);

    return res.json({
      success: true,
      data: result.personal,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error al listar personal:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al listar personal'
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

    const empleado = await personalService.findById(id, empresaId, dbConfig);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    return res.json({
      success: true,
      data: empleado
    });
  } catch (error: any) {
    console.error('Error al obtener empleado:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener empleado'
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

    const validatedData = UpdatePersonalSchema.parse(req.body);

    // Verificar NIF duplicado si cambia
    if (validatedData.documentacion?.nif) {
      const duplicado = await personalService.verificarDuplicados(
        validatedData.documentacion.nif,
        empresaId,
        dbConfig,
        id
      );
      if (duplicado) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un empleado con ese NIF'
        });
      }
    }

    const empleado = await personalService.actualizar(id, validatedData, empresaId, userId, dbConfig);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    return res.json({
      success: true,
      data: empleado
    });
  } catch (error: any) {
    console.error('Error al actualizar empleado:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar empleado'
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

    const eliminado = await personalService.eliminar(id, empresaId, dbConfig);

    if (!eliminado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    return res.json({
      success: true,
      message: 'Empleado eliminado correctamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar empleado:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar empleado'
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

    const { ids } = BulkDeletePersonalSchema.parse(req.body);
    const count = await personalService.eliminarMultiples(ids, empresaId, dbConfig);

    return res.json({
      success: true,
      message: `${count} empleado(s) eliminado(s)`,
      count
    });
  } catch (error: any) {
    console.error('Error al eliminar empleados:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar empleados'
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

    const { activo } = ChangeStatusPersonalSchema.parse(req.body);
    const empleado = await personalService.cambiarEstado(id, activo, empresaId, userId, dbConfig);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    return res.json({
      success: true,
      data: empleado,
      message: activo ? 'Empleado activado' : 'Empleado desactivado'
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

    const estadisticas = await personalService.obtenerEstadisticas(empresaId, dbConfig);

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

    const codigo = await personalService.sugerirSiguienteCodigo(
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

    const empleado = await personalService.duplicar(id, empresaId, userId, dbConfig);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado original no encontrado'
      });
    }

    return res.status(201).json({
      success: true,
      data: empleado,
      message: 'Empleado duplicado correctamente'
    });
  } catch (error: any) {
    console.error('Error al duplicar empleado:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al duplicar empleado'
    });
  }
};

// ============================================
// REGISTRAR AUSENCIA
// ============================================
export const registrarAusencia = async (req: Request, res: Response) => {
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

    const ausencia = RegistrarAusenciaSchema.parse(req.body);
    const empleado = await personalService.registrarAusencia(id, ausencia, empresaId, userId, dbConfig);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    return res.json({
      success: true,
      data: empleado,
      message: 'Ausencia registrada correctamente'
    });
  } catch (error: any) {
    console.error('Error al registrar ausencia:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar ausencia'
    });
  }
};

// ============================================
// ACTUALIZAR VACACIONES
// ============================================
export const actualizarVacaciones = async (req: Request, res: Response) => {
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

    const vacaciones = RegistrarVacacionesSchema.parse(req.body);
    const empleado = await personalService.actualizarVacaciones(id, vacaciones, empresaId, userId, dbConfig);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    return res.json({
      success: true,
      data: empleado,
      message: 'Vacaciones actualizadas correctamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar vacaciones:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar vacaciones'
    });
  }
};

// ============================================
// ELIMINAR VACACIONES
// ============================================
export const eliminarVacaciones = async (req: Request, res: Response) => {
  try {
    const { id, anio } = req.params;
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

    const empleado = await personalService.eliminarVacaciones(id, parseInt(anio), empresaId, userId, dbConfig);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    return res.json({
      success: true,
      data: empleado,
      message: 'Vacaciones eliminadas correctamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar vacaciones:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar vacaciones'
    });
  }
};

// ============================================
// ACTUALIZAR AUSENCIA
// ============================================
export const actualizarAusencia = async (req: Request, res: Response) => {
  try {
    const { id, ausenciaId } = req.params;
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

    const ausencia = RegistrarAusenciaSchema.parse(req.body);
    const empleado = await personalService.actualizarAusencia(id, ausenciaId, ausencia, empresaId, userId, dbConfig);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado o ausencia no encontrado'
      });
    }

    return res.json({
      success: true,
      data: empleado,
      message: 'Ausencia actualizada correctamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar ausencia:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar ausencia'
    });
  }
};

// ============================================
// ELIMINAR AUSENCIA
// ============================================
export const eliminarAusencia = async (req: Request, res: Response) => {
  try {
    const { id, ausenciaId } = req.params;
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

    const empleado = await personalService.eliminarAusencia(id, ausenciaId, empresaId, userId, dbConfig);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado o ausencia no encontrado'
      });
    }

    return res.json({
      success: true,
      data: empleado,
      message: 'Ausencia eliminada correctamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar ausencia:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar ausencia'
    });
  }
};

// ============================================
// REGISTRAR EVALUACIÓN
// ============================================
export const registrarEvaluacion = async (req: Request, res: Response) => {
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

    const evaluacion = RegistrarEvaluacionSchema.parse(req.body);
    const empleado = await personalService.registrarEvaluacion(id, evaluacion, empresaId, userId, dbConfig);

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    return res.json({
      success: true,
      data: empleado,
      message: 'Evaluación registrada correctamente'
    });
  } catch (error: any) {
    console.error('Error al registrar evaluación:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar evaluación'
    });
  }
};

// ============================================
// OBTENER SUBORDINADOS
// ============================================
export const getSubordinados = async (req: Request, res: Response) => {
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

    const subordinados = await personalService.obtenerSubordinados(id, empresaId, dbConfig);

    return res.json({
      success: true,
      data: subordinados
    });
  } catch (error: any) {
    console.error('Error al obtener subordinados:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener subordinados'
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

    const filtros = GetPersonalQuerySchema.parse(req.query);
    const personal = await personalService.exportarCSV(empresaId, dbConfig, filtros);

    // Generar CSV
    const headers = ['Código', 'Nombre', 'Apellidos', 'NIF', 'Puesto', 'Departamento', 'Tipo Contrato', 'Estado', 'Email Corp.', 'Teléfono', 'Fecha Alta', 'Salario Bruto Anual'];
    const rows = personal.map((e: any) => [
      e.codigo,
      e.nombre,
      e.apellidos,
      e.documentacion?.nif || '',
      e.datosLaborales?.puesto || '',
      e.datosLaborales?.departamentoId || '',
      e.datosLaborales?.tipoContrato || '',
      e.estado,
      e.contacto?.emailCorporativo || '',
      e.contacto?.telefonoMovil || e.contacto?.telefono || '',
      e.datosLaborales?.fechaInicioContrato ? new Date(e.datosLaborales.fechaInicioContrato).toLocaleDateString('es-ES') : '',
      e.datosEconomicos?.salarioBrutoAnual || ''
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=personal.csv');
    return res.send('\uFEFF' + csv); // BOM para Excel
  } catch (error: any) {
    console.error('Error al exportar CSV:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al exportar CSV'
    });
  }
};

// ============================================
// CALENDARIO DE AUSENCIAS
// ============================================
export const getCalendarioAusencias = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId;
    const dbConfig = req.empresaDbConfig;
    const { mes, anio } = req.query;

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

    const now = new Date();
    const mesNum = mes ? parseInt(mes as string) : now.getMonth() + 1;
    const anioNum = anio ? parseInt(anio as string) : now.getFullYear();

    const calendario = await personalService.obtenerCalendarioAusencias(
      empresaId,
      dbConfig,
      mesNum,
      anioNum
    );

    return res.json({
      success: true,
      data: calendario
    });
  } catch (error: any) {
    console.error('Error al obtener calendario:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener calendario'
    });
  }
};

// ============================================
// SUBIR FOTO
// ============================================
export const subirFoto = async (req: Request, res: Response) => {
  try {
    if (!req.empresaId || !req.userId) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (!req.empresaDbConfig) {
      return res.status(500).json({ success: false, message: 'Error de configuración de base de datos' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
    }

    const result = await storageService.uploadFile({
      empresaId: req.empresaId,
      modulo: 'personal',
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      isPublic: false,
      generateThumbnails: true,
    });

    const empleado = await personalService.actualizarFoto(
      req.params.id, req.empresaId, req.empresaDbConfig, result.url
    );

    if (!empleado) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    res.json({ success: true, data: empleado, message: 'Foto actualizada exitosamente' });
  } catch (error: any) {
    console.error('Error al subir foto:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al subir foto' });
  }
};

// ============================================
// SUBIR DOCUMENTO
// ============================================
export const subirDocumento = async (req: Request, res: Response) => {
  try {
    if (!req.empresaId || !req.userId) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (!req.empresaDbConfig) {
      return res.status(500).json({ success: false, message: 'Error de configuración de base de datos' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
    }

    const result = await storageService.uploadFile({
      empresaId: req.empresaId,
      modulo: 'personal',
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      isPublic: false,
    });

    const { tipo, nombre: nombreDoc, confidencial } = req.body;

    const empleado = await personalService.agregarDocumento(
      req.params.id, req.empresaId, req.empresaDbConfig, {
        nombre: nombreDoc || req.file.originalname,
        tipo: tipo || 'otro',
        url: result.url,
        fechaSubida: new Date(),
        subidoPor: req.userId!,
        confidencial: confidencial === 'true' || confidencial === true,
      }
    );

    if (!empleado) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    res.json({ success: true, data: empleado, message: 'Documento subido exitosamente' });
  } catch (error: any) {
    console.error('Error al subir documento:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al subir documento' });
  }
};

// ============================================
// ELIMINAR DOCUMENTO
// ============================================
export const eliminarDocumento = async (req: Request, res: Response) => {
  try {
    if (!req.empresaId || !req.userId) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (!req.empresaDbConfig) {
      return res.status(500).json({ success: false, message: 'Error de configuración de base de datos' });
    }

    const empleado = await personalService.eliminarDocumento(
      req.params.id, req.empresaId, req.empresaDbConfig, req.params.docId
    );

    if (!empleado) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    res.json({ success: true, data: empleado, message: 'Documento eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al eliminar documento' });
  }
};
