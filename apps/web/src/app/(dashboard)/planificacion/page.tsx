'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'

import {
  planificacionService,
  Planificacion,
  EstadoPlanificacion,
  TipoPlanificacion,
  AsignacionJornada,
  VistaCompletaSemana,
  EmpleadoVista,
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
import { Switch } from '@/components/ui/switch'
import { SearchableSelect } from '@/components/ui/searchable-select'
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
  Wrench,
  CheckSquare,
  MapPin,
  Briefcase,
  LayoutGrid,
  GanttChart,
  Printer,
  Download,
  Share2,
  Mail,
  MessageCircle,
  Clipboard,
} from 'lucide-react'
import { TimelineView } from '@/components/planificacion'
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
  // Vista completa con partes de trabajo y tareas
  const [vistaCompleta, setVistaCompleta] = useState<VistaCompletaSemana | null>(null)
  // Tipo de vista: tabla o timeline
  const [tipoVista, setTipoVista] = useState<'tabla' | 'timeline'>('tabla')

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

  // Dialog compartir
  const [showCompartir, setShowCompartir] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [mensajeEmail, setMensajeEmail] = useState('')

  // Dialog imprimir
  const [showImprimir, setShowImprimir] = useState(false)
  const [opcionesImpresion, setOpcionesImpresion] = useState({
    mostrarHoras: true,
    mostrarPartes: true,
    mostrarTareas: true,
    formato: 'horizontal' as 'horizontal' | 'vertical',
  })

  // ============================================
  // CARGAR DATOS
  // ============================================

  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true);

      // Cargar planificaciones del periodo
      const fechaInicio = formatearFecha(semanaActual);
      const fechaFin = formatearFecha(new Date(semanaActual.getTime() + 6 * 24 * 60 * 60 * 1000));

      const [planRes, personalRes, turnosRes, vistaRes] = await Promise.all([
        planificacionService.listar({
          fechaDesde: fechaInicio,
          fechaHasta: fechaFin,
          limit: 10,
        }),
        api.get('/personal', { params: { limit: 100, activo: true } }),
        api.get('/turnos').catch(() => ({ data: { data: [] } })),
        planificacionService.obtenerVistaCompleta(fechaInicio, fechaFin).catch(() => null),
      ]);

      setPlanificaciones(planRes.data);
      setPersonal(personalRes.data.data || []);
      setTurnos(turnosRes.data.data || []);
      setVistaCompleta(vistaRes?.data || null);

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

  // Handlers para TimelineView - mover parte de trabajo
  const handleMoverParte = async (
    parteId: string,
    empleadoId: string,
    nuevaFecha: string,
    nuevaHora: string
  ): Promise<boolean> => {
    try {
      await api.post(`/partes-trabajo/${parteId}/reasignar`, {
        fecha: nuevaFecha,
        horaInicio: nuevaHora,
        asignadoId: empleadoId,
      });
      toast.success('Parte de trabajo reasignado');
      await cargarDatos();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al mover el parte');
      return false;
    }
  };

  // Handlers para TimelineView - mover tarea
  const handleMoverTarea = async (
    tareaId: string,
    empleadoId: string,
    nuevaFecha: string
  ): Promise<boolean> => {
    try {
      await api.post(`/tareas/${tareaId}/reasignar`, {
        fecha: nuevaFecha,
        asignadoId: empleadoId,
      });
      toast.success('Tarea reasignada');
      await cargarDatos();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al mover la tarea');
      return false;
    }
  };

  // Handler para click en parte desde timeline
  const handleClickParte = (parteId: string) => {
    router.push(`/partes-trabajo/${parteId}`);
  };

  // Handler para click en tarea desde timeline
  const handleClickTarea = (tareaId: string) => {
    router.push(`/tareas/${tareaId}`);
  };

  // ============================================
  // EXPORTAR / IMPRIMIR / COMPARTIR
  // ============================================

  const formatMesAno = useMemo(() => {
    const mes = semanaActual.toLocaleDateString('es-ES', { month: 'long' });
    const ano = semanaActual.getFullYear();
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${ano}`;
  }, [semanaActual]);

  // Generar datos para exportar
  const generarDatosExportar = useCallback(() => {
    const data: string[][] = [];

    // Header
    const header = ['Personal', ...fechasSemana.map(f => `${f.dia} ${f.numero}`)];
    data.push(header);

    // Filas de empleados
    personal.forEach((empleado) => {
      const fila = [`${empleado.nombre} ${empleado.apellidos || ''}`.trim()];

      fechasSemana.forEach((fecha) => {
        const key = `${fecha.dateStr}-${empleado._id}`;
        const asignacion = asignacionesPorDiaYPersonal.get(key);
        const empleadoVista = vistaCompleta?.empleados.find(e => e._id === empleado._id);
        const diaInfo = empleadoVista?.dias[fecha.dateStr];
        const partes = diaInfo?.partesTrabajo || [];
        const tareas = diaInfo?.tareas || [];

        let celda = '';
        if (asignacion) {
          celda = `${asignacion.horaInicio}-${asignacion.horaFin}`;
          if (asignacion.turnoNombre) celda += ` (${asignacion.turnoNombre})`;
        }
        if (partes.length > 0) {
          celda += celda ? '\n' : '';
          celda += partes.map(p => `PT: ${p.codigo}`).join(', ');
        }
        if (tareas.length > 0) {
          celda += celda ? '\n' : '';
          celda += tareas.map(t => `T: ${t.titulo}`).join(', ');
        }

        fila.push(celda || '-');
      });

      data.push(fila);
    });

    return data;
  }, [personal, fechasSemana, asignacionesPorDiaYPersonal, vistaCompleta]);

  // Exportar a CSV
  const handleExportar = useCallback(() => {
    const data = generarDatosExportar();

    // Escapar valores CSV
    const csvContent = data.map(row =>
      row.map(cell => {
        const escaped = cell.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    ).join('\n');

    // Crear blob y descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planificacion_${formatearFecha(semanaActual)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Planificacion exportada');
  }, [generarDatosExportar, semanaActual]);

  // Ejecutar impresion con opciones
  const ejecutarImpresion = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresion');
      return;
    }

    // Generar contenido de la tabla segun opciones
    const filas: string[] = [];

    personal.forEach((empleado) => {
      const nombreEmpleado = `${empleado.nombre} ${empleado.apellidos || ''}`.trim();
      let filaCeldas = `<td class="nombre-empleado">${nombreEmpleado}</td>`;

      fechasSemana.forEach((fecha) => {
        const key = `${fecha.dateStr}-${empleado._id}`;
        const asignacion = asignacionesPorDiaYPersonal.get(key);
        const empleadoVista = vistaCompleta?.empleados.find(e => e._id === empleado._id);
        const diaInfo = empleadoVista?.dias[fecha.dateStr];
        const partes = diaInfo?.partesTrabajo || [];
        const tareas = diaInfo?.tareas || [];

        let contenido = '';

        if (asignacion && opcionesImpresion.mostrarHoras) {
          contenido += `<div class="horario">${asignacion.horaInicio} - ${asignacion.horaFin}</div>`;
          contenido += `<div class="horas-total">${asignacion.horasPlanificadas}h</div>`;
        } else if (!opcionesImpresion.mostrarHoras && asignacion) {
          contenido += `<div class="check">✓</div>`;
        }

        if (opcionesImpresion.mostrarPartes && partes.length > 0) {
          partes.forEach(p => {
            contenido += `<div class="parte">${p.codigo}</div>`;
          });
        }

        if (opcionesImpresion.mostrarTareas && tareas.length > 0) {
          tareas.forEach(t => {
            contenido += `<div class="tarea">${t.titulo}</div>`;
          });
        }

        if (!contenido) contenido = '-';

        filaCeldas += `<td class="${fecha.esHoy ? 'hoy' : ''}">${contenido}</td>`;
      });

      filas.push(`<tr>${filaCeldas}</tr>`);
    });

    const orientacion = opcionesImpresion.formato === 'horizontal' ? 'landscape' : 'portrait';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Planificacion - ${formatMesAno}</title>
        <style>
          @page { size: A4 ${orientacion}; margin: 10mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 11px; }
          h1 { text-align: center; margin-bottom: 5px; font-size: 18px; }
          h2 { text-align: center; color: #666; margin-top: 0; font-weight: normal; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: center; vertical-align: top; }
          th { background-color: #e5e7eb; font-weight: bold; font-size: 10px; }
          .nombre-empleado { text-align: left; font-weight: 500; min-width: 120px; background: #f9fafb; }
          .hoy { background-color: #dbeafe !important; }
          .horario { font-weight: bold; color: #059669; font-size: 10px; }
          .horas-total { color: #666; font-size: 9px; }
          .check { color: #059669; font-size: 14px; font-weight: bold; }
          .parte { background: #dbeafe; color: #1e40af; padding: 2px 4px; border-radius: 3px; margin: 2px 0; font-size: 9px; }
          .tarea { background: #ede9fe; color: #5b21b6; padding: 2px 4px; border-radius: 3px; margin: 2px 0; font-size: 9px; }
          .leyenda { margin-top: 15px; font-size: 10px; display: flex; gap: 20px; justify-content: center; }
          .leyenda-item { display: flex; align-items: center; gap: 5px; }
          .leyenda-color { width: 12px; height: 12px; border-radius: 3px; }
          @media print {
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Planificacion de Jornadas</h1>
        <h2>${formatMesAno} (${fechasSemana[0].numero} - ${fechasSemana[6].numero})</h2>
        <table>
          <thead>
            <tr>
              <th>Personal</th>
              ${fechasSemana.map(f => `<th class="${f.esHoy ? 'hoy' : ''}">${f.dia}<br>${f.numero}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filas.join('')}
          </tbody>
        </table>
        <div class="leyenda">
          ${opcionesImpresion.mostrarHoras ? '<div class="leyenda-item"><div class="leyenda-color" style="background:#059669"></div>Horario</div>' : ''}
          ${opcionesImpresion.mostrarPartes ? '<div class="leyenda-item"><div class="leyenda-color" style="background:#3b82f6"></div>Parte trabajo</div>' : ''}
          ${opcionesImpresion.mostrarTareas ? '<div class="leyenda-item"><div class="leyenda-color" style="background:#8b5cf6"></div>Tarea</div>' : ''}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
    setShowImprimir(false);
  }, [personal, fechasSemana, asignacionesPorDiaYPersonal, vistaCompleta, opcionesImpresion, formatMesAno]);

  // Abrir dialogo de impresion
  const handleImprimir = useCallback(() => {
    setShowImprimir(true);
  }, []);

  // Enviar por email directo (usando backend)
  const handleEnviarEmail = useCallback(async () => {
    const fechaInicio = formatearFecha(semanaActual);
    const fechaFin = formatearFecha(new Date(semanaActual.getTime() + 6 * 24 * 60 * 60 * 1000));

    try {
      setEnviandoEmail(true);
      const response = await api.post('/planificacion/enviar-email', {
        fechaInicio,
        fechaFin,
        mensaje: mensajeEmail || undefined,
      });

      if (response.data.success) {
        const { enviados, total, errores } = response.data.data;
        if (errores && errores.length > 0) {
          toast.warning(`Enviados ${enviados} de ${total} emails. Errores: ${errores.join(', ')}`);
        } else {
          toast.success(`Emails enviados correctamente a ${enviados} empleados`);
        }
        setShowCompartir(false);
        setMensajeEmail('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al enviar emails');
    } finally {
      setEnviandoEmail(false);
    }
  }, [semanaActual, mensajeEmail]);

  // Compartir por WhatsApp
  const handleCompartirWhatsApp = useCallback(() => {
    let mensaje = `*Planificacion de Jornadas*\n${formatMesAno}\n\n`;

    personal.slice(0, 10).forEach((empleado) => {
      mensaje += `*${empleado.nombre} ${empleado.apellidos?.split(' ')[0] || ''}*\n`;

      fechasSemana.forEach((fecha) => {
        const key = `${fecha.dateStr}-${empleado._id}`;
        const asignacion = asignacionesPorDiaYPersonal.get(key);
        if (asignacion) {
          mensaje += `  ${fecha.dia}: ${asignacion.horaInicio}-${asignacion.horaFin}\n`;
        }
      });
      mensaje += '\n';
    });

    if (personal.length > 10) {
      mensaje += `... y ${personal.length - 10} empleados mas`;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
    setShowCompartir(false);
    toast.success('Se abrio WhatsApp');
  }, [personal, fechasSemana, asignacionesPorDiaYPersonal, formatMesAno]);

  // Copiar al portapapeles
  const handleCopiarPortapapeles = useCallback(async () => {
    const data = generarDatosExportar();
    const texto = data.map(row => row.join('\t')).join('\n');

    try {
      await navigator.clipboard.writeText(texto);
      toast.success('Copiado al portapapeles');
      setShowCompartir(false);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  }, [generarDatosExportar]);

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      
    );
  }

  return (
    
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
            {/* Botones de exportar/imprimir/compartir */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none"
                onClick={handleImprimir}
                title="Imprimir planificacion"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none"
                onClick={handleExportar}
                title="Exportar planificacion"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none"
                onClick={() => setShowCompartir(true)}
                title="Compartir planificacion"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

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

              <div className="flex items-center gap-4">
                {/* Toggle vista */}
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant={tipoVista === 'tabla' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setTipoVista('tabla')}
                  >
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    Tabla
                  </Button>
                  <Button
                    variant={tipoVista === 'timeline' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setTipoVista('timeline')}
                  >
                    <GanttChart className="h-4 w-4 mr-1" />
                    Timeline
                  </Button>
                </div>

                {planificacion && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vista Timeline */}
        {tipoVista === 'timeline' && (
          <Card>
            <CardContent className="p-4">
              <TimelineView
                vistaCompleta={vistaCompleta}
                fechasSemana={fechasSemana}
                onMoverParte={handleMoverParte}
                onMoverTarea={handleMoverTarea}
                onClickAsignacion={planificacion ? handleAbrirAsignacion : undefined}
                onClickParte={handleClickParte}
                onClickTarea={handleClickTarea}
              />
            </CardContent>
          </Card>
        )}

        {/* Calendario semanal (vista tabla) */}
        {tipoVista === 'tabla' && (
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

                          // Obtener partes y tareas de la vista completa
                          const empleadoVista = vistaCompleta?.empleados.find(e => e._id === empleado._id);
                          const diaInfo = empleadoVista?.dias[fecha.dateStr];
                          const partes = diaInfo?.partesTrabajo || [];
                          const tareas = diaInfo?.tareas || [];

                          return (
                            <td
                              key={fecha.dateStr}
                              className={cn(
                                'p-1 border-r last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors align-top',
                                fecha.esHoy && 'bg-blue-50/50 dark:bg-blue-950/30',
                                !planificacion && 'opacity-50 cursor-not-allowed'
                              )}
                              onClick={() => planificacion && handleAbrirAsignacion(fecha.dateStr, empleado._id)}
                            >
                              <div className="min-h-[80px] space-y-1">
                                {/* Horario asignado - VERDE */}
                                {asignacion ? (
                                  <div className={cn(
                                    'p-1.5 rounded text-xs border-l-4',
                                    asignacion.esAusencia
                                      ? 'bg-red-100 dark:bg-red-900/30 border-red-500'
                                      : 'bg-green-100 dark:bg-green-900/30 border-green-500'
                                  )}>
                                    <div className="font-medium flex items-center gap-1 text-green-800 dark:text-green-200">
                                      <Clock className="h-3 w-3" />
                                      {asignacion.horaInicio} - {asignacion.horaFin}
                                    </div>
                                    <div className="text-green-600 dark:text-green-400 text-[10px]">
                                      {asignacion.horasPlanificadas}h
                                      {asignacion.turnoNombre && ` · ${asignacion.turnoNombre}`}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-8 flex items-center justify-center opacity-30">
                                    <Plus className="h-3 w-3" />
                                  </div>
                                )}

                                {/* Partes de trabajo - AZUL */}
                                {partes.length > 0 && (
                                  <div className="space-y-0.5">
                                    {partes.slice(0, 2).map((parte) => (
                                      <div
                                        key={parte._id}
                                        className={cn(
                                          'p-1 rounded text-[10px] flex items-start gap-1 border-l-4',
                                          'bg-blue-100 dark:bg-blue-900/30',
                                          parte.prioridad === 'urgente' ? 'border-red-500' :
                                          parte.prioridad === 'alta' ? 'border-orange-500' :
                                          'border-blue-500'
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          router.push(`/partes-trabajo/${parte._id}`);
                                        }}
                                      >
                                        <Wrench className="h-3 w-3 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                                        <div className="overflow-hidden">
                                          <div className="font-medium truncate text-blue-800 dark:text-blue-200">{parte.codigo}</div>
                                          <div className="text-blue-600 dark:text-blue-400 truncate">{parte.cliente}</div>
                                          {parte.direccion && (
                                            <div className="text-blue-500 dark:text-blue-400 truncate flex items-center gap-0.5">
                                              <MapPin className="h-2 w-2" />{parte.direccion}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {partes.length > 2 && (
                                      <div className="text-[10px] text-blue-600 dark:text-blue-400 text-center">
                                        +{partes.length - 2} más
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Tareas - PURPURA */}
                                {tareas.length > 0 && (
                                  <div className="space-y-0.5">
                                    {tareas.slice(0, 2).map((tarea) => (
                                      <div
                                        key={tarea._id}
                                        className={cn(
                                          'p-1 rounded text-[10px] flex items-start gap-1 border-l-4',
                                          'bg-purple-100 dark:bg-purple-900/30',
                                          tarea.prioridad === 'urgente' ? 'border-red-500' : 'border-purple-500'
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          router.push(`/tareas/${tarea._id}`);
                                        }}
                                      >
                                        <CheckSquare className="h-3 w-3 flex-shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                                        <div className="overflow-hidden">
                                          <div className="truncate text-purple-800 dark:text-purple-200">{tarea.titulo}</div>
                                        </div>
                                      </div>
                                    ))}
                                    {tareas.length > 2 && (
                                      <div className="text-[10px] text-purple-600 dark:text-purple-400 text-center">
                                        +{tareas.length - 2} más
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
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
        )}

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
                  <SearchableSelect
                    options={turnos.map((turno) => ({
                      value: turno._id,
                      label: `${turno.nombre} (${turno.horaInicio} - ${turno.horaFin})`,
                    }))}
                    value={asignacionData.turnoId || ''}
                    onValueChange={(value) => value && handleTurnoChange(value)}
                    placeholder="Seleccionar turno..."
                    searchPlaceholder="Buscar turno..."
                    emptyMessage="No se encontraron turnos"
                  />
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

        {/* Dialog compartir */}
        <Dialog open={showCompartir} onOpenChange={setShowCompartir}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Compartir Planificacion</DialogTitle>
              <DialogDescription>
                Elige como quieres compartir la planificacion de {formatMesAno}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Envio por email directo */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium">Enviar por Email a empleados</div>
                    <div className="text-xs text-muted-foreground">
                      Se enviara a todos los empleados con email configurado
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Mensaje opcional</Label>
                  <Textarea
                    value={mensajeEmail}
                    onChange={(e) => setMensajeEmail(e.target.value)}
                    placeholder="Escribe un mensaje para incluir en el email..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={handleEnviarEmail}
                  disabled={enviandoEmail}
                  className="w-full"
                >
                  {enviandoEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar a empleados
                    </>
                  )}
                </Button>
              </div>

              {/* Otras opciones */}
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-12"
                  onClick={handleCompartirWhatsApp}
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Enviar por WhatsApp</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start gap-3 h-12"
                  onClick={handleCopiarPortapapeles}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Clipboard className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Copiar al portapapeles</div>
                  </div>
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCompartir(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog opciones de impresion */}
        <Dialog open={showImprimir} onOpenChange={setShowImprimir}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Opciones de Impresion</DialogTitle>
              <DialogDescription>
                Configura que informacion incluir en la impresion
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Opciones de contenido */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mostrar-horas" className="cursor-pointer">
                    <div className="font-medium">Mostrar horarios</div>
                    <div className="text-xs text-muted-foreground">
                      Incluir horas de entrada y salida
                    </div>
                  </Label>
                  <Switch
                    id="mostrar-horas"
                    checked={opcionesImpresion.mostrarHoras}
                    onCheckedChange={(checked) =>
                      setOpcionesImpresion({ ...opcionesImpresion, mostrarHoras: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="mostrar-partes" className="cursor-pointer">
                    <div className="font-medium">Mostrar partes de trabajo</div>
                    <div className="text-xs text-muted-foreground">
                      Incluir partes asignados
                    </div>
                  </Label>
                  <Switch
                    id="mostrar-partes"
                    checked={opcionesImpresion.mostrarPartes}
                    onCheckedChange={(checked) =>
                      setOpcionesImpresion({ ...opcionesImpresion, mostrarPartes: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="mostrar-tareas" className="cursor-pointer">
                    <div className="font-medium">Mostrar tareas</div>
                    <div className="text-xs text-muted-foreground">
                      Incluir tareas asignadas
                    </div>
                  </Label>
                  <Switch
                    id="mostrar-tareas"
                    checked={opcionesImpresion.mostrarTareas}
                    onCheckedChange={(checked) =>
                      setOpcionesImpresion({ ...opcionesImpresion, mostrarTareas: checked })
                    }
                  />
                </div>
              </div>

              {/* Orientacion */}
              <div className="space-y-2">
                <Label>Orientacion de pagina</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={opcionesImpresion.formato === 'horizontal' ? 'default' : 'outline'}
                    className="h-16"
                    onClick={() => setOpcionesImpresion({ ...opcionesImpresion, formato: 'horizontal' })}
                  >
                    <div className="text-center">
                      <div className="w-8 h-5 border-2 border-current mx-auto mb-1 rounded-sm" />
                      <div className="text-xs">Horizontal</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={opcionesImpresion.formato === 'vertical' ? 'default' : 'outline'}
                    className="h-16"
                    onClick={() => setOpcionesImpresion({ ...opcionesImpresion, formato: 'vertical' })}
                  >
                    <div className="text-center">
                      <div className="w-5 h-8 border-2 border-current mx-auto mb-1 rounded-sm" />
                      <div className="text-xs">Vertical</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowImprimir(false)}>
                Cancelar
              </Button>
              <Button onClick={ejecutarImpresion}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  );
}
