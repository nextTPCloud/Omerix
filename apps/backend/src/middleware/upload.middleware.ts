import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import config from '@/config/env';

// Tipos MIME permitidos por categoría
export const MIME_TYPES = {
  images: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  ],
  all: [] as string[], // Se llena abajo
};

MIME_TYPES.all = [...MIME_TYPES.images, ...MIME_TYPES.documents];

// Almacenamiento en memoria (para procesar con sharp antes de subir a Spaces)
const memoryStorage = multer.memoryStorage();

/**
 * Filtro de archivos por MIME type
 */
const createFileFilter = (allowedTypes: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (allowedTypes.length === 0 || allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: ${allowedTypes.join(', ')}`));
    }
  };
};

/**
 * Upload de un solo archivo (cualquier tipo)
 */
export const uploadSingle = multer({
  storage: memoryStorage,
  limits: { fileSize: config.storage.limits.maxFileSize },
  fileFilter: createFileFilter(MIME_TYPES.all),
}).single('file');

/**
 * Upload de multiples archivos (cualquier tipo)
 */
export const uploadMultiple = multer({
  storage: memoryStorage,
  limits: { fileSize: config.storage.limits.maxFileSize },
  fileFilter: createFileFilter(MIME_TYPES.all),
}).array('files', 20);

/**
 * Upload de imagenes (solo tipos de imagen)
 */
export const uploadImages = multer({
  storage: memoryStorage,
  limits: { fileSize: config.storage.limits.maxImageSize },
  fileFilter: createFileFilter(MIME_TYPES.images),
});

/**
 * Upload de documentos (solo tipos de documento)
 */
export const uploadDocuments = multer({
  storage: memoryStorage,
  limits: { fileSize: config.storage.limits.maxFileSize },
  fileFilter: createFileFilter(MIME_TYPES.documents),
});
