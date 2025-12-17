/**
 * Rutas de IA
 */

import { Router } from 'express';
import { aiController } from './ai.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: Servicios de inteligencia artificial para asistencia en el ERP
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AIStatus:
 *       type: object
 *       properties:
 *         available:
 *           type: boolean
 *           description: Si el servicio de IA está disponible
 *           example: true
 *         provider:
 *           type: string
 *           description: Proveedor de IA configurado
 *           example: openai
 *         model:
 *           type: string
 *           description: Modelo de IA en uso
 *           example: gpt-4
 *     SuggestPriceRequest:
 *       type: object
 *       required:
 *         - productName
 *       properties:
 *         productName:
 *           type: string
 *           description: Nombre del producto
 *           example: Café espresso
 *         category:
 *           type: string
 *           description: Categoría del producto
 *           example: Bebidas calientes
 *         description:
 *           type: string
 *           description: Descripción del producto
 *     SuggestPriceResponse:
 *       type: object
 *       properties:
 *         suggestedPrice:
 *           type: number
 *           description: Precio sugerido
 *           example: 2.50
 *         minPrice:
 *           type: number
 *           description: Precio mínimo estimado
 *           example: 1.80
 *         maxPrice:
 *           type: number
 *           description: Precio máximo estimado
 *           example: 3.50
 *         reasoning:
 *           type: string
 *           description: Explicación del precio sugerido
 *     GenerateDescriptionRequest:
 *       type: object
 *       required:
 *         - productName
 *       properties:
 *         productName:
 *           type: string
 *           description: Nombre del producto
 *           example: Hamburguesa clásica
 *         category:
 *           type: string
 *           description: Categoría del producto
 *         ingredients:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de ingredientes
 *         style:
 *           type: string
 *           enum: [formal, informal, marketing]
 *           description: Estilo de la descripción
 *           default: informal
 *     GenerateDescriptionResponse:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           description: Descripción generada
 *         shortDescription:
 *           type: string
 *           description: Descripción corta para etiquetas
 *     SuggestCategoryRequest:
 *       type: object
 *       required:
 *         - productName
 *       properties:
 *         productName:
 *           type: string
 *           description: Nombre del producto
 *         description:
 *           type: string
 *           description: Descripción del producto
 *         existingCategories:
 *           type: array
 *           items:
 *             type: string
 *           description: Categorías existentes en el sistema
 *     SuggestCategoryResponse:
 *       type: object
 *       properties:
 *         suggestedCategory:
 *           type: string
 *           description: Categoría sugerida
 *         confidence:
 *           type: number
 *           description: Nivel de confianza (0-1)
 *         alternatives:
 *           type: array
 *           items:
 *             type: string
 *           description: Categorías alternativas
 *     LookupBarcodeRequest:
 *       type: object
 *       required:
 *         - barcode
 *       properties:
 *         barcode:
 *           type: string
 *           description: Código de barras (EAN, UPC, etc.)
 *           example: "8410076472533"
 *     LookupBarcodeResponse:
 *       type: object
 *       properties:
 *         found:
 *           type: boolean
 *           description: Si se encontró información del producto
 *         productName:
 *           type: string
 *           description: Nombre del producto
 *         brand:
 *           type: string
 *           description: Marca del producto
 *         category:
 *           type: string
 *           description: Categoría del producto
 *         description:
 *           type: string
 *           description: Descripción del producto
 *         imageUrl:
 *           type: string
 *           description: URL de imagen del producto
 *     ChatRequest:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           description: Mensaje del usuario
 *           example: ¿Cómo puedo añadir un nuevo producto?
 *         context:
 *           type: object
 *           description: Contexto adicional para la conversación
 *         conversationId:
 *           type: string
 *           description: ID de conversación para mantener contexto
 *     ChatResponse:
 *       type: object
 *       properties:
 *         response:
 *           type: string
 *           description: Respuesta del asistente
 *         conversationId:
 *           type: string
 *           description: ID de conversación para seguimiento
 *         suggestions:
 *           type: array
 *           items:
 *             type: string
 *           description: Sugerencias de seguimiento
 */

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: Obtener estado del servicio de IA
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del servicio obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AIStatus'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/status', aiController.getStatus);

/**
 * @swagger
 * /api/ai/suggest-price:
 *   post:
 *     summary: Sugerir precio de mercado para un producto
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuggestPriceRequest'
 *     responses:
 *       200:
 *         description: Precio sugerido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SuggestPriceResponse'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       503:
 *         description: Servicio de IA no disponible
 */
router.post('/suggest-price', aiController.suggestPrice);

