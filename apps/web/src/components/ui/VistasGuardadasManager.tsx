'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Eye,
  Save,
  Trash2,
  Copy,
  Star,
  MoreHorizontal,
  Plus,
  ChevronDown,
  Check,
  Settings2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import vistasService from '@/services/vistas-guardadas.service' // ✅ IMPORTAR EL SERVICIO

export interface VistaGuardada {
  _id: string
  nombre: string
  descripcion?: string
  configuracion: any
  esDefault: boolean
  compartida: boolean
  icono?: string
  color?: string
  createdAt: string
  updatedAt: string
}

interface VistasGuardadasManagerProps {
  modulo: string
  configuracionActual: any
  onAplicarVista: (configuracion: any) => void
  onGuardarVista: (nombre: string, descripcion?: string, esDefault?: boolean, vistaIdActualizar?: string) => Promise<void>
}

export function VistasGuardadasManager({
  modulo,
  configuracionActual,
  onAplicarVista,
  onGuardarVista,
}: VistasGuardadasManagerProps) {
  const [vistas, setVistas] = useState<VistaGuardada[]>([])
  const [vistaActual, setVistaActual] = useState<VistaGuardada | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showManageDialog, setShowManageDialog] = useState(false)
  
  // Form state para guardar nueva vista
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaDescripcion, setNuevaDescripcion] = useState('')
  const [establecerDefault, setEstablecerDefault] = useState(false)

  // Cargar vistas al montar
  useEffect(() => {
    cargarVistas()
  }, [modulo])

  const cargarVistas = async () => {
    try {
      setIsLoading(true)
      
      // ✅ USAR EL SERVICIO EN LUGAR DE FETCH
      const vistasObtenidas = await vistasService.getAll(modulo, true)
      
      setVistas(vistasObtenidas || [])
      
      // Encontrar vista por defecto
      const vistaDefault = vistasObtenidas?.find((v: VistaGuardada) => v.esDefault)
      if (vistaDefault) {
        setVistaActual(vistaDefault)
      }
    } catch (error) {
      console.error('Error al cargar vistas:', error)
      toast.error('Error al cargar las vistas guardadas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuardarVista = async (modoActualizar: boolean = false) => {
    if (!nuevoNombre.trim()) {
      toast.error('El nombre de la vista es obligatorio')
      return
    }

    try {
      if (modoActualizar && vistaActual) {
        // Actualizar vista existente
        await onGuardarVista(
          nuevoNombre,
          nuevaDescripcion,
          establecerDefault,
          vistaActual._id
        )
        toast.success('Vista actualizada correctamente')
      } else {
        // Crear nueva vista
        await onGuardarVista(
          nuevoNombre,
          nuevaDescripcion,
          establecerDefault
        )
        toast.success('Vista guardada correctamente')
      }

      setShowSaveDialog(false)
      setNuevoNombre('')
      setNuevaDescripcion('')
      setEstablecerDefault(false)
      await cargarVistas()
    } catch (error) {
      toast.error(modoActualizar ? 'Error al actualizar la vista' : 'Error al guardar la vista')
    }
  }

  const handleAbrirDialogoGuardar = () => {
    // Pre-rellenar si hay vista actual
    if (vistaActual) {
      setNuevoNombre(vistaActual.nombre)
      setNuevaDescripcion(vistaActual.descripcion || '')
      setEstablecerDefault(vistaActual.esDefault)
    } else {
      setNuevoNombre('')
      setNuevaDescripcion('')
      setEstablecerDefault(false)
    }
    setShowSaveDialog(true)
  }

  const handleAplicarVista = async (vista: VistaGuardada) => {
    try {
      onAplicarVista(vista.configuracion)
      setVistaActual(vista)
      toast.success(`Vista "${vista.nombre}" aplicada`)
    } catch (error) {
      toast.error('Error al aplicar la vista')
    }
  }

  const handleRestaurarDefault = () => {
    try {
      // Resetear a configuración por defecto (sin vista guardada)
      setVistaActual(null)
      toast.success('Configuración por defecto restaurada')
    } catch (error) {
      toast.error('Error al restaurar configuración')
    }
  }

  const handleEliminarVista = async (vistaId: string) => {
    try {
      // ✅ USAR EL SERVICIO
      await vistasService.delete(vistaId)
      cargarVistas()
      toast.success('Vista eliminada correctamente')
    } catch (error) {
      toast.error('Error al eliminar la vista')
    }
  }

  const handleDuplicarVista = async (vistaId: string, nombreOriginal: string) => {
    try {
      // ✅ USAR EL SERVICIO
      await vistasService.duplicate(vistaId, `${nombreOriginal} (copia)`)
      cargarVistas()
      toast.success('Vista duplicada correctamente')
    } catch (error) {
      toast.error('Error al duplicar la vista')
    }
  }

  const handleEstablecerDefault = async (vistaId: string) => {
    try {
      // ✅ USAR EL SERVICIO
      await vistasService.setDefault(vistaId)
      cargarVistas()
      toast.success('Vista establecida como predeterminada')
    } catch (error) {
      toast.error('Error al establecer vista por defecto')
    }
  }

  return (
    <>
      {/* Botones en la barra de herramientas */}
      <div className="flex gap-2">
        {/* Selector de vista */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="sm:min-w-[140px] justify-start">
              {vistaActual ? (
                <>
                  <Eye className="mr-2 h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline truncate">{vistaActual.nombre}</span>
                </>
              ) : (
                <>
                  <Settings2 className="mr-2 h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Por defecto</span>
                </>
              )}
              <ChevronDown className="ml-auto h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Vistas Guardadas</span>
              {vistaActual && (
                <Badge variant="secondary" className="text-xs">
                  Activa
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Opción "Por defecto" */}
            <DropdownMenuItem
              onClick={() => setVistaActual(null)}
              className="flex items-center gap-2 py-2"
            >
              <div className="flex items-center flex-1 gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={!vistaActual ? "font-semibold" : ""}>
                      Configuración por defecto
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vista estándar del sistema
                  </p>
                </div>
              </div>
              {!vistaActual && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>

            {vistas.length > 0 && <DropdownMenuSeparator />}

            {vistas.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                <Eye className="mx-auto mb-2 h-8 w-8 opacity-20" />
                <p>No hay vistas personalizadas</p>
                <p className="text-xs mt-1">Crea una vista para guardar tu configuración</p>
              </div>
            ) : (
              vistas.map((vista) => {
                const isActive = vistaActual?._id === vista._id
                return (
                  <DropdownMenuItem
                    key={vista._id}
                    onClick={() => handleAplicarVista(vista)}
                    className="flex items-center gap-2 py-2"
                  >
                    <div className="flex items-center flex-1 gap-2">
                      <Eye className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={isActive ? "font-semibold" : "font-medium"}>
                            {vista.nombre}
                          </span>
                          {vista.esDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                              Default
                            </Badge>
                          )}
                        </div>
                        {vista.descripcion && (
                          <p className="text-xs text-muted-foreground truncate">
                            {vista.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                )
              })
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowManageDialog(true)}>
              <MoreHorizontal className="mr-2 h-4 w-4" />
              Gestionar vistas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Botón para guardar vista */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAbrirDialogoGuardar}
        >
          <Save className="mr-2 h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Guardar Vista</span>
        </Button>
      </div>

      {/* Dialog para guardar nueva vista */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Vista Personalizada</DialogTitle>
            <DialogDescription>
              Guarda la configuración actual de columnas, filtros y ordenamiento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la vista *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Clientes Activos, Vista Completa..."
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                maxLength={50}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Textarea
                id="descripcion"
                placeholder="Describe el propósito de esta vista..."
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                maxLength={200}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="default"
                checked={establecerDefault}
                onChange={(e) => setEstablecerDefault(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="default" className="text-sm font-normal cursor-pointer">
                Establecer como vista predeterminada
              </Label>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            {vistaActual ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleGuardarVista(false)}
                  disabled={!nuevoNombre.trim()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Guardar como nueva
                </Button>
                <Button
                  onClick={() => handleGuardarVista(true)}
                  disabled={!nuevoNombre.trim()}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Actualizar vista
                </Button>
              </>
            ) : (
              <Button onClick={() => handleGuardarVista(false)} disabled={!nuevoNombre.trim()}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Vista
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para gestionar vistas */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Vistas Guardadas</DialogTitle>
            <DialogDescription>
              Administra tus vistas personalizadas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {vistas.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="mx-auto h-12 w-12 opacity-20 mb-3" />
                <p className="text-muted-foreground">No hay vistas guardadas</p>
              </div>
            ) : (
              vistas.map((vista) => (
                <div
                  key={vista._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{vista.nombre}</p>
                      {vista.esDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                          Default
                        </Badge>
                      )}
                      {vista.compartida && (
                        <Badge variant="outline" className="text-xs">
                          Compartida
                        </Badge>
                      )}
                    </div>
                    {vista.descripcion && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {vista.descripcion}
                      </p>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAplicarVista(vista)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Aplicar
                      </DropdownMenuItem>
                      {!vista.esDefault && (
                        <DropdownMenuItem onClick={() => handleEstablecerDefault(vista._id)}>
                          <Star className="mr-2 h-4 w-4" />
                          Establecer como default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicarVista(vista._id, vista.nombre)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleEliminarVista(vista._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}