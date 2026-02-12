'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { kioskService, KioskRegistrado, TipoKiosk, TokenActivacionKiosk } from '@/services/kiosk.service'
import { salonesService } from '@/services/salones.service'
import { formasPagoService } from '@/services/formas-pago.service'
import { familiasService } from '@/services/familias.service'
import { useLicense } from '@/hooks/useLicense'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Loader2,
  Monitor,
  RefreshCw,
  Power,
  PowerOff,
  Copy,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  Trash2,
  Settings,
  Smartphone,
  QrCode,
  TabletSmartphone,
  Menu,
  Palette,
  CreditCard,
  ExternalLink,
  Key,
  Package,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

const ROLES_PERMITIDOS = ['superadmin', 'admin', 'gerente']

// Iconos por tipo de kiosk
const tipoKioskIcons: Record<TipoKiosk, any> = {
  totem: Monitor,
  qr_mesa: QrCode,
  tablet_mesa: TabletSmartphone,
  menu_digital: Menu,
}

// Nombres por tipo de kiosk
const tipoKioskNombres: Record<TipoKiosk, string> = {
  totem: 'Totem Autoservicio',
  qr_mesa: 'QR Mesa',
  tablet_mesa: 'Tablet Mesa',
  menu_digital: 'Menu Digital',
}

