import { Router } from 'express';
import { facturasController } from './facturas.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Facturas
 *   description: Gestión de facturas con cumplimiento VeriFactu/TicketBAI
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LineaFactura:
 *       type: object
 *       properties:
 *         orden:
 *           type: number
 *         tipo:
 *           type: string
 *           enum: [producto, servicio, kit, texto, subtotal, descuento]
 *         productoId:
 *           type: string
 *         codigo:
 *           type: string
 *         nombre:
 *           type: string
 *           required: true
 *         descripcion:
 *           type: string
 *         cantidad:
 *           type: number
 *         unidad:
 *           type: string
 *         precioUnitario:
 *           type: number
 *         descuento:
 *           type: number
 *         iva:
 *           type: number
 *         recargoEquivalencia:
 *           type: number
 *         costeUnitario:
 *           type: number
 *
 *     Vencimiento:
 *       type: object
 *       properties:
 *         numero:
 *           type: number
 *         fecha:
 *           type: string
 *           format: date
 *         importe:
 *           type: number
 *         metodoPago:
 *           type: string
 *           enum: [efectivo, transferencia, tarjeta, domiciliacion, cheque, pagare, confirming, compensacion]
 *         cobrado:
 *           type: boolean
 *
 *     Cobro:
 *       type: object
 *       required:
 *         - fecha
 *         - importe
 *         - metodoPago
 *       properties:
 *         fecha:
 *           type: string
 *           format: date
 *         importe:
 *           type: number
 *         metodoPago:
 *           type: string
 *           enum: [efectivo, transferencia, tarjeta, domiciliacion, cheque, pagare, confirming, compensacion]
 *         referencia:
 *           type: string
 *         cuentaDestino:
 *           type: string
 *         observaciones:
 *           type: string
 *         vencimientoId:
 *           type: string
 *
 *     VeriFactu:
 *       type: object
 *       properties:
 *         idFactura:
 *           type: string
 *         hash:
 *           type: string
 *         fechaExpedicion:
 *           type: string
 *           format: date-time
 *         estadoEnvio:
 *           type: string
 *           enum: [pendiente, enviado, aceptado, rechazado]
 *         urlQR:
 *           type: string
 *         datosQR:
 *           type: string
 *
 *     TicketBAI:
 *       type: object
 *       properties:
 *         tbaiId:
 *           type: string
 *         firma:
 *           type: string
 *         qr:
 *           type: string
 *         urlQR:
 *           type: string
 *         fechaExpedicion:
 *           type: string
 *           format: date-time
 *         estadoEnvio:
 *           type: string
 *           enum: [pendiente, enviado, aceptado, rechazado]
 *
 *     Factura:
 *       type: object
 *       required:
 *         - clienteId
 *       properties:
 *         _id:
 *           type: string
 *         codigo:
 *           type: string
 *         serie:
 *           type: string
 *         numero:
 *           type: number
 *         tipo:
 *           type: string
 *           enum: [ordinaria, rectificativa, simplificada, recapitulativa, proforma]
 *         estado:
 *           type: string
 *           enum: [borrador, emitida, enviada, parcialmente_cobrada, cobrada, vencida, impagada, rectificada, anulada]
 *         fecha:
 *           type: string
 *           format: date
 *         fechaVencimiento:
 *           type: string
 *           format: date
 *         clienteId:
 *           type: string
 *         clienteNombre:
 *           type: string
 *         clienteNif:
 *           type: string
 *         lineas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LineaFactura'
 *         totales:
 *           type: object
 *           properties:
 *             subtotalBruto:
 *               type: number
 *             totalDescuentos:
 *               type: number
 *             subtotalNeto:
 *               type: number
 *             totalIva:
 *               type: number
 *             totalRecargoEquivalencia:
 *               type: number
 *             totalFactura:
 *               type: number
 *         vencimientos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Vencimiento'
 *         cobros:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Cobro'
 *         importeCobrado:
 *           type: number
 *         importePendiente:
 *           type: number
 *         sistemaFiscal:
 *           type: string
 *           enum: [verifactu, ticketbai, sii, ninguno]
 *         verifactu:
 *           $ref: '#/components/schemas/VeriFactu'
 *         ticketbai:
 *           $ref: '#/components/schemas/TicketBAI'
 *         codigoQR:
 *           type: string
 *         inmutable:
 *           type: boolean
 *         esRectificativa:
 *           type: boolean
 *         facturaRectificadaId:
 *           type: string
 *         facturaRectificadaCodigo:
 *           type: string
 *         motivoRectificacion:
 *           type: string
 *           enum: [error_expedicion, devolucion, descuento_post_venta, bonificacion, impago_concursal, otros]
 *
 *     CreateFacturaDTO:
 *       type: object
 *       required:
 *         - clienteId
 *       properties:
 *         serie:
 *           type: string
 *           default: FAC
 *         tipo:
 *           type: string
 *           enum: [ordinaria, rectificativa, simplificada, recapitulativa, proforma]
 *         clienteId:
 *           type: string
 *         fecha:
 *           type: string
 *           format: date
 *         fechaVencimiento:
 *           type: string
 *           format: date
 *         lineas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LineaFactura'
 *         descuentoGlobalPorcentaje:
 *           type: number
 *         recargoEquivalencia:
 *           type: boolean
 *         retencionIRPF:
 *           type: number
 *         sistemaFiscal:
 *           type: string
 *           enum: [verifactu, ticketbai, sii, ninguno]
 *         observaciones:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

