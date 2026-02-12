import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import empresaController from './empresa.controller';
import { emailOAuthController } from './email-oauth.controller';
import { uploadImages } from '@/middleware/upload.middleware';

const router = Router();

// ====================================
// RUTAS OAUTH2 (algunas sin auth porque son callbacks)
// ====================================

/**
 * @swagger
 * /api/empresa/email/oauth2/providers:
 *   get:
 *     summary: Obtener estado de proveedores OAuth2 disponibles
 *     tags: [Email OAuth2]
 *     responses:
 *       200:
 *         description: Estado de los proveedores
 */
router.get('/email/oauth2/providers', emailOAuthController.getProviders.bind(emailOAuthController));

/**
 * @swagger
 * /api/empresa/email/oauth2/google/auth:
 *   get:
 *     summary: Iniciar flujo OAuth2 con Google
 *     tags: [Email OAuth2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: URL de autorización
 */
router.get('/email/oauth2/google/auth', authMiddleware, emailOAuthController.startGoogleAuth.bind(emailOAuthController));

/**
 * @swagger
 * /api/empresa/email/oauth2/google/callback:
 *   get:
 *     summary: Callback de Google OAuth2
 *     tags: [Email OAuth2]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirección al frontend
 */
router.get('/email/oauth2/google/callback', emailOAuthController.googleCallback.bind(emailOAuthController));

/**
 * @swagger
 * /api/empresa/email/oauth2/microsoft/auth:
 *   get:
 *     summary: Iniciar flujo OAuth2 con Microsoft
 *     tags: [Email OAuth2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: URL de autorización
 */
router.get('/email/oauth2/microsoft/auth', authMiddleware, emailOAuthController.startMicrosoftAuth.bind(emailOAuthController));

/**
 * @swagger
 * /api/empresa/email/oauth2/microsoft/callback:
 *   get:
 *     summary: Callback de Microsoft OAuth2
 *     tags: [Email OAuth2]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirección al frontend
 */
router.get('/email/oauth2/microsoft/callback', emailOAuthController.microsoftCallback.bind(emailOAuthController));

/**
 * @swagger
 * /api/empresa/email/oauth2/disconnect:
 *   post:
 *     summary: Desconectar cuenta OAuth2
 *     tags: [Email OAuth2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cuenta desconectada
 */
router.post('/email/oauth2/disconnect', authMiddleware, emailOAuthController.disconnect.bind(emailOAuthController));

// ====================================
// RUTAS QUE REQUIEREN AUTENTICACIÓN
// ====================================
router.use(authMiddleware);

/**
 * @swagger
 * /api/empresa/mi-empresa:
 *   get:
 *     summary: Obtener información de la empresa actual
 *     tags: [Empresa]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información de la empresa
 */
router.get('/mi-empresa', empresaController.getMiEmpresa.bind(empresaController));

/**
 * @swagger
 * /api/empresa/mi-empresa:
 *   put:
 *     summary: Actualizar información de la empresa
 *     tags: [Empresa]
 *     security:
 *       - bearerAuth: []
 *     description: Solo usuarios con rol admin, gerente o superadmin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               nombreComercial:
 *                 type: string
 *               email:
 *                 type: string
 *               telefono:
 *                 type: string
 *               web:
 *                 type: string
 *               logo:
 *                 type: string
 *               direccion:
 *                 type: object
 *     responses:
 *       200:
 *         description: Empresa actualizada
 *       403:
 *         description: Sin permisos
 */
router.put('/mi-empresa', empresaController.updateMiEmpresa.bind(empresaController));

/**
 * @swagger
 * /api/empresa/email-config:
 *   get:
 *     summary: Obtener configuración de email SMTP
 *     tags: [Empresa]
 *     security:
 *       - bearerAuth: []
 *     description: Solo usuarios con rol admin, gerente o superadmin
 *     responses:
 *       200:
 *         description: Configuración de email (sin contraseña)
 *       403:
 *         description: Sin permisos
 */
router.get('/email-config', empresaController.getEmailConfig.bind(empresaController));

/**
 * @swagger
 * /api/empresa/email-config:
 *   put:
 *     summary: Actualizar configuración de email SMTP
 *     tags: [Empresa]
 *     security:
 *       - bearerAuth: []
 *     description: Solo usuarios con rol admin, gerente o superadmin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - host
 *               - port
 *               - secure
 *               - user
 *             properties:
 *               host:
 *                 type: string
 *                 example: smtp.gmail.com
 *               port:
 *                 type: number
 *                 example: 587
 *               secure:
 *                 type: boolean
 *                 example: false
 *               user:
 *                 type: string
 *                 example: email@empresa.com
 *               password:
 *                 type: string
 *                 description: Solo enviar si se quiere cambiar
 *               fromName:
 *                 type: string
 *               fromEmail:
 *                 type: string
 *               replyTo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuración actualizada
 *       403:
 *         description: Sin permisos
 */
router.put('/email-config', empresaController.updateEmailConfig.bind(empresaController));

/**
 * @swagger
 * /api/empresa/email-config/test:
 *   post:
 *     summary: Probar configuración de email enviando correo de prueba
 *     tags: [Empresa]
 *     security:
 *       - bearerAuth: []
 *     description: Solo usuarios con rol admin, gerente o superadmin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email donde enviar el correo de prueba
 *     responses:
 *       200:
 *         description: Email de prueba enviado
 *       400:
 *         description: Error al enviar
 */
router.post('/email-config/test', empresaController.testEmailConfig.bind(empresaController));

/**
 * @swagger
 * /api/empresa/send-email:
 *   post:
 *     summary: Enviar un email usando la configuración SMTP de la empresa
 *     tags: [Empresa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - html
 *             properties:
 *               to:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *               subject:
 *                 type: string
 *               html:
 *                 type: string
 *               text:
 *                 type: string
 *               cc:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *               bcc:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Email enviado
 *       400:
 *         description: Error al enviar o configuración no disponible
 */
router.post('/send-email', empresaController.sendEmail.bind(empresaController));

/**
 * @swagger
 * /api/empresa/preferencias-precios:
 *   get:
 *     summary: Obtener preferencias de precios
 *     tags: [Empresa]
 *     security:
 *       - bearerAuth: []
 *     description: Solo usuarios con rol admin, gerente o superadmin
 *     responses:
 *       200:
 *         description: Preferencias de precios
 *       403:
 *         description: Sin permisos
 */
router.get('/preferencias-precios', empresaController.getPreferenciasPrecios.bind(empresaController));

/**
 * @swagger
 * /api/empresa/preferencias-precios:
 *   put:
 *     summary: Actualizar preferencias de precios
 *     tags: [Empresa]
 *     security:
 *       - bearerAuth: []
 *     description: Solo usuarios con rol admin, gerente o superadmin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ordenBusqueda:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [tarifa, oferta, producto]
 *               aplicarOfertasAutomaticamente:
 *                 type: boolean
 *               aplicarTarifasAutomaticamente:
 *                 type: boolean
 *               permitirAcumularOfertas:
 *                 type: boolean
 *               permitirAcumularTarifaYOferta:
 *                 type: boolean
 *               descuentoMaximoManual:
 *                 type: number
 *     responses:
 *       200:
 *         description: Preferencias actualizadas
 *       403:
 *         description: Sin permisos
 */
router.put('/preferencias-precios', empresaController.updatePreferenciasPrecios.bind(empresaController));

// Subir logo de empresa
router.post('/logo', uploadImages.single('logo'), empresaController.uploadLogo.bind(empresaController));

export default router;
