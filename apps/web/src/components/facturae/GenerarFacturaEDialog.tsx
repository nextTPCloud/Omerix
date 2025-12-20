'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { facturaEService } from '@/services/facturae.service'
import { ICertificadoInfo, IVerificacionRequisitos } from '@/types/facturae.types'
import {
  FileText,
  Shield,
  Send,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface GenerarFacturaEDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  facturaId: string
  facturaNumero: string
  onSuccess?: () => void
  // Estado actual de la factura electrónica
  yaGenerada?: boolean
  yaFirmada?: boolean
  yaEnviada?: boolean
}

type Paso = 'verificar' | 'generar' | 'firmar' | 'enviar' | 'completado'

export function GenerarFacturaEDialog({
  open,
  onOpenChange,
  facturaId,
  facturaNumero,
  onSuccess,
  yaGenerada = false,
  yaFirmada = false,
  yaEnviada = false,
}: GenerarFacturaEDialogProps) {
  const [paso, setPaso] = useState<Paso>('verificar')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verificación
  const [verificacion, setVerificacion] = useState<IVerificacionRequisitos | null>(null)

  // Certificados
  const [certificados, setCertificados] = useState<ICertificadoInfo[]>([])
  const [certificadoSeleccionado, setCertificadoSeleccionado] = useState<string>('')

  // Opciones
  const [firmarAlGenerar, setFirmarAlGenerar] = useState(true)
  const [entornoFACE, setEntornoFACE] = useState<'produccion' | 'pruebas'>('pruebas')

  // Resultado
  const [xmlGenerado, setXmlGenerado] = useState(false)
  const [xmlFirmado, setXmlFirmado] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      cargarDatosIniciales()
    }
  }, [open, facturaId])

  const cargarDatosIniciales = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Verificar requisitos y cargar certificados en paralelo
      const [verificacionRes, certificadosRes] = await Promise.all([
        facturaEService.verificarRequisitos(facturaId),
        facturaEService.getCertificadosDisponibles(),
      ])

      if (verificacionRes.success) {
        setVerificacion(verificacionRes.data)
      }

      if (certificadosRes.success) {
        setCertificados(certificadosRes.data)
        // Seleccionar el primer certificado válido
        const valido = certificadosRes.data.find(c => c.esValido)
        if (valido) {
          setCertificadoSeleccionado(valido._id)
        }
      }

      // Determinar paso inicial según estado
      if (yaEnviada) {
        setPaso('completado')
      } else if (yaFirmada) {
        setPaso('enviar')
      } else if (yaGenerada) {
        setPaso('firmar')
      } else {
        setPaso('verificar')
      }
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos necesarios')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerar = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await facturaEService.generarFacturaE(facturaId, {
        firmar: firmarAlGenerar,
        certificadoId: firmarAlGenerar ? certificadoSeleccionado : undefined,
      })

      if (response.success && response.data.exito) {
        setXmlGenerado(true)
        if (response.data.firmado) {
          setXmlFirmado(true)
          toast.success('FacturaE generada y firmada correctamente')
          setPaso('enviar')
        } else {
          toast.success('FacturaE generada correctamente')
          setPaso('firmar')
        }
        onSuccess?.()
      } else {
        setError(response.data.errores?.join(', ') || 'Error al generar FacturaE')
      }
    } catch (err) {
      console.error('Error generando FacturaE:', err)
      setError('Error al generar la factura electrónica')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFirmar = async () => {
    if (!certificadoSeleccionado) {
      setError('Seleccione un certificado para firmar')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await facturaEService.firmarFacturaE(facturaId, certificadoSeleccionado)

      if (response.success && response.data.exito) {
        setXmlFirmado(true)
        toast.success('FacturaE firmada correctamente')
        setPaso('enviar')
        onSuccess?.()
      } else {
        setError(response.data.errores?.join(', ') || 'Error al firmar FacturaE')
      }
    } catch (err) {
      console.error('Error firmando FacturaE:', err)
      setError('Error al firmar la factura electrónica')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnviar = async () => {
    if (!certificadoSeleccionado) {
      setError('Seleccione un certificado para enviar a FACE')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await facturaEService.enviarAFACE(
        facturaId,
        certificadoSeleccionado,
        entornoFACE
      )

      if (response.success && response.data.exito) {
        toast.success(`Factura enviada a FACE. Nº Registro: ${response.data.numeroRegistro}`)
        setPaso('completado')
        onSuccess?.()
      } else {
        setError(response.data.errores?.join(', ') || 'Error al enviar a FACE')
      }
    } catch (err) {
      console.error('Error enviando a FACE:', err)
      setError('Error al enviar la factura a FACE')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDescargar = async () => {
    try {
      await facturaEService.descargarComoArchivo(facturaId, `FacturaE_${facturaNumero}.xsig`)
      toast.success('Descarga iniciada')
    } catch (err) {
      console.error('Error descargando:', err)
      toast.error('Error al descargar el archivo')
    }
  }

  const renderVerificacion = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Info className="h-4 w-4" />
        <p className="text-sm">
          Verificando requisitos para generar la factura electrónica...
        </p>
      </div>

      {verificacion && (
        <div className="space-y-3">
          {verificacion.cumple ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Requisitos cumplidos</AlertTitle>
              <AlertDescription className="text-green-700">
                La factura cumple todos los requisitos para generar FacturaE
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Requisitos pendientes</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2">
                  {verificacion.faltantes.map((faltante, index) => (
                    <li key={index}>{faltante}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {verificacion?.cumple && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="firmarAlGenerar"
              checked={firmarAlGenerar}
              onCheckedChange={(checked) => setFirmarAlGenerar(!!checked)}
            />
            <Label htmlFor="firmarAlGenerar" className="cursor-pointer">
              Firmar automáticamente al generar
            </Label>
          </div>

          {firmarAlGenerar && (
            <div className="space-y-2">
              <Label>Certificado de firma</Label>
              <Select value={certificadoSeleccionado} onValueChange={setCertificadoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar certificado" />
                </SelectTrigger>
                <SelectContent>
                  {certificados.map((cert) => (
                    <SelectItem key={cert._id} value={cert._id} disabled={!cert.esValido}>
                      <div className="flex items-center gap-2">
                        {cert.esValido ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span>{cert.asunto}</span>
                        {!cert.esValido && (
                          <Badge variant="destructive" className="text-xs">
                            Caducado
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {certificadoSeleccionado && (
                <p className="text-xs text-muted-foreground">
                  {certificados.find(c => c._id === certificadoSeleccionado)?.diasRestantes || 0} días restantes
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderFirmar = () => (
    <div className="space-y-4">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Firmar factura electrónica</AlertTitle>
        <AlertDescription>
          La factura se firmará con XAdES-EPES según la política de firma de FacturaE
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Certificado de firma</Label>
        <Select value={certificadoSeleccionado} onValueChange={setCertificadoSeleccionado}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar certificado" />
          </SelectTrigger>
          <SelectContent>
            {certificados.map((cert) => (
              <SelectItem key={cert._id} value={cert._id} disabled={!cert.esValido}>
                <div className="flex items-center gap-2">
                  {cert.esValido ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{cert.asunto}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderEnviar = () => (
    <div className="space-y-4">
      <Alert>
        <Send className="h-4 w-4" />
        <AlertTitle>Enviar a FACE</AlertTitle>
        <AlertDescription>
          La factura firmada se enviará al Punto General de Entrada de Facturas Electrónicas
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Entorno FACE</Label>
        <Select value={entornoFACE} onValueChange={(v) => setEntornoFACE(v as 'produccion' | 'pruebas')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pruebas">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Pruebas</Badge>
                <span>Entorno de pruebas</span>
              </div>
            </SelectItem>
            <SelectItem value="produccion">
              <div className="flex items-center gap-2">
                <Badge>Producción</Badge>
                <span>Entorno real</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {entornoFACE === 'produccion' && (
          <p className="text-xs text-yellow-600">
            Las facturas enviadas a producción son definitivas y no pueden eliminarse
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Certificado para envío</Label>
        <Select value={certificadoSeleccionado} onValueChange={setCertificadoSeleccionado}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar certificado" />
          </SelectTrigger>
          <SelectContent>
            {certificados.map((cert) => (
              <SelectItem key={cert._id} value={cert._id} disabled={!cert.esValido}>
                <div className="flex items-center gap-2">
                  {cert.esValido ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{cert.asunto}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderCompletado = () => (
    <div className="space-y-4 text-center py-4">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-lg">Proceso completado</h3>
        <p className="text-muted-foreground">
          La factura electrónica ha sido generada y enviada correctamente
        </p>
      </div>
      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={handleDescargar}>
          <Download className="mr-2 h-4 w-4" />
          Descargar XML
        </Button>
      </div>
    </div>
  )

  const getDialogTitle = () => {
    switch (paso) {
      case 'verificar':
        return 'Generar FacturaE'
      case 'generar':
        return 'Generando FacturaE...'
      case 'firmar':
        return 'Firmar FacturaE'
      case 'enviar':
        return 'Enviar a FACE'
      case 'completado':
        return 'Proceso completado'
      default:
        return 'FacturaE'
    }
  }

  const canProceed = () => {
    if (paso === 'verificar') {
      return verificacion?.cumple && (!firmarAlGenerar || certificadoSeleccionado)
    }
    if (paso === 'firmar' || paso === 'enviar') {
      return !!certificadoSeleccionado
    }
    return true
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            Factura: {facturaNumero}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading && paso !== 'completado' ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Procesando...</p>
            </div>
          ) : (
            <>
              {paso === 'verificar' && renderVerificacion()}
              {paso === 'firmar' && renderFirmar()}
              {paso === 'enviar' && renderEnviar()}
              {paso === 'completado' && renderCompletado()}
            </>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {paso !== 'completado' && (
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
          )}

          {paso === 'verificar' && (
            <Button onClick={handleGenerar} disabled={!canProceed() || isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Generar FacturaE
            </Button>
          )}

          {paso === 'firmar' && (
            <Button onClick={handleFirmar} disabled={!canProceed() || isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              Firmar
            </Button>
          )}

          {paso === 'enviar' && (
            <>
              <Button variant="outline" onClick={handleDescargar}>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
              <Button onClick={handleEnviar} disabled={!canProceed() || isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar a FACE
              </Button>
            </>
          )}

          {paso === 'completado' && (
            <Button onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
