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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
  Lock,
  Key,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Save,
  Shield,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { usuariosService, IUsuario, IPersonalPopulated, RolDisponible, CreateUsuarioDTO, UpdateUsuarioDTO, RoleType } from '@/services/usuarios.service'
import { personalService } from '@/services/personal.service'
import { Personal } from '@/types/personal.types'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/stores/authStore'
import { useLicense } from '@/hooks/useLicense'

// Helper para extraer el ID del personalId (puede venir como string o como objeto populado)
const getPersonalId = (personalId: string | IPersonalPopulated | undefined): string => {
  if (!personalId) return ''
  if (typeof personalId === 'string') return personalId
  return personalId._id || ''
}

// Helper para obtener el nombre del personal (busca en la lista local)
const getPersonalNombreFromList = (
  personalId: string | IPersonalPopulated | undefined,
  personalList: Personal[]
): string | null => {
  if (!personalId) return null

  // Si viene como objeto populado, extraer el nombre directamente
  if (typeof personalId === 'object' && personalId.nombre) {
    return `${personalId.nombre} ${personalId.apellidos}`
  }

  // Si es un string (ID), buscar en la lista local
  const id = typeof personalId === 'string' ? personalId : personalId._id
  const personal = personalList.find(p => p._id === id)
  if (personal) {
    return `${personal.nombre} ${personal.apellidos}`
  }

  return null
}

interface UsuariosConfigProps {
  onUsuariosChange?: () => void
}

