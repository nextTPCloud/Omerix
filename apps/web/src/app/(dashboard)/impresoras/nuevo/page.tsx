'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { impresorasService } from '@/services/impresoras.service'
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
import { ArrowLeft, Save, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { CodeInput } from '@/components/ui/code-input'

export default function NuevaImpresoraPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'ticket' as 'ticket' | 'cocina' | 'etiquetas' | 'comanda',
    tipoConexion: 'red' as 'usb' | 'red' | 'bluetooth' | 'serial',
    ip: '',
    puerto: 9100,
    mac: '',
    puertoSerial: '',
    nombreWindows: '',
    nombreCups: '',
    anchoPapel: 48,
    cortarPapel: true,
    abrirCajon: false,
    imprimirLogo: true,
    copias: 1,
    predeterminada: false,
    activo: true,
  })

  const searchCodigos = async (prefix: string): Promise<string[]> => {
    try {
      const response = await impresorasService.searchCodigos(prefix)
      return response.data || []
    } catch {
      return []
    }
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

    setIsLoading(true)
    try {
      // Estructurar datos según el modelo del backend
      const dataToSend = {
        codigo: formData.codigo,
        nombre: formData.nombre,
        tipo: formData.tipo,
        conexion: {
          tipo: formData.tipoConexion,
          ip: formData.ip || undefined,
          puerto: formData.puerto,
          mac: formData.mac || undefined,
          puertoSerial: formData.puertoSerial || undefined,
          nombreWindows: formData.nombreWindows || undefined,
          nombreCups: formData.nombreCups || undefined,
        },
        configuracion: {
          anchoCaracteres: formData.anchoPapel,
          cortarPapel: formData.cortarPapel,
          abrirCajon: formData.abrirCajon,
          imprimirLogo: formData.imprimirLogo,
          copias: formData.copias,
        },
        predeterminada: formData.predeterminada,
        activo: formData.activo,
      }
      const response = await impresorasService.create(dataToSend as any)
      if (response.success) {
        toast.success('Impresora creada correctamente')
        router.push('/impresoras')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear la impresora')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/impresoras"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Printer className="h-7 w-7 text-primary" />
              Nueva Impresora
            </h1>
            <p className="text-sm text-muted-foreground">Configura una nueva impresora</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <CodeInput
                    id="codigo"
                    value={formData.codigo}
                    onChange={(value) => setFormData({ ...formData, codigo: value })}
                    onSearchCodes={searchCodigos}
                    placeholder="Ej: IMP001"
                    helperText="Pulsa ↓ para sugerir código"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Impresora Cocina" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Impresora *</Label>
                  <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket">Ticket</SelectItem>
                      <SelectItem value="cocina">Cocina</SelectItem>
                      <SelectItem value="etiquetas">Etiquetas</SelectItem>
                      <SelectItem value="comanda">Comanda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anchoPapel">Ancho de caracteres</Label>
                  <Select value={formData.anchoPapel.toString()} onValueChange={(value) => setFormData({ ...formData, anchoPapel: parseInt(value) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="32">32 (58mm)</SelectItem>
                      <SelectItem value="40">40</SelectItem>
                      <SelectItem value="48">48 (80mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Conexión</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Conexión *</Label>
                <Select value={formData.tipoConexion} onValueChange={(value: any) => setFormData({ ...formData, tipoConexion: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="red">Red (TCP/IP)</SelectItem>
                    <SelectItem value="usb">USB</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                    <SelectItem value="serial">Puerto Serie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipoConexion === 'red' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ip">Dirección IP</Label>
                    <Input id="ip" value={formData.ip} onChange={(e) => setFormData({ ...formData, ip: e.target.value })} placeholder="192.168.1.100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="puerto">Puerto</Label>
                    <Input id="puerto" type="number" value={formData.puerto} onChange={(e) => setFormData({ ...formData, puerto: parseInt(e.target.value) || 9100 })} />
                  </div>
                </div>
              )}

              {formData.tipoConexion === 'usb' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombreWindows">Nombre en Windows</Label>
                    <Input id="nombreWindows" value={formData.nombreWindows} onChange={(e) => setFormData({ ...formData, nombreWindows: e.target.value })} placeholder="EPSON TM-T20III" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombreCups">Nombre en CUPS (Linux/Mac)</Label>
                    <Input id="nombreCups" value={formData.nombreCups} onChange={(e) => setFormData({ ...formData, nombreCups: e.target.value })} placeholder="EPSON_TM_T20III" />
                  </div>
                </div>
              )}

              {formData.tipoConexion === 'bluetooth' && (
                <div className="space-y-2">
                  <Label htmlFor="mac">Dirección MAC</Label>
                  <Input id="mac" value={formData.mac} onChange={(e) => setFormData({ ...formData, mac: e.target.value })} placeholder="XX:XX:XX:XX:XX:XX" />
                </div>
              )}

              {formData.tipoConexion === 'serial' && (
                <div className="space-y-2">
                  <Label htmlFor="puertoSerial">Puerto Serie</Label>
                  <Input id="puertoSerial" value={formData.puertoSerial} onChange={(e) => setFormData({ ...formData, puertoSerial: e.target.value })} placeholder="COM1 o /dev/ttyUSB0" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Configuración de Impresión</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="copias">Copias por defecto</Label>
                  <Input id="copias" type="number" min={1} max={10} value={formData.copias} onChange={(e) => setFormData({ ...formData, copias: parseInt(e.target.value) || 1 })} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Cortar papel</Label>
                    <p className="text-sm text-muted-foreground">Cortar automáticamente al finalizar</p>
                  </div>
                  <Switch checked={formData.cortarPapel} onCheckedChange={(checked) => setFormData({ ...formData, cortarPapel: checked })} />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Abrir cajón</Label>
                    <p className="text-sm text-muted-foreground">Abrir cajón portamonedas al imprimir ticket</p>
                  </div>
                  <Switch checked={formData.abrirCajon} onCheckedChange={(checked) => setFormData({ ...formData, abrirCajon: checked })} />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Imprimir logo</Label>
                    <p className="text-sm text-muted-foreground">Incluir logo de la empresa en los tickets</p>
                  </div>
                  <Switch checked={formData.imprimirLogo} onCheckedChange={(checked) => setFormData({ ...formData, imprimirLogo: checked })} />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Predeterminada</Label>
                    <p className="text-sm text-muted-foreground">Usar como impresora por defecto para su tipo</p>
                  </div>
                  <Switch checked={formData.predeterminada} onCheckedChange={(checked) => setFormData({ ...formData, predeterminada: checked })} />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Activa</Label>
                    <p className="text-sm text-muted-foreground">La impresora está disponible para usar</p>
                  </div>
                  <Switch checked={formData.activo} onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild><Link href="/impresoras">Cancelar</Link></Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Impresora'}
            </Button>
          </div>
        </form>
      </div>
    
  )
}
