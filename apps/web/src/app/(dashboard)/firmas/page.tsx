'use client'

import { useState, useEffect, useMemo } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { firmasService } from '@/services/firmas.service'
import { ISolicitudFirma } from '@/types/firma.types'
import { toast } from 'sonner'
import {
  Fingerprint,
  RefreshCw,
  MoreHorizontal,
  Mail,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  XCircle,
} from 'lucide-react'

const ESTADOS_SOLICITUD = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'completa', label: 'Completa' },
  { value: 'expirada', label: 'Expirada' },
  { value: 'cancelada', label: 'Cancelada' },
]

const TIPOS_DOCUMENTO = [
  { value: '', label: 'Todos los tipos' },
  { value: 'albaran', label: 'Albarán' },
  { value: 'factura', label: 'Factura' },
  { value: 'parteTrabajo', label: 'Parte de Trabajo' },
  { value: 'presupuesto', label: 'Presupuesto' },
  { value: 'pedido', label: 'Pedido' },
]

function getEstadoBadge(estado: string) {
  switch (estado) {
    case 'pendiente':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
    case 'parcial':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Fingerprint className="h-3 w-3 mr-1" />Parcial</Badge>
    case 'completa':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Completa</Badge>
    case 'expirada':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />Expirada</Badge>
    case 'cancelada':
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>
    default:
      return <Badge variant="outline">{estado}</Badge>
  }
}

function getFirmanteBadge(estado: string) {
  switch (estado) {
    case 'firmado':
      return <Badge className="bg-green-100 text-green-800 text-xs">Firmado</Badge>
    case 'pendiente':
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendiente</Badge>
    case 'rechazado':
      return <Badge className="bg-red-100 text-red-800 text-xs">Rechazado</Badge>
    case 'expirado':
      return <Badge className="bg-gray-100 text-gray-800 text-xs">Expirado</Badge>
    default:
      return <Badge variant="outline" className="text-xs">{estado}</Badge>
  }
}

function getTipoDocLabel(tipo: string) {
  const labels: Record<string, string> = {
    albaran: 'Albarán',
    factura: 'Factura',
    parteTrabajo: 'Parte de Trabajo',
    presupuesto: 'Presupuesto',
    pedido: 'Pedido',
  }
  return labels[tipo] || tipo
}

export default function FirmasPage() {
  const [solicitudes, setSolicitudes] = useState<ISolicitudFirma[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const loadSolicitudes = async () => {
    setLoading(true)
    try {
      const filtros: any = {}
      if (filtroEstado) filtros.estado = filtroEstado
      if (filtroTipo) filtros.tipoDocumento = filtroTipo
      const response = await firmasService.getSolicitudes(filtros)
      if (response.success && response.data) {
        setSolicitudes(response.data)
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error)
      toast.error('Error al cargar solicitudes de firma')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSolicitudes()
  }, [filtroEstado, filtroTipo])

  const solicitudesFiltradas = useMemo(() => {
    if (!busqueda) return solicitudes
    const q = busqueda.toLowerCase()
    return solicitudes.filter(s =>
      s.codigoDocumento?.toLowerCase().includes(q) ||
      s.firmantes.some(f => f.nombre?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q))
    )
  }, [solicitudes, busqueda])

  const stats = useMemo(() => ({
    total: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    parciales: solicitudes.filter(s => s.estado === 'parcial').length,
    completas: solicitudes.filter(s => s.estado === 'completa').length,
    expiradas: solicitudes.filter(s => s.estado === 'expirada').length,
  }), [solicitudes])

  const handleReenviar = async (solicitudId: string, firmanteIndex: number) => {
    try {
      const res = await firmasService.reenviarNotificacion(solicitudId, firmanteIndex)
      if (res.success) {
        toast.success('Notificación reenviada')
      } else {
        toast.error(res.error || 'Error al reenviar')
      }
    } catch {
      toast.error('Error al reenviar notificación')
    }
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Solicitudes de Firma</h1>
            <p className="text-muted-foreground">Gestiona las solicitudes de firma digital de tus documentos</p>
          </div>
          <Button variant="outline" onClick={loadSolicitudes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-blue-600">{stats.parciales}</div>
              <p className="text-xs text-muted-foreground">Parciales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-green-600">{stats.completas}</div>
              <p className="text-xs text-muted-foreground">Completas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-red-600">{stats.expiradas}</div>
              <p className="text-xs text-muted-foreground">Expiradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por documento o firmante..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filtroEstado || '_all'} onValueChange={(v) => setFiltroEstado(v === '_all' ? '' : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_SOLICITUD.map(e => (
                    <SelectItem key={e.value || '_all'} value={e.value || '_all'}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroTipo || '_all'} onValueChange={(v) => setFiltroTipo(v === '_all' ? '' : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo documento" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO.map(t => (
                    <SelectItem key={t.value || '_all'} value={t.value || '_all'}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin" />
              Cargando solicitudes...
            </CardContent>
          </Card>
        ) : solicitudesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Fingerprint className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No hay solicitudes de firma</p>
              <p className="text-sm">Las solicitudes aparecerán aquí cuando solicites firmas desde un documento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {solicitudesFiltradas.map((solicitud) => (
              <Card key={solicitud._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">{solicitud.codigoDocumento}</span>
                        <Badge variant="secondary" className="text-xs">{getTipoDocLabel(solicitud.tipoDocumento)}</Badge>
                        {getEstadoBadge(solicitud.estado)}
                      </div>

                      {/* Firmantes */}
                      <div className="ml-7 space-y-1.5">
                        {solicitud.firmantes.map((firmante, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground min-w-[120px] truncate">{firmante.nombre}</span>
                            {firmante.email && (
                              <span className="text-xs text-muted-foreground truncate">{firmante.email}</span>
                            )}
                            {getFirmanteBadge(firmante.estado)}
                            {firmante.firmadoEn && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(firmante.firmadoEn).toLocaleDateString('es-ES')}
                              </span>
                            )}
                            {firmante.estado === 'pendiente' && firmante.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleReenviar(solicitud._id, idx)}
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                Reenviar
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <span>Creado: {new Date(solicitud.createdAt).toLocaleDateString('es-ES')}</span>
                      <span>Expira: {new Date(solicitud.fechaExpiracion).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    
  )
}
