'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Mic,
  MicOff,
  FileText,
  BarChart3,
  Table,
  LayoutGrid,
  Star,
  StarOff,
  MoreVertical,
  Copy,
  Trash2,
  Play,
  Download,
  TrendingUp,
  ShoppingCart,
  Package,
  Wallet,
  Users,
  UserCheck,
  Truck,
  Briefcase,
  LayoutDashboard,
  Loader2,
  Sparkles,
  Send,
} from 'lucide-react'
import {
  listarInformes,
  eliminarInforme,
  duplicarInforme,
  toggleFavorito,
  generarInformeConIA,
  obtenerSugerenciasIA,
  inicializarPlantillas,
  IInforme,
  ModuloInforme,
  TipoInforme,
  MODULOS_INFO,
  TIPOS_INFORME_INFO,
  getModuloInfo,
} from '@/services/informes.service'
import { useLicense } from '@/hooks/useLicense'

// Mapeo de módulos de informes a módulos del plan
const MODULO_TO_PLAN: Record<ModuloInforme, string | null> = {
  [ModuloInforme.VENTAS]: 'ventas',
  [ModuloInforme.COMPRAS]: 'compras',
  [ModuloInforme.STOCK]: 'almacen',
  [ModuloInforme.TESORERIA]: 'tesoreria',
  [ModuloInforme.PERSONAL]: 'rrhh',
  [ModuloInforme.CLIENTES]: 'clientes',
  [ModuloInforme.PROVEEDORES]: 'proveedores',
  [ModuloInforme.PROYECTOS]: 'proyectos',
  [ModuloInforme.GENERAL]: null, // Siempre disponible
}

// Iconos por módulo
const ICONOS_MODULO: Record<string, React.ReactNode> = {
  [ModuloInforme.VENTAS]: <TrendingUp className="h-4 w-4" />,
  [ModuloInforme.COMPRAS]: <ShoppingCart className="h-4 w-4" />,
  [ModuloInforme.STOCK]: <Package className="h-4 w-4" />,
  [ModuloInforme.TESORERIA]: <Wallet className="h-4 w-4" />,
  [ModuloInforme.PERSONAL]: <Users className="h-4 w-4" />,
  [ModuloInforme.CLIENTES]: <UserCheck className="h-4 w-4" />,
  [ModuloInforme.PROVEEDORES]: <Truck className="h-4 w-4" />,
  [ModuloInforme.PROYECTOS]: <Briefcase className="h-4 w-4" />,
  [ModuloInforme.GENERAL]: <LayoutDashboard className="h-4 w-4" />,
}

// Iconos por tipo
const ICONOS_TIPO: Record<string, React.ReactNode> = {
  [TipoInforme.TABLA]: <Table className="h-4 w-4" />,
  [TipoInforme.GRAFICO]: <BarChart3 className="h-4 w-4" />,
  [TipoInforme.MIXTO]: <LayoutGrid className="h-4 w-4" />,
}

