import { Router } from 'express';
import { cuentasBancariasController } from './cuentas-bancarias.controller';
import { authMiddleware, requireModuleAccess } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// Verificar acceso al módulo de tesorería
router.use(requireModuleAccess('accesoTesoreria'));

/**
 * @swagger
 * tags:
 *   name: CuentasBancarias
 *   description: Gestión de cuentas bancarias de la empresa
 */

/**
 * @swagger
 * /cuentas-bancarias:
 *   get:
 *     summary: Listar cuentas bancarias
 *     tags: [CuentasBancarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activa
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: usarParaCobros
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: usarParaPagos
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de cuentas bancarias
 */
router.get('/', (req, res, next) => cuentasBancariasController.listar(req, res, next));

/**
 * @swagger
 * /cuentas-bancarias/selector:
 *   get:
 *     summary: Listar cuentas para selector (formato simplificado)
 *     tags: [CuentasBancarias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista simplificada de cuentas activas
 */
router.get('/selector', (req, res, next) => cuentasBancariasController.listarParaSelector(req, res, next));

/**
 * @swagger
 * /cuentas-bancarias/{id}:
 *   get:
 *     summary: Obtener cuenta por ID
 *     tags: [CuentasBancarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cuenta bancaria
 *       404:
 *         description: Cuenta no encontrada
 */
router.get('/:id', (req, res, next) => cuentasBancariasController.obtenerPorId(req, res, next));

/**
 * @swagger
 * /cuentas-bancarias:
 *   post:
 *     summary: Crear cuenta bancaria
 *     tags: [CuentasBancarias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - iban
 *               - banco
 *               - titular
 *             properties:
 *               iban:
 *                 type: string
 *               banco:
 *                 type: string
 *               bic:
 *                 type: string
 *               titular:
 *                 type: string
 *               alias:
 *                 type: string
 *               saldoInicial:
 *                 type: number
 *               usarParaCobros:
 *                 type: boolean
 *               usarParaPagos:
 *                 type: boolean
 *               predeterminada:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Cuenta creada
 */
router.post('/', (req, res, next) => cuentasBancariasController.crear(req, res, next));

/**
 * @swagger
 * /cuentas-bancarias/{id}:
 *   put:
 *     summary: Actualizar cuenta bancaria
 *     tags: [CuentasBancarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               iban:
 *                 type: string
 *               banco:
 *                 type: string
 *               bic:
 *                 type: string
 *               titular:
 *                 type: string
 *               alias:
 *                 type: string
 *               usarParaCobros:
 *                 type: boolean
 *               usarParaPagos:
 *                 type: boolean
 *               activa:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cuenta actualizada
 *       404:
 *         description: Cuenta no encontrada
 */
router.put('/:id', (req, res, next) => cuentasBancariasController.actualizar(req, res, next));

/**
 * @swagger
 * /cuentas-bancarias/{id}/predeterminada:
 *   post:
 *     summary: Establecer cuenta como predeterminada
 *     tags: [CuentasBancarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cuenta establecida como predeterminada
 *       404:
 *         description: Cuenta no encontrada
 */
router.post('/:id/predeterminada', (req, res, next) => cuentasBancariasController.setPredeterminada(req, res, next));

/**
 * @swagger
 * /cuentas-bancarias/{id}:
 *   delete:
 *     summary: Eliminar cuenta bancaria (desactivar)
 *     tags: [CuentasBancarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cuenta eliminada
 *       404:
 *         description: Cuenta no encontrada
 */
router.delete('/:id', (req, res, next) => cuentasBancariasController.eliminar(req, res, next));

export default router;
