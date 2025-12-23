'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Copy,
  Loader2,
  Check,
  X,
  Users,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Info,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { rolesService, RecursoInfo, PermisoEspecialInfo } from '@/services/roles.service'
import { IRol, IPermisosEspeciales, IPermisos, AccionRecurso, RecursoSistema, PERMISOS_ESPECIALES_DEFAULT } from '@/types/permissions.types'
import { usePermissions } from '@/hooks/usePermissions'

interface RolesConfigProps {
  onRolesChange?: () => void
}

export function RolesConfig({ onRolesChange }: RolesConfigProps) {
  const { canGestionarRoles } = usePermissions()

  const [roles, setRoles] = useState<IRol[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Recursos y permisos disponibles
  const [recursos, setRecursos] = useState<RecursoInfo[]>([])
  const [permisosEspeciales, setPermisosEspeciales] = useState<PermisoEspecialInfo[]>([])

  // Diálogo de edición
  const [showDialog, setShowDialog] = useState(false)
  const [editingRol, setEditingRol] = useState<IRol | null>(null)
  const [isNewRol, setIsNewRol] = useState(false)

  // Formulario del rol
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    color: '#6b7280',
    rolBase: '' as string,
    permisos: {
      recursos: {} as Record<string, AccionRecurso[]>,
      especiales: { ...PERMISOS_ESPECIALES_DEFAULT },
    },
  })

  // Diálogo de confirmación de eliminación
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [rolToDelete, setRolToDelete] = useState<IRol | null>(null)

  // Cargar roles y recursos
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [rolesRes, recursosRes] = await Promise.all([
        rolesService.getAll({ incluirSistema: true }),
        rolesService.getRecursos(),
      ])

      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data)
      }

      if (recursosRes.success && recursosRes.data) {
        setRecursos(recursosRes.data.recursos)
        setPermisosEspeciales(recursosRes.data.especiales)
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar roles')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Inicializar roles del sistema
  const handleInicializarRoles = async () => {
    try {
      setIsSaving(true)
      const response = await rolesService.inicializar()
      if (response.success) {
        toast.success(response.message || 'Roles inicializados')
        loadData()
        onRolesChange?.()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al inicializar roles')
    } finally {
      setIsSaving(false)
    }
  }

  // Abrir diálogo para nuevo rol
  const handleNewRol = () => {
    setEditingRol(null)
    setIsNewRol(true)
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      color: '#6b7280',
      rolBase: '',
      permisos: {
        recursos: {},
        especiales: { ...PERMISOS_ESPECIALES_DEFAULT },
      },
    })
    setShowDialog(true)
  }

  // Abrir diálogo para editar rol
  const handleEditRol = (rol: IRol) => {
    if (rol.esSistema) {
      toast.error('No se pueden editar los roles del sistema')
      return
    }
    setEditingRol(rol)
    setIsNewRol(false)
    setFormData({
      codigo: rol.codigo,
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
      color: rol.color || '#6b7280',
      rolBase: rol.rolBase || '',
      permisos: {
        recursos: { ...rol.permisos.recursos },
        especiales: { ...rol.permisos.especiales },
      },
    })
    setShowDialog(true)
  }

  // Duplicar rol
  const handleDuplicateRol = async (rol: IRol) => {
    const newCodigo = `${rol.codigo}_copia`
    const newNombre = `${rol.nombre} (Copia)`

    try {
      setIsSaving(true)
      const response = await rolesService.duplicar(rol._id, newCodigo, newNombre)
      if (response.success && response.data) {
        toast.success('Rol duplicado correctamente')
        loadData()
        onRolesChange?.()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al duplicar rol')
    } finally {
      setIsSaving(false)
    }
  }

  // Confirmar eliminación
  const handleConfirmDelete = (rol: IRol) => {
    if (rol.esSistema) {
      toast.error('No se pueden eliminar los roles del sistema')
      return
    }
    setRolToDelete(rol)
    setShowDeleteDialog(true)
  }

  // Eliminar rol
  const handleDeleteRol = async () => {
    if (!rolToDelete) return

    try {
      setIsSaving(true)
      const response = await rolesService.delete(rolToDelete._id)
      if (response.success) {
        toast.success('Rol eliminado correctamente')
        setShowDeleteDialog(false)
        setRolToDelete(null)
        loadData()
        onRolesChange?.()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar rol')
    } finally {
      setIsSaving(false)
    }
  }

  // Guardar rol
  const handleSaveRol = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error('El código y nombre son obligatorios')
      return
    }

    try {
      setIsSaving(true)

      if (isNewRol) {
        const response = await rolesService.create({
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          color: formData.color,
          rolBase: formData.rolBase || undefined,
          permisos: formData.permisos,
        })
        if (response.success) {
          toast.success('Rol creado correctamente')
        }
      } else if (editingRol) {
        const response = await rolesService.update(editingRol._id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          color: formData.color,
          permisos: formData.permisos,
        })
        if (response.success) {
          toast.success('Rol actualizado correctamente')
        }
      }

      setShowDialog(false)
      loadData()
      onRolesChange?.()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar rol')
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle permiso de recurso
  const togglePermisoRecurso = (recurso: string, accion: AccionRecurso) => {
    setFormData(prev => {
      const recursosActuales = prev.permisos.recursos[recurso] || []
      const tienePermiso = recursosActuales.includes(accion)

      let nuevosPermisos: AccionRecurso[]
      if (tienePermiso) {
        nuevosPermisos = recursosActuales.filter(a => a !== accion)
      } else {
        nuevosPermisos = [...recursosActuales, accion]
      }

      return {
        ...prev,
        permisos: {
          ...prev.permisos,
          recursos: {
            ...prev.permisos.recursos,
            [recurso]: nuevosPermisos,
          },
        },
      }
    })
  }

  // Toggle permiso especial
  const togglePermisoEspecial = (permiso: keyof IPermisosEspeciales) => {
    setFormData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        especiales: {
          ...prev.permisos.especiales,
          [permiso]: !prev.permisos.especiales[permiso],
        },
      },
    }))
  }

  // Cambiar valor numérico de permiso especial
  const setPermisoEspecialValue = (permiso: keyof IPermisosEspeciales, value: number) => {
    setFormData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        especiales: {
          ...prev.permisos.especiales,
          [permiso]: value,
        },
      },
    }))
  }

  if (!canGestionarRoles()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles y Permisos
          </CardTitle>
          <CardDescription>
            No tienes permisos para gestionar roles
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Roles y Permisos
              </CardTitle>
              <CardDescription>
                Gestiona los roles y permisos de acceso de tu empresa
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {roles.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleInicializarRoles}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Inicializar Roles
                </Button>
              )}
              <Button onClick={handleNewRol}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Rol
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No hay roles configurados</p>
              <p className="text-sm mt-2">Haz clic en "Inicializar Roles" para crear los roles predeterminados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Sistema</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map(rol => (
                  <TableRow key={rol._id}>
                    <TableCell>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: rol.color || '#6b7280' }}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{rol.codigo}</TableCell>
                    <TableCell className="font-medium">{rol.nombre}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {rol.descripcion || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {rol.esSistema ? (
                        <Badge variant="secondary">
                          <Lock className="h-3 w-3 mr-1" />
                          Sistema
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Unlock className="h-3 w-3 mr-1" />
                          Personalizado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {rol.activo ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditRol(rol)}
                                disabled={rol.esSistema}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {rol.esSistema ? 'No editable' : 'Editar'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDuplicateRol(rol)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Duplicar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleConfirmDelete(rol)}
                                disabled={rol.esSistema}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {rol.esSistema ? 'No eliminable' : 'Eliminar'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de edición de rol */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewRol ? 'Nuevo Rol' : `Editar Rol: ${editingRol?.nombre}`}
            </DialogTitle>
            <DialogDescription>
              Configura los permisos del rol
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Datos básicos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={e => setFormData({ ...formData, codigo: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  placeholder="vendedor_junior"
                  disabled={!isNewRol}
                />
                <p className="text-xs text-muted-foreground">
                  Solo letras minúsculas, números, guiones y guiones bajos
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Vendedor Junior"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Vendedor con permisos limitados"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
            </div>

            {isNewRol && (
              <div className="space-y-2">
                <Label htmlFor="rolBase">Heredar permisos de</Label>
                <Select
                  value={formData.rolBase}
                  onValueChange={value => setFormData({ ...formData, rolBase: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol base (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin herencia</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="almacenero">Almacenero</SelectItem>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Permisos especiales */}
            <Accordion type="multiple" defaultValue={['especiales', 'recursos']}>
              <AccordionItem value="especiales">
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Permisos Especiales
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {/* Agrupar por grupo */}
                  {Object.entries(
                    permisosEspeciales.reduce((acc, permiso) => {
                      const grupo = permiso.grupo || 'Otros';
                      if (!acc[grupo]) acc[grupo] = [];
                      acc[grupo].push(permiso);
                      return acc;
                    }, {} as Record<string, typeof permisosEspeciales>)
                  ).map(([grupo, permisos]) => (
                    <div key={grupo} className="mb-4">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
                        {grupo}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 px-4">
                        {permisos.map(permiso => (
                          <div key={permiso.codigo} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="space-y-1 flex-1 mr-2">
                              <Label htmlFor={permiso.codigo} className="font-medium text-sm">
                                {permiso.nombre}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {permiso.descripcion}
                              </p>
                            </div>
                            {permiso.tipo === 'boolean' ? (
                              <Switch
                                id={permiso.codigo}
                                checked={!!formData.permisos.especiales[permiso.codigo]}
                                onCheckedChange={() => togglePermisoEspecial(permiso.codigo)}
                              />
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                className="w-20"
                                value={formData.permisos.especiales[permiso.codigo] as number || 0}
                                onChange={e => setPermisoEspecialValue(permiso.codigo, Number(e.target.value))}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Permisos por recurso */}
              <AccordionItem value="recursos">
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Permisos por Recurso
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recurso</TableHead>
                          <TableHead className="text-center">Crear</TableHead>
                          <TableHead className="text-center">Ver</TableHead>
                          <TableHead className="text-center">Editar</TableHead>
                          <TableHead className="text-center">Eliminar</TableHead>
                          <TableHead className="text-center">Exportar</TableHead>
                          <TableHead className="text-center">Importar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Agrupar recursos por grupo */}
                        {Object.entries(
                          recursos.reduce((acc, recurso) => {
                            const grupo = recurso.grupo || 'Otros';
                            if (!acc[grupo]) acc[grupo] = [];
                            acc[grupo].push(recurso);
                            return acc;
                          }, {} as Record<string, typeof recursos>)
                        ).map(([grupo, recursosGrupo]) => (
                          <React.Fragment key={grupo}>
                            {/* Cabecera de grupo */}
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={7} className="font-semibold text-sm uppercase tracking-wider">
                                {grupo}
                              </TableCell>
                            </TableRow>
                            {/* Recursos del grupo */}
                            {recursosGrupo.map(recurso => {
                              const permisosRecurso = formData.permisos.recursos[recurso.recurso] || []
                              return (
                                <TableRow key={recurso.recurso}>
                                  <TableCell className="font-medium pl-6">{recurso.nombre}</TableCell>
                                  {(['create', 'read', 'update', 'delete', 'export', 'import'] as AccionRecurso[]).map(accion => (
                                    <TableCell key={accion} className="text-center">
                                      {recurso.acciones.includes(accion) && (
                                        <Switch
                                          checked={permisosRecurso.includes(accion)}
                                          onCheckedChange={() => togglePermisoRecurso(recurso.recurso, accion)}
                                        />
                                      )}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              )
                            })}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRol} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Rol</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el rol "{rolToDelete?.nombre}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteRol} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Importar el icono Save si no está
import { Save } from 'lucide-react'
