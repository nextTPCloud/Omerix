// apps/backend/src/modules/tipos-impuesto/tipos-impuesto.controller.example.ts
// EJEMPLO DE CONTROLADOR CON VALIDACIONES DE AUTORIZACIÓN ROBUSTAS

import { Request, Response, NextFunction } from 'express';
import { tiposImpuestoService } from './tipos-impuesto.service';
import {
  CreateTipoImpuestoSchema,
  UpdateTipoImpuestoSchema,
  SearchTiposImpuestoSchema,
} from './tipos-impuesto.dto';
import { AuthorizationHelper } from '@/utils/authorization.helper';

export class TiposImpuestoController {
  /**
   * Obtener todos los tipos de impuesto
   * La autorización ya se validó en el middleware (requirePermission)
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      // ✅ Ya validado por middlewares: authMiddleware, requireAuth, requirePermission
      const empresaId = req.empresaId!;

      // Validar y parsear filtros
      const filters = SearchTiposImpuestoSchema.parse(req.query);

      // 🔒 OPCIONAL: Validación adicional de entrada
      const inputValidation = AuthorizationHelper.validateInput(filters);
      if (!inputValidation.valid) {
        return res.status(400).json({
          success: false,
          message: inputValidation.error,
        });
      }

      const { data, total, page, limit, totalPages } = await tiposImpuestoService.findAll(
        empresaId,
        filters
      );

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Obtener un tipo de impuesto por ID
   * La ownership ya fue validada por requireOwnership middleware
   */
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      // ✅ Ya validado: empresaId, permissions, ownership
      const empresaId = req.empresaId!;
      const tipoImpuestoId = req.params.id;

      // 🔒 Validar formato de ID (redundante pero seguro)
      if (!AuthorizationHelper.isValidObjectId(tipoImpuestoId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de tipo de impuesto inválido',
        });
      }

      // Si requireOwnership middleware está activo, req.resource ya contiene el recurso
      // Evitamos consulta duplicada
      const data = req.resource || (await tiposImpuestoService.findOne(tipoImpuestoId, empresaId));

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Crear un nuevo tipo de impuesto
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // ✅ Ya validado: empresaId, permissions (create)
      const empresaId = req.empresaId!;
      const userId = req.userId!;

      // Validar datos de entrada
      const data = CreateTipoImpuestoSchema.parse(req.body);

      // 🔒 Validación adicional de entrada
      const inputValidation = AuthorizationHelper.validateInput(data);
      if (!inputValidation.valid) {
        return res.status(400).json({
          success: false,
          message: inputValidation.error,
        });
      }

      const result = await tiposImpuestoService.create(empresaId, data);

      // 📝 LOG DE AUDITORÍA
      AuthorizationHelper.logSecurityEvent(userId, 'CREATE', 'tipos-impuesto', {
        tipoImpuestoId: result._id,
        nombre: result.nombre,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Tipo de impuesto creado correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Actualizar un tipo de impuesto
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      // ✅ Ya validado: empresaId, permissions (update), ownership
      const empresaId = req.empresaId!;
      const userId = req.userId!;
      const tipoImpuestoId = req.params.id;

      // Validar datos de entrada
      const data = UpdateTipoImpuestoSchema.parse(req.body);

      // 🔒 Validación adicional
      const inputValidation = AuthorizationHelper.validateInput(data);
      if (!inputValidation.valid) {
        return res.status(400).json({
          success: false,
          message: inputValidation.error,
        });
      }

      const result = await tiposImpuestoService.update(tipoImpuestoId, empresaId, data);

      // 📝 LOG DE AUDITORÍA
      AuthorizationHelper.logSecurityEvent(userId, 'UPDATE', 'tipos-impuesto', {
        tipoImpuestoId,
        changes: Object.keys(data),
      });

      res.json({
        success: true,
        data: result,
        message: 'Tipo de impuesto actualizado correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Eliminar un tipo de impuesto
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      // ✅ Ya validado: empresaId, permissions (delete), ownership
      const empresaId = req.empresaId!;
      const userId = req.userId!;
      const tipoImpuestoId = req.params.id;

      const result = await tiposImpuestoService.delete(tipoImpuestoId, empresaId);

      // 📝 LOG DE AUDITORÍA (operación crítica)
      AuthorizationHelper.logSecurityEvent(userId, 'DELETE', 'tipos-impuesto', {
        tipoImpuestoId,
        softDelete: result.softDeleted || false,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Establecer tipo de impuesto como predeterminado
   */
  async setPredeterminado(req: Request, res: Response, next: NextFunction) {
    try {
      // ✅ Ya validado: empresaId, permissions, ownership
      const empresaId = req.empresaId!;
      const userId = req.userId!;
      const tipoImpuestoId = req.params.id;

      const result = await tiposImpuestoService.setPredeterminado(tipoImpuestoId, empresaId);

      // 📝 LOG DE AUDITORÍA
      AuthorizationHelper.logSecurityEvent(userId, 'UPDATE', 'tipos-impuesto', {
        tipoImpuestoId,
        action: 'setPredeterminado',
      });

      res.json({
        success: true,
        data: result,
        message: 'Tipo de impuesto establecido como predeterminado',
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const tiposImpuestoController = new TiposImpuestoController();

/*
 * MEJORAS IMPLEMENTADAS:
 *
 * ✅ 1. VALIDACIÓN DE ENTRADA:
 *    - Zod schemas para validación de estructura
 *    - AuthorizationHelper.validateInput para prevenir inyección
 *
 * ✅ 2. VALIDACIÓN DE IDS:
 *    - AuthorizationHelper.isValidObjectId valida formato MongoDB
 *    - Previene errores y posibles ataques
 *
 * ✅ 3. OWNERSHIP AUTOMÁTICO:
 *    - Middleware requireOwnership valida que el recurso pertenece a la empresa
 *    - req.resource contiene el recurso ya validado (evita consultas duplicadas)
 *
 * ✅ 4. LOGS DE AUDITORÍA:
 *    - Todas las operaciones críticas (CREATE, UPDATE, DELETE) se registran
 *    - AuthorizationHelper.logSecurityEvent crea logs estructurados
 *
 * ✅ 5. SEPARACIÓN DE RESPONSABILIDADES:
 *    - Autenticación: authMiddleware
 *    - Autorización: requirePermission
 *    - Ownership: requireOwnership
 *    - Validación: validateBody + AuthorizationHelper
 *    - Lógica de negocio: service layer
 *
 * ✅ 6. MANEJO DE ERRORES:
 *    - Errores se pasan a next(error) para manejo centralizado
 *    - ErrorHandler middleware procesa todos los errores
 *
 * 🔒 7. PROTECCIÓN CONTRA:
 *    - SQL/NoSQL Injection (validación de operadores)
 *    - Mass Assignment (Zod schemas estrictos)
 *    - Insecure Direct Object Reference (ownership validation)
 *    - Privilege Escalation (permission checks)
 *    - Rate Limiting (por usuario y global)
 *    - Token Tampering (verificación en BD)
 */
