import { Router } from 'express';
import { presupuestosController } from './presupuestos.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware, requireBusinessDatabase } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireBusinessDatabase);

/**
 * @swagger
 * components:
 *   schemas:
 *     LineaPresupuesto:
 *       type: object
 *       properties:
 *         orden:
 *           type: number
 *         tipo:
 *           type: string
 *           enum: [producto, servicio, kit, texto, subtotal, descuento]
 *         productoId:
 *           type: string
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *         cantidad:
 *           type: number
 *         precioUnitario:
 *           type: number
 *         costeUnitario:
 *           type: number
 *         descuento:
 *           type: number
 *         iva:
 *           type: number
 *         subtotal:
 *           type: number
 *         total:
 *           type: number
 *         margenPorcentaje:
 *           type: number
 *     Presupuesto:
 *       type: object
 *       required:
 *         - clienteId
 *         - clienteNombre
 *         - clienteNif
 *       properties:
 *         _id:
 *           type: string
 *         codigo:
 *           type: string
 *         serie:
 *           type: string
 *         numero:
 *           type: number
 *         version:
 *           type: number
 *         estado:
 *           type: string
 *           enum: [borrador, enviado, pendiente, aceptado, rechazado, caducado, convertido]
 *         fecha:
 *           type: string
 *           format: date
 *         fechaValidez:
 *           type: string
 *           format: date
 *         clienteId:
 *           type: string
 *         clienteNombre:
 *           type: string
 *         clienteNif:
 *           type: string
 *         proyectoId:
 *           type: string
 *         agenteComercialId:
 *           type: string
 *         lineas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LineaPresupuesto'
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
 *             totalPresupuesto:
 *               type: number
 *             costeTotal:
 *               type: number
 *             margenBruto:
 *               type: number
 *             margenPorcentaje:
 *               type: number
 *         mostrarCostes:
 *           type: boolean
 *           description: Toggle para ocultar costes al mostrar al cliente
 */

/**
 * @swagger
 * tags:
 *   name: Presupuestos
 *   description: Gestión de presupuestos con costes y márgenes
 */

/**
 * @swagger
 * /api/presupuestos/sugerir-codigo:
 *   get:
 *     summary: Obtener el siguiente código de presupuesto sugerido
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serie
 *         schema:
 *           type: string
 *           default: P
 *         description: Serie del presupuesto
 *     responses:
 *       200:
 *         description: Código sugerido
 */
