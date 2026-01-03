import { Router } from 'express';
import { previsionesController } from './previsiones.controller';
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
 *   name: Previsiones
 *   description: Previsiones avanzadas de tesorería, alertas de descubiertos y simulaciones
 */

// ============================================
// RUTAS DE PREVISIÓN
// ============================================

/**
 * @swagger
 * /previsiones:
 *   get:
 *     summary: Obtener previsión completa de tesorería
 *     tags: [Previsiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 90
 *         description: Número de días a proyectar
 *       - in: query
 *         name: saldoInicial
 *         schema:
 *           type: number
 *         description: Saldo inicial para la previsión (por defecto usa saldo actual)
 *       - in: query
 *         name: cuentas
 *         schema:
 *           type: string
 *         description: IDs de cuentas bancarias separados por coma
 *       - in: query
 *         name: incluirProbabilidades
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Aplicar probabilidades de cobro a las entradas
 *       - in: query
 *         name: umbralAlerta
 *         schema:
 *           type: number
 *           default: 0
 *         description: Saldo mínimo para generar alertas de descubierto
 *     responses:
 *       200:
 *         description: Previsión obtenida exitosamente
 */
router.get('/', (req, res, next) => previsionesController.getPrevision(req, res, next));

/**
 * @swagger
 * /previsiones/resumen:
 *   get:
 *     summary: Obtener resumen ejecutivo de previsión
 *     tags: [Previsiones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen ejecutivo con previsiones a 7, 30 y 90 días
 */
router.get('/resumen', (req, res, next) => previsionesController.getResumenEjecutivo(req, res, next));

/**
 * @swagger
 * /previsiones/alertas:
 *   get:
 *     summary: Obtener alertas de descubierto
 *     tags: [Previsiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Días a analizar
 *       - in: query
 *         name: umbral
 *         schema:
 *           type: number
 *           default: 0
 *         description: Saldo mínimo permitido
 *     responses:
 *       200:
 *         description: Lista de alertas de descubierto
 */
router.get('/alertas', (req, res, next) => previsionesController.getAlertas(req, res, next));

/**
 * @swagger
 * /previsiones/sugerencias:
 *   get:
 *     summary: Obtener sugerencias para mejorar flujo de caja
 *     tags: [Previsiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Lista de sugerencias y análisis
 */
router.get('/sugerencias', (req, res, next) => previsionesController.getSugerencias(req, res, next));

// ============================================
// RUTAS DE SIMULACIÓN
// ============================================

/**
 * @swagger
 * /previsiones/simular:
 *   post:
 *     summary: Ejecutar simulación what-if
 *     tags: [Previsiones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - escenario
 *             properties:
 *               escenario:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   nombre:
 *                     type: string
 *                   movimientos:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         fecha:
 *                           type: string
 *                           format: date
 *                         importe:
 *                           type: number
 *                         esEntrada:
 *                           type: boolean
 *                         concepto:
 *                           type: string
 *                         probabilidad:
 *                           type: number
 *               dias:
 *                 type: integer
 *                 default: 90
 *           example:
 *             escenario:
 *               nombre: "Cobro adelantado cliente X"
 *               movimientos:
 *                 - fecha: "2024-02-15"
 *                   importe: 5000
 *                   esEntrada: true
 *                   concepto: "Cobro adelantado factura 001"
 *             dias: 60
 *     responses:
 *       200:
 *         description: Resultado de la simulación
 */
router.post('/simular', (req, res, next) => previsionesController.simular(req, res, next));

/**
 * @swagger
 * /previsiones/comparar:
 *   post:
 *     summary: Comparar múltiples escenarios what-if
 *     tags: [Previsiones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - escenarios
 *             properties:
 *               escenarios:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     movimientos:
 *                       type: array
 *               dias:
 *                 type: integer
 *                 default: 90
 *           example:
 *             escenarios:
 *               - nombre: "Escenario optimista"
 *                 movimientos:
 *                   - fecha: "2024-02-15"
 *                     importe: 10000
 *                     esEntrada: true
 *                     concepto: "Cobro extra"
 *               - nombre: "Escenario pesimista"
 *                 movimientos:
 *                   - fecha: "2024-02-15"
 *                     importe: 8000
 *                     esEntrada: false
 *                     concepto: "Gasto imprevisto"
 *             dias: 60
 *     responses:
 *       200:
 *         description: Comparativa de escenarios con escenario base
 */
router.post('/comparar', (req, res, next) => previsionesController.compararEscenarios(req, res, next));

export default router;
