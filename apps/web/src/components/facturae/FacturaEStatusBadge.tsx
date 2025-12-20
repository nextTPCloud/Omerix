'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { IFacturaElectronica, EstadoFACE, ESTADO_FACE_LABELS, ESTADO_FACE_COLORS } from '@/types/facturae.types'
import { FileText, FileCheck, Send, AlertCircle, Clock, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface FacturaEStatusBadgeProps {
  facturaElectronica?: IFacturaElectronica
  compact?: boolean
}

export function FacturaEStatusBadge({ facturaElectronica, compact = false }: FacturaEStatusBadgeProps) {
  if (!facturaElectronica) {
    return compact ? null : (
      <Badge variant="outline" className="text-muted-foreground">
        <FileText className="mr-1 h-3 w-3" />
        No generada
      </Badge>
    )
  }

  // Determinar el estado principal
  let status: 'generada' | 'firmada' | 'enviada' | 'face' = 'generada'
  let icon = <FileText className="mr-1 h-3 w-3" />
  let badgeClass = 'bg-blue-100 text-blue-800'
  let label = 'Generada'
  let tooltip = ''

  if (facturaElectronica.enviadaFACE && facturaElectronica.estadoFACE) {
    status = 'face'
    label = ESTADO_FACE_LABELS[facturaElectronica.estadoFACE] || 'En FACE'
    badgeClass = ESTADO_FACE_COLORS[facturaElectronica.estadoFACE] || 'bg-purple-100 text-purple-800'
    icon = <Send className="mr-1 h-3 w-3" />
    tooltip = `Nº Registro: ${facturaElectronica.numeroRegistroFACE || 'N/A'}`
    if (facturaElectronica.ultimaConsulta) {
      tooltip += ` | Última consulta: ${formatDate(facturaElectronica.ultimaConsulta)}`
    }
  } else if (facturaElectronica.enviadaFACE) {
    status = 'enviada'
    label = 'Enviada a FACE'
    badgeClass = 'bg-purple-100 text-purple-800'
    icon = <Send className="mr-1 h-3 w-3" />
    tooltip = `Enviada: ${facturaElectronica.fechaEnvio ? formatDate(facturaElectronica.fechaEnvio) : 'N/A'}`
  } else if (facturaElectronica.firmada) {
    status = 'firmada'
    label = 'Firmada'
    badgeClass = 'bg-green-100 text-green-800'
    icon = <FileCheck className="mr-1 h-3 w-3" />
    tooltip = `Firmada: ${facturaElectronica.fechaFirma ? formatDate(facturaElectronica.fechaFirma) : 'N/A'}`
  } else if (facturaElectronica.generada) {
    status = 'generada'
    label = 'Generada'
    badgeClass = 'bg-blue-100 text-blue-800'
    icon = <FileText className="mr-1 h-3 w-3" />
    tooltip = `Generada: ${facturaElectronica.fechaGeneracion ? formatDate(facturaElectronica.fechaGeneracion) : 'N/A'}`
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${badgeClass}`}>
              {icon}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{label}</p>
            {tooltip && <p className="text-xs">{tooltip}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={badgeClass}>
            {icon}
            {label}
          </Badge>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

// Componente para mostrar el estado de FACE con icono adecuado
export function FACEStatusIcon({ estado }: { estado?: EstadoFACE }) {
  if (!estado) return null

  const iconMap: Record<EstadoFACE, JSX.Element> = {
    [EstadoFACE.REGISTRADA_REC]: <Clock className="h-4 w-4 text-blue-600" />,
    [EstadoFACE.REGISTRADA_RCF]: <Clock className="h-4 w-4 text-blue-600" />,
    [EstadoFACE.CONTABILIZADA]: <FileCheck className="h-4 w-4 text-indigo-600" />,
    [EstadoFACE.OBLIGACION_PAGO]: <FileCheck className="h-4 w-4 text-purple-600" />,
    [EstadoFACE.PAGADA]: <FileCheck className="h-4 w-4 text-green-600" />,
    [EstadoFACE.RECHAZADA]: <XCircle className="h-4 w-4 text-red-600" />,
    [EstadoFACE.ANULADA]: <XCircle className="h-4 w-4 text-gray-600" />,
    [EstadoFACE.PROPUESTA_PAGO]: <Clock className="h-4 w-4 text-yellow-600" />,
    [EstadoFACE.PAGO_REALIZADO]: <FileCheck className="h-4 w-4 text-green-600" />,
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {iconMap[estado] || <AlertCircle className="h-4 w-4 text-gray-400" />}
        </TooltipTrigger>
        <TooltipContent>
          <p>{ESTADO_FACE_LABELS[estado]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
