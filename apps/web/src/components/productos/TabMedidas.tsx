import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TabMedidasProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabMedidas({ formData, setFormData, isEditing }: TabMedidasProps) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Dimensiones y Peso</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="peso">Peso (kg)</Label>
            <Input
              id="peso"
              type="number"
              step="0.001"
              min="0"
              value={formData.peso || 0}
              onChange={(e) => setFormData({ ...formData, peso: parseFloat(e.target.value) || 0 })}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="largo">Largo (cm)</Label>
            <Input
              id="largo"
              type="number"
              step="0.01"
              min="0"
              value={formData.dimensiones?.largo || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dimensiones: { ...(formData.dimensiones || {}), largo: parseFloat(e.target.value) || 0 },
                })
              }
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="ancho">Ancho (cm)</Label>
            <Input
              id="ancho"
              type="number"
              step="0.01"
              min="0"
              value={formData.dimensiones?.ancho || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dimensiones: { ...(formData.dimensiones || {}), ancho: parseFloat(e.target.value) || 0 },
                })
              }
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="alto">Alto (cm)</Label>
            <Input
              id="alto"
              type="number"
              step="0.01"
              min="0"
              value={formData.dimensiones?.alto || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dimensiones: { ...(formData.dimensiones || {}), alto: parseFloat(e.target.value) || 0 },
                })
              }
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="volumen">Volumen (m³)</Label>
            <Input
              id="volumen"
              type="number"
              step="0.001"
              min="0"
              value={formData.volumen || 0}
              onChange={(e) => setFormData({ ...formData, volumen: parseFloat(e.target.value) || 0 })}
              disabled={!isEditing}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Unidades y Embalaje</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="unidadMedida">Unidad de Medida</Label>
            <Select
              value={formData.unidadMedida || 'unidades'}
              onValueChange={(value) => setFormData({ ...formData, unidadMedida: value })}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unidades">Unidades</SelectItem>
                <SelectItem value="kg">Kilogramos</SelectItem>
                <SelectItem value="g">Gramos</SelectItem>
                <SelectItem value="l">Litros</SelectItem>
                <SelectItem value="ml">Mililitros</SelectItem>
                <SelectItem value="m">Metros</SelectItem>
                <SelectItem value="cm">Centímetros</SelectItem>
                <SelectItem value="m2">Metros cuadrados</SelectItem>
                <SelectItem value="m3">Metros cúbicos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="unidadesEmbalaje">Unidades por Embalaje</Label>
            <Input
              id="unidadesEmbalaje"
              type="number"
              min="0"
              value={formData.unidadesEmbalaje || 0}
              onChange={(e) =>
                setFormData({ ...formData, unidadesEmbalaje: parseInt(e.target.value) || 0 })
              }
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="pesoEmbalaje">Peso Embalaje (kg)</Label>
            <Input
              id="pesoEmbalaje"
              type="number"
              step="0.001"
              min="0"
              value={formData.pesoEmbalaje || 0}
              onChange={(e) => setFormData({ ...formData, pesoEmbalaje: parseFloat(e.target.value) || 0 })}
              disabled={!isEditing}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
