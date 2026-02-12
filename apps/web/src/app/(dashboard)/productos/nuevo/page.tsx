'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { productosService } from '@/services/productos.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Euro,
  ChefHat,
} from 'lucide-react'
import { toast } from 'sonner'
import { useFormValidation, ValidationRule } from '@/hooks/useFormValidation'

// Reglas de validación
const validationRules: ValidationRule[] = [
  { field: 'nombre', label: 'Nombre', required: true, minLength: 2 },
  { field: 'sku', label: 'SKU', required: true, minLength: 2 },
  {
    field: 'precios.venta',
    label: 'Precio de venta',
    required: true,
    custom: (value) => {
      if (value === undefined || value === null || value < 0) {
        return 'El precio de venta no puede ser negativo'
      }
      return null
    },
  },
]

// Componentes de tabs (reutilizamos los mismos de edición)
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

export default function NuevoProductoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const { validate } = useFormValidation(validationRules)

  // Estado inicial con valores por defecto
  const [formData, setFormData] = useState({
    // Tab 1: Información General
    nombre: '',
    descripcion: '',
    descripcionCorta: '',
    sku: '',
    codigoBarras: '',
    codigosAlternativos: [],
    referencia: '',
    familiaId: '',
    marca: '',
    tags: [],
    estadoId: '',
    situacionId: '',
    clasificacionId: '',
    tipo: 'simple' as 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima',

    // Tab 2: Precios e Impuestos
    precios: {
      compra: 0,
      venta: 0,
      pvp: 0,
      margen: 0,
    },
    preciosPorCantidad: [],
    iva: 21,
    tipoImpuesto: 'iva' as 'iva' | 'igic' | 'exento',
    tipoImpuestoId: '',

    // Tab 3: Stock y Almacenes
    stock: {
      cantidad: 0,
      minimo: 0,
      maximo: 0,
      ubicacion: '',
    },
    gestionaStock: true,
    permitirStockNegativo: false,
    stockPorAlmacen: [],

    // Tab 4: Variantes
    tieneVariantes: false,
    atributos: [],
    variantes: [],

    // Tab 5: Trazabilidad
    trazabilidad: {
      tipo: 'ninguna' as 'ninguna' | 'lote' | 'numero_serie',
      lotes: [],
      numerosSerie: [],
    },

    // Tab 6: Kit/Componentes
    componentesKit: [],

    // Tab 7: Imágenes
    imagenes: [],
    imagenPrincipal: '',

    // Tab 8: Características y Medidas
    peso: 0,
    volumen: 0,
    dimensiones: {
      largo: 0,
      ancho: 0,
      alto: 0,
    },
    unidadMedida: 'unidades',
    unidadesEmbalaje: 0,
    pesoEmbalaje: 0,

    // Tab 9: Configuración TPV/Web
    usarEnTPV: true,
    usarEnKiosk: false,
    permiteDescuento: true,
    precioModificable: false,
    imprimirEnTicket: true,
    publicarWeb: false,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [],

    // Tab 10: Notas
    notas: '',
    notasInternas: '',
    instruccionesUso: '',
    garantiaMeses: 0,
    requiereInstalacion: false,
    requiereMantenimiento: false,

    // Tab 11: Restauración
    restauracion: {
      zonaPreparacionId: '',
      impresoraId: '',
      tiempoPreparacionMinutos: 0,
      prioridadPreparacion: 'normal',
      mostrarEnKds: true,
      gruposModificadoresIds: [],
      alergenosIds: [],
      permitirNotasCamarero: true,
      requierePuntoCoccion: false,
      puedeSerAcompanamiento: false,
      requiereAcompanamiento: false,
      esParaCompartir: false,
      disponibleParaLlevar: true,
      infoNutricional: {
        calorias: undefined,
        proteinas: undefined,
        carbohidratos: undefined,
        grasas: undefined,
      },
    },

    // Estado
    activo: true,
    disponible: true,
    destacado: false,
    nuevo: false,
    oferta: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar con mensajes bonitos
    if (!validate(formData)) {
      return
    }

    setLoading(true)

    try {
      // Limpiar campos ObjectId vacíos (convertir '' a undefined)
      const cleanedData: any = { ...formData }
      const objectIdFields = ['familiaId', 'estadoId', 'situacionId', 'clasificacionId', 'tipoImpuestoId']
      objectIdFields.forEach(field => {
        if (cleanedData[field] === '') {
          delete cleanedData[field]
        }
      })
      // Limpiar campos de restauración
      if (cleanedData.restauracion) {
        if (cleanedData.restauracion.zonaPreparacionId === '') delete cleanedData.restauracion.zonaPreparacionId
        if (cleanedData.restauracion.impresoraId === '') delete cleanedData.restauracion.impresoraId
      }

      // Calcular margen automáticamente
      if (cleanedData.precios.compra > 0 && cleanedData.precios.venta > 0) {
        cleanedData.precios.margen =
          ((cleanedData.precios.venta - cleanedData.precios.compra) / cleanedData.precios.compra) * 100
      }

      // Si no tiene PVP, usar precio de venta
      if (!cleanedData.precios.pvp || cleanedData.precios.pvp === 0) {
        cleanedData.precios.pvp = cleanedData.precios.venta
      }

      // Crear el producto
      await productosService.create(cleanedData)
      toast.success('Producto creado correctamente')
      router.push('/productos')
    } catch (error: any) {
      console.error('Error al crear producto:', error)
      toast.error(error.response?.data?.message || error.message || 'Error al crear el producto')
    } finally {
      setLoading(false)
    }
  }

  return (
    
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
              Nuevo Producto
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Completa la información del producto. Los campos marcados con * son obligatorios.
            </p>
          </div>
        </div>

        {/* Formulario con pestañas */}
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
              <TabGeneral formData={formData} setFormData={setFormData} isEditing={true} />
            </TabsContent>

            <TabsContent value="precios" className="mt-4">
              <TabPrecios formData={formData} setFormData={setFormData} isEditing={true} />
            </TabsContent>

            <TabsContent value="stock" className="mt-4">
              <TabStock formData={formData} setFormData={setFormData} isEditing={true} />
            </TabsContent>

            <TabsContent value="variantes" className="mt-4">
              <TabVariantes formData={formData} setFormData={setFormData} isEditing={true} />
            </TabsContent>

            <TabsContent value="trazabilidad" className="mt-4">
              <TabTrazabilidad formData={formData} setFormData={setFormData} isEditing={true} />
            </TabsContent>

            <TabsContent value="kit" className="mt-4">
              <TabKit formData={formData} setFormData={setFormData} isEditing={true} />
            </TabsContent>

            <TabsContent value="restauracion" className="mt-4">
              <TabRestauracion formData={formData} setFormData={setFormData} isEditing={true} />
            </TabsContent>

            <TabsContent value="imagenes" className="mt-4">
              <TabImagenes formData={formData} setFormData={setFormData} isEditing={true} />
            </TabsContent>

            <TabsContent value="medidas" className="mt-4">
              <TabMedidas formData={formData} setFormData={setFormData} isEditing={true} />
            </TabsContent>

            <TabsContent value="web" className="mt-4">
              <TabWeb formData={formData} setFormData={setFormData} isEditing={true} />
            </TabsContent>

            <TabsContent value="notas" className="mt-4">
              <TabNotas formData={formData} setFormData={setFormData} isEditing={true} />
            </TabsContent>
          </Tabs>

          {/* Botones de acción */}
          <Card className="p-4 mt-6 bg-muted/50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Puedes configurar opciones adicionales después de crear el producto
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crear Producto
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    
  )
}
