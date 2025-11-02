import { Router } from 'express';
import * as clienteController from './clientes.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - nif
 *               - direccion
 *             properties:
 *               tipoCliente:
 *                 type: string
 *                 enum: [empresa, particular]
 *                 default: particular
 *               nombre:
 *                 type: string
 *                 example: "Tecnologías Avanzadas S.L."
 *               nombreComercial:
 *                 type: string
 *                 example: "TechAdvance"
 *               nif:
 *                 type: string
 *                 example: "B12345678"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "info@techadvance.com"
 *               telefono:
 *                 type: string
 *                 example: "+34 912 345 678"
 *               movil:
 *                 type: string
 *                 example: "+34 666 777 888"
 *               web:
 *                 type: string
 *                 example: "https://techadvance.com"
 *               direccion:
 *                 type: object
 *                 required:
 *                   - calle
 *                   - codigoPostal
 *                   - ciudad
 *                   - provincia
 *                 properties:
 *                   calle:
 *                     type: string
 *                     example: "Calle Mayor"
 *                   numero:
 *                     type: string
 *                     example: "123"
 *                   piso:
 *                     type: string
 *                     example: "3º B"
 *                   codigoPostal:
 *                     type: string
 *                     example: "28013"
 *                   ciudad:
 *                     type: string
 *                     example: "Madrid"
 *                   provincia:
 *                     type: string
 *                     example: "Madrid"
 *                   pais:
 *                     type: string
 *                     default: "España"
 *               formaPago:
 *                 type: string
 *                 enum: [contado, transferencia, domiciliacion, confirming, pagare]
 *                 default: transferencia
 *               diasPago:
 *                 type: number
 *                 default: 30
 *                 example: 30
 *               descuentoGeneral:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 5
 *               limiteCredito:
 *                 type: number
 *                 example: 10000
 *               observaciones:
 *                 type: string
 *                 example: "Cliente preferente"
 *     responses:
 *       201:
 *         description: Cliente creado correctamente
 *       400:
 *         description: Datos inválidos o NIF duplicado
 *       401:
 *         description: No autorizado
 */
router.post('/', clienteController.createCliente);

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Obtener listado de clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, NIF, email o código
 *       - in: query
 *         name: tipoCliente
 *         schema:
 *           type: string
 *           enum: [empresa, particular]
 *         description: Filtrar por tipo de cliente
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: formaPago
 *         schema:
 *           type: string
 *           enum: [contado, transferencia, domiciliacion, confirming, pagare]
 *         description: Filtrar por forma de pago
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Elementos por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Campo por el que ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden ascendente o descendente
 *     responses:
 *       200:
 *         description: Lista de clientes
 *       401:
 *         description: No autorizado
 */
router.get('/', clienteController.getClientes);

/**
 * @swagger
 * /api/clientes/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     activos:
 *                       type: number
 *                     inactivos:
 *                       type: number
 *                     empresas:
 *                       type: number
 *                     particulares:
 *                       type: number
 *                     conRiesgo:
 *                       type: number
 */
router.get('/estadisticas', clienteController.getEstadisticas);

/**
 * @swagger
 * /api/clientes/search:
 *   get:
 *     summary: Buscar clientes por término
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Resultados de la búsqueda
 */
router.get('/search', clienteController.searchClientes);

/**
 * @swagger
 * /api/clientes/riesgo:
 *   get:
 *     summary: Obtener clientes con riesgo excedido
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clientes con riesgo excedido
 */
router.get('/riesgo', clienteController.getClientesConRiesgo);

/**
 * @swagger
 * /api/clientes/export/csv:
 *   get:
 *     summary: Exportar clientes a CSV
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo CSV
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export/csv', clienteController.exportClientesCSV);

/**
 * @swagger
 * /api/clientes/verificar-nif/{nif}:
 *   get:
 *     summary: Verificar si un NIF existe
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nif
 *         required: true
 *         schema:
 *           type: string
 *         description: NIF/CIF a verificar
 *     responses:
 *       200:
 *         description: Resultado de la verificación
 */
router.get('/verificar-nif/:nif', clienteController.verificarNIF);

/**
 * @swagger
 * /api/clientes/{id}:
 *   get:
 *     summary: Obtener un cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/:id', clienteController.getClienteById);

/**
 * @swagger
 * /api/clientes/{id}:
 *   put:
 *     summary: Actualizar un cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               telefono:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cliente actualizado correctamente
 *       404:
 *         description: Cliente no encontrado
 */
router.put('/:id', clienteController.updateCliente);

/**
 * @swagger
 * /api/clientes/{id}:
 *   delete:
 *     summary: Desactivar un cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente desactivado correctamente
 *       404:
 *         description: Cliente no encontrado
 */
router.delete('/:id', clienteController.deleteCliente);

export default router;