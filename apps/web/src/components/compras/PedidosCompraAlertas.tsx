'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pedidosCompraService } from '@/services/pedidos-compra.service';
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
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Package,
  Truck,
  CalendarClock,
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface AlertaPedidoCompra {
  _id: string;
  codigo: string;
  proveedorNombre: string;
  fecha: string;
  fechaEntregaPrevista?: string;
  estado: string;
  prioridad?: string;
  totales: { totalPedido: number };
}

interface AlertasData {
  pendientesRecibir: AlertaPedidoCompra[];
  retrasados: AlertaPedidoCompra[];
  proximosRecibir: AlertaPedidoCompra[];
}

interface PedidosCompraAlertasProps {
  diasAlerta?: number;
  onRefresh?: () => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function PedidosCompraAlertas({
  diasAlerta = 7,
  onRefresh,
  className,
  collapsible = true,
  defaultCollapsed = false,
}: PedidosCompraAlertasProps) {
  const [alertas, setAlertas] = useState<AlertasData | null>(null);
  const [resumen, setResumen] = useState<{
    pendientesRecibir: number;
    retrasados: number;
    proximosRecibir: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [activeTab, setActiveTab] = useState('pendientes');

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const response = await pedidosCompraService.getAlertas(diasAlerta);

      if (response.success && response.data) {
        setAlertas(response.data.alertas);
        setResumen(response.data.resumen);
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

  const getDiasEntrega = (fechaEntrega?: string) => {
    if (!fechaEntrega) return null;
    const dias = differenceInDays(new Date(fechaEntrega), new Date());
    if (dias < 0) return { texto: `Retrasado ${Math.abs(dias)} días`, clase: 'text-red-600' };
    if (dias === 0) return { texto: 'Entrega hoy', clase: 'text-orange-600' };
    if (dias === 1) return { texto: 'Entrega mañana', clase: 'text-orange-600' };
    if (dias <= 3) return { texto: `${dias} días para entrega`, clase: 'text-yellow-600' };
    return { texto: `${dias} días para entrega`, clase: 'text-muted-foreground' };
  };

  const getPrioridadBadge = (prioridad?: string) => {
    switch (prioridad) {
      case 'alta':
        return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'media':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'baja':
        return <Badge variant="outline" className="text-xs">Baja</Badge>;
      default:
        return null;
    }
  };

  // Si no hay alertas, no mostrar nada
  if (!loading && resumen && resumen.total === 0) {
    return null;
  }

  const AlertaItem = ({ item, tipo }: { item: AlertaPedidoCompra; tipo: 'pendiente' | 'retrasado' | 'proximo' }) => {
    const diasInfo = getDiasEntrega(item.fechaEntregaPrevista);

    return (
      <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/compras/pedidos/${item._id}`}
              className="font-medium text-sm hover:text-primary hover:underline truncate"
            >
              {item.codigo}
            </Link>
            <Badge variant="outline" className="text-xs">
              {item.estado}
            </Badge>
            {getPrioridadBadge(item.prioridad)}
          </div>
          <p className="text-sm text-muted-foreground truncate">{item.proveedorNombre}</p>
          <div className="flex items-center gap-3 mt-1">
            {diasInfo && (
              <span className={cn('text-xs font-medium', diasInfo.clase)}>
                {diasInfo.texto}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm font-semibold whitespace-nowrap">
            {formatCurrency(item.totales?.totalPedido)}
          </span>
          <Link href={`/compras/pedidos/${item._id}`}>
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
          <TabsTrigger value="pendientes" className="text-xs px-3 h-7 gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Pendientes
            {resumen && resumen.pendientesRecibir > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.pendientesRecibir}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="retrasados" className="text-xs px-3 h-7 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Retrasados
            {resumen && resumen.retrasados > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.retrasados}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="proximos" className="text-xs px-3 h-7 gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            Próx. recibir
            {resumen && resumen.proximosRecibir > 0 && (
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.proximosRecibir}
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
          <TabsContent value="pendientes" className="mt-0">
            {alertas?.pendientesRecibir && alertas.pendientesRecibir.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.pendientesRecibir.map((item) => (
                  <AlertaItem key={item._id} item={item} tipo="pendiente" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay pedidos pendientes de recibir
              </div>
            )}
          </TabsContent>

          <TabsContent value="retrasados" className="mt-0">
            {alertas?.retrasados && alertas.retrasados.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.retrasados.map((item) => (
                  <AlertaItem key={item._id} item={item} tipo="retrasado" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay pedidos retrasados
              </div>
            )}
          </TabsContent>

          <TabsContent value="proximos" className="mt-0">
            {alertas?.proximosRecibir && alertas.proximosRecibir.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.proximosRecibir.map((item) => (
                  <AlertaItem key={item._id} item={item} tipo="proximo" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay entregas próximas
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
            Alertas de pedidos de compra
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
              Alertas de pedidos de compra
              {resumen && resumen.total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {resumen.total} alertas
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                {!isOpen && resumen && (
                  <div className="flex items-center gap-2 text-xs">
                    {resumen.retrasados > 0 && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {resumen.retrasados}
                      </span>
                    )}
                    {resumen.pendientesRecibir > 0 && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <Package className="h-3 w-3" />
                        {resumen.pendientesRecibir}
                      </span>
                    )}
                    {resumen.proximosRecibir > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Truck className="h-3 w-3" />
                        {resumen.proximosRecibir}
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

export default PedidosCompraAlertas;
