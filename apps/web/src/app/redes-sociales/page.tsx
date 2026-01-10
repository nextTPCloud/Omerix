'use client'

import { useState, useEffect, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { socialMediaService, SocialMediaAccount, Publicacion, ResumenSocialMedia } from '@/services/social-media.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Facebook,
  Instagram,
  Plus,
  RefreshCw,
  Send,
  Calendar,
  MessageCircle,
  Heart,
  Share2,
  Eye,
  TrendingUp,
  Users,
  Image,
  Video,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  ExternalLink,
  LayoutDashboard,
  FileText,
  UserCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function RedesSocialesPage() {
  const [cuentas, setCuentas] = useState<SocialMediaAccount[]>([])
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [resumen, setResumen] = useState<ResumenSocialMedia | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showNuevaPublicacion, setShowNuevaPublicacion] = useState(false)
  const [activeTab, setActiveTab] = useState('resumen')
  const [mesCalendario, setMesCalendario] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)

  // Formulario nueva publicación
  const [nuevaPublicacion, setNuevaPublicacion] = useState({
    cuentaId: '',
    tipo: 'imagen' as const,
    texto: '',
    hashtags: '',
    programarPara: '',
  })

  // Cargar datos
  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      const [cuentasData, publicacionesData, resumenData] = await Promise.all([
        socialMediaService.getCuentas(),
        socialMediaService.getPublicaciones({ limite: 20 }),
        socialMediaService.getResumen(),
      ])
      setCuentas(cuentasData)
      setPublicaciones(publicacionesData.publicaciones)
      setResumen(resumenData)
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar datos de redes sociales')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Conectar con Meta
  const conectarMeta = async () => {
    try {
      const { authUrl } = await socialMediaService.getMetaAuthUrl()
      window.location.href = authUrl
    } catch (error) {
      toast.error('Error al iniciar conexión con Meta')
    }
  }

  // Desconectar cuenta
  const desconectarCuenta = async (id: string) => {
    if (!confirm('¿Seguro que quieres desconectar esta cuenta?')) return

    try {
      await socialMediaService.desconectarCuenta(id)
      toast.success('Cuenta desconectada')
      cargarDatos()
    } catch (error) {
      toast.error('Error al desconectar cuenta')
    }
  }

  // Crear publicación
  const handleCrearPublicacion = async () => {
    if (!nuevaPublicacion.cuentaId || !nuevaPublicacion.texto) {
      toast.error('Selecciona una cuenta y escribe el contenido')
      return
    }

    try {
      const pub = await socialMediaService.crearPublicacion({
        cuentaId: nuevaPublicacion.cuentaId,
        tipo: nuevaPublicacion.tipo,
        texto: nuevaPublicacion.texto,
        hashtags: nuevaPublicacion.hashtags.split(' ').filter(h => h),
        programadaPara: nuevaPublicacion.programarPara || undefined,
      })

      toast.success('Publicación creada')
      setShowNuevaPublicacion(false)
      setNuevaPublicacion({ cuentaId: '', tipo: 'imagen', texto: '', hashtags: '', programarPara: '' })
      cargarDatos()
    } catch (error) {
      toast.error('Error al crear publicación')
    }
  }

  // Publicar ahora
  const publicarAhora = async (id: string) => {
    try {
      await socialMediaService.publicar(id)
      toast.success('Publicación enviada')
      cargarDatos()
    } catch (error) {
      toast.error('Error al publicar')
    }
  }

  // Días del calendario
  const diasCalendario = useMemo(() => {
    const inicioMes = startOfMonth(mesCalendario)
    const finMes = endOfMonth(mesCalendario)
    const inicioSemana = startOfWeek(inicioMes, { weekStartsOn: 1 }) // Lunes
    const finSemana = endOfWeek(finMes, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: inicioSemana, end: finSemana })
  }, [mesCalendario])

  // Publicaciones por día
  const publicacionesPorDia = useMemo(() => {
    const mapa: Record<string, Publicacion[]> = {}
    publicaciones.forEach(pub => {
      const fecha = pub.programadaPara || pub.publicadaEn || pub.createdAt
      if (fecha) {
        const key = format(new Date(fecha), 'yyyy-MM-dd')
        if (!mapa[key]) mapa[key] = []
        mapa[key].push(pub)
      }
    })
    return mapa
  }, [publicaciones])

  // Publicaciones del día seleccionado
  const publicacionesDiaSeleccionado = useMemo(() => {
    if (!diaSeleccionado) return []
    const key = format(diaSeleccionado, 'yyyy-MM-dd')
    return publicacionesPorDia[key] || []
  }, [diaSeleccionado, publicacionesPorDia])

  // Iconos de plataforma
  const getPlataformaIcon = (plataforma: string) => {
    return plataforma === 'facebook' ? (
      <Facebook className="h-5 w-5 text-blue-600" />
    ) : (
      <Instagram className="h-5 w-5 text-pink-600" />
    )
  }

  // Estado badge
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'publicada':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Publicada</Badge>
      case 'programada':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Programada</Badge>
      case 'borrador':
        return <Badge variant="outline">Borrador</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Share2 className="h-7 w-7 text-primary" />
              Redes Sociales
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus cuentas de Facebook e Instagram
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cargarDatos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Dialog open={showNuevaPublicacion} onOpenChange={setShowNuevaPublicacion}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva publicación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nueva publicación</DialogTitle>
                  <DialogDescription>
                    Crea y programa publicaciones para tus redes sociales
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Cuenta</Label>
                    <Select
                      value={nuevaPublicacion.cuentaId}
                      onValueChange={(v) => setNuevaPublicacion({ ...nuevaPublicacion, cuentaId: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecciona una cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {cuentas.map((cuenta) => (
                          <SelectItem key={cuenta._id} value={cuenta._id}>
                            <div className="flex items-center gap-2">
                              {getPlataformaIcon(cuenta.plataforma)}
                              {cuenta.nombre}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo de contenido</Label>
                    <Select
                      value={nuevaPublicacion.tipo}
                      onValueChange={(v) => setNuevaPublicacion({ ...nuevaPublicacion, tipo: v as any })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imagen"><Image className="h-4 w-4 mr-2 inline" />Imagen</SelectItem>
                        <SelectItem value="video"><Video className="h-4 w-4 mr-2 inline" />Video</SelectItem>
                        <SelectItem value="carrusel">Carrusel</SelectItem>
                        <SelectItem value="reel">Reel</SelectItem>
                        <SelectItem value="texto">Solo texto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Contenido</Label>
                    <Textarea
                      value={nuevaPublicacion.texto}
                      onChange={(e) => setNuevaPublicacion({ ...nuevaPublicacion, texto: e.target.value })}
                      placeholder="Escribe el contenido de tu publicación..."
                      rows={4}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {nuevaPublicacion.texto.length} caracteres
                    </p>
                  </div>

                  <div>
                    <Label>Hashtags</Label>
                    <Input
                      value={nuevaPublicacion.hashtags}
                      onChange={(e) => setNuevaPublicacion({ ...nuevaPublicacion, hashtags: e.target.value })}
                      placeholder="#marketing #negocios #emprendimiento"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Programar para</Label>
                    <Input
                      type="datetime-local"
                      value={nuevaPublicacion.programarPara}
                      onChange={(e) => setNuevaPublicacion({ ...nuevaPublicacion, programarPara: e.target.value })}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deja vacío para guardar como borrador
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNuevaPublicacion(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCrearPublicacion}>
                    {nuevaPublicacion.programarPara ? 'Programar' : 'Guardar borrador'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Contenido principal con tabs a ancho completo */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="resumen" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="cuentas" className="gap-2">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Cuentas</span>
            </TabsTrigger>
            <TabsTrigger value="publicaciones" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Publicaciones</span>
            </TabsTrigger>
            <TabsTrigger value="calendario" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendario</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Resumen */}
          <TabsContent value="resumen" className="mt-4">
            {resumen ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                      <p className="text-2xl font-bold">{resumen.cuentas}</p>
                      <p className="text-xs text-muted-foreground">Cuentas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Clock className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                      <p className="text-2xl font-bold">{resumen.publicacionesProgramadas}</p>
                      <p className="text-xs text-muted-foreground">Programadas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
                      <p className="text-2xl font-bold">{resumen.publicacionesHoy}</p>
                      <p className="text-xs text-muted-foreground">Hoy</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <MessageCircle className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                      <p className="text-2xl font-bold">{resumen.comentariosSinLeer}</p>
                      <p className="text-xs text-muted-foreground">Comentarios</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Send className="h-6 w-6 mx-auto text-cyan-500 mb-2" />
                      <p className="text-2xl font-bold">{resumen.mensajesSinLeer}</p>
                      <p className="text-xs text-muted-foreground">Mensajes</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Eye className="h-6 w-6 mx-auto text-indigo-500 mb-2" />
                      <p className="text-2xl font-bold">{(resumen.alcanceTotal / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-muted-foreground">Alcance</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Heart className="h-6 w-6 mx-auto text-red-500 mb-2" />
                      <p className="text-2xl font-bold">{(resumen.interaccionesTotal / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-muted-foreground">Interacciones</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-medium">Sin datos de resumen</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Conecta tus cuentas para ver estadísticas
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cuentas" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cuentas.map((cuenta) => (
                <Card key={cuenta._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {cuenta.avatarUrl ? (
                          <img
                            src={cuenta.avatarUrl}
                            alt={cuenta.nombre}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            {getPlataformaIcon(cuenta.plataforma)}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {cuenta.nombre}
                            {getPlataformaIcon(cuenta.plataforma)}
                          </CardTitle>
                          <CardDescription>@{cuenta.username}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={cuenta.estado === 'conectada' ? 'default' : 'destructive'}
                        className={cuenta.estado === 'conectada' ? 'bg-green-500' : ''}
                      >
                        {cuenta.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="font-bold">{cuenta.estadisticas?.seguidores?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">Seguidores</p>
                      </div>
                      <div>
                        <p className="font-bold">{cuenta.estadisticas?.siguiendo?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">Siguiendo</p>
                      </div>
                      <div>
                        <p className="font-bold">{cuenta.estadisticas?.publicaciones || 0}</p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => socialMediaService.sincronizarCuenta(cuenta._id).then(cargarDatos)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Sincronizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => desconectarCuenta(cuenta._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Añadir cuenta */}
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] py-8">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center gap-2">
                      <Facebook className="h-8 w-8 text-blue-600" />
                      <Instagram className="h-8 w-8 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-medium">Conectar cuenta</p>
                      <p className="text-sm text-muted-foreground">
                        Facebook o Instagram Business
                      </p>
                    </div>
                    <Button onClick={conectarMeta}>
                      <Plus className="h-4 w-4 mr-2" />
                      Conectar con Meta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="publicaciones" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {publicaciones.length === 0 ? (
                    <div className="p-12 text-center">
                      <Send className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="font-medium">No hay publicaciones</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Crea tu primera publicación
                      </p>
                    </div>
                  ) : (
                    publicaciones.map((pub) => (
                      <div key={pub._id} className="p-4 hover:bg-muted/30">
                        <div className="flex items-start gap-4">
                          {/* Media preview */}
                          <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            {pub.media[0]?.url ? (
                              <img
                                src={pub.media[0].thumbnailUrl || pub.media[0].url}
                                alt=""
                                className="w-full h-full object-cover rounded"
                              />
                            ) : pub.tipo === 'video' ? (
                              <Video className="h-6 w-6 text-muted-foreground" />
                            ) : (
                              <Image className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {typeof pub.cuentaId === 'object' && (
                                <>
                                  {getPlataformaIcon((pub.cuentaId as SocialMediaAccount).plataforma)}
                                  <span className="text-sm font-medium">
                                    {(pub.cuentaId as SocialMediaAccount).nombre}
                                  </span>
                                </>
                              )}
                              {getEstadoBadge(pub.estado)}
                            </div>
                            <p className="text-sm line-clamp-2">{pub.texto}</p>
                            {pub.hashtags.length > 0 && (
                              <p className="text-xs text-blue-500 mt-1">
                                {pub.hashtags.map(h => `#${h}`).join(' ')}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {pub.programadaPara && pub.estado === 'programada' && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(pub.programadaPara), 'dd MMM HH:mm', { locale: es })}
                                </span>
                              )}
                              {pub.publicadaEn && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  {format(new Date(pub.publicadaEn), 'dd MMM HH:mm', { locale: es })}
                                </span>
                              )}
                              {pub.estadisticas && (
                                <>
                                  <span className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" />
                                    {pub.estadisticas.likes}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="h-3 w-3" />
                                    {pub.estadisticas.comentarios}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {pub.estadisticas.alcance}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {pub.permalink && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={pub.permalink} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {(pub.estado === 'borrador' || pub.estado === 'error') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => publicarAhora(pub._id)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Publicar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendario" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Calendario */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {format(mesCalendario, 'MMMM yyyy', { locale: es })}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMesCalendario(subMonths(mesCalendario, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMesCalendario(new Date())}
                      >
                        Hoy
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMesCalendario(addMonths(mesCalendario, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Cabecera días semana */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                      <div
                        key={dia}
                        className="text-center text-xs font-medium text-muted-foreground py-2"
                      >
                        {dia}
                      </div>
                    ))}
                  </div>
                  {/* Días del mes */}
                  <div className="grid grid-cols-7 gap-1">
                    {diasCalendario.map((dia, idx) => {
                      const key = format(dia, 'yyyy-MM-dd')
                      const pubsDia = publicacionesPorDia[key] || []
                      const esHoy = isSameDay(dia, new Date())
                      const esSeleccionado = diaSeleccionado && isSameDay(dia, diaSeleccionado)
                      const esMesActual = isSameMonth(dia, mesCalendario)

                      return (
                        <button
                          key={idx}
                          onClick={() => setDiaSeleccionado(dia)}
                          className={`
                            relative min-h-[80px] p-1 border rounded-lg text-left transition-colors
                            ${esMesActual ? 'bg-background' : 'bg-muted/30 text-muted-foreground'}
                            ${esHoy ? 'border-primary' : 'border-border'}
                            ${esSeleccionado ? 'ring-2 ring-primary' : ''}
                            hover:bg-muted/50
                          `}
                        >
                          <span className={`
                            text-xs font-medium
                            ${esHoy ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}
                          `}>
                            {format(dia, 'd')}
                          </span>
                          {/* Indicadores de publicaciones */}
                          {pubsDia.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {pubsDia.slice(0, 3).map((pub, i) => (
                                <div
                                  key={i}
                                  className={`
                                    text-[10px] truncate px-1 py-0.5 rounded
                                    ${pub.estado === 'publicada' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : ''}
                                    ${pub.estado === 'programada' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200' : ''}
                                    ${pub.estado === 'borrador' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : ''}
                                    ${pub.estado === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : ''}
                                  `}
                                >
                                  {pub.texto?.substring(0, 15)}...
                                </div>
                              ))}
                              {pubsDia.length > 3 && (
                                <div className="text-[10px] text-muted-foreground px-1">
                                  +{pubsDia.length - 3} más
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Panel lateral: publicaciones del día seleccionado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {diaSeleccionado
                      ? format(diaSeleccionado, "d 'de' MMMM", { locale: es })
                      : 'Selecciona un día'}
                  </CardTitle>
                  <CardDescription>
                    {publicacionesDiaSeleccionado.length} publicación(es)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {publicacionesDiaSeleccionado.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No hay publicaciones</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {publicacionesDiaSeleccionado.map((pub) => (
                        <div key={pub._id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            {typeof pub.cuentaId === 'object' && (
                              getPlataformaIcon((pub.cuentaId as SocialMediaAccount).plataforma)
                            )}
                            {getEstadoBadge(pub.estado)}
                          </div>
                          <p className="text-sm line-clamp-3">{pub.texto}</p>
                          {pub.programadaPara && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(pub.programadaPara), 'HH:mm')}
                            </p>
                          )}
                          {(pub.estado === 'borrador' || pub.estado === 'error') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => publicarAhora(pub._id)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Publicar ahora
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
