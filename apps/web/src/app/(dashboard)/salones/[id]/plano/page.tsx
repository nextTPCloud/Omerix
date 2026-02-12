'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { SalonEditor } from '@/components/restauracion/SalonEditor'
import { salonesService, Salon, Mesa } from '@/services/salones.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, LayoutGrid, RefreshCw, Settings, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SalonPlanoPage() {
  const params = useParams()
  const router = useRouter()
  const salonId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [salon, setSalon] = useState<Salon | null>(null)
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [planoConfig, setPlanoConfig] = useState({
    ancho: 800,
    alto: 600,
    escala: 1,
    imagenFondo: '',
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [salonRes, mesasRes] = await Promise.all([
        salonesService.getById(salonId),
        salonesService.getMesasBySalon(salonId),
      ])

      if (salonRes.success) {
        setSalon(salonRes.data)
        if (salonRes.data.plano) {
          setPlanoConfig({
            ancho: salonRes.data.plano.ancho || 800,
            alto: salonRes.data.plano.alto || 600,
            escala: salonRes.data.plano.escala || 1,
            imagenFondo: salonRes.data.plano.imagenFondo || '',
          })
        }
      }

      if (mesasRes.success) {
        setMesas(mesasRes.data || [])
      }
    } catch (error) {
      toast.error('Error al cargar los datos del salón')
    } finally {
      setLoading(false)
    }
  }, [salonId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSavePlanoConfig = async () => {
    try {
      setSaving(true)
      await salonesService.update(salonId, {
        plano: planoConfig,
      })
      toast.success('Configuración del plano guardada')
    } catch (error) {
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleMesasChange = (newMesas: Mesa[]) => {
    setMesas(newMesas)
  }

  const handleSaveFromEditor = async () => {
    // Recargar datos después de guardar
    await loadData()
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando plano del salón...</p>
          </div>
        </div>
      
    )
  }

  if (!salon) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-muted-foreground">Salón no encontrado</p>
            <Button asChild className="mt-4">
              <Link href="/salones">Volver a Salones</Link>
            </Button>
          </div>
        </div>
      
    )
  }

  return (
    
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/salones/${salonId}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <LayoutGrid className="h-7 w-7 text-primary" />
                Editor de Plano - {salon.nombre}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Arrastra las mesas para posicionarlas en el plano
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/salones/${salonId}`}>
                <Settings className="h-4 w-4 mr-2" />
                Editar Salón
              </Link>
            </Button>
          </div>
        </div>

        {/* Configuración del Plano */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración del Plano
            </CardTitle>
            <CardDescription>
              Define las dimensiones del área de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="ancho">Ancho (px)</Label>
                <Input
                  id="ancho"
                  type="number"
                  value={planoConfig.ancho}
                  onChange={(e) =>
                    setPlanoConfig({ ...planoConfig, ancho: parseInt(e.target.value) || 800 })
                  }
                  className="w-32"
                  min={400}
                  max={2000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alto">Alto (px)</Label>
                <Input
                  id="alto"
                  type="number"
                  value={planoConfig.alto}
                  onChange={(e) =>
                    setPlanoConfig({ ...planoConfig, alto: parseInt(e.target.value) || 600 })
                  }
                  className="w-32"
                  min={300}
                  max={1500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagenFondo">URL Imagen de Fondo</Label>
                <Input
                  id="imagenFondo"
                  type="url"
                  value={planoConfig.imagenFondo}
                  onChange={(e) =>
                    setPlanoConfig({ ...planoConfig, imagenFondo: e.target.value })
                  }
                  className="w-64"
                  placeholder="https://..."
                />
              </div>
              <Button onClick={handleSavePlanoConfig} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Editor de Plano */}
        <SalonEditor
          salonId={salonId}
          salonNombre={salon.nombre}
          plano={planoConfig}
          mesas={mesas}
          onMesasChange={handleMesasChange}
          onSave={handleSaveFromEditor}
        />

        {/* Estadísticas */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Total mesas:</span>
                <span className="font-bold ml-2">{mesas.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Capacidad total:</span>
                <span className="font-bold ml-2">
                  {mesas.reduce((acc, m) => acc + m.capacidadMaxima, 0)} personas
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Mesas libres:</span>
                <span className="font-bold ml-2 text-green-600">
                  {mesas.filter((m) => m.estado === 'libre').length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Mesas ocupadas:</span>
                <span className="font-bold ml-2 text-red-600">
                  {mesas.filter((m) => m.estado === 'ocupada').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    
  )
}
