'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Globe,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Send,
} from 'lucide-react';
import { portalService, PresupuestoPortal, EmpresaPortal } from '@/services/portal.service';

export default function PortalPresupuestoPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [presupuesto, setPresupuesto] = useState<PresupuestoPortal | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaPortal | null>(null);
  const [puedeResponder, setPuedeResponder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario de respuesta
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoRespuesta, setTipoRespuesta] = useState<'aceptar' | 'rechazar' | null>(null);
  const [nombreFirmante, setNombreFirmante] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [respuestaEnviada, setRespuestaEnviada] = useState(false);

  useEffect(() => {
    cargarPresupuesto();
  }, [token]);

  const cargarPresupuesto = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await portalService.obtenerPresupuesto(token);

      if (response.success && response.data) {
        setPresupuesto(response.data.presupuesto);
        setEmpresa(response.data.empresa);
        setPuedeResponder(response.data.puedeResponder);
      } else {
        setError(response.message || 'Presupuesto no encontrado');
      }
    } catch (err) {
      setError('Error al cargar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirDialog = (tipo: 'aceptar' | 'rechazar') => {
    setTipoRespuesta(tipo);
    setDialogOpen(true);
  };

  const handleEnviarRespuesta = async () => {
    if (!tipoRespuesta || !nombreFirmante.trim()) return;

    try {
      setEnviando(true);
      const response = await portalService.responderPresupuesto(token, {
        aceptado: tipoRespuesta === 'aceptar',
        comentarios: comentarios.trim() || undefined,
        nombreFirmante: nombreFirmante.trim(),
      });

      if (response.success) {
        setRespuestaEnviada(true);
        setDialogOpen(false);
        // Recargar para mostrar el estado actualizado
        await cargarPresupuesto();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error al enviar la respuesta');
    } finally {
      setEnviando(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      borrador: { label: 'Borrador', variant: 'secondary' },
      enviado: { label: 'Enviado', variant: 'default' },
      pendiente: { label: 'Pendiente', variant: 'outline' },
      aceptado: { label: 'Aceptado', variant: 'default' },
      rechazado: { label: 'Rechazado', variant: 'destructive' },
      caducado: { label: 'Caducado', variant: 'secondary' },
      convertido: { label: 'Convertido', variant: 'default' },
    };
    const config = estados[estado] || { label: estado, variant: 'outline' as const };
    return (
      <Badge
        variant={config.variant}
        className={
          estado === 'aceptado'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : estado === 'rechazado'
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            : ''
        }
      >
        {config.label}
      </Badge>
    );
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error && !presupuesto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Enlace no válido</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-4">
              El enlace puede haber caducado o el presupuesto ya no está disponible.
              Por favor, contacte con la empresa para solicitar un nuevo enlace.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!presupuesto || !empresa) return null;

  const diasRestantes = Math.ceil(
    (new Date(presupuesto.fechaValidez).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const estaVigente = diasRestantes > 0 && presupuesto.estado !== 'caducado';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con logo de empresa */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {empresa.logo ? (
                <img src={empresa.logo} alt={empresa.nombre} className="h-12 object-contain" />
              ) : (
                <Building2 className="h-10 w-10 text-primary" />
              )}
              <div>
                <h1 className="text-xl font-bold">{empresa.nombre}</h1>
                {empresa.nif && <p className="text-sm text-muted-foreground">{empresa.nif}</p>}
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {empresa.telefono && (
                <div className="flex items-center justify-end gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{empresa.telefono}</span>
                </div>
              )}
              {empresa.email && (
                <div className="flex items-center justify-end gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{empresa.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Respuesta enviada */}
        {respuestaEnviada && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Respuesta registrada correctamente
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {presupuesto.respuestaCliente?.aceptado
                      ? 'Gracias por aceptar el presupuesto. Nos pondremos en contacto pronto.'
                      : 'Hemos registrado su respuesta. Gracias por su tiempo.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información del presupuesto */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">Presupuesto {presupuesto.codigo}</CardTitle>
                  {getEstadoBadge(presupuesto.estado)}
                </div>
                {presupuesto.titulo && (
                  <CardDescription className="text-lg">{presupuesto.titulo}</CardDescription>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(presupuesto.totales.totalPresupuesto)}
                </p>
                <p className="text-sm text-muted-foreground">Total (IVA incl.)</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fechas y validez */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Fecha emisión</p>
                  <p className="font-medium">{formatDate(presupuesto.fecha)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Válido hasta</p>
                  <p className="font-medium">{formatDate(presupuesto.fechaValidez)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {estaVigente ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Estado validez</p>
                  <p className={`font-medium ${estaVigente ? 'text-green-600' : 'text-red-600'}`}>
                    {estaVigente ? `${diasRestantes} días restantes` : 'Caducado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Introducción */}
            {presupuesto.introduccion && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p>{presupuesto.introduccion}</p>
              </div>
            )}

            {/* Tabla de líneas */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50%]">Descripción</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Dto.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presupuesto.lineas.map((linea, index) => (
                    <TableRow key={linea._id || index}>
                      <TableCell>
                        <p className="font-medium">{linea.nombre}</p>
                        {linea.descripcion && (
                          <p className="text-sm text-muted-foreground">{linea.descripcion}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {linea.cantidad} {linea.unidad || 'ud'}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(linea.precioUnitario)}</TableCell>
                      <TableCell className="text-center">
                        {linea.descuento > 0 ? `${linea.descuento}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(linea.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totales */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(presupuesto.totales.subtotalNeto)}</span>
                </div>
                {presupuesto.totales.desgloseIva.map((iva) => (
                  <div key={iva.tipo} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA {iva.tipo}%</span>
                    <span>{formatCurrency(iva.cuota)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(presupuesto.totales.totalPresupuesto)}</span>
                </div>
              </div>
            </div>

            {/* Pie de página y condiciones */}
            {presupuesto.piePagina && (
              <>
                <Separator />
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p>{presupuesto.piePagina}</p>
                </div>
              </>
            )}

            {presupuesto.condicionesLegales && (
              <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
                {presupuesto.condicionesLegales}
              </div>
            )}
          </CardContent>

          {/* Botones de acción */}
          {puedeResponder && !presupuesto.respuestaCliente && (
            <CardFooter className="flex flex-col sm:flex-row gap-3 bg-muted/30 border-t">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={() => handleAbrirDialog('aceptar')}
              >
                <ThumbsUp className="mr-2 h-5 w-5" />
                Aceptar presupuesto
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                size="lg"
                onClick={() => handleAbrirDialog('rechazar')}
              >
                <ThumbsDown className="mr-2 h-5 w-5" />
                Rechazar
              </Button>
            </CardFooter>
          )}

          {/* Ya respondido */}
          {presupuesto.respuestaCliente && (
            <CardFooter className="bg-muted/30 border-t">
              <div className="w-full text-center">
                <Badge
                  variant={presupuesto.respuestaCliente.aceptado ? 'default' : 'destructive'}
                  className="text-sm px-4 py-1"
                >
                  {presupuesto.respuestaCliente.aceptado ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Presupuesto aceptado el {formatDate(presupuesto.respuestaCliente.fecha)}
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Presupuesto rechazado el {formatDate(presupuesto.respuestaCliente.fecha)}
                    </>
                  )}
                </Badge>
                {presupuesto.respuestaCliente.nombreFirmante && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Por: {presupuesto.respuestaCliente.nombreFirmante}
                  </p>
                )}
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {empresa.telefono && (
                <a href={`tel:${empresa.telefono}`} className="flex items-center gap-2 hover:text-primary">
                  <Phone className="h-4 w-4" />
                  {empresa.telefono}
                </a>
              )}
              {empresa.email && (
                <a href={`mailto:${empresa.email}`} className="flex items-center gap-2 hover:text-primary">
                  <Mail className="h-4 w-4" />
                  {empresa.email}
                </a>
              )}
              {empresa.web && (
                <a href={empresa.web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
                  <Globe className="h-4 w-4" />
                  {empresa.web}
                </a>
              )}
            </div>
            {empresa.direccion && (
              <div className="flex items-start gap-2 mt-4 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>
                  {empresa.direccion.calle}, {empresa.direccion.codigoPostal} {empresa.direccion.ciudad}
                  {empresa.direccion.provincia && `, ${empresa.direccion.provincia}`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Diálogo de confirmación */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tipoRespuesta === 'aceptar' ? (
                <>
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  Aceptar presupuesto
                </>
              ) : (
                <>
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                  Rechazar presupuesto
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {tipoRespuesta === 'aceptar'
                ? 'Al aceptar este presupuesto, confirma su conformidad con las condiciones presentadas.'
                : 'Puede indicar el motivo del rechazo para que podamos mejorar nuestra propuesta.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombreFirmante">Su nombre *</Label>
              <Input
                id="nombreFirmante"
                placeholder="Nombre completo"
                value={nombreFirmante}
                onChange={(e) => setNombreFirmante(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comentarios">Comentarios (opcional)</Label>
              <Textarea
                id="comentarios"
                placeholder={
                  tipoRespuesta === 'aceptar'
                    ? 'Puede añadir observaciones o solicitudes especiales...'
                    : 'Indique el motivo del rechazo o sugerencias...'
                }
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEnviarRespuesta}
              disabled={!nombreFirmante.trim() || enviando}
              className={
                tipoRespuesta === 'aceptar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }
            >
              {enviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
