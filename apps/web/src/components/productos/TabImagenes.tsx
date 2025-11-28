import { Card } from '@/components/ui/card'
import { Upload } from 'lucide-react'

interface TabImagenesProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabImagenes({ formData, setFormData, isEditing }: TabImagenesProps) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Imagenes del Producto</h3>
        <div className="p-8 bg-muted rounded-md text-center">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            La carga de imagenes estara disponible proximamente
          </p>
        </div>
      </Card>
    </div>
  )
}
