'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { albaranesService } from '@/services/albaranes.service'
import { facturasService } from '@/services/facturas.service'
import { IAlbaran, EstadoAlbaran, getEstadoConfig } from '@/types/albaran.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
  ArrowLeft,
  Search,
  Receipt,
  FileText,
  Package,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClienteAgrupado {
  clienteId: string
  clienteNombre: string
  clienteCif: string
  albaranes: IAlbaran[]
  totalAlbaranes: number
  importeTotal: number
}

// Función auxiliar para obtener el ID del cliente (puede venir como objeto o string)
const getClienteId = (clienteId: any): string => {
  if (!clienteId) return 'sin-cliente'
  if (typeof clienteId === 'object' && clienteId._id) return clienteId._id
  return String(clienteId)
}

export default function FacturarAlbaranesPage() {
  const router = useRouter()

  // Estado de datos
  const [albaranes, setAlbaranes] = useState<IAlbaran[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('todos')

  // Selección
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [agruparPorCliente, setAgruparPorCliente] = useState(true)

  // Dialog de confirmación
  const [dialogConfirmacion, setDialogConfirmacion] = useState(false)

  // Cargar albaranes pendientes de facturar
  const cargarAlbaranes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await albaranesService.getAll({
        estado: EstadoAlbaran.ENTREGADO,
        facturado: 'false',
        limit: 500,
        page: 1,
      })

      if (response.success && response.data) {
        setAlbaranes(response.data || [])
      }
    } catch (error) {
      console.error('Error al cargar albaranes:', error)
      toast.error('Error al cargar los albaranes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarAlbaranes()
  }, [cargarAlbaranes])

  // Filtrar albaranes
  const albaranesFiltrados = albaranes.filter(albaran => {
    // Filtro de búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      const matchBusqueda =
        albaran.codigo?.toLowerCase().includes(busquedaLower) ||
        albaran.clienteNombre?.toLowerCase().includes(busquedaLower) ||
        albaran.clienteNif?.toLowerCase().includes(busquedaLower)
      if (!matchBusqueda) return false
    }

    // Filtro por fecha
    if (fechaDesde) {
      const fechaAlbaran = new Date(albaran.fecha)
      const desde = new Date(fechaDesde)
      if (fechaAlbaran < desde) return false
    }
    if (fechaHasta) {
      const fechaAlbaran = new Date(albaran.fecha)
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      if (fechaAlbaran > hasta) return false
    }

    // Filtro por cliente
    if (clienteSeleccionado && clienteSeleccionado !== 'todos') {
      if (getClienteId(albaran.clienteId) !== clienteSeleccionado) return false
    }

    return true
  })

  // Agrupar por cliente
  const clientesAgrupados: ClienteAgrupado[] = []
  const clientesMap = new Map<string, ClienteAgrupado>()

  albaranesFiltrados.forEach(albaran => {
    const clienteId = getClienteId(albaran.clienteId)
    if (!clientesMap.has(clienteId)) {
      clientesMap.set(clienteId, {
        clienteId,
        clienteNombre: albaran.clienteNombre || 'Sin cliente',
        clienteCif: albaran.clienteNif || '',
        albaranes: [],
        totalAlbaranes: 0,
        importeTotal: 0,
      })
    }
    const cliente = clientesMap.get(clienteId)!
    cliente.albaranes.push(albaran)
    cliente.totalAlbaranes++
    cliente.importeTotal += albaran.totales?.totalAlbaran || 0
  })

  clientesMap.forEach(cliente => clientesAgrupados.push(cliente))
  clientesAgrupados.sort((a, b) => a.clienteNombre.localeCompare(b.clienteNombre))

  // Lista única de clientes para el filtro (usando getClienteId para evitar duplicados)
  const clientesUnicos = Array.from(new Set(albaranes.map(a => getClienteId(a.clienteId))))
    .map(clienteId => {
      const albaran = albaranes.find(a => getClienteId(a.clienteId) === clienteId)
      return {
        id: clienteId,
        nombre: albaran?.clienteNombre || 'Sin nombre',
      }
    })
    .filter(c => c.id !== 'sin-cliente')
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  // Gestión de selección
  const toggleSeleccion = (albaranId: string) => {
    const nuevaSeleccion = new Set(seleccionados)
    if (nuevaSeleccion.has(albaranId)) {
      nuevaSeleccion.delete(albaranId)
    } else {
      nuevaSeleccion.add(albaranId)
    }
    setSeleccionados(nuevaSeleccion)
  }

  const toggleSeleccionCliente = (clienteId: string) => {
    const cliente = clientesAgrupados.find(c => c.clienteId === clienteId)
    if (!cliente) return

    const nuevaSeleccion = new Set(seleccionados)
    const todosSeleccionados = cliente.albaranes.every(a => seleccionados.has(a._id))

    if (todosSeleccionados) {
      cliente.albaranes.forEach(a => nuevaSeleccion.delete(a._id))
    } else {
      cliente.albaranes.forEach(a => nuevaSeleccion.add(a._id))
    }

    setSeleccionados(nuevaSeleccion)
  }

  const seleccionarTodos = () => {
    const nuevaSeleccion = new Set<string>()
    albaranesFiltrados.forEach(a => nuevaSeleccion.add(a._id))
    setSeleccionados(nuevaSeleccion)
  }

  const deseleccionarTodos = () => {
    setSeleccionados(new Set())
  }

  // Calcular totales de selección
  const albaranesSeleccionados = albaranesFiltrados.filter(a => seleccionados.has(a._id))
  const importeTotalSeleccionado = albaranesSeleccionados.reduce(
    (sum, a) => sum + (a.totales?.totalAlbaran || 0),
    0
  )

  // Clientes únicos en la selección
  const clientesEnSeleccion = new Set(albaranesSeleccionados.map(a => getClienteId(a.clienteId)))

  // Procesar facturación
  const handleFacturar = async () => {
    if (seleccionados.size === 0) {
      toast.warning('Selecciona al menos un albarán')
      return
    }

    setDialogConfirmacion(true)
  }

  const confirmarFacturacion = async () => {
    try {
      setProcesando(true)
      setDialogConfirmacion(false)

      toast.loading('Generando facturas...')

      const response = await facturasService.crearDesdeAlbaranes({
        albaranesIds: Array.from(seleccionados),
        agruparPorCliente,
      })

      toast.dismiss()

      if (response.success && response.data) {
        const numFacturas = response.data.length
        toast.success(`Se han creado ${numFacturas} factura${numFacturas !== 1 ? 's' : ''} correctamente`)

        // Recargar albaranes y limpiar selección
        await cargarAlbaranes()
        setSeleccionados(new Set())

        // Si solo se creó una factura, ir a ella
        if (numFacturas === 1) {
          router.push(`/facturas/${response.data[0]._id}`)
        }
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.message || 'Error al generar facturas')
    } finally {
      setProcesando(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0)
  }

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: es })
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setFechaDesde('')
    setFechaHasta('')
    setClienteSeleccionado('todos')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Facturar Albaranes</h1>
              <p className="text-muted-foreground">
                Selecciona los albaranes que deseas facturar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {seleccionados.size} seleccionados
            </Badge>
            <Button
              size="lg"
              onClick={handleFacturar}
              disabled={seleccionados.size === 0 || procesando}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {procesando ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Receipt className="mr-2 h-5 w-5" />
              )}
              Generar Facturas
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, cliente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  placeholder="Desde"
                />
              </div>

              <div>
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  placeholder="Hasta"
                />
              </div>

              <Select value={clienteSeleccionado} onValueChange={setClienteSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los clientes</SelectItem>
                  {clientesUnicos.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id || 'sin-id'}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Opciones de facturación */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="agrupar"
                    checked={agruparPorCliente}
                    onCheckedChange={setAgruparPorCliente}
                  />
                  <Label htmlFor="agrupar" className="cursor-pointer">
                    Agrupar albaranes del mismo cliente en una factura
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={seleccionarTodos}>
                  Seleccionar todos
                </Button>
                <Button variant="outline" size="sm" onClick={deseleccionarTodos}>
                  Deseleccionar todos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de selección */}
        {seleccionados.size > 0 && (
          <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">{seleccionados.size} albaranes</span>
                  </div>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">{clientesEnSeleccion.size} clientes</span>
                  </div>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">
                      {agruparPorCliente ? clientesEnSeleccion.size : seleccionados.size} facturas a generar
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Importe total</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(importeTotalSeleccionado)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de albaranes agrupados por cliente */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Cargando albaranes...</p>
            </CardContent>
          </Card>
        ) : albaranesFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No hay albaranes pendientes</h3>
              <p className="text-muted-foreground">
                No se encontraron albaranes entregados sin facturar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {clientesAgrupados.map(cliente => {
              const todosSeleccionados = cliente.albaranes.every(a => seleccionados.has(a._id))
              const algunoSeleccionado = cliente.albaranes.some(a => seleccionados.has(a._id))

              return (
                <Card key={cliente.clienteId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={todosSeleccionados}
                          ref={(el) => {
                            if (el) {
                              (el as any).indeterminate = algunoSeleccionado && !todosSeleccionados
                            }
                          }}
                          onCheckedChange={() => toggleSeleccionCliente(cliente.clienteId)}
                        />
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {cliente.clienteNombre}
                          </CardTitle>
                          {cliente.clienteCif && (
                            <CardDescription>{cliente.clienteCif}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {cliente.totalAlbaranes} albarán{cliente.totalAlbaranes !== 1 ? 'es' : ''}
                        </Badge>
                        <span className="font-semibold text-lg">
                          {formatCurrency(cliente.importeTotal)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg divide-y">
                      {cliente.albaranes.map(albaran => {
                        const estadoConfig = getEstadoConfig(albaran.estado)
                        const isSelected = seleccionados.has(albaran._id)

                        return (
                          <div
                            key={albaran._id}
                            className={`flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                              isSelected ? 'bg-purple-50 dark:bg-purple-950/20' : ''
                            }`}
                            onClick={() => toggleSeleccion(albaran._id)}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSeleccion(albaran._id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  {albaran.codigo}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(albaran.fecha)}
                                  {albaran.pedidoOrigenId && typeof albaran.pedidoOrigenId === 'object' && (
                                    <>
                                      <span className="mx-1">•</span>
                                      Pedido: {albaran.pedidoOrigenId.codigo}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge className={estadoConfig.color}>
                                {estadoConfig.label}
                              </Badge>
                              <span className="font-medium w-24 text-right">
                                {formatCurrency(albaran.totales?.totalAlbaran || 0)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog de confirmación */}
      <Dialog open={dialogConfirmacion} onOpenChange={setDialogConfirmacion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar facturación</DialogTitle>
            <DialogDescription>
              Vas a generar {agruparPorCliente ? clientesEnSeleccion.size : seleccionados.size} factura{(agruparPorCliente ? clientesEnSeleccion.size : seleccionados.size) !== 1 ? 's' : ''} a partir de {seleccionados.size} albarán{seleccionados.size !== 1 ? 'es' : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Albaranes seleccionados:</span>
                <span className="font-medium">{seleccionados.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clientes:</span>
                <span className="font-medium">{clientesEnSeleccion.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facturas a generar:</span>
                <span className="font-medium">{agruparPorCliente ? clientesEnSeleccion.size : seleccionados.size}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-medium">Importe total:</span>
                <span className="font-bold text-purple-600">{formatCurrency(importeTotalSeleccionado)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogConfirmacion(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmarFacturacion}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={procesando}
            >
              {procesando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirmar y Facturar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
