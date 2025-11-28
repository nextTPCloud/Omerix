import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Package, Hash, Info } from 'lucide-react'

interface TabTrazabilidadProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabTrazabilidad({ formData, setFormData, isEditing }: TabTrazabilidadProps) {
  const tipoTrazabilidad = formData.trazabilidad?.tipo || 'ninguna'
  const aplicaEn = formData.trazabilidad?.aplicaEn || 'ambas'

  const updateTrazabilidad = (updates: Record<string, any>) => {
    setFormData({
      ...formData,
      trazabilidad: { ...(formData.trazabilidad || {}), ...updates },
    })
  }

  return (
    <div className="space-y-4">
      {/* Tipo de Trazabilidad */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tipo de Trazabilidad</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="tipoTrazabilidad">Selecciona el tipo de control</Label>
            <Select
              value={tipoTrazabilidad}
              onValueChange={(value) => updateTrazabilidad({ tipo: value })}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna">Sin trazabilidad</SelectItem>
                <SelectItem value="lote">Por Lotes</SelectItem>
                <SelectItem value="numero_serie">Por Número de Serie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipoTrazabilidad !== 'ninguna' && (
            <div>
              <Label htmlFor="aplicaEn">Aplicar trazabilidad en</Label>
              <Select
                value={aplicaEn}
                onValueChange={(value) => updateTrazabilidad({ aplicaEn: value })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine className="h-4 w-4 text-green-600" />
                      Solo Entradas (compras, recepciones)
                    </div>
                  </SelectItem>
                  <SelectItem value="salida">
                    <div className="flex items-center gap-2">
                      <ArrowUpFromLine className="h-4 w-4 text-blue-600" />
                      Solo Salidas (ventas, envíos)
                    </div>
                  </SelectItem>
                  <SelectItem value="ambas">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4 text-purple-600" />
                      Entradas y Salidas
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Opciones adicionales según tipo */}
      {tipoTrazabilidad !== 'ninguna' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Opciones de Trazabilidad</h3>

          <div className="space-y-4">
            {tipoTrazabilidad === 'lote' && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requerirFechaCaducidad"
                    checked={formData.trazabilidad?.requerirFechaCaducidad ?? true}
                    onCheckedChange={(checked) => updateTrazabilidad({ requerirFechaCaducidad: !!checked })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="requerirFechaCaducidad" className="cursor-pointer">
                    Requerir fecha de caducidad obligatoria
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alertaCaducidad"
                    checked={formData.trazabilidad?.alertaCaducidad ?? false}
                    onCheckedChange={(checked) => updateTrazabilidad({ alertaCaducidad: !!checked })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="alertaCaducidad" className="cursor-pointer">
                    Alertar cuando un lote esté próximo a caducar
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fifoAutomatico"
                    checked={formData.trazabilidad?.fifoAutomatico ?? true}
                    onCheckedChange={(checked) => updateTrazabilidad({ fifoAutomatico: !!checked })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="fifoAutomatico" className="cursor-pointer">
                    Aplicar FIFO automático (primero en entrar, primero en salir)
                  </Label>
                </div>
              </>
            )}

            {tipoTrazabilidad === 'numero_serie' && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="serieUnicaGlobal"
                    checked={formData.trazabilidad?.serieUnicaGlobal ?? true}
                    onCheckedChange={(checked) => updateTrazabilidad({ serieUnicaGlobal: !!checked })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="serieUnicaGlobal" className="cursor-pointer">
                    Número de serie único globalmente (no repetir entre productos)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="generarSerieAutomatica"
                    checked={formData.trazabilidad?.generarSerieAutomatica ?? false}
                    onCheckedChange={(checked) => updateTrazabilidad({ generarSerieAutomatica: !!checked })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="generarSerieAutomatica" className="cursor-pointer">
                    Generar números de serie automáticamente
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="registrarGarantia"
                    checked={formData.trazabilidad?.registrarGarantia ?? false}
                    onCheckedChange={(checked) => updateTrazabilidad({ registrarGarantia: !!checked })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="registrarGarantia" className="cursor-pointer">
                    Registrar información de garantía por número de serie
                  </Label>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Información del estado actual */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info className="h-5 w-5" />
          Resumen de Trazabilidad
        </h3>

        <div className="p-4 bg-muted rounded-md">
          {tipoTrazabilidad === 'ninguna' && (
            <p className="text-sm text-muted-foreground">
              El producto no requiere control de trazabilidad especial.
            </p>
          )}

          {tipoTrazabilidad === 'lote' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-500" />
                <p className="text-sm font-medium">Trazabilidad por Lotes</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Gestiona lotes con fechas de fabricación y caducidad. Ideal para productos alimenticios,
                farmacéuticos o con fecha de expiración.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Aplica en:</span>
                {aplicaEn === 'entrada' && (
                  <span className="flex items-center gap-1 text-green-600">
                    <ArrowDownToLine className="h-4 w-4" /> Entradas
                  </span>
                )}
                {aplicaEn === 'salida' && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <ArrowUpFromLine className="h-4 w-4" /> Salidas
                  </span>
                )}
                {aplicaEn === 'ambas' && (
                  <span className="flex items-center gap-1 text-purple-600">
                    <ArrowLeftRight className="h-4 w-4" /> Entradas y Salidas
                  </span>
                )}
              </div>
              {formData.trazabilidad?.lotes && formData.trazabilidad.lotes.length > 0 ? (
                <p className="text-sm">Total de lotes registrados: {formData.trazabilidad.lotes.length}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No hay lotes registrados aún</p>
              )}
            </div>
          )}

          {tipoTrazabilidad === 'numero_serie' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-500" />
                <p className="text-sm font-medium">Trazabilidad por Número de Serie</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Cada unidad tiene un número de serie único. Ideal para equipos electrónicos, electrodomésticos, etc.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Aplica en:</span>
                {aplicaEn === 'entrada' && (
                  <span className="flex items-center gap-1 text-green-600">
                    <ArrowDownToLine className="h-4 w-4" /> Entradas
                  </span>
                )}
                {aplicaEn === 'salida' && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <ArrowUpFromLine className="h-4 w-4" /> Salidas
                  </span>
                )}
                {aplicaEn === 'ambas' && (
                  <span className="flex items-center gap-1 text-purple-600">
                    <ArrowLeftRight className="h-4 w-4" /> Entradas y Salidas
                  </span>
                )}
              </div>
              {formData.trazabilidad?.numerosSerie && formData.trazabilidad.numerosSerie.length > 0 ? (
                <p className="text-sm">Total de números de serie: {formData.trazabilidad.numerosSerie.length}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No hay números de serie registrados aún</p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
