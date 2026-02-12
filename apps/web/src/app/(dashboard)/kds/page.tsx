'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  comandasCocinaService,
  ComandaCocina,
  EstadoComanda,
  EstadisticasKDS,
} from '@/services/comandas-cocina.service'
import { zonasPreparacionService, ZonaPreparacion } from '@/services/zonas-preparacion.service'
import { toast } from 'sonner'
import {
  ChefHat,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Printer,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  RefreshCw,
  Users,
  Coffee,
  Truck,
  Package,
  UtensilsCrossed,
} from 'lucide-react'

// Colores de estado
const ESTADO_COLORS: Record<EstadoComanda, string> = {
  pendiente: 'bg-yellow-500',
  en_preparacion: 'bg-blue-500',
  parcial: 'bg-purple-500',
  listo: 'bg-green-500',
  servido: 'bg-gray-500',
  cancelado: 'bg-red-500',
}

// Iconos de tipo de servicio
const TIPO_SERVICIO_ICONS: Record<string, React.ReactNode> = {
  mesa: <UtensilsCrossed className="h-4 w-4" />,
  barra: <Coffee className="h-4 w-4" />,
  llevar: <Package className="h-4 w-4" />,
  delivery: <Truck className="h-4 w-4" />,
  recoger: <Users className="h-4 w-4" />,
}

export default function KDSPage() {
  const searchParams = useSearchParams()
  const audioRef = useRef<HTMLAudioElement>(null)

  // Estado
  const [zonas, setZonas] = useState<ZonaPreparacion[]>([])
  const [selectedZona, setSelectedZona] = useState<string>('')
  const [comandas, setComandas] = useState<ComandaCocina[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasKDS | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [columnas, setColumnas] = useState(4)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Cargar zonas de preparacion
  useEffect(() => {
    const loadZonas = async () => {
      try {
        const response = await zonasPreparacionService.getAll({ activo: true })
        setZonas(response.data)

        // Seleccionar zona de la URL o primera disponible
        const zonaIdFromUrl = searchParams.get('zona')
        if (zonaIdFromUrl) {
          setSelectedZona(zonaIdFromUrl)
        } else if (response.data.length > 0) {
          setSelectedZona(response.data[0]._id)
        }
      } catch (error: any) {
        toast.error('Error al cargar zonas: ' + error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadZonas()
  }, [searchParams])

  // Cargar comandas
  const loadComandas = useCallback(async () => {
    if (!selectedZona) return

    try {
      const [comandasRes, statsRes] = await Promise.all([
        comandasCocinaService.getForKDS(selectedZona, ['pendiente', 'en_preparacion', 'parcial']),
        comandasCocinaService.getEstadisticas(selectedZona),
      ])

      // Detectar nuevas comandas para sonido
      if (soundEnabled && comandas.length > 0) {
        const nuevasComandas = comandasRes.data.filter(
          (c) => !comandas.find((prev) => prev._id === c._id)
        )
        if (nuevasComandas.length > 0) {
          playSound()
        }
      }

      setComandas(comandasRes.data)
      setEstadisticas(statsRes.data)
      setLastUpdate(new Date())
    } catch (error: any) {
      console.error('Error cargando comandas:', error)
    }
  }, [selectedZona, soundEnabled, comandas])

  // Auto-refresh con SSE + polling fallback
  useEffect(() => {
    loadComandas()

    // SSE: conectar para recibir eventos en tiempo real
    let eventSource: EventSource | null = null
    if (selectedZona) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
        eventSource = new EventSource(`${baseUrl}/comandas-cocina/events/${selectedZona}`, {
          withCredentials: true,
        })

        eventSource.addEventListener('nueva-comanda', () => {
          loadComandas()
        })
        eventSource.addEventListener('comanda-actualizada', () => {
          loadComandas()
        })
        eventSource.onerror = () => {
          // Si falla SSE, se apoya en polling
          eventSource?.close()
          eventSource = null
        }
      } catch {
        // SSE no disponible, usa polling
      }
    }

    // Polling fallback (30s si hay SSE, 5s si no)
    let interval: NodeJS.Timeout | undefined
    if (autoRefresh) {
      const delay = eventSource ? 30000 : 5000
      interval = setInterval(loadComandas, delay)
    }

    return () => {
      eventSource?.close()
      if (interval) clearInterval(interval)
    }
  }, [loadComandas, autoRefresh, selectedZona])

  // Reproducir sonido
  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Marcar comanda como lista
  const handleMarcarLista = async (comanda: ComandaCocina) => {
    try {
      await comandasCocinaService.marcarLista(comanda._id)
      toast.success(`Comanda #${comanda.numeroComanda} marcada como lista`)
      loadComandas()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  // Marcar linea individual
  const handleMarcarLineaLista = async (comanda: ComandaCocina, lineaId: string) => {
    try {
      await comandasCocinaService.updateLinea(comanda._id, lineaId, 'listo')
      loadComandas()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  // Iniciar preparacion
  const handleIniciarPreparacion = async (comanda: ComandaCocina) => {
    try {
      await comandasCocinaService.update(comanda._id, { estado: 'en_preparacion' })
      loadComandas()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  // Reimprimir
  const handleReimprimir = async (comanda: ComandaCocina) => {
    try {
      await comandasCocinaService.reimprimir(comanda._id)
      toast.success('Comanda enviada a imprimir')
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  // Renderizar tarjeta de comanda
  const renderComanda = (comanda: ComandaCocina) => {
    const tiempoTranscurrido = comanda.tiempoTranscurrido || 0
    const estaRetrasada = comanda.estaRetrasada || false
    const esUrgente = comanda.prioridad === 'urgente'

    return (
      <Card
        key={comanda._id}
        className={`overflow-hidden ${
          esUrgente ? 'ring-2 ring-red-500 animate-pulse' : ''
        } ${estaRetrasada ? 'ring-2 ring-orange-500' : ''}`}
      >
        <CardHeader
          className={`py-3 px-4 ${ESTADO_COLORS[comanda.estado]} text-white`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">#{comanda.numeroComanda}</span>
              {TIPO_SERVICIO_ICONS[comanda.tipoServicio]}
              {comanda.numeroMesa && (
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Mesa {comanda.numeroMesa}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className={`font-mono ${estaRetrasada ? 'text-red-200' : ''}`}>
                {comandasCocinaService.formatTiempo(tiempoTranscurrido)}
              </span>
            </div>
          </div>

          {esUrgente && (
            <Badge variant="destructive" className="mt-2 w-fit">
              <AlertTriangle className="h-3 w-3 mr-1" />
              URGENTE
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* Lineas */}
          <div className="divide-y">
            {comanda.lineas.map((linea) => (
              <div
                key={linea._id}
                className={`p-3 flex items-start justify-between gap-2 ${
                  linea.estado === 'listo' ? 'bg-green-50 line-through opacity-50' : ''
                }`}
                onClick={() => {
                  if (linea.estado !== 'listo') {
                    handleMarcarLineaLista(comanda, linea._id)
                  }
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">
                      {linea.cantidad}x
                    </span>
                    <span className="font-medium">{linea.nombreProducto}</span>
                  </div>

                  {/* Modificadores */}
                  {linea.modificadores && linea.modificadores.length > 0 && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {linea.modificadores.map((m, i) => (
                        <span key={i} className="mr-2">
                          + {m.nombre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Alérgenos */}
                  {linea.alergenosNombres && linea.alergenosNombres.length > 0 && (
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {linea.alergenosNombres.map((n: string, i: number) => (
                        <span key={i} className="text-xs bg-red-100 text-red-700 px-1 rounded font-medium">
                          {n}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Comentario */}
                  {linea.comentario && (
                    <div className="mt-1 text-sm text-orange-600 font-medium">
                      "{linea.comentario}"
                    </div>
                  )}
                </div>

                {linea.estado === 'listo' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
            ))}
          </div>

          {/* Notas */}
          {comanda.notas && (
            <div className="p-3 bg-yellow-50 text-sm">
              <strong>Nota:</strong> {comanda.notas}
            </div>
          )}

          {/* Acciones */}
          <div className="p-3 flex gap-2 bg-gray-50">
            {comanda.estado === 'pendiente' && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleIniciarPreparacion(comanda)}
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            )}

            {(comanda.estado === 'en_preparacion' || comanda.estado === 'parcial') && (
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleMarcarLista(comanda)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Lista
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReimprimir(comanda)}
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Cargando KDS...</div>
      </div>
    )
  }

  if (zonas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No hay zonas de preparacion configuradas.
              Configura al menos una zona para usar el KDS.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Audio para notificaciones */}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ChefHat className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold">Kitchen Display System</h1>

            {/* Selector de zona */}
            <Select value={selectedZona} onValueChange={setSelectedZona}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
                <SelectValue placeholder="Seleccionar zona" />
              </SelectTrigger>
              <SelectContent>
                {zonas.map((zona) => (
                  <SelectItem key={zona._id} value={zona._id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: zona.color }}
                      />
                      {zona.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estadisticas */}
          {estadisticas && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Pendientes: {estadisticas.pendientes}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>En preparacion: {estadisticas.enPreparacion}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Listas: {estadisticas.listas}</span>
              </div>
              <div className="text-muted-foreground">
                Tiempo medio: {estadisticas.tiempoMedioPreparacion} min
              </div>
            </div>
          )}

          {/* Controles */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={loadComandas}
              title="Actualizar"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>

            <Select
              value={columnas.toString()}
              onValueChange={(v) => setColumnas(parseInt(v))}
            >
              <SelectTrigger className="w-20 bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 col</SelectItem>
                <SelectItem value="3">3 col</SelectItem>
                <SelectItem value="4">4 col</SelectItem>
                <SelectItem value="5">5 col</SelectItem>
                <SelectItem value="6">6 col</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Grid de comandas */}
      <main className="p-4">
        {comandas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-gray-500">
            <CheckCircle className="h-16 w-16 mb-4" />
            <p className="text-xl">No hay comandas pendientes</p>
            <p className="text-sm mt-2">
              Ultima actualizacion: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
            }}
          >
            {comandas.map(renderComanda)}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>KDS v1.0 - {zonas.find((z) => z._id === selectedZona)?.nombre}</span>
          <span>
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'} | Ultima actualizacion:{' '}
            {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </footer>
    </div>
  )
}
