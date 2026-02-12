'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { crmService } from '@/services/crm.service'
import {
  Lead,
  EstadoLead,
  ESTADO_LEAD_LABELS,
  ESTADO_LEAD_COLORS,
  ORIGEN_LEAD_LABELS,
  INTERES_LEAD_LABELS,
  INTERES_LEAD_COLORS,
} from '@/types/crm.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreHorizontal,
  Phone,
  Mail,
  Building2,
  Globe,
  MapPin,
  Calendar,
  User,
  RefreshCw,
  UserCheck,
  Copy,
  ExternalLink,
  ArrowRightLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  const cargarLead = async () => {
    try {
      setIsLoading(true)
      const data = await crmService.getLeadById(params.id as string)
      setLead(data)
    } catch (error: any) {
      console.error('Error cargando lead:', error)
      toast.error('Error al cargar el lead')
      router.push('/crm/leads')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      cargarLead()
    }
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('¿Estas seguro de eliminar este lead?')) return

    try {
      await crmService.deleteLead(params.id as string)
      toast.success('Lead eliminado correctamente')
      router.push('/crm/leads')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    }
  }

  const handleDuplicar = async () => {
    try {
      const nuevoLead = await crmService.duplicarLead(params.id as string)
      toast.success('Lead duplicado')
      router.push(`/crm/leads/${nuevoLead._id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al duplicar')
    }
  }

  const handleCambiarEstado = async (estado: EstadoLead) => {
    try {
      await crmService.cambiarEstadoLead(params.id as string, estado)
      toast.success('Estado actualizado')
      cargarLead()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado')
    }
  }

  const handleConvertir = async () => {
    try {
      setIsConverting(true)
      const result = await crmService.convertirLead(params.id as string, {
        crearCliente: true,
        crearOportunidad: true,
      })
      toast.success('Lead convertido correctamente')
      setShowConvertDialog(false)

      if (result.oportunidadId) {
        router.push(`/crm/oportunidades/${result.oportunidadId}`)
      } else if (result.clienteId) {
        router.push(`/clientes/${result.clienteId}`)
      } else {
        cargarLead()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al convertir')
    } finally {
      setIsConverting(false)
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      
    )
  }

  if (!lead) {
    return (
      
        <div className="text-center py-12">
          <p className="text-gray-500">Lead no encontrado</p>
          <Link href="/crm/leads">
            <Button variant="link">Volver a leads</Button>
          </Link>
        </div>
      
    )
  }

  const isConvertido = lead.estado === EstadoLead.CONVERTIDO

  return (
      <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/crm/leads">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {lead.nombre} {lead.apellidos}
                </h1>
                <Badge
                  style={{
                    backgroundColor: `${ESTADO_LEAD_COLORS[lead.estado]}20`,
                    color: ESTADO_LEAD_COLORS[lead.estado],
                    borderColor: ESTADO_LEAD_COLORS[lead.estado],
                  }}
                  variant="outline"
                >
                  {ESTADO_LEAD_LABELS[lead.estado]}
                </Badge>
              </div>
              {lead.empresa && (
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {lead.empresa}
                  {lead.cargo && ` - ${lead.cargo}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isConvertido && (
              <Button variant="outline" onClick={() => setShowConvertDialog(true)}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Convertir
              </Button>
            )}
            <Link href={`/crm/leads/${lead._id}/editar`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicar}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!isConvertido && (
                  <>
                    <DropdownMenuItem onClick={() => handleCambiarEstado(EstadoLead.CONTACTADO)}>
                      Marcar como Contactado
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCambiarEstado(EstadoLead.CALIFICADO)}>
                      Marcar como Calificado
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCambiarEstado(EstadoLead.DESCALIFICADO)}>
                      Marcar como Descalificado
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info de conversion */}
        {isConvertido && lead.convertidoA && (
          <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <UserCheck className="h-5 w-5" />
              <span className="font-medium">Lead convertido</span>
            </div>
            <div className="mt-2 flex gap-4">
              {lead.convertidoA.clienteId && (
                <Link href={`/clientes/${lead.convertidoA.clienteId}`}>
                  <Button variant="link" size="sm" className="text-green-600">
                    Ver Cliente <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
              {lead.convertidoA.oportunidadId && (
                <Link href={`/crm/oportunidades/${lead.convertidoA.oportunidadId}`}>
                  <Button variant="link" size="sm" className="text-green-600">
                    Ver Oportunidad <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contacto */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Contacto</h2>
              <div className="space-y-3">
                {lead.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <a href={`mailto:${lead.email}`} className="hover:text-blue-600">
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.telefono && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a href={`tel:${lead.telefono}`} className="hover:text-blue-600">
                      {lead.telefono}
                    </a>
                  </div>
                )}
                {lead.movil && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a href={`tel:${lead.movil}`} className="hover:text-blue-600">
                      {lead.movil} (movil)
                    </a>
                  </div>
                )}
                {lead.web && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <a
                      href={lead.web.startsWith('http') ? lead.web : `https://${lead.web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600"
                    >
                      {lead.web}
                    </a>
                  </div>
                )}
                {lead.direccion && (lead.direccion.calle || lead.direccion.ciudad) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      {lead.direccion.calle && <p>{lead.direccion.calle}</p>}
                      <p>
                        {[lead.direccion.codigoPostal, lead.direccion.ciudad, lead.direccion.provincia]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {lead.direccion.pais && <p>{lead.direccion.pais}</p>}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Notas */}
            {lead.notas && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Notas</h2>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{lead.notas}</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Clasificacion CRM */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Clasificacion</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Origen</p>
                  <p className="font-medium">{ORIGEN_LEAD_LABELS[lead.origen]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Interes</p>
                  <Badge
                    style={{
                      backgroundColor: `${INTERES_LEAD_COLORS[lead.interes]}20`,
                      color: INTERES_LEAD_COLORS[lead.interes],
                    }}
                    variant="outline"
                  >
                    {INTERES_LEAD_LABELS[lead.interes]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Puntuacion</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${lead.puntuacion}%` }}
                      />
                    </div>
                    <span className="font-medium">{lead.puntuacion}</span>
                  </div>
                </div>
                {lead.proximoContacto && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Proximo Contacto</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="font-medium">
                        {format(new Date(lead.proximoContacto), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
                {lead.asignadoA && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Asignado a</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <p className="font-medium">{lead.asignadoA.nombre}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Metadatos */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Informacion</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Creado</span>
                  <span>{format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Actualizado</span>
                  <span>{format(new Date(lead.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                </div>
                {lead.creadoPor && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creado por</span>
                    <span>{lead.creadoPor.nombre}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Etiquetas */}
            {lead.etiquetas && lead.etiquetas.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Etiquetas</h2>
                <div className="flex flex-wrap gap-2">
                  {lead.etiquetas.map((etiqueta) => (
                    <Badge key={etiqueta} variant="secondary">
                      {etiqueta}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de conversion */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir Lead</DialogTitle>
            <DialogDescription>
              Al convertir este lead se creara un cliente y una oportunidad de venta.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              <strong>Lead:</strong> {lead.nombre} {lead.apellidos}
            </p>
            {lead.empresa && (
              <p className="text-sm text-gray-500">
                <strong>Empresa:</strong> {lead.empresa}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConvertir} disabled={isConverting}>
              {isConverting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Convertir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
  )
}
