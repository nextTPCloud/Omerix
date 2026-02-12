'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { inventariosService, CreateInventarioDTO } from '@/services/inventarios.service'
import { almacenesService } from '@/services/almacenes.service'
import { familiasService } from '@/services/familias.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  ArrowLeft,
  Save,
  ClipboardList,
  Warehouse,
  FolderTree,
  RefreshCw,
  Package,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useUserPreferences } from '@/hooks/useUserPreferences'

export default function NuevoInventarioPage() {
  const router = useRouter()
  const { almacenDefaultId } = useUserPreferences()

  // Estado del formulario
  const [almacenId, setAlmacenId] = useState('')
  const [tipo, setTipo] = useState<'total' | 'parcial'>('total')
  const [familiaIds, setFamiliaIds] = useState<string[]>([])
  const [ubicaciones, setUbicaciones] = useState('')
  const [soloConStock, setSoloConStock] = useState(false)
  const [bloquearMovimientos, setBloquearMovimientos] = useState(false)
  const [observaciones, setObservaciones] = useState('')

  // Estado de datos auxiliares
  const [almacenes, setAlmacenes] = useState<{ _id: string; nombre: string }[]>([])
  const [familias, setFamilias] = useState<{ _id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Cargar datos al inicio
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [almacenesRes, familiasRes] = await Promise.all([
          almacenesService.getActivos(),
          familiasService.getAll({ limit: 100 }),
        ])
        const almacenesData = almacenesRes.data || []
        setAlmacenes(almacenesData)
        setFamilias(familiasRes.data || [])

        // Seleccionar almacen por defecto: preferencia usuario > principal > primero
        if (almacenesData.length > 0) {
          const almacenDefault = almacenDefaultId
            ? almacenesData.find((a: any) => a._id === almacenDefaultId)
            : almacenesData.find((a: any) => a.esPrincipal) || almacenesData[0]
          if (almacenDefault) {
            setAlmacenId(almacenDefault._id)
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!almacenId) {
      toast.error('Selecciona un almacén')
      return
    }

    if (tipo === 'parcial' && familiaIds.length === 0 && !ubicaciones.trim()) {
      toast.error('Para inventario parcial, selecciona al menos una familia o indica ubicaciones')
      return
    }

    setSaving(true)
    try {
      const data: CreateInventarioDTO = {
        almacenId,
        tipo,
        familiaIds: tipo === 'parcial' && familiaIds.length > 0 ? familiaIds : undefined,
        ubicaciones: tipo === 'parcial' && ubicaciones.trim()
          ? ubicaciones.split(',').map(u => u.trim()).filter(u => u)
          : undefined,
        soloConStock,
        bloquearMovimientos,
        observaciones: observaciones || undefined,
      }

      const res = await inventariosService.crear(data)
      toast.success('Inventario creado correctamente')
      router.push(`/almacenes/inventarios/${res.data._id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear el inventario')
    } finally {
      setSaving(false)
    }
  }

  const toggleFamilia = (familiaId: string) => {
    setFamiliaIds(prev =>
      prev.includes(familiaId)
        ? prev.filter(id => id !== familiaId)
        : [...prev, familiaId]
    )
  }

  return (
    
      <div className="container mx-auto p-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/almacenes/inventarios">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Nuevo Inventario</h1>
            <p className="text-muted-foreground">Configurar nueva sesión de inventario físico</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Almacén */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Almacén
              </CardTitle>
              <CardDescription>
                Selecciona el almacén donde se realizará el inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchableSelect
                options={almacenes.map((a: any) => ({
                  value: a._id,
                  label: a.nombre,
                  description: a.esPrincipal ? 'Principal' : a.codigo
                }))}
                value={almacenId}
                onValueChange={setAlmacenId}
                placeholder="Seleccionar almacén..."
                searchPlaceholder="Buscar almacén..."
                emptyMessage="No hay almacenes disponibles"
              />
            </CardContent>
          </Card>

          {/* Tipo de inventario */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Tipo de Inventario
              </CardTitle>
              <CardDescription>
                Elige si deseas inventariar todos los productos o solo algunos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={tipo}
                onValueChange={(value: 'total' | 'parcial') => setTipo(value)}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="total"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    tipo === 'total' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                  }`}
                >
                  <RadioGroupItem value="total" id="total" />
                  <div>
                    <div className="font-medium">Inventario Total</div>
                    <div className="text-xs text-muted-foreground">Todos los productos del almacén</div>
                  </div>
                </Label>
                <Label
                  htmlFor="parcial"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    tipo === 'parcial' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                  }`}
                >
                  <RadioGroupItem value="parcial" id="parcial" />
                  <div>
                    <div className="font-medium">Inventario Parcial</div>
                    <div className="text-xs text-muted-foreground">Familias o ubicaciones específicas</div>
                  </div>
                </Label>
              </RadioGroup>

              {/* Filtros para inventario parcial */}
              {tipo === 'parcial' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FolderTree className="h-4 w-4" />
                      Familias a inventariar
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-auto p-2 border rounded-lg">
                      {familias.map((f) => (
                        <Label
                          key={f._id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={familiaIds.includes(f._id)}
                            onCheckedChange={() => toggleFamilia(f._id)}
                          />
                          <span className="text-sm">{f.nombre}</span>
                        </Label>
                      ))}
                    </div>
                    {familiaIds.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {familiaIds.length} familia(s) seleccionada(s)
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Ubicaciones (opcional)</Label>
                    <Input
                      value={ubicaciones}
                      onChange={(e) => setUbicaciones(e.target.value)}
                      placeholder="Ej: A1, A2, B1 (separadas por comas)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Deja vacío para incluir todas las ubicaciones
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opciones */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Opciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                <Checkbox
                  checked={soloConStock}
                  onCheckedChange={(checked) => setSoloConStock(checked as boolean)}
                />
                <div>
                  <div className="font-medium">Solo productos con stock</div>
                  <div className="text-xs text-muted-foreground">
                    Excluir productos con stock cero
                  </div>
                </div>
              </Label>

              <Label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                <Checkbox
                  checked={bloquearMovimientos}
                  onCheckedChange={(checked) => setBloquearMovimientos(checked as boolean)}
                />
                <div>
                  <div className="font-medium">Bloquear movimientos</div>
                  <div className="text-xs text-muted-foreground">
                    Impedir entradas/salidas mientras dure el inventario
                  </div>
                </div>
              </Label>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones adicionales sobre el inventario..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-4">
            <Link href="/almacenes/inventarios">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving || !almacenId}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Inventario
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    
  )
}