export function UsuariosConfig({ onUsuariosChange }: UsuariosConfigProps) {
  const { canGestionarUsuarios } = usePermissions()
  const { user } = useAuthStore()
  const { hasModule } = useLicense()

  // Verificar si tiene módulo RRHH para vincular empleados
  const tieneRRHH = hasModule('rrhh')

  const [usuarios, setUsuarios] = useState<IUsuario[]>([])
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([])
  const [personalList, setPersonalList] = useState<Personal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [total, setTotal] = useState(0)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<boolean | undefined>(undefined)
  const [filtroRol, setFiltroRol] = useState<string>('')

  // Diálogo de edición
  const [showDialog, setShowDialog] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<IUsuario | null>(null)
  const [isNewUsuario, setIsNewUsuario] = useState(false)

  // Formulario del usuario
  const [formData, setFormData] = useState<Partial<CreateUsuarioDTO & { avatar?: string; personalId?: string; pinTPV?: string }>>({
    email: '',
    password: '',
    nombre: '',
    apellidos: '',
    telefono: '',
    rol: 'vendedor',
    personalId: '',
    activo: true,
    pinTPV: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  // Diálogo de cambio de contraseña
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [usuarioPassword, setUsuarioPassword] = useState<IUsuario | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Diálogo de confirmación de eliminación
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState<IUsuario | null>(null)

  // Cargar usuarios y roles
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Cargar usuarios y roles siempre
      const [usuariosRes, rolesRes] = await Promise.all([
        usuariosService.getAll({
          busqueda: busqueda || undefined,
          activo: filtroActivo,
          rol: filtroRol as RoleType || undefined,
        }),
        usuariosService.getRolesDisponibles(),
      ])

      if (usuariosRes.success && usuariosRes.data) {
        setUsuarios(usuariosRes.data)
        setTotal(usuariosRes.total || 0)
      }

      if (rolesRes.success && rolesRes.data) {
        setRolesDisponibles(rolesRes.data)
      }

      // Solo cargar personal si tiene módulo RRHH
      if (tieneRRHH) {
        try {
          const personalRes = await personalService.getAll({ activo: true, limit: 100 })
          if (personalRes.success && personalRes.data) {
            setPersonalList(personalRes.data)
          }
        } catch {
          // Ignorar error si no tiene acceso a RRHH
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar usuarios')
    } finally {
      setIsLoading(false)
    }
  }, [busqueda, filtroActivo, filtroRol, tieneRRHH])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Abrir diálogo para nuevo usuario
  const handleNewUsuario = () => {
    setEditingUsuario(null)
    setIsNewUsuario(true)
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellidos: '',
      telefono: '',
      rol: (rolesDisponibles.find(r => r.codigo !== 'superadmin')?.codigo || 'vendedor') as Exclude<RoleType, 'superadmin'>,
      personalId: '',
      activo: true,
      pinTPV: '',
    })
    setShowPassword(false)
    setShowDialog(true)
  }

  // Abrir diálogo para editar usuario
  const handleEditUsuario = (usuario: IUsuario) => {
    setEditingUsuario(usuario)
    setIsNewUsuario(false)
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      telefono: usuario.telefono || '',
      rol: usuario.rol as Exclude<RoleType, 'superadmin'>,
      personalId: getPersonalId(usuario.personalId), // Extraer ID del objeto populado
      activo: usuario.activo,
      pinTPV: (usuario as any).pinTPV || '',
    })
    setShowDialog(true)
  }

  // Guardar usuario
  const handleSaveUsuario = async () => {
    if (isNewUsuario) {
      if (!formData.email || !formData.password || !formData.nombre || !formData.apellidos || !formData.rol) {
        toast.error('Todos los campos marcados con * son obligatorios')
        return
      }
    } else {
      if (!formData.nombre || !formData.apellidos) {
        toast.error('El nombre y apellidos son obligatorios')
        return
      }
    }

    try {
      setIsSaving(true)

      if (isNewUsuario) {
        const response = await usuariosService.create(formData as CreateUsuarioDTO)
        if (response.success) {
          toast.success('Usuario creado correctamente')
        }
      } else if (editingUsuario) {
        const updateData: UpdateUsuarioDTO = {
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          telefono: formData.telefono || undefined,
          rol: formData.rol as Exclude<RoleType, 'superadmin'>,
          personalId: formData.personalId || null,
          activo: formData.activo,
          pinTPV: formData.pinTPV || undefined,
        }
        const response = await usuariosService.update(editingUsuario._id, updateData)
        if (response.success) {
          toast.success('Usuario actualizado correctamente')
        }
      }

      setShowDialog(false)
      loadData()
      onUsuariosChange?.()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar usuario')
    } finally {
      setIsSaving(false)
    }
  }

  // Abrir diálogo de cambio de contraseña
  const handleOpenPasswordDialog = (usuario: IUsuario) => {
    setUsuarioPassword(usuario)
    setNewPassword('')
    setShowNewPassword(false)
    setShowPasswordDialog(true)
  }

  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (!usuarioPassword || !newPassword) {
      toast.error('La contraseña es obligatoria')
      return
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      setIsSaving(true)
      const response = await usuariosService.changePassword(usuarioPassword._id, newPassword)
      if (response.success) {
        toast.success('Contraseña actualizada correctamente')
        setShowPasswordDialog(false)
        setUsuarioPassword(null)
        setNewPassword('')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar contraseña')
    } finally {
      setIsSaving(false)
    }
  }

  // Confirmar desactivación
  const handleConfirmDelete = (usuario: IUsuario) => {
    if (usuario._id === user?.id) {
      toast.error('No puedes desactivar tu propia cuenta')
      return
    }
    if (usuario.rol === 'superadmin') {
      toast.error('No puedes desactivar usuarios superadmin')
      return
    }
    setUsuarioToDelete(usuario)
    setShowDeleteDialog(true)
  }

  // Desactivar usuario
  const handleDeleteUsuario = async () => {
    if (!usuarioToDelete) return

    try {
      setIsSaving(true)
      const response = await usuariosService.delete(usuarioToDelete._id)
      if (response.success) {
        toast.success('Usuario desactivado correctamente')
        setShowDeleteDialog(false)
        setUsuarioToDelete(null)
        loadData()
        onUsuariosChange?.()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al desactivar usuario')
    } finally {
      setIsSaving(false)
    }
  }

  // Reactivar usuario
  const handleReactivarUsuario = async (usuario: IUsuario) => {
    try {
      setIsSaving(true)
      const response = await usuariosService.reactivar(usuario._id)
      if (response.success) {
        toast.success('Usuario reactivado correctamente')
        loadData()
        onUsuariosChange?.()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al reactivar usuario')
    } finally {
      setIsSaving(false)
    }
  }

  if (!canGestionarUsuarios()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios
          </CardTitle>
          <CardDescription>
            No tienes permisos para gestionar usuarios
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
                <Users className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>
                Administra los usuarios de tu empresa ({total} usuarios)
              </CardDescription>
            </div>
            <Button onClick={handleNewUsuario}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por nombre, email..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            <Select value={filtroRol} onValueChange={setFiltroRol}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los roles</SelectItem>
                {rolesDisponibles.map(rol => (
                  <SelectItem key={rol.codigo} value={rol.codigo}>
                    {rol.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filtroActivo === undefined ? '' : filtroActivo.toString()}
              onValueChange={v => setFiltroActivo(v === '' ? undefined : v === 'true')}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No hay usuarios que coincidan con los filtros</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  {tieneRRHH && <TableHead>Personal vinculado</TableHead>}
                  <TableHead className="text-center">2FA</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="w-40"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map(usuario => (
                  <TableRow key={usuario._id} className={!usuario.activo ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {usuario.nombre[0]}{usuario.apellidos[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {usuario.nombre} {usuario.apellidos}
                            {usuario._id === user?.id && (
                              <Badge variant="outline" className="ml-2 text-xs">Tú</Badge>
                            )}
                          </p>
                          {usuario.telefono && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {usuario.telefono}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {usuario.email}
                        {usuario.emailVerificado && (
                          <Check className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={usuariosService.getColorRol(usuario.rol)}>
                        {usuariosService.getNombreRol(usuario.rol)}
                      </Badge>
                    </TableCell>
                    {tieneRRHH && (
                      <TableCell>
                        {getPersonalNombreFromList(usuario.personalId, personalList) ? (
                          <span className="text-sm">
                            {getPersonalNombreFromList(usuario.personalId, personalList)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin vincular</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      {usuario.twoFactorEnabled ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Shield className="h-4 w-4 text-green-500 mx-auto" />
                            </TooltipTrigger>
                            <TooltipContent>
                              2FA activado ({usuario.twoFactorMethod})
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {usuario.activo ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          <UserX className="h-3 w-3 mr-1" />
                          Inactivo
                        </Badge>
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
                                onClick={() => handleEditUsuario(usuario)}
                                disabled={usuario.rol === 'superadmin' && user?.rol !== 'superadmin'}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenPasswordDialog(usuario)}
                                disabled={usuario.rol === 'superadmin' && user?.rol !== 'superadmin'}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cambiar contraseña</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {usuario.activo ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleConfirmDelete(usuario)}
                                  disabled={usuario._id === user?.id || usuario.rol === 'superadmin'}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Desactivar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReactivarUsuario(usuario)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reactivar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de edición de usuario */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isNewUsuario ? 'Nuevo Usuario' : `Editar Usuario: ${editingUsuario?.nombre}`}
            </DialogTitle>
            <DialogDescription>
              {isNewUsuario
                ? 'Crea un nuevo usuario para tu empresa'
                : 'Modifica los datos del usuario'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email (solo en creación) */}
            {isNewUsuario && (
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@empresa.com"
                />
              </div>
            )}

            {/* Nombre y apellidos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre || ''}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos || ''}
                  onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                  placeholder="Apellidos"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono || ''}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="600123456"
              />
            </div>

            {/* Contraseña (solo en creación) */}
            {isNewUsuario && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password || ''}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Rol */}
            <div className="space-y-2">
              <Label htmlFor="rol">Rol *</Label>
              <Select
                value={formData.rol}
                onValueChange={value => setFormData({ ...formData, rol: value as any })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {rolesDisponibles.map(rol => (
                    <SelectItem key={rol.codigo} value={rol.codigo}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Solo puedes asignar roles de nivel igual o inferior al tuyo
              </p>
            </div>

            {/* Personal vinculado (para fichaje) - solo si tiene módulo RRHH */}
            {tieneRRHH && (
              <div className="space-y-2">
                <Label htmlFor="personalId">Empleado vinculado</Label>
                <SearchableSelect
                  value={formData.personalId || ''}
                  onValueChange={value => setFormData({ ...formData, personalId: value || '' })}
                  placeholder="Sin vincular (no puede fichar)"
                  searchPlaceholder="Buscar empleado..."
                  emptyMessage="No se encontraron empleados"
                  allowClear
                  options={personalList.map(p => ({
                    value: p._id,
                    label: `${p.nombre} ${p.apellidos}`,
                    description: p.codigo,
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Vincula este usuario a un empleado para que pueda fichar
                </p>
              </div>
            )}

            {/* PIN para TPV */}
            <div className="space-y-2">
              <Label htmlFor="pinTPV">PIN TPV</Label>
              <Input
                id="pinTPV"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={formData.pinTPV || ''}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setFormData({ ...formData, pinTPV: value })
                }}
                placeholder="4-6 dígitos"
              />
              <p className="text-xs text-muted-foreground">
                PIN numérico de 4-6 dígitos para acceder al TPV
              </p>
            </div>

            {/* Estado (solo en edición) */}
            {!isNewUsuario && (
              <div className="flex items-center justify-between">
                <Label htmlFor="activo">Usuario activo</Label>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={checked => setFormData({ ...formData, activo: checked })}
                  disabled={editingUsuario?._id === user?.id}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUsuario} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de cambio de contraseña */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Introduce la nueva contraseña para {usuarioPassword?.nombre} {usuarioPassword?.apellidos}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
              Cambiar Contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de desactivación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas desactivar al usuario "{usuarioToDelete?.nombre} {usuarioToDelete?.apellidos}"?
              <br /><br />
              El usuario no podrá acceder al sistema hasta que sea reactivado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUsuario} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserX className="h-4 w-4 mr-2" />}
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
