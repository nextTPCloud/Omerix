'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { contabilidadService } from '@/services/contabilidad.service'
import { AsientoContable, EstadoAsiento, OrigenAsiento } from '@/types/contabilidad.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Search,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Eye,
  XCircle,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Colores por estado
const ESTADO_COLORS: Record<string, string> = {
  borrador: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  contabilizado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  anulado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

// Nombres de origen
const ORIGEN_NOMBRES: Record<string, string> = {
  manual: 'Manual',
  factura_venta: 'Factura Venta',
  factura_compra: 'Factura Compra',
  cobro: 'Cobro',
  pago: 'Pago',
  nomina: 'Nómina',
  amortizacion: 'Amortización',
  regularizacion: 'Regularización',
  cierre: 'Cierre',
  apertura: 'Apertura',
  ajuste: 'Ajuste',
}

export default function AsientosPage() {
  const router = useRouter()
  const [asientos, setAsientos] = useState<AsientoContable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [paginas, setPaginas] = useState(0)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [ejercicio, setEjercicio] = useState<string>(new Date().getFullYear().toString())
  const [periodo, setPeriodo] = useState<string>('all')
  const [estado, setEstado] = useState<string>('all')
  const [origen, setOrigen] = useState<string>('all')
  const [pagina, setPagina] = useState(1)
  const [limite] = useState(25)

  // Dialog anular
  const [anularDialog, setAnularDialog] = useState<{
    open: boolean
    asiento: AsientoContable | null
    motivo: string
  }>({
    open: false,
    asiento: null,
    motivo: '',
  })

  // Cargar asientos
  const cargarAsientos = async () => {
    try {
      setIsLoading(true)
      const response = await contabilidadService.getAsientos({
        ejercicio: ejercicio !== 'all' ? parseInt(ejercicio) : undefined,
        periodo: periodo !== 'all' ? parseInt(periodo) : undefined,
        estado: estado !== 'all' ? (estado as EstadoAsiento) : undefined,
        origenTipo: origen !== 'all' ? (origen as OrigenAsiento) : undefined,
        concepto: busqueda || undefined,
        pagina,
        limite,
      })
      setAsientos(response.asientos || [])
      setTotal(response.total || 0)
      setPaginas(response.paginas || 0)
    } catch (error) {
      console.error('Error cargando asientos:', error)
      toast.error('Error al cargar los asientos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarAsientos()
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda, ejercicio, periodo, estado, origen, pagina])

  // Anular asiento
  const handleAnular = async () => {
    if (!anularDialog.asiento || !anularDialog.motivo.trim()) {
      toast.error('Debes indicar un motivo para la anulación')
      return
    }

    try {
      await contabilidadService.anularAsiento(anularDialog.asiento._id, anularDialog.motivo)
      toast.success('Asiento anulado correctamente')
      setAnularDialog({ open: false, asiento: null, motivo: '' })
      cargarAsientos()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al anular el asiento')
    }
  }

  // Formatear fecha
  const formatFecha = (fecha: Date | string) => {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es })
  }

  // Formatear importe
  const formatImporte = (importe: number) => {
    return importe.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
    })
  }

  // Estadísticas
  const stats = useMemo(() => {
    const contabilizados = asientos.filter((a) => a.estado === EstadoAsiento.CONTABILIZADO).length
    const anulados = asientos.filter((a) => a.estado === EstadoAsiento.ANULADO).length
    const totalDebe = asientos.reduce((sum, a) => sum + a.totalDebe, 0)
    const totalHaber = asientos.reduce((sum, a) => sum + a.totalHaber, 0)

    return { contabilizados, anulados, totalDebe, totalHaber }
  }, [asientos])

  // Años para el selector
  const anios = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [])

  return (
    
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/contabilidad">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-7 w-7 text-primary" />
                Asientos Contables
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {total} asientos en total
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cargarAsientos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button size="sm" asChild>
              <Link href="/contabilidad/asientos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Asiento
              </Link>
            </Button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Total Asientos</p>
            <p className="text-xl font-bold">{total}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Contabilizados</p>
            <p className="text-xl font-bold text-green-600">{stats.contabilizados}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Total Debe</p>
            <p className="text-xl font-bold">{formatImporte(stats.totalDebe)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">Total Haber</p>
            <p className="text-xl font-bold">{formatImporte(stats.totalHaber)}</p>
          </Card>
        </div>

        {/* FILTROS */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por concepto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={ejercicio} onValueChange={setEjercicio}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Ejercicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {anios.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {format(new Date(2000, i, 1), 'MMMM', { locale: es })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="contabilizado">Contabilizado</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="anulado">Anulado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={origen} onValueChange={setOrigen}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="factura_venta">Factura Venta</SelectItem>
                <SelectItem value="factura_compra">Factura Compra</SelectItem>
                <SelectItem value="cobro">Cobro</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* TABLA */}
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold">Nº</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                  <th className="px-4 py-3 text-left font-semibold">Origen</th>
                  <th className="px-4 py-3 text-right font-semibold">Debe</th>
                  <th className="px-4 py-3 text-right font-semibold">Haber</th>
                  <th className="px-4 py-3 text-center font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <span className="text-muted-foreground">Cargando asientos...</span>
                    </td>
                  </tr>
                ) : asientos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="font-medium">No se encontraron asientos</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Prueba ajustando los filtros o crea un nuevo asiento
                      </p>
                    </td>
                  </tr>
                ) : (
                  asientos.map((asiento) => (
                    <tr
                      key={asiento._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-4 py-2.5 font-mono font-medium">
                        #{asiento.numero}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatFecha(asiento.fecha)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="max-w-[300px] truncate" title={asiento.concepto}>
                          {asiento.concepto}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {asiento.lineas.length} líneas
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-xs">
                          {ORIGEN_NOMBRES[asiento.origenTipo] || asiento.origenTipo}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {formatImporte(asiento.totalDebe)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {formatImporte(asiento.totalHaber)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge
                          variant="secondary"
                          className={ESTADO_COLORS[asiento.estado] || ''}
                        >
                          {asiento.estado}
                        </Badge>
                        {!asiento.cuadrado && (
                          <Badge variant="destructive" className="ml-1 text-xs">
                            Descuadrado
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/contabilidad/asientos/${asiento._id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            {asiento.estado === EstadoAsiento.CONTABILIZADO &&
                              !asiento.asientoAnulacionId && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      setAnularDialog({
                                        open: true,
                                        asiento,
                                        motivo: '',
                                      })
                                    }
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Anular asiento
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* PAGINACIÓN */}
        {paginas > 1 && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Mostrando {(pagina - 1) * limite + 1} a{' '}
                {Math.min(pagina * limite, total)} de {total}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina(1)}
                  disabled={pagina === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm">
                  Página {pagina} de {paginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => Math.min(paginas, p + 1))}
                  disabled={pagina === paginas}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina(paginas)}
                  disabled={pagina === paginas}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* DIALOG ANULAR */}
        <Dialog
          open={anularDialog.open}
          onOpenChange={(open) => setAnularDialog({ ...anularDialog, open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Anular Asiento</DialogTitle>
              <DialogDescription>
                Se creará un contraasiento para anular el asiento #{anularDialog.asiento?.numero}.
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="motivo">Motivo de la anulación *</Label>
                <Textarea
                  id="motivo"
                  placeholder="Indica el motivo de la anulación..."
                  value={anularDialog.motivo}
                  onChange={(e) =>
                    setAnularDialog({ ...anularDialog, motivo: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAnularDialog({ open: false, asiento: null, motivo: '' })}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleAnular}>
                Anular Asiento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  )
}
