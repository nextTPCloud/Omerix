'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { productosService } from '@/services/productos.service'
import { Producto } from '@/types/producto.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Save,
  Package,
  Info,
  Warehouse,
  Barcode,
  Palette,
  PackageOpen,
  Image as ImageIcon,
  Ruler,
  Globe,
  FileText,
  Edit,
  Euro,
  ChefHat,
} from 'lucide-react'
import { toast } from 'sonner'

// Componentes de tabs
import { TabGeneral } from '@/components/productos/TabGeneral'
import { TabPrecios } from '@/components/productos/TabPrecios'
import { TabStock } from '@/components/productos/TabStock'
import { TabVariantes } from '@/components/productos/TabVariantes'
import { TabTrazabilidad } from '@/components/productos/TabTrazabilidad'
import { TabKit } from '@/components/productos/TabKit'
import { TabImagenes } from '@/components/productos/TabImagenes'
import { TabMedidas } from '@/components/productos/TabMedidas'
import { TabWeb } from '@/components/productos/TabWeb'
import { TabNotas } from '@/components/productos/TabNotas'
import { TabRestauracion } from '@/components/productos/TabRestauracion'

export default function ProductoDetallePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const productoId = params.id as string

  // Activar modo edición si viene con ?edit=true
  const editMode = searchParams.get('edit') === 'true'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(editMode)
  const [activeTab, setActiveTab] = useState('general')
  const [formData, setFormData] = useState<Producto | null>(null)

  useEffect(() => {
    fetchProducto()
  }, [productoId])

  const fetchProducto = async () => {
    try {
      setLoading(true)
      const response = await productosService.getById(productoId)
      setFormData(response.data)
    } catch (error: any) {
      console.error('Error al cargar producto:', error)
      toast.error(error.response?.data?.message || 'Error al cargar el producto')
      router.push('/productos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setSaving(true)

    try {
      // Limpiar campos ObjectId vacíos (convertir '' a undefined)
      const cleanedData = { ...formData }
      const objectIdFields = ['familiaId', 'estadoId', 'situacionId', 'clasificacionId', 'tipoImpuestoId']
      objectIdFields.forEach(field => {
        if ((cleanedData as any)[field] === '') {
          delete (cleanedData as any)[field]
        }
      })
      // Limpiar campos de restauración
      if ((cleanedData as any).restauracion) {
        if ((cleanedData as any).restauracion.zonaPreparacionId === '') delete (cleanedData as any).restauracion.zonaPreparacionId
        if ((cleanedData as any).restauracion.impresoraId === '') delete (cleanedData as any).restauracion.impresoraId
      }

      await productosService.update(productoId, cleanedData)
      toast.success('Producto actualizado correctamente')
      setIsEditing(false)
      // Limpiar parámetro edit de la URL
      if (editMode) {
        router.replace(`/productos/${productoId}`)
      }
      fetchProducto()
    } catch (error: any) {
      console.error('Error al actualizar producto:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar el producto')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !formData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-7 w-7 text-primary" />
              {formData.nombre}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={formData.activo ? 'default' : 'secondary'}>
                {formData.activo ? 'Activo' : 'Inactivo'}
              </Badge>
              {formData.destacado && <Badge variant="outline">Destacado</Badge>}
              {formData.nuevo && <Badge className="bg-green-500">Nuevo</Badge>}
              {formData.oferta && <Badge className="bg-orange-500">Oferta</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    // Limpiar parámetro edit de la URL
                    if (editMode) {
                      router.replace(`/productos/${productoId}`)
                    }
                    fetchProducto()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Formulario con pesta�as */}
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-11 gap-1">
              <TabsTrigger value="general" className="text-xs">
                <Info className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="precios" className="text-xs">
                <Euro className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Precios</span>
              </TabsTrigger>
              <TabsTrigger value="stock" className="text-xs">
                <Warehouse className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Stock</span>
              </TabsTrigger>
              <TabsTrigger value="variantes" className="text-xs">
                <Palette className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Variantes</span>
              </TabsTrigger>
              <TabsTrigger value="trazabilidad" className="text-xs">
                <Barcode className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Trazab.</span>
              </TabsTrigger>
              <TabsTrigger value="kit" className="text-xs">
                <PackageOpen className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Kit</span>
              </TabsTrigger>
              <TabsTrigger value="restauracion" className="text-xs">
                <ChefHat className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Restaur.</span>
              </TabsTrigger>
              <TabsTrigger value="imagenes" className="text-xs">
                <ImageIcon className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Imagenes</span>
              </TabsTrigger>
              <TabsTrigger value="medidas" className="text-xs">
                <Ruler className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Medidas</span>
              </TabsTrigger>
              <TabsTrigger value="web" className="text-xs">
                <Globe className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">TPV/Web</span>
              </TabsTrigger>
              <TabsTrigger value="notas" className="text-xs">
                <FileText className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Notas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4">
              <TabGeneral formData={formData} setFormData={setFormData} isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="precios" className="mt-4">
              <TabPrecios formData={formData} setFormData={setFormData} isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="stock" className="mt-4">
              <TabStock formData={formData} setFormData={setFormData} isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="variantes" className="mt-4">
              <TabVariantes formData={formData} setFormData={setFormData} isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="trazabilidad" className="mt-4">
              <TabTrazabilidad formData={formData} setFormData={setFormData} isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="kit" className="mt-4">
              <TabKit formData={formData} setFormData={setFormData} isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="restauracion" className="mt-4">
              <TabRestauracion formData={formData} setFormData={setFormData} isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="imagenes" className="mt-4">
              <TabImagenes formData={formData} setFormData={setFormData} isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="medidas" className="mt-4">
              <TabMedidas formData={formData} setFormData={setFormData} isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="web" className="mt-4">
              <TabWeb formData={formData} setFormData={setFormData} isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="notas" className="mt-4">
              <TabNotas formData={formData} setFormData={setFormData} isEditing={isEditing} />
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </DashboardLayout>
  )
}
