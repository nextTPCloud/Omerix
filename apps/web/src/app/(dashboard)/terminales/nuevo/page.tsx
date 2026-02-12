'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { terminalesService } from '@/services/terminales.service'
import { CreateTerminalDTO, MARCAS_TERMINAL, MarcaTerminal } from '@/types/terminal.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CodeInput } from '@/components/ui/code-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, RefreshCw, Fingerprint, Wifi, Settings } from 'lucide-react'
import { toast } from 'sonner'

export default function NuevoTerminalPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CreateTerminalDTO>({
    nombre: '',
    ip: '',
    puerto: 4370,
    marca: 'ZKTeco',
    configuracion: {
      frecuenciaMinutos: 15,
      sincronizarAsistencia: true,
      sincronizarEmpleados: true,
      timezone: 'Europe/Madrid',
      eliminarRegistrosSincronizados: false,
    },
  })

  useEffect(() => {
    // Cargar código sugerido
    const loadCodigo = async () => {
      try {
        const response = await terminalesService.sugerirCodigo('TRM')
        if (response.success) {
          setFormData(prev => ({ ...prev, codigo: response.data.codigo }))
        }
      } catch (error) {
        // Ignorar error
      }
    }
    loadCodigo()
  }, [])

  const handleMarcaChange = (marca: MarcaTerminal) => {
    const puertoDefault = MARCAS_TERMINAL.find(m => m.value === marca)?.puerto || 4370
    setFormData(prev => ({
      ...prev,
      marca,
      puerto: puertoDefault,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.ip) {
      toast.error('El nombre e IP son obligatorios')
      return
    }

    try {
      setSaving(true)
      const response = await terminalesService.create(formData)

      if (response.success) {
        toast.success('Terminal creado correctamente')
        router.push(`/terminales/${response.data._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear terminal')
    } finally {
      setSaving(false)
    }
  }

  return (
    
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Fingerprint className="h-6 w-6" />
                Nuevo Terminal
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Datos básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Datos del Terminal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <CodeInput
                    id="codigo"
                    value={formData.codigo || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, codigo: value }))}
                    onSearchCodes={terminalesService.searchCodigos}
                    placeholder="TRM001"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Select
                    value={formData.marca}
                    onValueChange={(value) => handleMarcaChange(value as MarcaTerminal)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MARCAS_TERMINAL.map((marca) => (
                        <SelectItem key={marca.value} value={marca.value}>
                          {marca.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Entrada Principal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Terminal ubicado en la entrada principal..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={formData.modelo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                  placeholder="K40, U300, etc."
                />
              </div>
            </CardContent>
          </Card>

          {/* Conexión */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Conexión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ip">Dirección IP *</Label>
                <Input
                  id="ip"
                  value={formData.ip}
                  onChange={(e) => setFormData(prev => ({ ...prev, ip: e.target.value }))}
                  placeholder="192.168.1.100"
                  pattern="^(\d{1,3}\.){3}\d{1,3}$"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="puerto">Puerto</Label>
                <Input
                  id="puerto"
                  type="number"
                  min={1}
                  max={65535}
                  value={formData.puerto || 4370}
                  onChange={(e) => setFormData(prev => ({ ...prev, puerto: parseInt(e.target.value) || 4370 }))}
                />
                <p className="text-xs text-muted-foreground">
                  Puerto por defecto: ZKTeco=4370, ANVIZ=5010, Hikvision=8000
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mac">Dirección MAC (opcional)</Label>
                <Input
                  id="mac"
                  value={formData.mac || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, mac: e.target.value.toUpperCase() }))}
                  placeholder="AA:BB:CC:DD:EE:FF"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroSerie">Número de Serie (opcional)</Label>
                <Input
                  id="numeroSerie"
                  value={formData.numeroSerie || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroSerie: e.target.value }))}
                  placeholder="Se obtiene al probar conexión"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuración de sincronización */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Sincronización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="frecuencia">Frecuencia (minutos)</Label>
                <Input
                  id="frecuencia"
                  type="number"
                  min={1}
                  max={1440}
                  value={formData.configuracion?.frecuenciaMinutos || 15}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion!,
                      frecuenciaMinutos: parseInt(e.target.value) || 15,
                    },
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Intervalo para sincronización automática
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Input
                  id="timezone"
                  value={formData.configuracion?.timezone || 'Europe/Madrid'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion!,
                      timezone: e.target.value,
                    },
                  }))}
                />
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sincronizarAsistencia"
                    checked={formData.configuracion?.sincronizarAsistencia ?? true}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      configuracion: {
                        ...prev.configuracion!,
                        sincronizarAsistencia: !!checked,
                      },
                    }))}
                  />
                  <Label htmlFor="sincronizarAsistencia" className="text-sm">
                    Sincronizar fichajes automáticamente
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sincronizarEmpleados"
                    checked={formData.configuracion?.sincronizarEmpleados ?? true}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      configuracion: {
                        ...prev.configuracion!,
                        sincronizarEmpleados: !!checked,
                      },
                    }))}
                  />
                  <Label htmlFor="sincronizarEmpleados" className="text-sm">
                    Sincronizar empleados automáticamente
                  </Label>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="eliminarRegistros"
                    checked={formData.configuracion?.eliminarRegistrosSincronizados ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      configuracion: {
                        ...prev.configuracion!,
                        eliminarRegistrosSincronizados: !!checked,
                      },
                    }))}
                  />
                  <Label htmlFor="eliminarRegistros" className="text-sm">
                    Limpiar registros del terminal tras sincronizar
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    
  )
}
