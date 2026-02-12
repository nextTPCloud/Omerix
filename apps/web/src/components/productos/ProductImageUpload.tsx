'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, Star, Loader2, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/services/api'

interface ProductImageUploadProps {
  productoId: string
  imagenes: string[]
  imagenPrincipal?: string
  onUpdate: () => void
}

export function ProductImageUpload({
  productoId,
  imagenes,
  imagenPrincipal,
  onUpdate,
}: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      acceptedFiles.forEach(file => formData.append('images', file))

      await api.post(`/productos/${productoId}/imagenes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success(`${acceptedFiles.length} imagen(es) subida(s)`)
      onUpdate()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al subir imágenes')
    } finally {
      setUploading(false)
    }
  }, [productoId, onUpdate])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
    disabled: uploading,
  })

  const handleSetPrincipal = async (url: string) => {
    try {
      await api.patch(`/productos/${productoId}/imagen-principal`, { url })
      toast.success('Imagen principal actualizada')
      onUpdate()
    } catch (error: any) {
      toast.error('Error al cambiar imagen principal')
    }
  }

  const handleDelete = async (url: string) => {
    try {
      await api.delete(`/productos/${productoId}/imagenes`, { data: { url } })
      toast.success('Imagen eliminada')
      onUpdate()
    } catch (error: any) {
      toast.error('Error al eliminar imagen')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImagePlus className="h-5 w-5" />
          Imágenes del producto
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Grid de imagenes existentes */}
        {imagenes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {imagenes.map((url, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
              >
                <img
                  src={url}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {url === imagenPrincipal && (
                  <Badge className="absolute top-1 left-1 text-xs" variant="default">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Principal
                  </Badge>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {url !== imagenPrincipal && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetPrincipal(url)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Principal
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(url)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Zona de upload */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Subiendo imágenes...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Arrastra imágenes aquí</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WebP (máx. 10MB)</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
