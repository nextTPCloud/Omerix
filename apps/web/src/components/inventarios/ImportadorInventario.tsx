'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

// Tipo para la línea importada
export interface LineaImportada {
  codigo: string
  cantidad: number
  encontrado: boolean
  productoId?: string
  productoNombre?: string
  lineaId?: string
  fila: number
}

interface ImportadorInventarioProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Función para buscar producto por código (debe retornar el producto encontrado o null)
  onBuscarProducto: (codigo: string) => Promise<{
    _id: string
    nombre: string
    lineaId?: string
  } | null>
  // Callback cuando se confirma la importación
  onImportar: (lineas: LineaImportada[]) => void
}

interface FilaCSV {
  valores: string[]
  fila: number
}

export function ImportadorInventario({
  open,
  onOpenChange,
  onBuscarProducto,
  onImportar,
}: ImportadorInventarioProps) {
  // Estado del archivo
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<FilaCSV[]>([])
  const [headers, setHeaders] = useState<string[]>([])

  // Configuración
  const [tieneEncabezado, setTieneEncabezado] = useState(true)
  const [columnaCodigo, setColumnaCodigo] = useState<string>('')
  const [columnaCantidad, setColumnaCantidad] = useState<string>('')

  // Estado de procesamiento
  const [procesando, setProcesando] = useState(false)
  const [lineasProcesadas, setLineasProcesadas] = useState<LineaImportada[]>([])
  const [paso, setPaso] = useState<'upload' | 'config' | 'preview'>('upload')

  // Parsear CSV manualmente
  const parseCSV = (text: string): FilaCSV[] => {
    const lineas = text.split(/\r?\n/).filter(linea => linea.trim())
    return lineas.map((linea, index) => {
      // Manejar campos con comillas (CSV estándar)
      const valores: string[] = []
      let valorActual = ''
      let dentroComillas = false

      for (let i = 0; i < linea.length; i++) {
        const char = linea[i]
        if (char === '"') {
          if (dentroComillas && linea[i + 1] === '"') {
            valorActual += '"'
            i++
          } else {
            dentroComillas = !dentroComillas
          }
        } else if ((char === ',' || char === ';') && !dentroComillas) {
          valores.push(valorActual.trim())
          valorActual = ''
        } else {
          valorActual += char
        }
      }
      valores.push(valorActual.trim())

      return { valores, fila: index + 1 }
    })
  }

  // Manejar archivo subido
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setProcesando(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const filas = parseCSV(text)

        if (filas.length === 0) {
          toast.error('El archivo está vacío')
          setProcesando(false)
          return
        }

        setRawData(filas)

        // Determinar encabezados
        const primeraFila = filas[0].valores
        setHeaders(primeraFila)

        // Intentar detectar columnas automáticamente
        const indexCodigo = primeraFila.findIndex(h =>
          /codigo|código|sku|barcode|ean|ref/i.test(h)
        )
        const indexCantidad = primeraFila.findIndex(h =>
          /cantidad|qty|quantity|cant|unidades/i.test(h)
        )

        if (indexCodigo >= 0) {
          setColumnaCodigo(indexCodigo.toString())
        }
        if (indexCantidad >= 0) {
          setColumnaCantidad(indexCantidad.toString())
        }

        setPaso('config')
        toast.success(`Archivo cargado: ${filas.length} filas`)
      } catch (error) {
        console.error('Error parseando archivo:', error)
        toast.error('Error al leer el archivo')
      } finally {
        setProcesando(false)
      }
    }

    reader.onerror = () => {
      toast.error('Error al leer el archivo')
      setProcesando(false)
    }

    if (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.txt')) {
      reader.readAsText(selectedFile, 'UTF-8')
    } else {
      toast.error('Por favor, sube un archivo CSV. Para Excel, expórtalo primero a CSV.')
      setProcesando(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  // Procesar y validar líneas
  const procesarLineas = async () => {
    if (!columnaCodigo || !columnaCantidad) {
      toast.error('Selecciona las columnas de código y cantidad')
      return
    }

    setProcesando(true)
    const lineas: LineaImportada[] = []
    const codigoIdx = parseInt(columnaCodigo)
    const cantidadIdx = parseInt(columnaCantidad)

    // Determinar desde qué fila empezar
    const startIndex = tieneEncabezado ? 1 : 0

    for (let i = startIndex; i < rawData.length; i++) {
      const fila = rawData[i]
      const codigo = fila.valores[codigoIdx]?.trim()
      const cantidadStr = fila.valores[cantidadIdx]?.trim()

      if (!codigo) continue

      // Parsear cantidad (soportar decimal con coma o punto)
      const cantidad = parseFloat(cantidadStr?.replace(',', '.')) || 0

      if (cantidad <= 0) continue

      // Buscar producto
      const producto = await onBuscarProducto(codigo)

      lineas.push({
        codigo,
        cantidad,
        encontrado: !!producto,
        productoId: producto?._id,
        productoNombre: producto?.nombre,
        lineaId: producto?.lineaId,
        fila: fila.fila,
      })
    }

    setLineasProcesadas(lineas)
    setPaso('preview')
    setProcesando(false)

    const encontrados = lineas.filter(l => l.encontrado).length
    toast.info(`${encontrados} de ${lineas.length} productos encontrados`)
  }

  // Confirmar importación
  const confirmarImportacion = () => {
    const lineasValidas = lineasProcesadas.filter(l => l.encontrado)
    if (lineasValidas.length === 0) {
      toast.error('No hay productos válidos para importar')
      return
    }

    onImportar(lineasValidas)
    resetear()
    onOpenChange(false)
    toast.success(`${lineasValidas.length} líneas importadas`)
  }

  // Resetear estado
  const resetear = () => {
    setFile(null)
    setRawData([])
    setHeaders([])
    setColumnaCodigo('')
    setColumnaCantidad('')
    setLineasProcesadas([])
    setPaso('upload')
  }

  // Estadísticas
  const encontrados = lineasProcesadas.filter(l => l.encontrado).length
  const noEncontrados = lineasProcesadas.filter(l => !l.encontrado).length

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetear()
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar desde Recolector de Datos
          </DialogTitle>
          <DialogDescription>
            Importa conteos desde un archivo CSV exportado de tu recolector de datos
          </DialogDescription>
        </DialogHeader>

        {/* Paso 1: Subir archivo */}
        {paso === 'upload' && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              {procesando ? (
                <>
                  <RefreshCw className="h-12 w-12 text-primary animate-spin" />
                  <p className="font-medium">Procesando archivo...</p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground/50" />
                  <p className="font-medium">
                    {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra un archivo CSV o haz clic'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CSV o TXT (máx. 10 MB)
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    El archivo debe contener columnas de código de producto y cantidad
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Paso 2: Configuración */}
        {paso === 'config' && (
          <div className="space-y-4">
            {file && (
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  Archivo: <strong>{file.name}</strong> ({rawData.length} filas)
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tieneEncabezado"
                  checked={tieneEncabezado}
                  onCheckedChange={(checked) => setTieneEncabezado(checked as boolean)}
                />
                <Label htmlFor="tieneEncabezado">
                  La primera fila contiene encabezados
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Columna de Código *
                  </Label>
                  <Select value={columnaCodigo} onValueChange={setColumnaCodigo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar columna..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {tieneEncabezado ? header : `Columna ${idx + 1}`}
                          {tieneEncabezado && ` (Col ${idx + 1})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Columna de Cantidad *
                  </Label>
                  <Select value={columnaCantidad} onValueChange={setColumnaCantidad}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar columna..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {tieneEncabezado ? header : `Columna ${idx + 1}`}
                          {tieneEncabezado && ` (Col ${idx + 1})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vista previa de las primeras filas */}
              <div className="space-y-2">
                <Label>Vista previa (primeras 5 filas):</Label>
                <ScrollArea className="h-32 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map((header, idx) => (
                          <TableHead key={idx} className="text-xs">
                            {tieneEncabezado ? header : `Col ${idx + 1}`}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawData.slice(tieneEncabezado ? 1 : 0, 5).map((fila, i) => (
                        <TableRow key={i}>
                          {fila.valores.map((valor, j) => (
                            <TableCell key={j} className="text-xs py-1">
                              {valor || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={resetear}>
                Volver
              </Button>
              <Button
                onClick={procesarLineas}
                disabled={!columnaCodigo || !columnaCantidad || procesando}
              >
                {procesando ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Validar Productos'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Paso 3: Preview de resultados */}
        {paso === 'preview' && (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold">{lineasProcesadas.length}</div>
                <div className="text-xs text-muted-foreground">Total líneas</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{encontrados}</div>
                <div className="text-xs text-green-600">Encontrados</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{noEncontrados}</div>
                <div className="text-xs text-red-600">No encontrados</div>
              </div>
            </div>

            {noEncontrados > 0 && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {noEncontrados} producto(s) no se encontraron en el inventario y serán ignorados
                </AlertDescription>
              </Alert>
            )}

            {/* Lista de productos */}
            <ScrollArea className="h-64 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right w-16">Fila</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineasProcesadas.map((linea, idx) => (
                    <TableRow key={idx} className={!linea.encontrado ? 'bg-red-50' : ''}>
                      <TableCell>
                        {linea.encontrado ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{linea.codigo}</TableCell>
                      <TableCell>
                        {linea.productoNombre || (
                          <span className="text-muted-foreground italic">No encontrado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{linea.cantidad}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{linea.fila}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPaso('config')}>
                Volver
              </Button>
              <Button
                onClick={confirmarImportacion}
                disabled={encontrados === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Importar {encontrados} líneas
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Footer solo para paso upload */}
        {paso === 'upload' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImportadorInventario
