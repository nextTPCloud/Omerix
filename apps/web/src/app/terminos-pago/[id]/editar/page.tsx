'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { terminosPagoService } from '@/services/terminos-pago.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Calendar, Plus, Trash2, Clock, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface Vencimiento {
  dias: number
  porcentaje: number
}

export default function EditarTerminoPagoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    vencimientos: [{ dias: 0, porcentaje: 100 }] as Vencimiento[],
    activo: true,
  })

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await terminosPagoService.getById(id)
        if (response.success && response.data) {
          const termino = response.data
          setFormData({
            codigo: termino.codigo || '',
            nombre: termino.nombre || '',
            descripcion: termino.descripcion || '',
            vencimientos: termino.vencimientos || [{ dias: 0, porcentaje: 100 }],
            activo: termino.activo !== undefined ? termino.activo : true,
          })
        }
      } catch (error) {
        toast.error('Error al cargar el término de pago')
        router.push('/terminos-pago')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const calcularTotalPorcentaje = () => {
    return formData.vencimientos.reduce((sum, v) => sum + v.porcentaje, 0)
  }

  const handleAddVencimiento = () => {
    const totalActual = calcularTotalPorcentaje()
    const restante = Math.max(0, 100 - totalActual)

    setFormData({
      ...formData,
      vencimientos: [
        ...formData.vencimientos,
        { dias: 30, porcentaje: restante }
      ]
    })
  }

  const handleRemoveVencimiento = (index: number) => {
    if (formData.vencimientos.length <= 1) {
      toast.warning('Debe haber al menos un vencimiento')
      return
    }

    const newVencimientos = formData.vencimientos.filter((_, i) => i !== index)
    setFormData({ ...formData, vencimientos: newVencimientos })
  }

  const handleVencimientoChange = (index: number, field: keyof Vencimiento, value: number) => {
    const newVencimientos = [...formData.vencimientos]
    newVencimientos[index] = { ...newVencimientos[index], [field]: value }
    setFormData({ ...formData, vencimientos: newVencimientos })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.codigo.trim()) {
      toast.error('El código es obligatorio')
      return
    }

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    const totalPorcentaje = calcularTotalPorcentaje()
    if (Math.abs(totalPorcentaje - 100) > 0.01) {
      toast.error(`La suma de los porcentajes debe ser 100%. Actual: ${totalPorcentaje}%`)
      return
    }

    setIsSaving(true)
    try {
      const response = await terminosPagoService.update(id, formData)
      if (response.success) {
        toast.success('Término de pago actualizado correctamente')
        router.push('/terminos-pago')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  const totalPorcentaje = calcularTotalPorcentaje()
  const porcentajeValido = Math.abs(totalPorcentaje - 100) < 0.01

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando término de pago...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/terminos-pago"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-7 w-7 text-primary" />
              Editar Término de Pago
            </h1>
            <p className="text-sm text-muted-foreground">Modifica las condiciones y vencimientos</p>
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
                    placeholder="Ej: 30-60"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: 50% a 30 días, 50% a 60 días"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripción opcional del término de pago"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vencimientos */}
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Vencimientos
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={porcentajeValido ? 'default' : 'destructive'}
                    className={porcentajeValido ? 'bg-green-100 text-green-800' : ''}
                  >
                    Total: {totalPorcentaje}%
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddVencimiento}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.vencimientos.map((vencimiento, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Porcentaje (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={vencimiento.porcentaje}
                        onChange={(e) => handleVencimientoChange(index, 'porcentaje', Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Días desde factura</Label>
                      <Input
                        type="number"
                        min={0}
                        value={vencimiento.dias}
                        onChange={(e) => handleVencimientoChange(index, 'dias', Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveVencimiento(index)}
                    disabled={formData.vencimientos.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Resumen visual */}
              <div className="mt-4 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <p className="text-sm font-medium mb-2">Resumen de pagos:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.vencimientos.map((v, idx) => (
                    <Badge key={idx} variant="outline" className="font-mono">
                      {v.porcentaje}% → {v.dias === 0 ? 'Al contado' : `${v.dias} días`}
                    </Badge>
                  ))}
                </div>
              </div>

              {!porcentajeValido && (
                <p className="text-sm text-destructive">
                  ⚠️ La suma de los porcentajes debe ser exactamente 100%
                </p>
              )}
            </CardContent>
          </Card>

          {/* Estado */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Activo</Label>
                  <p className="text-sm text-muted-foreground">El término está disponible para usar</p>
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
              <Link href="/terminos-pago">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving || !porcentajeValido}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
