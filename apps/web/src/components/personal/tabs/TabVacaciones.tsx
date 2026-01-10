'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Sun,
  Clock,
  AlertCircle,
  Loader2,
  Check,
  X,
  Plane,
  Umbrella,
} from 'lucide-react'
import { Personal, Vacaciones, Ausencia, TIPOS_AUSENCIA } from '@/types/personal.types'
import { personalService } from '@/services/personal.service'
import { toast } from 'sonner'

interface TabVacacionesProps {
  empleado: Personal
  onUpdate?: (empleado: Personal) => void
}

// Formulario de vacaciones por año
interface VacacionesFormData {
  anio: number
  diasTotales: number
  diasDisfrutados: number
}

// Formulario de ausencia
interface AusenciaFormData {
  tipo: string
  fechaInicio: string
  fechaFin: string
  motivo: string
  aprobada: boolean
}

export function TabVacaciones({ empleado, onUpdate }: TabVacacionesProps) {
  // Estados para dialogo de vacaciones
  const [showVacacionesDialog, setShowVacacionesDialog] = useState(false)
  const [editingVacaciones, setEditingVacaciones] = useState<Vacaciones | null>(null)
  const [vacacionesForm, setVacacionesForm] = useState<VacacionesFormData>({
    anio: new Date().getFullYear(),
    diasTotales: 22,
    diasDisfrutados: 0,
  })
  const [savingVacaciones, setSavingVacaciones] = useState(false)

  // Estados para dialogo de ausencias
  const [showAusenciaDialog, setShowAusenciaDialog] = useState(false)
  const [editingAusencia, setEditingAusencia] = useState<Ausencia | null>(null)
  const [ausenciaForm, setAusenciaForm] = useState<AusenciaFormData>({
    tipo: '',
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    aprobada: false,
  })
  const [savingAusencia, setSavingAusencia] = useState(false)

  // Estados para eliminar
  const [deleteVacacionesDialog, setDeleteVacacionesDialog] = useState(false)
  const [vacacionesToDelete, setVacacionesToDelete] = useState<number | null>(null)
  const [deleteAusenciaDialog, setDeleteAusenciaDialog] = useState(false)
  const [ausenciaToDelete, setAusenciaToDelete] = useState<Ausencia | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Vacaciones ordenadas por año descendente
  const vacacionesOrdenadas = useMemo(() => {
    return [...(empleado.vacaciones || [])].sort((a, b) => b.anio - a.anio)
  }, [empleado.vacaciones])

  // Ausencias ordenadas por fecha descendente
  const ausenciasOrdenadas = useMemo(() => {
    return [...(empleado.ausencias || [])].sort((a, b) =>
      new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
    )
  }, [empleado.ausencias])

  // Resumen del año actual
  const resumenAnioActual = useMemo(() => {
    const anioActual = new Date().getFullYear()
    const vacAnio = empleado.vacaciones?.find(v => v.anio === anioActual)
    const ausenciasAnio = empleado.ausencias?.filter(a => {
      const fecha = new Date(a.fechaInicio)
      return fecha.getFullYear() === anioActual
    }) || []

    return {
      diasTotales: vacAnio?.diasTotales || 0,
      diasDisfrutados: vacAnio?.diasDisfrutados || 0,
      diasPendientes: vacAnio?.diasPendientes ?? (vacAnio?.diasTotales || 0) - (vacAnio?.diasDisfrutados || 0),
      totalAusencias: ausenciasAnio.length,
      ausenciasPendientes: ausenciasAnio.filter(a => !a.aprobada).length,
    }
  }, [empleado.vacaciones, empleado.ausencias])

  // ============================================
  // HANDLERS DE VACACIONES
  // ============================================

  const handleOpenVacacionesDialog = (vacaciones?: Vacaciones) => {
    if (vacaciones) {
      setEditingVacaciones(vacaciones)
      setVacacionesForm({
        anio: vacaciones.anio,
        diasTotales: vacaciones.diasTotales,
        diasDisfrutados: vacaciones.diasDisfrutados,
      })
    } else {
      setEditingVacaciones(null)
      setVacacionesForm({
        anio: new Date().getFullYear(),
        diasTotales: 22,
        diasDisfrutados: 0,
      })
    }
    setShowVacacionesDialog(true)
  }

  const handleSaveVacaciones = async () => {
    if (!vacacionesForm.anio) {
      toast.error('El año es obligatorio')
      return
    }

    setSavingVacaciones(true)
    try {
      const response = await personalService.actualizarVacaciones(empleado._id, {
        anio: vacacionesForm.anio,
        diasTotales: vacacionesForm.diasTotales,
        diasDisfrutados: vacacionesForm.diasDisfrutados,
      })

      if (response.success) {
        toast.success(editingVacaciones ? 'Vacaciones actualizadas' : 'Vacaciones asignadas')
        setShowVacacionesDialog(false)
        if (onUpdate && response.data) {
          onUpdate(response.data)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar vacaciones')
    } finally {
      setSavingVacaciones(false)
    }
  }

  // ============================================
  // HANDLERS DE AUSENCIAS
  // ============================================

  const handleOpenAusenciaDialog = (ausencia?: Ausencia) => {
    if (ausencia) {
      setEditingAusencia(ausencia)
      setAusenciaForm({
        tipo: ausencia.tipo,
        fechaInicio: ausencia.fechaInicio.split('T')[0],
        fechaFin: ausencia.fechaFin ? ausencia.fechaFin.split('T')[0] : '',
        motivo: ausencia.motivo || '',
        aprobada: ausencia.aprobada,
      })
    } else {
      setEditingAusencia(null)
      setAusenciaForm({
        tipo: '',
        fechaInicio: '',
        fechaFin: '',
        motivo: '',
        aprobada: false,
      })
    }
    setShowAusenciaDialog(true)
  }

  const handleSaveAusencia = async () => {
    if (!ausenciaForm.tipo) {
      toast.error('El tipo de ausencia es obligatorio')
      return
    }
    if (!ausenciaForm.fechaInicio) {
      toast.error('La fecha de inicio es obligatoria')
      return
    }

    setSavingAusencia(true)
    try {
      const ausenciaData = {
        tipo: ausenciaForm.tipo,
        fechaInicio: ausenciaForm.fechaInicio,
        fechaFin: ausenciaForm.fechaFin || undefined,
        motivo: ausenciaForm.motivo || undefined,
        aprobada: ausenciaForm.aprobada,
      }

      let response
      if (editingAusencia && editingAusencia._id) {
        // Actualizar ausencia existente
        response = await personalService.actualizarAusencia(empleado._id, editingAusencia._id, ausenciaData)
      } else {
        // Crear nueva ausencia
        response = await personalService.registrarAusencia(empleado._id, ausenciaData)
      }

      if (response.success) {
        toast.success(editingAusencia ? 'Ausencia actualizada' : 'Ausencia registrada')
        setShowAusenciaDialog(false)
        if (onUpdate && response.data) {
          onUpdate(response.data)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar ausencia')
    } finally {
      setSavingAusencia(false)
    }
  }

  // ============================================
  // HANDLERS DE ELIMINAR
  // ============================================

  const handleDeleteVacaciones = async () => {
    if (vacacionesToDelete === null) return

    setDeleting(true)
    try {
      const response = await personalService.eliminarVacaciones(empleado._id, vacacionesToDelete)

      if (response.success) {
        toast.success(`Vacaciones del año ${vacacionesToDelete} eliminadas`)
        setDeleteVacacionesDialog(false)
        setVacacionesToDelete(null)
        if (onUpdate && response.data) {
          onUpdate(response.data)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar vacaciones')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteAusencia = async () => {
    if (!ausenciaToDelete?._id) return

    setDeleting(true)
    try {
      const response = await personalService.eliminarAusencia(empleado._id, ausenciaToDelete._id)

      if (response.success) {
        toast.success('Ausencia eliminada correctamente')
        setDeleteAusenciaDialog(false)
        setAusenciaToDelete(null)
        if (onUpdate && response.data) {
          onUpdate(response.data)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar ausencia')
    } finally {
      setDeleting(false)
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  const getTipoAusenciaLabel = (tipo: string): string => {
    const found = TIPOS_AUSENCIA.find(t => t.value === tipo)
    return found?.label || tipo
  }

  const getIconoAusencia = (tipo: string) => {
    const iconos: Record<string, React.ReactNode> = {
      vacaciones: <Plane className="h-4 w-4 text-cyan-500" />,
      enfermedad: <AlertCircle className="h-4 w-4 text-red-500" />,
      accidente: <AlertCircle className="h-4 w-4 text-red-600" />,
      permiso: <Clock className="h-4 w-4 text-purple-500" />,
      maternidad: <Umbrella className="h-4 w-4 text-pink-500" />,
      paternidad: <Umbrella className="h-4 w-4 text-blue-500" />,
      asuntos_propios: <Calendar className="h-4 w-4 text-orange-500" />,
      formacion: <Calendar className="h-4 w-4 text-green-500" />,
      baja_medica: <AlertCircle className="h-4 w-4 text-red-700" />,
    }
    return iconos[tipo] || <Calendar className="h-4 w-4 text-gray-500" />
  }

  const calcularDiasAusencia = (fechaInicio: string, fechaFin?: string): number => {
    const inicio = new Date(fechaInicio)
    const fin = fechaFin ? new Date(fechaFin) : inicio
    return Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Resumen del año actual */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-blue-600">{resumenAnioActual.diasTotales}</p>
              <p className="text-xs text-muted-foreground">Días totales {new Date().getFullYear()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{resumenAnioActual.diasDisfrutados}</p>
              <p className="text-xs text-muted-foreground">Disfrutados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-orange-600">{resumenAnioActual.diasPendientes}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{resumenAnioActual.totalAusencias}</p>
              <p className="text-xs text-muted-foreground">Ausencias {new Date().getFullYear()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <X className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold text-amber-600">{resumenAnioActual.ausenciasPendientes}</p>
              <p className="text-xs text-muted-foreground">Pend. aprobar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla de Vacaciones por Año */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  Vacaciones por Año
                </CardTitle>
                <CardDescription>Días de vacaciones asignados por año</CardDescription>
              </div>
              <Button size="sm" onClick={() => handleOpenVacacionesDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Asignar Año
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {vacacionesOrdenadas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Año</TableHead>
                    <TableHead className="text-center">Totales</TableHead>
                    <TableHead className="text-center">Disfrutados</TableHead>
                    <TableHead className="text-center">Pendientes</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vacacionesOrdenadas.map((vac) => (
                    <TableRow key={vac._id || vac.anio}>
                      <TableCell className="font-medium">{vac.anio}</TableCell>
                      <TableCell className="text-center">{vac.diasTotales}</TableCell>
                      <TableCell className="text-center">{vac.diasDisfrutados}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={vac.diasPendientes && vac.diasPendientes > 0 ? 'default' : 'secondary'}>
                          {vac.diasPendientes ?? vac.diasTotales - vac.diasDisfrutados}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenVacacionesDialog(vac)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setVacacionesToDelete(vac.anio)
                                setDeleteVacacionesDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Sun className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">Sin vacaciones asignadas</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleOpenVacacionesDialog()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar vacaciones
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla de Ausencias */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Ausencias
                </CardTitle>
                <CardDescription>Registro de ausencias del empleado</CardDescription>
              </div>
              <Button size="sm" onClick={() => handleOpenAusenciaDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {ausenciasOrdenadas.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {ausenciasOrdenadas.map((ausencia, index) => (
                  <div
                    key={ausencia._id || index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      {getIconoAusencia(ausencia.tipo)}
                      <div>
                        <p className="font-medium">{getTipoAusenciaLabel(ausencia.tipo)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ausencia.fechaInicio).toLocaleDateString('es-ES')}
                          {ausencia.fechaFin && ` - ${new Date(ausencia.fechaFin).toLocaleDateString('es-ES')}`}
                          <span className="ml-2">
                            ({calcularDiasAusencia(ausencia.fechaInicio, ausencia.fechaFin)} días)
                          </span>
                        </p>
                        {ausencia.motivo && (
                          <p className="text-xs text-muted-foreground mt-1">{ausencia.motivo}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ausencia.aprobada ? 'default' : 'secondary'}>
                        {ausencia.aprobada ? 'Aprobada' : 'Pendiente'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenAusenciaDialog(ausencia)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setAusenciaToDelete(ausencia)
                              setDeleteAusenciaDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">Sin ausencias registradas</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleOpenAusenciaDialog()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar ausencia
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Vacaciones */}
      <Dialog open={showVacacionesDialog} onOpenChange={setShowVacacionesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-yellow-500" />
              {editingVacaciones ? 'Editar Vacaciones' : 'Asignar Vacaciones'}
            </DialogTitle>
            <DialogDescription>
              Configura los días de vacaciones para el año seleccionado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="anio">Año *</Label>
              <Select
                value={vacacionesForm.anio.toString()}
                onValueChange={(v) => setVacacionesForm({ ...vacacionesForm, anio: parseInt(v) })}
                disabled={!!editingVacaciones}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(anio => (
                    <SelectItem key={anio} value={anio.toString()}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diasTotales">Días Totales *</Label>
                <Input
                  id="diasTotales"
                  type="number"
                  min={0}
                  max={365}
                  value={vacacionesForm.diasTotales}
                  onChange={(e) => setVacacionesForm({ ...vacacionesForm, diasTotales: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasDisfrutados">Días Disfrutados</Label>
                <Input
                  id="diasDisfrutados"
                  type="number"
                  min={0}
                  max={vacacionesForm.diasTotales}
                  value={vacacionesForm.diasDisfrutados}
                  onChange={(e) => setVacacionesForm({ ...vacacionesForm, diasDisfrutados: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Días pendientes:</span>
                <Badge variant="outline" className="text-lg">
                  {vacacionesForm.diasTotales - vacacionesForm.diasDisfrutados}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVacacionesDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveVacaciones} disabled={savingVacaciones}>
              {savingVacaciones ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Ausencias */}
      <Dialog open={showAusenciaDialog} onOpenChange={setShowAusenciaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              {editingAusencia ? 'Editar Ausencia' : 'Registrar Ausencia'}
            </DialogTitle>
            <DialogDescription>
              Registra una ausencia del empleado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Ausencia *</Label>
              <Select
                value={ausenciaForm.tipo}
                onValueChange={(v) => setAusenciaForm({ ...ausenciaForm, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_AUSENCIA.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <div className="flex items-center gap-2">
                        {getIconoAusencia(tipo.value)}
                        {tipo.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha Inicio *</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={ausenciaForm.fechaInicio}
                  onChange={(e) => setAusenciaForm({ ...ausenciaForm, fechaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={ausenciaForm.fechaFin}
                  min={ausenciaForm.fechaInicio}
                  onChange={(e) => setAusenciaForm({ ...ausenciaForm, fechaFin: e.target.value })}
                />
              </div>
            </div>

            {ausenciaForm.fechaInicio && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Duración:</span>
                  <Badge variant="outline">
                    {calcularDiasAusencia(ausenciaForm.fechaInicio, ausenciaForm.fechaFin || ausenciaForm.fechaInicio)} días
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo / Observaciones</Label>
              <Textarea
                id="motivo"
                placeholder="Describe el motivo de la ausencia..."
                value={ausenciaForm.motivo}
                onChange={(e) => setAusenciaForm({ ...ausenciaForm, motivo: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="font-medium">Aprobada</Label>
                <p className="text-sm text-muted-foreground">Marcar como aprobada directamente</p>
              </div>
              <Switch
                checked={ausenciaForm.aprobada}
                onCheckedChange={(checked) => setAusenciaForm({ ...ausenciaForm, aprobada: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAusenciaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAusencia} disabled={savingAusencia}>
              {savingAusencia ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para eliminar vacaciones */}
      <AlertDialog open={deleteVacacionesDialog} onOpenChange={setDeleteVacacionesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar vacaciones del año {vacacionesToDelete}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán los días de vacaciones asignados para el año {vacacionesToDelete}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVacaciones}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para eliminar ausencia */}
      <AlertDialog open={deleteAusenciaDialog} onOpenChange={setDeleteAusenciaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta ausencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la ausencia de tipo "{ausenciaToDelete ? getTipoAusenciaLabel(ausenciaToDelete.tipo) : ''}"
              {ausenciaToDelete && ` del ${new Date(ausenciaToDelete.fechaInicio).toLocaleDateString('es-ES')}`}
              {ausenciaToDelete?.fechaFin && ` al ${new Date(ausenciaToDelete.fechaFin).toLocaleDateString('es-ES')}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAusencia}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