router.get('/sugerir-codigo', presupuestosController.sugerirCodigo.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de presupuestos
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de presupuestos
 */
router.get('/estadisticas', presupuestosController.obtenerEstadisticas.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/alertas:
 *   get:
 *     summary: Obtener alertas de validez de presupuestos
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Días de antelación para alertas
 *     responses:
 *       200:
 *         description: Alertas de validez
 */
router.get('/alertas', presupuestosController.getAlertasValidez.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/alertas/resumen:
 *   get:
 *     summary: Obtener resumen de alertas (solo contadores)
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Resumen de alertas
 */
router.get('/alertas/resumen', presupuestosController.getResumenAlertas.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/kpis:
 *   get:
 *     summary: Obtener KPIs del dashboard de presupuestos
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicio del periodo
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha fin del periodo
 *     responses:
 *       200:
 *         description: KPIs del dashboard
 */
router.get('/kpis', presupuestosController.getKPIs.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/recordatorios/pendientes:
 *   get:
 *     summary: Obtener resumen de recordatorios pendientes
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de recordatorios pendientes
 */
router.get('/recordatorios/pendientes', presupuestosController.getRecordatoriosPendientes.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/recordatorios/ejecutar:
 *   post:
 *     summary: Ejecutar recordatorios automáticos
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enviarExpiracion:
 *                 type: boolean
 *                 default: true
 *               enviarSeguimiento:
 *                 type: boolean
 *                 default: true
 *               notificarAgentes:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Recordatorios procesados
 */
router.post('/recordatorios/ejecutar', presupuestosController.ejecutarRecordatorios.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/cliente/{clienteId}:
 *   get:
 *     summary: Obtener presupuestos de un cliente
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de presupuestos del cliente
 */
router.get('/cliente/:clienteId', presupuestosController.obtenerPorCliente.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/proyecto/{proyectoId}:
 *   get:
 *     summary: Obtener presupuestos de un proyecto
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proyectoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de presupuestos del proyecto
 */
router.get('/proyecto/:proyectoId', presupuestosController.obtenerPorProyecto.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos:
 *   get:
 *     summary: Obtener todos los presupuestos
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [borrador, enviado, pendiente, aceptado, rechazado, caducado, convertido]
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *       - in: query
 *         name: proyectoId
 *         schema:
 *           type: string
 *       - in: query
 *         name: vigentes
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *     responses:
 *       200:
 *         description: Lista de presupuestos paginada
 */
router.get('/', presupuestosController.obtenerTodos.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos:
 *   post:
 *     summary: Crear un nuevo presupuesto
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Presupuesto'
 *     responses:
 *       201:
 *         description: Presupuesto creado
 */
router.post('/', presupuestosController.crear.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples presupuestos
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Presupuestos eliminados
 */
router.post('/bulk-delete', presupuestosController.eliminarVarios.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/enviar-masivo:
 *   post:
 *     summary: Enviar múltiples presupuestos por email
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de presupuestos a enviar (máximo 50)
 *               asunto:
 *                 type: string
 *               mensaje:
 *                 type: string
 *               pdfOptions:
 *                 type: object
 *     responses:
 *       200:
 *         description: Resultado del envío masivo
 */
router.post('/enviar-masivo', presupuestosController.enviarMasivoPorEmail.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/whatsapp-masivo:
 *   post:
 *     summary: Generar URLs de WhatsApp para múltiples presupuestos
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: URLs de WhatsApp generadas
 */
router.post('/whatsapp-masivo', presupuestosController.generarURLsWhatsAppMasivo.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}:
 *   get:
 *     summary: Obtener un presupuesto por ID
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: ocultarCostes
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Si es true, oculta los costes y márgenes
 *     responses:
 *       200:
 *         description: Presupuesto encontrado
 *       404:
 *         description: Presupuesto no encontrado
 */
router.get('/:id', presupuestosController.obtenerPorId.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}:
 *   put:
 *     summary: Actualizar un presupuesto
 *     tags: [Presupuestos]
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
 *             $ref: '#/components/schemas/Presupuesto'
 *     responses:
 *       200:
 *         description: Presupuesto actualizado
 */
router.put('/:id', presupuestosController.actualizar.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}:
 *   delete:
 *     summary: Eliminar un presupuesto
 *     tags: [Presupuestos]
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
 *         description: Presupuesto eliminado
 */
router.delete('/:id', presupuestosController.eliminar.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de un presupuesto
 *     tags: [Presupuestos]
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
 *                 enum: [borrador, enviado, pendiente, aceptado, rechazado, caducado, convertido]
 *               observaciones:
 *                 type: string
 *               fechaRespuesta:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Estado cambiado
 */
router.patch('/:id/estado', presupuestosController.cambiarEstado.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/duplicar:
 *   post:
 *     summary: Duplicar un presupuesto
 *     tags: [Presupuestos]
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
 *               nuevoCliente:
 *                 type: string
 *                 description: ID del nuevo cliente (opcional)
 *               mantenerPrecios:
 *                 type: boolean
 *                 default: true
 *               mantenerCostes:
 *                 type: boolean
 *                 default: true
 *               nuevaFecha:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Presupuesto duplicado
 */
router.post('/:id/duplicar', presupuestosController.duplicar.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/revision:
 *   post:
 *     summary: Crear una revisión del presupuesto
 *     tags: [Presupuestos]
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
 *         description: Revisión creada
 */
router.post('/:id/revision', presupuestosController.crearRevision.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/aplicar-margen:
 *   post:
 *     summary: Aplicar margen a las líneas del presupuesto
 *     tags: [Presupuestos]
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
 *               - tipo
 *               - valor
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [porcentaje, importe]
 *                 description: Tipo de margen a aplicar
 *               valor:
 *                 type: number
 *                 description: Valor del margen (% o €)
 *               aplicarA:
 *                 type: string
 *                 enum: [todas, productos, servicios, seleccionadas]
 *                 default: todas
 *               lineasIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de líneas específicas (para aplicarA=seleccionadas)
 *               sobreCoste:
 *                 type: boolean
 *                 default: true
 *                 description: Si true, aplica sobre coste; si false, sobre precio actual
 *     responses:
 *       200:
 *         description: Margen aplicado
 */
router.post('/:id/aplicar-margen', presupuestosController.aplicarMargen.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/importar-lineas:
 *   post:
 *     summary: Importar líneas de otro documento o productos
 *     tags: [Presupuestos]
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
 *               - origen
 *             properties:
 *               origen:
 *                 type: string
 *                 enum: [presupuesto, pedido, factura, productos]
 *               documentoId:
 *                 type: string
 *                 description: ID del documento origen (si no es productos)
 *               productosIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs de productos a importar (si origen=productos)
 *               incluirPrecios:
 *                 type: boolean
 *                 default: true
 *               incluirDescuentos:
 *                 type: boolean
 *                 default: true
 *               incluirCostes:
 *                 type: boolean
 *                 default: true
 *               multiplicador:
 *                 type: number
 *                 default: 1
 *                 description: Factor para multiplicar cantidades
 *     responses:
 *       200:
 *         description: Líneas importadas
 */
router.post('/:id/importar-lineas', presupuestosController.importarLineas.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/toggle-costes:
 *   patch:
 *     summary: Activar/desactivar visibilidad de costes
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     description: Toggle rápido para ocultar costes cuando el cliente está delante
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
 *               - mostrarCostes
 *             properties:
 *               mostrarCostes:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Visibilidad de costes actualizada
 */
router.patch('/:id/toggle-costes', presupuestosController.toggleMostrarCostes.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/enviar-email:
 *   post:
 *     summary: Enviar presupuesto por email con PDF adjunto
 *     tags: [Presupuestos]
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
 *               asunto:
 *                 type: string
 *                 description: Asunto personalizado del email
 *               mensaje:
 *                 type: string
 *                 description: Mensaje personalizado del email
 *               cc:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Emails en copia
 *               bcc:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Emails en copia oculta
 *               pdfOptions:
 *                 type: object
 *                 properties:
 *                   mostrarDescripcion:
 *                     type: string
 *                     enum: [ninguna, corta, larga]
 *                   mostrarReferencias:
 *                     type: boolean
 *                   mostrarCondiciones:
 *                     type: boolean
 *                   mostrarFirmas:
 *                     type: boolean
 *                   mostrarCuentaBancaria:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Email enviado correctamente
 *       400:
 *         description: Error al enviar email
 */
router.post('/:id/enviar-email', presupuestosController.enviarPorEmail.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/whatsapp:
 *   get:
 *     summary: Generar URL de WhatsApp para el presupuesto
 *     tags: [Presupuestos]
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
 *         description: URL de WhatsApp generada
 */
router.get('/:id/whatsapp', presupuestosController.generarURLWhatsApp.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/notas:
 *   post:
 *     summary: Añadir nota de seguimiento
 *     tags: [Presupuestos]
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
 *               - tipo
 *               - contenido
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [llamada, email, reunion, nota, recordatorio]
 *               contenido:
 *                 type: string
 *               resultado:
 *                 type: string
 *               proximaAccion:
 *                 type: string
 *               fechaProximaAccion:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Nota añadida correctamente
 */
router.post('/:id/notas', presupuestosController.addNotaSeguimiento.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/notas/{notaId}:
 *   delete:
 *     summary: Eliminar nota de seguimiento
 *     tags: [Presupuestos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: notaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Nota eliminada correctamente
 */
router.delete('/:id/notas/:notaId', presupuestosController.deleteNotaSeguimiento.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/recordatorios:
 *   get:
 *     summary: Obtener historial de recordatorios de un presupuesto
 *     tags: [Presupuestos]
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
 *         description: Historial de recordatorios
 */
router.get('/:id/recordatorios', presupuestosController.getHistorialRecordatorios.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/recordatorios/enviar:
 *   post:
 *     summary: Enviar recordatorio manual a un presupuesto
 *     tags: [Presupuestos]
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
 *               - tipo
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [expiracion, seguimiento]
 *                 description: Tipo de recordatorio a enviar
 *     responses:
 *       200:
 *         description: Recordatorio enviado
 */
router.post('/:id/recordatorios/enviar', presupuestosController.enviarRecordatorioManual.bind(presupuestosController));

/**
 * @swagger
 * /api/presupuestos/{id}/recordatorios/config:
 *   patch:
 *     summary: Actualizar configuración de recordatorios de un presupuesto
 *     tags: [Presupuestos]
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
 *               activo:
 *                 type: boolean
 *               diasAntesExpiracion:
 *                 type: number
 *               enviarAlCliente:
 *                 type: boolean
 *               enviarAlAgente:
 *                 type: boolean
 *               maxRecordatorios:
 *                 type: number
 *     responses:
 *       200:
 *         description: Configuración actualizada
 */
router.patch('/:id/recordatorios/config', presupuestosController.actualizarConfigRecordatorios.bind(presupuestosController));

// ============================================
// PORTAL DE CLIENTE
// ============================================

/**
 * @swagger
 * /presupuestos/{id}/portal/generar:
 *   post:
 *     summary: Generar enlace del portal para que el cliente vea/acepte el presupuesto
 *     tags: [Presupuestos]
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
 *         description: Enlace generado exitosamente
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
 *                     token:
 *                       type: string
 *                     url:
 *                       type: string
 */
router.post('/:id/portal/generar', presupuestosController.generarEnlacePortal.bind(presupuestosController));

/**
 * @swagger
 * /presupuestos/{id}/portal/regenerar:
 *   post:
 *     summary: Regenerar token del portal (invalida el anterior)
 *     tags: [Presupuestos]
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
 *         description: Token regenerado
 */
router.post('/:id/portal/regenerar', presupuestosController.regenerarTokenPortal.bind(presupuestosController));

/**
 * @swagger
 * /presupuestos/{id}/portal/invalidar:
 *   post:
 *     summary: Invalidar token del portal
 *     tags: [Presupuestos]
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
 *         description: Token invalidado
 */
router.post('/:id/portal/invalidar', presupuestosController.invalidarTokenPortal.bind(presupuestosController));

export default router;
