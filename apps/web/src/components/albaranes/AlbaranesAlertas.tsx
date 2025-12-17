'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { albaranesService } from '@/services/albaranes.service';
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
  Receipt,
  RefreshCw,
  Truck,
  FileText,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AlertaAlbaran {
  _id: string;
  codigo: string;
  clienteNombre: string;
  fecha: string | Date;
  estado: string;
  facturado: boolean;
  totales: { totalAlbaran: number };
}

interface AlertasData {
  pendientesFacturar: AlertaAlbaran[];
  pendientesEntregar: AlertaAlbaran[];
  antiguosSinFacturar: AlertaAlbaran[];
}

interface AlbaranesAlertasProps {
  diasAlerta?: number;
  onRefresh?: () => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function AlbaranesAlertas({
  diasAlerta = 30,
  onRefresh,
  className,
  collapsible = true,
  defaultCollapsed = false,
}: AlbaranesAlertasProps) {
  const [alertas, setAlertas] = useState<AlertasData | null>(null);
  const [resumen, setResumen] = useState<{
    pendientesFacturar: number;
    pendientesEntregar: number;
    antiguosSinFacturar: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [activeTab, setActiveTab] = useState('facturar');

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const response = await albaranesService.getAlertas(diasAlerta);

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

  const getDiasAlbaran = (fecha: string | Date) => {
    const dias = differenceInDays(new Date(), new Date(fecha));
    if (dias > 30) return { texto: `Hace ${dias} días`, clase: 'text-red-600' };
    if (dias > 15) return { texto: `Hace ${dias} días`, clase: 'text-orange-600' };
    return { texto: `Hace ${dias} días`, clase: 'text-muted-foreground' };
  };

  // Si no hay alertas, no mostrar nada
  if (!loading && resumen && resumen.total === 0) {
    return null;
  }

  const AlertaItem = ({ item, tipo }: { item: AlertaAlbaran; tipo: 'facturar' | 'entregar' | 'antiguo' }) => {
    const diasInfo = getDiasAlbaran(item.fecha);

    return (
      <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/albaranes/${item._id}`}
              className="font-medium text-sm hover:text-primary hover:underline truncate"
            >
              {item.codigo}
            </Link>
            <Badge variant="outline" className="text-xs">
              {item.estado}
            </Badge>
            {!item.facturado && (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Sin facturar
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{item.clienteNombre}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn('text-xs font-medium', diasInfo.clase)}>
              {diasInfo.texto}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm font-semibold whitespace-nowrap">
            {formatCurrency(item.totales?.totalAlbaran)}
          </span>
          <Link href={`/albaranes/${item._id}`}>
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
          <TabsTrigger value="facturar" className="text-xs px-3 h-7 gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            Ptes. facturar
            {resumen && resumen.pendientesFacturar > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.pendientesFacturar}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="entregar" className="text-xs px-3 h-7 gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            Ptes. entregar
            {resumen && resumen.pendientesEntregar > 0 && (
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.pendientesEntregar}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="antiguos" className="text-xs px-3 h-7 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Antiguos
            {resumen && resumen.antiguosSinFacturar > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {resumen.antiguosSinFacturar}
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
          <TabsContent value="facturar" className="mt-0">
            {alertas?.pendientesFacturar && alertas.pendientesFacturar.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.pendientesFacturar.map((item) => (
                  <AlertaItem key={item._id} item={item} tipo="facturar" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay albaranes pendientes de facturar
              </div>
            )}
          </TabsContent>

          <TabsContent value="entregar" className="mt-0">
            {alertas?.pendientesEntregar && alertas.pendientesEntregar.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.pendientesEntregar.map((item) => (
                  <AlertaItem key={item._id} item={item} tipo="entregar" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay albaranes pendientes de entregar
              </div>
            )}
          </TabsContent>

          <TabsContent value="antiguos" className="mt-0">
            {alertas?.antiguosSinFacturar && alertas.antiguosSinFacturar.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {alertas.antiguosSinFacturar.map((item) => (
                  <AlertaItem key={item._id} item={item} tipo="antiguo" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hay albaranes antiguos sin facturar
              </div>
            )}
          </TabsContent>
        </>
      )}
    </Tabs>
  );

  if (!collapsible) {
    return (
      <Card className={cn('border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900/50', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-green-600" />
            Alertas de albaranes
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
        'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900/50',
        !isOpen && 'cursor-pointer hover:bg-green-100/50 dark:hover:bg-green-950/30'
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-green-600" />
              Alertas de albaranes
              {resumen && resumen.total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {resumen.total} alertas
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                {!isOpen && resumen && (
                  <div className="flex items-center gap-2 text-xs">
                    {resumen.pendientesFacturar > 0 && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Receipt className="h-3 w-3" />
                        {resumen.pendientesFacturar}
                      </span>
                    )}
                    {resumen.antiguosSinFacturar > 0 && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {resumen.antiguosSinFacturar}
                      </span>
                    )}
                    {resumen.pendientesEntregar > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Truck className="h-3 w-3" />
                        {resumen.pendientesEntregar}
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

export default AlbaranesAlertas;
