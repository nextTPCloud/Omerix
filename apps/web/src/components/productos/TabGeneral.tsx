import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CodeInput } from '@/components/ui/code-input'
import { FormattedText } from '@/components/ui/formatted-text'
import { QuickCreateFamilia } from '@/components/quick-create'
import { Plus, X, Sparkles, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { familiasService } from '@/services/familias.service'
import { productosService } from '@/services/productos.service'
import { aiService, GeneratedDescription, BarcodeProductInfo } from '@/services/ai.service'
import { Familia } from '@/types/familia.types'

interface TabGeneralProps {
  formData: any
  setFormData: (data: any) => void
  isEditing: boolean
}

export function TabGeneral({ formData, setFormData, isEditing }: TabGeneralProps) {
  const [familias, setFamilias] = useState<Familia[]>([])
  const [loadingFamilias, setLoadingFamilias] = useState(true)

  // Estado para IA
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<GeneratedDescription | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Estado para búsqueda por código de barras
  const [loadingBarcode, setLoadingBarcode] = useState(false)
  const [barcodeInfo, setBarcodeInfo] = useState<BarcodeProductInfo | null>(null)
  const [showBarcodePanel, setShowBarcodePanel] = useState(false)
  const [barcodeError, setBarcodeError] = useState<string | null>(null)

  // Estado para modal de creación rápida
  const [showCreateFamilia, setShowCreateFamilia] = useState(false)

  useEffect(() => {
    const fetchFamilias = async () => {
      try {
        setLoadingFamilias(true)
        const response = await familiasService.getAll({ limit: 1000, activo: true })
        setFamilias(response.data || [])
      } catch (error) {
        console.error('Error al cargar familias:', error)
      } finally {
        setLoadingFamilias(false)
      }
    }
    fetchFamilias()
  }, [])

  // Convertir familias a opciones para el SearchableSelect
  const familiasOptions = useMemo(() => {
    return familias.map((familia) => ({
      value: familia._id,
      label: familia.nombre,
      description: familia.codigo || undefined,
    }))
  }, [familias])

  // Función para buscar SKUs existentes
  const handleSearchSkus = useCallback(async (prefix: string): Promise<string[]> => {
    try {
      return await productosService.searchSkus(prefix)
    } catch {
      return []
    }
  }, [])

  const addCodigoAlternativo = () => {
    setFormData({
      ...formData,
      codigosAlternativos: [...(formData.codigosAlternativos || []), ''],
    })
  }

  const removeCodigoAlternativo = (index: number) => {
    setFormData({
      ...formData,
      codigosAlternativos: formData.codigosAlternativos.filter((_: any, i: number) => i !== index),
    })
  }

  const updateCodigoAlternativo = (index: number, value: string) => {
    const newCodigos = [...formData.codigosAlternativos]
    newCodigos[index] = value
    setFormData({ ...formData, codigosAlternativos: newCodigos })
  }

  // Función para generar descripción con IA
  const handleGenerateDescription = async () => {
    if (!formData.nombre) {
      setAiError('Ingresa un nombre de producto primero')
      return
    }

    setLoadingAI(true)
    setAiError(null)
    setShowAiPanel(true)

    try {
      // Obtener nombre de familia si está seleccionada
      const familiaSeleccionada = familias.find(f => f._id === formData.familiaId)

      const suggestion = await aiService.generateDescription({
        productName: formData.nombre,
        category: familiaSeleccionada?.nombre,
        features: formData.marca ? [formData.marca] : undefined,
      })

      setAiSuggestion(suggestion)
    } catch (error: any) {
      console.error('Error al generar descripción:', error)
      setAiError(error.message || 'Error al generar descripción')
    } finally {
      setLoadingAI(false)
    }
  }

  // Aplicar descripción corta
  const applyShortDescription = () => {
    if (aiSuggestion) {
      setFormData({ ...formData, descripcionCorta: aiSuggestion.shortDescription })
    }
  }

  // Aplicar descripción completa
  const applyFullDescription = () => {
    if (aiSuggestion) {
      setFormData({ ...formData, descripcion: aiSuggestion.fullDescription })
    }
  }

  // Aplicar ambas descripciones
  const applyBothDescriptions = () => {
    if (aiSuggestion) {
      setFormData({
        ...formData,
        descripcionCorta: aiSuggestion.shortDescription,
        descripcion: aiSuggestion.fullDescription,
      })
    }
  }

  // Función para buscar producto por código de barras con IA
  const handleLookupBarcode = async () => {
    if (!formData.codigoBarras) {
      setBarcodeError('Ingresa un código de barras primero')
      return
    }

    setLoadingBarcode(true)
    setBarcodeError(null)
    setShowBarcodePanel(true)

    try {
      const info = await aiService.lookupBarcode(formData.codigoBarras)
      setBarcodeInfo(info)
    } catch (error: any) {
      console.error('Error al buscar producto:', error)
      setBarcodeError(error.message || 'Error al buscar información del producto')
    } finally {
      setLoadingBarcode(false)
    }
  }

  // Aplicar información del código de barras
  const applyBarcodeInfo = () => {
    if (barcodeInfo && barcodeInfo.found) {
      const updates: any = {}
      if (barcodeInfo.name && !formData.nombre) updates.nombre = barcodeInfo.name
      if (barcodeInfo.shortDescription) updates.descripcionCorta = barcodeInfo.shortDescription
      if (barcodeInfo.fullDescription) updates.descripcion = barcodeInfo.fullDescription
      if (barcodeInfo.brand && !formData.marca) updates.marca = barcodeInfo.brand

      setFormData({ ...formData, ...updates })
      setShowBarcodePanel(false)
    }
  }

  // Aplicar campo individual del código de barras
  const applyBarcodeField = (field: string) => {
    if (!barcodeInfo) return

    const fieldMap: Record<string, string> = {
      name: 'nombre',
      shortDescription: 'descripcionCorta',
      fullDescription: 'descripcion',
      brand: 'marca',
    }

    const formField = fieldMap[field]
    if (formField && barcodeInfo[field as keyof BarcodeProductInfo]) {
      setFormData({ ...formData, [formField]: barcodeInfo[field as keyof BarcodeProductInfo] })
    }
  }

  // Handler para cuando se crea una nueva familia
  const handleFamiliaCreated = (newFamilia: { _id: string; nombre: string; codigo?: string }) => {
    // Añadir la nueva familia a la lista
    setFamilias(prev => [...prev, { ...newFamilia, activo: true } as Familia])
    // Seleccionar la nueva familia
    setFormData({ ...formData, familiaId: newFamilia._id })
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Identificación del Producto</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Introduce primero el código de barras para autocompletar con IA
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="codigoBarras">Código de Barras</Label>
              {isEditing && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleLookupBarcode}
                  disabled={loadingBarcode || !formData.codigoBarras}
                  className="h-7 text-xs gap-1"
                >
                  {loadingBarcode ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Buscar con IA
                </Button>
              )}
            </div>
            <Input
              id="codigoBarras"
              value={formData.codigoBarras || ''}
              onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
              disabled={!isEditing}
              placeholder="EAN-13, UPC-A, etc."
            />
          </div>

          <div>
            <Label htmlFor="sku">SKU *</Label>
            <CodeInput
              id="sku"
              value={formData.sku}
              onChange={(value) => setFormData({ ...formData, sku: value })}
              onSearchCodes={handleSearchSkus}
              disabled={!isEditing}
              placeholder="Ej: PROD001"
              helperText={isEditing ? "Pulsa ↓ para sugerir siguiente SKU" : undefined}
            />
          </div>

          <div>
            <Label htmlFor="referencia">Referencia Proveedor</Label>
            <Input
              id="referencia"
              value={formData.referencia || ''}
              onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              value={formData.marca || ''}
              onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          {/* Panel de información del código de barras */}
          {showBarcodePanel && (
            <div className="md:col-span-2 border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Información del Producto</span>
                  {barcodeInfo && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      barcodeInfo.confidence === 'alta' ? 'bg-green-100 text-green-700' :
                      barcodeInfo.confidence === 'media' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Confianza {barcodeInfo.confidence}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBarcodePanel(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {loadingBarcode && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando información del producto...
                </div>
              )}

              {barcodeError && (
                <div className="text-sm text-red-600 py-2">
                  {barcodeError}
                </div>
              )}

              {barcodeInfo && !loadingBarcode && (
                <div className="space-y-3">
                  {!barcodeInfo.found ? (
                    <div className="text-sm text-muted-foreground py-2">
                      No se encontró información para el código de barras {barcodeInfo.barcode}.
                      {barcodeInfo.source && <span className="block text-xs mt-1">{barcodeInfo.source}</span>}
                    </div>
                  ) : (
                    <>
                      {barcodeInfo.name && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Nombre</span>
                            <Button type="button" size="sm" variant="ghost" onClick={() => applyBarcodeField('name')} className="h-6 text-xs gap-1">
                              <Check className="h-3 w-3" /> Aplicar
                            </Button>
                          </div>
                          <div className="bg-white/50 dark:bg-black/20 p-2 rounded border text-sm">{barcodeInfo.name}</div>
                        </div>
                      )}
                      {barcodeInfo.brand && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Marca</span>
                            <Button type="button" size="sm" variant="ghost" onClick={() => applyBarcodeField('brand')} className="h-6 text-xs gap-1">
                              <Check className="h-3 w-3" /> Aplicar
                            </Button>
                          </div>
                          <div className="bg-white/50 dark:bg-black/20 p-2 rounded border text-sm">{barcodeInfo.brand}</div>
                        </div>
                      )}
                      {barcodeInfo.shortDescription && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Descripción Corta</span>
                            <Button type="button" size="sm" variant="ghost" onClick={() => applyBarcodeField('shortDescription')} className="h-6 text-xs gap-1">
                              <Check className="h-3 w-3" /> Aplicar
                            </Button>
                          </div>
                          <div className="bg-white/50 dark:bg-black/20 p-2 rounded border text-sm">{barcodeInfo.shortDescription}</div>
                        </div>
                      )}
                      <div className="flex justify-end pt-2 border-t">
                        <Button type="button" size="sm" onClick={applyBarcodeInfo} className="gap-1">
                          <Check className="h-3 w-3" /> Aplicar toda la información
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Card de Información del Producto */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Información del Producto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="descripcionCorta">Descripción Corta</Label>
            <Input
              id="descripcionCorta"
              value={formData.descripcionCorta || ''}
              onChange={(e) => setFormData({ ...formData, descripcionCorta: e.target.value })}
              disabled={!isEditing}
              maxLength={200}
              placeholder="Descripción breve para listados"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="descripcion">Descripción Completa</Label>
              {isEditing && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateDescription}
                  disabled={loadingAI || !formData.nombre}
                  className="h-7 text-xs gap-1"
                >
                  {loadingAI ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Generar con IA
                </Button>
              )}
            </div>
            {isEditing ? (
              <textarea
                id="descripcion"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <div
                className="w-full min-h-[100px] rounded-md border border-input bg-muted/50 px-3 py-2 text-sm prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: formData.descripcion || '<span class="text-muted-foreground">Sin descripción</span>' }}
              />
            )}
          </div>

          {/* Panel de sugerencias de IA */}
          {showAiPanel && (
            <div className="md:col-span-2 border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="font-medium text-sm">Sugerencia de IA</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAiPanel(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {loadingAI && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando descripción...
                </div>
              )}

              {aiError && (
                <div className="text-sm text-red-600 py-2">
                  {aiError}
                </div>
              )}

              {aiSuggestion && !loadingAI && (
                <div className="space-y-4">
                  {/* Descripción corta */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Descripción Corta</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={applyShortDescription}
                        className="h-6 text-xs gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Aplicar
                      </Button>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 p-2 rounded border">
                      <FormattedText text={aiSuggestion.shortDescription} />
                    </div>
                  </div>

                  {/* Descripción completa */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Descripción Completa</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={applyFullDescription}
                        className="h-6 text-xs gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Aplicar
                      </Button>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 p-2 rounded border max-h-48 overflow-y-auto">
                      <FormattedText text={aiSuggestion.fullDescription} />
                    </div>
                  </div>

                  {/* Características */}
                  {aiSuggestion.features && aiSuggestion.features.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Características destacadas</span>
                      <ul className="mt-1 text-sm space-y-1">
                        {aiSuggestion.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-500">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Botón aplicar ambas */}
                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyBothDescriptions}
                      className="gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Aplicar ambas descripciones
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="familiaId">Familia</Label>
            <SearchableSelect
              options={familiasOptions}
              value={formData.familiaId || ''}
              onValueChange={(value) => setFormData({ ...formData, familiaId: value })}
              placeholder="Selecciona una familia"
              searchPlaceholder="Buscar familia..."
              emptyMessage="No se encontraron familias"
              disabled={!isEditing}
              loading={loadingFamilias}
              allowClear
              onCreate={() => setShowCreateFamilia(true)}
              createLabel="Crear familia"
            />
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de Producto</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="variantes">Con Variantes</SelectItem>
                <SelectItem value="compuesto">Compuesto/Kit</SelectItem>
                <SelectItem value="servicio">Servicio</SelectItem>
                <SelectItem value="materia_prima">Materia Prima</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Códigos alternativos */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <Label>Códigos Alternativos</Label>
            {isEditing && (
              <Button type="button" size="sm" variant="outline" onClick={addCodigoAlternativo}>
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </Button>
            )}
          </div>
          {formData.codigosAlternativos && formData.codigosAlternativos.length > 0 ? (
            <div className="space-y-2">
              {formData.codigosAlternativos.map((codigo: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={codigo}
                    onChange={(e) => updateCodigoAlternativo(index, e.target.value)}
                    disabled={!isEditing}
                    placeholder="Código alternativo"
                  />
                  {isEditing && (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => removeCodigoAlternativo(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay códigos alternativos</p>
          )}
        </div>
      </Card>

      {/* Estado */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Estado del Producto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) => setFormData({ ...formData, activo: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="activo" className="cursor-pointer">
              Producto activo
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="disponible"
              checked={formData.disponible}
              onCheckedChange={(checked) => setFormData({ ...formData, disponible: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="disponible" className="cursor-pointer">
              Disponible para venta
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="destacado"
              checked={formData.destacado}
              onCheckedChange={(checked) => setFormData({ ...formData, destacado: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="destacado" className="cursor-pointer">
              Producto destacado
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="nuevo"
              checked={formData.nuevo}
              onCheckedChange={(checked) => setFormData({ ...formData, nuevo: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="nuevo" className="cursor-pointer">
              Producto nuevo
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="oferta"
              checked={formData.oferta}
              onCheckedChange={(checked) => setFormData({ ...formData, oferta: !!checked })}
              disabled={!isEditing}
            />
            <Label htmlFor="oferta" className="cursor-pointer">
              En oferta
            </Label>
          </div>
        </div>
      </Card>

      {/* Modal de creación rápida de familia */}
      <QuickCreateFamilia
        open={showCreateFamilia}
        onOpenChange={setShowCreateFamilia}
        onCreated={handleFamiliaCreated}
      />
    </div>
  )
}
