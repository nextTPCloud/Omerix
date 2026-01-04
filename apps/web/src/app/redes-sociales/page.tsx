'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function RedesSocialesPage() {
  const [cuentas, setCuentas] = useState<SocialMediaAccount[]>([])
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [resumen, setResumen] = useState<ResumenSocialMedia | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showNuevaPublicacion, setShowNuevaPublicacion] = useState(false)

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

        {/* Resumen */}
        {resumen && (
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
        )}

        {/* Contenido principal */}
        <Tabs defaultValue="cuentas">
          <TabsList>
            <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
            <TabsTrigger value="publicaciones">Publicaciones</TabsTrigger>
            <TabsTrigger value="calendario">Calendario</TabsTrigger>
          </TabsList>

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
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium">Calendario de publicaciones</p>
              <p className="text-sm text-muted-foreground mt-1">
                Próximamente: Vista de calendario para planificar contenido
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
