'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { presupuestosService } from '@/services/presupuestos.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  TrendingUp,
  TrendingDown,
  Euro,
  Users,
  User,
  RefreshCw,
  BarChart3,
  Calendar,
  Timer,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecordatoriosWidget } from './RecordatoriosPresupuestos';

interface KPIsData {
  resumen: {
    total: number;
    aceptados: number;
    rechazados: number;
    pendientes: number;
    borradores: number;
    enviados: number;
    valorTotal: number;
    valorAceptados: number;
    tasaConversion: number;
    tiempoMedioRespuesta: number;
  };
  porEstado: Array<{ estado: string; cantidad: number; valor: number }>;
  evolucionMensual: Array<{
    mes: string;
    creados: number;
    aceptados: number;
    rechazados: number;
    valorCreados: number;
    valorAceptados: number;
  }>;
  topClientes: Array<{
    clienteId: string;
    clienteNombre: string;
    cantidad: number;
    valorTotal: number;
    aceptados: number;
  }>;
  topAgentes: Array<{
    agenteId: string;
    agenteNombre: string;
    cantidad: number;
    valorTotal: number;
    tasaConversion: number;
  }>;
}

interface PresupuestosDashboardProps {
  className?: string;
}

const PERIODOS = [
  { value: 'mes', label: 'Este mes' },
  { value: 'trimestre', label: 'Este trimestre' },
  { value: 'año', label: 'Este año' },
  { value: 'todo', label: 'Todo' },
];

const ESTADO_COLORS: Record<string, string> = {
  borrador: 'bg-gray-500',
  enviado: 'bg-yellow-500',
  pendiente: 'bg-orange-500',
  aceptado: 'bg-green-500',
  rechazado: 'bg-red-500',
  caducado: 'bg-purple-500',
  convertido: 'bg-blue-500',
};

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borradores',
  enviado: 'Enviados',
  pendiente: 'Pendientes',
  aceptado: 'Aceptados',
  rechazado: 'Rechazados',
  caducado: 'Caducados',
  convertido: 'Convertidos',
};

export function PresupuestosDashboard({ className }: PresupuestosDashboardProps) {
  const [kpis, setKpis] = useState<KPIsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('año');

  const getPeriodoFechas = (p: string): { desde?: string; hasta?: string } => {
    const hoy = new Date();
    switch (p) {
      case 'mes':
        return {
          desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0],
          hasta: hoy.toISOString().split('T')[0],
        };
      case 'trimestre':
        const trimestre = Math.floor(hoy.getMonth() / 3);
        return {
          desde: new Date(hoy.getFullYear(), trimestre * 3, 1).toISOString().split('T')[0],
          hasta: hoy.toISOString().split('T')[0],
        };
      case 'año':
        return {
          desde: new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0],
          hasta: hoy.toISOString().split('T')[0],
        };
      default:
        return {};
    }
  };

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const response = await presupuestosService.getKPIs(getPeriodoFechas(periodo));
      if (response.success && response.data) {
        setKpis(response.data);
      }
    } catch (error) {
      console.error('Error al obtener KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, [periodo]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M €`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K €`;
    return formatCurrency(value);
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className={cn('text-center py-12 text-muted-foreground', className)}>
        No se pudieron cargar los KPIs
      </div>
    );
  }

  const { resumen, porEstado, evolucionMensual, topClientes, topAgentes } = kpis;

  // Calcular máximo para barras
  const maxEvolucion = Math.max(...evolucionMensual.map((m) => m.creados), 1);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header con selector de periodo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard de Presupuestos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            KPIs y métricas de rendimiento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={fetchKPIs}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen.total}</p>
                <p className="text-xs text-muted-foreground">Presupuestos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen.tasaConversion}%</p>
                <p className="text-xs text-muted-foreground">Tasa conversión</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Euro className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCompactCurrency(resumen.valorAceptados)}</p>
                <p className="text-xs text-muted-foreground">Valor aceptados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Timer className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen.tiempoMedioRespuesta} días</p>
                <p className="text-xs text-muted-foreground">Tiempo respuesta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado y evolución */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Por estado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {porEstado.map((estado) => (
                <div key={estado.estado} className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full', ESTADO_COLORS[estado.estado])} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {ESTADO_LABELS[estado.estado] || estado.estado}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {estado.cantidad} ({formatCompactCurrency(estado.valor)})
                      </span>
                    </div>
                    <Progress
                      value={(estado.cantidad / resumen.total) * 100}
                      className="h-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evolución mensual */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolución mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-1 h-[150px]">
              {evolucionMensual.slice(-6).map((mes, index) => {
                const mesLabel = new Date(mes.mes + '-01').toLocaleDateString('es-ES', {
                  month: 'short',
                });
                const heightCreados = (mes.creados / maxEvolucion) * 100;
                const heightAceptados = (mes.aceptados / maxEvolucion) * 100;

                return (
                  <div key={mes.mes} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex-1 w-full flex flex-col justify-end gap-0.5">
                      <div
                        className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-t"
                        style={{ height: `${heightCreados}%`, minHeight: mes.creados > 0 ? '4px' : '0' }}
                        title={`Creados: ${mes.creados}`}
                      />
                      <div
                        className="w-full bg-green-500 rounded-b"
                        style={{ height: `${heightAceptados}%`, minHeight: mes.aceptados > 0 ? '4px' : '0' }}
                        title={`Aceptados: ${mes.aceptados}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase">{mesLabel}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-200 dark:bg-blue-900/50 rounded" />
                <span className="text-muted-foreground">Creados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-muted-foreground">Aceptados</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top clientes, agentes y recordatorios */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Top clientes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClientes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin datos
              </p>
            ) : (
              <div className="space-y-3">
                {topClientes.slice(0, 5).map((cliente, index) => (
                  <div key={cliente.clienteId} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-5">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/clientes/${cliente.clienteId}`}
                        className="text-sm font-medium hover:text-primary hover:underline truncate block"
                      >
                        {cliente.clienteNombre}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {cliente.cantidad} presupuestos · {cliente.aceptados} aceptados
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCompactCurrency(cliente.valorTotal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top agentes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Top Agentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topAgentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin datos
              </p>
            ) : (
              <div className="space-y-3">
                {topAgentes.map((agente, index) => (
                  <div key={agente.agenteId} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-5">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {agente.agenteNombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {agente.cantidad} presupuestos · {agente.tasaConversion.toFixed(0)}% conversión
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCompactCurrency(agente.valorTotal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recordatorios */}
        <RecordatoriosWidget />
      </div>

      {/* Resumen detallado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumen del periodo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{resumen.aceptados}</p>
              <p className="text-xs text-muted-foreground">Aceptados</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{resumen.rechazados}</p>
              <p className="text-xs text-muted-foreground">Rechazados</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{resumen.pendientes}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{resumen.borradores}</p>
              <p className="text-xs text-muted-foreground">Borradores</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{formatCompactCurrency(resumen.valorTotal)}</p>
              <p className="text-xs text-muted-foreground">Valor total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PresupuestosDashboard;
