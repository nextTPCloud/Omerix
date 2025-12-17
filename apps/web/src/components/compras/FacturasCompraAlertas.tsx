'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { facturasCompraService } from '@/services/facturas-compra.service';
import { FacturaCompra } from '@/types/factura-compra.types';
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
  CreditCard,
  CalendarClock,
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface AlertasData {
  pendientesPago: FacturaCompra[];
  vencidas: FacturaCompra[];
  proximasVencer: FacturaCompra[];
}

interface FacturasCompraAlertasProps {
  diasAlerta?: number;
  onRefresh?: () => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function FacturasCompraAlertas({
  diasAlerta = 7,
  onRefresh,
  className,
  collapsible = true,
  defaultCollapsed = false,
}: FacturasCompraAlertasProps) {
  const [alertas, setAlertas] = useState<AlertasData | null>(null);
  const [resumen, setResumen] = useState<{
    pendientesPago: number;
    vencidas: number;
    proximasVencer: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [activeTab, setActiveTab] = useState('pendientes');

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const response = await facturasCompraService.getAlertas(diasAlerta);

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

  const getDiasVencimiento = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return null;
    const dias = differenceInDays(new Date(fechaVencimiento), new Date());
    if (dias < 0) return { texto: `Vencida hace ${Math.abs(dias)} días`, clase: 'text-red-600' };
    if (dias === 0) return { texto: 'Vence hoy', clase: 'text-orange-600' };
    if (dias === 1) return { texto: 'Vence mañana', clase: 'text-orange-600' };
    if (dias <= 3) return { texto: `Vence en ${dias} días`, clase: 'text-yellow-600' };
    return { texto: `Vence en ${dias} días`, clase: 'text-muted-foreground' };
  };

  // Si no hay alertas, no mostrar nada
  if (!loading && resumen && resumen.total === 0) {
    return null;
  }

  const AlertaItem = ({ item }: { item: FacturaCompra }) => {
    // Obtener la fecha del primer vencimiento pendiente
    const primerVencimientoPendiente = item.vencimientos?.find(v => !v.pagado);
    const fechaVencimiento = primerVencimientoPendiente?.fechaVencimiento;
    const diasInfo = getDiasVencimiento(fechaVencimiento);
    const importePendiente = item.totales?.totalPendiente || 0;

    return (
      <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/compras/facturas/${item._id}`}
              className="font-medium text-sm hover:text-primary hover:underline truncate"
            >
              {item.numeroFacturaProveedor || item.codigo}
            </Link>
            <Badge variant="outline" className="text-xs">
              {item.estado}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{item.proveedorNombre}</p>
          <div className="flex items-center gap-3 mt-1">
            {diasInfo && (
              <span className={cn('text-xs font-medium', diasInfo.clase)}>
                {diasInfo.texto}
              </span>
            )}
            {importePendiente > 0 && (
              <span className="text-xs text-muted-foreground">
                Pte: {formatCurrency(importePendiente)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm font-semibold whitespace-nowrap">
            {formatCurrency(item.totales?.totalFactura)}
          </span>
          <Link href={`/compras/facturas/${item._id}`}>
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
            <CreditCard className="h-3.5 w-3.5" />
            Ptes. pago
            {resumen && resumen.pendientesPago > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.pendientesPago}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vencidas" className="text-xs px-3 h-7 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Vencidas
            {resumen && resumen.vencidas > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.vencidas}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="proximas" className="text-xs px-3 h-7 gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Próx. vencer
            {resumen && resumen.proximasVencer > 0 && (
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.proximasVencer}
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
            {alertas?.pendientesPago && alertas.pendientesPago.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.pendientesPago.map((item) => (
                  <AlertaItem key={item._id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay facturas pendientes de pago
              </div>
            )}
          </TabsContent>

          <TabsContent value="vencidas" className="mt-0">
            {alertas?.vencidas && alertas.vencidas.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.vencidas.map((item) => (
                  <AlertaItem key={item._id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay facturas vencidas
              </div>
            )}
          </TabsContent>

          <TabsContent value="proximas" className="mt-0">
            {alertas?.proximasVencer && alertas.proximasVencer.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.proximasVencer.map((item) => (
                  <AlertaItem key={item._id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay facturas próximas a vencer
              </div>
            )}
          </TabsContent>
        </>
      )}
    </Tabs>
  );

  if (!collapsible) {
    return (
      <Card className={cn('border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/50', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            Alertas de facturas de compra
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
        'border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/50',
        !isOpen && 'cursor-pointer hover:bg-rose-100/50 dark:hover:bg-rose-950/30'
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              Alertas de facturas de compra
              {resumen && resumen.total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {resumen.total} alertas
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                {!isOpen && resumen && (
                  <div className="flex items-center gap-2 text-xs">
                    {resumen.vencidas > 0 && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {resumen.vencidas}
                      </span>
                    )}
                    {resumen.pendientesPago > 0 && (
                      <span className="flex items-center gap-1 text-rose-600">
                        <CreditCard className="h-3 w-3" />
                        {resumen.pendientesPago}
                      </span>
                    )}
                    {resumen.proximasVencer > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CalendarClock className="h-3 w-3" />
                        {resumen.proximasVencer}
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

export default FacturasCompraAlertas;
