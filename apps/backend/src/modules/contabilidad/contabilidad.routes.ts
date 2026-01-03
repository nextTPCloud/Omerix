/**
 * Rutas de Contabilidad
 */

import { Router } from 'express';
import { contabilidadController } from './contabilidad.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// CONFIGURACIÓN
// ============================================

/**
 * @swagger
 * /api/contabilidad/config:
 *   get:
 *     summary: Obtener configuración contable
 *     tags: [Contabilidad]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración contable
 */
router.get('/config', (req, res) => contabilidadController.getConfig(req, res));

/**
 * @swagger
 * /api/contabilidad/config:
 *   put:
 *     summary: Actualizar configuración contable
 *     tags: [Contabilidad]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuración actualizada
 */
router.put('/config', (req, res) => contabilidadController.actualizarConfig(req, res));

/**
 * @swagger
 * /api/contabilidad/cuentas/inicializar:
 *   post:
 *     summary: Inicializar plan de cuentas PGC 2007
 *     tags: [Contabilidad]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plan de cuentas inicializado
 */
router.post('/cuentas/inicializar', (req, res) =>
  contabilidadController.inicializarPlanCuentas(req, res)
);

// ============================================
// CUENTAS CONTABLES
// ============================================

/**
 * @swagger
 * /api/contabilidad/cuentas:
 *   get:
 *     summary: Listar cuentas contables
 *     tags: [Contabilidad]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nivel
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [activo, pasivo, patrimonio, ingreso, gasto]
 *       - in: query
 *         name: esMovimiento
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: activa
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *       - in: query
 *         name: codigoPadre
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de cuentas
 */
router.get('/cuentas', (req, res) => contabilidadController.listarCuentas(req, res));

/**
 * @swagger
 * /api/contabilidad/cuentas/{id}:
 *   get:
 *     summary: Obtener cuenta por ID
 *     tags: [Contabilidad]
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
 *         description: Cuenta encontrada
 *       404:
 *         description: Cuenta no encontrada
 */
router.get('/cuentas/:id', (req, res) => contabilidadController.obtenerCuenta(req, res));

/**
 * @swagger
 * /api/contabilidad/cuentas:
 *   post:
 *     summary: Crear subcuenta
 *     tags: [Contabilidad]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *             properties:
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               terceroId:
 *                 type: string
 *               terceroTipo:
 *                 type: string
 *                 enum: [cliente, proveedor]
 *     responses:
 *       201:
 *         description: Cuenta creada
 */
router.post('/cuentas', (req, res) => contabilidadController.crearCuenta(req, res));

/**
 * @swagger
 * /api/contabilidad/cuentas/{id}:
 *   put:
 *     summary: Actualizar cuenta
 *     tags: [Contabilidad]
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
 *     responses:
 *       200:
 *         description: Cuenta actualizada
 */
router.put('/cuentas/:id', (req, res) => contabilidadController.actualizarCuenta(req, res));

/**
 * @swagger
 * /api/contabilidad/cuentas/{id}:
 *   delete:
 *     summary: Desactivar cuenta
 *     tags: [Contabilidad]
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
 *         description: Cuenta desactivada
 */
router.delete('/cuentas/:id', (req, res) =>
  contabilidadController.desactivarCuenta(req, res)
);

// ============================================
// ASIENTOS CONTABLES
// ============================================

/**
 * @swagger
 * /api/contabilidad/asientos:
 *   get:
 *     summary: Listar asientos contables
 *     tags: [Contabilidad]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: ejercicio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: integer
 *       - in: query
 *         name: cuentaCodigo
 *         schema:
 *           type: string
 *       - in: query
 *         name: origenTipo
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de asientos
 */
router.get('/asientos', (req, res) => contabilidadController.listarAsientos(req, res));

/**
 * @swagger
 * /api/contabilidad/asientos/{id}:
 *   get:
 *     summary: Obtener asiento por ID
 *     tags: [Contabilidad]
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
 *         description: Asiento encontrado
 *       404:
 *         description: Asiento no encontrado
 */
router.get('/asientos/:id', (req, res) => contabilidadController.obtenerAsiento(req, res));

/**
 * @swagger
 * /api/contabilidad/asientos:
 *   post:
 *     summary: Crear asiento manual
 *     tags: [Contabilidad]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *               - concepto
 *               - lineas
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *               concepto:
 *                 type: string
 *               lineas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cuentaCodigo:
 *                       type: string
 *                     debe:
 *                       type: number
 *                     haber:
 *                       type: number
 *     responses:
 *       201:
 *         description: Asiento creado
 */
