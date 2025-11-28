/**
 * Rutas de IA
 */

import { Router } from 'express';
import { aiController } from './ai.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Estado del servicio
router.get('/status', aiController.getStatus);

// Sugerir precio de mercado
router.post('/suggest-price', aiController.suggestPrice);

// Generar descripción de producto
router.post('/generate-description', aiController.generateDescription);

// Sugerir categoría
router.post('/suggest-category', aiController.suggestCategory);

// Chat con asistente
router.post('/chat', aiController.chat);

export default router;
