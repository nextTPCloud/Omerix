import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface TabNotasProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabNotas({ formData, setFormData, isEditing }: TabNotasProps) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Notas y Observaciones</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="notas">Notas Generales</Label>
            <textarea
              id="notas"
              value={formData.notas || ''}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              disabled={!isEditing}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Notas visibles para el cliente..."
            />
          </div>

          <div>
            <Label htmlFor="notasInternas">Notas Internas</Label>
            <textarea
              id="notasInternas"
              value={formData.notasInternas || ''}
              onChange={(e) => setFormData({ ...formData, notasInternas: e.target.value })}
              disabled={!isEditing}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Notas privadas, solo para uso interno..."
            />
          </div>

          <div>
            <Label htmlFor="instruccionesUso">Instrucciones de Uso</Label>
            <textarea
              id="instruccionesUso"
              value={formData.instruccionesUso || ''}
              onChange={(e) => setFormData({ ...formData, instruccionesUso: e.target.value })}
              disabled={!isEditing}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Instrucciones de uso del producto..."
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Garantía y Mantenimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="garantiaMeses">Garantía (meses)</Label>
            <Input
              id="garantiaMeses"
              type="number"
              min="0"
              value={formData.garantiaMeses || 0}
              onChange={(e) => setFormData({ ...formData, garantiaMeses: parseInt(e.target.value) || 0 })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-3 pt-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiereInstalacion"
                checked={formData.requiereInstalacion}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiereInstalacion: !!checked })
                }
                disabled={!isEditing}
              />
              <Label htmlFor="requiereInstalacion" className="cursor-pointer">
                Requiere instalación
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiereMantenimiento"
                checked={formData.requiereMantenimiento}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiereMantenimiento: !!checked })
                }
                disabled={!isEditing}
              />
              <Label htmlFor="requiereMantenimiento" className="cursor-pointer">
                Requiere mantenimiento periódico
              </Label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
