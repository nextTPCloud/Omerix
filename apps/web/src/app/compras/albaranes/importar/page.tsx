'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { albaranesCompraService, OCRResultResponse } from '@/services/albaranes-compra.service'
import { proveedoresService } from '@/services/proveedores.service'
import { almacenesService } from '@/services/almacenes.service'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Package,
  Search,
  Sparkles,
  Truck,
  Info,
  Settings,
  CreditCard,
  RefreshCw,
} from 'lucide-react'

interface LineaEditada {
  codigoProducto: string | null
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuento: number
  iva: number
  productoId?: string
  productoNombre?: string
  productoSku?: string
  encontrado: boolean
}

export default function ImportarAlbaranOCRPage() {
  const router = useRouter()

  // Estado del archivo
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)

  // Estado de los datos extraídos
  const [resultado, setResultado] = useState<OCRResultResponse['data'] | null>(null)
  const [lineas, setLineas] = useState<LineaEditada[]>([])

  // Estado del formulario
  const [proveedorId, setProveedorId] = useState<string>('')
  const [almacenId, setAlmacenId] = useState<string>('')
  const [numeroAlbaran, setNumeroAlbaran] = useState<string>('')
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0])

  // Estado de proveedores y almacenes
  const [proveedores, setProveedores] = useState<Array<{ _id: string; nombre: string; cif?: string }>>([])
  const [almacenes, setAlmacenes] = useState<Array<{ _id: string; nombre: string }>>([])
  const [loadingProveedores, setLoadingProveedores] = useState(false)
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(false)

  // Estado de búsqueda de productos
  const [buscandoProducto, setBuscandoProducto] = useState<number | null>(null)
  const [productosSugeridos, setProductosSugeridos] = useState<Array<{
    _id: string
    nombre: string
    sku: string
    referenciaProveedor?: string
    precioCompra?: number
  }>>([])
  const [dialogBusquedaOpen, setDialogBusquedaOpen] = useState(false)

  // Estado de creación
  const [creando, setCreando] = useState(false)

  // Estado de errores de IA
  const [errorIA, setErrorIA] = useState<{
    codigo: string
    mensaje: string
  } | null>(null)

  // Cargar proveedores y almacenes
  React.useEffect(() => {
    loadProveedores()
    loadAlmacenes()
  }, [])

  const loadProveedores = async () => {
    setLoadingProveedores(true)
    try {
      const response = await proveedoresService.getAll({ limit: 1000, activo: true })
      if (response.success && response.data) {
        setProveedores(response.data)
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error)
    } finally {
      setLoadingProveedores(false)
    }
  }

  const loadAlmacenes = async () => {
    setLoadingAlmacenes(true)
    try {
      const response = await almacenesService.getAll({ activo: 'true' })
      if (response.success && response.data) {
        setAlmacenes(response.data)
        // Seleccionar el primer almacén por defecto
        if (response.data.length > 0) {
          setAlmacenId(response.data[0]._id)
        }
      }
    } catch (error) {
      console.error('Error cargando almacenes:', error)
    } finally {
      setLoadingAlmacenes(false)
    }
  }

  // Dropzone para subir archivos
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile) {
      setFile(selectedFile)

      // Crear preview si es imagen
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setFilePreview(null)
      }

      // Resetear resultados anteriores
      setResultado(null)
      setLineas([])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 20 * 1024 * 1024, // 20 MB
    multiple: false,
  })

  // Procesar documento con OCR
  const handleProcesar = async () => {
    if (!file) {
      toast.error('Selecciona un archivo primero')
      return
    }

    setProcesando(true)
    setErrorIA(null) // Limpiar errores previos
    try {
      toast.loading('Procesando documento con IA...', { id: 'procesando' })

      const response = await albaranesCompraService.procesarDocumentoOCR(file)

      toast.dismiss('procesando')

      if (response.success && response.data.success && response.data.datos) {
        setResultado(response.data)

        // Mapear líneas
        const lineasMapeadas: LineaEditada[] = response.data.datos.lineas.map((linea, index) => {
          const productoEncontrado = response.data.productosEncontrados.find(p => p.lineaIndex === index)

          return {
            codigoProducto: linea.codigoProducto,
            descripcion: linea.descripcion,
            cantidad: linea.cantidad,
            precioUnitario: linea.precioUnitario,
            descuento: linea.descuento || 0,
            iva: linea.iva || 21,
            productoId: productoEncontrado?.productoId,
            productoNombre: productoEncontrado?.nombre,
            productoSku: productoEncontrado?.sku,
            encontrado: !!productoEncontrado,
          }
        })
        setLineas(lineasMapeadas)

        // Setear datos del formulario
        if (response.data.datos.fecha) {
          setFecha(response.data.datos.fecha)
        }
        if (response.data.datos.numeroDocumento) {
          setNumeroAlbaran(response.data.datos.numeroDocumento)
        }
        if (response.data.proveedorEncontrado) {
          setProveedorId(response.data.proveedorEncontrado._id)
        }

        toast.success(`Documento procesado. Confianza: ${response.data.datos.confianza}`)

        // Mostrar advertencias
        if (response.data.advertencias.length > 0) {
          response.data.advertencias.forEach(adv => {
            toast.warning(adv)
          })
        }
      } else {
        // Manejar error con código específico
        const errorCode = (response.data as any).errorCode || 'ERROR'
        const errorMsg = response.data.error || 'Error procesando documento'

        setErrorIA({
          codigo: errorCode,
          mensaje: errorMsg,
        })
      }
    } catch (error: any) {
      toast.dismiss('procesando')
      setErrorIA({
        codigo: 'NETWORK_ERROR',
        mensaje: error.response?.data?.message || 'Error de conexión. Inténtalo de nuevo.',
      })
    } finally {
      setProcesando(false)
    }
  }

  // Buscar productos sugeridos
  const handleBuscarProducto = async (lineaIndex: number) => {
    const linea = lineas[lineaIndex]
    setBuscandoProducto(lineaIndex)
    setDialogBusquedaOpen(true)

    try {
      const response = await albaranesCompraService.buscarProductosSugeridosOCR(linea.descripcion)
      if (response.success) {
        setProductosSugeridos(response.data)
      }
    } catch (error) {
      console.error('Error buscando productos:', error)
      setProductosSugeridos([])
    }
  }

  // Seleccionar producto sugerido
  const handleSeleccionarProducto = (producto: typeof productosSugeridos[0]) => {
    if (buscandoProducto === null) return

    const nuevasLineas = [...lineas]
    nuevasLineas[buscandoProducto] = {
      ...nuevasLineas[buscandoProducto],
      productoId: producto._id,
      productoNombre: producto.nombre,
      productoSku: producto.sku,
      encontrado: true,
    }
    setLineas(nuevasLineas)
    setDialogBusquedaOpen(false)
    setBuscandoProducto(null)
    toast.success(`Producto asignado: ${producto.nombre}`)
  }

  // Actualizar línea
  const handleUpdateLinea = (index: number, field: keyof LineaEditada, value: any) => {
    const nuevasLineas = [...lineas]
    nuevasLineas[index] = { ...nuevasLineas[index], [field]: value }
    setLineas(nuevasLineas)
  }

  // Eliminar línea
  const handleEliminarLinea = (index: number) => {
    setLineas(lineas.filter((_, i) => i !== index))
  }

  // Crear albarán
  const handleCrearAlbaran = async () => {
    // Validaciones
    if (!proveedorId) {
      toast.error('Selecciona un proveedor')
      return
    }
    if (!almacenId) {
      toast.error('Selecciona un almacén')
      return
    }
    if (lineas.length === 0) {
      toast.error('No hay líneas para crear el albarán')
      return
    }

    // Advertir sobre productos no encontrados
    const noEncontrados = lineas.filter(l => !l.encontrado)
    if (noEncontrados.length > 0) {
      const confirmar = window.confirm(
        `Hay ${noEncontrados.length} línea(s) sin producto asignado. ¿Deseas continuar de todos modos?`
      )
      if (!confirmar) return
    }

    setCreando(true)
    try {
      const response = await albaranesCompraService.crearDesdeOCR({
        proveedorId,
        almacenId,
        numeroAlbaranProveedor: numeroAlbaran,
        fecha,
        lineas: lineas.map(linea => ({
          productoId: linea.productoId,
          nombre: linea.productoNombre || linea.descripcion,
          descripcion: linea.descripcion,
          cantidad: linea.cantidad,
          precioUnitario: linea.precioUnitario,
          descuento: linea.descuento,
          iva: linea.iva,
          codigoProveedor: linea.codigoProducto || undefined,
        })),
        observaciones: 'Importado mediante OCR/IA',
      })

      if (response.success && response.data) {
        toast.success('Albarán de compra creado correctamente')
        router.push(`/compras/albaranes/${response.data._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creando albarán')
    } finally {
      setCreando(false)
    }
  }

  // Calcular totales
  const totalLineas = lineas.reduce((sum, l) => {
    const subtotal = l.cantidad * l.precioUnitario * (1 - l.descuento / 100)
    return sum + subtotal
  }, 0)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/compras/albaranes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              Importar Albarán con IA/OCR
            </h1>
            <p className="text-muted-foreground">
              Sube una imagen o PDF de un albarán del proveedor para extraer los datos automáticamente
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda - Subida y preview */}
          <div className="space-y-6">
            {/* Zona de subida */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Subir Documento
                </CardTitle>
                <CardDescription>
                  Arrastra o selecciona una imagen (JPG, PNG, WebP) o PDF del albarán del proveedor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-2">
                    {file ? (
                      <>
                        <FileText className="h-12 w-12 text-primary" />
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground/50" />
                        <p className="font-medium">
                          {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz clic para seleccionar'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          JPG, PNG, WebP, GIF o PDF (máx. 20 MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {file && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={handleProcesar}
                      disabled={procesando}
                      className="flex-1"
                    >
                      {procesando ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Procesar con IA
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null)
                        setFilePreview(null)
                        setResultado(null)
                        setLineas([])
                      }}
                    >
                      Limpiar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error de IA */}
            {errorIA && (
              <Card className="border-destructive bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    Error procesando documento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{errorIA.mensaje}</p>

                  {/* Acciones según el tipo de error */}
                  {errorIA.codigo === 'QUOTA_EXCEEDED' && (
                    <div className="space-y-3">
                      <Alert className="bg-amber-50 border-amber-200">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">Límite de IA alcanzado</AlertTitle>
                        <AlertDescription className="text-amber-700 text-sm">
                          Has superado el límite gratuito de la API de IA. Para continuar usando esta función,
                          configura tu propia API key de Google Gemini.
                          <br />
                          <strong>Costo aproximado:</strong> menos de 0,01€ por documento procesado.
                        </AlertDescription>
                      </Alert>
                      <div className="flex gap-2">
                        <Link href="/configuracion?tab=ia">
                          <Button variant="default" size="sm">
                            <Settings className="mr-2 h-4 w-4" />
                            Configurar API Key
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => setErrorIA(null)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reintentar
                        </Button>
                      </div>
                    </div>
                  )}

                  {errorIA.codigo === 'API_KEY_ERROR' && (
                    <div className="space-y-3">
                      <Alert className="bg-blue-50 border-blue-200">
                        <Settings className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Configuración necesaria</AlertTitle>
                        <AlertDescription className="text-blue-700 text-sm">
                          Para usar la importación con IA, necesitas configurar una API key de Google Gemini
                          en los ajustes de tu empresa.
                        </AlertDescription>
                      </Alert>
                      <Link href="/configuracion?tab=ia">
                        <Button variant="default" size="sm">
                          <Settings className="mr-2 h-4 w-4" />
                          Ir a Configuración
                        </Button>
                      </Link>
                    </div>
                  )}

                  {errorIA.codigo === 'NETWORK_ERROR' && (
                    <Button variant="outline" size="sm" onClick={handleProcesar}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reintentar
                    </Button>
                  )}

                  {errorIA.codigo === 'ERROR' && (
                    <Button variant="outline" size="sm" onClick={() => setErrorIA(null)}>
                      Cerrar
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Preview del documento */}
            {filePreview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Vista previa del documento</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={filePreview}
                    alt="Preview del documento"
                    className="max-h-[400px] w-full object-contain rounded-lg border"
                  />
                </CardContent>
              </Card>
            )}

            {/* Advertencias y info del OCR */}
            {resultado && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4" />
                    Resultado del procesamiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Confianza:</span>
                    <Badge
                      variant={
                        resultado.datos?.confianza === 'alta'
                          ? 'default'
                          : resultado.datos?.confianza === 'media'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {resultado.datos?.confianza || 'Desconocida'}
                    </Badge>
                  </div>

                  {resultado.advertencias.length > 0 && (
                    <Alert variant="default" className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">Advertencias</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        <ul className="list-disc pl-4 text-sm">
                          {resultado.advertencias.map((adv, i) => (
                            <li key={i}>{adv}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {resultado.productosEncontrados.length > 0 && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {resultado.productosEncontrados.length} producto(s) encontrado(s) por referencia
                    </div>
                  )}

                  {resultado.productosNoEncontrados.length > 0 && (
                    <div className="text-sm text-orange-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {resultado.productosNoEncontrados.length} producto(s) requieren asignación manual
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna derecha - Datos y líneas */}
          <div className="space-y-6">
            {/* Datos del albarán */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Datos del Albarán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Proveedor *</Label>
                    <Select
                      value={proveedorId}
                      onValueChange={setProveedorId}
                      disabled={loadingProveedores}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un proveedor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {proveedores.map(prov => (
                          <SelectItem key={prov._id} value={prov._id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {prov.nombre}
                              {prov.cif && (
                                <span className="text-xs text-muted-foreground">({prov.cif})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {resultado?.proveedorEncontrado && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Proveedor detectado automáticamente
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Almacén *</Label>
                    <Select
                      value={almacenId}
                      onValueChange={setAlmacenId}
                      disabled={loadingAlmacenes}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {almacenes.map(alm => (
                          <SelectItem key={alm._id} value={alm._id}>
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-muted-foreground" />
                              {alm.nombre}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Fecha</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Label>Nº Albarán Proveedor</Label>
                    <Input
                      value={numeroAlbaran}
                      onChange={(e) => setNumeroAlbaran(e.target.value)}
                      placeholder="Número del albarán del proveedor"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Líneas */}
            {lineas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Líneas ({lineas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right w-[80px]">Cant.</TableHead>
                          <TableHead className="text-right w-[100px]">Precio</TableHead>
                          <TableHead className="text-right w-[80px]">Total</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineas.map((linea, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {linea.encontrado ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-orange-500" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                {linea.productoNombre ? (
                                  <div className="font-medium text-sm">{linea.productoNombre}</div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">{linea.descripcion}</div>
                                )}
                                {linea.codigoProducto && (
                                  <div className="text-xs text-muted-foreground">
                                    Ref: {linea.codigoProducto}
                                  </div>
                                )}
                                {!linea.encontrado && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-blue-600"
                                    onClick={() => handleBuscarProducto(index)}
                                  >
                                    <Search className="h-3 w-3 mr-1" />
                                    Buscar producto
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                value={linea.cantidad}
                                onChange={(e) =>
                                  handleUpdateLinea(index, 'cantidad', parseFloat(e.target.value) || 0)
                                }
                                className="w-20 text-right"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                step="0.01"
                                value={linea.precioUnitario}
                                onChange={(e) =>
                                  handleUpdateLinea(index, 'precioUnitario', parseFloat(e.target.value) || 0)
                                }
                                className="w-24 text-right"
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(linea.cantidad * linea.precioUnitario * (1 - linea.descuento / 100))}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEliminarLinea(index)}
                                className="h-8 w-8 text-destructive"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="p-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total:</span>
                      <span className="text-xl font-bold">{formatCurrency(totalLineas)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botón crear */}
            {lineas.length > 0 && (
              <Button
                onClick={handleCrearAlbaran}
                disabled={creando || !proveedorId || !almacenId}
                className="w-full"
                size="lg"
              >
                {creando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando albarán...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Crear Albarán de Compra
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo de búsqueda de productos */}
      <Dialog open={dialogBusquedaOpen} onOpenChange={setDialogBusquedaOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Buscar producto</DialogTitle>
            <DialogDescription>
              Selecciona el producto correspondiente a esta línea
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {buscandoProducto !== null && lineas[buscandoProducto] && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Descripción del documento:</p>
                <p className="text-sm text-muted-foreground">{lineas[buscandoProducto].descripcion}</p>
                {lineas[buscandoProducto].codigoProducto && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Código proveedor: {lineas[buscandoProducto].codigoProducto}
                  </p>
                )}
              </div>
            )}

            {productosSugeridos.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {productosSugeridos.map(producto => (
                  <div
                    key={producto._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleSeleccionarProducto(producto)}
                  >
                    <div>
                      <p className="font-medium">{producto.nombre}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {producto.sku && <span>SKU: {producto.sku}</span>}
                        {producto.referenciaProveedor && (
                          <span>Ref: {producto.referenciaProveedor}</span>
                        )}
                      </div>
                    </div>
                    {producto.precioCompra && (
                      <span className="text-sm font-medium">
                        {formatCurrency(producto.precioCompra)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron productos similares
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogBusquedaOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
