'use client'

import { useEffect, useState, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  Eye,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react'
import {
  getAuditLogs,
  getSystemLogs,
  getFiscalLogs,
  exportAuditLogs,
  exportSystemLogs,
  exportFiscalLogs,
  MODULE_LABELS,
  ACTION_LABELS,
  RESULT_LABELS,
  LEVEL_LABELS,
  LogModule,
  LogResult,
  LogLevel,
  type AuditLog,
  type SystemLog,
  type FiscalLog,
  type AuditLogFilters,
  type SystemLogFilters,
  type FiscalLogFilters,
} from '@/services/logs.service'
import { useAuthStore } from '@/stores/authStore'

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function getResultBadge(resultado: string) {
  switch (resultado) {
    case LogResult.SUCCESS:
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="h-3 w-3 mr-1" /> Exitoso</Badge>
    case LogResult.FAILURE:
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Fallido</Badge>
    case LogResult.PARTIAL:
      return <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white"><AlertTriangle className="h-3 w-3 mr-1" /> Parcial</Badge>
    default:
      return <Badge variant="outline">{resultado}</Badge>
  }
}

function getLevelBadge(nivel: string) {
  switch (nivel) {
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      return <Badge variant="destructive">{LEVEL_LABELS[nivel] || nivel}</Badge>
    case LogLevel.WARN:
      return <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white">{LEVEL_LABELS[nivel] || nivel}</Badge>
    case LogLevel.INFO:
      return <Badge variant="default" className="bg-blue-600">{LEVEL_LABELS[nivel] || nivel}</Badge>
    default:
      return <Badge variant="outline">{LEVEL_LABELS[nivel] || nivel}</Badge>
  }
}

function getUserName(usuarioId: AuditLog['usuarioId']): string {
  if (typeof usuarioId === 'object' && usuarioId !== null) {
    return `${usuarioId.nombre} ${usuarioId.apellidos}`
  }
  return String(usuarioId || '-')
}

function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function LogsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin' || user?.esSuperadmin

  const [activeTab, setActiveTab] = useState('audit')
  const [loading, setLoading] = useState(false)

  // --- Audit Logs State ---
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditPagination, setAuditPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [auditFilters, setAuditFilters] = useState<AuditLogFilters>({ page: 1, limit: 20 })
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null)

  // --- System Logs State ---
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [systemPagination, setSystemPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [systemFilters, setSystemFilters] = useState<SystemLogFilters>({ page: 1, limit: 20 })
  const [selectedSystemLog, setSelectedSystemLog] = useState<SystemLog | null>(null)

  // --- Fiscal Logs State ---
  const [fiscalLogs, setFiscalLogs] = useState<FiscalLog[]>([])
  const [fiscalPagination, setFiscalPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [fiscalFilters, setFiscalFilters] = useState<FiscalLogFilters>({ page: 1, limit: 20 })
  const [selectedFiscalLog, setSelectedFiscalLog] = useState<FiscalLog | null>(null)

  // ============================================
  // CARGA DE DATOS
  // ============================================

  const loadAuditLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAuditLogs(auditFilters)
      setAuditLogs(res.data || [])
      if (res.pagination) setAuditPagination(res.pagination)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error cargando logs de auditoria')
    } finally {
      setLoading(false)
    }
  }, [auditFilters])

  const loadSystemLogs = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    try {
      const res = await getSystemLogs(systemFilters)
      setSystemLogs(res.data || [])
      if (res.pagination) setSystemPagination(res.pagination)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error cargando logs de sistema')
    } finally {
      setLoading(false)
    }
  }, [systemFilters, isAdmin])

  const loadFiscalLogs = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    try {
      const res = await getFiscalLogs(fiscalFilters)
      setFiscalLogs(res.data || [])
      if (res.pagination) setFiscalPagination(res.pagination)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error cargando logs fiscales')
    } finally {
      setLoading(false)
    }
  }, [fiscalFilters, isAdmin])

  useEffect(() => {
    if (activeTab === 'audit') loadAuditLogs()
  }, [activeTab, loadAuditLogs])

  useEffect(() => {
    if (activeTab === 'system') loadSystemLogs()
  }, [activeTab, loadSystemLogs])

  useEffect(() => {
    if (activeTab === 'fiscal') loadFiscalLogs()
  }, [activeTab, loadFiscalLogs])

  // ============================================
  // EXPORTAR
  // ============================================

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      let res
      const filename = `logs-${activeTab}-${new Date().toISOString().slice(0, 10)}`
      if (activeTab === 'audit') {
        res = await exportAuditLogs({ ...auditFilters, format })
      } else if (activeTab === 'system') {
        res = await exportSystemLogs({ ...systemFilters, format })
      } else {
        res = await exportFiscalLogs({ ...fiscalFilters, format })
      }
      if (format === 'json') {
        downloadJson(res.data || res, `${filename}.json`)
      } else {
        // El backend devuelve CSV directamente
        const blob = new Blob([typeof res === 'string' ? res : JSON.stringify(res)], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
      toast.success('Exportacion completada')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error exportando logs')
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ScrollText className="h-6 w-6" />
              Registro de Actividad
            </h1>
            <p className="text-muted-foreground mt-1">
              Historial de operaciones, errores del sistema y registros fiscales
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
              <Download className="h-4 w-4 mr-1" /> JSON
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="audit">Actividad</TabsTrigger>
            {isAdmin && <TabsTrigger value="system">Sistema</TabsTrigger>}
            {isAdmin && <TabsTrigger value="fiscal">Fiscal</TabsTrigger>}
          </TabsList>

          {/* ============================================ */}
          {/* TAB: AUDIT LOGS */}
          {/* ============================================ */}
          <TabsContent value="audit" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <Select
                    value={auditFilters.modulo || '__all__'}
                    onValueChange={(v) => setAuditFilters(f => ({ ...f, modulo: v === '__all__' ? undefined : v, page: 1 }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Modulo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos los modulos</SelectItem>
                      {Object.entries(MODULE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={auditFilters.resultado || '__all__'}
                    onValueChange={(v) => setAuditFilters(f => ({ ...f, resultado: v === '__all__' ? undefined : v, page: 1 }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Resultado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos los resultados</SelectItem>
                      {Object.entries(RESULT_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    placeholder="Desde"
                    value={auditFilters.fechaDesde || ''}
                    onChange={(e) => setAuditFilters(f => ({ ...f, fechaDesde: e.target.value || undefined, page: 1 }))}
                  />
                  <Input
                    type="date"
                    placeholder="Hasta"
                    value={auditFilters.fechaHasta || ''}
                    onChange={(e) => setAuditFilters(f => ({ ...f, fechaHasta: e.target.value || undefined, page: 1 }))}
                  />
                  <Button variant="outline" onClick={() => setAuditFilters({ page: 1, limit: 20 })}>
                    Limpiar filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabla */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando...
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Info className="h-8 w-8 mb-2" />
                    <p>No se encontraron registros</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Fecha</th>
                          <th className="text-left px-4 py-3 font-medium">Usuario</th>
                          <th className="text-left px-4 py-3 font-medium">Modulo</th>
                          <th className="text-left px-4 py-3 font-medium">Accion</th>
                          <th className="text-left px-4 py-3 font-medium">Resultado</th>
                          <th className="text-left px-4 py-3 font-medium">IP</th>
                          <th className="text-center px-4 py-3 font-medium">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {auditLogs.map((log) => (
                          <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2.5 text-xs whitespace-nowrap">{formatDate(log.timestamp || log.createdAt)}</td>
                            <td className="px-4 py-2.5 truncate max-w-[150px]">{getUserName(log.usuarioId)}</td>
                            <td className="px-4 py-2.5">
                              <Badge variant="outline">{MODULE_LABELS[log.modulo] || log.modulo}</Badge>
                            </td>
                            <td className="px-4 py-2.5 text-xs">{ACTION_LABELS[log.accion] || log.accion}</td>
                            <td className="px-4 py-2.5">{getResultBadge(log.resultado)}</td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.ip}</td>
                            <td className="px-4 py-2.5 text-center">
                              <Button variant="ghost" size="icon" onClick={() => setSelectedAuditLog(log)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paginacion */}
            <Pagination
              pagination={auditPagination}
              onPageChange={(page) => setAuditFilters(f => ({ ...f, page }))}
            />
          </TabsContent>

          {/* ============================================ */}
          {/* TAB: SYSTEM LOGS */}
          {/* ============================================ */}
          {isAdmin && (
            <TabsContent value="system" className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Select
                      value={systemFilters.nivel || '__all__'}
                      onValueChange={(v) => setSystemFilters(f => ({ ...f, nivel: v === '__all__' ? undefined : v, page: 1 }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos los niveles</SelectItem>
                        {Object.entries(LEVEL_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="date"
                      value={systemFilters.fechaDesde || ''}
                      onChange={(e) => setSystemFilters(f => ({ ...f, fechaDesde: e.target.value || undefined, page: 1 }))}
                    />
                    <Input
                      type="date"
                      value={systemFilters.fechaHasta || ''}
                      onChange={(e) => setSystemFilters(f => ({ ...f, fechaHasta: e.target.value || undefined, page: 1 }))}
                    />
                    <Button variant="outline" onClick={() => setSystemFilters({ page: 1, limit: 20 })}>
                      Limpiar filtros
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando...
                    </div>
                  ) : systemLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Info className="h-8 w-8 mb-2" />
                      <p>No se encontraron registros</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium">Fecha</th>
                            <th className="text-left px-4 py-3 font-medium">Nivel</th>
                            <th className="text-left px-4 py-3 font-medium">Modulo</th>
                            <th className="text-left px-4 py-3 font-medium">Mensaje</th>
                            <th className="text-left px-4 py-3 font-medium">URL</th>
                            <th className="text-center px-4 py-3 font-medium">Detalle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {systemLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-2.5 text-xs whitespace-nowrap">{formatDate(log.timestamp || log.createdAt)}</td>
                              <td className="px-4 py-2.5">{getLevelBadge(log.nivel)}</td>
                              <td className="px-4 py-2.5">
                                <Badge variant="outline">{MODULE_LABELS[log.modulo] || log.modulo}</Badge>
                              </td>
                              <td className="px-4 py-2.5 truncate max-w-[300px]">{log.mensaje}</td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[200px]">{log.url || '-'}</td>
                              <td className="px-4 py-2.5 text-center">
                                <Button variant="ghost" size="icon" onClick={() => setSelectedSystemLog(log)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Pagination
                pagination={systemPagination}
                onPageChange={(page) => setSystemFilters(f => ({ ...f, page }))}
              />
            </TabsContent>
          )}

          {/* ============================================ */}
          {/* TAB: FISCAL LOGS */}
          {/* ============================================ */}
          {isAdmin && (
            <TabsContent value="fiscal" className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Select
                      value={fiscalFilters.documentoTipo || '__all__'}
                      onValueChange={(v) => setFiscalFilters(f => ({ ...f, documentoTipo: v === '__all__' ? undefined : v, page: 1 }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo documento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        <SelectItem value="factura">Factura</SelectItem>
                        <SelectItem value="ticket">Ticket</SelectItem>
                        <SelectItem value="rectificativa">Rectificativa</SelectItem>
                        <SelectItem value="abono">Abono</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="date"
                      value={fiscalFilters.fechaDesde || ''}
                      onChange={(e) => setFiscalFilters(f => ({ ...f, fechaDesde: e.target.value || undefined, page: 1 }))}
                    />
                    <Input
                      type="date"
                      value={fiscalFilters.fechaHasta || ''}
                      onChange={(e) => setFiscalFilters(f => ({ ...f, fechaHasta: e.target.value || undefined, page: 1 }))}
                    />
                    <Button variant="outline" onClick={() => setFiscalFilters({ page: 1, limit: 20 })}>
                      Limpiar filtros
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando...
                    </div>
                  ) : fiscalLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Info className="h-8 w-8 mb-2" />
                      <p>No se encontraron registros</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium">Fecha</th>
                            <th className="text-left px-4 py-3 font-medium">Tipo</th>
                            <th className="text-left px-4 py-3 font-medium">N. Documento</th>
                            <th className="text-left px-4 py-3 font-medium">Serie</th>
                            <th className="text-right px-4 py-3 font-medium">Importe</th>
                            <th className="text-right px-4 py-3 font-medium">IVA</th>
                            <th className="text-right px-4 py-3 font-medium">Total</th>
                            <th className="text-center px-4 py-3 font-medium">Detalle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {fiscalLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-2.5 text-xs whitespace-nowrap">{formatDate(log.timestamp || log.createdAt)}</td>
                              <td className="px-4 py-2.5">
                                <Badge variant="outline" className="capitalize">{log.documentoTipo}</Badge>
                              </td>
                              <td className="px-4 py-2.5 font-mono text-xs">{log.numeroDocumento}</td>
                              <td className="px-4 py-2.5 text-xs">{log.serie || '-'}</td>
                              <td className="px-4 py-2.5 text-right font-mono">{log.importe.toFixed(2)}</td>
                              <td className="px-4 py-2.5 text-right font-mono">{log.iva.toFixed(2)}</td>
                              <td className="px-4 py-2.5 text-right font-mono font-medium">{log.total.toFixed(2)}</td>
                              <td className="px-4 py-2.5 text-center">
                                <Button variant="ghost" size="icon" onClick={() => setSelectedFiscalLog(log)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Pagination
                pagination={fiscalPagination}
                onPageChange={(page) => setFiscalFilters(f => ({ ...f, page }))}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* ============================================ */}
      {/* MODALES DE DETALLE */}
      {/* ============================================ */}

      {/* Modal detalle audit log */}
      <Dialog open={!!selectedAuditLog} onOpenChange={() => setSelectedAuditLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del registro</DialogTitle>
          </DialogHeader>
          {selectedAuditLog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground text-xs">Fecha</label>
                  <p className="font-medium">{formatDate(selectedAuditLog.timestamp || selectedAuditLog.createdAt)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Usuario</label>
                  <p className="font-medium">{getUserName(selectedAuditLog.usuarioId)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Modulo</label>
                  <p>{MODULE_LABELS[selectedAuditLog.modulo] || selectedAuditLog.modulo}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Accion</label>
                  <p>{ACTION_LABELS[selectedAuditLog.accion] || selectedAuditLog.accion}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Resultado</label>
                  <div className="mt-0.5">{getResultBadge(selectedAuditLog.resultado)}</div>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">IP</label>
                  <p className="font-mono text-xs">{selectedAuditLog.ip}</p>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground text-xs">Descripcion</label>
                <p>{selectedAuditLog.descripcion}</p>
              </div>

              {selectedAuditLog.mensajeError && (
                <div>
                  <label className="text-muted-foreground text-xs">Error</label>
                  <p className="text-destructive bg-destructive/10 p-2 rounded text-xs font-mono">{selectedAuditLog.mensajeError}</p>
                </div>
              )}

              {selectedAuditLog.entidadTipo && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground text-xs">Tipo entidad</label>
                    <p>{selectedAuditLog.entidadTipo}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">ID entidad</label>
                    <p className="font-mono text-xs">{selectedAuditLog.entidadId}</p>
                  </div>
                </div>
              )}

              {selectedAuditLog.userAgent && (
                <div>
                  <label className="text-muted-foreground text-xs">User Agent</label>
                  <p className="text-xs text-muted-foreground break-all">{selectedAuditLog.userAgent}</p>
                </div>
              )}

              {selectedAuditLog.metadata && (
                <div>
                  <label className="text-muted-foreground text-xs">Metadata</label>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{JSON.stringify(selectedAuditLog.metadata, null, 2)}</pre>
                </div>
              )}

              {selectedAuditLog.datosAnteriores && (
                <div>
                  <label className="text-muted-foreground text-xs">Datos anteriores</label>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-40">{JSON.stringify(selectedAuditLog.datosAnteriores, null, 2)}</pre>
                </div>
              )}

              {selectedAuditLog.datosNuevos && (
                <div>
                  <label className="text-muted-foreground text-xs">Datos nuevos</label>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-40">{JSON.stringify(selectedAuditLog.datosNuevos, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal detalle system log */}
      <Dialog open={!!selectedSystemLog} onOpenChange={() => setSelectedSystemLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del log de sistema</DialogTitle>
          </DialogHeader>
          {selectedSystemLog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground text-xs">Fecha</label>
                  <p className="font-medium">{formatDate(selectedSystemLog.timestamp || selectedSystemLog.createdAt)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Nivel</label>
                  <div className="mt-0.5">{getLevelBadge(selectedSystemLog.nivel)}</div>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Modulo</label>
                  <p>{MODULE_LABELS[selectedSystemLog.modulo] || selectedSystemLog.modulo}</p>
                </div>
                {selectedSystemLog.method && selectedSystemLog.url && (
                  <div>
                    <label className="text-muted-foreground text-xs">Request</label>
                    <p className="font-mono text-xs">{selectedSystemLog.method} {selectedSystemLog.url}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-muted-foreground text-xs">Mensaje</label>
                <p>{selectedSystemLog.mensaje}</p>
              </div>

              {selectedSystemLog.errorCode && (
                <div>
                  <label className="text-muted-foreground text-xs">Codigo de error</label>
                  <p className="font-mono">{selectedSystemLog.errorCode}</p>
                </div>
              )}

              {selectedSystemLog.stack && (
                <div>
                  <label className="text-muted-foreground text-xs">Stack trace</label>
                  <pre className="bg-destructive/10 text-destructive p-3 rounded text-xs overflow-x-auto max-h-60">{selectedSystemLog.stack}</pre>
                </div>
              )}

              {selectedSystemLog.contexto && (
                <div>
                  <label className="text-muted-foreground text-xs">Contexto</label>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{JSON.stringify(selectedSystemLog.contexto, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal detalle fiscal log */}
      <Dialog open={!!selectedFiscalLog} onOpenChange={() => setSelectedFiscalLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del registro fiscal</DialogTitle>
          </DialogHeader>
          {selectedFiscalLog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground text-xs">Fecha</label>
                  <p className="font-medium">{formatDate(selectedFiscalLog.timestamp || selectedFiscalLog.createdAt)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Tipo</label>
                  <Badge variant="outline" className="capitalize">{selectedFiscalLog.documentoTipo}</Badge>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">N. Documento</label>
                  <p className="font-mono">{selectedFiscalLog.numeroDocumento}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Serie</label>
                  <p>{selectedFiscalLog.serie || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-muted-foreground text-xs">Importe</label>
                  <p className="font-mono font-medium">{selectedFiscalLog.importe.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">IVA</label>
                  <p className="font-mono">{selectedFiscalLog.iva.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Total</label>
                  <p className="font-mono font-bold">{selectedFiscalLog.total.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground text-xs">Hash SHA-256</label>
                <p className="font-mono text-xs break-all bg-muted p-2 rounded">{selectedFiscalLog.hash}</p>
              </div>

              {selectedFiscalLog.hashAnterior && (
                <div>
                  <label className="text-muted-foreground text-xs">Hash anterior (blockchain)</label>
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded">{selectedFiscalLog.hashAnterior}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground text-xs">Inmutable</label>
                  <p>{selectedFiscalLog.inmutable ? 'Si' : 'No'}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Retencion hasta</label>
                  <p>{formatDate(selectedFiscalLog.retencionHasta)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============================================
// COMPONENTE PAGINACION
// ============================================

function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: { total: number; page: number; limit: number; totalPages: number }
  onPageChange: (page: number) => void
}) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center px-3 text-sm">
          Pag. {pagination.page} / {pagination.totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
