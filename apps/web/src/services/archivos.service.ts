import { api } from './api'

export interface ArchivoMetadata {
  _id: string
  empresaId: string
  modulo: string
  entidadId: string
  categoria?: string
  nombre: string
  key: string
  url: string
  mimeType: string
  size: number
  thumbnails?: Record<string, { key: string; url: string }>
  isPublic: boolean
  uploadedBy: string
  uploadedAt: string
}

export interface StorageUsage {
  usedBytes: number
  limitBytes: number
  usedGB: number
  limitGB: number
  fileCount: number
  percentUsed: number
  breakdown: Record<string, { bytes: number; count: number }>
}

export interface UploadOptions {
  modulo: string
  entidadId: string
  categoria?: string
  isPublic?: boolean
  generateThumbnails?: boolean
}

export const archivosService = {
  /**
   * Subir un archivo
   */
  uploadFile: async (file: File, options: UploadOptions): Promise<ArchivoMetadata> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('modulo', options.modulo)
    formData.append('entidadId', options.entidadId)
    if (options.categoria) formData.append('categoria', options.categoria)
    if (options.isPublic !== undefined) formData.append('isPublic', String(options.isPublic))
    if (options.generateThumbnails !== undefined) formData.append('generateThumbnails', String(options.generateThumbnails))

    const { data } = await api.post('/archivos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  /**
   * Subir multiples archivos
   */
  uploadMultiple: async (files: File[], options: UploadOptions): Promise<ArchivoMetadata[]> => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    formData.append('modulo', options.modulo)
    formData.append('entidadId', options.entidadId)
    if (options.categoria) formData.append('categoria', options.categoria)
    if (options.isPublic !== undefined) formData.append('isPublic', String(options.isPublic))
    if (options.generateThumbnails !== undefined) formData.append('generateThumbnails', String(options.generateThumbnails))

    const { data } = await api.post('/archivos/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  /**
   * Eliminar un archivo por key
   */
  deleteFile: async (key: string): Promise<void> => {
    await api.delete(`/archivos/${key}`)
  },

  /**
   * Obtener URL firmada para archivo privado
   */
  getSignedUrl: async (key: string): Promise<string> => {
    const { data } = await api.get(`/archivos/signed-url/${key}`)
    return data.data.url
  },

  /**
   * Listar archivos por modulo/entidad
   */
  listFiles: async (filters: { modulo?: string; entidadId?: string; categoria?: string }): Promise<ArchivoMetadata[]> => {
    const params = new URLSearchParams()
    if (filters.modulo) params.append('modulo', filters.modulo)
    if (filters.entidadId) params.append('entidadId', filters.entidadId)
    if (filters.categoria) params.append('categoria', filters.categoria)

    const { data } = await api.get(`/archivos?${params.toString()}`)
    return data.data
  },

  /**
   * Obtener uso de almacenamiento
   */
  getStorageUsage: async (): Promise<StorageUsage> => {
    const { data } = await api.get('/archivos/usage')
    return data.data
  },

  /**
   * Subir archivo directamente a un modulo (clientes, proveedores, etc.)
   * Usa la ruta del modulo especifico en lugar de /archivos/upload
   */
  uploadToModule: async (modulo: string, entityId: string, file: File, fieldName: string = 'file'): Promise<any> => {
    const formData = new FormData()
    formData.append(fieldName, file)

    const { data } = await api.post(`/${modulo}/${entityId}/archivos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  /**
   * Eliminar archivo de un modulo especifico
   */
  deleteFromModule: async (modulo: string, entityId: string, url: string): Promise<any> => {
    const { data } = await api.delete(`/${modulo}/${entityId}/archivos`, { data: { url } })
    return data.data
  },
}
