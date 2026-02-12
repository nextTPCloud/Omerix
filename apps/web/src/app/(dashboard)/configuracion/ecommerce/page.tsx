'use client'

import { useState, useEffect, useCallback } from 'react'
import { ecommerceService, IConexionEcommerce, ISyncLog } from '@/services/ecommerce.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  ShoppingCart,
  Plus,
  RefreshCw,
  Trash2,
  Wifi,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Edit,
  Eye,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { toast } from 'sonner'

// ============================================
// COMPONENTE FORMULARIO DE CONEXIÓN
// ============================================

function ConnectionForm({
  conexion,
  onSave,
  onCancel,
}: {
  conexion?: IConexionEcommerce | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    nombre: conexion?.nombre || '',
    plataforma: conexion?.plataforma || 'prestashop',
    url: conexion?.url || '',
    apiKey: conexion?.apiKey || '',
    apiSecret: conexion?.apiSecret || '',
    configuracion: {
      syncAutomatico: conexion?.configuracion?.syncAutomatico || false,
      intervaloMinutos: conexion?.configuracion?.intervaloMinutos || 60,
      sincronizarStock: conexion?.configuracion?.sincronizarStock ?? true,
      sincronizarPrecios: conexion?.configuracion?.sincronizarPrecios ?? true,
      sincronizarImagenes: conexion?.configuracion?.sincronizarImagenes || false,
      sincronizarDescripciones: conexion?.configuracion?.sincronizarDescripciones ?? true,
      crearProductosNuevos: conexion?.configuracion?.crearProductosNuevos || false,
      actualizarExistentes: conexion?.configuracion?.actualizarExistentes ?? true,
    },
  })

  const handleSave = () => {
    if (!form.nombre || !form.url || !form.apiKey) {
      toast.error('Nombre, URL y API Key son obligatorios')
      return
    }
    onSave(form)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nombre de la conexion</Label>
          <Input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Mi tienda PrestaShop"
          />
        </div>
        <div>
          <Label>Plataforma</Label>
          <Select value={form.plataforma} onValueChange={(v) => setForm({ ...form, plataforma: v as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prestashop">PrestaShop</SelectItem>
              <SelectItem value="woocommerce">WooCommerce</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>URL de la tienda</Label>
        <Input
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://mi-tienda.com"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{form.plataforma === 'woocommerce' ? 'Consumer Key' : 'API Key'}</Label>
          <Input
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder="ck_xxxx..."
            type="password"
          />
        </div>
        {form.plataforma === 'woocommerce' && (
          <div>
            <Label>Consumer Secret</Label>
            <Input
              value={form.apiSecret}
              onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
              placeholder="cs_xxxx..."
              type="password"
            />
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Configuracion de sincronizacion</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Sincronizar stock</Label>
            <Switch
              checked={form.configuracion.sincronizarStock}
              onCheckedChange={(v) => setForm({ ...form, configuracion: { ...form.configuracion, sincronizarStock: v } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Sincronizar precios</Label>
            <Switch
              checked={form.configuracion.sincronizarPrecios}
              onCheckedChange={(v) => setForm({ ...form, configuracion: { ...form.configuracion, sincronizarPrecios: v } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Sincronizar imagenes</Label>
            <Switch
              checked={form.configuracion.sincronizarImagenes}
              onCheckedChange={(v) => setForm({ ...form, configuracion: { ...form.configuracion, sincronizarImagenes: v } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Crear productos nuevos al descargar</Label>
            <Switch
              checked={form.configuracion.crearProductosNuevos}
              onCheckedChange={(v) => setForm({ ...form, configuracion: { ...form.configuracion, crearProductosNuevos: v } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Actualizar productos existentes</Label>
            <Switch
              checked={form.configuracion.actualizarExistentes}
              onCheckedChange={(v) => setForm({ ...form, configuracion: { ...form.configuracion, actualizarExistentes: v } })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave}>{conexion ? 'Actualizar' : 'Crear'} Conexion</Button>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE LOGS
// ============================================

function SyncLogsView({ logs }: { logs: ISyncLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No hay registros de sincronizacion</p>
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {logs.map((log) => (
        <div key={log._id} className="flex items-center gap-3 p-2 border rounded-lg text-sm">
          {log.estado === 'exito' ? (
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          ) : log.estado === 'error' ? (
            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="font-medium capitalize">{log.tipo}</span>
            <span className="mx-1 text-muted-foreground">
              {log.direccion === 'subir' ? '(subir)' : log.direccion === 'descargar' ? '(descargar)' : '(bidireccional)'}
            </span>
            <span className="text-muted-foreground">
              - {log.resultados.exitosos}/{log.resultados.total} exitosos
              {log.resultados.fallidos > 0 && `, ${log.resultados.fallidos} errores`}
            </span>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(log.fechaInicio).toLocaleString('es-ES')}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function EcommercePage() {
  const [conexiones, setConexiones] = useState<IConexionEcommerce[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingConexion, setEditingConexion] = useState<IConexionEcommerce | null>(null)
  const [selectedConexion, setSelectedConexion] = useState<string | null>(null)
  const [logs, setLogs] = useState<ISyncLog[]>([])
  const [syncing, setSyncing] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; nombre: string }>({ open: false, id: '', nombre: '' })

  const cargarConexiones = useCallback(async () => {
    try {
      setLoading(true)
      const response = await ecommerceService.getConexiones()
      if (response.success) {
        setConexiones(response.data || [])
      }
    } catch (error) {
      toast.error('Error al cargar conexiones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarConexiones()
  }, [cargarConexiones])

  const cargarLogs = async (conexionId: string) => {
    try {
      const response = await ecommerceService.getLogs(conexionId)
      if (response.success) {
        setLogs(response.data || [])
        setSelectedConexion(conexionId)
      }
    } catch {
      toast.error('Error al cargar logs')
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (editingConexion) {
        await ecommerceService.actualizarConexion(editingConexion._id, data)
        toast.success('Conexion actualizada')
      } else {
        await ecommerceService.crearConexion(data)
        toast.success('Conexion creada')
      }
      setShowForm(false)
      setEditingConexion(null)
      cargarConexiones()
    } catch {
      toast.error('Error al guardar conexion')
    }
  }

  const handleTest = async (id: string) => {
    setTesting(id)
    try {
      const response = await ecommerceService.testConexion(id)
      if (response.data?.success) {
        toast.success(`Conexion exitosa (v${response.data.version || '?'})`)
      } else {
        toast.error(response.data?.message || 'Error de conexion')
      }
    } catch {
      toast.error('Error al probar conexion')
    } finally {
      setTesting(null)
    }
  }

  const handleSync = async (id: string, tipo: string, direccion: string) => {
    setSyncing(id)
    try {
      const response = await ecommerceService.sincronizar(id, tipo, direccion)
      if (response.success) {
        const r = response.data?.resultados
        toast.success(`Sync completada: ${r?.exitosos || 0}/${r?.total || 0} exitosos`)
        cargarConexiones()
        if (selectedConexion === id) cargarLogs(id)
      }
    } catch {
      toast.error('Error en sincronizacion')
    } finally {
      setSyncing(null)
    }
  }

  const handleDelete = async () => {
    try {
      await ecommerceService.eliminarConexion(deleteDialog.id)
      toast.success('Conexion eliminada')
      setDeleteDialog({ open: false, id: '', nombre: '' })
      cargarConexiones()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            E-commerce
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sincroniza tu catalogo con PrestaShop y WooCommerce
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={cargarConexiones}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => { setEditingConexion(null); setShowForm(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Conexion
          </Button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{editingConexion ? 'Editar' : 'Nueva'} Conexion E-commerce</h3>
          <ConnectionForm
            conexion={editingConexion}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingConexion(null) }}
          />
        </Card>
      )}

      {/* Lista de conexiones */}
      {conexiones.length === 0 && !showForm ? (
        <Card className="p-12 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No hay conexiones configuradas</p>
          <p className="text-sm text-muted-foreground mt-1">Crea una conexion para sincronizar con tu tienda online</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear conexion
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {conexiones.map((conexion) => (
            <Card key={conexion._id} className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{conexion.nombre}</h3>
                    <Badge variant={conexion.activa ? 'default' : 'secondary'} className="text-xs">
                      {conexion.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {conexion.plataforma}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{conexion.url}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {conexion.ultimaSync && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ultima sync: {new Date(conexion.ultimaSync).toLocaleString('es-ES')}
                      </span>
                    )}
                    <span>{conexion.estadisticas?.productosSync || 0} productos sincronizados</span>
                  </div>
                  {conexion.estadisticas?.ultimoError && (
                    <p className="text-xs text-red-500 mt-1">
                      Error: {conexion.estadisticas.ultimoError}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(conexion._id)}
                    disabled={testing === conexion._id}
                  >
                    {testing === conexion._id ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Wifi className="h-4 w-4 mr-1" />
                    )}
                    Probar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(conexion._id, 'productos', 'subir')}
                    disabled={syncing === conexion._id}
                  >
                    {syncing === conexion._id ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4 mr-1" />
                    )}
                    Subir Productos
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(conexion._id, 'productos', 'descargar')}
                    disabled={syncing === conexion._id}
                  >
                    <ArrowDown className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(conexion._id, 'stock', 'subir')}
                    disabled={syncing === conexion._id}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-1" />
                    Sync Stock
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cargarLogs(conexion._id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Logs
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditingConexion(conexion); setShowForm(true) }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteDialog({ open: true, id: conexion._id, nombre: conexion.nombre })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Logs expandidos */}
              {selectedConexion === conexion._id && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">Historial de sincronizacion</h4>
                  <SyncLogsView logs={logs} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Dialog eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar conexion</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que deseas eliminar la conexion &quot;{deleteDialog.nombre}&quot;? Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: '', nombre: '' })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
