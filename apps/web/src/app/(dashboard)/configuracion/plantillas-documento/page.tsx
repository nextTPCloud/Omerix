'use client'

import React, { useEffect, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { plantillasDocumentoService } from '@/services/plantillas-documento.service'
import {
  PlantillaDocumento,
  TipoDocumentoPlantilla,
  EstiloPlantilla,
  TIPO_DOCUMENTO_LABELS,
  ESTILO_LABELS,
  ESTILO_DESCRIPTIONS,
  ESTILO_ICONS,
} from '@/types/plantilla-documento.types'
import { toast } from 'sonner'
import {
  FileText,
  Receipt,
  FileBox,
  ShoppingCart,
  Truck,
  Wrench,
  Loader2,
  Star,
  StarOff,
  Copy,
  Trash2,
  Edit,
  MoreVertical,
  Check,
  Eye,
  Palette,
  RefreshCw,
  LayoutDashboard,
} from 'lucide-react'
import { PlantillaPreview } from '@/components/plantillas-documento/PlantillaPreview'
import { PlantillaEditorModal } from '@/components/plantillas-documento/PlantillaEditorModal'
import { VisualEditor } from '@/components/plantillas-documento/editor'

// Iconos por tipo de documento
const TIPO_DOCUMENTO_ICONS: Record<TipoDocumentoPlantilla, React.ReactNode> = {
  [TipoDocumentoPlantilla.FACTURA]: <Receipt className="h-5 w-5" />,
  [TipoDocumentoPlantilla.PRESUPUESTO]: <FileText className="h-5 w-5" />,
  [TipoDocumentoPlantilla.ALBARAN]: <Truck className="h-5 w-5" />,
  [TipoDocumentoPlantilla.PEDIDO]: <ShoppingCart className="h-5 w-5" />,
  [TipoDocumentoPlantilla.FACTURA_COMPRA]: <FileBox className="h-5 w-5" />,
  [TipoDocumentoPlantilla.PEDIDO_COMPRA]: <ShoppingCart className="h-5 w-5" />,
  [TipoDocumentoPlantilla.PARTE_TRABAJO]: <Wrench className="h-5 w-5" />,
}

// Colores por estilo para el borde de la card
const ESTILO_COLORS: Record<EstiloPlantilla, string> = {
  [EstiloPlantilla.MODERNO]: 'border-blue-500',
  [EstiloPlantilla.CLASICO]: 'border-amber-700',
  [EstiloPlantilla.MINIMALISTA]: 'border-gray-400',
  [EstiloPlantilla.CORPORATIVO]: 'border-indigo-800',
  [EstiloPlantilla.COLORIDO]: 'border-purple-500',
}

export default function PlantillasDocumentoPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [plantillas, setPlantillas] = useState<PlantillaDocumento[]>([])
  const [activeTab, setActiveTab] = useState<TipoDocumentoPlantilla>(TipoDocumentoPlantilla.FACTURA)

  // Estados para modales
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaDocumento | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [showVisualEditor, setShowVisualEditor] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [plantillaToDelete, setPlantillaToDelete] = useState<PlantillaDocumento | null>(null)

  // Estados de operaciones
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null)
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  // Cargar plantillas
  const cargarPlantillas = async () => {
    try {
      setIsLoading(true)
      const response = await plantillasDocumentoService.getAll({ limit: 100 })
      if (response.success) {
        setPlantillas(response.data)
      }
    } catch (error: any) {
      toast.error('Error al cargar las plantillas')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarPlantillas()
  }, [])

  // Filtrar plantillas por tipo de documento
  const plantillasFiltradas = plantillas.filter(p => p.tipoDocumento === activeTab)

  // Establecer como predeterminada
  const handleSetDefault = async (plantilla: PlantillaDocumento) => {
    if (plantilla.esPredeterminada) return

    try {
      setIsSettingDefault(plantilla._id)
      const response = await plantillasDocumentoService.establecerPredeterminada(plantilla._id)
      if (response.success) {
        toast.success(`"${plantilla.nombre}" es ahora la plantilla predeterminada`)
        cargarPlantillas()
      }
    } catch (error: any) {
      toast.error('Error al establecer plantilla predeterminada')
    } finally {
      setIsSettingDefault(null)
    }
  }

  // Duplicar plantilla
  const handleDuplicate = async (plantilla: PlantillaDocumento) => {
    try {
      setIsDuplicating(plantilla._id)
      const response = await plantillasDocumentoService.duplicar(plantilla._id)
      if (response.success) {
        toast.success('Plantilla duplicada correctamente')
        cargarPlantillas()
      }
    } catch (error: any) {
      toast.error('Error al duplicar la plantilla')
    } finally {
      setIsDuplicating(null)
    }
  }

  // Confirmar eliminación
  const handleDeleteConfirm = (plantilla: PlantillaDocumento) => {
    if (plantilla.esPlantillaSistema) {
      toast.error('No se puede eliminar una plantilla del sistema')
      return
    }
    setPlantillaToDelete(plantilla)
    setShowDeleteConfirm(true)
  }

  // Eliminar plantilla
  const handleDelete = async () => {
    if (!plantillaToDelete) return

    try {
      setIsDeleting(true)
      const response = await plantillasDocumentoService.delete(plantillaToDelete._id)
      if (response.success) {
        toast.success('Plantilla eliminada correctamente')
        cargarPlantillas()
      }
    } catch (error: any) {
      toast.error('Error al eliminar la plantilla')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setPlantillaToDelete(null)
    }
  }

  // Ver preview
  const handlePreview = (plantilla: PlantillaDocumento) => {
    setSelectedPlantilla(plantilla)
    setShowPreview(true)
  }

  // Editar plantilla (editor simple)
  const handleEdit = (plantilla: PlantillaDocumento) => {
    setSelectedPlantilla(plantilla)
    setShowEditor(true)
  }

  // Editar plantilla (editor visual avanzado)
  const handleVisualEdit = (plantilla: PlantillaDocumento) => {
    setSelectedPlantilla(plantilla)
    setShowVisualEditor(true)
  }

  // Callback después de guardar edición
  const handleEditorSave = () => {
    setShowEditor(false)
    setSelectedPlantilla(null)
    cargarPlantillas()
  }

  // Callback después de guardar edición visual
  const handleVisualEditorSave = () => {
    setShowVisualEditor(false)
    setSelectedPlantilla(null)
    cargarPlantillas()
  }

  // Inicializar plantillas predefinidas
  const handleInitialize = async () => {
    try {
      setIsInitializing(true)
      const response = await plantillasDocumentoService.inicializar()
      if (response.success) {
        toast.success(response.message)
        cargarPlantillas()
      }
    } catch (error: any) {
      toast.error('Error al inicializar plantillas')
    } finally {
      setIsInitializing(false)
    }
  }

  // Tipos de documento para las tabs
  const tiposDocumento = [
    TipoDocumentoPlantilla.FACTURA,
    TipoDocumentoPlantilla.PRESUPUESTO,
    TipoDocumentoPlantilla.ALBARAN,
    TipoDocumentoPlantilla.PEDIDO,
    TipoDocumentoPlantilla.PARTE_TRABAJO,
  ]

  return (
      <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palette className="h-6 w-6" />
              Plantillas de Documentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Personaliza el diseño de tus facturas, presupuestos, albaranes y otros documentos
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleInitialize}
              disabled={isInitializing}
            >
              {isInitializing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Reinicializar
            </Button>
          </div>
        </div>

        {/* Tabs por tipo de documento */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TipoDocumentoPlantilla)}>
          <TabsList className="grid w-full grid-cols-5">
            {tiposDocumento.map((tipo) => (
              <TabsTrigger key={tipo} value={tipo} className="flex items-center gap-2">
                {TIPO_DOCUMENTO_ICONS[tipo]}
                <span className="hidden sm:inline">{TIPO_DOCUMENTO_LABELS[tipo]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tiposDocumento.map((tipo) => (
            <TabsContent key={tipo} value={tipo} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : plantillasFiltradas.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No hay plantillas para este tipo de documento</p>
                    <Button onClick={handleInitialize} disabled={isInitializing}>
                      {isInitializing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Inicializar Plantillas
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {plantillasFiltradas.map((plantilla) => (
                    <Card
                      key={plantilla._id}
                      className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer group border-t-4 ${ESTILO_COLORS[plantilla.estilo]}`}
                      onClick={() => handlePreview(plantilla)}
                    >
                      {/* Badge de predeterminada */}
                      {plantilla.esPredeterminada && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Predeterminada
                          </Badge>
                        </div>
                      )}

                      {/* Preview miniatura */}
                      <div
                        className="h-32 flex items-center justify-center"
                        style={{ backgroundColor: plantilla.colores?.fondoAlterno || '#f8fafc' }}
                      >
                        <div
                          className="text-4xl"
                          style={{ color: plantilla.colores?.primario || '#3b82f6' }}
                        >
                          {ESTILO_ICONS[plantilla.estilo]}
                        </div>
                      </div>

                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{plantilla.nombre}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {ESTILO_DESCRIPTIONS[plantilla.estilo]}
                            </CardDescription>
                          </div>

                          {/* Menú de acciones */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePreview(plantilla); }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver vista previa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(plantilla); }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editor rápido
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleVisualEdit(plantilla); }}>
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                Editor visual
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleSetDefault(plantilla); }}
                                disabled={plantilla.esPredeterminada || isSettingDefault === plantilla._id}
                              >
                                {isSettingDefault === plantilla._id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : plantilla.esPredeterminada ? (
                                  <Star className="h-4 w-4 mr-2 fill-yellow-500 text-yellow-500" />
                                ) : (
                                  <StarOff className="h-4 w-4 mr-2" />
                                )}
                                {plantilla.esPredeterminada ? 'Es predeterminada' : 'Establecer como predeterminada'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleDuplicate(plantilla); }}
                                disabled={isDuplicating === plantilla._id}
                              >
                                {isDuplicating === plantilla._id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-2" />
                                )}
                                Duplicar
                              </DropdownMenuItem>
                              {!plantilla.esPlantillaSistema && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(plantilla); }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {ESTILO_LABELS[plantilla.estilo]}
                          </Badge>
                          {plantilla.esPlantillaSistema && (
                            <Badge variant="secondary" className="text-xs">
                              Sistema
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Modal de Vista Previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPlantilla && TIPO_DOCUMENTO_ICONS[selectedPlantilla.tipoDocumento]}
              {selectedPlantilla?.nombre}
            </DialogTitle>
            <DialogDescription>
              Vista previa del documento con esta plantilla
            </DialogDescription>
          </DialogHeader>

          {selectedPlantilla && (
            <PlantillaPreview plantilla={selectedPlantilla} />
          )}

          <DialogFooter className="gap-2">
            {selectedPlantilla && !selectedPlantilla.esPredeterminada && (
              <Button
                variant="outline"
                onClick={() => {
                  handleSetDefault(selectedPlantilla)
                  setShowPreview(false)
                }}
                disabled={isSettingDefault === selectedPlantilla._id}
              >
                {isSettingDefault === selectedPlantilla._id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Star className="h-4 w-4 mr-2" />
                )}
                Usar como predeterminada
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setShowPreview(false)
                if (selectedPlantilla) handleEdit(selectedPlantilla)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editor rápido
            </Button>
            <Button
              onClick={() => {
                setShowPreview(false)
                if (selectedPlantilla) handleVisualEdit(selectedPlantilla)
              }}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Editor visual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición Rápida */}
      {showEditor && selectedPlantilla && (
        <PlantillaEditorModal
          plantilla={selectedPlantilla}
          open={showEditor}
          onOpenChange={setShowEditor}
          onSave={handleEditorSave}
        />
      )}

      {/* Editor Visual Avanzado */}
      {showVisualEditor && selectedPlantilla && (
        <VisualEditor
          plantilla={selectedPlantilla}
          open={showVisualEditor}
          onOpenChange={setShowVisualEditor}
          onSave={handleVisualEditorSave}
        />
      )}

      {/* Confirmación de eliminación */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la plantilla
              {plantillaToDelete && <strong> "{plantillaToDelete.nombre}"</strong>}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
  )
}
