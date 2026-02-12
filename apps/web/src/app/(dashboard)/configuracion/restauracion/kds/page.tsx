'use client'

import { useState, useEffect } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { zonasPreparacionService, ZonaPreparacion, CreateZonaPreparacionDTO } from '@/services/zonas-preparacion.service'
import { toast } from 'sonner'
import {
  Monitor,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
  Volume2,
  Clock,
  Columns,
  Settings,
  ChefHat,
  Printer,
} from 'lucide-react'
import { useLicense } from '@/hooks/useLicense'

export default function ConfiguracionKDSPage() {
  const { checkModuleAccess } = useLicense()

  const [isLoading, setIsLoading] = useState(true)
  const [zonas, setZonas] = useState<ZonaPreparacion[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [zonaEditando, setZonaEditando] = useState<ZonaPreparacion | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Formulario
  const [formZona, setFormZona] = useState<CreateZonaPreparacionDTO>({
    nombre: '',
    codigo: '',
    descripcion: '',
    color: '#3b82f6',
    tiempoPreparacionPromedio: 15,
    notificarRetraso: true,
    tiempoAlertaMinutos: 10,
    activo: true,
    kds: {
      habilitado: false,
      mostrarTiempo: true,
      mostrarPrioridad: true,
      sonidoNuevaComanda: true,
    },
  })

  // Cargar zonas
  const loadZonas = async () => {
    try {
      setIsLoading(true)
      const response = await zonasPreparacionService.getAll({ limit: 100 })
      setZonas(response.data)
    } catch (error: any) {
      toast.error('Error al cargar zonas: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadZonas()
  }, [])

  // Abrir dialogo nueva zona
  const handleNuevaZona = () => {
    setZonaEditando(null)
    setFormZona({
      nombre: '',
      codigo: '',
      descripcion: '',
      color: '#3b82f6',
      tiempoPreparacionPromedio: 15,
      notificarRetraso: true,
      tiempoAlertaMinutos: 10,
      activo: true,
      kds: {
        habilitado: true,
        mostrarTiempo: true,
        mostrarPrioridad: true,
        sonidoNuevaComanda: true,
      },
    })
    setShowDialog(true)
  }

  // Abrir dialogo editar zona
  const handleEditarZona = (zona: ZonaPreparacion) => {
    setZonaEditando(zona)
    setFormZona({
      nombre: zona.nombre,
      codigo: zona.codigo || '',
      descripcion: zona.descripcion || '',
      color: zona.color || '#3b82f6',
      tiempoPreparacionPromedio: zona.tiempoPreparacionPromedio || 15,
      notificarRetraso: zona.notificarRetraso ?? true,
      tiempoAlertaMinutos: zona.tiempoAlertaMinutos || 10,
      activo: zona.activo,
      kds: zona.kds || {
        habilitado: false,
        mostrarTiempo: true,
        mostrarPrioridad: true,
        sonidoNuevaComanda: true,
      },
    })
    setShowDialog(true)
  }

  // Guardar zona
  const handleGuardarZona = async () => {
    if (!formZona.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    try {
      setIsSaving(true)

      if (zonaEditando) {
        await zonasPreparacionService.update(zonaEditando._id, formZona)
        toast.success('Zona actualizada correctamente')
      } else {
        await zonasPreparacionService.create(formZona)
        toast.success('Zona creada correctamente')
      }

      setShowDialog(false)
      await loadZonas()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Eliminar zona
  const handleEliminarZona = async (zona: ZonaPreparacion) => {
    if (!confirm(`Eliminar la zona "${zona.nombre}"?`)) return

    try {
      await zonasPreparacionService.delete(zona._id)
      toast.success('Zona eliminada correctamente')
      await loadZonas()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  // Abrir KDS
  const handleAbrirKDS = (zona: ZonaPreparacion) => {
    window.open(`/kds?zona=${zona._id}`, '_blank')
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
              <Monitor className="h-6 w-6" />
              Configuracion KDS
            </h1>
            <p className="text-muted-foreground">
              Configura las zonas de preparacion y monitores de cocina
            </p>
          </div>
          <Button onClick={handleNuevaZona}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Zona
          </Button>
        </div>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <ChefHat className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Kitchen Display System (KDS)</p>
                <p className="text-blue-700">
                  El KDS muestra las comandas en pantallas de cocina. Cada zona de preparacion
                  puede tener su propio monitor. Las comandas se envian automaticamente cuando
                  se realizan pedidos en el TPV.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de zonas */}
        <Card>
          <CardHeader>
            <CardTitle>Zonas de Preparacion</CardTitle>
            <CardDescription>
              Zonas donde se preparan los productos (cocina, barra, postres, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : zonas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay zonas de preparacion configuradas</p>
                <Button className="mt-4" onClick={handleNuevaZona}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera zona
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zona</TableHead>
                    <TableHead>Codigo</TableHead>
                    <TableHead>KDS</TableHead>
                    <TableHead>Tiempo Objetivo</TableHead>
                    <TableHead>Alerta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zonas.map((zona) => (
                    <TableRow key={zona._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: zona.color }}
                          />
                          <span className="font-medium">{zona.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>{zona.codigo || '-'}</TableCell>
                      <TableCell>
                        {zona.kds?.habilitado ? (
                          <Badge variant="default" className="bg-green-600">
                            <Monitor className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Desactivado</Badge>
                        )}
                      </TableCell>
                      <TableCell>{zona.tiempoPreparacionPromedio || 15} min</TableCell>
                      <TableCell>
                        {zona.notificarRetraso ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {zona.tiempoAlertaMinutos} min
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={zona.activo ? 'default' : 'secondary'}>
                          {zona.activo ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {zona.kds?.habilitado && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirKDS(zona)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Abrir KDS
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditarZona(zona)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleEliminarZona(zona)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialogo de edicion */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {zonaEditando ? 'Editar Zona' : 'Nueva Zona de Preparacion'}
              </DialogTitle>
              <DialogDescription>
                Configura la zona de preparacion y sus opciones de KDS
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Datos basicos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={formZona.nombre}
                    onChange={(e) => setFormZona({ ...formZona, nombre: e.target.value })}
                    placeholder="Ej: Cocina Principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Codigo</Label>
                  <Input
                    value={formZona.codigo}
                    onChange={(e) => setFormZona({ ...formZona, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ej: COC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formZona.color}
                      onChange={(e) => setFormZona({ ...formZona, color: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formZona.color}
                      onChange={(e) => setFormZona({ ...formZona, color: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tiempo preparacion (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formZona.tiempoPreparacionPromedio || 15}
                    onChange={(e) => setFormZona({ ...formZona, tiempoPreparacionPromedio: parseInt(e.target.value) || 15 })}
                  />
                </div>
              </div>

              {/* Configuracion KDS */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    <span className="font-medium">Monitor KDS</span>
                  </div>
                  <Switch
                    checked={formZona.kds?.habilitado}
                    onCheckedChange={(checked) => setFormZona({
                      ...formZona,
                      kds: { ...formZona.kds!, habilitado: checked }
                    })}
                  />
                </div>

                {formZona.kds?.habilitado && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Mostrar tiempo</span>
                      </div>
                      <Switch
                        checked={formZona.kds?.mostrarTiempo}
                        onCheckedChange={(checked) => setFormZona({
                          ...formZona,
                          kds: { ...formZona.kds!, mostrarTiempo: checked }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        <span className="text-sm">Sonido nuevas</span>
                      </div>
                      <Switch
                        checked={formZona.kds?.sonidoNuevaComanda}
                        onCheckedChange={(checked) => setFormZona({
                          ...formZona,
                          kds: { ...formZona.kds!, sonidoNuevaComanda: checked }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Alertas */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificar retrasos</Label>
                  <p className="text-xs text-muted-foreground">
                    Alerta cuando una comanda supera el tiempo objetivo
                  </p>
                </div>
                <Switch
                  checked={formZona.notificarRetraso}
                  onCheckedChange={(checked) => setFormZona({ ...formZona, notificarRetraso: checked })}
                />
              </div>

              {formZona.notificarRetraso && (
                <div className="space-y-2">
                  <Label>Tiempo alerta (minutos)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formZona.tiempoAlertaMinutos || 10}
                    onChange={(e) => setFormZona({ ...formZona, tiempoAlertaMinutos: parseInt(e.target.value) || 10 })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Zona activa</Label>
                <Switch
                  checked={formZona.activo}
                  onCheckedChange={(checked) => setFormZona({ ...formZona, activo: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGuardarZona} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {zonaEditando ? 'Guardar cambios' : 'Crear zona'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  )
}
