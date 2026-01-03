'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { contabilidadService } from '@/services/contabilidad.service'
import { CuentaContable, TipoCuenta } from '@/types/contabilidad.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BookOpen,
  Search,
  Plus,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Filter,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

// Colores por tipo de cuenta
const TIPO_COLORS: Record<string, string> = {
  activo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pasivo: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  patrimonio: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ingreso: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  gasto: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

// Nombres de grupos PGC
const GRUPO_NOMBRES: Record<string, string> = {
  '1': 'Financiación Básica',
  '2': 'Activo No Corriente',
  '3': 'Existencias',
  '4': 'Acreedores y Deudores',
  '5': 'Cuentas Financieras',
  '6': 'Compras y Gastos',
  '7': 'Ventas e Ingresos',
}

export default function CuentasContablesPage() {
  const router = useRouter()
  const [cuentas, setCuentas] = useState<CuentaContable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [nivelFiltro, setNivelFiltro] = useState<string>('all')
  const [tipoFiltro, setTipoFiltro] = useState<string>('all')
  const [soloMovimiento, setSoloMovimiento] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5', '6', '7']))
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cuenta: CuentaContable | null }>({
    open: false,
    cuenta: null,
  })

  // Cargar cuentas
  const cargarCuentas = async () => {
    try {
      setIsLoading(true)
      const data = await contabilidadService.getCuentas({
        activa: true,
        busqueda: busqueda || undefined,
        nivel: nivelFiltro !== 'all' ? parseInt(nivelFiltro) : undefined,
        tipo: tipoFiltro !== 'all' ? (tipoFiltro as TipoCuenta) : undefined,
        esMovimiento: soloMovimiento ? true : undefined,
      })
      setCuentas(data)
    } catch (error) {
      console.error('Error cargando cuentas:', error)
      toast.error('Error al cargar las cuentas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarCuentas()
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda, nivelFiltro, tipoFiltro, soloMovimiento])

  // Agrupar cuentas por grupo (primer dígito)
  const cuentasAgrupadas = useMemo(() => {
    const grupos: Record<string, CuentaContable[]> = {}

    cuentas.forEach((cuenta) => {
      const grupo = cuenta.codigo.charAt(0)
      if (!grupos[grupo]) {
        grupos[grupo] = []
      }
      grupos[grupo].push(cuenta)
    })

    // Ordenar cada grupo por código
    Object.keys(grupos).forEach((grupo) => {
      grupos[grupo].sort((a, b) => a.codigo.localeCompare(b.codigo))
    })

    return grupos
  }, [cuentas])

  // Toggle grupo expandido
  const toggleGrupo = (grupo: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(grupo)) {
      newExpanded.delete(grupo)
    } else {
      newExpanded.add(grupo)
    }
    setExpandedGroups(newExpanded)
  }

  // Eliminar cuenta
  const handleDelete = async () => {
    if (!deleteDialog.cuenta) return

    try {
      await contabilidadService.deleteCuenta(deleteDialog.cuenta._id)
      toast.success('Cuenta desactivada correctamente')
      setDeleteDialog({ open: false, cuenta: null })
      cargarCuentas()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al desactivar la cuenta')
    }
  }

  // Formatear importe
  const formatImporte = (importe: number) => {
    return importe.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
    })
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda('')
    setNivelFiltro('all')
    setTipoFiltro('all')
    setSoloMovimiento(false)
  }

  const hayFiltrosActivos = busqueda || nivelFiltro !== 'all' || tipoFiltro !== 'all' || soloMovimiento

  return (
    <DashboardLayout>
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
                <BookOpen className="h-7 w-7 text-primary" />
                Plan de Cuentas
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {cuentas.length} cuentas contables
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cargarCuentas}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button size="sm" asChild>
              <Link href="/contabilidad/cuentas/nueva">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cuenta
              </Link>
            </Button>
          </div>
        </div>

        {/* FILTROS */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código o nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={nivelFiltro} onValueChange={setNivelFiltro}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="1">Nivel 1 (Grupos)</SelectItem>
                <SelectItem value="2">Nivel 2 (Subgrupos)</SelectItem>
                <SelectItem value="3">Nivel 3 (Cuentas)</SelectItem>
                <SelectItem value="4">Nivel 4+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="pasivo">Pasivo</SelectItem>
                <SelectItem value="patrimonio">Patrimonio</SelectItem>
                <SelectItem value="ingreso">Ingresos</SelectItem>
                <SelectItem value="gasto">Gastos</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={soloMovimiento ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSoloMovimiento(!soloMovimiento)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Solo movimiento
            </Button>

            {hayFiltrosActivos && (
              <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>
        </Card>

        {/* LISTADO */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando cuentas...</span>
            </div>
          ) : cuentas.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium">No se encontraron cuentas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Prueba ajustando los filtros o crea una nueva cuenta
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {Object.keys(cuentasAgrupadas)
                .sort()
                .map((grupo) => (
                  <div key={grupo}>
                    {/* Header del grupo */}
                    <button
                      className="w-full px-4 py-3 flex items-center gap-3 bg-muted/50 hover:bg-muted transition-colors text-left"
                      onClick={() => toggleGrupo(grupo)}
                    >
                      {expandedGroups.has(grupo) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-bold text-lg">{grupo}</span>
                      <span className="font-medium">{GRUPO_NOMBRES[grupo]}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {cuentasAgrupadas[grupo].length} cuentas
                      </Badge>
                    </button>

                    {/* Cuentas del grupo */}
                    {expandedGroups.has(grupo) && (
                      <div className="divide-y">
                        {cuentasAgrupadas[grupo].map((cuenta) => (
                          <div
                            key={cuenta._id}
                            className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors group"
                            style={{ paddingLeft: `${1 + cuenta.nivel * 1.5}rem` }}
                          >
                            {/* Código */}
                            <span className="font-mono text-sm font-medium w-24">
                              {cuenta.codigo}
                            </span>

                            {/* Nombre */}
                            <span
                              className={`flex-1 ${cuenta.esMovimiento ? '' : 'font-semibold'}`}
                            >
                              {cuenta.nombre}
                            </span>

                            {/* Tipo */}
                            <Badge
                              variant="secondary"
                              className={`text-xs ${TIPO_COLORS[cuenta.tipo] || ''}`}
                            >
                              {cuenta.tipo}
                            </Badge>

                            {/* Indicador movimiento */}
                            {cuenta.esMovimiento && (
                              <Badge variant="outline" className="text-xs">
                                Movimiento
                              </Badge>
                            )}

                            {/* Saldo */}
                            {cuenta.esMovimiento && cuenta.numeroMovimientos > 0 && (
                              <span
                                className={`text-sm font-medium w-28 text-right ${
                                  cuenta.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {formatImporte(cuenta.saldo)}
                              </span>
                            )}

                            {/* Acciones */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/contabilidad/cuentas/${cuenta._id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalle
                                </DropdownMenuItem>
                                {!cuenta.esSistema && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(`/contabilidad/cuentas/${cuenta._id}/editar`)
                                      }
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    {cuenta.numeroMovimientos === 0 && (
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => setDeleteDialog({ open: true, cuenta })}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Desactivar
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* DIALOG ELIMINAR */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Desactivar cuenta</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas desactivar la cuenta{' '}
                <strong>{deleteDialog.cuenta?.codigo}</strong> - {deleteDialog.cuenta?.nombre}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, cuenta: null })}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Desactivar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
