'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { facturaEService } from '@/services/facturae.service'
import { IHistorialFacturaElectronica, IFacturaElectronica } from '@/types/facturae.types'
import {
  FileText,
  Shield,
  Send,
  Search,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
  Loader2,
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

interface FacturaEHistorialProps {
  facturaId: string
  facturaElectronica?: IFacturaElectronica
  onActualizarEstado?: () => void
}

type AccionHistorial = 'generada' | 'firmada' | 'enviada' | 'consultada' | 'rechazada' | 'anulada'

const ACCION_CONFIG: Record<AccionHistorial, { icon: typeof FileText; color: string; label: string }> = {
  generada: { icon: FileText, color: 'text-blue-600 bg-blue-100', label: 'Generada' },
  firmada: { icon: Shield, color: 'text-green-600 bg-green-100', label: 'Firmada' },
  enviada: { icon: Send, color: 'text-purple-600 bg-purple-100', label: 'Enviada a FACE' },
  consultada: { icon: Search, color: 'text-gray-600 bg-gray-100', label: 'Estado consultado' },
  rechazada: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Rechazada' },
  anulada: { icon: XCircle, color: 'text-gray-600 bg-gray-100', label: 'Anulada' },
}

export function FacturaEHistorial({
  facturaId,
  facturaElectronica,
  onActualizarEstado,
}: FacturaEHistorialProps) {
  const [historial, setHistorial] = useState<IHistorialFacturaElectronica[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isConsultando, setIsConsultando] = useState(false)

  useEffect(() => {
    if (facturaElectronica?.historial) {
      setHistorial(facturaElectronica.historial)
    }
  }, [facturaElectronica])

  const cargarHistorial = async () => {
    setIsLoading(true)
    try {
      const response = await facturaEService.getHistorialFACE(facturaId)
      if (response.success) {
        setHistorial(response.data)
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
      toast.error('Error al cargar el historial')
    } finally {
      setIsLoading(false)
    }
  }

  const consultarEstadoFACE = async () => {
    if (!facturaElectronica?.enviadaFACE) {
      toast.error('La factura no ha sido enviada a FACE')
      return
    }

    setIsConsultando(true)
    try {
      const response = await facturaEService.consultarEstadoFACE(facturaId)
      if (response.success && response.data.exito) {
        toast.success(`Estado FACE: ${response.data.estado?.descripcion || 'Desconocido'}`)
        onActualizarEstado?.()
        cargarHistorial()
      } else {
        toast.error(response.data.errores?.join(', ') || 'Error al consultar estado')
      }
    } catch (error) {
      console.error('Error consultando estado:', error)
      toast.error('Error al consultar el estado en FACE')
    } finally {
      setIsConsultando(false)
    }
  }

  if (!facturaElectronica?.generada) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factura Electrónica
          </CardTitle>
          <CardDescription>
            Esta factura no ha sido generada como factura electrónica
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Factura Electrónica
            </CardTitle>
            <CardDescription>
              Historial y estado de la factura electrónica
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {facturaElectronica.enviadaFACE && (
              <Button
                variant="outline"
                size="sm"
                onClick={consultarEstadoFACE}
                disabled={isConsultando}
              >
                {isConsultando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Consultar FACE
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={cargarHistorial} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Estado actual */}
        <div className="grid gap-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className={`rounded-full p-2 ${facturaElectronica.generada ? 'bg-green-100' : 'bg-gray-100'}`}>
                <FileText className={`h-4 w-4 ${facturaElectronica.generada ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Generada</p>
                <p className="font-medium">
                  {facturaElectronica.generada ? formatDate(facturaElectronica.fechaGeneracion!) : 'No'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`rounded-full p-2 ${facturaElectronica.firmada ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Shield className={`h-4 w-4 ${facturaElectronica.firmada ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Firmada</p>
                <p className="font-medium">
                  {facturaElectronica.firmada ? formatDate(facturaElectronica.fechaFirma!) : 'No'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`rounded-full p-2 ${facturaElectronica.enviadaFACE ? 'bg-purple-100' : 'bg-gray-100'}`}>
                <Send className={`h-4 w-4 ${facturaElectronica.enviadaFACE ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Enviada FACE</p>
                <p className="font-medium">
                  {facturaElectronica.enviadaFACE ? formatDate(facturaElectronica.fechaEnvio!) : 'No'}
                </p>
              </div>
            </div>
            {facturaElectronica.numeroRegistroFACE && (
              <div className="flex items-center gap-2">
                <div className="rounded-full p-2 bg-blue-100">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nº Registro FACE</p>
                  <p className="font-medium text-sm">{facturaElectronica.numeroRegistroFACE}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Historial */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historial de acciones
          </h4>
          <ScrollArea className="h-[250px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : historial.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay historial disponible
              </p>
            ) : (
              <div className="space-y-3">
                {historial
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .map((item, index) => {
                    const config = ACCION_CONFIG[item.accion] || ACCION_CONFIG.consultada
                    const Icon = config.icon

                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className={`rounded-full p-2 ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{config.label}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(item.fecha)}
                            </span>
                          </div>
                          {item.detalle && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.detalle}
                            </p>
                          )}
                          {item.usuarioNombre && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.usuarioNombre}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
