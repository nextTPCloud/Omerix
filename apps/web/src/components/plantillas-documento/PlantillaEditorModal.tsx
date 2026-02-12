'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  PlantillaDocumento,
  UpdatePlantillaDTO,
  EstiloPlantilla,
  ESTILO_LABELS,
} from '@/types/plantilla-documento.types'
import { plantillasDocumentoService } from '@/services/plantillas-documento.service'
import { PlantillaPreview } from './PlantillaPreview'
import { toast } from 'sonner'
import {
  Loader2,
  Save,
  Palette,
  Type,
  LayoutTemplate,
  Users,
  List,
  Calculator,
  FileText,
  Settings,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
} from 'lucide-react'

interface PlantillaEditorModalProps {
  plantilla: PlantillaDocumento
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

// Componente para selección de color
function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded border cursor-pointer"
        style={{ backgroundColor: value }}
        onClick={() => document.getElementById(`color-${label}`)?.click()}
      />
      <input
        id={`color-${label}`}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <div className="flex-1">
        <Label className="text-xs">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs"
        />
      </div>
    </div>
  )
}

// Componente para toggle con label
function ToggleOption({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <Label className="text-sm">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function PlantillaEditorModal({ plantilla, open, onOpenChange, onSave }: PlantillaEditorModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [activeTab, setActiveTab] = useState('general')

  // Estado del formulario (copia profunda de la plantilla)
  const [formData, setFormData] = useState<UpdatePlantillaDTO>({})

  // Inicializar formData con los valores de la plantilla
  useEffect(() => {
    setFormData({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      codigo: plantilla.codigo,
      estilo: plantilla.estilo,
      colores: { ...plantilla.colores },
      fuentes: { ...plantilla.fuentes },
      cabecera: { ...plantilla.cabecera },
      cliente: { ...plantilla.cliente },
      lineas: { ...plantilla.lineas },
      totales: { ...plantilla.totales },
      pie: { ...plantilla.pie },
      textos: { ...plantilla.textos },
      margenes: { ...plantilla.margenes },
      papel: { ...plantilla.papel },
    })
  }, [plantilla])

  // Helper para actualizar campos anidados
  const updateField = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [field]: value,
      },
    }))
  }

  // Helper para actualizar campos de primer nivel
  const updateRootField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Obtener plantilla con los cambios aplicados para el preview
  const getPreviewPlantilla = (): PlantillaDocumento => ({
    ...plantilla,
    ...formData,
    colores: { ...plantilla.colores, ...formData.colores },
    fuentes: { ...plantilla.fuentes, ...formData.fuentes },
    cabecera: { ...plantilla.cabecera, ...formData.cabecera },
    cliente: { ...plantilla.cliente, ...formData.cliente },
    lineas: { ...plantilla.lineas, ...formData.lineas },
    totales: { ...plantilla.totales, ...formData.totales },
    pie: { ...plantilla.pie, ...formData.pie },
    textos: { ...plantilla.textos, ...formData.textos },
    margenes: { ...plantilla.margenes, ...formData.margenes },
    papel: { ...plantilla.papel, ...formData.papel },
  })

  // Guardar cambios
  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await plantillasDocumentoService.update(plantilla._id, formData)
      if (response.success) {
        toast.success('Plantilla actualizada correctamente')
        onSave()
      }
    } catch (error: any) {
      toast.error('Error al guardar la plantilla')
    } finally {
      setIsSaving(false)
    }
  }

  // Resetear a valores originales
  const handleReset = () => {
    setFormData({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      codigo: plantilla.codigo,
      estilo: plantilla.estilo,
      colores: { ...plantilla.colores },
      fuentes: { ...plantilla.fuentes },
      cabecera: { ...plantilla.cabecera },
      cliente: { ...plantilla.cliente },
      lineas: { ...plantilla.lineas },
      totales: { ...plantilla.totales },
      pie: { ...plantilla.pie },
      textos: { ...plantilla.textos },
      margenes: { ...plantilla.margenes },
      papel: { ...plantilla.papel },
    })
    toast.info('Valores restaurados')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personalizar Plantilla
              </DialogTitle>
              <DialogDescription>
                {plantilla.nombre} - {formData.codigo}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showPreview ? 'Ocultar' : 'Mostrar'} Vista Previa
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Panel de edición */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r flex flex-col`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-7 mx-4 mt-4" style={{ width: 'calc(100% - 32px)' }}>
                <TabsTrigger value="general" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  General
                </TabsTrigger>
                <TabsTrigger value="colores" className="text-xs">
                  <Palette className="h-3 w-3 mr-1" />
                  Colores
                </TabsTrigger>
                <TabsTrigger value="fuentes" className="text-xs">
                  <Type className="h-3 w-3 mr-1" />
                  Fuentes
                </TabsTrigger>
                <TabsTrigger value="cabecera" className="text-xs">
                  <LayoutTemplate className="h-3 w-3 mr-1" />
                  Cabecera
                </TabsTrigger>
                <TabsTrigger value="lineas" className="text-xs">
                  <List className="h-3 w-3 mr-1" />
                  Líneas
                </TabsTrigger>
                <TabsTrigger value="totales" className="text-xs">
                  <Calculator className="h-3 w-3 mr-1" />
                  Totales
                </TabsTrigger>
                <TabsTrigger value="pie" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Pie
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 p-4">
                {/* TAB GENERAL */}
                <TabsContent value="general" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Información Básica</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nombre</Label>
                          <Input
                            value={formData.nombre || ''}
                            onChange={(e) => updateRootField('nombre', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Código</Label>
                          <Input
                            value={formData.codigo || ''}
                            onChange={(e) => updateRootField('codigo', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Descripción</Label>
                        <Textarea
                          value={formData.descripcion || ''}
                          onChange={(e) => updateRootField('descripcion', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Estilo Base</Label>
                        <Select
                          value={formData.estilo}
                          onValueChange={(v) => updateRootField('estilo', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(EstiloPlantilla).map((estilo) => (
                              <SelectItem key={estilo} value={estilo}>
                                {ESTILO_LABELS[estilo]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Configuración de Papel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Formato</Label>
                          <Select
                            value={formData.papel?.formato || 'A4'}
                            onValueChange={(v) => updateField('papel', 'formato', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A4">A4</SelectItem>
                              <SelectItem value="Letter">Letter</SelectItem>
                              <SelectItem value="A5">A5</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Orientación</Label>
                          <Select
                            value={formData.papel?.orientacion || 'vertical'}
                            onValueChange={(v) => updateField('papel', 'orientacion', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vertical">Vertical</SelectItem>
                              <SelectItem value="horizontal">Horizontal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="mb-3 block">Márgenes (mm)</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Superior</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[formData.margenes?.superior || 20]}
                                min={5}
                                max={50}
                                step={1}
                                onValueChange={([v]) => updateField('margenes', 'superior', v)}
                                className="flex-1"
                              />
                              <span className="text-sm w-8">{formData.margenes?.superior || 20}</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Inferior</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[formData.margenes?.inferior || 20]}
                                min={5}
                                max={50}
                                step={1}
                                onValueChange={([v]) => updateField('margenes', 'inferior', v)}
                                className="flex-1"
                              />
                              <span className="text-sm w-8">{formData.margenes?.inferior || 20}</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Izquierdo</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[formData.margenes?.izquierdo || 15]}
                                min={5}
                                max={50}
                                step={1}
                                onValueChange={([v]) => updateField('margenes', 'izquierdo', v)}
                                className="flex-1"
                              />
                              <span className="text-sm w-8">{formData.margenes?.izquierdo || 15}</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Derecho</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[formData.margenes?.derecho || 15]}
                                min={5}
                                max={50}
                                step={1}
                                onValueChange={([v]) => updateField('margenes', 'derecho', v)}
                                className="flex-1"
                              />
                              <span className="text-sm w-8">{formData.margenes?.derecho || 15}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Textos Personalizados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Título del Documento</Label>
                        <Input
                          value={formData.textos?.tituloDocumento || ''}
                          onChange={(e) => updateField('textos', 'tituloDocumento', e.target.value)}
                          placeholder="FACTURA, PRESUPUESTO, etc."
                        />
                      </div>
                      <div>
                        <Label>Subtítulo</Label>
                        <Input
                          value={formData.textos?.subtituloDocumento || ''}
                          onChange={(e) => updateField('textos', 'subtituloDocumento', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Condiciones de Pago</Label>
                        <Textarea
                          value={formData.textos?.condicionesPago || ''}
                          onChange={(e) => updateField('textos', 'condicionesPago', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Textos Legales</Label>
                        <Textarea
                          value={formData.textos?.textosLegales || ''}
                          onChange={(e) => updateField('textos', 'textosLegales', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB COLORES */}
                <TabsContent value="colores" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Colores Principales</CardTitle>
                      <CardDescription>Define la paleta de colores del documento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Color Primario"
                          value={formData.colores?.primario || '#3b82f6'}
                          onChange={(v) => updateField('colores', 'primario', v)}
                        />
                        <ColorPicker
                          label="Color Secundario"
                          value={formData.colores?.secundario || '#64748b'}
                          onChange={(v) => updateField('colores', 'secundario', v)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Colores de Texto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Texto Principal"
                          value={formData.colores?.texto || '#1e293b'}
                          onChange={(v) => updateField('colores', 'texto', v)}
                        />
                        <ColorPicker
                          label="Texto Secundario"
                          value={formData.colores?.textoClaro || '#64748b'}
                          onChange={(v) => updateField('colores', 'textoClaro', v)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Colores de Fondo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Fondo Principal"
                          value={formData.colores?.fondo || '#ffffff'}
                          onChange={(v) => updateField('colores', 'fondo', v)}
                        />
                        <ColorPicker
                          label="Fondo Alterno (Zebra)"
                          value={formData.colores?.fondoAlterno || '#f8fafc'}
                          onChange={(v) => updateField('colores', 'fondoAlterno', v)}
                        />
                        <ColorPicker
                          label="Color de Bordes"
                          value={formData.colores?.borde || '#e2e8f0'}
                          onChange={(v) => updateField('colores', 'borde', v)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Colores de Estado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <ColorPicker
                          label="Éxito"
                          value={formData.colores?.exito || '#22c55e'}
                          onChange={(v) => updateField('colores', 'exito', v)}
                        />
                        <ColorPicker
                          label="Alerta"
                          value={formData.colores?.alerta || '#f59e0b'}
                          onChange={(v) => updateField('colores', 'alerta', v)}
                        />
                        <ColorPicker
                          label="Error"
                          value={formData.colores?.error || '#ef4444'}
                          onChange={(v) => updateField('colores', 'error', v)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB FUENTES */}
                <TabsContent value="fuentes" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Familia de Fuentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={formData.fuentes?.familia || 'Helvetica, Arial, sans-serif'}
                        onValueChange={(v) => updateField('fuentes', 'familia', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Helvetica, Arial, sans-serif">Helvetica (Sans-serif)</SelectItem>
                          <SelectItem value="Inter, Helvetica, Arial, sans-serif">Inter (Moderno)</SelectItem>
                          <SelectItem value="Georgia, Times New Roman, serif">Georgia (Serif)</SelectItem>
                          <SelectItem value="Roboto, Helvetica, Arial, sans-serif">Roboto (Corporativo)</SelectItem>
                          <SelectItem value="Poppins, Helvetica, Arial, sans-serif">Poppins (Moderno)</SelectItem>
                          <SelectItem value="Helvetica Neue, Helvetica, Arial, sans-serif">Helvetica Neue</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Tamaños de Fuente (pt)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Título ({formData.fuentes?.tamañoTitulo || 24}pt)</Label>
                        <Slider
                          value={[formData.fuentes?.tamañoTitulo || 24]}
                          min={16}
                          max={40}
                          step={1}
                          onValueChange={([v]) => updateField('fuentes', 'tamañoTitulo', v)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Subtítulo ({formData.fuentes?.tamañoSubtitulo || 12}pt)</Label>
                        <Slider
                          value={[formData.fuentes?.tamañoSubtitulo || 12]}
                          min={8}
                          max={20}
                          step={1}
                          onValueChange={([v]) => updateField('fuentes', 'tamañoSubtitulo', v)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Texto Normal ({formData.fuentes?.tamañoTexto || 10}pt)</Label>
                        <Slider
                          value={[formData.fuentes?.tamañoTexto || 10]}
                          min={7}
                          max={14}
                          step={1}
                          onValueChange={([v]) => updateField('fuentes', 'tamañoTexto', v)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Pie de Página ({formData.fuentes?.tamañoPie || 8}pt)</Label>
                        <Slider
                          value={[formData.fuentes?.tamañoPie || 8]}
                          min={6}
                          max={12}
                          step={1}
                          onValueChange={([v]) => updateField('fuentes', 'tamañoPie', v)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB CABECERA */}
                <TabsContent value="cabecera" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Logo de la Empresa</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ToggleOption
                        label="Mostrar Logo"
                        checked={formData.cabecera?.mostrarLogo ?? true}
                        onChange={(v) => updateField('cabecera', 'mostrarLogo', v)}
                      />

                      {formData.cabecera?.mostrarLogo && (
                        <>
                          <div>
                            <Label>Posición del Logo</Label>
                            <div className="flex gap-2 mt-2">
                              {(['izquierda', 'centro', 'derecha'] as const).map((pos) => (
                                <Button
                                  key={pos}
                                  variant={formData.cabecera?.posicionLogo === pos ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => updateField('cabecera', 'posicionLogo', pos)}
                                >
                                  {pos === 'izquierda' && <AlignLeft className="h-4 w-4 mr-1" />}
                                  {pos === 'centro' && <AlignCenter className="h-4 w-4 mr-1" />}
                                  {pos === 'derecha' && <AlignRight className="h-4 w-4 mr-1" />}
                                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">Ancho del Logo ({formData.cabecera?.anchoLogo || 150}px)</Label>
                            <Slider
                              value={[formData.cabecera?.anchoLogo || 150]}
                              min={80}
                              max={250}
                              step={10}
                              onValueChange={([v]) => updateField('cabecera', 'anchoLogo', v)}
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Datos de la Empresa</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <ToggleOption
                        label="Mostrar Datos de Empresa"
                        checked={formData.cabecera?.mostrarDatosEmpresa ?? true}
                        onChange={(v) => updateField('cabecera', 'mostrarDatosEmpresa', v)}
                      />
                      <Separator />
                      <ToggleOption
                        label="Mostrar NIF"
                        checked={formData.cabecera?.mostrarNIF ?? true}
                        onChange={(v) => updateField('cabecera', 'mostrarNIF', v)}
                      />
                      <ToggleOption
                        label="Mostrar Dirección"
                        checked={formData.cabecera?.mostrarDireccion ?? true}
                        onChange={(v) => updateField('cabecera', 'mostrarDireccion', v)}
                      />
                      <ToggleOption
                        label="Mostrar Teléfono/Email"
                        checked={formData.cabecera?.mostrarContacto ?? true}
                        onChange={(v) => updateField('cabecera', 'mostrarContacto', v)}
                      />
                      <ToggleOption
                        label="Mostrar Web"
                        checked={formData.cabecera?.mostrarWeb ?? false}
                        onChange={(v) => updateField('cabecera', 'mostrarWeb', v)}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Datos del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Posición</Label>
                        <div className="flex gap-2 mt-2">
                          {(['izquierda', 'derecha'] as const).map((pos) => (
                            <Button
                              key={pos}
                              variant={formData.cliente?.posicion === pos ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateField('cliente', 'posicion', pos)}
                            >
                              {pos === 'izquierda' && <AlignLeft className="h-4 w-4 mr-1" />}
                              {pos === 'derecha' && <AlignRight className="h-4 w-4 mr-1" />}
                              {pos.charAt(0).toUpperCase() + pos.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <ToggleOption
                        label="Mostrar Título 'Datos del Cliente'"
                        checked={formData.cliente?.mostrarTitulo ?? true}
                        onChange={(v) => updateField('cliente', 'mostrarTitulo', v)}
                      />
                      <ToggleOption
                        label="Mostrar Código de Cliente"
                        checked={formData.cliente?.mostrarCodigo ?? false}
                        onChange={(v) => updateField('cliente', 'mostrarCodigo', v)}
                      />
                      <ToggleOption
                        label="Mostrar NIF"
                        checked={formData.cliente?.mostrarNIF ?? true}
                        onChange={(v) => updateField('cliente', 'mostrarNIF', v)}
                      />
                      <ToggleOption
                        label="Mostrar Dirección"
                        checked={formData.cliente?.mostrarDireccion ?? true}
                        onChange={(v) => updateField('cliente', 'mostrarDireccion', v)}
                      />
                      <ToggleOption
                        label="Mostrar Contacto"
                        checked={formData.cliente?.mostrarContacto ?? true}
                        onChange={(v) => updateField('cliente', 'mostrarContacto', v)}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB LÍNEAS */}
                <TabsContent value="lineas" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Columnas de la Tabla</CardTitle>
                      <CardDescription>Selecciona qué columnas mostrar en las líneas del documento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <ToggleOption
                        label="Número de Línea"
                        description="#1, #2, #3..."
                        checked={formData.lineas?.mostrarNumeroLinea ?? false}
                        onChange={(v) => updateField('lineas', 'mostrarNumeroLinea', v)}
                      />
                      <ToggleOption
                        label="Referencia"
                        description="Código/SKU del producto"
                        checked={formData.lineas?.mostrarReferencia ?? true}
                        onChange={(v) => updateField('lineas', 'mostrarReferencia', v)}
                      />
                      <ToggleOption
                        label="Descripción"
                        description="Nombre del producto/servicio"
                        checked={formData.lineas?.mostrarDescripcion ?? true}
                        onChange={(v) => updateField('lineas', 'mostrarDescripcion', v)}
                      />
                      <ToggleOption
                        label="Cantidad"
                        checked={formData.lineas?.mostrarCantidad ?? true}
                        onChange={(v) => updateField('lineas', 'mostrarCantidad', v)}
                      />
                      <ToggleOption
                        label="Unidad"
                        description="ud, kg, m², etc."
                        checked={formData.lineas?.mostrarUnidad ?? true}
                        onChange={(v) => updateField('lineas', 'mostrarUnidad', v)}
                      />
                      <ToggleOption
                        label="Precio Unitario"
                        checked={formData.lineas?.mostrarPrecioUnitario ?? true}
                        onChange={(v) => updateField('lineas', 'mostrarPrecioUnitario', v)}
                      />
                      <ToggleOption
                        label="Descuento"
                        description="Descuento por línea"
                        checked={formData.lineas?.mostrarDescuento ?? true}
                        onChange={(v) => updateField('lineas', 'mostrarDescuento', v)}
                      />
                      <ToggleOption
                        label="% IVA"
                        checked={formData.lineas?.mostrarIVA ?? true}
                        onChange={(v) => updateField('lineas', 'mostrarIVA', v)}
                      />
                      <ToggleOption
                        label="Subtotal"
                        checked={formData.lineas?.mostrarSubtotal ?? true}
                        onChange={(v) => updateField('lineas', 'mostrarSubtotal', v)}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Estilo de la Tabla</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ToggleOption
                        label="Filas Zebra"
                        description="Alternar colores de fondo en las filas"
                        checked={formData.lineas?.filasZebra ?? true}
                        onChange={(v) => updateField('lineas', 'filasZebra', v)}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB TOTALES */}
                <TabsContent value="totales" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Posición de Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {(['izquierda', 'centrado', 'derecha'] as const).map((pos) => (
                          <Button
                            key={pos}
                            variant={formData.totales?.posicion === pos ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateField('totales', 'posicion', pos)}
                          >
                            {pos === 'izquierda' && <AlignLeft className="h-4 w-4 mr-1" />}
                            {pos === 'centrado' && <AlignCenter className="h-4 w-4 mr-1" />}
                            {pos === 'derecha' && <AlignRight className="h-4 w-4 mr-1" />}
                            {pos.charAt(0).toUpperCase() + pos.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Elementos a Mostrar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <ToggleOption
                        label="Subtotal"
                        checked={formData.totales?.mostrarSubtotal ?? true}
                        onChange={(v) => updateField('totales', 'mostrarSubtotal', v)}
                      />
                      <ToggleOption
                        label="Descuento Global"
                        checked={formData.totales?.mostrarDescuentoGlobal ?? true}
                        onChange={(v) => updateField('totales', 'mostrarDescuentoGlobal', v)}
                      />
                      <ToggleOption
                        label="Base Imponible"
                        checked={formData.totales?.mostrarBaseImponible ?? true}
                        onChange={(v) => updateField('totales', 'mostrarBaseImponible', v)}
                      />
                      <ToggleOption
                        label="Detalle de IVA"
                        description="Desglose por tipo de IVA"
                        checked={formData.totales?.mostrarDetalleIVA ?? true}
                        onChange={(v) => updateField('totales', 'mostrarDetalleIVA', v)}
                      />
                      <ToggleOption
                        label="Recargo de Equivalencia"
                        checked={formData.totales?.mostrarRecargoEquivalencia ?? false}
                        onChange={(v) => updateField('totales', 'mostrarRecargoEquivalencia', v)}
                      />
                      <ToggleOption
                        label="Retención IRPF"
                        checked={formData.totales?.mostrarRetencion ?? false}
                        onChange={(v) => updateField('totales', 'mostrarRetencion', v)}
                      />
                      <Separator />
                      <ToggleOption
                        label="Total"
                        checked={formData.totales?.mostrarTotal ?? true}
                        onChange={(v) => updateField('totales', 'mostrarTotal', v)}
                      />
                      <ToggleOption
                        label="Resaltar Total"
                        description="Destacar el total con color de fondo"
                        checked={formData.totales?.resaltarTotal ?? true}
                        onChange={(v) => updateField('totales', 'resaltarTotal', v)}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB PIE */}
                <TabsContent value="pie" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Información del Pie</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <ToggleOption
                        label="Condiciones de Pago"
                        checked={formData.pie?.mostrarCondiciones ?? true}
                        onChange={(v) => updateField('pie', 'mostrarCondiciones', v)}
                      />
                      <ToggleOption
                        label="Forma de Pago"
                        checked={formData.pie?.mostrarFormaPago ?? true}
                        onChange={(v) => updateField('pie', 'mostrarFormaPago', v)}
                      />
                      <ToggleOption
                        label="Vencimientos"
                        checked={formData.pie?.mostrarVencimientos ?? true}
                        onChange={(v) => updateField('pie', 'mostrarVencimientos', v)}
                      />
                      <ToggleOption
                        label="Datos Bancarios"
                        checked={formData.pie?.mostrarDatosBancarios ?? true}
                        onChange={(v) => updateField('pie', 'mostrarDatosBancarios', v)}
                      />
                      <ToggleOption
                        label="Espacio para Firma"
                        checked={formData.pie?.mostrarFirma ?? false}
                        onChange={(v) => updateField('pie', 'mostrarFirma', v)}
                      />
                      <ToggleOption
                        label="Número de Página"
                        description="Página X de Y"
                        checked={formData.pie?.mostrarPagina ?? true}
                        onChange={(v) => updateField('pie', 'mostrarPagina', v)}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Texto Legal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={formData.pie?.textoLegal || ''}
                        onChange={(e) => updateField('pie', 'textoLegal', e.target.value)}
                        placeholder="Inscrita en el Registro Mercantil de..."
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Panel de preview */}
          {showPreview && (
            <div className="w-1/2 bg-gray-100 overflow-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline">Vista Previa en Tiempo Real</Badge>
                </div>
                <PlantillaPreview plantilla={getPreviewPlantilla()} scale={0.55} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
