'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { crmService } from '@/services/crm.service'
import { EtapaPipeline, CreateEtapaPipelineDTO } from '@/types/crm.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  GripVertical,
  Settings,
  Loader2,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

const COLORES_PREDEFINIDOS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#F97316', // orange
  '#6B7280', // gray
]

export default function ConfiguracionPipelinePage() {
  const [etapas, setEtapas] = useState<EtapaPipeline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingEtapa, setEditingEtapa] = useState<EtapaPipeline | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateEtapaPipelineDTO>({
    nombre: '',
    descripcion: '',
    color: '#3B82F6',
    probabilidadDefecto: 50,
    esInicial: false,
    esFinal: false,
    esCierrePositivo: false,
    activo: true,
  })

  const cargarEtapas = async () => {
    try {
      setIsLoading(true)
      const data = await crmService.getEtapas(false) // Incluir inactivas
      setEtapas(data)
    } catch (error: any) {
      console.error('Error cargando etapas:', error)
      toast.error('Error al cargar las etapas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarEtapas()
  }, [])

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      color: '#3B82F6',
      probabilidadDefecto: 50,
      esInicial: false,
      esFinal: false,
      esCierrePositivo: false,
      activo: true,
    })
    setEditingEtapa(null)
  }

  const handleOpenDialog = (etapa?: EtapaPipeline) => {
    if (etapa) {
      setEditingEtapa(etapa)
      setFormData({
        nombre: etapa.nombre,
        descripcion: etapa.descripcion || '',
        color: etapa.color,
        probabilidadDefecto: etapa.probabilidadDefecto,
        esInicial: etapa.esInicial,
        esFinal: etapa.esFinal,
        esCierrePositivo: etapa.esCierrePositivo,
        activo: etapa.activo,
      })
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    resetForm()
  }

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    try {
      setIsSubmitting(true)
      if (editingEtapa) {
        await crmService.updateEtapa(editingEtapa._id, formData)
        toast.success('Etapa actualizada')
      } else {
        await crmService.createEtapa(formData)
        toast.success('Etapa creada')
      }
      handleCloseDialog()
      cargarEtapas()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estas seguro de eliminar esta etapa? Las oportunidades asociadas quedaran sin etapa.')) return

    try {
      await crmService.deleteEtapa(id)
      toast.success('Etapa eliminada')
      cargarEtapas()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    }
  }

  const handleToggleActivo = async (id: string, activo: boolean) => {
    try {
      await crmService.cambiarEstadoEtapa(id, activo)
      toast.success(activo ? 'Etapa activada' : 'Etapa desactivada')
      cargarEtapas()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado')
    }
  }

  const handleMover = async (index: number, direccion: 'arriba' | 'abajo') => {
    const newEtapas = [...etapas]
    const newIndex = direccion === 'arriba' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= etapas.length) return

    ;[newEtapas[index], newEtapas[newIndex]] = [newEtapas[newIndex], newEtapas[index]]

    try {
      await crmService.reordenarEtapas({
        etapas: newEtapas.map((e, i) => ({ id: e._id, orden: i + 1 })),
      })
      setEtapas(newEtapas)
      toast.success('Orden actualizado')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al reordenar')
      cargarEtapas()
    }
  }

  const handleInicializar = async () => {
    if (!confirm('¿Crear etapas por defecto? Esto no eliminara las etapas existentes.')) return

    try {
      await crmService.inicializarPipeline()
      toast.success('Pipeline inicializado')
      cargarEtapas()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al inicializar')
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      
    )
  }

  return (
      <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/crm">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline de Ventas</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Configura las etapas de tu proceso de ventas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {etapas.length === 0 && (
              <Button variant="outline" onClick={handleInicializar}>
                <Sparkles className="h-4 w-4 mr-2" />
                Inicializar
              </Button>
            )}
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Etapa
            </Button>
          </div>
        </div>

        {/* Lista de etapas */}
        {etapas.length === 0 ? (
          <Card className="p-8 text-center">
            <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sin Etapas</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Crea etapas para organizar tu pipeline de ventas. Puedes inicializar con etapas por defecto.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={handleInicializar}>
                <Sparkles className="h-4 w-4 mr-2" />
                Inicializar con valores por defecto
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Crear manualmente
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="divide-y">
            {etapas.map((etapa, index) => (
              <div
                key={etapa._id}
                className={`p-4 flex items-center gap-4 ${!etapa.activo ? 'opacity-50' : ''}`}
              >
                {/* Handle para drag */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMover(index, 'arriba')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMover(index, 'abajo')}
                    disabled={index === etapas.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Color */}
                <div
                  className="w-4 h-12 rounded-full flex-shrink-0"
                  style={{ backgroundColor: etapa.color }}
                />

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{etapa.nombre}</span>
                    {etapa.esInicial && (
                      <Badge variant="outline" className="text-xs">Inicial</Badge>
                    )}
                    {etapa.esFinal && (
                      <Badge variant="outline" className="text-xs">Final</Badge>
                    )}
                    {etapa.esCierrePositivo && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                        Cierre positivo
                      </Badge>
                    )}
                    {!etapa.activo && (
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500">
                        Inactiva
                      </Badge>
                    )}
                  </div>
                  {etapa.descripcion && (
                    <p className="text-sm text-gray-500 mt-1">{etapa.descripcion}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-1">
                    {etapa.probabilidadDefecto}% probabilidad
                  </p>
                </div>

                {/* Stats */}
                {etapa.totalOportunidades !== undefined && (
                  <div className="text-right">
                    <p className="text-sm font-medium">{etapa.totalOportunidades} oportunidades</p>
                    {etapa.valorTotal !== undefined && (
                      <p className="text-sm text-gray-500">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(etapa.valorTotal)}
                      </p>
                    )}
                  </div>
                )}

                {/* Toggle activo */}
                <Switch
                  checked={etapa.activo}
                  onCheckedChange={(checked) => handleToggleActivo(etapa._id, checked)}
                />

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(etapa)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(etapa._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Ayuda */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="font-medium mb-2">Consejos</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Ordena las etapas de izquierda a derecha segun avance el proceso de venta</li>
            <li>• Marca como "Inicial" la primera etapa donde entran las oportunidades</li>
            <li>• Marca como "Final" y "Cierre positivo" la etapa de venta ganada</li>
            <li>• La probabilidad por defecto se asigna automaticamente al mover una oportunidad</li>
          </ul>
        </Card>
      </div>

      {/* Dialog crear/editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEtapa ? 'Editar Etapa' : 'Nueva Etapa'}</DialogTitle>
            <DialogDescription>
              Configura los detalles de la etapa del pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Propuesta enviada"
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripcion opcional..."
                rows={2}
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLORES_PREDEFINIDOS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="probabilidad">Probabilidad por defecto (%)</Label>
              <Input
                id="probabilidad"
                type="number"
                min="0"
                max="100"
                value={formData.probabilidadDefecto}
                onChange={(e) => setFormData(prev => ({ ...prev, probabilidadDefecto: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Etapa inicial</Label>
                  <p className="text-xs text-gray-500">Primera etapa del pipeline</p>
                </div>
                <Switch
                  checked={formData.esInicial}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, esInicial: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Etapa final</Label>
                  <p className="text-xs text-gray-500">Ultima etapa del proceso</p>
                </div>
                <Switch
                  checked={formData.esFinal}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, esFinal: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Cierre positivo</Label>
                  <p className="text-xs text-gray-500">Indica venta ganada</p>
                </div>
                <Switch
                  checked={formData.esCierrePositivo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, esCierrePositivo: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
  )
}
