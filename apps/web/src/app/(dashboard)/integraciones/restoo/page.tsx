'use client'

import { useState, useEffect, useCallback } from 'react'
import { restooService, IRestooConnection, IRestooSyncLog, IRestooZone, IRestooMapeoSalon } from '@/services/restoo.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CalendarCheck,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Link2,
  Settings,
  MapPin,
  FileText,
  Trash2,
  Plus,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { api } from '@/services/api'

interface SalonLocal {
  _id: string
  nombre: string
}

interface MesaLocal {
  _id: string
  numero: number
  nombre?: string
  salonId: string
}

export default function RestooPage() {
  // Estado principal
  const [conexiones, setConexiones] = useState<IRestooConnection[]>([])
  const [conexionActiva, setConexionActiva] = useState<IRestooConnection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Estado formulario conexión
  const [formData, setFormData] = useState({
    nombre: '',
    apiUrl: 'https://api.restoo.me/v1',
    apiKey: '',
    apiSecret: '',
    restauranteIdRestoo: '',
    configuracion: {
      syncAutomatico: false,
      intervaloMinutos: 5,
      syncReservas: true,
      syncDisponibilidad: false,
      syncCancelaciones: true,
      syncNoShows: true,
      crearClientesSiNoExisten: true,
      salonPorDefecto: '',
    },
  })

  // Estado test
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Estado sync
  const [isSyncing, setIsSyncing] = useState(false)

  // Estado mapeo salones
  const [zonasRestoo, setZonasRestoo] = useState<IRestooZone[]>([])
  const [salonesLocales, setSalonesLocales] = useState<SalonLocal[]>([])
  const [mesasLocales, setMesasLocales] = useState<MesaLocal[]>([])
  const [mapeos, setMapeos] = useState<IRestooMapeoSalon[]>([])
  const [isLoadingZonas, setIsLoadingZonas] = useState(false)

  // Estado logs
  const [logs, setLogs] = useState<IRestooSyncLog[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsPage, setLogsPage] = useState(1)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  // Cargar datos
  const cargarConexiones = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await restooService.getConexiones()
      if (response.success && response.data) {
        setConexiones(response.data)
        if (response.data.length > 0) {
          setConexionActiva(response.data[0])
          cargarFormulario(response.data[0])
        }
      }
    } catch (error) {
      console.error('Error cargando conexiones:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const cargarFormulario = (c: IRestooConnection) => {
    setFormData({
      nombre: c.nombre,
      apiUrl: c.apiUrl,
      apiKey: c.apiKey,
      apiSecret: c.apiSecret || '',
      restauranteIdRestoo: c.restauranteIdRestoo,
      configuracion: {
        syncAutomatico: c.configuracion?.syncAutomatico ?? false,
        intervaloMinutos: c.configuracion?.intervaloMinutos ?? 5,
        syncReservas: c.configuracion?.syncReservas ?? true,
        syncDisponibilidad: c.configuracion?.syncDisponibilidad ?? false,
        syncCancelaciones: c.configuracion?.syncCancelaciones ?? true,
        syncNoShows: c.configuracion?.syncNoShows ?? true,
        crearClientesSiNoExisten: c.configuracion?.crearClientesSiNoExisten ?? true,
        salonPorDefecto: c.configuracion?.salonPorDefecto || '',
      },
    })
  }

  const cargarSalonesLocales = async () => {
    try {
      const response = await api.get('/salones')
      if (response.data?.data) {
        setSalonesLocales(response.data.data)
      }
      const mesasResponse = await api.get('/mesas')
      if (mesasResponse.data?.data) {
        setMesasLocales(mesasResponse.data.data)
      }
    } catch {
      // Salones no disponibles
    }
  }

  const cargarMapeos = async (conexionId: string) => {
    try {
      const response = await restooService.getMapeoSalones(conexionId)
      if (response.success && response.data) {
        setMapeos(response.data)
      }
    } catch {
      // Sin mapeos
    }
  }

  const cargarLogs = async (conexionId: string, page = 1) => {
    try {
      const response = await restooService.getLogs(conexionId, page)
      if (response.success && response.data) {
        setLogs(response.data.logs)
        setLogsTotal(response.data.total)
        setLogsPage(page)
      }
    } catch {
      // Sin logs
    }
  }

  useEffect(() => {
    cargarConexiones()
    cargarSalonesLocales()
  }, [cargarConexiones])

  useEffect(() => {
    if (conexionActiva) {
      cargarMapeos(conexionActiva._id)
      cargarLogs(conexionActiva._id)
    }
  }, [conexionActiva])

  // Acciones
  const guardarConexion = async () => {
    try {
      setIsSaving(true)
      if (conexionActiva) {
        const response = await restooService.actualizarConexion(conexionActiva._id, formData as any)
        if (response.success) {
          toast.success('Conexion actualizada')
          setConexionActiva(response.data!)
          cargarConexiones()
        }
      } else {
        const response = await restooService.crearConexion(formData as any)
        if (response.success) {
          toast.success('Conexion creada')
          setConexionActiva(response.data!)
          cargarConexiones()
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const eliminarConexion = async () => {
    if (!conexionActiva || !confirm('¿Eliminar esta conexion? Se borrarán todos los mapeos y logs asociados.')) return
    try {
      await restooService.eliminarConexion(conexionActiva._id)
      toast.success('Conexion eliminada')
      setConexionActiva(null)
      setFormData({
        nombre: '', apiUrl: 'https://api.restoo.me/v1', apiKey: '', apiSecret: '',
        restauranteIdRestoo: '',
        configuracion: {
          syncAutomatico: false, intervaloMinutos: 5, syncReservas: true,
          syncDisponibilidad: false, syncCancelaciones: true, syncNoShows: true,
          crearClientesSiNoExisten: true, salonPorDefecto: '',
        },
      })
      cargarConexiones()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const testConexion = async () => {
    if (!conexionActiva) return
    try {
      setIsTesting(true)
      setTestResult(null)
      const response = await restooService.testConexion(conexionActiva._id)
      if (response.success && response.data) {
        setTestResult(response.data)
        if (response.data.success) {
          toast.success(response.data.message)
        } else {
          toast.error(response.data.message)
        }
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.response?.data?.message || 'Error de conexion' })
      toast.error('Error al probar conexion')
    } finally {
      setIsTesting(false)
    }
  }

  const sincronizar = async (tipo: 'reservas' | 'disponibilidad') => {
    if (!conexionActiva) return
    try {
      setIsSyncing(true)
      const response = await restooService.sincronizar(conexionActiva._id, tipo)
      if (response.success) {
        toast.success(`Sincronizacion de ${tipo} completada`)
        cargarLogs(conexionActiva._id)
        cargarConexiones()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Error al sincronizar ${tipo}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const obtenerZonasRestoo = async () => {
    if (!conexionActiva) return
    try {
      setIsLoadingZonas(true)
      const response = await restooService.getSalonesRestoo(conexionActiva._id)
      if (response.success && response.data) {
        setZonasRestoo(response.data)
        toast.success(`${response.data.length} zonas obtenidas de Restoo`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al obtener zonas')
    } finally {
      setIsLoadingZonas(false)
    }
  }

  const guardarMapeos = async () => {
    if (!conexionActiva) return
    try {
      const mapeosData = mapeos.map(m => ({
        salonIdLocal: m.salonIdLocal,
        zonaIdRestoo: m.zonaIdRestoo,
        nombreRestoo: m.nombreRestoo,
        mesasMapeo: m.mesasMapeo || [],
      }))
      const response = await restooService.guardarMapeoSalones(conexionActiva._id, mapeosData)
      if (response.success) {
        toast.success('Mapeo de salones guardado')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar mapeo')
    }
  }

  const nuevaConexion = () => {
    setConexionActiva(null)
    setFormData({
      nombre: '', apiUrl: 'https://api.restoo.me/v1', apiKey: '', apiSecret: '',
      restauranteIdRestoo: '',
      configuracion: {
        syncAutomatico: false, intervaloMinutos: 5, syncReservas: true,
        syncDisponibilidad: false, syncCancelaciones: true, syncNoShows: true,
        crearClientesSiNoExisten: true, salonPorDefecto: '',
      },
    })
    setTestResult(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6" />
            Restoo.me
          </h1>
          <p className="text-muted-foreground">Integracion con plataforma de reservas Restoo.me</p>
        </div>
        <div className="flex gap-2">
          {conexiones.length > 0 && (
            <Select
              value={conexionActiva?._id || ''}
              onValueChange={(val) => {
                const c = conexiones.find(x => x._id === val)
                if (c) {
                  setConexionActiva(c)
                  cargarFormulario(c)
                }
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Seleccionar conexion" />
              </SelectTrigger>
              <SelectContent>
                {conexiones.map(c => (
                  <SelectItem key={c._id} value={c._id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={nuevaConexion}>
            <Plus className="h-4 w-4 mr-1" /> Nueva
          </Button>
        </div>
      </div>

      <Tabs defaultValue="conexion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conexion">
            <Link2 className="h-4 w-4 mr-1" /> Conexion
          </TabsTrigger>
          <TabsTrigger value="mapeo" disabled={!conexionActiva}>
            <MapPin className="h-4 w-4 mr-1" /> Mapeo Salones
          </TabsTrigger>
          <TabsTrigger value="sync" disabled={!conexionActiva}>
            <RefreshCw className="h-4 w-4 mr-1" /> Sincronizacion
          </TabsTrigger>
          <TabsTrigger value="logs" disabled={!conexionActiva}>
            <FileText className="h-4 w-4 mr-1" /> Logs
          </TabsTrigger>
        </TabsList>

        {/* TAB: CONEXIÓN */}
        <TabsContent value="conexion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos de conexion</CardTitle>
              <CardDescription>Configura las credenciales de tu cuenta Restoo.me</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre descriptivo</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Mi restaurante - Restoo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">URL API</Label>
                  <Input
                    id="apiUrl"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                    placeholder="https://api.restoo.me/v1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Tu API Key de Restoo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret (opcional)</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                    placeholder="Secret si aplica"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restauranteId">ID Restaurante en Restoo</Label>
                  <Input
                    id="restauranteId"
                    value={formData.restauranteIdRestoo}
                    onChange={(e) => setFormData({ ...formData, restauranteIdRestoo: e.target.value })}
                    placeholder="ID proporcionado por Restoo"
                  />
                </div>
                {salonesLocales.length > 0 && (
                  <div className="space-y-2">
                    <Label>Salon por defecto</Label>
                    <Select
                      value={formData.configuracion.salonPorDefecto || 'none'}
                      onValueChange={(val) => setFormData({
                        ...formData,
                        configuracion: { ...formData.configuracion, salonPorDefecto: val === 'none' ? '' : val }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {salonesLocales.map(s => (
                          <SelectItem key={s._id} value={s._id}>{s.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Configuración sync */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Configuracion de sincronizacion
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="syncReservas">Sincronizar reservas (pull)</Label>
                    <Switch
                      id="syncReservas"
                      checked={formData.configuracion.syncReservas}
                      onCheckedChange={(v) => setFormData({
                        ...formData,
                        configuracion: { ...formData.configuracion, syncReservas: v }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="syncDisponibilidad">Sincronizar disponibilidad (push)</Label>
                    <Switch
                      id="syncDisponibilidad"
                      checked={formData.configuracion.syncDisponibilidad}
                      onCheckedChange={(v) => setFormData({
                        ...formData,
                        configuracion: { ...formData.configuracion, syncDisponibilidad: v }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="syncCancelaciones">Sincronizar cancelaciones</Label>
                    <Switch
                      id="syncCancelaciones"
                      checked={formData.configuracion.syncCancelaciones}
                      onCheckedChange={(v) => setFormData({
                        ...formData,
                        configuracion: { ...formData.configuracion, syncCancelaciones: v }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="syncNoShows">Sincronizar no-shows</Label>
                    <Switch
                      id="syncNoShows"
                      checked={formData.configuracion.syncNoShows}
                      onCheckedChange={(v) => setFormData({
                        ...formData,
                        configuracion: { ...formData.configuracion, syncNoShows: v }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="crearClientes">Crear clientes si no existen</Label>
                    <Switch
                      id="crearClientes"
                      checked={formData.configuracion.crearClientesSiNoExisten}
                      onCheckedChange={(v) => setFormData({
                        ...formData,
                        configuracion: { ...formData.configuracion, crearClientesSiNoExisten: v }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="syncAuto">Sync automatico</Label>
                    <Switch
                      id="syncAuto"
                      checked={formData.configuracion.syncAutomatico}
                      onCheckedChange={(v) => setFormData({
                        ...formData,
                        configuracion: { ...formData.configuracion, syncAutomatico: v }
                      })}
                    />
                  </div>
                  {formData.configuracion.syncAutomatico && (
                    <div className="space-y-2">
                      <Label htmlFor="intervalo">Intervalo (minutos)</Label>
                      <Input
                        id="intervalo"
                        type="number"
                        min={1}
                        value={formData.configuracion.intervaloMinutos}
                        onChange={(e) => setFormData({
                          ...formData,
                          configuracion: { ...formData.configuracion, intervaloMinutos: parseInt(e.target.value) || 5 }
                        })}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Test result */}
              {testResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                  {testResult.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={guardarConexion} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {conexionActiva ? 'Guardar cambios' : 'Crear conexion'}
                </Button>
                {conexionActiva && (
                  <>
                    <Button variant="outline" onClick={testConexion} disabled={isTesting}>
                      {isTesting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Link2 className="h-4 w-4 mr-1" />}
                      Probar conexion
                    </Button>
                    <Button variant="destructive" size="icon" onClick={eliminarConexion}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          {conexionActiva && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{conexionActiva.estadisticas?.reservasSincronizadas || 0}</p>
                    <p className="text-sm text-muted-foreground">Reservas sincronizadas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Badge variant={conexionActiva.activa ? 'default' : 'secondary'}>
                      {conexionActiva.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">Estado conexion</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {conexionActiva.ultimaSync
                        ? format(new Date(conexionActiva.ultimaSync), 'dd/MM/yyyy HH:mm', { locale: es })
                        : 'Nunca'}
                    </p>
                    <p className="text-sm text-muted-foreground">Ultima sincronizacion</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* TAB: MAPEO SALONES */}
        <TabsContent value="mapeo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Mapeo de salones
              </CardTitle>
              <CardDescription>Asocia las zonas de Restoo con tus salones locales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={obtenerZonasRestoo} disabled={isLoadingZonas}>
                  {isLoadingZonas ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Obtener zonas de Restoo
                </Button>
                {mapeos.length > 0 && (
                  <Button variant="outline" onClick={guardarMapeos}>
                    Guardar mapeo
                  </Button>
                )}
              </div>

              {zonasRestoo.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{zonasRestoo.length} zona(s) encontradas en Restoo</p>
                  {zonasRestoo.map((zona) => {
                    const mapeo = mapeos.find(m => m.zonaIdRestoo === zona.id)
                    return (
                      <div key={zona.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{zona.name}</span>
                            {zona.capacity && <span className="text-sm text-muted-foreground ml-2">({zona.capacity} personas)</span>}
                          </div>
                          <Badge variant="outline">ID: {zona.id}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label>Salon local</Label>
                            <Select
                              value={mapeo?.salonIdLocal || 'none'}
                              onValueChange={(val) => {
                                const existing = mapeos.findIndex(m => m.zonaIdRestoo === zona.id)
                                const newMapeo: IRestooMapeoSalon = {
                                  conexionId: conexionActiva!._id,
                                  salonIdLocal: val === 'none' ? '' : val,
                                  zonaIdRestoo: zona.id,
                                  nombreRestoo: zona.name,
                                  mesasMapeo: mapeo?.mesasMapeo || [],
                                }
                                if (existing >= 0) {
                                  const updated = [...mapeos]
                                  updated[existing] = newMapeo
                                  setMapeos(updated)
                                } else {
                                  setMapeos([...mapeos, newMapeo])
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar salon" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sin asignar</SelectItem>
                                {salonesLocales.map(s => (
                                  <SelectItem key={s._id} value={s._id}>{s.nombre}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Mapeo de mesas si la zona tiene mesas */}
                        {zona.tables && zona.tables.length > 0 && mapeo?.salonIdLocal && (
                          <div className="border-t pt-3">
                            <p className="text-sm font-medium mb-2">Mesas ({zona.tables.length})</p>
                            <div className="space-y-2">
                              {zona.tables.map((table) => {
                                const mesaMapeo = mapeo?.mesasMapeo?.find(m => m.mesaIdRestoo === table.id)
                                const mesasDelSalon = mesasLocales.filter(m => m.salonId === mapeo.salonIdLocal)
                                return (
                                  <div key={table.id} className="flex items-center gap-3 text-sm">
                                    <span className="w-32 truncate">{table.name} ({table.seats} asientos)</span>
                                    <span className="text-muted-foreground">→</span>
                                    <Select
                                      value={mesaMapeo?.mesaIdLocal || 'none'}
                                      onValueChange={(val) => {
                                        const currentMapeo = mapeos.find(m => m.zonaIdRestoo === zona.id)
                                        if (!currentMapeo) return
                                        const mesasActuales = currentMapeo.mesasMapeo?.filter(m => m.mesaIdRestoo !== table.id) || []
                                        if (val !== 'none') {
                                          mesasActuales.push({ mesaIdLocal: val, mesaIdRestoo: table.id })
                                        }
                                        const idx = mapeos.findIndex(m => m.zonaIdRestoo === zona.id)
                                        const updated = [...mapeos]
                                        updated[idx] = { ...currentMapeo, mesasMapeo: mesasActuales }
                                        setMapeos(updated)
                                      }}
                                    >
                                      <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Sin asignar" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">Sin asignar</SelectItem>
                                        {mesasDelSalon.map(m => (
                                          <SelectItem key={m._id} value={m._id}>
                                            Mesa {m.numero}{m.nombre ? ` - ${m.nombre}` : ''}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {zonasRestoo.length === 0 && mapeos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Mapeos guardados:</p>
                  {mapeos.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm border rounded p-2">
                      <Badge variant="outline">{m.nombreRestoo}</Badge>
                      <span>→</span>
                      <span>{salonesLocales.find(s => s._id === m.salonIdLocal)?.nombre || m.salonIdLocal}</span>
                      {m.mesasMapeo?.length > 0 && (
                        <span className="text-muted-foreground">({m.mesasMapeo.length} mesas)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: SINCRONIZACIÓN */}
        <TabsContent value="sync" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5" /> Sincronizar reservas
                </CardTitle>
                <CardDescription>Descargar reservas desde Restoo a tu sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => sincronizar('reservas')} disabled={isSyncing} className="w-full">
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowDownToLine className="h-4 w-4 mr-2" />}
                  Sincronizar reservas
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpFromLine className="h-5 w-5" /> Sincronizar disponibilidad
                </CardTitle>
                <CardDescription>Enviar disponibilidad de mesas a Restoo</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => sincronizar('disponibilidad')} disabled={isSyncing} variant="outline" className="w-full">
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowUpFromLine className="h-4 w-4 mr-2" />}
                  Sincronizar disponibilidad
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resumen rápido */}
          {conexionActiva && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{conexionActiva.estadisticas?.reservasSincronizadas || 0}</p>
                    <p className="text-xs text-muted-foreground">Total sincronizadas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {conexionActiva.ultimaSync
                        ? format(new Date(conexionActiva.ultimaSync), 'HH:mm', { locale: es })
                        : '--:--'}
                    </p>
                    <p className="text-xs text-muted-foreground">Ultima sync</p>
                  </div>
                  <div>
                    <Badge variant={conexionActiva.configuracion?.syncAutomatico ? 'default' : 'secondary'}>
                      {conexionActiva.configuracion?.syncAutomatico ? 'Automatico' : 'Manual'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Modo sync</p>
                  </div>
                  <div>
                    {conexionActiva.estadisticas?.ultimoError ? (
                      <Badge variant="destructive">Con errores</Badge>
                    ) : (
                      <Badge variant="default">Sin errores</Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Estado</p>
                  </div>
                </div>
                {conexionActiva.estadisticas?.ultimoError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Ultimo error</p>
                      <p>{conexionActiva.estadisticas.ultimoError}</p>
                      {conexionActiva.estadisticas.ultimoErrorFecha && (
                        <p className="text-xs mt-1">{format(new Date(conexionActiva.estadisticas.ultimoErrorFecha), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: LOGS */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Historial de sincronizaciones
                </span>
                {conexionActiva && (
                  <Button variant="ghost" size="sm" onClick={() => cargarLogs(conexionActiva._id)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay registros de sincronizacion</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log._id} className="border rounded-lg">
                      <button
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/50 rounded-lg"
                        onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                      >
                        <div className="flex items-center gap-3">
                          {log.estado === 'exito' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {log.estado === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                          {log.estado === 'parcial' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                          <div>
                            <span className="text-sm font-medium capitalize">{log.tipo}</span>
                            <span className="text-xs text-muted-foreground ml-2">({log.direccion})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground">
                            {format(new Date(log.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                          <div className="flex gap-1">
                            {log.resultados.exitosos > 0 && (
                              <Badge variant="default" className="text-xs">{log.resultados.exitosos} ok</Badge>
                            )}
                            {log.resultados.fallidos > 0 && (
                              <Badge variant="destructive" className="text-xs">{log.resultados.fallidos} err</Badge>
                            )}
                            {log.resultados.omitidos > 0 && (
                              <Badge variant="secondary" className="text-xs">{log.resultados.omitidos} omit</Badge>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Detalles expandidos */}
                      {expandedLog === log._id && log.detalles?.length > 0 && (
                        <div className="border-t p-3 bg-muted/30">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left py-1">Reserva</th>
                                <th className="text-left py-1">Accion</th>
                                <th className="text-left py-1">Resultado</th>
                                <th className="text-left py-1">Mensaje</th>
                              </tr>
                            </thead>
                            <tbody>
                              {log.detalles.map((d, i) => (
                                <tr key={i} className="border-t border-muted">
                                  <td className="py-1">{d.reservaId || '-'}</td>
                                  <td className="py-1">{d.accion}</td>
                                  <td className="py-1">
                                    {d.resultado === 'exito' && <Badge variant="default" className="text-[10px]">OK</Badge>}
                                    {d.resultado === 'error' && <Badge variant="destructive" className="text-[10px]">Error</Badge>}
                                    {d.resultado === 'omitido' && <Badge variant="secondary" className="text-[10px]">Omitido</Badge>}
                                  </td>
                                  <td className="py-1 text-muted-foreground">{d.mensaje || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Paginación */}
                  {logsTotal > 20 && (
                    <div className="flex justify-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logsPage <= 1}
                        onClick={() => conexionActiva && cargarLogs(conexionActiva._id, logsPage - 1)}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground py-1">
                        Pagina {logsPage} de {Math.ceil(logsTotal / 20)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logsPage >= Math.ceil(logsTotal / 20)}
                        onClick={() => conexionActiva && cargarLogs(conexionActiva._id, logsPage + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
