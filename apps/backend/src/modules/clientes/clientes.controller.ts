import { Request, Response } from 'express';
import { ClienteService } from './clientes.service';
import {
  CreateClienteSchema,
  UpdateClienteSchema,
  ClienteQuerySchema,
} from './clientes.dto';
import { ZodError } from 'zod';

const clienteService = new ClienteService();

/**
 * Crear un nuevo cliente
 * POST /api/clientes
 */
export const createCliente = async (req: Request, res: Response) => {
  try {
    // Validar datos
    const validatedData = CreateClienteSchema.parse(req.body);

    // Obtener empresaId y usuarioId del request (añadidos por middleware)
    const empresaId = req.empresaId!;
    const usuarioId = req.userId!;

    // Crear cliente
    const cliente = await clienteService.create(empresaId, usuarioId, validatedData);

    res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente',
      data: clienteService.formatClienteResponse(cliente),
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear cliente',
    });
  }
};

/**
 * Obtener todos los clientes
 * GET /api/clientes
 */
export const getClientes = async (req: Request, res: Response) => {
  try {
    // Validar query params
    const queryParams = ClienteQuerySchema.parse(req.query);

    const empresaId = req.empresaId!;

    // Obtener clientes
    const { clientes, pagination } = await clienteService.findAll(
      empresaId,
      queryParams
    );

    res.status(200).json({
      success: true,
      data: clientes.map(c => clienteService.formatClienteResponse(c)),
      pagination,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de búsqueda inválidos',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener clientes',
    });
  }
};

/**
 * Obtener un cliente por ID
 * GET /api/clientes/:id
 */
export const getClienteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.empresaId!;

    const cliente = await clienteService.findById(empresaId, id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: clienteService.formatClienteResponse(cliente),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener cliente',
    });
  }
};

/**
 * Actualizar un cliente
 * PUT /api/clientes/:id
 */
export const updateCliente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateClienteSchema.parse(req.body);

    const empresaId = req.empresaId!;
    const usuarioId = req.userId!;

    const cliente = await clienteService.update(
      empresaId,
      id,
      usuarioId,
      validatedData
    );

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cliente actualizado correctamente',
      data: clienteService.formatClienteResponse(cliente),
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar cliente',
    });
  }
};

/**
 * Eliminar un cliente (soft delete)
 * DELETE /api/clientes/:id
 */
export const deleteCliente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = req.empresaId!;

    const deleted = await clienteService.delete(empresaId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cliente desactivado correctamente',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar cliente',
    });
  }
};

/**
 * Obtener estadísticas de clientes
 * GET /api/clientes/estadisticas
 */
export const getEstadisticas = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    const estadisticas = await clienteService.getEstadisticas(empresaId);

    res.status(200).json({
      success: true,
      data: estadisticas,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener estadísticas',
    });
  }
};

/**
 * Buscar clientes
 * GET /api/clientes/search?q=termino
 */
export const searchClientes = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const empresaId = req.empresaId!;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Parámetro de búsqueda requerido',
      });
    }

    const clientes = await clienteService.search(empresaId, q);

    res.status(200).json({
      success: true,
      data: clientes.map(c => clienteService.formatClienteResponse(c)),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error en la búsqueda',
    });
  }
};

/**
 * Obtener clientes con riesgo excedido
 * GET /api/clientes/riesgo
 */
export const getClientesConRiesgo = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    const clientes = await clienteService.getClientesConRiesgo(empresaId);

    res.status(200).json({
      success: true,
      data: clientes.map(c => clienteService.formatClienteResponse(c)),
      count: clientes.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener clientes con riesgo',
    });
  }
};

/**
 * Exportar clientes a CSV
 * GET /api/clientes/export/csv
 */
export const exportClientesCSV = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    const csv = await clienteService.exportToCSV(empresaId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=clientes.csv');
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al exportar clientes',
    });
  }
};

/**
 * Verificar si un NIF existe
 * GET /api/clientes/verificar-nif/:nif
 */
export const verificarNIF = async (req: Request, res: Response) => {
  try {
    const { nif } = req.params;
    const empresaId = req.empresaId!;

    const existe = await clienteService.nifExists(empresaId, nif);

    res.status(200).json({
      success: true,
      existe,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al verificar NIF',
    });
  }
};