'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { terminalesService } from '@/services/terminales.service'
import {
  Terminal,
  MARCAS_TERMINAL,
  ESTADOS_TERMINAL,
  ESTADOS_CONEXION,
  HistorialSync,
  EmpleadoSincronizado,
} from '@/types/terminal.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Pencil,
  RefreshCw,
  Wifi,
  WifiOff,
  Upload,
  Download,
  Fingerprint,
  Clock,
  Users,
  History,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

export default function TerminalDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [terminal, setTerminal] = useState<Terminal | null>(null)
  const [empleados, setEmpleados] = useState<EmpleadoSincronizado[]>([])
  const [historial, setHistorial] = useState<HistorialSync[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [testing, setTesting] = useState(false)

  const [syncDialog, setSyncDialog] = useState<{ open: boolean; tipo: 'empleados' | 'fichajes' | null }>({
    open: false,
    tipo: null,
  })

  const loadTerminal = useCallback(async () => {
    try {
      setLoading(true)
      const [terminalRes, empleadosRes, historialRes] = await Promise.all([
        terminalesService.getById(id),
        terminalesService.getEmpleados(id),
        terminalesService.getHistorial(id, 20),
      ])

      if (terminalRes.success) {
        setTerminal(terminalRes.data)
      }
      if (empleadosRes.success) {
        setEmpleados(empleadosRes.data)
      }
      if (historialRes.success) {
        setHistorial(historialRes.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar terminal')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadTerminal()
  }, [loadTerminal])

  const handleProbarConexion = async () => {
    try {
      setTesting(true)
      const response = await terminalesService.probarConexion(id)

      if (response.success) {
        toast.success('Conexión exitosa')
        loadTerminal()
      } else {
        toast.error(response.message)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al probar conexión')
    } finally {
      setTesting(false)
    }
  }

  const handleSync = async () => {
    if (!syncDialog.tipo) return

    try {
      setSyncing(true)

      let response
      if (syncDialog.tipo === 'empleados') {
        response = await terminalesService.sincronizarEmpleados(id)
      } else {
        response = await terminalesService.sincronizarAsistencia(id)
      }

      toast.success(response.message)
      setSyncDialog({ open: false, tipo: null })
      loadTerminal()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEstadoSyncIcon = (estado: string) => {
    switch (estado) {
      case 'exitoso':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'parcial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      
    )
  }

  if (!terminal) {
    return (
      
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Terminal no encontrado</p>
          <Button onClick={() => router.push('/terminales')}>Volver a la lista</Button>
        </div>
      
    )
  }

  return (
      <>
      <div className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/terminales')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Fingerprint className="h-6 w-6" />
                {terminal.nombre}
              </h1>
              <p className="text-muted-foreground font-mono">{terminal.codigo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleProbarConexion} disabled={testing}>
              {testing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4 mr-2" />
              )}
              Probar conexión
            </Button>
            <Button variant="outline" onClick={() => setSyncDialog({ open: true, tipo: 'empleados' })}>
              <Upload className="h-4 w-4 mr-2" />
              Sync Empleados
            </Button>
            <Button variant="outline" onClick={() => setSyncDialog({ open: true, tipo: 'fichajes' })}>
              <Download className="h-4 w-4 mr-2" />
              Sync Fichajes
            </Button>
            <Button onClick={() => router.push(`/terminales/${id}/editar`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Info general */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Conexión</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={terminal.estadoConexion === 'conectado' ? 'default' : 'destructive'}>
                  {terminal.estadoConexion === 'conectado' ? (
                    <Wifi className="h-3 w-3 mr-1" />
                  ) : (
                    <WifiOff className="h-3 w-3 mr-1" />
                  )}
                  {ESTADOS_CONEXION.find(e => e.value === terminal.estadoConexion)?.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2 font-mono">
                {terminal.ip}:{terminal.puerto}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Estado</span>
              </div>
              <Badge variant={terminal.estado === 'activo' ? 'default' : terminal.estado === 'error' ? 'destructive' : 'secondary'}>
                {ESTADOS_TERMINAL.find(e => e.value === terminal.estado)?.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Marca: {MARCAS_TERMINAL.find(m => m.value === terminal.marca)?.label}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Empleados</span>
              </div>
              <p className="text-2xl font-bold">{empleados.length}</p>
              <p className="text-sm text-muted-foreground">sincronizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Última Sync</span>
              </div>
              <p className="text-sm font-medium">
                {formatDate(terminal.ultimaSincronizacion)}
              </p>
              {terminal.ultimoError && (
                <p className="text-xs text-destructive mt-1">{terminal.ultimoError}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="empleados" className="w-full">
          <TabsList>
            <TabsTrigger value="empleados" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Empleados ({empleados.length})
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial ({historial.length})
            </TabsTrigger>
            <TabsTrigger value="configuracion" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empleados" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código Terminal</TableHead>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Con Foto</TableHead>
                      <TableHead>Sincronizado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empleados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No hay empleados sincronizados
                        </TableCell>
                      </TableRow>
                    ) : (
                      empleados.map((emp, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{emp.codigoTerminal}</TableCell>
                          <TableCell>
                            {emp.personal ? (
                              <span>
                                <span className="font-mono text-sm text-muted-foreground mr-2">
                                  {emp.personal.codigo}
                                </span>
                                {emp.personal.nombre} {emp.personal.apellidos}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">ID: {emp.personalId}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {emp.conFoto ? (
                              <Badge variant="default">Sí</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(emp.sincronizadoEn)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Procesados</TableHead>
                      <TableHead>Nuevos</TableHead>
                      <TableHead>Errores</TableHead>
                      <TableHead>Duración</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historial.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay historial de sincronizaciones
                        </TableCell>
                      </TableRow>
                    ) : (
                      historial.map((h, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-muted-foreground">
                            {formatDate(h.fecha)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {h.tipo === 'asistencia' ? (
                                <>
                                  <Download className="h-3 w-3 mr-1" />
                                  Fichajes
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3 w-3 mr-1" />
                                  Empleados
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getEstadoSyncIcon(h.estado)}
                              <span className="capitalize">{h.estado}</span>
                            </div>
                          </TableCell>
                          <TableCell>{h.registrosProcesados}</TableCell>
                          <TableCell className="text-green-600">{h.registrosNuevos}</TableCell>
                          <TableCell className={h.registrosError > 0 ? 'text-red-600' : ''}>
                            {h.registrosError}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {(h.duracionMs / 1000).toFixed(1)}s
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracion" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Sincronización</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Sincronización Automática</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Frecuencia:</span>{' '}
                        cada {terminal.configuracion?.frecuenciaMinutos || 15} minutos
                      </p>
                      <p>
                        <span className="text-muted-foreground">Sincronizar asistencia:</span>{' '}
                        {terminal.configuracion?.sincronizarAsistencia ? 'Sí' : 'No'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Sincronizar empleados:</span>{' '}
                        {terminal.configuracion?.sincronizarEmpleados ? 'Sí' : 'No'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Información del Dispositivo</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Modelo:</span>{' '}
                        {terminal.modelo || '-'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Nº Serie:</span>{' '}
                        {terminal.numeroSerie || '-'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Firmware:</span>{' '}
                        {terminal.firmware || '-'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">MAC:</span>{' '}
                        {terminal.mac || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de sincronización */}
      <Dialog open={syncDialog.open} onOpenChange={(open) => setSyncDialog({ open, tipo: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {syncDialog.tipo === 'empleados' ? 'Sincronizar Empleados' : 'Sincronizar Fichajes'}
            </DialogTitle>
            <DialogDescription>
              {syncDialog.tipo === 'empleados'
                ? `¿Deseas enviar los empleados activos al terminal ${terminal.nombre}?`
                : `¿Deseas descargar los fichajes desde el terminal ${terminal.nombre}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSyncDialog({ open: false, tipo: null })}
              disabled={syncing}
            >
              Cancelar
            </Button>
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  {syncDialog.tipo === 'empleados' ? (
                    <Upload className="h-4 w-4 mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
  )
}