// ============================================
// RUTAS ESPECIALES (antes de :id)
// ============================================

/**
 * @swagger
 * /api/facturas/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de facturas
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de facturas
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
 *                     porEstado:
 *                       type: object
 *                     totalFacturado:
 *                       type: number
 *                     totalCobrado:
 *                       type: number
 *                     totalPendiente:
 *                       type: number
 *                     totalVencido:
 *                       type: number
 */
router.get('/estadisticas', facturasController.estadisticas);

/**
 * @swagger
 * /api/facturas/desde-albaranes:
 *   post:
 *     summary: Crear facturas desde albaranes pendientes
 *     description: Crea una o más facturas desde albaranes no facturados. Puede agrupar por cliente.
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - albaranesIds
 *             properties:
 *               albaranesIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de los albaranes a facturar
 *               agruparPorCliente:
 *                 type: boolean
 *                 default: false
 *                 description: Si true, crea una factura por cliente
 *               fechaFactura:
 *                 type: string
 *                 format: date
 *               fechaVencimiento:
 *                 type: string
 *                 format: date
 *               serie:
 *                 type: string
 *                 default: FAC
 *               metodoPago:
 *                 type: string
 *                 enum: [efectivo, transferencia, tarjeta, domiciliacion, cheque, pagare, confirming, compensacion]
 *     responses:
 *       201:
 *         description: Facturas creadas correctamente
 *       400:
 *         description: No se encontraron albaranes pendientes de facturar
 */
router.post('/desde-albaranes', facturasController.crearDesdeAlbaranes);

/**
 * @swagger
 * /api/facturas/factura-directa:
 *   post:
 *     summary: Crear factura directa desde albaranes (emitida, no borrador)
 *     description: |
 *       Crea una factura desde albaranes y la emite directamente en un solo paso.
 *       La factura se crea como EMITIDA (no como borrador), lista para enviar a AEAT.
 *       Útil para facturación rápida donde no se necesita revisar el borrador.
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - albaranesIds
 *             properties:
 *               albaranesIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de los albaranes a facturar
 *               agruparPorCliente:
 *                 type: boolean
 *                 default: false
 *                 description: Si true, crea una factura por cliente
 *               fechaFactura:
 *                 type: string
 *                 format: date
 *               fechaVencimiento:
 *                 type: string
 *                 format: date
 *               serie:
 *                 type: string
 *                 default: FAC
 *               metodoPago:
 *                 type: string
 *                 enum: [efectivo, transferencia, tarjeta, domiciliacion, cheque, pagare, confirming, compensacion]
 *               sistemaFiscal:
 *                 type: string
 *                 enum: [verifactu, ticketbai, sii, ninguno]
 *                 description: Sistema fiscal a usar (por defecto usa configuración de empresa)
 *               enviarAAEAT:
 *                 type: boolean
 *                 description: Si true, envía automáticamente a AEAT (usa config de empresa por defecto)
 *     responses:
 *       201:
 *         description: Facturas creadas y emitidas correctamente
 *       400:
 *         description: No se encontraron albaranes pendientes de facturar
 */
router.post('/factura-directa', facturasController.crearFacturaDirecta);

