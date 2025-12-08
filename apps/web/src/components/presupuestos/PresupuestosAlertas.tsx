'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { presupuestosService } from '@/services/presupuestos.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Send,
  RefreshCw,
  X,
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AlertaPresupuesto {
  _id: string;
  codigo: string;
  clienteNombre: string;
  fechaValidez: string;
  estado: string;
  totales: { totalPresupuesto: number };
  fechaEnvio?: string;
  contadorEnvios?: number;
}

interface AlertasData {
  proximosAExpirar: AlertaPresupuesto[];
  expirados: AlertaPresupuesto[];
  sinRespuesta: AlertaPresupuesto[];
}

interface PresupuestosAlertasProps {
  diasAlerta?: number;
  onRefresh?: () => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function PresupuestosAlertas({
  diasAlerta = 7,
  onRefresh,
  className,
  collapsible = true,
  defaultCollapsed = false,
}: PresupuestosAlertasProps) {
  const [alertas, setAlertas] = useState<AlertasData | null>(null);
  const [resumen, setResumen] = useState<{
    proximosAExpirar: number;
    expirados: number;
    sinRespuesta: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [activeTab, setActiveTab] = useState('proximos');

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const [alertasRes, resumenRes] = await Promise.all([
        presupuestosService.getAlertasValidez(diasAlerta),
        presupuestosService.getResumenAlertas(diasAlerta),
      ]);

      if (alertasRes.success && alertasRes.data) {
        setAlertas(alertasRes.data);
      }
      if (resumenRes.success && resumenRes.data) {
        setResumen(resumenRes.data);
      }
    } catch (error) {
      console.error('Error al obtener alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, [diasAlerta]);

  const handleRefresh = () => {
    fetchAlertas();
    onRefresh?.();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);

  const getDiasRestantes = (fechaValidez: string) => {
    const dias = differenceInDays(new Date(fechaValidez), new Date());
    if (dias < 0) return { texto: `Expirado hace ${Math.abs(dias)} días`, clase: 'text-red-600' };
    if (dias === 0) return { texto: 'Expira hoy', clase: 'text-red-600' };
    if (dias === 1) return { texto: 'Expira mañana', clase: 'text-orange-600' };
    return { texto: `${dias} días restantes`, clase: dias <= 3 ? 'text-orange-600' : 'text-yellow-600' };
  };

  const getDiasDesdeEnvio = (fechaEnvio?: string) => {
    if (!fechaEnvio) return null;
    const dias = differenceInDays(new Date(), new Date(fechaEnvio));
    return dias;
  };

  // Si no hay alertas, no mostrar nada
  if (!loading && resumen && resumen.total === 0) {
    return null;
  }

  const AlertaItem = ({ item, tipo }: { item: AlertaPresupuesto; tipo: 'proximo' | 'expirado' | 'sinRespuesta' }) => {
    const diasInfo = getDiasRestantes(item.fechaValidez);
    const diasDesdeEnvio = getDiasDesdeEnvio(item.fechaEnvio);

    return (
      <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/presupuestos/${item._id}`}
              className="font-medium text-sm hover:text-primary hover:underline truncate"
            >
              {item.codigo}
            </Link>
            <Badge variant="outline" className="text-xs">
              {item.estado}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{item.clienteNombre}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn('text-xs font-medium', diasInfo.clase)}>
              {diasInfo.texto}
            </span>
            {tipo === 'sinRespuesta' && diasDesdeEnvio !== null && (
              <span className="text-xs text-muted-foreground">
                Enviado hace {diasDesdeEnvio} días
                {item.contadorEnvios && item.contadorEnvios > 1 && ` (${item.contadorEnvios}x)`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm font-semibold whitespace-nowrap">
            {formatCurrency(item.totales?.totalPresupuesto)}
          </span>
          <Link href={`/presupuestos/${item._id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  const content = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex items-center justify-between mb-3">
        <TabsList className="h-8">
          <TabsTrigger value="proximos" className="text-xs px-3 h-7 gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Por expirar
            {resumen && resumen.proximosAExpirar > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.proximosAExpirar}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expirados" className="text-xs px-3 h-7 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Expirados
            {resumen && resumen.expirados > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.expirados}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sinRespuesta" className="text-xs px-3 h-7 gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Sin respuesta
            {resumen && resumen.sinRespuesta > 0 && (
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.sinRespuesta}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <TabsContent value="proximos" className="mt-0">
            {alertas?.proximosAExpirar && alertas.proximosAExpirar.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.proximosAExpirar.map((item) => (
                  <AlertaItem key={item._id} item={item} tipo="proximo" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay presupuestos próximos a expirar
              </div>
            )}
          </TabsContent>

          <TabsContent value="expirados" className="mt-0">
            {alertas?.expirados && alertas.expirados.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.expirados.map((item) => (
                  <AlertaItem key={item._id} item={item} tipo="expirado" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay presupuestos expirados pendientes
              </div>
            )}
          </TabsContent>

          <TabsContent value="sinRespuesta" className="mt-0">
            {alertas?.sinRespuesta && alertas.sinRespuesta.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.sinRespuesta.map((item) => (
                  <AlertaItem key={item._id} item={item} tipo="sinRespuesta" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay presupuestos enviados sin respuesta
              </div>
            )}
          </TabsContent>
        </>
      )}
    </Tabs>
  );

  if (!collapsible) {
    return (
      <Card className={cn('border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900/50', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            Alertas de presupuestos
            {resumen && resumen.total > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {resumen.total} alertas
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <Card className={cn(
        'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900/50',
        !isOpen && 'cursor-pointer hover:bg-orange-100/50 dark:hover:bg-orange-950/30'
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Alertas de presupuestos
              {resumen && resumen.total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {resumen.total} alertas
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                {!isOpen && resumen && (
                  <div className="flex items-center gap-2 text-xs">
                    {resumen.proximosAExpirar > 0 && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Clock className="h-3 w-3" />
                        {resumen.proximosAExpirar}
                      </span>
                    )}
                    {resumen.expirados > 0 && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {resumen.expirados}
                      </span>
                    )}
                    {resumen.sinRespuesta > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Send className="h-3 w-3" />
                        {resumen.sinRespuesta}
                      </span>
                    )}
                  </div>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{content}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Componente compacto para mostrar solo el resumen en la barra de herramientas
export function PresupuestosAlertasBadge({
  diasAlerta = 7,
  onClick,
}: {
  diasAlerta?: number;
  onClick?: () => void;
}) {
  const [resumen, setResumen] = useState<{
    proximosAExpirar: number;
    expirados: number;
    sinRespuesta: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const response = await presupuestosService.getResumenAlertas(diasAlerta);
        if (response.success && response.data) {
          setResumen(response.data);
        }
      } catch (error) {
        console.error('Error al obtener resumen de alertas:', error);
      }
    };
    fetchResumen();
  }, [diasAlerta]);

  if (!resumen || resumen.total === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        'h-8 gap-1.5',
        resumen.expirados > 0 && 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50',
        resumen.expirados === 0 && resumen.proximosAExpirar > 0 && 'border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-900 dark:text-orange-400 dark:hover:bg-orange-950/50'
      )}
      onClick={onClick}
    >
      <AlertCircle className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{resumen.total} alertas</span>
    </Button>
  );
}

export default PresupuestosAlertas;
