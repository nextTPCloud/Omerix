import { z } from 'zod';

export const CreateRestooConnectionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apiUrl: z.string().url('URL invalida'),
  apiKey: z.string().min(1, 'La API Key es requerida'),
  apiSecret: z.string().optional(),
  restauranteIdRestoo: z.string().min(1, 'El ID del restaurante en Restoo es requerido'),
  configuracion: z.object({
    syncAutomatico: z.boolean().optional().default(false),
    intervaloMinutos: z.number().min(1).optional().default(5),
    syncReservas: z.boolean().optional().default(true),
    syncDisponibilidad: z.boolean().optional().default(false),
    syncCancelaciones: z.boolean().optional().default(true),
    syncNoShows: z.boolean().optional().default(true),
    crearClientesSiNoExisten: z.boolean().optional().default(true),
    salonPorDefecto: z.string().optional(),
  }).optional(),
});

export const UpdateRestooConnectionSchema = CreateRestooConnectionSchema.partial();

export const SyncRestooSchema = z.object({
  tipo: z.enum(['reservas', 'disponibilidad', 'clientes']),
});

export const MapeoSalonSchema = z.object({
  mapeos: z.array(z.object({
    salonIdLocal: z.string().min(1),
    zonaIdRestoo: z.string().min(1),
    nombreRestoo: z.string().min(1),
    mesasMapeo: z.array(z.object({
      mesaIdLocal: z.string().min(1),
      mesaIdRestoo: z.string().min(1),
    })).optional().default([]),
  })),
});

export type CreateRestooConnectionDTO = z.infer<typeof CreateRestooConnectionSchema>;
export type UpdateRestooConnectionDTO = z.infer<typeof UpdateRestooConnectionSchema>;
export type SyncRestooDTO = z.infer<typeof SyncRestooSchema>;
export type MapeoSalonDTO = z.infer<typeof MapeoSalonSchema>;
