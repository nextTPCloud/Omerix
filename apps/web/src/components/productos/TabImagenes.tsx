'use client'

import { ProductImageUpload } from './ProductImageUpload'
import { productosService } from '@/services/productos.service'

interface TabImagenesProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabImagenes({ formData, setFormData, isEditing }: TabImagenesProps) {
  if (!formData?._id) {
    return (
      <div className="p-8 bg-muted rounded-md text-center">
        <p className="text-muted-foreground">
          Guarda el producto primero para poder subir imágenes
        </p>
      </div>
    )
  }

  const handleUpdate = async () => {
    try {
      const response = await productosService.getById(formData._id)
      setFormData(response.data)
    } catch {
      // Fallback: recargar pagina
      window.location.reload()
    }
  }

  return (
    <ProductImageUpload
      productoId={formData._id}
      imagenes={formData.imagenes || []}
      imagenPrincipal={formData.imagenPrincipal}
      onUpdate={handleUpdate}
    />
  )
}
