'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  User,
  Calendar,
  Loader2,
  Play,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import presupuestosService from '@/services/presupuestos.service';

interface RecordatoriosPendientes {
  proximosExpirar: number;
  sinRespuesta: number;
  totalPendientes: number;
}

interface ResultadoRecordatorios {
  expiracion: Array<{ presupuestoId: string; codigo: string; success: boolean; message: string }>;
  seguimiento: Array<{ presupuestoId: string; codigo: string; success: boolean; message: string }>;
  agentes: Array<{ presupuestoId: string; codigo: string; success: boolean; message: string }>;
  resumen: {
    total: number;
    enviados: number;
    fallidos: number;
  };
}

export function RecordatoriosWidget() {
  const [pendientes, setPendientes] = useState<RecordatoriosPendientes | null>(null);
  const [loading, setLoading] = useState(true);
  const [ejecutando, setEjecutando] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [resultado, setResultado] = useState<ResultadoRecordatorios | null>(null);

  // Opciones de ejecución
  const [opciones, setOpciones] = useState({
    enviarExpiracion: true,
    enviarSeguimiento: true,
    notificarAgentes: true,
  });

  useEffect(() => {
    cargarPendientes();
  }, []);

  const cargarPendientes = async () => {
    try {
      setLoading(true);
      const response = await presupuestosService.getRecordatoriosPendientes();
      if (response.success && response.data) {
        setPendientes(response.data);
      }
    } catch (error) {
      console.error('Error al cargar pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const ejecutarRecordatorios = async () => {
    try {
      setEjecutando(true);
      const response = await presupuestosService.ejecutarRecordatorios(opciones);

      if (response.success && response.data) {
        setResultado(response.data);
        toast.success(`${response.data.resumen.enviados} recordatorios enviados correctamente`);
        cargarPendientes();
      } else {
        toast.error(response.message || 'Error al ejecutar recordatorios');
      }
    } catch (error) {
      console.error('Error al ejecutar recordatorios:', error);
      toast.error('Error al ejecutar recordatorios');
    } finally {
      setEjecutando(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Recordatorios</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarPendientes}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>
            Envía recordatorios automáticos a clientes y agentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendientes && pendientes.totalPendientes > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium">{pendientes.proximosExpirar}</p>
                    <p className="text-xs text-muted-foreground">Por expirar</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{pendientes.sinRespuesta}</p>
                    <p className="text-xs text-muted-foreground">Sin respuesta</p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setShowDialog(true)}
                disabled={ejecutando}
              >
                {ejecutando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar recordatorios ({pendientes.totalPendientes})
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">No hay recordatorios pendientes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Enviar recordatorios
            </DialogTitle>
            <DialogDescription>
              Configura qué tipos de recordatorios quieres enviar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <Label htmlFor="expiracion">Próximos a expirar</Label>
              </div>
              <Switch
                id="expiracion"
                checked={opciones.enviarExpiracion}
                onCheckedChange={(checked) =>
                  setOpciones((prev) => ({ ...prev, enviarExpiracion: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <Label htmlFor="seguimiento">Sin respuesta</Label>
              </div>
              <Switch
                id="seguimiento"
                checked={opciones.enviarSeguimiento}
                onCheckedChange={(checked) =>
                  setOpciones((prev) => ({ ...prev, enviarSeguimiento: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                <Label htmlFor="agentes">Notificar a agentes</Label>
              </div>
              <Switch
                id="agentes"
                checked={opciones.notificarAgentes}
                onCheckedChange={(checked) =>
                  setOpciones((prev) => ({ ...prev, notificarAgentes: checked }))
                }
              />
            </div>
          </div>

          {resultado && (
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">Resultado del último envío:</p>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  {resultado.resumen.enviados} enviados
                </span>
                {resultado.resumen.fallidos > 0 && (
                  <span className="text-red-600">
                    <XCircle className="h-4 w-4 inline mr-1" />
                    {resultado.resumen.fallidos} fallidos
                  </span>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={ejecutarRecordatorios}
              disabled={ejecutando || (!opciones.enviarExpiracion && !opciones.enviarSeguimiento)}
            >
              {ejecutando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Ejecutar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Componente para mostrar historial de recordatorios de un presupuesto
interface HistorialRecordatoriosProps {
  presupuestoId: string;
}

interface RecordatorioHistorial {
  _id: string;
  fecha: string;
  tipo: 'expiracion' | 'seguimiento' | 'sin_respuesta';
  destinatario: string;
  enviado: boolean;
  error?: string;
  messageId?: string;
}

export function HistorialRecordatorios({ presupuestoId }: HistorialRecordatoriosProps) {
  const [historial, setHistorial] = useState<RecordatorioHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState<string | null>(null);

  useEffect(() => {
    cargarHistorial();
  }, [presupuestoId]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await presupuestosService.getHistorialRecordatorios(presupuestoId);
      if (response.success && response.data) {
        setHistorial(response.data);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const enviarRecordatorio = async (tipo: 'expiracion' | 'seguimiento') => {
    try {
      setEnviando(tipo);
      const response = await presupuestosService.enviarRecordatorioManual(presupuestoId, tipo);

      if (response.success && response.data?.success) {
        toast.success('Recordatorio enviado correctamente');
        cargarHistorial();
      } else {
        toast.error(response.data?.message || 'Error al enviar recordatorio');
      }
    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
      toast.error('Error al enviar recordatorio');
    } finally {
      setEnviando(null);
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'expiracion':
        return { label: 'Expiración', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' };
      case 'seguimiento':
      case 'sin_respuesta':
        return { label: 'Seguimiento', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
      default:
        return { label: tipo, color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Recordatorios
        </h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => enviarRecordatorio('expiracion')}
            disabled={enviando !== null}
          >
            {enviando === 'expiracion' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Clock className="mr-1 h-3 w-3" />
                Expiración
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => enviarRecordatorio('seguimiento')}
            disabled={enviando !== null}
          >
            {enviando === 'seguimiento' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Mail className="mr-1 h-3 w-3" />
                Seguimiento
              </>
            )}
          </Button>
        </div>
      </div>

      {historial.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No se han enviado recordatorios
        </p>
      ) : (
        <div className="space-y-2">
          {historial.map((r) => {
            const tipoInfo = getTipoLabel(r.tipo);
            return (
              <div
                key={r._id}
                className="flex items-center justify-between p-2 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  {r.enviado ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={tipoInfo.color}>
                        {tipoInfo.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(r.fecha), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.destinatario}
                    </p>
                  </div>
                </div>
                {r.error && (
                  <span className="text-xs text-red-500" title={r.error}>
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecordatoriosWidget;