/**
 * @swagger
 * /api/facturas/rectificativa:
 *   post:
 *     summary: Crear factura rectificativa
 *     description: Crea una factura rectificativa (abono) de una factura existente
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facturaOriginalId
 *               - motivoRectificacion
 *               - descripcionRectificacion
 *             properties:
 *               facturaOriginalId:
 *                 type: string
 *                 description: ID de la factura a rectificar
 *               motivoRectificacion:
 *                 type: string
 *                 enum: [error_expedicion, devolucion, descuento_post_venta, bonificacion, impago_concursal, otros]
 *               descripcionRectificacion:
 *                 type: string
 *                 description: Descripción del motivo de rectificación
 *               serie:
 *                 type: string
 *                 default: RFC
 *               importeRectificar:
 *                 type: number
 *                 description: Si es rectificación parcial, importe a rectificar
 *     responses:
 *       201:
 *         description: Factura rectificativa creada
 *       404:
 *         description: Factura original no encontrada
 */
router.post('/rectificativa', facturasController.crearRectificativa);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @swagger
 * /api/facturas:
 *   get:
 *     summary: Buscar facturas con filtros y paginación
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por código, cliente, NIF, título o referencia
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [borrador, emitida, enviada, parcialmente_cobrada, cobrada, vencida, impagada, rectificada, anulada]
 *       - in: query
 *         name: estados
 *         schema:
 *           type: string
 *         description: Estados separados por coma
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [ordinaria, rectificativa, simplificada, recapitulativa, proforma]
 *       - in: query
 *         name: serie
 *         schema:
 *           type: string
 *       - in: query
 *         name: cobrada
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: vencida
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: rectificativa
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
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
 *         name: fechaVencimientoDesde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaVencimientoHasta
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: importeMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: importeMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: sistemaFiscal
 *         schema:
 *           type: string
 *           enum: [verifactu, ticketbai, sii, ninguno]
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Tags separados por coma
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: fecha
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lista de facturas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Factura'
 *                 total:
 *                   type: number
 *                 page:
 *                   type: number
 *                 limit:
 *                   type: number
 *                 totalPages:
 *                   type: number
 */
router.get('/', facturasController.buscar);

/**
 * @swagger
 * /api/facturas:
 *   post:
 *     summary: Crear una nueva factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFacturaDTO'
 *     responses:
 *       201:
 *         description: Factura creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Factura'
 *                 message:
 *                   type: string
 */
router.post('/', facturasController.crear);

/**
 * @swagger
 * /api/facturas/{id}:
 *   get:
 *     summary: Obtener una factura por ID
 *     tags: [Facturas]
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
 *         description: Factura encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Factura'
 *       404:
 *         description: Factura no encontrada
 */
router.get('/:id', facturasController.obtenerPorId);

/**
 * @swagger
 * /api/facturas/{id}:
 *   put:
 *     summary: Actualizar una factura (solo borradores)
 *     description: Solo se pueden actualizar facturas en estado borrador. Una vez emitida, la factura es inmutable.
 *     tags: [Facturas]
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
 *             $ref: '#/components/schemas/CreateFacturaDTO'
 *     responses:
 *       200:
 *         description: Factura actualizada
 *       400:
 *         description: No se puede modificar una factura emitida
 *       404:
 *         description: Factura no encontrada
 */
router.put('/:id', facturasController.actualizar);

/**
 * @swagger
 * /api/facturas/{id}:
 *   delete:
 *     summary: Eliminar una factura (solo borradores)
 *     description: Solo se pueden eliminar facturas en estado borrador. Las facturas emitidas deben anularse o rectificarse.
 *     tags: [Facturas]
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
 *         description: Factura eliminada
 *       400:
 *         description: No se puede eliminar una factura emitida
 *       404:
 *         description: Factura no encontrada
 */
router.delete('/:id', facturasController.eliminar);

// ============================================
// ACCIONES SOBRE FACTURAS
// ============================================

