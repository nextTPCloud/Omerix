'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { seriesDocumentosService } from '@/services/series-documentos.service'
import {
  ISerieDocumento,
  CreateSerieDocumentoDTO,
  UpdateSerieDocumentoDTO,
  TipoDocumentoSerie,
  TIPOS_DOCUMENTO_OPTIONS,
  getTipoDocumentoLabel,
} from '@/types/serie-documento.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Star,
  RefreshCw,
  FileText,
  Settings,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'

// ============================================
// VALORES POR DEFECTO PARA FORMULARIO
// ============================================
const defaultFormData: CreateSerieDocumentoDTO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipoDocumento: 'presupuesto',
  prefijo: '',
  sufijo: '',
  longitudNumero: 5,
  siguienteNumero: 1,
  incluirAnio: true,
  separadorAnio: '/',
  reiniciarAnualmente: true,
  activo: true,
  predeterminada: false,
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function SeriesDocumentosPage() {
  // Estados
  const [series, setSeries] = useState<ISerieDocumento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')
  const [activoFiltro, setActivoFiltro] = useState<string>('todos')

  // Estados del diálogo de edición/creación
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSerie, setEditingSerie] = useState<ISerieDocumento | null>(null)
  const [formData, setFormData] = useState<CreateSerieDocumentoDTO>(defaultFormData)
  const [isSaving, setIsSaving] = useState(false)

  // Diálogo de eliminación
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    serie: ISerieDocumento | null
  }>({
    open: false,
    serie: null,
  })

  // Diálogo de previsualización
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean
    serie: ISerieDocumento | null
  }>({
    open: false,
    serie: null,
  })

  // ============================================
  // CARGAR DATOS
  // ============================================

  const cargarSeries = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = {}

      if (searchTerm) params.q = searchTerm
      if (tipoFiltro !== 'todos') params.tipoDocumento = tipoFiltro
      if (activoFiltro !== 'todos') params.activo = activoFiltro

      const response = await seriesDocumentosService.getAll(params)

      if (response.success) {
        setSeries(response.data || [])
      }
    } catch (error) {
      console.error('Error al cargar series:', error)
      toast.error('Error al cargar series de documentos')
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, tipoFiltro, activoFiltro])

  useEffect(() => {
    cargarSeries()
  }, [cargarSeries])

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenCreate = () => {
    setEditingSerie(null)
    setFormData(defaultFormData)
    setDialogOpen(true)
  }

  const handleOpenEdit = (serie: ISerieDocumento) => {
    setEditingSerie(serie)
    setFormData({
      codigo: serie.codigo,
      nombre: serie.nombre,
      descripcion: serie.descripcion || '',
      tipoDocumento: serie.tipoDocumento,
      prefijo: serie.prefijo || '',
      sufijo: serie.sufijo || '',
      longitudNumero: serie.longitudNumero,
      siguienteNumero: serie.siguienteNumero,
      incluirAnio: serie.incluirAnio,
      separadorAnio: serie.separadorAnio,
      reiniciarAnualmente: serie.reiniciarAnualmente,
      activo: serie.activo,
      predeterminada: serie.predeterminada,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.codigo.trim()) {
      toast.error('El código es obligatorio')
      return
    }
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    try {
      setIsSaving(true)

      if (editingSerie) {
        const response = await seriesDocumentosService.update(editingSerie._id, formData)
        if (response.success) {
          toast.success('Serie actualizada correctamente')
          cargarSeries()
          setDialogOpen(false)
        }
      } else {
        const response = await seriesDocumentosService.create(formData)
        if (response.success) {
          toast.success('Serie creada correctamente')
          cargarSeries()
          setDialogOpen(false)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar serie')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.serie) return

    try {
      const response = await seriesDocumentosService.delete(deleteDialog.serie._id)
      if (response.success) {
        toast.success('Serie eliminada correctamente')
        cargarSeries()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar serie')
    } finally {
      setDeleteDialog({ open: false, serie: null })
    }
  }

  const handleSetPredeterminada = async (serie: ISerieDocumento) => {
    try {
      const response = await seriesDocumentosService.setPredeterminada(serie._id)
      if (response.success) {
        toast.success(`Serie "${serie.codigo}" establecida como predeterminada`)
        cargarSeries()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al establecer predeterminada')
    }
  }

  const handleDuplicar = async (serie: ISerieDocumento) => {
    try {
      const response = await seriesDocumentosService.duplicar(serie._id)
      if (response.success) {
        toast.success('Serie duplicada correctamente')
        cargarSeries()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al duplicar serie')
    }
  }

  const handleCrearPorDefecto = async () => {
    try {
      toast.loading('Creando series por defecto...')
      const response = await seriesDocumentosService.crearSeriesPorDefecto()
      toast.dismiss()
      if (response.success) {
        toast.success('Series por defecto creadas correctamente')
        cargarSeries()
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.error || 'Error al crear series por defecto')
    }
  }

  // ============================================
  // GENERAR PREVISUALIZACIÓN DEL CÓDIGO
  // ============================================

  const generarPrevisualizacion = () => {
    const anio = new Date().getFullYear()
    let codigo = ''

    if (formData.prefijo) {
      codigo += formData.prefijo
    }

    if (formData.incluirAnio) {
      codigo += anio.toString() + (formData.separadorAnio || '/')
    }

    codigo += (formData.siguienteNumero || 1)
      .toString()
      .padStart(formData.longitudNumero || 5, '0')

    if (formData.sufijo) {
      codigo += formData.sufijo
    }

    return codigo
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-7 w-7 text-primary" />
              Series de Documentos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configura las series de numeración para presupuestos, pedidos, albaranes y facturas
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleCrearPorDefecto}>
              <Settings className="h-4 w-4 mr-2" />
              Crear Por Defecto
            </Button>
            <Button variant="outline" size="sm" onClick={cargarSeries}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Serie
            </Button>
          </div>
        </div>

        {/* FILTROS */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TIPOS_DOCUMENTO_OPTIONS.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activoFiltro} onValueChange={setActivoFiltro}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="true">Activas</SelectItem>
                <SelectItem value="false">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* TABLA */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo Documento</TableHead>
                <TableHead>Previsualización</TableHead>
                <TableHead className="text-center">Activa</TableHead>
                <TableHead className="text-center">Predeterminada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Cargando series...
                  </TableCell>
                </TableRow>
              ) : series.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">No hay series configuradas</p>
                    <p className="text-sm mt-1">
                      Crea una nueva serie o usa el botón "Crear Por Defecto"
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                series.map((serie) => (
                  <TableRow key={serie._id}>
                    <TableCell className="font-mono font-bold">
                      {serie.codigo}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{serie.nombre}</p>
                        {serie.descripcion && (
                          <p className="text-xs text-muted-foreground">{serie.descripcion}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTipoDocumentoLabel(serie.tipoDocumento)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {serie.previsualizacion || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {serie.activo ? (
                        <Badge className="bg-green-100 text-green-800">Sí</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {serie.predeterminada && (
                        <Star className="h-4 w-4 text-yellow-500 mx-auto fill-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setPreviewDialog({ open: true, serie })}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEdit(serie)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicar(serie)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          {!serie.predeterminada && (
                            <DropdownMenuItem onClick={() => handleSetPredeterminada(serie)}>
                              <Star className="mr-2 h-4 w-4" />
                              Establecer predeterminada
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteDialog({ open: true, serie })}
                            disabled={serie.predeterminada}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* DIÁLOGO DE CREACIÓN/EDICIÓN */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSerie ? 'Editar Serie' : 'Nueva Serie de Documentos'}
              </DialogTitle>
              <DialogDescription>
                {editingSerie
                  ? 'Modifica los datos de la serie de documentos'
                  : 'Configura una nueva serie de numeración para documentos'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Fila 1: Código, Nombre, Tipo */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) =>
                      setFormData({ ...formData, codigo: e.target.value.toUpperCase() })
                    }
                    placeholder="A, B, FC..."
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Serie Principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                  <Select
                    value={formData.tipoDocumento}
                    onValueChange={(v) =>
                      setFormData({ ...formData, tipoDocumento: v as TipoDocumentoSerie })
                    }
                    disabled={!!editingSerie}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOCUMENTO_OPTIONS.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fila 2: Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción opcional..."
                />
              </div>

              {/* Fila 3: Formato del código */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefijo">Prefijo</Label>
                  <Input
                    id="prefijo"
                    value={formData.prefijo}
                    onChange={(e) =>
                      setFormData({ ...formData, prefijo: e.target.value.toUpperCase() })
                    }
                    placeholder="PRES, FAC..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sufijo">Sufijo</Label>
                  <Input
                    id="sufijo"
                    value={formData.sufijo}
                    onChange={(e) => setFormData({ ...formData, sufijo: e.target.value })}
                    placeholder="Opcional..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitudNumero">Longitud Número</Label>
                  <Input
                    id="longitudNumero"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.longitudNumero}
                    onChange={(e) =>
                      setFormData({ ...formData, longitudNumero: parseInt(e.target.value) || 5 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siguienteNumero">Siguiente Número</Label>
                  <Input
                    id="siguienteNumero"
                    type="number"
                    min={1}
                    value={formData.siguienteNumero}
                    onChange={(e) =>
                      setFormData({ ...formData, siguienteNumero: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>

              {/* Fila 4: Opciones de año */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="incluirAnio"
                    checked={formData.incluirAnio}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, incluirAnio: checked })
                    }
                  />
                  <Label htmlFor="incluirAnio">Incluir año</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="separadorAnio">Separador Año</Label>
                  <Input
                    id="separadorAnio"
                    value={formData.separadorAnio}
                    onChange={(e) => setFormData({ ...formData, separadorAnio: e.target.value })}
                    placeholder="/, -, etc."
                    maxLength={5}
                    disabled={!formData.incluirAnio}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="reiniciarAnualmente"
                    checked={formData.reiniciarAnualmente}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, reiniciarAnualmente: checked })
                    }
                  />
                  <Label htmlFor="reiniciarAnualmente">Reiniciar cada año</Label>
                </div>
              </div>

              {/* Fila 5: Estado y Predeterminada */}
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <Label htmlFor="activo">Serie activa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="predeterminada"
                    checked={formData.predeterminada}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, predeterminada: checked })
                    }
                  />
                  <Label htmlFor="predeterminada">Predeterminada</Label>
                </div>
              </div>

              {/* Previsualización */}
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Previsualización del código:</p>
                    <p className="text-2xl font-mono font-bold">{generarPrevisualizacion()}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Próximo número: {formData.siguienteNumero}
                  </Badge>
                </div>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingSerie ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Serie'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIÁLOGO DE ELIMINACIÓN */}
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, serie: null })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Serie</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar la serie "{deleteDialog.serie?.codigo}"?
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, serie: null })}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIÁLOGO DE DETALLES */}
        <Dialog
          open={previewDialog.open}
          onOpenChange={(open) => setPreviewDialog({ open, serie: null })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalles de Serie</DialogTitle>
            </DialogHeader>
            {previewDialog.serie && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Código</p>
                    <p className="font-bold font-mono">{previewDialog.serie.codigo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{previewDialog.serie.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo Documento</p>
                    <p>{getTipoDocumentoLabel(previewDialog.serie.tipoDocumento)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Próximo Número</p>
                    <p className="font-bold">{previewDialog.serie.siguienteNumero}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prefijo</p>
                    <p>{previewDialog.serie.prefijo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sufijo</p>
                    <p>{previewDialog.serie.sufijo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Incluir Año</p>
                    <p>{previewDialog.serie.incluirAnio ? 'Sí' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reiniciar Anualmente</p>
                    <p>{previewDialog.serie.reiniciarAnualmente ? 'Sí' : 'No'}</p>
                  </div>
                </div>
                <Card className="p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground">Previsualización:</p>
                  <p className="text-2xl font-mono font-bold">
                    {previewDialog.serie.previsualizacion}
                  </p>
                </Card>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPreviewDialog({ open: false, serie: null })}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