export default function ConfiguracionKiosksPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { license, getLimitValue, getRemainingLimit, refetch: refetchLicense } = useLicense()

  const [isLoading, setIsLoading] = useState(true)
  const [kiosks, setKiosks] = useState<KioskRegistrado[]>([])
  const [salones, setSalones] = useState<Array<{ _id: string; nombre: string }>>([])
  const [formasPago, setFormasPago] = useState<Array<{ _id: string; nombre: string }>>([])
  const [familias, setFamilias] = useState<Array<{ _id: string; nombre: string; color?: string }>>([])


  // Dialogo de token
  const [showTokenDialog, setShowTokenDialog] = useState(false)
  const [tokenData, setTokenData] = useState<TokenActivacionKiosk | null>(null)
  const [kioskParaToken, setKioskParaToken] = useState<KioskRegistrado | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  // Dialogo de nuevo kiosk
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [nuevoKiosk, setNuevoKiosk] = useState<Partial<KioskRegistrado>>({
    nombre: '',
    tipo: 'totem',
    tema: {
      colorPrimario: '#3B82F6',
      idiomas: ['es'],
    },
    pagos: {
      permitePago: false,
      formasPagoIds: [],
      pagoObligatorio: false,
    },
    config: {
      tiempoInactividad: 60,
      permitirComentarios: true,
      qrSessionDuration: 120,
      mostrarPrecios: true,
      mostrarAlergenos: true,
      permitirParaLlevar: true,
    },
  })

  // Dialogo de confirmacion
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'desactivar' | 'activar' | 'eliminar'; id: string; nombre?: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Dialogo de configuracion
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [kioskEditando, setKioskEditando] = useState<KioskRegistrado | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Limites de kioskos
  const limiteKiosks = getLimitValue('kioskosActivos')
  const kiosksDisponibles = getRemainingLimit('kioskosActuales')

  useEffect(() => {
    if (!user) return

    if (!ROLES_PERMITIDOS.includes(user.rol)) {
      toast.error('No tienes permisos para acceder a esta pagina')
      router.push('/dashboard')
      return
    }

    loadData()
  }, [user, router])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [kiosksRes, salonesRes, formasPagoRes, familiasRes] = await Promise.all([
        kioskService.listarKiosks(),
        salonesService.getAll({ activo: true }),
        formasPagoService.getAll(),
        familiasService.getAll({ activo: true, limit: 100 }),
      ])

      if (kiosksRes.success) {
        setKiosks(kiosksRes.data || [])
      }
      if (salonesRes.success && salonesRes.data) {
        setSalones(salonesRes.data.map((s: any) => ({ _id: s._id, nombre: s.nombre })))
      }
      if (formasPagoRes.data) {
        setFormasPago(formasPagoRes.data.map((fp: any) => ({ _id: fp._id, nombre: fp.nombre })))
      }
      if (familiasRes.success && familiasRes.data) {
        setFamilias(familiasRes.data.map((f: any) => ({ _id: f._id, nombre: f.nombre, color: f.color })))
      }
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerarToken = async (kiosk: KioskRegistrado) => {
    setKioskParaToken(kiosk)
    setIsGenerating(true)
    try {
      const res = await kioskService.generarToken(kiosk._id)
      if (res.success && res.data) {
        setTokenData(res.data)
        setShowTokenDialog(true)
      } else {
        toast.error(res.error || 'Error al generar token')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopiarToken = () => {
    if (tokenData?.token) {
      navigator.clipboard.writeText(tokenData.token)
      setCopiedToken(true)
      toast.success('Token copiado al portapapeles')
      setTimeout(() => setCopiedToken(false), 2000)
    }
  }

  const handleCrearKiosk = async () => {
    if (!nuevoKiosk.nombre?.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    // Verificar limite
    if (kiosksDisponibles <= 0 && limiteKiosks !== -1) {
      toast.error(`Has alcanzado el limite de ${limiteKiosks} kioskos. Actualiza tu plan para registrar mas.`)
      return
    }

    setIsCreating(true)
    try {
      const res = await kioskService.crearKiosk(nuevoKiosk)
      if (res.success) {
        toast.success('Kiosk creado correctamente')
        setShowNewDialog(false)
        setNuevoKiosk({
          nombre: '',
          tipo: 'totem',
          tema: { colorPrimario: '#3B82F6', idiomas: ['es'] },
          pagos: { permitePago: false, formasPagoIds: [], pagoObligatorio: false },
          config: { tiempoInactividad: 60, permitirComentarios: true, qrSessionDuration: 120, mostrarPrecios: true, mostrarAlergenos: true, permitirParaLlevar: true },
        })
        loadData()
        refetchLicense()
      } else {
        toast.error(res.error || 'Error al crear kiosk')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditConfig = (kiosk: KioskRegistrado) => {
    setKioskEditando({ ...kiosk })
    setShowConfigDialog(true)
  }

  const handleSaveConfig = async () => {
    if (!kioskEditando) return

    setIsSaving(true)
    try {
      const res = await kioskService.actualizarKiosk(kioskEditando._id, {
        nombre: kioskEditando.nombre,
        tipo: kioskEditando.tipo,
        salonId: kioskEditando.salonId,
        tema: kioskEditando.tema,
        pagos: kioskEditando.pagos,
        config: kioskEditando.config,
      })

      if (res.success) {
        toast.success('Configuracion guardada')
        setShowConfigDialog(false)
        setKioskEditando(null)
        loadData()
      } else {
        toast.error(res.error || 'Error al guardar')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (path: string, value: any) => {
    if (!kioskEditando) return

    const parts = path.split('.')
    const updated = { ...kioskEditando }
    let current: any = updated

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {}
      } else {
        current[parts[i]] = { ...current[parts[i]] }
      }
      current = current[parts[i]]
    }
    current[parts[parts.length - 1]] = value
    setKioskEditando(updated)
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return

    setIsProcessing(true)
    try {
      let res
      switch (confirmAction.type) {
        case 'desactivar':
          res = await kioskService.desactivarKiosk(confirmAction.id)
          if (res.success) {
            toast.success('Kiosk desactivado correctamente')
            loadData()
            refetchLicense()
          } else {
            toast.error(res.error || 'Error al desactivar')
          }
          break
        case 'activar':
          res = await kioskService.activarKiosk(confirmAction.id)
          if (res.success) {
            toast.success('Kiosk activado correctamente')
            loadData()
            refetchLicense()
          } else {
            toast.error(res.error || 'Error al activar')
          }
          break
        case 'eliminar':
          res = await kioskService.eliminarKiosk(confirmAction.id)
          if (res.success) {
            toast.success('Kiosk eliminado correctamente')
            loadData()
            refetchLicense()
          } else {
            toast.error(res.error || 'Error al eliminar kiosk')
          }
          break
      }
    } finally {
      setIsProcessing(false)
      setShowConfirmDialog(false)
      setConfirmAction(null)
    }
  }

  const getEstadoBadge = (kiosk: KioskRegistrado) => {
    if (kiosk.estado === 'desactivado') {
      return <Badge variant="destructive"><PowerOff className="w-3 h-3 mr-1" /> Desactivado</Badge>
    }
    if (kiosk.estado === 'suspendido') {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Suspendido</Badge>
    }

    // Verificar ultima conexion (consideramos activo si se conecto en las ultimas 2 horas)
    if (kiosk.ultimaConexion) {
      const diffMinutos = (Date.now() - new Date(kiosk.ultimaConexion).getTime()) / 1000 / 60
      if (diffMinutos < 120) {
        return <Badge variant="default" className="bg-green-600"><Wifi className="w-3 h-3 mr-1" /> Conectado</Badge>
      }
    }

    return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><WifiOff className="w-3 h-3 mr-1" /> Sin conexion</Badge>
  }

  const getTipoBadge = (tipo: TipoKiosk) => {
    const Icon = tipoKioskIcons[tipo]
    return (
      <Badge variant="outline" className="font-normal">
        <Icon className="w-3 h-3 mr-1" />
        {tipoKioskNombres[tipo]}
      </Badge>
    )
  }

  const formatFecha = (fecha?: Date | string) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleCopiarUrl = (kiosk: KioskRegistrado) => {
    const url = kioskService.getKioskUrl(kiosk._id)
    navigator.clipboard.writeText(url)
    toast.success('URL copiada al portapapeles')
  }

  const handleAbrirKiosk = (kiosk: KioskRegistrado) => {
    const url = kioskService.getKioskUrl(kiosk._id)
    window.open(url, '_blank')
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      
    )
  }

  return (
      <>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kioskos de Autoservicio</h1>
            <p className="text-muted-foreground">
              Gestiona los kioskos y terminales de autoservicio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => setShowNewDialog(true)} disabled={kiosksDisponibles <= 0 && limiteKiosks !== -1}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Kiosk
            </Button>
          </div>
        </div>

        {/* Info de licencia */}
        {limiteKiosks !== -1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <span>Kioskos registrados: <strong>{kiosks.filter(k => k.estado === 'activo').length}</strong> de {limiteKiosks}</span>
                </div>
                {kiosksDisponibles <= 0 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Limite alcanzado
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de kioskos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Kioskos Registrados
            </CardTitle>
            <CardDescription>
              Lista de todos los kioskos configurados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {kiosks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay kioskos registrados</p>
                <p className="text-sm mt-2">Crea un nuevo kiosk para comenzar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Salon</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ultima conexion</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kiosks.map((kiosk) => (
                    <TableRow key={kiosk._id}>
                      <TableCell className="font-medium">{kiosk.nombre}</TableCell>
                      <TableCell>{getTipoBadge(kiosk.tipo)}</TableCell>
                      <TableCell className="text-muted-foreground">{kiosk.salon?.nombre || '-'}</TableCell>
                      <TableCell>{getEstadoBadge(kiosk)}</TableCell>
                      <TableCell>{formatFecha(kiosk.ultimaConexion)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAbrirKiosk(kiosk)}
                            title="Abrir kiosk"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopiarUrl(kiosk)}
                            title="Copiar URL"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditConfig(kiosk)}
                            title="Configuracion"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerarToken(kiosk)}
                            disabled={isGenerating}
                            title="Generar token de activacion"
                          >
                            <Key className="h-4 w-4 text-blue-600" />
                          </Button>
                          {kiosk.estado === 'activo' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setConfirmAction({ type: 'desactivar', id: kiosk._id, nombre: kiosk.nombre })
                                setShowConfirmDialog(true)
                              }}
                              title="Desactivar"
                            >
                              <PowerOff className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setConfirmAction({ type: 'activar', id: kiosk._id, nombre: kiosk.nombre })
                                setShowConfirmDialog(true)
                              }}
                              title="Activar"
                            >
                              <Power className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setConfirmAction({ type: 'eliminar', id: kiosk._id, nombre: kiosk.nombre })
                              setShowConfirmDialog(true)
                            }}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
      </div>

      {/* Dialog de nuevo kiosk */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Kiosk
            </DialogTitle>
            <DialogDescription>
              Configura un nuevo terminal de autoservicio
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nuevoKiosk.nombre || ''}
                onChange={(e) => setNuevoKiosk({ ...nuevoKiosk, nombre: e.target.value })}
                placeholder="Ej: Totem Entrada"
              />
            </div>

            <div className="grid gap-2">
              <Label>Tipo de Kiosk</Label>
              <Select
                value={nuevoKiosk.tipo || 'totem'}
                onValueChange={(value) => setNuevoKiosk({ ...nuevoKiosk, tipo: value as TipoKiosk })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(tipoKioskNombres) as TipoKiosk[]).map((tipo) => {
                    const Icon = tipoKioskIcons[tipo]
                    return (
                      <SelectItem key={tipo} value={tipo}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {tipoKioskNombres[tipo]}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {salones.length > 0 && (
              <div className="grid gap-2">
                <Label>Salon (opcional)</Label>
                <SearchableSelect
                  options={salones.map((s) => ({
                    value: s._id,
                    label: s.nombre,
                  }))}
                  value={nuevoKiosk.salonId || ''}
                  onValueChange={(value) => setNuevoKiosk({ ...nuevoKiosk, salonId: value || undefined })}
                  placeholder="Seleccionar salon..."
                  searchPlaceholder="Buscar salon..."
                  emptyMessage="No hay salones"
                  allowClear={true}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearKiosk} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Kiosk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmacion */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'desactivar' && 'Desactivar Kiosk'}
              {confirmAction?.type === 'activar' && 'Activar Kiosk'}
              {confirmAction?.type === 'eliminar' && 'Eliminar Kiosk'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'desactivar' && (
                <>
                  Estas seguro de desactivar el kiosk <strong>{confirmAction.nombre}</strong>?
                  No podra recibir pedidos hasta que lo vuelvas a activar.
                </>
              )}
              {confirmAction?.type === 'activar' && (
                <>
                  Activar el kiosk <strong>{confirmAction.nombre}</strong>?
                </>
              )}
              {confirmAction?.type === 'eliminar' && (
                <>
                  Eliminar permanentemente el kiosk <strong>{confirmAction.nombre}</strong>?
                  Esta accion no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de configuracion */}
      <Dialog open={showConfigDialog} onOpenChange={(open) => {
        if (!open) {
          setShowConfigDialog(false)
          setKioskEditando(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuracion del Kiosk
            </DialogTitle>
            <DialogDescription>
              Configura las opciones del kiosk {kioskEditando?.nombre}
            </DialogDescription>
          </DialogHeader>

          {kioskEditando && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="productos">Productos</TabsTrigger>
                <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
                <TabsTrigger value="pagos">Pagos</TabsTrigger>
                <TabsTrigger value="comportamiento">Comportamiento</TabsTrigger>
              </TabsList>

              {/* Tab General */}
              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Nombre</Label>
                    <Input
                      value={kioskEditando.nombre}
                      onChange={(e) => setKioskEditando({ ...kioskEditando, nombre: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Tipo de Kiosk</Label>
                    <Select
                      value={kioskEditando.tipo}
                      onValueChange={(value) => setKioskEditando({ ...kioskEditando, tipo: value as TipoKiosk })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(tipoKioskNombres) as TipoKiosk[]).map((tipo) => {
                          const Icon = tipoKioskIcons[tipo]
                          return (
                            <SelectItem key={tipo} value={tipo}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {tipoKioskNombres[tipo]}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {salones.length > 0 && (
                    <div className="grid gap-2">
                      <Label>Salon</Label>
                      <SearchableSelect
                        options={salones.map((s) => ({
                          value: s._id,
                          label: s.nombre,
                        }))}
                        value={
                          typeof kioskEditando.salonId === 'object'
                            ? (kioskEditando.salonId as any)?._id
                            : kioskEditando.salonId || ''
                        }
                        onValueChange={(value) => setKioskEditando({ ...kioskEditando, salonId: value || undefined })}
                        placeholder="Seleccionar salon..."
                        searchPlaceholder="Buscar salon..."
                        emptyMessage="No hay salones"
                        allowClear={true}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab Productos */}
              <TabsContent value="productos" className="space-y-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Familias de Productos
                    </CardTitle>
                    <CardDescription>
                      Selecciona que familias de productos se mostraran en este kiosk.
                      Si no seleccionas ninguna, se mostraran todas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {familias.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No hay familias de productos creadas</p>
                        <p className="text-sm">Crea familias en Configuracion → Familias</p>
                      </div>
                    ) : (
                      <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {familias.map((familia) => {
                          const isSelected = kioskEditando.config?.familiasVisibles?.includes(familia._id) || false
                          return (
                            <div
                              key={familia._id}
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                              onClick={() => {
                                const current = kioskEditando.config?.familiasVisibles || []
                                const updated = isSelected
                                  ? current.filter(id => id !== familia._id)
                                  : [...current, familia._id]
                                updateField('config.familiasVisibles', updated.length > 0 ? updated : undefined)
                              }}
                            >
                              <Checkbox checked={isSelected} />
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: familia.color || '#6B7280' }}
                              />
                              <span className="flex-1">{familia.nombre}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {kioskEditando.config?.familiasVisibles && kioskEditando.config.familiasVisibles.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          {kioskEditando.config.familiasVisibles.length} familia(s) seleccionada(s)
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => updateField('config.familiasVisibles', undefined)}
                        >
                          Limpiar seleccion (mostrar todas)
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Apariencia */}
              <TabsContent value="apariencia" className="space-y-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Tema Visual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Color Primario</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={kioskEditando.tema?.colorPrimario || '#3B82F6'}
                          onChange={(e) => updateField('tema.colorPrimario', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={kioskEditando.tema?.colorPrimario || '#3B82F6'}
                          onChange={(e) => updateField('tema.colorPrimario', e.target.value)}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>URL del Logo (opcional)</Label>
                      <Input
                        value={kioskEditando.tema?.logoUrl || ''}
                        onChange={(e) => updateField('tema.logoUrl', e.target.value)}
                        placeholder="https://ejemplo.com/logo.png"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>URL del Fondo (opcional)</Label>
                      <Input
                        value={kioskEditando.tema?.fondoUrl || ''}
                        onChange={(e) => updateField('tema.fondoUrl', e.target.value)}
                        placeholder="https://ejemplo.com/fondo.jpg"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Pagos */}
              <TabsContent value="pagos" className="space-y-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Configuracion de Pagos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Permitir pago en kiosk</Label>
                        <p className="text-sm text-muted-foreground">
                          El cliente puede pagar desde el kiosk
                        </p>
                      </div>
                      <Switch
                        checked={kioskEditando.pagos?.permitePago ?? false}
                        onCheckedChange={(checked) => updateField('pagos.permitePago', checked)}
                      />
                    </div>

                    {kioskEditando.pagos?.permitePago && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Pago obligatorio</Label>
                            <p className="text-sm text-muted-foreground">
                              El cliente debe pagar antes de enviar el pedido
                            </p>
                          </div>
                          <Switch
                            checked={kioskEditando.pagos?.pagoObligatorio ?? false}
                            onCheckedChange={(checked) => updateField('pagos.pagoObligatorio', checked)}
                          />
                        </div>
                      </>
                    )}

                    {!kioskEditando.pagos?.permitePago && (
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                          Los pedidos se enviaran al TPV para su cobro
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Comportamiento */}
              <TabsContent value="comportamiento" className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mostrar precios</Label>
                      <p className="text-sm text-muted-foreground">
                        Muestra los precios de los productos
                      </p>
                    </div>
                    <Switch
                      checked={kioskEditando.config?.mostrarPrecios ?? true}
                      onCheckedChange={(checked) => updateField('config.mostrarPrecios', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mostrar alergenos</Label>
                      <p className="text-sm text-muted-foreground">
                        Muestra los alergenos de los productos
                      </p>
                    </div>
                    <Switch
                      checked={kioskEditando.config?.mostrarAlergenos ?? true}
                      onCheckedChange={(checked) => updateField('config.mostrarAlergenos', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Permitir comentarios</Label>
                      <p className="text-sm text-muted-foreground">
                        Permite al cliente añadir comentarios a los productos
                      </p>
                    </div>
                    <Switch
                      checked={kioskEditando.config?.permitirComentarios ?? true}
                      onCheckedChange={(checked) => updateField('config.permitirComentarios', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Permitir para llevar</Label>
                      <p className="text-sm text-muted-foreground">
                        Permite seleccionar el servicio para llevar
                      </p>
                    </div>
                    <Switch
                      checked={kioskEditando.config?.permitirParaLlevar ?? true}
                      onCheckedChange={(checked) => updateField('config.permitirParaLlevar', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Requiere nombre del cliente</Label>
                      <p className="text-sm text-muted-foreground">
                        Solicita el nombre antes de confirmar el pedido
                      </p>
                    </div>
                    <Switch
                      checked={kioskEditando.config?.requiereNombreCliente ?? false}
                      onCheckedChange={(checked) => updateField('config.requiereNombreCliente', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Requiere telefono</Label>
                      <p className="text-sm text-muted-foreground">
                        Solicita el telefono del cliente
                      </p>
                    </div>
                    <Switch
                      checked={kioskEditando.config?.requiereTelefono ?? false}
                      onCheckedChange={(checked) => updateField('config.requiereTelefono', checked)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Tiempo de inactividad (segundos)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="300"
                      value={kioskEditando.config?.tiempoInactividad ?? 60}
                      onChange={(e) => updateField('config.tiempoInactividad', Number(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Tiempo antes de resetear la sesion por inactividad
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowConfigDialog(false)
              setKioskEditando(null)
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveConfig} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de token de activacion */}
      <Dialog open={showTokenDialog} onOpenChange={(open) => {
        if (!open) {
          setShowTokenDialog(false)
          setTokenData(null)
          setKioskParaToken(null)
          setCopiedToken(false)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Token de Activacion
            </DialogTitle>
            <DialogDescription>
              Usa este token para activar <strong>{kioskParaToken?.nombre}</strong>
            </DialogDescription>
          </DialogHeader>

          {tokenData && (
            <div className="space-y-6">
              {/* Token grande */}
              <div className="text-center">
                <div className="bg-muted rounded-lg p-6">
                  <p className="text-4xl font-mono font-bold tracking-[0.3em] text-primary">
                    {tokenData.token}
                  </p>
                </div>
              </div>

              {/* Boton copiar */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCopiarToken}
              >
                {copiedToken ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Token
                  </>
                )}
              </Button>

              {/* Expiracion */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Expira: {tokenData.expiraEn.toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Instrucciones */}
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <h4 className="font-medium text-sm mb-2">Como usar el token:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Abre la aplicacion de Kiosk en el dispositivo</li>
                    <li>Introduce el token de 8 caracteres</li>
                    <li>El kiosk se activara automaticamente</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => {
              setShowTokenDialog(false)
              setTokenData(null)
              setKioskParaToken(null)
              setCopiedToken(false)
              loadData()
            }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
  )
}
