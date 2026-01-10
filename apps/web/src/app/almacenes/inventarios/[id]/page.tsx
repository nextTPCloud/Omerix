'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  inventariosService,
  Inventario,
  EstadoInventario,
  LineaInventario,
  EstadoLineaInventario,
} from '@/services/inventarios.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  ArrowLeft,
  ClipboardList,
  Play,
  CheckCircle2,
  XCircle,
  Warehouse,
  Package,
  Search,
  RefreshCw,
  Save,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  X,
  FileCheck,
  Calendar,
  User,
  Barcode,
  Settings,
  Upload,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { useAudioFeedback } from '@/hooks/useAudioFeedback'
import { ImportadorInventario, LineaImportada } from '@/components/inventarios/ImportadorInventario'

export default function DetalleInventarioPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [inventario, setInventario] = useState<Inventario | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<'todos' | 'pendiente' | 'contado' | 'diferencias'>('todos')

  // Estado para conteo
  const [conteos, setConteos] = useState<Record<string, number>>({})
  const [savingConteo, setSavingConteo] = useState(false)

  // Estado para revisión
  const [revisiones, setRevisiones] = useState<Record<string, { aprobado: boolean; motivo: string }>>({})

  // Estado para diálogos
  const [showRegularizarDialog, setShowRegularizarDialog] = useState(false)
  const [showAnularDialog, setShowAnularDialog] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [observacionesRegularizacion, setObservacionesRegularizacion] = useState('')

  // Estado para modo escáner
  const [modoEscaner, setModoEscaner] = useState(false)
  const [configEscaner, setConfigEscaner] = useState({
    autoAdd: true,
    incrementarExistente: true,
    sonidoError: true,
    vozError: true,
  })
  const [ultimoEscaneado, setUltimoEscaneado] = useState<string | null>(null)

  // Estado para importador
  const [showImportador, setShowImportador] = useState(false)

  // Hook de audio feedback
  const { playSuccess, playError, speak, stopSpeaking } = useAudioFeedback({
    enabled: modoEscaner,
    voiceEnabled: configEscaner.vozError,
    voiceLang: 'es-ES',
  })

  // Función para manejar escaneo de código
  const handleScan = useCallback((codigo: string) => {
    if (!inventario || !puedeContarRef.current) return

    // Buscar producto por código o SKU
    const linea = inventario.lineas.find(l =>
      l.productoCodigo?.toLowerCase() === codigo.toLowerCase() ||
      l.productoSku?.toLowerCase() === codigo.toLowerCase()
    )

    if (linea) {
      playSuccess()
      setUltimoEscaneado(linea.productoNombre)

      if (configEscaner.autoAdd) {
        const actual = conteos[linea._id!] ?? linea.stockContado ?? 0
        const nuevoValor = configEscaner.incrementarExistente ? actual + 1 : 1
        setConteos(prev => ({ ...prev, [linea._id!]: nuevoValor }))
        toast.success(`${linea.productoNombre}: ${nuevoValor}`, { duration: 2000 })
      } else {
        // Solo mostrar que se encontró, sin añadir
        toast.info(`Encontrado: ${linea.productoNombre}`, { duration: 2000 })
      }
    } else {
      if (configEscaner.sonidoError) {
        playError()
      }
      if (configEscaner.vozError) {
        speak(`Producto no encontrado: ${codigo}`)
      }
      toast.error(`Producto no encontrado: ${codigo}`, { duration: 3000 })
      setUltimoEscaneado(null)
    }
  }, [inventario, conteos, configEscaner, playSuccess, playError, speak])

  // Ref para acceder al estado actual de puedeContar en el callback
  const puedeContarRef = { current: false }

  // Hook de escáner de código de barras
  useBarcodeScanner({
    enabled: modoEscaner,
    onScan: handleScan,
    bufferTimeout: 100,
    minLength: 3,
    captureInInputs: false,
  })

  useEffect(() => {
    if (id) {
      loadInventario()
    }
  }, [id])

  const loadInventario = async () => {
    setLoading(true)
    try {
      const res = await inventariosService.obtenerPorId(id)
      setInventario(res.data)

      // Inicializar conteos con valores actuales
      const conteosIniciales: Record<string, number> = {}
      const revisionesIniciales: Record<string, { aprobado: boolean; motivo: string }> = {}
      res.data.lineas.forEach(l => {
        if (l.stockContado !== null) {
          conteosIniciales[l._id!] = l.stockContado
        }
        if (l.diferencia !== 0) {
          revisionesIniciales[l._id!] = {
            aprobado: l.aprobado ?? true,
            motivo: l.motivoAjuste || ''
          }
        }
      })
      setConteos(conteosIniciales)
      setRevisiones(revisionesIniciales)
    } catch (error) {
      console.error('Error cargando inventario:', error)
      toast.error('Error al cargar el inventario')
      router.push('/almacenes/inventarios')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar líneas
  const lineasFiltradas = useMemo(() => {
    if (!inventario) return []

    return inventario.lineas.filter(linea => {
      // Filtro de búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        if (!linea.productoNombre.toLowerCase().includes(term) &&
            !linea.productoCodigo.toLowerCase().includes(term)) {
          return false
        }
      }

      // Filtro de estado
      if (filterEstado === 'pendiente' && linea.stockContado !== null) return false
      if (filterEstado === 'contado' && linea.stockContado === null) return false
      if (filterEstado === 'diferencias' && linea.diferencia === 0) return false

      return true
    })
  }, [inventario, searchTerm, filterEstado])

  // Estadísticas
  const stats = useMemo(() => {
    if (!inventario) return { pendientes: 0, contados: 0, diferencias: 0, porcentaje: 0 }

    const pendientes = inventario.lineas.filter(l => l.stockContado === null).length
    const contados = inventario.lineas.filter(l => l.stockContado !== null).length
    const diferencias = inventario.lineas.filter(l => l.diferencia !== 0).length
    const porcentaje = inventario.totalProductos > 0
      ? Math.round((contados / inventario.totalProductos) * 100)
      : 0

    return { pendientes, contados, diferencias, porcentaje }
  }, [inventario])

  const handleIniciar = async () => {
    setActionLoading(true)
    try {
      await inventariosService.iniciar(id)
      toast.success('Inventario iniciado correctamente')
      loadInventario()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar el inventario')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConteoChange = (lineaId: string, value: string) => {
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0) {
      setConteos(prev => ({ ...prev, [lineaId]: num }))
    } else if (value === '') {
      setConteos(prev => {
        const newConteos = { ...prev }
        delete newConteos[lineaId]
        return newConteos
      })
    }
  }

  const handleGuardarConteos = async () => {
    const lineasConConteo = Object.entries(conteos)
      .filter(([lineaId, stockContado]) => {
        const linea = inventario?.lineas.find(l => l._id === lineaId)
        return linea && linea.stockContado !== stockContado
      })
      .map(([lineaId, stockContado]) => ({
        lineaId,
        stockContado,
      }))

    if (lineasConConteo.length === 0) {
      toast.info('No hay cambios para guardar')
      return
    }

    setSavingConteo(true)
    try {
      await inventariosService.actualizarConteos(id, { lineas: lineasConConteo })
      toast.success(`${lineasConConteo.length} conteo(s) guardado(s)`)
      loadInventario()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar los conteos')
    } finally {
      setSavingConteo(false)
    }
  }

  const handleFinalizarConteo = async () => {
    setActionLoading(true)
    try {
      await inventariosService.finalizarConteo(id)
      toast.success('Conteo finalizado correctamente')
      loadInventario()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al finalizar el conteo')
    } finally {
      setActionLoading(false)
    }
  }

  const handleGuardarRevisiones = async () => {
    const lineasRevision = Object.entries(revisiones).map(([lineaId, { aprobado, motivo }]) => ({
      lineaId,
      aprobado,
      motivoAjuste: motivo || undefined,
    }))

    if (lineasRevision.length === 0) {
      toast.info('No hay diferencias para revisar')
      return
    }

    setActionLoading(true)
    try {
      await inventariosService.revisarDiferencias(id, { lineas: lineasRevision })
      toast.success('Revisiones guardadas correctamente')
      loadInventario()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar las revisiones')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRegularizar = async () => {
    setActionLoading(true)
    try {
      await inventariosService.regularizar(id, {
        observacionesRegularizacion: observacionesRegularizacion || undefined,
      })
      toast.success('Inventario regularizado correctamente')
      setShowRegularizarDialog(false)
      loadInventario()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al regularizar el inventario')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) {
      toast.error('El motivo de anulación es obligatorio')
      return
    }

    setActionLoading(true)
    try {
      await inventariosService.anular(id, motivoAnulacion)
      toast.success('Inventario anulado correctamente')
      setShowAnularDialog(false)
      loadInventario()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al anular el inventario')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-4">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-24" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    )
  }

  if (!inventario) return null

  const puedeIniciar = inventariosService.puedeIniciar(inventario.estado)
  const puedeContar = inventariosService.puedeContar(inventario.estado)
  const puedeRevisar = inventariosService.puedeRevisar(inventario.estado)
  const puedeRegularizar = inventariosService.puedeRegularizar(inventario.estado)
  const puedeAnular = inventariosService.puedeAnular(inventario.estado)

  // Actualizar ref para que el callback del escáner tenga acceso actualizado
  puedeContarRef.current = puedeContar

  // Manejar importación desde recolector de datos
  const handleBuscarProductoImport = async (codigo: string) => {
    // Buscar en las líneas del inventario
    const linea = inventario.lineas.find(l =>
      l.productoCodigo?.toLowerCase() === codigo.toLowerCase() ||
      l.productoSku?.toLowerCase() === codigo.toLowerCase()
    )
    if (linea) {
      return {
        _id: linea.productoId,
        nombre: linea.productoNombre,
        lineaId: linea._id,
      }
    }
    return null
  }

  const handleImportar = (lineasImportadas: LineaImportada[]) => {
    // Actualizar conteos con los datos importados
    const nuevosConteos = { ...conteos }
    lineasImportadas.forEach(linea => {
      if (linea.lineaId) {
        // Si incrementar existente, sumar; si no, reemplazar
        const actual = nuevosConteos[linea.lineaId] ?? 0
        nuevosConteos[linea.lineaId] = configEscaner.incrementarExistente
          ? actual + linea.cantidad
          : linea.cantidad
      }
    })
    setConteos(nuevosConteos)
    toast.success(`Importados ${lineasImportadas.length} conteos`)
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/almacenes/inventarios">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{inventario.codigo}</h1>
                <Badge variant={inventariosService.getEstadoVariant(inventario.estado)}>
                  {inventariosService.getEstadoLabel(inventario.estado)}
                </Badge>
                <Badge variant="outline">
                  {inventariosService.getTipoLabel(inventario.tipo)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {inventario.almacenNombre} • Creado el {formatDate(inventario.fechaCreacion)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {puedeIniciar && (
              <Button onClick={handleIniciar} disabled={actionLoading}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Conteo
              </Button>
            )}
            {puedeContar && (
              <Button onClick={handleFinalizarConteo} disabled={actionLoading || stats.pendientes > 0}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finalizar Conteo
              </Button>
            )}
            {puedeRegularizar && (
              <Button onClick={() => setShowRegularizarDialog(true)} disabled={actionLoading}>
                <FileCheck className="h-4 w-4 mr-2" />
                Regularizar
              </Button>
            )}
            {puedeAnular && (
              <Button variant="destructive" onClick={() => setShowAnularDialog(true)} disabled={actionLoading}>
                <XCircle className="h-4 w-4 mr-2" />
                Anular
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.porcentaje}%</div>
                  <div className="text-sm text-muted-foreground">Progreso</div>
                </div>
                <Progress value={stats.porcentaje} className="w-16 h-2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Package className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.pendientes}</div>
                  <div className="text-sm text-muted-foreground">Pendientes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.contados}</div>
                  <div className="text-sm text-muted-foreground">Contados</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.diferencias}</div>
                  <div className="text-sm text-muted-foreground">Con diferencias</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modo escáner y herramientas de conteo */}
        {puedeContar && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Toggle modo escáner */}
                <div className="flex items-center gap-3">
                  <Switch
                    id="modo-escaner"
                    checked={modoEscaner}
                    onCheckedChange={setModoEscaner}
                  />
                  <Label htmlFor="modo-escaner" className="flex items-center gap-2 cursor-pointer">
                    <Barcode className="h-4 w-4" />
                    Modo Escáner
                  </Label>
                </div>

                {/* Configuración del escáner - siempre visible */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Configuración del Escáner</SheetTitle>
                      <SheetDescription>
                        Ajusta el comportamiento al escanear códigos de barras
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Añadir automáticamente</Label>
                          <p className="text-xs text-muted-foreground">
                            Incrementar conteo al escanear
                          </p>
                        </div>
                        <Switch
                          checked={configEscaner.autoAdd}
                          onCheckedChange={(checked) =>
                            setConfigEscaner(prev => ({ ...prev, autoAdd: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Incrementar existente</Label>
                          <p className="text-xs text-muted-foreground">
                            Sumar al conteo actual (vs reemplazar)
                          </p>
                        </div>
                        <Switch
                          checked={configEscaner.incrementarExistente}
                          onCheckedChange={(checked) =>
                            setConfigEscaner(prev => ({ ...prev, incrementarExistente: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {configEscaner.sonidoError ? (
                            <Volume2 className="h-4 w-4" />
                          ) : (
                            <VolumeX className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <Label>Sonido de error</Label>
                            <p className="text-xs text-muted-foreground">
                              Beep cuando no se encuentra producto
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={configEscaner.sonidoError}
                          onCheckedChange={(checked) =>
                            setConfigEscaner(prev => ({ ...prev, sonidoError: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {configEscaner.vozError ? (
                            <Mic className="h-4 w-4" />
                          ) : (
                            <MicOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <Label>Mensaje de voz</Label>
                            <p className="text-xs text-muted-foreground">
                              Decir código cuando no existe
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={configEscaner.vozError}
                          onCheckedChange={(checked) =>
                            setConfigEscaner(prev => ({ ...prev, vozError: checked }))
                          }
                        />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="flex-1" />

                {/* Botón importar */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportador(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar CSV
                </Button>
              </div>

              {/* Indicador de modo escáner activo */}
              {modoEscaner && (
                <Alert className="mt-4 bg-primary/5 border-primary">
                  <Barcode className="h-4 w-4 animate-pulse" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      <strong>Modo Escáner Activo</strong> - Escanea códigos de barras para contar
                    </span>
                    {ultimoEscaneado && (
                      <Badge variant="secondary">
                        Último: {ultimoEscaneado}
                      </Badge>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resumen valoración */}
        {inventario.estado !== EstadoInventario.BORRADOR && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Valor Teórico</div>
                  <div className="text-xl font-bold">{formatCurrency(inventario.valorTeorico)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Valor Contado</div>
                  <div className="text-xl font-bold">{formatCurrency(inventario.valorContado)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Diferencia</div>
                  <div className={`text-xl font-bold ${
                    inventario.valorDiferencia > 0 ? 'text-green-600' :
                    inventario.valorDiferencia < 0 ? 'text-red-600' : ''
                  }`}>
                    {formatCurrency(inventario.valorDiferencia)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" /> Sobrantes
                  </div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(inventario.valorSobrante)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <TrendingDown className="h-3 w-3 text-red-600" /> Faltantes
                  </div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(inventario.valorFaltante)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla de productos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Productos ({lineasFiltradas.length})</CardTitle>
                <CardDescription>
                  {puedeContar ? 'Introduce las cantidades contadas para cada producto' :
                   puedeRevisar ? 'Revisa y aprueba las diferencias encontradas' :
                   'Lista de productos del inventario'}
                </CardDescription>
              </div>
              {puedeContar && (
                <Button onClick={handleGuardarConteos} disabled={savingConteo}>
                  {savingConteo ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Conteos
                    </>
                  )}
                </Button>
              )}
              {puedeRevisar && (
                <Button onClick={handleGuardarRevisiones} disabled={actionLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Revisiones
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterEstado === 'todos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterEstado('todos')}
                >
                  Todos
                </Button>
                <Button
                  variant={filterEstado === 'pendiente' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterEstado('pendiente')}
                >
                  Pendientes
                </Button>
                <Button
                  variant={filterEstado === 'contado' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterEstado('contado')}
                >
                  Contados
                </Button>
                <Button
                  variant={filterEstado === 'diferencias' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterEstado('diferencias')}
                >
                  Diferencias
                </Button>
              </div>
            </div>

            {/* Tabla */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Teórico</TableHead>
                    <TableHead className="text-center w-[120px]">Contado</TableHead>
                    <TableHead className="text-center">Diferencia</TableHead>
                    <TableHead className="text-right">Valor Dif.</TableHead>
                    {puedeRevisar && <TableHead className="text-center">Aprobar</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineasFiltradas.map((linea) => (
                    <TableRow key={linea._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{linea.productoNombre}</div>
                          <div className="text-xs text-muted-foreground">{linea.productoCodigo}</div>
                          {linea.ubicacion && (
                            <div className="text-xs text-muted-foreground">Ubic: {linea.ubicacion}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {linea.stockTeorico}
                      </TableCell>
                      <TableCell>
                        {puedeContar ? (
                          <Input
                            type="number"
                            min="0"
                            value={conteos[linea._id!] ?? ''}
                            onChange={(e) => handleConteoChange(linea._id!, e.target.value)}
                            className="w-full text-center"
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-center">
                            {linea.stockContado !== null ? linea.stockContado : '-'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {linea.stockContado !== null ? (
                          <Badge variant={
                            linea.diferencia > 0 ? 'default' :
                            linea.diferencia < 0 ? 'destructive' : 'secondary'
                          }>
                            {linea.diferencia > 0 && '+'}
                            {linea.diferencia}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={
                          linea.valorDiferencia > 0 ? 'text-green-600' :
                          linea.valorDiferencia < 0 ? 'text-red-600' : ''
                        }>
                          {formatCurrency(linea.valorDiferencia)}
                        </span>
                      </TableCell>
                      {puedeRevisar && linea.diferencia !== 0 && (
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant={revisiones[linea._id!]?.aprobado ? 'default' : 'outline'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setRevisiones(prev => ({
                                ...prev,
                                [linea._id!]: { ...prev[linea._id!], aprobado: true }
                              }))}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={revisiones[linea._id!]?.aprobado === false ? 'destructive' : 'outline'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setRevisiones(prev => ({
                                ...prev,
                                [linea._id!]: { ...prev[linea._id!], aprobado: false }
                              }))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      {puedeRevisar && linea.diferencia === 0 && (
                        <TableCell className="text-center text-muted-foreground">-</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo Regularizar */}
      <Dialog open={showRegularizarDialog} onOpenChange={setShowRegularizarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regularizar Inventario</DialogTitle>
            <DialogDescription>
              Esta acción aplicará los ajustes de stock aprobados y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Diferencias aprobadas:</span>
                  <span className="ml-2 font-medium">
                    {Object.values(revisiones).filter(r => r.aprobado).length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor a ajustar:</span>
                  <span className="ml-2 font-medium">{formatCurrency(inventario.valorDiferencia)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={observacionesRegularizacion}
                onChange={(e) => setObservacionesRegularizacion(e.target.value)}
                placeholder="Observaciones de regularización..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegularizarDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegularizar} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Regularizando...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Regularizar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Anular */}
      <Dialog open={showAnularDialog} onOpenChange={setShowAnularDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Inventario</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-700">
                Al anular el inventario no se aplicarán ajustes al stock.
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo de anulación *</Label>
              <Textarea
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Indique el motivo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnularDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleAnular}
              disabled={actionLoading || !motivoAnulacion.trim()}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Anulando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Anular
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Importador de datos */}
      <ImportadorInventario
        open={showImportador}
        onOpenChange={setShowImportador}
        onBuscarProducto={handleBuscarProductoImport}
        onImportar={handleImportar}
      />
    </DashboardLayout>
  )
}
