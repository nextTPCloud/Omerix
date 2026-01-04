'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { contabilidadService } from '@/services/contabilidad.service'
import { ConfigContable } from '@/types/contabilidad.types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  ArrowLeft,
  Save,
  RefreshCw,
  Building2,
  Calendar,
  Hash,
  Lock,
  Unlock,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ConfiguracionContablePage() {
  const [config, setConfig] = useState<ConfigContable | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Cargar configuración
  const cargarConfig = async () => {
    try {
      setIsLoading(true)
      const response = await contabilidadService.getConfiguracion()
      setConfig(response)
    } catch (error) {
      console.error('Error cargando configuración:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarConfig()
  }, [])

  // Guardar configuración
  const handleGuardar = async () => {
    if (!config) return

    try {
      setIsSaving(true)
      await contabilidadService.updateConfiguracion(config)
      toast.success('Configuración guardada correctamente')
    } catch (error) {
      console.error('Error guardando configuración:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setIsSaving(false)
    }
  }

  // Actualizar campo
  const updateConfig = (field: keyof ConfigContable, value: any) => {
    if (!config) return
    setConfig({ ...config, [field]: value })
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
      <div className="w-full space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/contabilidad">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Settings className="h-7 w-7 text-primary" />
                Configuración Contable
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Parámetros y opciones de contabilidad
              </p>
            </div>
          </div>
          <Button onClick={handleGuardar} disabled={isSaving || !config}>
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar cambios
          </Button>
        </div>

        {!config ? (
          <Card className="p-12 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium">No se pudo cargar la configuración</p>
            <Button onClick={cargarConfig} variant="outline" className="mt-4">
              Reintentar
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EJERCICIO Y NUMERACIÓN */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Ejercicio y Numeración
                </CardTitle>
                <CardDescription>
                  Configuración del ejercicio activo y numeración de asientos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ejercicio activo</Label>
                    <Input
                      type="number"
                      value={config.ejercicioActivo}
                      onChange={(e) => updateConfig('ejercicioActivo', parseInt(e.target.value))}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Próximo nº asiento</Label>
                    <Input
                      type="number"
                      value={config.proximoNumeroAsiento}
                      onChange={(e) => updateConfig('proximoNumeroAsiento', parseInt(e.target.value))}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reiniciar numeración anual</Label>
                    <p className="text-xs text-muted-foreground">
                      Comenzar desde 1 cada nuevo ejercicio
                    </p>
                  </div>
                  <Switch
                    checked={config.reiniciarNumeracionAnual}
                    onCheckedChange={(v) => updateConfig('reiniciarNumeracionAnual', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AUTOMATIZACIÓN */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Automatización
                </CardTitle>
                <CardDescription>
                  Opciones de generación automática de asientos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Generar asientos automáticos</Label>
                    <p className="text-xs text-muted-foreground">
                      Crear asientos al emitir facturas, cobros, etc.
                    </p>
                  </div>
                  <Switch
                    checked={config.generarAsientosAutomaticos}
                    onCheckedChange={(v) => updateConfig('generarAsientosAutomaticos', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir asientos descuadrados</Label>
                    <p className="text-xs text-muted-foreground">
                      Guardar asientos que no cuadren (no recomendado)
                    </p>
                  </div>
                  <Switch
                    checked={config.permitirAsientosDescuadrados}
                    onCheckedChange={(v) => updateConfig('permitirAsientosDescuadrados', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bloquear períodos cerrados</Label>
                    <p className="text-xs text-muted-foreground">
                      Impedir modificaciones en meses cerrados
                    </p>
                  </div>
                  <Switch
                    checked={config.bloquearPeriodosCerrados}
                    onCheckedChange={(v) => updateConfig('bloquearPeriodosCerrados', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* CUENTAS POR DEFECTO */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Cuentas por Defecto
                </CardTitle>
                <CardDescription>
                  Cuentas que se usarán automáticamente en asientos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cuenta ventas</Label>
                    <Input
                      value={config.cuentaVentasPorDefecto || ''}
                      onChange={(e) => updateConfig('cuentaVentasPorDefecto', e.target.value)}
                      placeholder="700000"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>Cuenta compras</Label>
                    <Input
                      value={config.cuentaComprasPorDefecto || ''}
                      onChange={(e) => updateConfig('cuentaComprasPorDefecto', e.target.value)}
                      placeholder="600000"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>IVA repercutido</Label>
                    <Input
                      value={config.cuentaIVARepercutido || ''}
                      onChange={(e) => updateConfig('cuentaIVARepercutido', e.target.value)}
                      placeholder="477000"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>IVA soportado</Label>
                    <Input
                      value={config.cuentaIVASoportado || ''}
                      onChange={(e) => updateConfig('cuentaIVASoportado', e.target.value)}
                      placeholder="472000"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>Cuenta banco</Label>
                    <Input
                      value={config.cuentaBanco || ''}
                      onChange={(e) => updateConfig('cuentaBanco', e.target.value)}
                      placeholder="572000"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>Cuenta caja</Label>
                    <Input
                      value={config.cuentaCaja || ''}
                      onChange={(e) => updateConfig('cuentaCaja', e.target.value)}
                      placeholder="570000"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SUBCUENTAS AUTOMÁTICAS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Subcuentas Automáticas
                </CardTitle>
                <CardDescription>
                  Configuración para creación automática de subcuentas de clientes y proveedores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prefijo cuenta cliente</Label>
                    <Input
                      value={config.prefijoCuentaCliente || ''}
                      onChange={(e) => updateConfig('prefijoCuentaCliente', e.target.value)}
                      placeholder="430"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>Prefijo cuenta proveedor</Label>
                    <Input
                      value={config.prefijoCuentaProveedor || ''}
                      onChange={(e) => updateConfig('prefijoCuentaProveedor', e.target.value)}
                      placeholder="400"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>Longitud subcuenta cliente</Label>
                    <Input
                      type="number"
                      value={config.longitudSubcuentaCliente || 6}
                      onChange={(e) => updateConfig('longitudSubcuentaCliente', parseInt(e.target.value))}
                      className="mt-1.5"
                      min={4}
                      max={10}
                    />
                  </div>
                  <div>
                    <Label>Longitud subcuenta proveedor</Label>
                    <Input
                      type="number"
                      value={config.longitudSubcuentaProveedor || 6}
                      onChange={(e) => updateConfig('longitudSubcuentaProveedor', parseInt(e.target.value))}
                      className="mt-1.5"
                      min={4}
                      max={10}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* EJERCICIOS */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Ejercicios
                </CardTitle>
                <CardDescription>
                  Estado de los ejercicios contables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-4 py-2 text-left font-semibold">Ejercicio</th>
                        <th className="px-4 py-2 text-left font-semibold">Estado</th>
                        <th className="px-4 py-2 text-left font-semibold">Fecha cierre</th>
                        <th className="px-4 py-2 text-left font-semibold">Períodos cerrados</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(config.ejercicios || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                            No hay ejercicios configurados
                          </td>
                        </tr>
                      ) : (
                        config.ejercicios.map((ej) => (
                          <tr key={ej.ejercicio} className="hover:bg-muted/30">
                            <td className="px-4 py-2 font-bold">{ej.ejercicio}</td>
                            <td className="px-4 py-2">
                              {ej.cerrado ? (
                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                  <Lock className="h-3 w-3" />
                                  Cerrado
                                </Badge>
                              ) : (
                                <Badge variant="default" className="flex items-center gap-1 w-fit bg-emerald-500">
                                  <Unlock className="h-3 w-3" />
                                  Abierto
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {ej.fechaCierre
                                ? new Date(ej.fechaCierre).toLocaleDateString('es-ES')
                                : '-'}
                            </td>
                            <td className="px-4 py-2">
                              {ej.periodos?.filter((p) => p.cerrado).length || 0} de 12
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
