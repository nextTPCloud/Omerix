'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Link2,
  Copy,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import presupuestosService from '@/services/presupuestos.service';

interface EnlacePortalPresupuestoProps {
  presupuestoId: string;
  urlPortal?: string;
  tokenExpirado?: boolean;
  respuestaCliente?: {
    fecha: string;
    aceptado: boolean;
    comentarios?: string;
    nombreFirmante?: string;
  };
  clienteEmail?: string;
  onEnlaceGenerado?: () => void;
}

export function EnlacePortalPresupuesto({
  presupuestoId,
  urlPortal,
  tokenExpirado,
  respuestaCliente,
  clienteEmail,
  onEnlaceGenerado,
}: EnlacePortalPresupuestoProps) {
  const [loading, setLoading] = useState(false);
  const [enlace, setEnlace] = useState(urlPortal || '');
  const [copiado, setCopiado] = useState(false);
  const [dialogEnviarOpen, setDialogEnviarOpen] = useState(false);

  const generarEnlace = async () => {
    try {
      setLoading(true);
      const response = await presupuestosService.generarEnlacePortal(presupuestoId);

      if (response.success && response.data) {
        setEnlace(response.data.url);
        toast.success('Enlace generado correctamente');
        onEnlaceGenerado?.();
      } else {
        toast.error(response.message || 'Error al generar enlace');
      }
    } catch (error) {
      console.error('Error al generar enlace:', error);
      toast.error('Error al generar el enlace del portal');
    } finally {
      setLoading(false);
    }
  };

  const regenerarEnlace = async () => {
    try {
      setLoading(true);
      const response = await presupuestosService.regenerarTokenPortal(presupuestoId);

      if (response.success && response.data) {
        setEnlace(response.data.url);
        toast.success('Enlace regenerado. El anterior ya no es válido.');
        onEnlaceGenerado?.();
      } else {
        toast.error(response.message || 'Error al regenerar enlace');
      }
    } catch (error) {
      console.error('Error al regenerar enlace:', error);
      toast.error('Error al regenerar el enlace');
    } finally {
      setLoading(false);
    }
  };

  const copiarEnlace = () => {
    navigator.clipboard.writeText(enlace);
    setCopiado(true);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setCopiado(false), 2000);
  };

  const abrirEnlace = () => {
    window.open(enlace, '_blank');
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Portal del Cliente
            </CardTitle>
            <CardDescription>
              Comparte un enlace para que el cliente vea y acepte el presupuesto
            </CardDescription>
          </div>
          {respuestaCliente && (
            <Badge
              variant={respuestaCliente.aceptado ? 'default' : 'destructive'}
              className={
                respuestaCliente.aceptado
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }
            >
              {respuestaCliente.aceptado ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Aceptado
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-3 w-3" />
                  Rechazado
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Respuesta del cliente */}
        {respuestaCliente && (
          <div
            className={`p-3 rounded-lg ${
              respuestaCliente.aceptado
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <p className="text-sm font-medium">
              {respuestaCliente.aceptado
                ? 'El cliente ha aceptado este presupuesto'
                : 'El cliente ha rechazado este presupuesto'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(respuestaCliente.fecha)}
              {respuestaCliente.nombreFirmante && ` por ${respuestaCliente.nombreFirmante}`}
            </p>
            {respuestaCliente.comentarios && (
              <p className="text-sm mt-2 italic">&ldquo;{respuestaCliente.comentarios}&rdquo;</p>
            )}
          </div>
        )}

        {/* Enlace existente */}
        {enlace && !tokenExpirado ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={enlace} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={copiarEnlace}
                title="Copiar enlace"
              >
                {copiado ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={abrirEnlace} title="Abrir enlace">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={regenerarEnlace}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerar enlace
              </Button>
              {clienteEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogEnviarOpen(true)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar por email
                </Button>
              )}
            </div>
          </div>
        ) : tokenExpirado ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">El enlace anterior ha expirado o fue invalidado</span>
            </div>
            <Button onClick={generarEnlace} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generar nuevo enlace
            </Button>
          </div>
        ) : (
          <Button onClick={generarEnlace} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Generar enlace del portal
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          El cliente podrá ver el presupuesto y aceptarlo o rechazarlo directamente desde este enlace.
        </p>
      </CardContent>

      {/* Diálogo enviar por email (placeholder) */}
      <Dialog open={dialogEnviarOpen} onOpenChange={setDialogEnviarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar enlace por email</DialogTitle>
            <DialogDescription>
              Se enviará el enlace del portal al cliente
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              <strong>Destinatario:</strong> {clienteEmail}
            </p>
            <p className="text-sm mt-2 text-muted-foreground">
              El cliente recibirá un email con el enlace para ver y aceptar el presupuesto.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEnviarOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast.info('Función de envío por email en desarrollo');
                setDialogEnviarOpen(false);
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default EnlacePortalPresupuesto;
