'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  planificacionService,
  Planificacion,
  EstadoPlanificacion,
  TipoPlanificacion,
  AsignacionJornada,
} from '@/services/planificacion.service'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  Clock,
  RefreshCw,
  Copy,
  Send,
  Lock,
  FileText,
  AlertTriangle,
  User,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ============================================
// CONSTANTES
// ============================================

const DIAS_SEMANA = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const DIAS_SEMANA_COMPLETO = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

// ============================================
// HELPERS
// ============================================

function getInicioSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatearFecha(fecha: Date): string {
  return fecha.toISOString().split('T')[0];
}

function parseHora(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function calcularHoras(horaInicio: string, horaFin: string): number {
  let inicio = parseHora(horaInicio);
  let fin = parseHora(horaFin);
  if (fin < inicio) fin += 24 * 60;
  return (fin - inicio) / 60;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function PlanificacionPage() {
  const router = useRouter()

  // Estados
  const [planificacion, setPlanificacion] = useState<Planificacion | null>(null)
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([])
  const [personal, setPersonal] = useState<any[]>([])
  const [turnos, setTurnos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Navegacion de semana
  const [semanaActual, setSemanaActual] = useState(getInicioSemana(new Date()))

  // Dialogs
  const [showNuevaPlanificacion, setShowNuevaPlanificacion] = useState(false)
  const [showAsignacion, setShowAsignacion] = useState(false)
  const [asignacionData, setAsignacionData] = useState<{
    fecha: string;
    personalId: string;
    turnoId?: string;
    horaInicio: string;
    horaFin: string;
    notas?: string;
  }>({
    fecha: '',
    personalId: '',
    horaInicio: '09:00',
    horaFin: '17:00',
    notas: '',
  })

  const [nuevaPlanData, setNuevaPlanData] = useState({
    codigo: '',
    nombre: '',
    tipo: TipoPlanificacion.SEMANAL,
    fechaInicio: '',
    fechaFin: '',
    descripcion: '',
  })
  const [loadingCodigo, setLoadingCodigo] = useState(false)

  // ============================================
  // CARGAR DATOS
  // ============================================

  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true);

      // Cargar planificaciones del periodo
      const fechaInicio = formatearFecha(semanaActual);
      const fechaFin = formatearFecha(new Date(semanaActual.getTime() + 6 * 24 * 60 * 60 * 1000));

      const [planRes, personalRes, turnosRes] = await Promise.all([
        planificacionService.listar({
          fechaDesde: fechaInicio,
          fechaHasta: fechaFin,
          limit: 10,
        }),
        api.get('/personal', { params: { limit: 100, activo: true } }),
        api.get('/turnos').catch(() => ({ data: { data: [] } })),
      ]);

      setPlanificaciones(planRes.data);
      setPersonal(personalRes.data.data || []);
      setTurnos(turnosRes.data.data || []);

      // Si hay una planificacion para esta semana, seleccionarla
      if (planRes.data.length > 0) {
        setPlanificacion(planRes.data[0]);
      } else {
        setPlanificacion(null);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  }, [semanaActual]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ============================================
  // NAVEGACION SEMANAS
  // ============================================

  const irSemanaAnterior = () => {
    setSemanaActual(new Date(semanaActual.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const irSemanaSiguiente = () => {
    setSemanaActual(new Date(semanaActual.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const irSemanaActual = () => {
    setSemanaActual(getInicioSemana(new Date()));
  };

  // ============================================
  // FECHAS DE LA SEMANA
  // ============================================

  const fechasSemana = useMemo(() => {
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(semanaActual.getTime() + i * 24 * 60 * 60 * 1000);
      fechas.push({
        date: fecha,
        dateStr: formatearFecha(fecha),
        dia: DIAS_SEMANA[i],
        diaCompleto: DIAS_SEMANA_COMPLETO[i],
        numero: fecha.getDate(),
        esHoy: formatearFecha(fecha) === formatearFecha(new Date()),
      });
    }
    return fechas;
  }, [semanaActual]);

  // ============================================
  // ASIGNACIONES POR DIA Y PERSONAL
  // ============================================

  const asignacionesPorDiaYPersonal = useMemo(() => {
    if (!planificacion) return new Map();

    const map = new Map<string, AsignacionJornada>();
    planificacion.asignaciones.forEach(a => {
      const fechaStr = new Date(a.fecha).toISOString().split('T')[0];
      const key = `${fechaStr}-${a.personalId}`;
      map.set(key, a);
    });
    return map;
  }, [planificacion]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSugerirCodigo = async () => {
    try {
      setLoadingCodigo(true);
      const response = await planificacionService.sugerirCodigo();
      if (response.success && response.data?.codigo) {
        setNuevaPlanData(prev => ({ ...prev, codigo: response.data.codigo }));
      }
    } catch (error: any) {
      toast.error('Error al sugerir código');
    } finally {
      setLoadingCodigo(false);
    }
  };

  const handleCrearPlanificacion = async () => {
    if (!nuevaPlanData.nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      const fechaInicio = formatearFecha(semanaActual);
      const fechaFin = formatearFecha(new Date(semanaActual.getTime() + 6 * 24 * 60 * 60 * 1000));

      const response = await planificacionService.crear({
        codigo: nuevaPlanData.codigo || undefined,
        nombre: nuevaPlanData.nombre || `Semana ${fechaInicio}`,
        tipo: nuevaPlanData.tipo,
        fechaInicio: nuevaPlanData.fechaInicio || fechaInicio,
        fechaFin: nuevaPlanData.fechaFin || fechaFin,
        descripcion: nuevaPlanData.descripcion,
      });

      if (response.success) {
        setPlanificacion(response.data);
        setShowNuevaPlanificacion(false);
        setNuevaPlanData({ codigo: '', nombre: '', tipo: TipoPlanificacion.SEMANAL, fechaInicio: '', fechaFin: '', descripcion: '' });
        toast.success('Planificacion creada');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear');
    }
  };

  const handleAbrirAsignacion = (fechaStr: string, personalId: string) => {
    const existente = asignacionesPorDiaYPersonal.get(`${fechaStr}-${personalId}`);
    const empleado = personal.find(p => p._id === personalId);
    const turnoDefault = turnos.length > 0 ? turnos[0] : null;

    if (existente) {
      setAsignacionData({
        fecha: fechaStr,
        personalId,
        turnoId: existente.turnoId,
        horaInicio: existente.horaInicio,
        horaFin: existente.horaFin,
        notas: existente.notas,
      });
    } else {
      setAsignacionData({
        fecha: fechaStr,
        personalId,
        turnoId: turnoDefault?._id,
        horaInicio: turnoDefault?.horaInicio || '09:00',
        horaFin: turnoDefault?.horaFin || '17:00',
        notas: '',
      });
    }

    setShowAsignacion(true);
  };

  const handleGuardarAsignacion = async () => {
    if (!planificacion) return;

    try {
      const empleado = personal.find(p => p._id === asignacionData.personalId);
      const turno = turnos.find(t => t._id === asignacionData.turnoId);

      const existente = asignacionesPorDiaYPersonal.get(
        `${asignacionData.fecha}-${asignacionData.personalId}`
      );

      if (existente) {
        // Actualizar existente
        const response = await planificacionService.actualizarAsignacion(
          planificacion._id,
          existente._id!,
          {
            horaInicio: asignacionData.horaInicio,
            horaFin: asignacionData.horaFin,
            turnoId: asignacionData.turnoId,
            turnoNombre: turno?.nombre,
            notas: asignacionData.notas,
          }
        );
        setPlanificacion(response.data);
      } else {
        // Crear nueva
        const response = await planificacionService.agregarAsignaciones(
          planificacion._id,
          [{
            fecha: asignacionData.fecha,
            personalId: asignacionData.personalId,
            personalNombre: empleado ? `${empleado.nombre} ${empleado.apellidos || ''}`.trim() : '',
            turnoId: asignacionData.turnoId,
            turnoNombre: turno?.nombre,
            horaInicio: asignacionData.horaInicio,
            horaFin: asignacionData.horaFin,
            horasPlanificadas: calcularHoras(asignacionData.horaInicio, asignacionData.horaFin),
            notas: asignacionData.notas,
          }]
        );
        setPlanificacion(response.data);
      }

      setShowAsignacion(false);
      toast.success('Asignacion guardada');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  const handleEliminarAsignacion = async () => {
    if (!planificacion) return;

    const existente = asignacionesPorDiaYPersonal.get(
      `${asignacionData.fecha}-${asignacionData.personalId}`
    );

    if (!existente) return;

    try {
      const response = await planificacionService.eliminarAsignacion(
        planificacion._id,
        existente._id!
      );
      setPlanificacion(response.data);
      setShowAsignacion(false);
      toast.success('Asignacion eliminada');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const handlePublicar = async () => {
    if (!planificacion) return;

    try {
      const response = await planificacionService.cambiarEstado(
        planificacion._id,
        { estado: EstadoPlanificacion.PUBLICADA }
      );
      setPlanificacion(response.data);
      toast.success('Planificacion publicada');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al publicar');
    }
  };

  const handleTurnoChange = (turnoId: string) => {
    const turno = turnos.find(t => t._id === turnoId);
    if (turno) {
      setAsignacionData({
        ...asignacionData,
        turnoId,
        horaInicio: turno.horaInicio || '09:00',
        horaFin: turno.horaFin || '17:00',
      });
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const formatMesAno = useMemo(() => {
    const mes = semanaActual.toLocaleDateString('es-ES', { month: 'long' });
    const ano = semanaActual.getFullYear();
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${ano}`;
  }, [semanaActual]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Planificacion de Jornadas</h1>
            <p className="text-muted-foreground">
              Organiza los horarios del personal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => cargarDatos()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            {!planificacion ? (
              <Button onClick={() => setShowNuevaPlanificacion(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Planificacion
              </Button>
            ) : planificacion.estado === EstadoPlanificacion.BORRADOR && (
              <Button onClick={handlePublicar} className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            )}
          </div>
        </div>

        {/* Navegacion de semana */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={irSemanaAnterior}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center min-w-[200px]">
                  <h2 className="text-lg font-semibold">{formatMesAno}</h2>
                  <p className="text-sm text-muted-foreground">
                    {fechasSemana[0].numero} - {fechasSemana[6].numero}
                  </p>
                </div>
                <Button variant="outline" size="icon" onClick={irSemanaSiguiente}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={irSemanaActual}>
                  Hoy
                </Button>
              </div>

              {planificacion && (
                <div className="flex items-center gap-4">
                  <Badge className={cn(planificacionService.getEstadoColor(planificacion.estado))}>
                    {planificacion.estado === EstadoPlanificacion.BORRADOR && <FileText className="h-3 w-3 mr-1" />}
                    {planificacion.estado === EstadoPlanificacion.PUBLICADA && <Send className="h-3 w-3 mr-1" />}
                    {planificacion.estado === EstadoPlanificacion.CERRADA && <Lock className="h-3 w-3 mr-1" />}
                    {planificacionService.getEstadoLabel(planificacion.estado)}
                  </Badge>
                  <div className="text-right text-sm">
                    <p className="font-medium">{planificacion.resumen?.totalHorasPlanificadas || 0}h planificadas</p>
                    <p className="text-muted-foreground">
                      {planificacion.resumen?.totalEmpleadosPlanificados || 0} empleados
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendario semanal */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left w-40 border-r sticky left-0 bg-muted/50 z-10">
                      Personal
                    </th>
                    {fechasSemana.map((fecha) => (
                      <th
                        key={fecha.dateStr}
                        className={cn(
                          'p-3 text-center min-w-[120px] border-r last:border-r-0',
                          fecha.esHoy && 'bg-blue-50 dark:bg-blue-950'
                        )}
                      >
                        <div className="font-semibold">{fecha.dia}</div>
                        <div className={cn(
                          'text-2xl font-bold',
                          fecha.esHoy && 'text-blue-600'
                        )}>
                          {fecha.numero}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {personal.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay personal configurado</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => router.push('/personal/nuevo')}
                        >
                          Agregar personal
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    personal.map((empleado) => (
                      <tr key={empleado._id} className="border-b hover:bg-muted/30">
                        <td className="p-3 border-r sticky left-0 bg-white dark:bg-background z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {empleado.nombre} {empleado.apellidos?.split(' ')[0]}
                              </p>
                              {empleado.cargo && (
                                <p className="text-xs text-muted-foreground">{empleado.cargo}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {fechasSemana.map((fecha) => {
                          const key = `${fecha.dateStr}-${empleado._id}`;
                          const asignacion = asignacionesPorDiaYPersonal.get(key);

                          return (
                            <td
                              key={fecha.dateStr}
                              className={cn(
                                'p-1 border-r last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors',
                                fecha.esHoy && 'bg-blue-50/50 dark:bg-blue-950/30',
                                !planificacion && 'opacity-50 cursor-not-allowed'
                              )}
                              onClick={() => planificacion && handleAbrirAsignacion(fecha.dateStr, empleado._id)}
                            >
                              {asignacion ? (
                                <div className={cn(
                                  'p-2 rounded text-xs space-y-1',
                                  asignacion.esAusencia
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : 'bg-green-100 dark:bg-green-900/30',
                                  asignacion.color && `bg-${asignacion.color}-100`
                                )}>
                                  <div className="font-medium">
                                    {asignacion.horaInicio} - {asignacion.horaFin}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {asignacion.horasPlanificadas}h
                                    {asignacion.turnoNombre && ` · ${asignacion.turnoNombre}`}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-16 flex items-center justify-center">
                                  {planificacion && (
                                    <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
                {planificacion && planificacion.resumen && (
                  <tfoot>
                    <tr className="bg-muted/50 font-medium">
                      <td className="p-3 border-r sticky left-0 bg-muted/50">
                        Total
                      </td>
                      {fechasSemana.map((fecha) => {
                        const diaResumen = planificacion.resumen?.horasPorDia.find(
                          d => d.fecha === fecha.dateStr
                        );
                        return (
                          <td key={fecha.dateStr} className="p-3 text-center border-r last:border-r-0">
                            <div className="text-sm">
                              {diaResumen?.horas || 0}h
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {diaResumen?.empleados || 0} emp.
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {!planificacion && (
              <div className="p-8 text-center border-t">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  No hay planificacion para esta semana
                </p>
                <Button onClick={() => setShowNuevaPlanificacion(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Planificacion
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog nueva planificacion */}
        <Dialog open={showNuevaPlanificacion} onOpenChange={setShowNuevaPlanificacion}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Planificacion</DialogTitle>
              <DialogDescription>
                Crea una nueva planificacion para la semana seleccionada
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Codigo</Label>
                <div className="flex gap-2">
                  <Input
                    value={nuevaPlanData.codigo}
                    onChange={(e) => setNuevaPlanData({ ...nuevaPlanData, codigo: e.target.value })}
                    placeholder="Se genera automaticamente si se deja vacio"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleSugerirCodigo}
                    disabled={loadingCodigo}
                    title="Sugerir proximo codigo"
                  >
                    {loadingCodigo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={nuevaPlanData.nombre}
                  onChange={(e) => setNuevaPlanData({ ...nuevaPlanData, nombre: e.target.value })}
                  placeholder={`Semana ${formatearFecha(semanaActual)}`}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={nuevaPlanData.tipo}
                  onValueChange={(value) => setNuevaPlanData({ ...nuevaPlanData, tipo: value as TipoPlanificacion })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TipoPlanificacion.SEMANAL}>Semanal</SelectItem>
                    <SelectItem value={TipoPlanificacion.MENSUAL}>Mensual</SelectItem>
                    <SelectItem value={TipoPlanificacion.PERSONALIZADA}>Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descripcion</Label>
                <Textarea
                  value={nuevaPlanData.descripcion}
                  onChange={(e) => setNuevaPlanData({ ...nuevaPlanData, descripcion: e.target.value })}
                  placeholder="Notas opcionales..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNuevaPlanificacion(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearPlanificacion}>
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog asignacion */}
        <Dialog open={showAsignacion} onOpenChange={setShowAsignacion}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Jornada</DialogTitle>
              <DialogDescription>
                {personal.find(p => p._id === asignacionData.personalId)?.nombre} -{' '}
                {new Date(asignacionData.fecha).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {turnos.length > 0 && (
                <div className="space-y-2">
                  <Label>Turno</Label>
                  <Select
                    value={asignacionData.turnoId || 'none'}
                    onValueChange={(value) => value !== 'none' && handleTurnoChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar turno..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin turno</SelectItem>
                      {turnos.map((turno) => (
                        <SelectItem key={turno._id} value={turno._id}>
                          {turno.nombre} ({turno.horaInicio} - {turno.horaFin})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora Inicio</Label>
                  <Input
                    type="time"
                    value={asignacionData.horaInicio}
                    onChange={(e) => setAsignacionData({ ...asignacionData, horaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Fin</Label>
                  <Input
                    type="time"
                    value={asignacionData.horaFin}
                    onChange={(e) => setAsignacionData({ ...asignacionData, horaFin: e.target.value })}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Horas: {calcularHoras(asignacionData.horaInicio, asignacionData.horaFin).toFixed(1)}h
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input
                  value={asignacionData.notas}
                  onChange={(e) => setAsignacionData({ ...asignacionData, notas: e.target.value })}
                  placeholder="Notas opcionales..."
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              {asignacionesPorDiaYPersonal.has(`${asignacionData.fecha}-${asignacionData.personalId}`) && (
                <Button variant="destructive" onClick={handleEliminarAsignacion}>
                  Eliminar
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAsignacion(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGuardarAsignacion}>
                  Guardar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
