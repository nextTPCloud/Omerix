'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import {
  conciliacionService,
  ImportacionExtracto,
  MovimientoExtracto,
  EstadoExtracto,
  CSVConfig,
} from '@/services/conciliacion.service'
import { cuentasBancariasService, CuentaBancaria } from '@/services/cuentas-bancarias.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  FileText,
  RefreshCw,
  Check,
  X,
  Search,
  Link,
  Unlink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Trash2,
  Eye,
  Play,
  Percent,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ConciliacionPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [importaciones, setImportaciones] = useState<ImportacionExtracto[]>([])
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
  const [selectedCuenta, setSelectedCuenta] = useState<string>('')
  const [selectedImportacion, setSelectedImportacion] = useState<ImportacionExtracto | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoExtracto[]>([])
  const [filtroEstado, setFiltroEstado] = useState<EstadoExtracto | 'todos'>('todos')
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 })

  // Estados para modales
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDescartarModal, setShowDescartarModal] = useState<{
    open: boolean
    movimiento: MovimientoExtracto | null
  }>({ open: false, movimiento: null })
  const [showBuscarModal, setShowBuscarModal] = useState<{
    open: boolean
    movimiento: MovimientoExtracto | null
  }>({ open: false, movimiento: null })
  const [motivoDescarte, setMotivoDescarte] = useState('')
  const [movimientosBusqueda, setMovimientosBusqueda] = useState<any[]>([])
  const [buscandoMovimientos, setBuscandoMovimientos] = useState(false)

  // Estados para importación
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importCuenta, setImportCuenta] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [csvConfig, setCsvConfig] = useState<CSVConfig>({
    separador: ';',
    formatoFecha: 'DD/MM/YYYY',
    columnaFecha: 0,
    columnaConcepto: 1,
    columnaImporte: 2,
    columnaSaldo: 3,
    tieneEncabezado: true,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar cuentas bancarias
  const cargarCuentas = useCallback(async () => {
    try {
      const res = await cuentasBancariasService.getAll()
      if (res.success) {
        setCuentas(res.data)
        if (res.data.length > 0 && !selectedCuenta) {
          setSelectedCuenta(res.data[0]._id)
        }
      }
    } catch (error) {
      console.error('Error cargando cuentas:', error)
    }
  }, [selectedCuenta])

  // Cargar importaciones
  const cargarImportaciones = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await conciliacionService.getImportaciones(selectedCuenta || undefined)
      if (res.success) {
        setImportaciones(res.data)
      }
    } catch (error) {
      console.error('Error cargando importaciones:', error)
      toast.error('Error al cargar importaciones')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCuenta])

  // Cargar movimientos de una importación
  const cargarMovimientos = useCallback(async () => {
    if (!selectedImportacion) return

    try {
      const res = await conciliacionService.getMovimientosExtracto(selectedImportacion._id, {
        estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
        pagina: pagination.page,
        limite: 50,
      })
      if (res.success) {
        setMovimientos(res.data)
        setPagination({
          total: res.pagination.total,
          page: res.pagination.page,
          pages: res.pagination.pages,
        })
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error)
      toast.error('Error al cargar movimientos')
    }
  }, [selectedImportacion, filtroEstado, pagination.page])

  useEffect(() => {
    cargarCuentas()
  }, [cargarCuentas])

  useEffect(() => {
    cargarImportaciones()
  }, [cargarImportaciones])

  useEffect(() => {
    if (selectedImportacion) {
      cargarMovimientos()
    }
  }, [selectedImportacion, cargarMovimientos])

  // Importar archivo
  const handleImportar = async () => {
    if (!importFile || !importCuenta) {
      toast.error('Seleccione un archivo y una cuenta bancaria')
      return
    }

    try {
      setIsImporting(true)
      const contenido = await conciliacionService.leerArchivo(importFile)
      const formato = conciliacionService.detectarFormato(importFile.name)

      const res = await conciliacionService.importar(
        importCuenta,
        importFile.name,
        contenido,
        formato === 'csv' ? csvConfig : undefined
      )

      if (res.success) {
        toast.success(res.message || 'Extracto importado correctamente')
        setShowImportModal(false)
        setImportFile(null)
        cargarImportaciones()
        setSelectedImportacion(res.data)
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al importar extracto')
    } finally {
      setIsImporting(false)
    }
  }

  // Ejecutar matching automático
  const handleMatching = async () => {
    if (!selectedImportacion) return

    try {
      const res = await conciliacionService.ejecutarMatching(selectedImportacion._id)
      if (res.success) {
        toast.success(res.message || `Se encontraron ${res.data.length} matches`)
        cargarMovimientos()
        cargarImportaciones()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al ejecutar matching')
    }
  }

  // Aprobar match
  const handleAprobar = async (movimiento: MovimientoExtracto) => {
    try {
      const res = await conciliacionService.aprobarMatch(movimiento._id)
      if (res.success) {
        toast.success('Match aprobado')
        cargarMovimientos()
        cargarImportaciones()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al aprobar match')
    }
  }

  // Rechazar match
  const handleRechazar = async (movimiento: MovimientoExtracto) => {
    try {
      const res = await conciliacionService.rechazarMatch(movimiento._id)
      if (res.success) {
        toast.success('Match rechazado')
        cargarMovimientos()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al rechazar match')
    }
  }

  // Descartar movimiento
  const handleDescartar = async () => {
    if (!showDescartarModal.movimiento || !motivoDescarte.trim()) {
      toast.error('Debe indicar el motivo del descarte')
      return
    }

    try {
      const res = await conciliacionService.descartarMovimiento(
        showDescartarModal.movimiento._id,
        motivoDescarte
      )
      if (res.success) {
        toast.success('Movimiento descartado')
        setShowDescartarModal({ open: false, movimiento: null })
        setMotivoDescarte('')
        cargarMovimientos()
        cargarImportaciones()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al descartar movimiento')
    }
  }

  // Buscar movimientos para conciliación manual
  const handleBuscarMovimientos = async (movimiento: MovimientoExtracto) => {
    setShowBuscarModal({ open: true, movimiento })
    setBuscandoMovimientos(true)

    try {
      const res = await conciliacionService.buscarMovimientosBancarios(
        movimiento.cuentaBancariaId,
        movimiento.tipo,
        movimiento.importe,
        movimiento.fecha
      )
      if (res.success) {
        setMovimientosBusqueda(res.data)
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al buscar movimientos')
    } finally {
      setBuscandoMovimientos(false)
    }
  }

  // Conciliar manualmente
  const handleConciliarManual = async (movimientoBancarioId: string) => {
    if (!showBuscarModal.movimiento) return

    try {
      const res = await conciliacionService.conciliarManual(
        showBuscarModal.movimiento._id,
        movimientoBancarioId
      )
      if (res.success) {
        toast.success('Conciliación realizada')
        setShowBuscarModal({ open: false, movimiento: null })
        setMovimientosBusqueda([])
        cargarMovimientos()
        cargarImportaciones()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al conciliar')
    }
  }

  // Finalizar importación
  const handleFinalizar = async () => {
    if (!selectedImportacion) return

    try {
      const res = await conciliacionService.finalizarImportacion(selectedImportacion._id)
      if (res.success) {
        toast.success('Importación finalizada')
        setSelectedImportacion(null)
        cargarImportaciones()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al finalizar importación')
    }
  }

  // Calcular estadísticas de la importación actual
  const getStats = () => {
    if (!selectedImportacion) return null
    const total = selectedImportacion.totalMovimientos
    const conciliados = selectedImportacion.movimientosConciliados
    const porcentaje = total > 0 ? Math.round((conciliados / total) * 100) : 0
    return { total, conciliados, porcentaje }
  }

  const stats = getStats()

  return (
      <>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Conciliación Bancaria</h1>
            <p className="text-muted-foreground">
              Importar extractos y conciliar movimientos con la tesorería
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedCuenta} onValueChange={setSelectedCuenta}>
              <SelectTrigger className="w-[250px]">
                <Building2 className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Todas las cuentas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las cuentas</SelectItem>
                {cuentas.map((cuenta) => (
                  <SelectItem key={cuenta._id} value={cuenta._id}>
                    {cuenta.alias || `${cuenta.banco} - ...${cuenta.iban?.slice(-4)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowImportModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar Extracto
            </Button>
          </div>
        </div>

        {/* Vista principal */}
        {!selectedImportacion ? (
          // Lista de importaciones
          <Card>
            <CardHeader>
              <CardTitle>Importaciones de Extractos</CardTitle>
              <CardDescription>
                Seleccione una importación para revisar y conciliar movimientos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : importaciones.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay importaciones de extractos</p>
                  <Button className="mt-4" onClick={() => setShowImportModal(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Extracto
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-center">Movimientos</TableHead>
                      <TableHead className="text-center">Conciliados</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importaciones.map((imp) => {
                      const porcentaje =
                        imp.totalMovimientos > 0
                          ? Math.round((imp.movimientosConciliados / imp.totalMovimientos) * 100)
                          : 0
                      return (
                        <TableRow key={imp._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{imp.nombreArchivo}</p>
                                <p className="text-xs text-muted-foreground">
                                  {conciliacionService.getFormatoLabel(imp.formatoOrigen)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{imp.cuentaBancariaNombre}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{formatDate(imp.fechaInicio)}</p>
                              <p className="text-muted-foreground">{formatDate(imp.fechaFin)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{imp.totalMovimientos}</TableCell>
                          <TableCell className="text-center">{imp.movimientosConciliados}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={porcentaje} className="w-20" />
                              <span className="text-sm text-muted-foreground">{porcentaje}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                imp.estado === 'completada'
                                  ? 'default'
                                  : imp.estado === 'en_proceso'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {imp.estado === 'completada'
                                ? 'Completada'
                                : imp.estado === 'en_proceso'
                                ? 'En proceso'
                                : imp.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedImportacion(imp)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          // Detalle de importación
          <>
            {/* Header de la importación */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedImportacion(null)}>
                      <ChevronRight className="h-4 w-4 rotate-180" />
                    </Button>
                    <div>
                      <h2 className="text-lg font-semibold">{selectedImportacion.nombreArchivo}</h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedImportacion.cuentaBancariaNombre} | {formatDate(selectedImportacion.fechaInicio)} - {formatDate(selectedImportacion.fechaFin)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {stats && (
                      <div className="flex items-center gap-2">
                        <Progress value={stats.porcentaje} className="w-32" />
                        <span className="text-sm font-medium">
                          {stats.conciliados}/{stats.total} ({stats.porcentaje}%)
                        </span>
                      </div>
                    )}
                    <Button variant="outline" onClick={handleMatching}>
                      <Play className="mr-2 h-4 w-4" />
                      Ejecutar Matching
                    </Button>
                    {selectedImportacion.estado === 'en_proceso' && (
                      <Button onClick={handleFinalizar}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Finalizar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen de estados */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card
                className={`cursor-pointer ${filtroEstado === 'pendiente' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setFiltroEstado('pendiente')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="rounded-full bg-gray-100 p-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedImportacion.movimientosPendientes}</p>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer ${filtroEstado === 'sugerido' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setFiltroEstado('sugerido')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Percent className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedImportacion.movimientosSugeridos}</p>
                    <p className="text-sm text-muted-foreground">Sugeridos</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer ${filtroEstado === 'conciliado' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setFiltroEstado('conciliado')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="rounded-full bg-green-100 p-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedImportacion.movimientosConciliados}</p>
                    <p className="text-sm text-muted-foreground">Conciliados</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer ${filtroEstado === 'descartado' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setFiltroEstado('descartado')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="rounded-full bg-red-100 p-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedImportacion.movimientosDescartados}</p>
                    <p className="text-sm text-muted-foreground">Descartados</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de movimientos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Movimientos del Extracto</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select
                      value={filtroEstado}
                      onValueChange={(v) => setFiltroEstado(v as EstadoExtracto | 'todos')}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="pendiente">Pendientes</SelectItem>
                        <SelectItem value="sugerido">Sugeridos</SelectItem>
                        <SelectItem value="conciliado">Conciliados</SelectItem>
                        <SelectItem value="descartado">Descartados</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={cargarMovimientos}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Confianza</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((mov) => (
                      <TableRow key={mov._id}>
                        <TableCell>{formatDate(mov.fecha)}</TableCell>
                        <TableCell>
                          <Badge variant={mov.tipo === 'abono' ? 'default' : 'destructive'}>
                            {mov.tipo === 'abono' ? (
                              <ArrowDownRight className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="mr-1 h-3 w-3" />
                            )}
                            {conciliacionService.getTipoLabel(mov.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            <p className="truncate">{mov.concepto}</p>
                            {mov.referenciaBanco && (
                              <p className="text-xs text-muted-foreground">Ref: {mov.referenciaBanco}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            mov.tipo === 'abono' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {mov.tipo === 'abono' ? '+' : '-'}
                          {formatCurrency(mov.importe)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={conciliacionService.getEstadoColor(mov.estado)}>
                            {conciliacionService.getEstadoLabel(mov.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {mov.confianzaMatch !== undefined && (
                            <span className={conciliacionService.getConfianzaColor(mov.confianzaMatch)}>
                              {mov.confianzaMatch}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {mov.estado === 'sugerido' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => handleAprobar(mov)}
                                  title="Aprobar match"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleRechazar(mov)}
                                  title="Rechazar match"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {mov.estado === 'pendiente' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBuscarMovimientos(mov)}
                                  title="Buscar movimiento para conciliar"
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() =>
                                    setShowDescartarModal({ open: true, movimiento: mov })
                                  }
                                  title="Descartar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {pagination.page} de {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Modal de importación */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Extracto Bancario</DialogTitle>
            <DialogDescription>
              Seleccione un archivo de extracto bancario (CSV, Norma 43, OFX)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Cuenta Bancaria</label>
              <Select value={importCuenta} onValueChange={setImportCuenta}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((cuenta) => (
                    <SelectItem key={cuenta._id} value={cuenta._id}>
                      {cuenta.alias || `${cuenta.banco} - ...${cuenta.iban?.slice(-4)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Archivo</label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {importFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    <span>{importFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setImportFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Haga clic para seleccionar archivo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos: CSV, N43, AEB, OFX, QFX
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.n43,.aeb,.ofx,.qfx,.txt"
                className="hidden"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>

            {importFile && conciliacionService.detectarFormato(importFile.name) === 'csv' && (
              <div className="space-y-3 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Configuración CSV</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Separador</label>
                    <Select
                      value={csvConfig.separador}
                      onValueChange={(v) => setCsvConfig((c) => ({ ...c, separador: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=";">Punto y coma (;)</SelectItem>
                        <SelectItem value=",">Coma (,)</SelectItem>
                        <SelectItem value="\t">Tabulador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Formato fecha</label>
                    <Select
                      value={csvConfig.formatoFecha}
                      onValueChange={(v) => setCsvConfig((c) => ({ ...c, formatoFecha: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tieneEncabezado"
                    checked={csvConfig.tieneEncabezado}
                    onChange={(e) =>
                      setCsvConfig((c) => ({ ...c, tieneEncabezado: e.target.checked }))
                    }
                  />
                  <label htmlFor="tieneEncabezado" className="text-sm">
                    Primera fila es encabezado
                  </label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImportar} disabled={isImporting || !importFile || !importCuenta}>
              {isImporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de descarte */}
      <Dialog
        open={showDescartarModal.open}
        onOpenChange={(open) => setShowDescartarModal({ open, movimiento: showDescartarModal.movimiento })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar Movimiento</DialogTitle>
            <DialogDescription>
              Este movimiento no será conciliado. Indique el motivo del descarte.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Motivo del descarte..."
              value={motivoDescarte}
              onChange={(e) => setMotivoDescarte(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDescartarModal({ open: false, movimiento: null })}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDescartar}>
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de búsqueda para conciliación manual */}
      <Dialog
        open={showBuscarModal.open}
        onOpenChange={(open) => setShowBuscarModal({ open, movimiento: showBuscarModal.movimiento })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conciliación Manual</DialogTitle>
            <DialogDescription>
              Seleccione el movimiento bancario que corresponde con este movimiento del extracto
            </DialogDescription>
          </DialogHeader>
          {showBuscarModal.movimiento && (
            <div className="p-3 bg-muted rounded-lg mb-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Fecha:</span>{' '}
                  <span className="font-medium">{formatDate(showBuscarModal.movimiento.fecha)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Importe:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(showBuscarModal.movimiento.importe)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  <span className="font-medium">
                    {conciliacionService.getTipoLabel(showBuscarModal.movimiento.tipo)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm">{showBuscarModal.movimiento.concepto}</p>
            </div>
          )}
          <div className="py-4">
            {buscandoMovimientos ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : movimientosBusqueda.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No se encontraron movimientos compatibles</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientosBusqueda.map((mov) => (
                      <TableRow key={mov._id}>
                        <TableCell>{formatDate(mov.fecha)}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="truncate">{mov.concepto}</p>
                            {mov.terceroNombre && (
                              <p className="text-xs text-muted-foreground">{mov.terceroNombre}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(mov.importe)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleConciliarManual(mov._id)}>
                            <Link className="mr-1 h-4 w-4" />
                            Vincular
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBuscarModal({ open: false, movimiento: null })}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
  )
}
