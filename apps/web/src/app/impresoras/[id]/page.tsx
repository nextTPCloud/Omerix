'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { impresorasService, Impresora } from '@/services/impresoras.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Printer, RefreshCw, TestTube } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarImpresoraPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'ticket' as 'ticket' | 'cocina' | 'etiquetas' | 'fiscal',
    tipoConexion: 'red' as 'usb' | 'red' | 'bluetooth' | 'serie',
    ip: '',
    puerto: 9100,
    mac: '',
    puertoSerie: '',
    baudRate: 9600,
    modelo: '',
    fabricante: '',
    anchoPapel: 80 as 58 | 80,
    cortarPapel: true,
    abrirCajon: false,
    imprimirLogo: true,
    copias: 1,
    activo: true,
  })

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await impresorasService.getById(id)
        if (response.success && response.data) {
          const imp = response.data
          setFormData({
            nombre: imp.nombre || '',
            tipo: imp.tipo || 'ticket',
            tipoConexion: imp.tipoConexion || 'red',
            ip: imp.ip || '',
            puerto: imp.puerto || 9100,
            mac: imp.mac || '',
            puertoSerie: imp.puertoSerie || '',
            baudRate: imp.baudRate || 9600,
            modelo: imp.modelo || '',
            fabricante: imp.fabricante || '',
            anchoPapel: imp.anchoPapel || 80,
            cortarPapel: imp.cortarPapel !== undefined ? imp.cortarPapel : true,
            abrirCajon: imp.abrirCajon || false,
            imprimirLogo: imp.imprimirLogo !== undefined ? imp.imprimirLogo : true,
            copias: imp.copias || 1,
            activo: imp.activo !== undefined ? imp.activo : true,
          })
        }
      } catch (error) {
        toast.error('Error al cargar la impresora')
        router.push('/impresoras')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await impresorasService.update(id, formData)
      if (response.success) {
        toast.success('Impresora actualizada correctamente')
        router.push('/impresoras')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      const response = await impresorasService.test(id)
      if (response.success) toast.success(response.message || 'Prueba enviada')
      else toast.error('Error en la prueba')
    } catch (error) {
      toast.error('Error al probar la impresora')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando impresora...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/impresoras"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Printer className="h-7 w-7 text-primary" />
                Editar Impresora
              </h1>
              <p className="text-sm text-muted-foreground">Modifica la configuración</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleTest}>
            <TestTube className="h-4 w-4 mr-2" />
            Probar
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket">Ticket</SelectItem>
                      <SelectItem value="cocina">Cocina</SelectItem>
                      <SelectItem value="etiquetas">Etiquetas</SelectItem>
                      <SelectItem value="fiscal">Fiscal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input id="modelo" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fabricante">Fabricante</Label>
                  <Input id="fabricante" value={formData.fabricante} onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Conexión</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Conexión</Label>
                <Select value={formData.tipoConexion} onValueChange={(value: any) => setFormData({ ...formData, tipoConexion: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="red">Red (TCP/IP)</SelectItem>
                    <SelectItem value="usb">USB</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                    <SelectItem value="serie">Puerto Serie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipoConexion === 'red' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ip">Dirección IP</Label>
                    <Input id="ip" value={formData.ip} onChange={(e) => setFormData({ ...formData, ip: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="puerto">Puerto</Label>
                    <Input id="puerto" type="number" value={formData.puerto} onChange={(e) => setFormData({ ...formData, puerto: parseInt(e.target.value) || 9100 })} />
                  </div>
                </div>
              )}

              {formData.tipoConexion === 'bluetooth' && (
                <div className="space-y-2">
                  <Label htmlFor="mac">Dirección MAC</Label>
                  <Input id="mac" value={formData.mac} onChange={(e) => setFormData({ ...formData, mac: e.target.value })} />
                </div>
              )}

              {formData.tipoConexion === 'serie' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="puertoSerie">Puerto Serie</Label>
                    <Input id="puertoSerie" value={formData.puertoSerie} onChange={(e) => setFormData({ ...formData, puertoSerie: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baudRate">Velocidad (baud)</Label>
                    <Input id="baudRate" type="number" value={formData.baudRate} onChange={(e) => setFormData({ ...formData, baudRate: parseInt(e.target.value) || 9600 })} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Configuración de Impresión</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ancho de Papel</Label>
                  <Select value={formData.anchoPapel.toString()} onValueChange={(value) => setFormData({ ...formData, anchoPapel: parseInt(value) as 58 | 80 })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58">58mm</SelectItem>
                      <SelectItem value="80">80mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copias">Copias por defecto</Label>
                  <Input id="copias" type="number" min={1} max={10} value={formData.copias} onChange={(e) => setFormData({ ...formData, copias: parseInt(e.target.value) || 1 })} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div><Label className="font-medium">Cortar papel</Label><p className="text-sm text-muted-foreground">Cortar automáticamente al finalizar</p></div>
                  <Switch checked={formData.cortarPapel} onCheckedChange={(checked) => setFormData({ ...formData, cortarPapel: checked })} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div><Label className="font-medium">Abrir cajón</Label><p className="text-sm text-muted-foreground">Abrir cajón al imprimir ticket</p></div>
                  <Switch checked={formData.abrirCajon} onCheckedChange={(checked) => setFormData({ ...formData, abrirCajon: checked })} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div><Label className="font-medium">Imprimir logo</Label><p className="text-sm text-muted-foreground">Incluir logo en los tickets</p></div>
                  <Switch checked={formData.imprimirLogo} onCheckedChange={(checked) => setFormData({ ...formData, imprimirLogo: checked })} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div><Label className="font-medium">Activa</Label><p className="text-sm text-muted-foreground">La impresora está disponible</p></div>
                  <Switch checked={formData.activo} onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild><Link href="/impresoras">Cancelar</Link></Button>
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
