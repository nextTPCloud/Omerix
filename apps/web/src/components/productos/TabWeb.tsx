import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface TabWebProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabWeb({ formData, setFormData, isEditing }: TabWebProps) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración TPV</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="usarEnTPV"
              checked={formData.usarEnTPV}
              onCheckedChange={(checked) => setFormData({ ...formData, usarEnTPV: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="usarEnTPV" className="cursor-pointer">
              Usar en TPV
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="usarEnKiosk"
              checked={formData.usarEnKiosk}
              onCheckedChange={(checked) => setFormData({ ...formData, usarEnKiosk: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="usarEnKiosk" className="cursor-pointer">
              Usar en Kiosk
            </Label>
          </div>

          {formData.usarEnTPV && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="permiteDescuento"
                  checked={formData.permiteDescuento}
                  onCheckedChange={(checked) => setFormData({ ...formData, permiteDescuento: !!checked })}
                  disabled={!isEditing}
                />
                <Label htmlFor="permiteDescuento" className="cursor-pointer">
                  Permitir descuentos
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="precioModificable"
                  checked={formData.precioModificable}
                  onCheckedChange={(checked) => setFormData({ ...formData, precioModificable: !!checked })}
                  disabled={!isEditing}
                />
                <Label htmlFor="precioModificable" className="cursor-pointer">
                  Permitir modificar precio en TPV
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="imprimirEnTicket"
                  checked={formData.imprimirEnTicket}
                  onCheckedChange={(checked) => setFormData({ ...formData, imprimirEnTicket: !!checked })}
                  disabled={!isEditing}
                />
                <Label htmlFor="imprimirEnTicket" className="cursor-pointer">
                  Imprimir en ticket
                </Label>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración E-commerce / Web</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="publicarWeb"
              checked={formData.publicarWeb}
              onCheckedChange={(checked) => setFormData({ ...formData, publicarWeb: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="publicarWeb" className="cursor-pointer">
              Publicar en tienda online
            </Label>
          </div>

          {formData.publicarWeb && (
            <>
              <div>
                <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle || ''}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Título para motores de búsqueda"
                  maxLength={60}
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                <textarea
                  id="metaDescription"
                  value={formData.metaDescription || ''}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  maxLength={160}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Descripción para motores de búsqueda (máx. 160 caracteres)"
                />
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