/**
 * @swagger
 * /api/facturas/{id}/emitir:
 *   post:
 *     summary: Emitir factura (generar datos fiscales VeriFactu/TicketBAI)
 *     description: |
 *       Emite la factura generando los datos fiscales según la normativa configurada.
 *       Una vez emitida, la factura se vuelve INMUTABLE (cumplimiento ley anti-fraude).
 *       Se genera el código QR de verificación.
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sistemaFiscal:
 *                 type: string
 *                 enum: [verifactu, ticketbai, sii, ninguno]
 *                 description: Sistema fiscal a usar (por defecto usa el configurado en la empresa)
 *               enviarAHacienda:
 *                 type: boolean
 *                 default: false
 *                 description: Si true, intenta enviar automáticamente a Hacienda
 *               generarPDF:
 *                 type: boolean
 *                 default: true
 *               enviarPorEmail:
 *                 type: boolean
 *                 default: false
 *               emailDestino:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Factura emitida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Factura'
 *                 message:
 *                   type: string
 *       400:
 *         description: La factura ya fue emitida o no está en estado borrador
 */
router.post('/:id/emitir', facturasController.emitir);

/**
 * @swagger
 * /api/facturas/{id}/cobro:
 *   post:
 *     summary: Registrar un cobro en la factura
 *     description: Registra un pago parcial o total. Actualiza automáticamente el estado de la factura.
 *     tags: [Facturas]
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
 *             $ref: '#/components/schemas/Cobro'
 *     responses:
 *       200:
 *         description: Cobro registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Factura'
 *                 message:
 *                   type: string
 *       400:
 *         description: No se pueden registrar cobros en facturas anuladas
 */
router.post('/:id/cobro', facturasController.registrarCobro);

/**
 * @swagger
 * /api/facturas/{id}/anular:
 *   post:
 *     summary: Anular factura
 *     description: |
 *       Anula una factura. Si está emitida (inmutable), puede crear automáticamente
 *       una factura rectificativa. Si está en borrador, se anula directamente.
 *     tags: [Facturas]
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
 *                 description: Motivo de la anulación
 *               crearRectificativa:
 *                 type: boolean
 *                 default: true
 *                 description: Si true y la factura está emitida, crea rectificativa
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Factura anulada
 *       400:
 *         description: La factura ya está anulada
 */
router.post('/:id/anular', facturasController.anular);

/**
 * @swagger
 * /api/facturas/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de la factura
 *     description: Cambia el estado de la factura. Solo permite cambios válidos según el flujo.
 *     tags: [Facturas]
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
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [borrador, emitida, enviada, parcialmente_cobrada, cobrada, vencida, impagada, rectificada, anulada]
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Cambio de estado no permitido
 */
router.patch('/:id/estado', facturasController.cambiarEstado);

/**
 * @swagger
 * /api/facturas/{id}/qr:
 *   get:
 *     summary: Obtener código QR de verificación de la factura
 *     description: Devuelve el código QR y datos de verificación fiscal (VeriFactu/TicketBAI)
 *     tags: [Facturas]
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
 *         description: Datos del QR
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
 *                     codigoQR:
 *                       type: string
 *                       description: Imagen del QR en formato data URL (base64)
 *                     urlVerificacion:
 *                       type: string
 *                       description: URL de verificación
 *                     verifactu:
 *                       $ref: '#/components/schemas/VeriFactu'
 *                     ticketbai:
 *                       $ref: '#/components/schemas/TicketBAI'
 *       400:
 *         description: La factura no tiene código QR (no está emitida)
 */
router.get('/:id/qr', facturasController.obtenerQR);

/**
 * @swagger
 * /api/facturas/{id}/duplicar:
 *   post:
 *     summary: Duplicar una factura
 *     description: Crea una copia de la factura en estado borrador
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Factura duplicada correctamente
 *       404:
 *         description: Factura no encontrada
 */
router.post('/:id/duplicar', facturasController.duplicar);

/**
 * @swagger
 * /api/facturas/{id}/enviar-email:
 *   post:
 *     summary: Enviar factura por email
 *     description: Envía la factura por email al cliente con PDF adjunto
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailDestino:
 *                 type: string
 *                 format: email
 *                 description: Email destino (por defecto el del cliente)
 *               asunto:
 *                 type: string
 *                 description: Asunto del email
 *               mensaje:
 *                 type: string
 *                 description: Mensaje del email
 *               pdfOptions:
 *                 type: object
 *                 description: Opciones de generación del PDF
 *     responses:
 *       200:
 *         description: Email enviado correctamente
 *       400:
 *         description: No hay email configurado para el cliente
 *       404:
 *         description: Factura no encontrada
 */
router.post('/:id/enviar-email', facturasController.enviarPorEmail);

export default router;
