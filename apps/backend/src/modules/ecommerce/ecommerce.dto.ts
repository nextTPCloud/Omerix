import { z } from 'zod';

export const CreateConexionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  plataforma: z.enum(['prestashop', 'woocommerce']),
  url: z.string().url('URL invalida'),
  apiKey: z.string().min(1, 'La API Key es requerida'),
  apiSecret: z.string().optional(),
  configuracion: z.object({
    syncAutomatico: z.boolean().optional().default(false),
    intervaloMinutos: z.number().min(5).optional().default(60),
    almacenId: z.string().optional(),
    tarifaId: z.string().optional(),
    sincronizarStock: z.boolean().optional().default(true),
    sincronizarPrecios: z.boolean().optional().default(true),
    sincronizarImagenes: z.boolean().optional().default(false),
    sincronizarDescripciones: z.boolean().optional().default(true),
    mapeoCategoriasAuto: z.boolean().optional().default(true),
    crearProductosNuevos: z.boolean().optional().default(false),
    actualizarExistentes: z.boolean().optional().default(true),
  }).optional(),
});

export const UpdateConexionSchema = CreateConexionSchema.partial();

export const SyncRequestSchema = z.object({
  tipo: z.enum(['productos', 'categorias', 'stock', 'pedidos', 'precios']),
  direccion: z.enum(['subir', 'descargar', 'bidireccional']).optional().default('subir'),
});

export type CreateConexionDTO = z.infer<typeof CreateConexionSchema>;
export type UpdateConexionDTO = z.infer<typeof UpdateConexionSchema>;
export type SyncRequestDTO = z.infer<typeof SyncRequestSchema>;
