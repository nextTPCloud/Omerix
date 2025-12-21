'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileUp,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Download,
  Trash2,
  Eye,
  MoreVertical,
  Upload,
  Search,
  Filter,
  Calendar,
  FolderOpen,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'

interface TabArchivosProps {
  proveedorId: string
  proveedorNombre: string
}

interface ArchivoProveedor {
  _id: string
  nombre: string
  tipo: string
  categoria: string
  tamanio: number
  url: string
  fechaSubida: Date
  subidoPor?: string
}

const CATEGORIAS_ARCHIVOS = [
  { value: 'contrato', label: 'Contratos' },
  { value: 'factura', label: 'Facturas' },
  { value: 'certificado', label: 'Certificados' },
  { value: 'catalogo', label: 'Catálogos' },
  { value: 'tarifa', label: 'Tarifas' },
  { value: 'otro', label: 'Otros' },
]

const getIconoPorTipo = (tipo: string) => {
  if (tipo.includes('image')) return FileImage
  if (tipo.includes('pdf')) return FileText
  if (tipo.includes('sheet') || tipo.includes('excel') || tipo.includes('csv')) return FileSpreadsheet
  return File
}

const formatearTamanio = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TabArchivos({ proveedorId, proveedorNombre }: TabArchivosProps) {
  const [archivos, setArchivos] = useState<ArchivoProveedor[]>([])
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [categoriaArchivo, setCategoriaArchivo] = useState('otro')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const archivosFiltrados = archivos.filter(archivo => {
    const matchCategoria = !filtroCategoria || archivo.categoria === filtroCategoria
    const matchBusqueda = !busqueda ||
      archivo.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return matchCategoria && matchBusqueda
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande (máximo 10MB)')
        return
      }
      setArchivoSeleccionado(file)
      setDialogOpen(true)
    }
  }

  const handleUpload = async () => {
    if (!archivoSeleccionado) return

    setUploading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const nuevoArchivo: ArchivoProveedor = {
        _id: Date.now().toString(),
        nombre: archivoSeleccionado.name,
        tipo: archivoSeleccionado.type,
        categoria: categoriaArchivo,
        tamanio: archivoSeleccionado.size,
        url: URL.createObjectURL(archivoSeleccionado),
        fechaSubida: new Date(),
        subidoPor: 'Usuario actual',
      }

      setArchivos(prev => [nuevoArchivo, ...prev])
      toast.success('Archivo subido correctamente')
      setDialogOpen(false)
      setArchivoSeleccionado(null)
      setCategoriaArchivo('otro')
    } catch (error) {
      toast.error('Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (archivoId: string) => {
    try {
      setArchivos(prev => prev.filter(a => a._id !== archivoId))
      toast.success('Archivo eliminado')
    } catch (error) {
      toast.error('Error al eliminar el archivo')
    }
  }

  const handleDownload = (archivo: ArchivoProveedor) => {
    const link = document.createElement('a')
    link.href = archivo.url
    link.download = archivo.nombre
    link.click()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Archivos y Documentos
            </CardTitle>
            <CardDescription>
              Documentos adjuntos relacionados con {proveedorNombre}
            </CardDescription>
          </div>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Subir archivo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar archivos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filtroCategoria || 'todas'}
            onValueChange={(v) => setFiltroCategoria(v === 'todas' ? null : v)}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {CATEGORIAS_ARCHIVOS.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {archivos.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FileUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold mb-2">Sin archivos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Aún no hay documentos adjuntos para este proveedor
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Plus className="mr-2 h-4 w-4" />
              Subir primer archivo
            </Button>
          </div>
        ) : archivosFiltrados.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No se encontraron archivos</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {archivosFiltrados.map((archivo) => {
              const Icono = getIconoPorTipo(archivo.tipo)
              const categoria = CATEGORIAS_ARCHIVOS.find(c => c.value === archivo.categoria)

              return (
                <div
                  key={archivo._id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-2 bg-muted rounded-lg">
                    <Icono className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={archivo.nombre}>
                      {archivo.nombre}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {categoria?.label || archivo.categoria}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatearTamanio(archivo.tamanio)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {archivo.fechaSubida.toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(archivo.url, '_blank')}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(archivo)}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(archivo._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir archivo</DialogTitle>
            <DialogDescription>
              Selecciona la categoría para el archivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {archivoSeleccionado && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <File className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{archivoSeleccionado.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatearTamanio(archivoSeleccionado.size)}
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoriaArchivo} onValueChange={setCategoriaArchivo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_ARCHIVOS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