export default function InformesPage() {
  const router = useRouter()
  const { hasModule } = useLicense()
  const [informes, setInformes] = useState<IInforme[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [moduloActivo, setModuloActivo] = useState<ModuloInforme | 'todos'>('todos')
  const [soloFavoritos, setSoloFavoritos] = useState(false)

  // Filtrar módulos disponibles según el plan
  const modulosDisponibles = useMemo(() => {
    return Object.values(ModuloInforme).filter((modulo) => {
      const planModulo = MODULO_TO_PLAN[modulo]
      // Si no requiere módulo del plan (GENERAL), siempre disponible
      if (planModulo === null) return true
      // Verificar si tiene el módulo en el plan
      return hasModule(planModulo)
    })
  }, [hasModule])

  // Filtrar informes según módulos disponibles (para la pestaña "Todos")
  const informesFiltrados = useMemo(() => {
    if (moduloActivo !== 'todos') return informes
    return informes.filter((informe) => modulosDisponibles.includes(informe.modulo))
  }, [informes, moduloActivo, modulosDisponibles])

  // Resetear módulo activo si ya no está disponible
  useEffect(() => {
    if (moduloActivo !== 'todos' && !modulosDisponibles.includes(moduloActivo as ModuloInforme)) {
      setModuloActivo('todos')
    }
  }, [modulosDisponibles, moduloActivo])

  // Estado para el modal de IA
  const [showIAModal, setShowIAModal] = useState(false)
  const [comandoIA, setComandoIA] = useState('')
  const [procesandoIA, setProcesandoIA] = useState(false)
  const [sugerenciasIA, setSugerenciasIA] = useState<string[]>([])
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  // Estado para modal de confirmación de eliminación
  const [informeAEliminar, setInformeAEliminar] = useState<IInforme | null>(null)

  // Cargar informes
  const cargarInformes = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (moduloActivo !== 'todos') params.modulo = moduloActivo
      if (soloFavoritos) params.favorito = true
      if (busqueda) params.busqueda = busqueda

      const result = await listarInformes(params)
      setInformes(result.data)
    } catch (error) {
      console.error('Error cargando informes:', error)
      toast.error('Error al cargar los informes')
    } finally {
      setLoading(false)
    }
  }, [moduloActivo, soloFavoritos, busqueda])

  useEffect(() => {
    cargarInformes()
  }, [cargarInformes])

  // Cargar sugerencias de IA
  useEffect(() => {
    const cargarSugerencias = async () => {
      try {
        const sugerencias = await obtenerSugerenciasIA()
        setSugerenciasIA(sugerencias)
      } catch (error) {
        console.error('Error cargando sugerencias:', error)
      }
    }
    cargarSugerencias()
  }, [])

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'es-ES'

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setComandoIA(transcript)
        setIsListening(false)
      }

      recognitionInstance.onerror = () => {
        setIsListening(false)
        toast.error('Error en el reconocimiento de voz')
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  // Toggle escucha de voz
  const toggleListening = () => {
    if (!recognition) {
      toast.error('El reconocimiento de voz no está disponible en este navegador')
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  // Procesar comando de IA
  const procesarComandoIA = async () => {
    if (!comandoIA.trim()) {
      toast.error('Escribe o dicta un comando')
      return
    }

    setProcesandoIA(true)
    try {
      const resultado = await generarInformeConIA(comandoIA, true)
      toast.success('Informe generado correctamente')
      setShowIAModal(false)
      setComandoIA('')

      // Navegar al visor con los datos
      if (resultado.definicion) {
        // Guardar en sessionStorage para recuperar en el visor
        sessionStorage.setItem('informeIA', JSON.stringify(resultado))
        router.push('/informes/nuevo?modo=ia')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al generar el informe')
    } finally {
      setProcesandoIA(false)
    }
  }

  // Handlers
  const handleToggleFavorito = async (informe: IInforme, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await toggleFavorito(informe._id)
      cargarInformes()
    } catch (error) {
      toast.error('Error al actualizar favorito')
    }
  }

  const handleDuplicar = async (informe: IInforme) => {
    try {
      await duplicarInforme(informe._id)
      toast.success('Informe duplicado')
      cargarInformes()
    } catch (error) {
      toast.error('Error al duplicar el informe')
    }
  }

  const handleEliminar = async () => {
    if (!informeAEliminar) return
    try {
      await eliminarInforme(informeAEliminar._id)
      toast.success('Informe eliminado')
      setInformeAEliminar(null)
      cargarInformes()
    } catch (error) {
      toast.error('Error al eliminar el informe')
    }
  }

  const handleInicializarPlantillas = async () => {
    try {
      await inicializarPlantillas()
      toast.success('Plantillas inicializadas')
      cargarInformes()
    } catch (error) {
      toast.error('Error al inicializar plantillas')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Informes</h1>
            <p className="text-muted-foreground">
              Crea y visualiza informes personalizados de tu negocio
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowIAModal(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Comando por voz
            </Button>
            <Button onClick={() => router.push('/informes/nuevo')} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Informe
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar informes..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant={soloFavoritos ? 'default' : 'outline'}
            onClick={() => setSoloFavoritos(!soloFavoritos)}
            className="gap-2"
          >
            <Star className="h-4 w-4" />
            Favoritos
          </Button>
        </div>

        {/* Tabs por módulo (filtrados según plan) */}
        <Tabs value={moduloActivo} onValueChange={(v) => setModuloActivo(v as any)}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="todos" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Todos
            </TabsTrigger>
            {modulosDisponibles.map((modulo) => (
              <TabsTrigger key={modulo} value={modulo} className="gap-2">
                {ICONOS_MODULO[modulo]}
                {getModuloInfo(modulo).label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={moduloActivo} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : informesFiltrados.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay informes</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Crea tu primer informe o usa el comando por voz para generar uno automáticamente
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleInicializarPlantillas}>
                      Cargar plantillas
                    </Button>
                    <Button onClick={() => setShowIAModal(true)} className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Usar IA
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {informesFiltrados.map((informe) => (
                  <Card
                    key={informe._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/informes/${informe._id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${getModuloInfo(informe.modulo).color} text-white`}>
                            {ICONOS_MODULO[informe.modulo] || <FileText className="h-4 w-4" />}
                          </div>
                          <div>
                            <CardTitle className="text-base">{informe.nombre}</CardTitle>
                            <CardDescription className="text-xs">
                              {getModuloInfo(informe.modulo).label}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleToggleFavorito(informe, e)}
                          >
                            {informe.favorito ? (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <StarOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/informes/${informe._id}`)}>
                                <Play className="h-4 w-4 mr-2" />
                                Ejecutar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/informes/${informe._id}/editar`)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicar(informe)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setInformeAEliminar(informe)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {informe.descripcion && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {informe.descripcion}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="gap-1">
                          {ICONOS_TIPO[informe.tipo]}
                          {TIPOS_INFORME_INFO[informe.tipo].label}
                        </Badge>
                        {informe.esPlantilla && (
                          <Badge variant="outline">Plantilla</Badge>
                        )}
                        {informe.compartido && (
                          <Badge variant="outline">Compartido</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de IA */}
      <Dialog open={showIAModal} onOpenChange={setShowIAModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generar Informe con IA
            </DialogTitle>
            <DialogDescription>
              Describe el informe que necesitas en lenguaje natural o usa el micrófono para dictarlo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ej: Muéstrame los clientes que más han comprado este año..."
                value={comandoIA}
                onChange={(e) => setComandoIA(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && procesarComandoIA()}
                disabled={procesandoIA}
                className="flex-1"
              />
              <Button
                variant={isListening ? 'destructive' : 'outline'}
                size="icon"
                onClick={toggleListening}
                disabled={procesandoIA}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>

            {isListening && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                Escuchando...
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Sugerencias:</p>
              <div className="flex flex-wrap gap-2">
                {sugerenciasIA.slice(0, 6).map((sugerencia, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setComandoIA(sugerencia)}
                    disabled={procesandoIA}
                    className="text-xs"
                  >
                    {sugerencia}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIAModal(false)} disabled={procesandoIA}>
              Cancelar
            </Button>
            <Button onClick={procesarComandoIA} disabled={procesandoIA || !comandoIA.trim()}>
              {procesandoIA ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generar Informe
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={!!informeAEliminar} onOpenChange={() => setInformeAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Informe</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el informe &quot;{informeAEliminar?.nombre}&quot;?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInformeAEliminar(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminar}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
