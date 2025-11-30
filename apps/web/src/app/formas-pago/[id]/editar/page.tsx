'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { formasPagoService } from '@/services/formas-pago.service'
import { UpdateFormaPagoDTO, TipoFormaPago, TIPOS_FORMA_PAGO, TIPOS_PASARELA } from '@/types/forma-pago.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, CreditCard, Settings, Palette, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const COLORES_PREDEFINIDOS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarillo' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#8B5CF6', label: 'Morado' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#6B7280', label: 'Gris' },
  { value: '#14B8A6', label: 'Teal' },
]

const ICONOS_DISPONIBLES = [
  { value: 'banknote', label: 'Billete (efectivo)' },
  { value: 'credit-card', label: 'Tarjeta' },
  { value: 'building-2', label: 'Banco (transferencia)' },
  { value: 'landmark', label: 'Domiciliación' },
  { value: 'file-text', label: 'Cheque/Pagaré' },
  { value: 'wallet', label: 'Cartera' },
  { value: 'coins', label: 'Monedas' },
]

export default function EditarFormaPagoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateFormaPagoDTO>({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'efectivo',
    icono: 'banknote',
    color: '#3B82F6',
    requiereDatosBancarios: false,
    comision: 0,
    orden: 0,
    activo: true,
  })
  const [showPasarelaConfig, setShowPasarelaConfig] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await formasPagoService.getById(id)
        if (response.success && response.data) {
          const fp = response.data
          setFormData({
            codigo: fp.codigo || '',
            nombre: fp.nombre || '',
            descripcion: fp.descripcion || '',
            tipo: fp.tipo || 'efectivo',
            icono: fp.icono || 'banknote',
            color: fp.color || '#3B82F6',
            requiereDatosBancarios: fp.requiereDatosBancarios || false,
            configuracionPasarela: fp.configuracionPasarela,
            comision: fp.comision || 0,
            orden: fp.orden || 0,
            activo: fp.activo !== undefined ? fp.activo : true,
          })
          setShowPasarelaConfig(fp.tipo === 'tarjeta' || !!fp.configuracionPasarela?.habilitado)
        }
      } catch (error) {
        toast.error('Error al cargar la forma de pago')
        router.push('/formas-pago')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleTipoChange = (tipo: TipoFormaPago) => {
    setFormData({ ...formData, tipo })
    setShowPasarelaConfig(tipo === 'tarjeta')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.codigo?.trim()) {
      toast.error('El código es obligatorio')
      return
    }

    if (!formData.nombre?.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await formasPagoService.update(id, formData)
      if (response.success) {
        toast.success('Forma de pago actualizada correctamente')
        router.push('/formas-pago')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando forma de pago...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/formas-pago"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-primary" />
              Editar Forma de Pago
            </h1>
            <p className="text-sm text-muted-foreground">Modifica los datos y opciones de la forma de pago</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Información General */}
          <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    placeholder="Ej: EFE, TAR, TRA"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Efectivo, Tarjeta de crédito"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: TipoFormaPago) => handleTipoChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_FORMA_PAGO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orden">Orden</Label>
                  <Input
                    id="orden"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={formData.orden || ''}
                    onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripción opcional de la forma de pago"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Apariencia */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apariencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icono">Icono</Label>
                  <Select
                    value={formData.icono}
                    onValueChange={(value) => setFormData({ ...formData, icono: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un icono" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICONOS_DISPONIBLES.map((icono) => (
                        <SelectItem key={icono.value} value={icono.value}>
                          {icono.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORES_PREDEFINIDOS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color.value
                            ? 'border-foreground scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground mb-2">Vista previa:</p>
                <div
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: formData.color }}
                >
                  <CreditCard className="h-4 w-4" />
                  {formData.nombre || 'Forma de pago'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comision">Comisión (%)</Label>
                  <Input
                    id="comision"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    placeholder="0.00"
                    value={formData.comision || ''}
                    onChange={(e) => setFormData({ ...formData, comision: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Comisión aplicada al usar esta forma de pago</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Requiere datos bancarios</Label>
                  <p className="text-sm text-muted-foreground">El cliente debe proporcionar cuenta bancaria</p>
                </div>
                <Switch
                  checked={formData.requiereDatosBancarios}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiereDatosBancarios: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pasarela de pago (solo para tarjeta) */}
          {showPasarelaConfig && (
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Configuración de Pasarela
                  </CardTitle>
                  <Switch
                    checked={!!formData.configuracionPasarela?.habilitado}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracionPasarela: {
                        ...formData.configuracionPasarela,
                        tipo: formData.configuracionPasarela?.tipo || 'stripe',
                        habilitado: checked,
                      }
                    })}
                  />
                </div>
              </CardHeader>
              {formData.configuracionPasarela?.habilitado && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de Pasarela</Label>
                    <Select
                      value={formData.configuracionPasarela?.tipo || 'stripe'}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        configuracionPasarela: {
                          ...formData.configuracionPasarela,
                          tipo: value,
                          habilitado: true,
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_PASARELA.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campos según pasarela seleccionada */}
                  {formData.configuracionPasarela?.tipo === 'stripe' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Stripe Public Key</Label>
                        <Input
                          placeholder="pk_live_..."
                          value={formData.configuracionPasarela?.stripePublicKey || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            configuracionPasarela: {
                              ...formData.configuracionPasarela!,
                              stripePublicKey: e.target.value,
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stripe Secret Key</Label>
                        <Input
                          type="password"
                          placeholder="sk_live_..."
                          value={formData.configuracionPasarela?.stripeSecretKey || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            configuracionPasarela: {
                              ...formData.configuracionPasarela!,
                              stripeSecretKey: e.target.value,
                            }
                          })}
                        />
                      </div>
                    </div>
                  )}

                  {formData.configuracionPasarela?.tipo === 'redsys' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Código Comercio</Label>
                          <Input
                            placeholder="123456789"
                            value={formData.configuracionPasarela?.redsysMerchantCode || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              configuracionPasarela: {
                                ...formData.configuracionPasarela!,
                                redsysMerchantCode: e.target.value,
                              }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Terminal</Label>
                          <Input
                            placeholder="001"
                            value={formData.configuracionPasarela?.redsysTerminal || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              configuracionPasarela: {
                                ...formData.configuracionPasarela!,
                                redsysTerminal: e.target.value,
                              }
                            })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Clave Secreta</Label>
                        <Input
                          type="password"
                          placeholder="Clave de firma"
                          value={formData.configuracionPasarela?.redsysSecretKey || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            configuracionPasarela: {
                              ...formData.configuracionPasarela!,
                              redsysSecretKey: e.target.value,
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Entorno</Label>
                        <Select
                          value={formData.configuracionPasarela?.redsysEnvironment || 'test'}
                          onValueChange={(value: 'test' | 'production') => setFormData({
                            ...formData,
                            configuracionPasarela: {
                              ...formData.configuracionPasarela!,
                              redsysEnvironment: value,
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="test">Test (Pruebas)</SelectItem>
                            <SelectItem value="production">Producción</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {formData.configuracionPasarela?.tipo === 'paypal' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>PayPal Client ID</Label>
                        <Input
                          placeholder="Client ID"
                          value={formData.configuracionPasarela?.paypalClientId || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            configuracionPasarela: {
                              ...formData.configuracionPasarela!,
                              paypalClientId: e.target.value,
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PayPal Client Secret</Label>
                        <Input
                          type="password"
                          placeholder="Client Secret"
                          value={formData.configuracionPasarela?.paypalClientSecret || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            configuracionPasarela: {
                              ...formData.configuracionPasarela!,
                              paypalClientSecret: e.target.value,
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Entorno</Label>
                        <Select
                          value={formData.configuracionPasarela?.paypalEnvironment || 'sandbox'}
                          onValueChange={(value: 'sandbox' | 'production') => setFormData({
                            ...formData,
                            configuracionPasarela: {
                              ...formData.configuracionPasarela!,
                              paypalEnvironment: value,
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sandbox">Sandbox (Pruebas)</SelectItem>
                            <SelectItem value="production">Producción</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>URL de Webhook (opcional)</Label>
                    <Input
                      placeholder="https://tu-dominio.com/api/webhooks/pagos"
                      value={formData.configuracionPasarela?.webhookUrl || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        configuracionPasarela: {
                          ...formData.configuracionPasarela!,
                          webhookUrl: e.target.value,
                        }
                      })}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Estado */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Activa</Label>
                  <p className="text-sm text-muted-foreground">La forma de pago está disponible para usar</p>
                </div>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/formas-pago">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