/**
 * @swagger
 * /api/ai/generate-description:
 *   post:
 *     summary: Generar descripción de producto con IA
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateDescriptionRequest'
 *     responses:
 *       200:
 *         description: Descripción generada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/GenerateDescriptionResponse'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       503:
 *         description: Servicio de IA no disponible
 */
router.post('/generate-description', aiController.generateDescription);

/**
 * @swagger
 * /api/ai/suggest-category:
 *   post:
 *     summary: Sugerir categoría para un producto
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuggestCategoryRequest'
 *     responses:
 *       200:
 *         description: Categoría sugerida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SuggestCategoryResponse'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       503:
 *         description: Servicio de IA no disponible
 */
router.post('/suggest-category', aiController.suggestCategory);

/**
 * @swagger
 * /api/ai/lookup-barcode:
 *   post:
 *     summary: Buscar información de producto por código de barras
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Busca información de un producto usando su código de barras (EAN, UPC, etc.)
 *       en bases de datos públicas y servicios de IA.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LookupBarcodeRequest'
 *     responses:
 *       200:
 *         description: Búsqueda completada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LookupBarcodeResponse'
 *       400:
 *         description: Código de barras inválido
 *       401:
 *         description: No autorizado
 *       503:
 *         description: Servicio de IA no disponible
 */
router.post('/lookup-barcode', aiController.lookupBarcode);

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Chat con asistente de IA
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Interactúa con el asistente de IA para obtener ayuda sobre el uso del ERP,
 *       resolución de dudas y asistencia en tareas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *     responses:
 *       200:
 *         description: Respuesta del asistente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: Mensaje inválido
 *       401:
 *         description: No autorizado
 *       503:
 *         description: Servicio de IA no disponible
 */
router.post('/chat', aiController.chat);

// ============================================
// COMANDOS DE VOZ/CHAT
// ============================================

/**
 * @swagger
 * /api/ai/command:
 *   post:
 *     summary: Procesar comando de voz/texto para crear documentos
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Interpreta un comando en lenguaje natural y crea documentos comerciales.
 *
 *       Ejemplos de comandos:
 *       - "Crea un albarán para cliente ACME con 10 tornillos M8"
 *       - "Hazme un presupuesto para Industrias López con 5 motores"
 *       - "Pide a Ferretería Central 100 tuercas M10"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - command
 *             properties:
 *               command:
 *                 type: string
 *                 description: Comando en lenguaje natural
 *                 example: "Crea un albarán para ACME con 10 tornillos"
 *               autoCreate:
 *                 type: boolean
 *                 description: Si es true, crea el documento sin pedir confirmación
 *                 default: false
 *     responses:
 *       200:
 *         description: Comando procesado
 *       400:
 *         description: Comando inválido
 *       401:
 *         description: No autorizado
 */
router.post('/command', aiController.processCommand);

/**
 * @swagger
 * /api/ai/command/parse:
 *   post:
 *     summary: Parsear comando sin ejecutarlo
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Analiza un comando y extrae la intención y entidades sin crear ningún documento.
 *       Útil para previsualizar qué haría el comando.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - command
 *             properties:
 *               command:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comando parseado
 */
router.post('/command/parse', aiController.parseCommand);

/**
 * @swagger
 * /api/ai/command/confirm:
 *   post:
 *     summary: Confirmar y crear documento
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Confirma la creación de un documento después de que el usuario haya
 *       revisado y posiblemente corregido los datos extraídos del comando.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipoDocumento
 *               - terceroId
 *               - productos
 *             properties:
 *               tipoDocumento:
 *                 type: string
 *                 enum: [presupuesto, pedido, albaran, factura, presupuesto_compra, pedido_compra, albaran_compra, factura_compra]
 *               terceroId:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   nombre:
 *                     type: string
 *                   datos:
 *                     type: object
 *               productos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nombre:
 *                       type: string
 *                     cantidad:
 *                       type: number
 *                     precio:
 *                       type: number
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Documento creado
 */
router.post('/command/confirm', aiController.confirmCommand);

/**
 * @swagger
 * /api/ai/smart-chat:
 *   post:
 *     summary: Chat inteligente con detección de comandos
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Chat que detecta automáticamente si el mensaje es un comando (para crear documentos)
 *       o una pregunta normal, y actúa en consecuencia.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Mensaje del usuario
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant, system]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Respuesta del chat
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
 *                     respuesta:
 *                       type: string
 *                     esComando:
 *                       type: boolean
 *                     resultado:
 *                       type: object
 */
router.post('/smart-chat', aiController.smartChat);

export default router;
