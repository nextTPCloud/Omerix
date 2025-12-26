// backend/src/config/swagger.ts

import swaggerJsdoc from 'swagger-jsdoc';
import { Request, Response } from 'express';

const PORT = process.env.PORT || 5000;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Tralok ERP API',
    version: '1.0.0',
    description: 'API REST del Sistema ERP Multi-negocio Tralok',
    contact: {
      name: 'Equipo Tralok',
      email: 'soporte@tralok.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Servidor de Desarrollo',
    },
    {
      url: 'https://api.tralok.com',
      description: 'Servidor de Producción',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingrese el token JWT en el formato: Bearer {token}',
      },
    },
    schemas: {
      // Schemas globales
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Mensaje de error',
          },
          error: {
            type: 'string',
            example: 'Detalles del error',
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operación exitosa',
          },
          data: {
            type: 'object',
          },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          nombre: {
            type: 'string',
            example: 'Juan',
          },
          apellidos: {
            type: 'string',
            example: 'Pérez García',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'juan@empresa.com',
          },
          telefono: {
            type: 'string',
            example: '+34666777888',
          },
          rol: {
            type: 'string',
            enum: ['super_admin', 'admin', 'gerente', 'vendedor', 'tecnico', 'almacenero', 'visualizador'],
            example: 'admin',
          },
          empresaId: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          twoFactorEnabled: {
            type: 'boolean',
            example: false,
          },
          activo: {
            type: 'boolean',
            example: true,
          },
        },
      },
      Empresa: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          nombre: {
            type: 'string',
            example: 'Mi Empresa SL',
          },
          nif: {
            type: 'string',
            example: 'B12345678',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'empresa@email.com',
          },
          tipoNegocio: {
            type: 'string',
            enum: ['retail', 'restauracion', 'taller', 'informatica', 'servicios', 'otro'],
            example: 'retail',
          },
          estado: {
            type: 'string',
            enum: ['activa', 'suspendida', 'cancelada'],
            example: 'activa',
          },
        },
      },
      // 🆕 SCHEMAS DE LOGS
      AuditLog: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          empresaId: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          usuarioId: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          accion: {
            type: 'string',
            example: 'USER_CREATE',
          },
          modulo: {
            type: 'string',
            example: 'users',
          },
          descripcion: {
            type: 'string',
            example: 'Usuario creado exitosamente',
          },
          entidadTipo: {
            type: 'string',
            example: 'Usuario',
          },
          entidadId: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          ip: {
            type: 'string',
            example: '192.168.1.1',
          },
          resultado: {
            type: 'string',
            enum: ['exito', 'fallo'],
            example: 'exito',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      SystemLog: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          nivel: {
            type: 'string',
            enum: ['info', 'warn', 'error', 'fatal', 'debug'],
            example: 'error',
          },
          mensaje: {
            type: 'string',
            example: 'Error de conexión a base de datos',
          },
          modulo: {
            type: 'string',
            example: 'system',
          },
          stack: {
            type: 'string',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      FiscalLog: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          empresaId: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          documentoTipo: {
            type: 'string',
            enum: ['factura', 'ticket', 'rectificativa', 'abono'],
            example: 'factura',
          },
          numeroDocumento: {
            type: 'string',
            example: 'FAC-2025-001',
          },
          serie: {
            type: 'string',
            example: 'A',
          },
          importe: {
            type: 'number',
            example: 100.00,
          },
          iva: {
            type: 'number',
            example: 21.00,
          },
          total: {
            type: 'number',
            example: 121.00,
          },
          hash: {
            type: 'string',
            example: 'a3b5c7d9e1f2...',
          },
          hashAnterior: {
            type: 'string',
            example: '1f2e3d4c5b6a...',
          },
          firma: {
            type: 'string',
            example: 'firma_digital_hash',
          },
          inmutable: {
            type: 'boolean',
            example: true,
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: {
            type: 'number',
            example: 100,
          },
          page: {
            type: 'number',
            example: 1,
          },
          limit: {
            type: 'number',
            example: 20,
          },
          totalPages: {
            type: 'number',
            example: 5,
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Autenticación',
      description: 'Endpoints de autenticación y gestión de usuarios',
    },
    {
      name: '2FA',
      description: 'Autenticación de dos factores',
    },
    {
      name: 'Test',
      description: 'Endpoints de prueba',
    },
    {
      name: 'Audit Logs',
      description: 'Logs de auditoría - Trazabilidad completa de operaciones de usuarios',
    },
    {
      name: 'System Logs',
      description: 'Logs de sistema - Monitoreo técnico, errores y health checks',
    },
    {
      name: 'Fiscal Logs',
      description: 'Logs fiscales - Documentos inmutables con blockchain (próximamente)',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Rutas donde buscar comentarios JSDoc
  apis: [
    './src/server.ts',
    './src/modules/*/*.routes.ts',
    './src/modules/*/*.controller.ts',
    './src/modules/*/controllers/*.controller.ts', // 🆕 NUEVO: Controllers en subcarpetas
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

// Endpoint para servir el JSON de Swagger
export const serveSwaggerJSON = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
};