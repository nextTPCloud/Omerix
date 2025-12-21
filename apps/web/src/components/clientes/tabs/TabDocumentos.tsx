'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Package,
  Truck,
  Receipt,
  Wrench,
  Plus,
  Eye,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import { presupuestosService } from '@/services/presupuestos.service'
import { pedidosService } from '@/services/pedidos.service'
import { albaranesService } from '@/services/albaranes.service'
import { facturasService } from '@/services/facturas.service'
import { partesTrabajoService } from '@/services/partes-trabajo.service'
import { toast } from 'sonner'

interface TabDocumentosProps {
  clienteId: string
  clienteNombre: string
}

interface DocumentoResumen {
  _id: string
  codigo: string
  fecha: string
  estado: string
  total: number
}

const ESTADOS_COLORES: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  enviado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  aceptado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rechazado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  facturado: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  parcial: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  completado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pagada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cobrada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  vencida: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function TabDocumentos({ clienteId, clienteNombre }: TabDocumentosProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('presupuestos')
  const [loading, setLoading] = useState(true)

  const [presupuestos, setPresupuestos] = useState<DocumentoResumen[]>([])
  const [pedidos, setPedidos] = useState<DocumentoResumen[]>([])
  const [albaranes, setAlbaranes] = useState<DocumentoResumen[]>([])
  const [facturas, setFacturas] = useState<DocumentoResumen[]>([])
  const [partes, setPartes] = useState<DocumentoResumen[]>([])

  const [counts, setCounts] = useState({
    presupuestos: 0,
    pedidos: 0,
    albaranes: 0,
    facturas: 0,
    partes: 0,
  })

  useEffect(() => {
    cargarDocumentos()
  }, [clienteId])

  const cargarDocumentos = async () => {
    setLoading(true)
    try {
      const [presRes, pedRes, albRes, facRes, partRes] = await Promise.all([
        presupuestosService.getByClienteId(clienteId).catch(() => ({ data: [] })),
        pedidosService.getAll({ clienteId, limit: 50 }).catch(() => ({ data: [] })),
        albaranesService.getAll({ clienteId, limit: 50 }).catch(() => ({ data: [] })),
        facturasService.getAll({ clienteId, limit: 50 }).catch(() => ({ data: [] })),
        partesTrabajoService.getAll({ clienteId, limit: 50 }).catch(() => ({ data: [] })),
      ])

      const mapDoc = (doc: any): DocumentoResumen => ({
        _id: doc._id,
        codigo: doc.codigo || doc.numero || '-',
        fecha: doc.fecha || doc.fechaCreacion,
        estado: doc.estado || 'borrador',
        total: doc.totales?.totalPresupuesto || doc.totales?.totalPedido ||
               doc.totales?.totalAlbaran || doc.totales?.totalFactura ||
               doc.importeTotal || 0,
      })

      const pres = (presRes.data || []).map(mapDoc)
      const ped = (pedRes.data || []).map(mapDoc)
      const alb = (albRes.data || []).map(mapDoc)
      const fac = (facRes.data || []).map(mapDoc)
      const part = (partRes.data || []).map(mapDoc)

      setPresupuestos(pres)
      setPedidos(ped)
      setAlbaranes(alb)
      setFacturas(fac)
      setPartes(part)

      setCounts({
        presupuestos: pres.length,
        pedidos: ped.length,
        albaranes: alb.length,
        facturas: fac.length,
        partes: part.length,
      })
    } catch (error) {
      console.error('Error cargando documentos:', error)
      toast.error('Error al cargar los documentos')
    } finally {
      setLoading(false)
    }
  }

  const renderTabla = (
    documentos: DocumentoResumen[],
    tipo: string,
    rutaBase: string
  ) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (documentos.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No hay {tipo} registrados</p>
          <Button
            variant="outline"
            onClick={() => router.push(`${rutaBase}/nuevo?clienteId=${clienteId}`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear {tipo.slice(0, -1)}
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentos.slice(0, 10).map((doc) => (
                <TableRow
                  key={doc._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`${rutaBase}/${doc._id}`)}
                >
                  <TableCell className="font-mono font-medium">
                    {doc.codigo}
                  </TableCell>
                  <TableCell>
                    {new Date(doc.fecha).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <Badge className={ESTADOS_COLORES[doc.estado] || ESTADOS_COLORES.borrador}>
                      {doc.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {doc.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </TableCell>
                  <TableCell>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {documentos.length > 10 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => router.push(`${rutaBase}?clienteId=${clienteId}`)}
            >
              Ver todos ({documentos.length})
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Documentos</CardTitle>
            <CardDescription>
              Historial de documentos comerciales de {clienteNombre}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={cargarDocumentos}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="presupuestos" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Presupuestos</span>
              {counts.presupuestos > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {counts.presupuestos}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
              {counts.pedidos > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {counts.pedidos}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="albaranes" className="gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Albaranes</span>
              {counts.albaranes > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {counts.albaranes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="facturas" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Facturas</span>
              {counts.facturas > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {counts.facturas}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="partes" className="gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Partes</span>
              {counts.partes > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {counts.partes}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presupuestos" className="mt-4">
            {renderTabla(presupuestos, 'presupuestos', '/presupuestos')}
          </TabsContent>
          <TabsContent value="pedidos" className="mt-4">
            {renderTabla(pedidos, 'pedidos', '/pedidos')}
          </TabsContent>
          <TabsContent value="albaranes" className="mt-4">
            {renderTabla(albaranes, 'albaranes', '/albaranes')}
          </TabsContent>
          <TabsContent value="facturas" className="mt-4">
            {renderTabla(facturas, 'facturas', '/facturas')}
          </TabsContent>
          <TabsContent value="partes" className="mt-4">
            {renderTabla(partes, 'partes de trabajo', '/partes-trabajo')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