router.post('/asientos', (req, res) => contabilidadController.crearAsiento(req, res));

/**
 * @swagger
 * /api/contabilidad/asientos/{id}/anular:
 *   post:
 *     summary: Anular asiento (crea contraasiento)
 *     tags: [Contabilidad]
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
 *             required:
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asiento anulado
 */
router.post('/asientos/:id/anular', (req, res) =>
  contabilidadController.anularAsiento(req, res)
);

// ============================================
// INFORMES CONTABLES
// ============================================

/**
 * @swagger
 * /api/contabilidad/informes/libro-diario:
 *   get:
 *     summary: Obtener libro diario
 *     tags: [Contabilidad - Informes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/informes/libro-diario', (req, res) =>
  contabilidadController.libroDiario(req, res)
);

/**
 * @swagger
 * /api/contabilidad/informes/libro-mayor/{cuenta}:
 *   get:
 *     summary: Obtener libro mayor de una cuenta
 *     tags: [Contabilidad - Informes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/informes/libro-mayor/:cuenta', (req, res) =>
  contabilidadController.libroMayor(req, res)
);

/**
 * @swagger
 * /api/contabilidad/informes/libro-mayor:
 *   get:
 *     summary: Obtener libro mayor general
 *     tags: [Contabilidad - Informes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/informes/libro-mayor', (req, res) =>
  contabilidadController.libroMayorGeneral(req, res)
);

/**
 * @swagger
 * /api/contabilidad/informes/sumas-saldos:
 *   get:
 *     summary: Obtener balance de sumas y saldos
 *     tags: [Contabilidad - Informes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/informes/sumas-saldos', (req, res) =>
  contabilidadController.sumasSaldos(req, res)
);

/**
 * @swagger
 * /api/contabilidad/informes/balance-situacion:
 *   get:
 *     summary: Obtener balance de situación
 *     tags: [Contabilidad - Informes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/informes/balance-situacion', (req, res) =>
  contabilidadController.balanceSituacion(req, res)
);

/**
 * @swagger
 * /api/contabilidad/informes/cuenta-resultados:
 *   get:
 *     summary: Obtener cuenta de pérdidas y ganancias
 *     tags: [Contabilidad - Informes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/informes/cuenta-resultados', (req, res) =>
  contabilidadController.cuentaResultados(req, res)
);

/**
 * @swagger
 * /api/contabilidad/informes/cuenta-resultados-resumida:
 *   get:
 *     summary: Obtener cuenta de resultados resumida
 *     tags: [Contabilidad - Informes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/informes/cuenta-resultados-resumida', (req, res) =>
  contabilidadController.cuentaResultadosResumida(req, res)
);

// ============================================
// EXPORTACIÓN
// ============================================

/**
 * @swagger
 * /api/contabilidad/exportar/formatos:
 *   get:
 *     summary: Obtener formatos de exportación disponibles
 *     tags: [Contabilidad - Exportación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de formatos disponibles
 */
router.get('/exportar/formatos', (req, res) =>
  contabilidadController.getFormatosExportacion(req, res)
);

/**
 * @swagger
 * /api/contabilidad/exportar/asientos:
 *   get:
 *     summary: Exportar asientos contables
 *     tags: [Contabilidad - Exportación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [csv, a3, sage50, sagedespachos, sage200]
 *         description: "Formato de exportación, por defecto csv"
 *       - in: query
 *         name: ejercicio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: codigoEmpresa
 *         schema:
 *           type: string
 *         description: "Código empresa para A3 o Sage, por defecto 001"
 *     responses:
 *       200:
 *         description: Archivo de exportación
 */
router.get('/exportar/asientos', (req, res) =>
  contabilidadController.exportarAsientos(req, res)
);

/**
 * @swagger
 * /api/contabilidad/exportar/plan-cuentas:
 *   get:
 *     summary: Exportar plan de cuentas
 *     tags: [Contabilidad - Exportación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [csv, a3, sage50, sagedespachos, sage200]
 *         description: "Formato de exportación, por defecto csv"
 *       - in: query
 *         name: ejercicio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: codigoEmpresa
 *         schema:
 *           type: string
 *         description: "Código empresa para A3 o Sage, por defecto 001"
 *     responses:
 *       200:
 *         description: Archivo de exportación
 */
router.get('/exportar/plan-cuentas', (req, res) =>
  contabilidadController.exportarPlanCuentas(req, res)
);

export default router;
