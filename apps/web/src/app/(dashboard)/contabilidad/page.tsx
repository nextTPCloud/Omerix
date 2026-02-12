'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { contabilidadService } from '@/services/contabilidad.service'
import { ConfigContable } from '@/types/contabilidad.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calculator,
  BookOpen,
  FileText,
  PieChart,
  Download,
  Settings,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Wallet,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ContabilidadPage() {
  const router = useRouter()
  const [config, setConfig] = useState<ConfigContable | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCuentas: 0,
    totalAsientos: 0,
    ultimoAsiento: 0,
  })

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsLoading(true)
        const [configData, cuentas, asientos] = await Promise.all([
          contabilidadService.getConfig(),
          contabilidadService.getCuentas({ activa: true }),
          contabilidadService.getAsientos({ limite: 1 }),
        ])

        setConfig(configData)
        setStats({
          totalCuentas: cuentas.length,
          totalAsientos: asientos.total || 0,
          ultimoAsiento: asientos.asientos?.[0]?.numero || 0,
        })
      } catch (error: any) {
        console.error('Error cargando datos:', error)
        // Si no hay config, puede que no esté inicializado
        if (error.response?.status === 404) {
          setConfig(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [])

  const handleInicializarPlan = async () => {
    try {
      toast.loading('Inicializando plan de cuentas...')
      const result = await contabilidadService.inicializarPlanCuentas()
      toast.dismiss()
      toast.success(result.mensaje)
      // Recargar datos
      window.location.reload()
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.error || 'Error al inicializar')
    }
  }

  const modulos = [
    {
      titulo: 'Plan de Cuentas',
      descripcion: 'Gestiona el catálogo de cuentas contables',
      icono: BookOpen,
      href: '/contabilidad/cuentas',
      color: 'bg-blue-500',
      stats: `${stats.totalCuentas} cuentas`,
    },
    {
      titulo: 'Asientos',
      descripcion: 'Registro de asientos contables',
      icono: FileText,
      href: '/contabilidad/asientos',
      color: 'bg-green-500',
      stats: `${stats.totalAsientos} asientos`,
    },
    {
      titulo: 'Libro Diario',
      descripcion: 'Consulta el libro diario',
      icono: BarChart3,
      href: '/contabilidad/informes/libro-diario',
      color: 'bg-purple-500',
    },
    {
      titulo: 'Libro Mayor',
      descripcion: 'Consulta el libro mayor por cuenta',
      icono: Wallet,
      href: '/contabilidad/informes/libro-mayor',
      color: 'bg-indigo-500',
    },
    {
      titulo: 'Sumas y Saldos',
      descripcion: 'Balance de comprobación',
      icono: Calculator,
      href: '/contabilidad/informes/sumas-saldos',
      color: 'bg-orange-500',
    },
    {
      titulo: 'Balance de Situación',
      descripcion: 'Estado de la situación patrimonial',
      icono: PieChart,
      href: '/contabilidad/informes/balance',
      color: 'bg-teal-500',
    },
    {
      titulo: 'Cuenta de Resultados',
      descripcion: 'Pérdidas y ganancias',
      icono: TrendingUp,
      href: '/contabilidad/informes/resultados',
      color: 'bg-pink-500',
    },
    {
      titulo: 'Exportación',
      descripcion: 'Exportar a A3, Sage, CSV',
      icono: Download,
      href: '/contabilidad/exportar',
      color: 'bg-gray-500',
    },
  ]

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando contabilidad...</p>
          </div>
        </div>
      
    )
  }

  return (
    
      <div className="w-full space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Calculator className="h-7 w-7 text-primary" />
              Contabilidad
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestión contable y financiera de la empresa
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link href="/contabilidad/configuracion">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/contabilidad/asientos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Asiento
              </Link>
            </Button>
          </div>
        </div>

        {/* ALERTA SI NO HAY PLAN DE CUENTAS */}
        {stats.totalCuentas === 0 && (
          <Card className="p-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  Plan de cuentas no inicializado
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Para comenzar a usar la contabilidad, necesitas inicializar el Plan General Contable (PGC 2007).
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={handleInicializarPlan}
                >
                  Inicializar Plan de Cuentas PGC 2007
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ESTADÍSTICAS RÁPIDAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ejercicio Activo</p>
                <p className="text-2xl font-bold">{config?.ejercicioActivo || new Date().getFullYear()}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cuentas Activas</p>
                <p className="text-2xl font-bold">{stats.totalCuentas}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Asientos</p>
                <p className="text-2xl font-bold">{stats.totalAsientos}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Último Asiento</p>
                <p className="text-2xl font-bold">#{stats.ultimoAsiento}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* MÓDULOS */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Módulos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modulos.map((modulo) => (
              <Link key={modulo.href} href={modulo.href}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group h-full">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg ${modulo.color}`}>
                      <modulo.icono className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {modulo.titulo}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {modulo.descripcion}
                      </p>
                      {modulo.stats && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {modulo.stats}
                        </Badge>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* INFORMACIÓN ADICIONAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4" />
              Configuración Actual
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generación automática</span>
                <Badge variant={config?.generarAsientosAutomaticos ? 'default' : 'secondary'}>
                  {config?.generarAsientosAutomaticos ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Próximo asiento</span>
                <span className="font-medium">#{config?.proximoNumeroAsiento || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prefijo clientes</span>
                <span className="font-mono">{config?.prefijoCuentaCliente || '430'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prefijo proveedores</span>
                <span className="font-mono">{config?.prefijoCuentaProveedor || '400'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4" />
              Acciones Rápidas
            </h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/contabilidad/asientos/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear asiento manual
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/contabilidad/informes/sumas-saldos">
                  <Calculator className="h-4 w-4 mr-2" />
                  Ver sumas y saldos
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/contabilidad/exportar">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar contabilidad
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    
  )
}
