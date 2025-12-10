'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  FileCheck,
  Shield,
  Send,
  QrCode,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Server,
  TestTube,
  Building2,
} from 'lucide-react'
import { empresaService, EmpresaInfo } from '@/services/empresa.service'
import certificadosService, { CertificadoElectronico, EstadoCertificado } from '@/services/certificados.service'

// Tipos de configuración VeriFactu
interface VerifactuConfig {
  entorno: 'test' | 'production'
  certificadoId?: string
  sistemaFiscal?: 'verifactu' | 'ticketbai' | 'sii'
  territorioTicketBAI?: 'araba' | 'bizkaia' | 'gipuzkoa'
  envioAutomatico: boolean
  generarQR: boolean
  firmaDigital: boolean
}

const defaultConfig: VerifactuConfig = {
  entorno: 'test',
  sistemaFiscal: 'verifactu',
  envioAutomatico: true,
  generarQR: true,
  firmaDigital: true,
}

export function VerifactuConfig() {
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null)
  const [config, setConfig] = useState<VerifactuConfig>(defaultConfig)
  const [certificados, setCertificados] = useState<CertificadoElectronico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Cargar empresa y certificados en paralelo
      const [empresaRes, certRes] = await Promise.all([
        empresaService.getMiEmpresa(),
        certificadosService.listar(),
      ])

      if (empresaRes.success && empresaRes.data) {
        setEmpresa(empresaRes.data)
        // Cargar configuración existente o usar default
        if ((empresaRes.data as any).verifactuConfig) {
          setConfig((empresaRes.data as any).verifactuConfig)
        }
      }

      if (certRes.success) {
        // Solo certificados activos
        setCertificados(certRes.data.filter((c: CertificadoElectronico) => c.estado === EstadoCertificado.ACTIVO))
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cargar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof VerifactuConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const response = await empresaService.updateInfo({
        verifactuConfig: config,
      } as any)

      if (response.success) {
        toast.success('Configuración guardada correctamente')
        setHasChanges(false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar configuración')
    } finally {
      setIsSaving(false)
    }
  }

  const getCertificadoSeleccionado = () => {
    return certificados.find(c => c._id === config.certificadoId)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  const certSeleccionado = getCertificadoSeleccionado()

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Configuración de Facturación Electrónica
              </CardTitle>
              <CardDescription>
                Configura VeriFactu, TicketBAI o SII para tu empresa
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={config.entorno === 'production' ? 'default' : 'secondary'}
                className={config.entorno === 'production' ? 'bg-green-600' : 'bg-orange-500'}
              >
                {config.entorno === 'production' ? (
                  <><Server className="h-3 w-3 mr-1" /> Producción</>
                ) : (
                  <><TestTube className="h-3 w-3 mr-1" /> Pruebas</>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Entorno */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Entorno</Label>
                <p className="text-sm text-muted-foreground">
                  Selecciona si enviar facturas a la AEAT en modo pruebas o producción
                </p>
              </div>
              <Select
                value={config.entorno}
                onValueChange={(value) => handleChange('entorno', value as 'test' | 'production')}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4 text-orange-500" />
                      Pruebas (Test)
                    </div>
                  </SelectItem>
                  <SelectItem value="production">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-green-600" />
                      Producción
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.entorno === 'production' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Modo Producción activado</p>
                    <p className="text-sm text-amber-700">
                      Las facturas se enviarán a la AEAT de forma oficial. Asegúrate de tener un certificado válido configurado.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Sistema fiscal */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Sistema Fiscal</Label>
              <p className="text-sm text-muted-foreground">
                Selecciona el sistema de facturación electrónica a usar
              </p>
            </div>
            <Select
              value={config.sistemaFiscal}
              onValueChange={(value) => handleChange('sistemaFiscal', value as 'verifactu' | 'ticketbai' | 'sii')}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verifactu">VeriFactu (AEAT)</SelectItem>
                <SelectItem value="ticketbai">TicketBAI (País Vasco)</SelectItem>
                <SelectItem value="sii">SII (Grandes empresas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Territorio TicketBAI */}
          {config.sistemaFiscal === 'ticketbai' && (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Territorio Foral</Label>
                <p className="text-sm text-muted-foreground">
                  Selecciona el territorio para TicketBAI
                </p>
              </div>
              <Select
                value={config.territorioTicketBAI || ''}
                onValueChange={(value) => handleChange('territorioTicketBAI', value as 'araba' | 'bizkaia' | 'gipuzkoa')}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecciona territorio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="araba">Álava / Araba</SelectItem>
                  <SelectItem value="bizkaia">Bizkaia</SelectItem>
                  <SelectItem value="gipuzkoa">Gipuzkoa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Certificado digital */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Certificado Digital
              </Label>
              <p className="text-sm text-muted-foreground">
                Certificado para firmar las facturas electrónicas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={config.certificadoId || ''}
                onValueChange={(value) => handleChange('certificadoId', value)}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecciona certificado" />
                </SelectTrigger>
                <SelectContent>
                  {certificados.length === 0 ? (
                    <SelectItem value="" disabled>
                      No hay certificados disponibles
                    </SelectItem>
                  ) : (
                    certificados.map((cert) => (
                      <SelectItem key={cert._id} value={cert._id}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          {cert.nombre}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {certSeleccionado && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Certificado: {certSeleccionado.nombre}</p>
                  <p className="text-sm text-green-700">
                    Titular: {certSeleccionado.titular.nombre} - {certSeleccionado.titular.nif}
                  </p>
                  <p className="text-sm text-green-700">
                    Válido hasta: {new Date(certSeleccionado.fechaExpiracion).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {certificados.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">No hay certificados configurados</p>
                  <p className="text-sm text-amber-700">
                    Añade un certificado digital en la sección de Certificados para poder firmar facturas.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Opciones de envío */}
          <div className="space-y-4">
            <h3 className="text-base font-medium">Opciones de envío</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="envioAutomatico" className="flex items-center gap-2 cursor-pointer">
                  <Send className="h-4 w-4" />
                  Envío automático a AEAT
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enviar automáticamente la factura al emitirla
                </p>
              </div>
              <Switch
                id="envioAutomatico"
                checked={config.envioAutomatico}
                onCheckedChange={(checked) => handleChange('envioAutomatico', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="generarQR" className="flex items-center gap-2 cursor-pointer">
                  <QrCode className="h-4 w-4" />
                  Generar código QR
                </Label>
                <p className="text-sm text-muted-foreground">
                  Incluir código QR de verificación en las facturas
                </p>
              </div>
              <Switch
                id="generarQR"
                checked={config.generarQR}
                onCheckedChange={(checked) => handleChange('generarQR', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="firmaDigital" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="h-4 w-4" />
                  Firma digital
                </Label>
                <p className="text-sm text-muted-foreground">
                  Firmar electrónicamente las facturas emitidas
                </p>
              </div>
              <Switch
                id="firmaDigital"
                checked={config.firmaDigital}
                onCheckedChange={(checked) => handleChange('firmaDigital', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Guardar configuración
            </>
          )}
        </Button>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información sobre Facturación Electrónica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                VeriFactu
              </h4>
              <p className="text-blue-700">
                Sistema obligatorio para todas las empresas en España a partir de 2025. Envía los datos de facturación a la AEAT.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                TicketBAI
              </h4>
              <p className="text-green-700">
                Sistema de las Diputaciones Forales del País Vasco. Obligatorio para empresas en Álava, Bizkaia y Gipuzkoa.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                SII
              </h4>
              <p className="text-purple-700">
                Suministro Inmediato de Información. Obligatorio para grandes empresas con facturación superior a 6M€.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VerifactuConfig
