'use client'

import { useCallback, useState } from 'react'
import { useDropzone, Accept } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, FileImage, FileSpreadsheet, File as FileIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: Accept
  maxFiles?: number
  maxSize?: number // en bytes
  multiple?: boolean
  showPreview?: boolean
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

const getIconForType = (type: string) => {
  if (type.startsWith('image/')) return FileImage
  if (type.includes('pdf')) return FileText
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet
  return FileIcon
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  onUpload,
  accept,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  multiple = false,
  showPreview = true,
  label = 'Arrastra archivos aquí',
  description = 'o haz clic para seleccionar',
  disabled = false,
  className = '',
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(f =>
        f.errors.map((e: any) => e.message).join(', ')
      ).join('; ')
      toast.error(`Archivos rechazados: ${errors}`)
    }

    if (acceptedFiles.length > 0) {
      if (multiple) {
        setSelectedFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles))
      } else {
        setSelectedFiles(acceptedFiles.slice(0, 1))
      }
    }
  }, [multiple, maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    multiple,
    disabled: disabled || uploading,
  })

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    try {
      await onUpload(selectedFiles)
      setSelectedFiles([])
      toast.success('Archivos subidos correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al subir archivos')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={className}>
      {/* Zona de drop */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Máx. {formatSize(maxSize)} por archivo
        </p>
      </div>

      {/* Preview de archivos seleccionados */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedFiles.map((file, index) => {
            const Icon = getIconForType(file.type)
            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-2 bg-muted rounded-lg"
              >
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  disabled={uploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          })}

          <Button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir {selectedFiles.length > 1 ? `${selectedFiles.length} archivos` : 'archivo'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
