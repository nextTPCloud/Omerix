'use client'

import { useState, useEffect, useCallback } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  salonesService,
  mesasService,
  Salon,
  Mesa,
  CreateSalonDTO,
  UpdateSalonDTO,
  EstadisticasSalon,
} from '@/services/salones.service'
import { toast } from 'sonner'
import {
  Plus,
  Loader2,
  LayoutGrid,
  Pencil,
  Trash2,
  Eye,
  Copy,
  Sun,
  Moon,
  Thermometer,
  Music,
  Tv,
  Accessibility,
  Cigarette,
  Calendar,
  Settings,
  MapPin,
} from 'lucide-react'
import { useLicense } from '@/hooks/useLicense'
import { EditorMesas } from '@/components/restauracion/EditorMesas'

export default function SalonesPage() {
  const { checkModuleAccess } = useLicense()

  const [isLoading, setIsLoading] = useState(true)
  const [salones, setSalones] = useState<Salon[]>([])
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null)
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasSalon | null>(null)

  // Dialogos
  const [showSalonDialog, setShowSalonDialog] = useState(false)
  const [salonEditando, setSalonEditando] = useState<Salon | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [salonAEliminar, setSalonAEliminar] = useState<Salon | null>(null)

  // Formulario de salon
  const [formSalon, setFormSalon] = useState<CreateSalonDTO>({
    nombre: '',
    codigo: '',
    descripcion: '',
    color: '#3b82f6',
    capacidadTotal: undefined,
    plano: { ancho: 20, alto: 15, escala: 1 },
    configuracion: {
      permiteFumar: false,
      tieneClimatizacion: false,
      esExterior: false,
      tieneMusica: false,
      tieneTV: false,
      accesibleMinusvalidos: true,
      requiereReserva: false,
      suplemento: 0,
    },
    activo: true,
  })

  // Cargar salones
  const loadSalones = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await salonesService.getAll({ activo: undefined, limit: 100 })
      setSalones(response.data)

      // Si hay salones y ninguno seleccionado, seleccionar el primero
      if (response.data.length > 0 && !selectedSalon) {
        setSelectedSalon(response.data[0])
      }
    } catch (error: any) {
      toast.error('Error al cargar salones: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSalon])

  // Cargar mesas del salon seleccionado
  const loadMesas = useCallback(async () => {
    if (!selectedSalon) {
      setMesas([])
      setEstadisticas(null)
      return
    }

    try {
      const [mesasRes, statsRes] = await Promise.all([
        salonesService.getMesasBySalon(selectedSalon._id),
        salonesService.getEstadisticas(selectedSalon._id),
      ])
      setMesas(mesasRes.data)
      setEstadisticas(statsRes.data)
    } catch (error: any) {
      toast.error('Error al cargar mesas: ' + error.message)
    }
  }, [selectedSalon])

  useEffect(() => {
    loadSalones()
  }, [loadSalones])

  useEffect(() => {
    loadMesas()
  }, [loadMesas])

  // Abrir dialogo para nuevo salon
  const handleNuevoSalon = () => {
    setSalonEditando(null)
    setFormSalon({
      nombre: '',
      codigo: '',
      descripcion: '',
      color: '#3b82f6',
      capacidadTotal: undefined,
      plano: { ancho: 20, alto: 15, escala: 1 },
      configuracion: {
        permiteFumar: false,
        tieneClimatizacion: false,
        esExterior: false,
        tieneMusica: false,
        tieneTV: false,
        accesibleMinusvalidos: true,
        requiereReserva: false,
        suplemento: 0,
      },
      activo: true,
    })
    setShowSalonDialog(true)
  }

  // Abrir dialogo para editar salon
  const handleEditarSalon = (salon: Salon) => {
    setSalonEditando(salon)
    setFormSalon({
      nombre: salon.nombre,
      codigo: salon.codigo || '',
      descripcion: salon.descripcion || '',
      color: salon.color || '#3b82f6',
      capacidadTotal: salon.capacidadTotal,
      plano: salon.plano || { ancho: 20, alto: 15, escala: 1 },
      configuracion: salon.configuracion || {
        permiteFumar: false,
        tieneClimatizacion: false,
        esExterior: false,
        tieneMusica: false,
        tieneTV: false,
        accesibleMinusvalidos: true,
        requiereReserva: false,
        suplemento: 0,
      },
      activo: salon.activo,
    })
    setShowSalonDialog(true)
  }

  // Guardar salon
  const handleGuardarSalon = async () => {
    if (!formSalon.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    try {
      setIsSaving(true)

      if (salonEditando) {
        await salonesService.update(salonEditando._id, formSalon)
        toast.success('Salon actualizado correctamente')
      } else {
        await salonesService.create(formSalon)
        toast.success('Salon creado correctamente')
      }

      setShowSalonDialog(false)
      await loadSalones()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Eliminar salon
  const handleEliminarSalon = async () => {
    if (!salonAEliminar) return

    try {
      await salonesService.delete(salonAEliminar._id)
      toast.success('Salon eliminado correctamente')
      setShowDeleteDialog(false)
      setSalonAEliminar(null)
      if (selectedSalon?._id === salonAEliminar._id) {
        setSelectedSalon(null)
      }
      await loadSalones()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  // Duplicar salon
  const handleDuplicarSalon = async (salon: Salon) => {
    try {
      const nuevoSalon: CreateSalonDTO = {
        nombre: `${salon.nombre} (copia)`,
        codigo: salon.codigo ? `${salon.codigo}-2` : undefined,
        descripcion: salon.descripcion,
        color: salon.color,
        capacidadTotal: salon.capacidadTotal,
        plano: salon.plano,
        configuracion: salon.configuracion,
        activo: true,
      }
      await salonesService.create(nuevoSalon)
      toast.success('Salon duplicado correctamente')
      await loadSalones()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  // Actualizar mesas desde el editor
  const handleMesasUpdated = () => {
    loadMesas()
  }

  // Verificar acceso al modulo
  if (!checkModuleAccess('restauracion')) {
    return (
      
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Modulo no disponible</CardTitle>
              <CardDescription>
                El modulo de restauracion no esta incluido en tu plan actual.
                Actualiza tu plan para acceder a esta funcionalidad.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      
    )
  }

  return (
    
      <div className="flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LayoutGrid className="h-6 w-6" />
              Gestion de Salones
            </h1>
            <p className="text-muted-foreground">
              Configura los salones y el diseño de las mesas de tu establecimiento
            </p>
          </div>
          <Button onClick={handleNuevoSalon}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Salon
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : salones.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No hay salones configurados</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer salon para empezar a diseñar la distribucion de mesas
              </p>
              <Button onClick={handleNuevoSalon}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer salon
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Lista de salones */}
            <div className="col-span-12 lg:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Salones ({salones.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {salones.map((salon) => (
                      <div
                        key={salon._id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedSalon?._id === salon._id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedSalon(salon)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: salon.color }}
                            />
                            <div>
                              <div className="font-medium">{salon.nombre}</div>
                              {salon.codigo && (
                                <div className="text-xs text-muted-foreground">{salon.codigo}</div>
                              )}
                            </div>
                          </div>
                          <Badge variant={salon.activo ? 'default' : 'secondary'}>
                            {salon.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>

                        {/* Iconos de caracteristicas */}
                        <div className="flex gap-2 mt-2 text-muted-foreground">
                          {salon.configuracion?.esExterior && <Sun className="h-4 w-4" title="Exterior" />}
                          {salon.configuracion?.tieneClimatizacion && <Thermometer className="h-4 w-4" title="Climatizado" />}
                          {salon.configuracion?.tieneMusica && <Music className="h-4 w-4" title="Musica" />}
                          {salon.configuracion?.tieneTV && <Tv className="h-4 w-4" title="TV" />}
                          {salon.configuracion?.accesibleMinusvalidos && <Accessibility className="h-4 w-4" title="Accesible" />}
                          {salon.configuracion?.permiteFumar && <Cigarette className="h-4 w-4" title="Fumadores" />}
                          {salon.configuracion?.requiereReserva && <Calendar className="h-4 w-4" title="Requiere reserva" />}
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-1 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditarSalon(salon)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicarSalon(salon)
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSalonAEliminar(salon)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Editor de mesas */}
            <div className="col-span-12 lg:col-span-8">
              {selectedSalon ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          {selectedSalon.nombre}
                        </CardTitle>
                        <CardDescription>
                          {estadisticas && (
                            <span>
                              {estadisticas.totalMesas} mesas - {estadisticas.mesasLibres} libres - {estadisticas.mesasOcupadas} ocupadas
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Button variant="outline" onClick={() => handleEditarSalon(selectedSalon)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <EditorMesas
                      salon={selectedSalon}
                      mesas={mesas}
                      onMesasUpdated={handleMesasUpdated}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      Selecciona un salon para ver y editar sus mesas
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Dialogo de edicion de salon */}
        <Dialog open={showSalonDialog} onOpenChange={setShowSalonDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {salonEditando ? 'Editar Salon' : 'Nuevo Salon'}
              </DialogTitle>
              <DialogDescription>
                Configura los datos del salon
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="plano">Plano</TabsTrigger>
                <TabsTrigger value="caracteristicas">Caracteristicas</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={formSalon.nombre}
                      onChange={(e) => setFormSalon({ ...formSalon, nombre: e.target.value })}
                      placeholder="Ej: Terraza"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Codigo</Label>
                    <Input
                      value={formSalon.codigo}
                      onChange={(e) => setFormSalon({ ...formSalon, codigo: e.target.value.toUpperCase() })}
                      placeholder="Ej: TRZ"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripcion</Label>
                  <Textarea
                    value={formSalon.descripcion}
                    onChange={(e) => setFormSalon({ ...formSalon, descripcion: e.target.value })}
                    placeholder="Descripcion del salon..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formSalon.color}
                        onChange={(e) => setFormSalon({ ...formSalon, color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formSalon.color}
                        onChange={(e) => setFormSalon({ ...formSalon, color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Capacidad total (personas)</Label>
                    <Input
                      type="number"
                      value={formSalon.capacidadTotal || ''}
                      onChange={(e) => setFormSalon({ ...formSalon, capacidadTotal: parseInt(e.target.value) || undefined })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Salon activo</Label>
                  <Switch
                    checked={formSalon.activo}
                    onCheckedChange={(checked) => setFormSalon({ ...formSalon, activo: checked })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="plano" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Define las dimensiones del plano donde colocaras las mesas
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Ancho (unidades)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={50}
                      value={formSalon.plano?.ancho || 20}
                      onChange={(e) => setFormSalon({
                        ...formSalon,
                        plano: { ...formSalon.plano, ancho: parseInt(e.target.value) || 20, alto: formSalon.plano?.alto || 15, escala: formSalon.plano?.escala || 1 }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alto (unidades)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={50}
                      value={formSalon.plano?.alto || 15}
                      onChange={(e) => setFormSalon({
                        ...formSalon,
                        plano: { ...formSalon.plano, alto: parseInt(e.target.value) || 15, ancho: formSalon.plano?.ancho || 20, escala: formSalon.plano?.escala || 1 }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Escala</Label>
                    <Input
                      type="number"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={formSalon.plano?.escala || 1}
                      onChange={(e) => setFormSalon({
                        ...formSalon,
                        plano: { ...formSalon.plano, escala: parseFloat(e.target.value) || 1, ancho: formSalon.plano?.ancho || 20, alto: formSalon.plano?.alto || 15 }
                      })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="caracteristicas" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>Exterior / Terraza</span>
                    </div>
                    <Switch
                      checked={formSalon.configuracion?.esExterior}
                      onCheckedChange={(checked) => setFormSalon({
                        ...formSalon,
                        configuracion: { ...formSalon.configuracion!, esExterior: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      <span>Climatizacion</span>
                    </div>
                    <Switch
                      checked={formSalon.configuracion?.tieneClimatizacion}
                      onCheckedChange={(checked) => setFormSalon({
                        ...formSalon,
                        configuracion: { ...formSalon.configuracion!, tieneClimatizacion: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      <span>Musica</span>
                    </div>
                    <Switch
                      checked={formSalon.configuracion?.tieneMusica}
                      onCheckedChange={(checked) => setFormSalon({
                        ...formSalon,
                        configuracion: { ...formSalon.configuracion!, tieneMusica: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tv className="h-4 w-4" />
                      <span>Television</span>
                    </div>
                    <Switch
                      checked={formSalon.configuracion?.tieneTV}
                      onCheckedChange={(checked) => setFormSalon({
                        ...formSalon,
                        configuracion: { ...formSalon.configuracion!, tieneTV: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Accessibility className="h-4 w-4" />
                      <span>Accesible</span>
                    </div>
                    <Switch
                      checked={formSalon.configuracion?.accesibleMinusvalidos}
                      onCheckedChange={(checked) => setFormSalon({
                        ...formSalon,
                        configuracion: { ...formSalon.configuracion!, accesibleMinusvalidos: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Cigarette className="h-4 w-4" />
                      <span>Zona fumadores</span>
                    </div>
                    <Switch
                      checked={formSalon.configuracion?.permiteFumar}
                      onCheckedChange={(checked) => setFormSalon({
                        ...formSalon,
                        configuracion: { ...formSalon.configuracion!, permiteFumar: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Requiere reserva</span>
                    </div>
                    <Switch
                      checked={formSalon.configuracion?.requiereReserva}
                      onCheckedChange={(checked) => setFormSalon({
                        ...formSalon,
                        configuracion: { ...formSalon.configuracion!, requiereReserva: checked }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Suplemento por salon (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formSalon.configuracion?.suplemento || 0}
                    onChange={(e) => setFormSalon({
                      ...formSalon,
                      configuracion: { ...formSalon.configuracion!, suplemento: parseFloat(e.target.value) || 0 }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recargo adicional aplicado a los pedidos de este salon
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSalonDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGuardarSalon} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {salonEditando ? 'Guardar cambios' : 'Crear salon'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogo de confirmacion de eliminacion */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar salon</AlertDialogTitle>
              <AlertDialogDescription>
                Estas seguro de que quieres eliminar el salon "{salonAEliminar?.nombre}"?
                Esta accion no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleEliminarSalon} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    
  )
}
