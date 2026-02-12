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
import { tpvService, TPVRegistrado, SesionTPV, TokenActivacion } from '@/services/tpv.service'
import { seriesDocumentosService } from '@/services/series-documentos.service'
import { ISerieDocumento } from '@/types/serie-documento.types'
import { useLicense } from '@/hooks/useLicense'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { almacenesService } from '@/services/almacenes.service'
import { salonesService } from '@/services/salones.service'
import {
  Plus,
  Loader2,
  Monitor,
  RefreshCw,
  Power,
  PowerOff,
  Key,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Wifi,
  WifiOff,
  AlertTriangle,
  Trash2,
  Settings,
  Printer,
  Scale,
  Barcode,
  Tv,
  Wallet,
  UtensilsCrossed,
  Coins,
  Smartphone,
} from 'lucide-react'

const ROLES_PERMITIDOS = ['superadmin', 'admin', 'gerente']

export default function ConfiguracionTPVPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { license, getLimitValue, getRemainingLimit, refetch: refetchLicense } = useLicense()

  const [isLoading, setIsLoading] = useState(true)
  const [tpvs, setTpvs] = useState<TPVRegistrado[]>([])
  const [sesiones, setSesiones] = useState<SesionTPV[]>([])

  // Dialogo de token
  const [showTokenDialog, setShowTokenDialog] = useState(false)
  const [tokenData, setTokenData] = useState<TokenActivacion | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  // Dialogo de confirmacion
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'desactivar' | 'revocar' | 'cerrar-sesion' | 'eliminar'; id: string; nombre?: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Dialogo de edicion de configuracion
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [tpvEditando, setTpvEditando] = useState<TPVRegistrado | null>(null)
  const [almacenes, setAlmacenes] = useState<Array<{ _id: string; codigo: string; nombre: string }>>([])
  const [salones, setSalones] = useState<Array<{ _id: string; nombre: string }>>([])
  const [seriesFactura, setSeriesFactura] = useState<ISerieDocumento[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Limites de TPV
  const limiteTPVs = getLimitValue('tpvsActivos')
  const tpvsDisponibles = getRemainingLimit('tpvsActuales')

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
      const [tpvsRes, sesionesRes, almacenesRes, salonesRes, seriesRes] = await Promise.all([
        tpvService.listarTPVs(),
        tpvService.obtenerSesiones(),
        almacenesService.getActivos(),
        salonesService.getAll({ activo: true }),
        seriesDocumentosService.getByTipoDocumento('factura', true),
      ])

      if (tpvsRes.success) {
        setTpvs(tpvsRes.data || [])
      }
      if (sesionesRes.success) {
        setSesiones(sesionesRes.data || [])
      }
      if (almacenesRes.success && almacenesRes.data) {
        setAlmacenes(almacenesRes.data.map((a: any) => ({ _id: a._id, codigo: a.codigo, nombre: a.nombre })))
      }
      if (salonesRes.success && salonesRes.data) {
        setSalones(salonesRes.data.map((s: any) => ({ _id: s._id, nombre: s.nombre })))
      }
      if (seriesRes.data) {
        setSeriesFactura(seriesRes.data)
      }
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerarToken = async () => {
    // Verificar limite
    if (tpvsDisponibles <= 0 && limiteTPVs !== -1) {
      toast.error(`Has alcanzado el limite de ${limiteTPVs} TPVs. Actualiza tu plan para registrar mas.`)
      return
    }

    setIsGenerating(true)
    try {
      const res = await tpvService.generarToken()
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

  const handleEditConfig = (tpv: TPVRegistrado) => {
    setTpvEditando({ ...tpv })
    setShowConfigDialog(true)
  }

  const handleSaveConfig = async () => {
    if (!tpvEditando) return

    setIsSaving(true)
    try {
      const res = await tpvService.actualizarTPV(tpvEditando._id, {
        nombre: tpvEditando.nombre,
        almacenId: tpvEditando.almacenId || undefined,
        serieFactura: tpvEditando.serieFactura,
        config: tpvEditando.config,
      })

      if (res.success) {
        toast.success('Configuracion guardada')
        setShowConfigDialog(false)
        setTpvEditando(null)
        loadData()
      } else {
        toast.error(res.error || 'Error al guardar')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const updateConfigField = (path: string, value: any) => {
    if (!tpvEditando) return

    const parts = path.split('.')
    const updated = { ...tpvEditando }
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
    setTpvEditando(updated)
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return

    setIsProcessing(true)
    try {
      let res
      switch (confirmAction.type) {
        case 'desactivar':
          res = await tpvService.desactivarTPV(confirmAction.id)
          if (res.success) {
            toast.success('TPV desactivado correctamente')
            loadData()
            refetchLicense() // Actualizar limites de licencia
          } else {
            toast.error(res.error || 'Error al desactivar')
          }
          break
        case 'revocar':
          res = await tpvService.revocarToken(confirmAction.id)
          if (res.success) {
            toast.success('Token revocado. El TPV debera volver a autenticarse.')
            loadData()
          } else {
            toast.error(res.error || 'Error al revocar token')
          }
          break
        case 'cerrar-sesion':
          res = await tpvService.forzarCierreSesion(confirmAction.id)
          if (res.success) {
            toast.success('Sesion cerrada')
            loadData()
          } else {
            toast.error(res.error || 'Error al cerrar sesion')
          }
          break
        case 'eliminar':
          res = await tpvService.eliminarTPV(confirmAction.id)
          if (res.success) {
            toast.success('TPV eliminado correctamente')
            loadData()
            refetchLicense() // Actualizar limites de licencia
          } else {
            toast.error(res.error || 'Error al eliminar TPV')
          }
          break
      }
    } finally {
      setIsProcessing(false)
      setShowConfirmDialog(false)
      setConfirmAction(null)
    }
  }

  const getEstadoBadge = (tpv: TPVRegistrado) => {
    // Verificar si el TPV esta desactivado
    if (tpv.estado === 'desactivado' || tpv.estado === 'inactivo') {
      return <Badge variant="destructive"><PowerOff className="w-3 h-3 mr-1" /> Desactivado</Badge>
    }
    if (tpv.estado === 'pendiente') {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>
    }

    // Verificar si hay una sesion activa para este TPV
    const tieneSesionActiva = sesiones.some(s => s.tpvId === tpv._id && s.estado === 'activa')
    if (tieneSesionActiva) {
      return <Badge variant="default" className="bg-green-600"><Wifi className="w-3 h-3 mr-1" /> Conectado</Badge>
    }

    // Si no hay sesion activa, esta desconectado
    return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><WifiOff className="w-3 h-3 mr-1" /> Desconectado</Badge>
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
            <h1 className="text-3xl font-bold">Terminales Punto de Venta</h1>
            <p className="text-muted-foreground">
              Gestiona los TPVs de tu empresa
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={handleGenerarToken} disabled={isGenerating || (tpvsDisponibles <= 0 && limiteTPVs !== -1)}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Nuevo TPV
            </Button>
          </div>
        </div>

        {/* Info de licencia */}
        {limiteTPVs !== -1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <span>TPVs registrados: <strong>{tpvs.filter(t => t.estado === 'activo').length}</strong> de {limiteTPVs}</span>
                </div>
                {tpvsDisponibles <= 0 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Limite alcanzado
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de TPVs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              TPVs Registrados
            </CardTitle>
            <CardDescription>
              Lista de todos los terminales punto de venta registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tpvs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay TPVs registrados</p>
                <p className="text-sm mt-2">Genera un token y activalo desde la aplicacion TPV</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Almacen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ultima conexion</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tpvs.map((tpv) => (
                    <TableRow key={tpv._id}>
                      <TableCell className="font-medium">{tpv.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">{(tpv as any).almacenId?.nombre || '-'}</TableCell>
                      <TableCell>{getEstadoBadge(tpv)}</TableCell>
                      <TableCell>{formatFecha(tpv.ultimaConexion)}</TableCell>
                      <TableCell>{tpv.versionApp || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditConfig(tpv)}
                            title="Configuracion"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleGenerarToken}
                            disabled={isGenerating}
                            title="Generar token para comandero"
                          >
                            <Smartphone className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setConfirmAction({ type: 'revocar', id: tpv._id, nombre: tpv.nombre })
                              setShowConfirmDialog(true)
                            }}
                            title="Revocar token"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          {tpv.estado === 'activo' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setConfirmAction({ type: 'desactivar', id: tpv._id, nombre: tpv.nombre })
                                setShowConfirmDialog(true)
                              }}
                              title="Desactivar TPV"
                            >
                              <PowerOff className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setConfirmAction({ type: 'eliminar', id: tpv._id, nombre: tpv.nombre })
                              setShowConfirmDialog(true)
                            }}
                            title="Eliminar TPV"
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

        {/* Sesiones activas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sesiones Activas
            </CardTitle>
            <CardDescription>
              Usuarios conectados actualmente a los TPVs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sesiones.filter(s => s.estado === 'activa').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay sesiones activas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>TPV</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Ultimo heartbeat</TableHead>
                    <TableHead>Ventas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sesiones
                    .filter(s => s.estado === 'activa')
                    .map((sesion) => {
                      const tpv = tpvs.find(t => t._id === sesion.tpvId)
                      return (
                        <TableRow key={sesion._id}>
                          <TableCell className="font-medium">
                            {sesion.usuario?.nombre} {sesion.usuario?.apellidos}
                          </TableCell>
                          <TableCell>{tpv?.nombre || '-'}</TableCell>
                          <TableCell>{formatFecha(sesion.inicioSesion)}</TableCell>
                          <TableCell>{formatFecha(sesion.ultimoHeartbeat)}</TableCell>
                          <TableCell>
                            {sesion.ventasRealizadas} ({sesion.totalVentas.toFixed(2)}€)
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setConfirmAction({
                                  type: 'cerrar-sesion',
                                  id: sesion._id,
                                  nombre: `${sesion.usuario?.nombre} ${sesion.usuario?.apellidos}`
                                })
                                setShowConfirmDialog(true)
                              }}
                              title="Forzar cierre de sesion"
                            >
                              <Power className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de token */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Token Generado
            </DialogTitle>
            <DialogDescription>
              Introduce este token en la aplicacion TPV para activarlo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-3xl font-mono font-bold tracking-widest">
                {tokenData?.token}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Valido por 24 horas</span>
            </div>

            <Button onClick={handleCopiarToken} className="w-full" variant="outline">
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

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Smartphone className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Comandero movil</p>
                  <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                    Para activar un comandero en un smartphone, abre <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/comandero</code> desde el navegador del movil e introduce este token.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowTokenDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmacion */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'desactivar' && 'Desactivar TPV'}
              {confirmAction?.type === 'revocar' && 'Revocar Token'}
              {confirmAction?.type === 'cerrar-sesion' && 'Cerrar Sesion'}
              {confirmAction?.type === 'eliminar' && 'Eliminar TPV'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'desactivar' && (
                <>
                  ¿Estas seguro de desactivar el TPV <strong>{confirmAction.nombre}</strong>?
                  No podra realizar mas operaciones hasta que lo vuelvas a activar.
                </>
              )}
              {confirmAction?.type === 'revocar' && (
                <>
                  ¿Revocar el token del TPV <strong>{confirmAction.nombre}</strong>?
                  El TPV debera volver a autenticarse con un nuevo token de activacion.
                </>
              )}
              {confirmAction?.type === 'cerrar-sesion' && (
                <>
                  ¿Forzar el cierre de la sesion de <strong>{confirmAction.nombre}</strong>?
                  El usuario sera desconectado del TPV.
                </>
              )}
              {confirmAction?.type === 'eliminar' && (
                <>
                  ¿Eliminar permanentemente el TPV <strong>{confirmAction.nombre}</strong>?
                  Esta accion no se puede deshacer. El TPV quedara libre para reasignar.
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

      {/* Dialog de configuracion del TPV */}
      <Dialog open={showConfigDialog} onOpenChange={(open) => {
        if (!open) {
          setShowConfigDialog(false)
          setTpvEditando(null)
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuracion del TPV
            </DialogTitle>
            <DialogDescription>
              Configura los perifericos y opciones del terminal {tpvEditando?.nombre}
            </DialogDescription>
          </DialogHeader>

          {tpvEditando && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="ventas">Ventas</TabsTrigger>
                <TabsTrigger value="restauracion">Restauracion</TabsTrigger>
                <TabsTrigger value="impresoras">Impresoras</TabsTrigger>
                <TabsTrigger value="perifericos">Perifericos</TabsTrigger>
              </TabsList>

              {/* Tab General */}
              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre del TPV</Label>
                    <Input
                      id="nombre"
                      value={tpvEditando.nombre}
                      onChange={(e) => setTpvEditando({ ...tpvEditando, nombre: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="almacen">Almacen</Label>
                    <SearchableSelect
                      options={almacenes.map((a) => ({
                        value: a._id,
                        label: a.nombre,
                        description: a.codigo,
                      }))}
                      value={
                        typeof (tpvEditando as any).almacenId === 'object'
                          ? (tpvEditando as any).almacenId?._id
                          : tpvEditando.almacenId || ''
                      }
                      onValueChange={(value) => setTpvEditando({ ...tpvEditando, almacenId: value || undefined })}
                      placeholder="Seleccionar almacen..."
                      searchPlaceholder="Buscar almacen..."
                      emptyMessage="No hay almacenes disponibles"
                      allowClear={true}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="serieFactura">Serie de factura</Label>
                    <SearchableSelect
                      options={seriesFactura.map((serie) => ({
                        value: serie.codigo,
                        label: `${serie.codigo} - ${serie.nombre}`,
                        description: serie.predeterminada ? 'Predeterminada' : undefined,
                      }))}
                      value={tpvEditando.serieFactura || seriesFactura.find(s => s.predeterminada)?.codigo || ''}
                      onValueChange={(value) => setTpvEditando({ ...tpvEditando, serieFactura: value })}
                      placeholder="Seleccionar serie..."
                      searchPlaceholder="Buscar serie..."
                      emptyMessage="No hay series de factura disponibles"
                      allowClear={false}
                    />
                    <p className="text-sm text-muted-foreground">
                      Serie para facturas simplificadas (tickets)
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Tab Opciones de Venta */}
              <TabsContent value="ventas" className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Permitir descuentos</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir aplicar descuentos en las ventas
                      </p>
                    </div>
                    <Switch
                      checked={tpvEditando.config?.permitirDescuentos ?? true}
                      onCheckedChange={(checked) => updateConfigField('config.permitirDescuentos', checked)}
                    />
                  </div>

                  {tpvEditando.config?.permitirDescuentos && (
                    <div className="grid gap-2 ml-4">
                      <Label>Descuento maximo (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={tpvEditando.config?.descuentoMaximo ?? 100}
                        onChange={(e) => updateConfigField('config.descuentoMaximo', Number(e.target.value))}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Permitir precio manual</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir modificar el precio de venta
                      </p>
                    </div>
                    <Switch
                      checked={tpvEditando.config?.permitirPrecioManual ?? false}
                      onCheckedChange={(checked) => updateConfigField('config.permitirPrecioManual', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Modo offline</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir operar sin conexion a internet
                      </p>
                    </div>
                    <Switch
                      checked={tpvEditando.config?.modoOfflinePermitido ?? true}
                      onCheckedChange={(checked) => updateConfigField('config.modoOfflinePermitido', checked)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Dias de cache de productos</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={tpvEditando.config?.diasCacheProductos ?? 7}
                      onChange={(e) => updateConfigField('config.diasCacheProductos', Number(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Tiempo que se mantienen los productos en cache local
                    </p>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>PIN por cada venta</Label>
                        <p className="text-sm text-muted-foreground">
                          Solicitar PIN de usuario antes de cada cobro
                        </p>
                      </div>
                      <Switch
                        checked={tpvEditando.config?.pinPorTicket ?? false}
                        onCheckedChange={(checked) => updateConfigField('config.pinPorTicket', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Permitir cobro de vencimientos</Label>
                        <p className="text-sm text-muted-foreground">
                          Permitir cobrar facturas de venta pendientes desde el TPV
                        </p>
                      </div>
                      <Switch
                        checked={tpvEditando.config?.permitirCobroVencimientos ?? false}
                        onCheckedChange={(checked) => updateConfigField('config.permitirCobroVencimientos', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Permitir pago de vencimientos</Label>
                        <p className="text-sm text-muted-foreground">
                          Permitir pagar facturas de compra pendientes desde el TPV
                        </p>
                      </div>
                      <Switch
                        checked={tpvEditando.config?.permitirPagoVencimientos ?? false}
                        onCheckedChange={(checked) => updateConfigField('config.permitirPagoVencimientos', checked)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab Restauración */}
              <TabsContent value="restauracion" className="space-y-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4" />
                      Modo Restauracion
                    </CardTitle>
                    <CardDescription>
                      Activa las funcionalidades de hosteleria: mesas, camareros, comandas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Activar modo restauracion</Label>
                        <p className="text-sm text-muted-foreground">
                          Habilita selector de mesa, camareros y comandas de cocina
                        </p>
                      </div>
                      <Switch
                        checked={tpvEditando.config?.tieneRestauracion ?? false}
                        onCheckedChange={(checked) => updateConfigField('config.tieneRestauracion', checked)}
                      />
                    </div>

                    {tpvEditando.config?.tieneRestauracion && (
                      <>
                        <div className="border-t pt-4 space-y-4">
                          <div className="grid gap-2">
                            <Label>Salon por defecto</Label>
                            <SearchableSelect
                              options={salones.map((s) => ({
                                value: s._id,
                                label: s.nombre,
                              }))}
                              value={
                                typeof tpvEditando.config?.salonPorDefectoId === 'object'
                                  ? (tpvEditando.config?.salonPorDefectoId as any)?._id
                                  : tpvEditando.config?.salonPorDefectoId || ''
                              }
                              onValueChange={(value) => updateConfigField('config.salonPorDefectoId', value || undefined)}
                              placeholder="Seleccionar salon..."
                              searchPlaceholder="Buscar salon..."
                              emptyMessage="No hay salones disponibles"
                              allowClear={true}
                            />
                            <p className="text-sm text-muted-foreground">
                              Salon que se muestra por defecto al abrir el TPV
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="flex items-center gap-2">
                                <Coins className="h-4 w-4" />
                                Permitir propinas
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Habilita el registro de propinas para camareros
                              </p>
                            </div>
                            <Switch
                              checked={tpvEditando.config?.permitirPropinas ?? false}
                              onCheckedChange={(checked) => updateConfigField('config.permitirPropinas', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Requerir mesa para venta</Label>
                              <p className="text-sm text-muted-foreground">
                                Obliga a seleccionar una mesa antes de cobrar
                              </p>
                            </div>
                            <Switch
                              checked={tpvEditando.config?.requiereMesaParaVenta ?? false}
                              onCheckedChange={(checked) => updateConfigField('config.requiereMesaParaVenta', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Requerir camarero para venta</Label>
                              <p className="text-sm text-muted-foreground">
                                Obliga a asignar un camarero antes de cobrar
                              </p>
                            </div>
                            <Switch
                              checked={tpvEditando.config?.requiereCamareroParaVenta ?? false}
                              onCheckedChange={(checked) => updateConfigField('config.requiereCamareroParaVenta', checked)}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Maximo de comanderos simultaneos</Label>
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              value={tpvEditando.config?.maxComanderos ?? 0}
                              onChange={(e) => updateConfigField('config.maxComanderos', Number(e.target.value))}
                            />
                            <p className="text-sm text-muted-foreground">
                              Numero maximo de dispositivos comandero conectados simultaneamente. 0 = deshabilitado.
                            </p>
                          </div>
                        </div>

                        {salones.length === 0 && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                              <div>
                                <p className="font-medium text-amber-800 dark:text-amber-200">No hay salones configurados</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                  Para usar el modo restauracion, primero debes crear salones y mesas en la seccion de Restauracion.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Impresoras */}
              <TabsContent value="impresoras" className="space-y-6">
                {/* Impresora de tickets */}
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Impresora de tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Activa</Label>
                      <Switch
                        checked={tpvEditando.config?.impresoraTicket?.activa ?? false}
                        onCheckedChange={(checked) => updateConfigField('config.impresoraTicket.activa', checked)}
                      />
                    </div>

                    {tpvEditando.config?.impresoraTicket?.activa && (
                      <>
                        <div className="grid gap-2">
                          <Label>Tipo de conexion</Label>
                          <Select
                            value={tpvEditando.config?.impresoraTicket?.tipo || 'usb'}
                            onValueChange={(value) => updateConfigField('config.impresoraTicket.tipo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="usb">USB</SelectItem>
                              <SelectItem value="red">Red (IP)</SelectItem>
                              <SelectItem value="bluetooth">Bluetooth</SelectItem>
                              <SelectItem value="serial">Serie (COM)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Conexion</Label>
                          <Input
                            value={tpvEditando.config?.impresoraTicket?.conexion || ''}
                            onChange={(e) => updateConfigField('config.impresoraTicket.conexion', e.target.value)}
                            placeholder={
                              tpvEditando.config?.impresoraTicket?.tipo === 'red' ? '192.168.1.100:9100' :
                              tpvEditando.config?.impresoraTicket?.tipo === 'serial' ? 'COM1' : 'Nombre dispositivo'
                            }
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Ancho de ticket</Label>
                          <Select
                            value={String(tpvEditando.config?.impresoraTicket?.anchoTicket || 80)}
                            onValueChange={(value) => updateConfigField('config.impresoraTicket.anchoTicket', Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="58">58mm</SelectItem>
                              <SelectItem value="80">80mm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Impresora de cocina */}
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Impresora de cocina
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Activa</Label>
                      <Switch
                        checked={tpvEditando.config?.impresoraCocina?.activa ?? false}
                        onCheckedChange={(checked) => updateConfigField('config.impresoraCocina.activa', checked)}
                      />
                    </div>

                    {tpvEditando.config?.impresoraCocina?.activa && (
                      <>
                        <div className="grid gap-2">
                          <Label>Tipo de conexion</Label>
                          <Select
                            value={tpvEditando.config?.impresoraCocina?.tipo || 'usb'}
                            onValueChange={(value) => updateConfigField('config.impresoraCocina.tipo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="usb">USB</SelectItem>
                              <SelectItem value="red">Red (IP)</SelectItem>
                              <SelectItem value="bluetooth">Bluetooth</SelectItem>
                              <SelectItem value="serial">Serie (COM)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Conexion</Label>
                          <Input
                            value={tpvEditando.config?.impresoraCocina?.conexion || ''}
                            onChange={(e) => updateConfigField('config.impresoraCocina.conexion', e.target.value)}
                            placeholder="192.168.1.101:9100"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Ancho de ticket</Label>
                          <Select
                            value={String(tpvEditando.config?.impresoraCocina?.anchoTicket || 80)}
                            onValueChange={(value) => updateConfigField('config.impresoraCocina.anchoTicket', Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="58">58mm</SelectItem>
                              <SelectItem value="80">80mm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Perifericos */}
              <TabsContent value="perifericos" className="space-y-6">
                {/* Visor de cliente */}
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tv className="h-4 w-4" />
                      Visor de cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Activo</Label>
                      <Switch
                        checked={tpvEditando.config?.visorCliente?.activo ?? false}
                        onCheckedChange={(checked) => updateConfigField('config.visorCliente.activo', checked)}
                      />
                    </div>

                    {tpvEditando.config?.visorCliente?.activo && (
                      <>
                        <div className="grid gap-2">
                          <Label>Tipo de conexion</Label>
                          <Select
                            value={tpvEditando.config?.visorCliente?.tipo || 'serial'}
                            onValueChange={(value) => updateConfigField('config.visorCliente.tipo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="serial">Serie (COM)</SelectItem>
                              <SelectItem value="usb">USB</SelectItem>
                              <SelectItem value="red">Red (IP)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Conexion</Label>
                          <Input
                            value={tpvEditando.config?.visorCliente?.conexion || ''}
                            onChange={(e) => updateConfigField('config.visorCliente.conexion', e.target.value)}
                            placeholder="COM2"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Lineas</Label>
                          <Select
                            value={String(tpvEditando.config?.visorCliente?.lineas || 2)}
                            onValueChange={(value) => updateConfigField('config.visorCliente.lineas', Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2">2 lineas</SelectItem>
                              <SelectItem value="4">4 lineas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Cajon portamonedas */}
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Cajon portamonedas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Activo</Label>
                      <Switch
                        checked={tpvEditando.config?.cajonPortamonedas?.activo ?? false}
                        onCheckedChange={(checked) => updateConfigField('config.cajonPortamonedas.activo', checked)}
                      />
                    </div>

                    {tpvEditando.config?.cajonPortamonedas?.activo && (
                      <>
                        <div className="grid gap-2">
                          <Label>Tipo de apertura</Label>
                          <Select
                            value={tpvEditando.config?.cajonPortamonedas?.tipo || 'impresora'}
                            onValueChange={(value) => updateConfigField('config.cajonPortamonedas.tipo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="impresora">Via impresora</SelectItem>
                              <SelectItem value="serial">Serie (COM)</SelectItem>
                              <SelectItem value="usb">USB</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {tpvEditando.config?.cajonPortamonedas?.tipo !== 'impresora' && (
                          <div className="grid gap-2">
                            <Label>Conexion</Label>
                            <Input
                              value={tpvEditando.config?.cajonPortamonedas?.conexion || ''}
                              onChange={(e) => updateConfigField('config.cajonPortamonedas.conexion', e.target.value)}
                              placeholder="COM3"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Label>Abrir al cobrar</Label>
                          <Switch
                            checked={tpvEditando.config?.cajonPortamonedas?.abrirAlCobrar ?? true}
                            onCheckedChange={(checked) => updateConfigField('config.cajonPortamonedas.abrirAlCobrar', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Abrir al abrir caja</Label>
                          <Switch
                            checked={tpvEditando.config?.cajonPortamonedas?.abrirAlAbrirCaja ?? true}
                            onCheckedChange={(checked) => updateConfigField('config.cajonPortamonedas.abrirAlAbrirCaja', checked)}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Lector de codigo de barras */}
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Barcode className="h-4 w-4" />
                      Lector de codigo de barras
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Activo</Label>
                      <Switch
                        checked={tpvEditando.config?.lectorCodigoBarras?.activo ?? true}
                        onCheckedChange={(checked) => updateConfigField('config.lectorCodigoBarras.activo', checked)}
                      />
                    </div>

                    {tpvEditando.config?.lectorCodigoBarras?.activo && (
                      <>
                        <div className="grid gap-2">
                          <Label>Tipo de conexion</Label>
                          <Select
                            value={tpvEditando.config?.lectorCodigoBarras?.tipo || 'usb'}
                            onValueChange={(value) => updateConfigField('config.lectorCodigoBarras.tipo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="usb">USB (teclado)</SelectItem>
                              <SelectItem value="serial">Serie (COM)</SelectItem>
                              <SelectItem value="bluetooth">Bluetooth</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Prefijo (opcional)</Label>
                          <Input
                            value={tpvEditando.config?.lectorCodigoBarras?.prefijo || ''}
                            onChange={(e) => updateConfigField('config.lectorCodigoBarras.prefijo', e.target.value)}
                            placeholder="Caracter de inicio"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Sufijo (opcional)</Label>
                          <Input
                            value={tpvEditando.config?.lectorCodigoBarras?.sufijo || ''}
                            onChange={(e) => updateConfigField('config.lectorCodigoBarras.sufijo', e.target.value)}
                            placeholder="Caracter de fin (Enter por defecto)"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Bascula */}
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Bascula
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Activa</Label>
                      <Switch
                        checked={tpvEditando.config?.bascula?.activa ?? false}
                        onCheckedChange={(checked) => updateConfigField('config.bascula.activa', checked)}
                      />
                    </div>

                    {tpvEditando.config?.bascula?.activa && (
                      <>
                        <div className="grid gap-2">
                          <Label>Tipo de conexion</Label>
                          <Select
                            value={tpvEditando.config?.bascula?.tipo || 'serial'}
                            onValueChange={(value) => updateConfigField('config.bascula.tipo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="serial">Serie (COM)</SelectItem>
                              <SelectItem value="usb">USB</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Conexion</Label>
                          <Input
                            value={tpvEditando.config?.bascula?.conexion || ''}
                            onChange={(e) => updateConfigField('config.bascula.conexion', e.target.value)}
                            placeholder="COM4"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Protocolo</Label>
                          <Select
                            value={tpvEditando.config?.bascula?.protocolo || 'generico'}
                            onValueChange={(value) => updateConfigField('config.bascula.protocolo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="epelsa">Epelsa</SelectItem>
                              <SelectItem value="dibal">Dibal</SelectItem>
                              <SelectItem value="marques">Marques</SelectItem>
                              <SelectItem value="generico">Generico</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowConfigDialog(false)
              setTpvEditando(null)
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
      </>
  )
}
