'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { toast } from 'sonner'
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Table as TableIcon,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import {
  obtenerInforme,
  ejecutarInforme,
  exportarInforme,
  IInforme,
  IResultadoInforme,
  TipoInforme,
  TipoCampo,
  TipoGraficoInforme,
  formatearValor,
  getModuloInfo,
} from '@/services/informes.service'

// Colores para gráficos
const COLORES = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
]

export default function InformeVisorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [informe, setInforme] = useState<IInforme | null>(null)
  const [resultado, setResultado] = useState<IResultadoInforme | null>(null)
  const [loading, setLoading] = useState(true)
  const [ejecutando, setEjecutando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [vistaActiva, setVistaActiva] = useState<'tabla' | 'grafico'>('tabla')

  // Parámetros dinámicos
  const [parametros, setParametros] = useState<Record<string, any>>({})
  const [paginaActual, setPaginaActual] = useState(1)

  // Cargar informe
  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerInforme(id)
        setInforme(data)

        // Inicializar parámetros con valores por defecto
        const paramsIniciales: Record<string, any> = {}
        for (const param of data.parametros || []) {
          if (param.valorDefecto !== undefined) {
            paramsIniciales[param.nombre] = param.valorDefecto
          }
        }
        setParametros(paramsIniciales)

        // Determinar vista inicial
        if (data.tipo === TipoInforme.GRAFICO) {
          setVistaActiva('grafico')
        }
      } catch (error) {
        console.error('Error cargando informe:', error)
        toast.error('Error al cargar el informe')
        router.push('/informes')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id, router])

  // Ejecutar informe
  const ejecutar = useCallback(async () => {
    if (!informe) return

    setEjecutando(true)
    try {
      const result = await ejecutarInforme(id, {
        parametros,
        page: paginaActual,
        limit: 50,
      })
      setResultado(result)
    } catch (error) {
      console.error('Error ejecutando informe:', error)
      toast.error('Error al ejecutar el informe')
    } finally {
      setEjecutando(false)
    }
  }, [id, informe, parametros, paginaActual])

  // Ejecutar al cargar o cambiar parámetros
  useEffect(() => {
    if (informe && !loading) {
      ejecutar()
    }
  }, [informe, loading, paginaActual]) // No incluir parametros para evitar ejecución automática

  // Exportar
  const handleExportar = async (formato: 'pdf' | 'excel' | 'csv') => {
    if (!informe) return

    setExportando(true)
    try {
      const blob = await exportarInforme(id, formato, parametros)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${informe.nombre}.${formato === 'excel' ? 'xlsx' : formato}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`Exportado a ${formato.toUpperCase()}`)
    } catch (error) {
      toast.error('Error al exportar')
    } finally {
      setExportando(false)
    }
  }

  // Renderizar gráfico según tipo
  const renderizarGrafico = () => {
    if (!informe?.grafico || !resultado?.datos) return null

    const datos = resultado.datos
    const { tipo, ejeX, ejeY, colores = COLORES, mostrarLeyenda = true } = informe.grafico

    switch (tipo) {
      case TipoGraficoInforme.LINEA:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={ejeX} />
              <YAxis />
              <Tooltip />
              {mostrarLeyenda && <Legend />}
              {ejeY.map((campo, i) => (
                <Line
                  key={campo}
                  type="monotone"
                  dataKey={campo}
                  stroke={colores[i % colores.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case TipoGraficoInforme.BARRA:
      case TipoGraficoInforme.BARRA_HORIZONTAL:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={datos}
              layout={tipo === TipoGraficoInforme.BARRA_HORIZONTAL ? 'vertical' : 'horizontal'}
            >
              <CartesianGrid strokeDasharray="3 3" />
              {tipo === TipoGraficoInforme.BARRA_HORIZONTAL ? (
                <>
                  <XAxis type="number" />
                  <YAxis dataKey={ejeX} type="category" width={150} />
                </>
              ) : (
                <>
                  <XAxis dataKey={ejeX} />
                  <YAxis />
                </>
              )}
              <Tooltip />
              {mostrarLeyenda && <Legend />}
              {ejeY.map((campo, i) => (
                <Bar
                  key={campo}
                  dataKey={campo}
                  fill={colores[i % colores.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case TipoGraficoInforme.AREA:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={ejeX} />
              <YAxis />
              <Tooltip />
              {mostrarLeyenda && <Legend />}
              {ejeY.map((campo, i) => (
                <Area
                  key={campo}
                  type="monotone"
                  dataKey={campo}
                  fill={colores[i % colores.length]}
                  stroke={colores[i % colores.length]}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case TipoGraficoInforme.CIRCULAR:
      case TipoGraficoInforme.DONA:
        const campoValor = ejeY[0]
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={datos}
                dataKey={campoValor}
                nameKey={ejeX}
                cx="50%"
                cy="50%"
                outerRadius={tipo === TipoGraficoInforme.DONA ? 120 : 150}
                innerRadius={tipo === TipoGraficoInforme.DONA ? 60 : 0}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {datos.map((_, i) => (
                  <Cell key={i} fill={colores[i % colores.length]} />
                ))}
              </Pie>
              <Tooltip />
              {mostrarLeyenda && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (!informe) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/informes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{informe.nombre}</h1>
                <Badge className={getModuloInfo(informe.modulo).color}>
                  {getModuloInfo(informe.modulo).label}
                </Badge>
              </div>
              {informe.descripcion && (
                <p className="text-muted-foreground">{informe.descripcion}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle vista */}
            {informe.tipo === TipoInforme.MIXTO && (
              <div className="flex border rounded-lg">
                <Button
                  variant={vistaActiva === 'tabla' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setVistaActiva('tabla')}
                  className="rounded-r-none"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={vistaActiva === 'grafico' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setVistaActiva('grafico')}
                  className="rounded-l-none"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button variant="outline" size="icon" onClick={ejecutar} disabled={ejecutando}>
              <RefreshCw className={`h-4 w-4 ${ejecutando ? 'animate-spin' : ''}`} />
            </Button>

            {informe.config?.exportable && (
              <>
                {informe.config.formatos?.includes('csv') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportar('csv')}
                    disabled={exportando}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                )}
                {informe.config.formatos?.includes('excel') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportar('excel')}
                    disabled={exportando}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                )}
                {informe.config.formatos?.includes('pdf') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportar('pdf')}
                    disabled={exportando}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Parámetros */}
        {informe.parametros && informe.parametros.length > 0 && (
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                {informe.parametros.map((param) => (
                  <div key={param.nombre} className="space-y-1">
                    <Label className="text-sm">{param.etiqueta}</Label>
                    {param.tipo === 'fecha' ? (
                      <Input
                        type="date"
                        value={parametros[param.nombre] || ''}
                        onChange={(e) =>
                          setParametros((prev) => ({
                            ...prev,
                            [param.nombre]: e.target.value,
                          }))
                        }
                        className="w-40"
                      />
                    ) : param.tipo === 'select' && param.opciones ? (
                      <Select
                        value={parametros[param.nombre] || ''}
                        onValueChange={(v) =>
                          setParametros((prev) => ({ ...prev, [param.nombre]: v }))
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {param.opciones.map((op) => (
                            <SelectItem key={op.valor} value={op.valor}>
                              {op.etiqueta}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={param.tipo === 'numero' ? 'number' : 'text'}
                        value={parametros[param.nombre] || ''}
                        onChange={(e) =>
                          setParametros((prev) => ({
                            ...prev,
                            [param.nombre]: e.target.value,
                          }))
                        }
                        className="w-40"
                      />
                    )}
                  </div>
                ))}
                <Button onClick={ejecutar} disabled={ejecutando}>
                  {ejecutando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Aplicar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Totales */}
        {resultado?.totales && Object.keys(resultado.totales).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(resultado.totales).map(([campo, valor]) => {
              const campoInfo = informe.campos.find((c) => c.campo === campo)
              return (
                <Card key={campo}>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {formatearValor(valor, campoInfo?.tipo || TipoCampo.NUMERO)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campoInfo?.etiqueta || campo}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Contenido principal */}
        <Card>
          <CardContent className="p-0">
            {ejecutando ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !resultado?.datos || resultado.datos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <TableIcon className="h-12 w-12 mb-4" />
                <p>No hay datos para mostrar</p>
              </div>
            ) : (
              <>
                {/* Gráfico */}
                {(vistaActiva === 'grafico' || informe.tipo === TipoInforme.GRAFICO) &&
                  informe.grafico && (
                    <div className="p-6">{renderizarGrafico()}</div>
                  )}

                {/* Tabla */}
                {(vistaActiva === 'tabla' || informe.tipo === TipoInforme.TABLA) && (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {informe.campos
                            .filter((c) => c.visible)
                            .map((campo) => (
                              <TableHead key={campo.campo} style={{ width: campo.ancho }}>
                                {campo.etiqueta}
                              </TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultado.datos.map((fila, i) => (
                          <TableRow key={i}>
                            {informe.campos
                              .filter((c) => c.visible)
                              .map((campo) => (
                                <TableCell key={campo.campo}>
                                  {formatearValor(fila[campo.campo], campo.tipo)}
                                </TableCell>
                              ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Paginación */}
                {resultado.pagination && resultado.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {resultado.datos.length} de {resultado.pagination.total} registros
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                        disabled={paginaActual === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Página {paginaActual} de {resultado.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPaginaActual((p) =>
                            Math.min(resultado.pagination.totalPages, p + 1)
                          )
                        }
                        disabled={paginaActual === resultado.pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
