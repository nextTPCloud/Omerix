'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { firmasService } from '@/services/firmas.service'
import { IFirma } from '@/types/firma.types'
import { SolicitarFirmaModal } from './SolicitarFirmaModal'
import {
  Fingerprint,
  PenTool,
  ShieldCheck,
  Clock,
  Send,
} from 'lucide-react'

interface FirmasDocumentoProps {
  tipoDocumento: string
  documentoId: string
  codigoDocumento: string
}

export function FirmasDocumento({ tipoDocumento, documentoId, codigoDocumento }: FirmasDocumentoProps) {
  const [firmas, setFirmas] = useState<IFirma[]>([])
  const [loading, setLoading] = useState(true)
  const [showSolicitar, setShowSolicitar] = useState(false)

  const loadFirmas = async () => {
    try {
      const res = await firmasService.getFirmasDocumento(tipoDocumento, documentoId)
      if (res.success && res.data) {
        setFirmas(res.data)
      }
    } catch (error) {
      console.error('Error cargando firmas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFirmas()
  }, [tipoDocumento, documentoId])

  const getTipoFirmaIcon = (tipo: string) => {
    switch (tipo) {
      case 'manuscrita':
      case 'remota_manuscrita':
        return <PenTool className="h-4 w-4 text-blue-600" />
      case 'certificado_digital':
        return <ShieldCheck className="h-4 w-4 text-green-600" />
      default:
        return <Fingerprint className="h-4 w-4" />
    }
  }

  const getTipoFirmaLabel = (tipo: string) => {
    switch (tipo) {
      case 'manuscrita': return 'Manuscrita'
      case 'remota_manuscrita': return 'Manuscrita remota'
      case 'certificado_digital': return 'Certificado digital'
      default: return tipo
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Firmas
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSolicitar(true)}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Solicitar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : firmas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay firmas registradas</p>
          ) : (
            <div className="space-y-3">
              {firmas.map((firma) => (
                <div key={firma._id} className="flex items-start gap-3 p-2 rounded-lg border bg-muted/30">
                  {/* Miniatura de firma o icono */}
                  <div className="flex-shrink-0 mt-0.5">
                    {firma.tipo !== 'certificado_digital' && firma.imagenFirma ? (
                      <div className="w-16 h-10 border rounded bg-white overflow-hidden">
                        <img
                          src={firma.imagenFirma}
                          alt="Firma"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 border rounded bg-white flex items-center justify-center">
                        {getTipoFirmaIcon(firma.tipo)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{firma.firmante.nombre}</span>
                      <Badge variant="outline" className="text-xs">
                        {getTipoFirmaLabel(firma.tipo)}
                      </Badge>
                    </div>
                    {firma.firmante.nif && (
                      <p className="text-xs text-muted-foreground">NIF: {firma.firmante.nif}</p>
                    )}
                    {firma.certificadoInfo && (
                      <p className="text-xs text-muted-foreground">
                        Cert: {firma.certificadoInfo.emisor}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(firma.timestamp || firma.createdAt).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SolicitarFirmaModal
        tipoDocumento={tipoDocumento}
        documentoId={documentoId}
        codigoDocumento={codigoDocumento}
        open={showSolicitar}
        onClose={() => setShowSolicitar(false)}
        onCreated={loadFirmas}
      />
    </>
  )
}
