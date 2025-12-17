'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pedidosService } from '@/services/pedidos.service';
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
  Package,
  RefreshCw,
  Truck,
  Calendar,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AlertaPedido {
  _id: string;
  codigo: string;
  clienteNombre: string;
  fecha: string;
  fechaEntregaComprometida?: string;
  fechaEntregaReal?: string;
  fechaConfirmacion?: string;
  estado?: string;
  prioridad?: string;
  totales: { totalPedido: number };
}

interface AlertasData {
  pendientesConfirmar: AlertaPedido[];
  entregasRetrasadas: AlertaPedido[];
  enProcesoLargoTiempo: AlertaPedido[];
  pendientesFacturar: AlertaPedido[];
}

interface PedidosAlertasProps {
  diasAlerta?: number;
  onRefresh?: () => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function PedidosAlertas({
  diasAlerta = 7,
  onRefresh,
  className,
  collapsible = true,
  defaultCollapsed = false,
}: PedidosAlertasProps) {
  const [alertas, setAlertas] = useState<AlertasData | null>(null);
  const [resumen, setResumen] = useState<{
    pendientesConfirmar: number;
    entregasRetrasadas: number;
    enProcesoLargoTiempo: number;
    pendientesFacturar: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [activeTab, setActiveTab] = useState('pendientes');

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const response = await pedidosService.getAlertas(diasAlerta);

      if (response.success && response.data) {
        setAlertas(response.data);
        // Calcular resumen desde los datos
        setResumen({
          pendientesConfirmar: response.data.pendientesConfirmar?.length || 0,
          entregasRetrasadas: response.data.entregasRetrasadas?.length || 0,
          enProcesoLargoTiempo: response.data.enProcesoLargoTiempo?.length || 0,
          pendientesFacturar: response.data.pendientesFacturar?.length || 0,
          total: (response.data.pendientesConfirmar?.length || 0) +
                 (response.data.entregasRetrasadas?.length || 0) +
                 (response.data.enProcesoLargoTiempo?.length || 0) +
                 (response.data.pendientesFacturar?.length || 0),
        });
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
    return { texto: `${dias} días para entrega`, clase: dias <= 3 ? 'text-yellow-600' : 'text-muted-foreground' };
  };

  const getDiasPedido = (fecha: string) => {
    const dias = differenceInDays(new Date(), new Date(fecha));
    return dias;
  };

  // Si no hay alertas, no mostrar nada
  if (!loading && resumen && resumen.total === 0) {
    return null;
  }

  const AlertaItem = ({ item, tipo }: { item: AlertaPedido; tipo: 'pendiente' | 'retrasado' | 'proximo' }) => {
    const diasInfo = item.fechaEntregaComprometida ? getDiasEntrega(item.fechaEntregaComprometida) : null;
    const diasPedido = getDiasPedido(item.fecha);

    return (
      <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/pedidos/${item._id}`}
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
            {diasInfo && (
              <span className={cn('text-xs font-medium', diasInfo.clase)}>
                {diasInfo.texto}
              </span>
            )}
            {tipo === 'pendiente' && (
              <span className="text-xs text-muted-foreground">
                Pedido hace {diasPedido} días
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm font-semibold whitespace-nowrap">
            {formatCurrency(item.totales?.totalPedido)}
          </span>
          <Link href={`/pedidos/${item._id}`}>
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
            {resumen && resumen.pendientesConfirmar > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.pendientesConfirmar}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="entregasRetrasadas" className="text-xs px-3 h-7 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Retrasados
            {resumen && resumen.entregasRetrasadas > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.entregasRetrasadas}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="proximos" className="text-xs px-3 h-7 gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            Próx. entrega
            {resumen && resumen.enProcesoLargoTiempo > 0 && (
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.enProcesoLargoTiempo}
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
            {alertas?.pendientesConfirmar && alertas.pendientesConfirmar.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.pendientesConfirmar.map((item) => (
                  <AlertaItem key={item._id} item={item} tipo="pendiente" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay pedidos pendientes de servir
              </div>
            )}
          </TabsContent>

          <TabsContent value="entregasRetrasadas" className="mt-0">
            {alertas?.entregasRetrasadas && alertas.entregasRetrasadas.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.entregasRetrasadas.map((item) => (
                  <AlertaItem key={item._id} item={item} tipo="retrasado" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay pedidos entregasRetrasadas
              </div>
            )}
          </TabsContent>

          <TabsContent value="proximos" className="mt-0">
            {alertas?.enProcesoLargoTiempo && alertas.enProcesoLargoTiempo.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.enProcesoLargoTiempo.map((item) => (
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
      <Card className={cn('border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            Alertas de pedidos
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
        'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50',
        !isOpen && 'cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-950/30'
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              Alertas de pedidos
              {resumen && resumen.total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {resumen.total} alertas
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                {!isOpen && resumen && (
                  <div className="flex items-center gap-2 text-xs">
                    {resumen.pendientesConfirmar > 0 && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Package className="h-3 w-3" />
                        {resumen.pendientesConfirmar}
                      </span>
                    )}
                    {resumen.entregasRetrasadas > 0 && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {resumen.entregasRetrasadas}
                      </span>
                    )}
                    {resumen.enProcesoLargoTiempo > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Truck className="h-3 w-3" />
                        {resumen.enProcesoLargoTiempo}
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

export default PedidosAlertas;
