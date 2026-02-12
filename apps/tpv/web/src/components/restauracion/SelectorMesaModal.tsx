'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Grid3X3,
  RefreshCw,
  Users,
  List,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Clock,
  Merge,
  Check,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRestauracionStore } from '@/stores/restauracionStore';
import { useVentaStore } from '@/stores/ventaStore';
import { Mesa, Salon } from '@/services/restauracion.service';

interface SelectorMesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mesa: Mesa) => void;
  onUnirMesas?: (mesas: Mesa[]) => void;
  mesaActual?: Mesa | null;
  soloLibres?: boolean;
  permitirMultiseleccion?: boolean;
}

type ModoVista = 'grafico' | 'lista';

export function SelectorMesaModal({
  isOpen,
  onClose,
  onSelect,
  onUnirMesas,
  mesaActual,
  soloLibres = true,
  permitirMultiseleccion = false,
}: SelectorMesaModalProps) {
  const {
    salones,
    mesas,
    cargando,
    cargarDatosRestauracion,
    refrescarMesas,
  } = useRestauracionStore();

  const { ventasPorMesa } = useVentaStore();

  const [salonSeleccionado, setSalonSeleccionado] = useState<string | null>(null);
  const [modoVista, setModoVista] = useState<ModoVista>('grafico');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Multi-selección para unir mesas
  const [modoUnir, setModoUnir] = useState(false);
  const [mesasSeleccionadasUnir, setMesasSeleccionadasUnir] = useState<Set<string>>(new Set());

  // Hora actual para calcular tiempo de ocupación
  const [horaActual, setHoraActual] = useState(new Date());

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Cargar datos si no hay
  useEffect(() => {
    if (isOpen && salones.length === 0) {
      cargarDatosRestauracion();
    }
  }, [isOpen, salones.length, cargarDatosRestauracion]);

  // Seleccionar primer salón por defecto
  useEffect(() => {
    if (salones.length > 0 && !salonSeleccionado) {
      setSalonSeleccionado(salones[0]._id);
    }
  }, [salones, salonSeleccionado]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setModoUnir(false);
      setMesasSeleccionadasUnir(new Set());
    }
  }, [isOpen]);

  // Reset zoom y pan al cambiar de salón
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [salonSeleccionado]);

  // Salón efectivo
  const salonEfectivo = salonSeleccionado || (salones.length > 0 ? salones[0]._id : null);

  const salonActual = useMemo(() => {
    return salones.find((s) => s._id === salonEfectivo);
  }, [salones, salonEfectivo]);

  // Helper para obtener salonId como string
  const getMesaSalonId = useCallback((mesa: Mesa): string => {
    if (typeof mesa.salonId === 'object' && mesa.salonId !== null) {
      return (mesa.salonId as any)?._id?.toString() || '';
    }
    return mesa.salonId?.toString() || '';
  }, []);

  // Determinar estado efectivo considerando ventasPorMesa local
  const getEstadoEfectivo = useCallback((mesa: Mesa): Mesa['estado'] => {
    // Si hay una venta local para esta mesa, considerarla como ocupada
    const tieneVentaLocal = ventasPorMesa[mesa._id] && ventasPorMesa[mesa._id].lineas.length > 0;

    if (tieneVentaLocal && mesa.estado === 'libre') {
      return 'ocupada';
    }

    return mesa.estado;
  }, [ventasPorMesa]);

  // Filtrar mesas del salón
  const mesasFiltradas = useMemo(() => {
    if (!salonEfectivo) return [];
    let filtered = mesas.filter((m) => m.activa !== false);
    filtered = filtered.filter((m) => getMesaSalonId(m) === salonEfectivo);
    if (soloLibres && !modoUnir) {
      filtered = filtered.filter((m) => getEstadoEfectivo(m) === 'libre');
    }
    return filtered.sort((a, b) => {
      const numA = parseInt(a.numero) || 0;
      const numB = parseInt(b.numero) || 0;
      return numA - numB;
    });
  }, [mesas, salonEfectivo, soloLibres, modoUnir, getMesaSalonId, getEstadoEfectivo]);

  // Todas las mesas del salón (para modo gráfico)
  const todasLasMesasSalon = useMemo(() => {
    if (!salonEfectivo) return [];
    return mesas.filter((m) => {
      return getMesaSalonId(m) === salonEfectivo && m.activa !== false;
    });
  }, [mesas, salonEfectivo, getMesaSalonId]);

  // Calcular tiempo de ocupación
  const calcularTiempoOcupacion = (mesa: Mesa, estadoEfectivo: Mesa['estado']): string | null => {
    if (estadoEfectivo !== 'ocupada') return null;

    // Obtener hora de ocupación de estadoInfo o de ventasPorMesa
    let horaOcupacion: Date | null = null;

    if (mesa.estadoInfo?.horaOcupacion) {
      horaOcupacion = new Date(mesa.estadoInfo.horaOcupacion);
    } else if (mesa.ventaActualId || ventasPorMesa[mesa._id]) {
      const venta = ventasPorMesa[mesa._id];
      if (venta?.creadaEn) {
        horaOcupacion = new Date(venta.creadaEn);
      }
    }

    if (!horaOcupacion) return null;

    const diffMs = horaActual.getTime() - horaOcupacion.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  // Obtener info de venta para una mesa
  const getVentaInfo = (mesaId: string) => {
    const venta = ventasPorMesa[mesaId];
    if (!venta) return null;
    return {
      productos: venta.lineas.reduce((acc, l) => acc + l.cantidad, 0),
      total: venta.total,
    };
  };

  // Manejar click en mesa
  const handleClickMesa = (mesa: Mesa, e: React.MouseEvent) => {
    e.stopPropagation();
    const estadoEfectivo = getEstadoEfectivo(mesa);

    if (modoUnir) {
      // Modo unir: toggle selección
      const newSet = new Set(mesasSeleccionadasUnir);
      if (newSet.has(mesa._id)) {
        newSet.delete(mesa._id);
      } else {
        // Solo permitir mesas con tickets (ocupadas)
        if (estadoEfectivo === 'ocupada') {
          newSet.add(mesa._id);
        }
      }
      setMesasSeleccionadasUnir(newSet);
    } else {
      // Modo normal: seleccionar mesa
      if (!soloLibres || estadoEfectivo === 'libre') {
        onSelect(mesa);
        onClose();
      }
    }
  };

  // Confirmar unión de mesas
  const handleConfirmarUnion = () => {
    if (mesasSeleccionadasUnir.size < 2) return;
    const mesasAUnir = mesas.filter((m) => mesasSeleccionadasUnir.has(m._id));
    if (onUnirMesas) {
      onUnirMesas(mesasAUnir);
    }
    setModoUnir(false);
    setMesasSeleccionadasUnir(new Set());
    onClose();
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleAutoFit = useCallback(() => {
    if (!canvasRef.current || !salonActual?.plano) return;
    const container = canvasRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const planoWidth = salonActual.plano.ancho;
    const planoHeight = salonActual.plano.alto;
    const scaleX = (containerWidth - 40) / planoWidth;
    const scaleY = (containerHeight - 40) / planoHeight;
    const newZoom = Math.min(scaleX, scaleY, 1);
    setZoom(newZoom);
    setPan({ x: 0, y: 0 });
  }, [salonActual]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !modoUnir) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.3, Math.min(2, z + delta)));
  };

  // Colores según estado
  const getEstadoColor = (estado: Mesa['estado']) => {
    switch (estado) {
      case 'libre':
        return { bg: '#22c55e', border: '#16a34a', text: '#fff', label: 'Libre' };
      case 'ocupada':
        return { bg: '#ef4444', border: '#dc2626', text: '#fff', label: 'Ocupada' };
      case 'reservada':
        return { bg: '#f59e0b', border: '#d97706', text: '#fff', label: 'Reservada' };
      case 'cuenta_pedida':
        return { bg: '#8b5cf6', border: '#7c3aed', text: '#fff', label: 'Cuenta' };
      case 'por_limpiar':
        return { bg: '#06b6d4', border: '#0891b2', text: '#fff', label: 'Limpiar' };
      case 'bloqueada':
        return { bg: '#6b7280', border: '#4b5563', text: '#fff', label: 'Bloqueada' };
      default:
        return { bg: '#9ca3af', border: '#6b7280', text: '#fff', label: estado };
    }
  };

  // Calcular posiciones automáticas
  const getMesaPosicion = (mesa: Mesa, index: number) => {
    if (mesa.posicion && (mesa.posicion.x > 0 || mesa.posicion.y > 0)) {
      return mesa.posicion;
    }
    const cols = Math.ceil(Math.sqrt(todasLasMesasSalon.length));
    const col = index % cols;
    const row = Math.floor(index / cols);
    const spacing = 120;
    return { x: 50 + col * spacing, y: 50 + row * spacing };
  };

  // Encontrar mesas del mismo grupo
  const getMesasGrupo = useCallback((mesa: Mesa): Mesa[] => {
    if (!mesa.grupo?.grupoId) return [];
    return todasLasMesasSalon.filter(
      (m) => m.grupo?.grupoId === mesa.grupo?.grupoId && m._id !== mesa._id
    );
  }, [todasLasMesasSalon]);

  if (!isOpen) return null;

  const plano = salonActual?.plano || { ancho: 800, alto: 600, escala: 1 };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            modoUnir ? 'bg-blue-600' : 'bg-primary-600'
          }`}>
            {modoUnir ? <Merge className="w-5 h-5 text-white" /> : <Grid3X3 className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {modoUnir ? 'Unir Mesas' : 'Seleccionar Mesa'}
            </h2>
            <p className="text-sm text-gray-400">
              {modoUnir
                ? `${mesasSeleccionadasUnir.size} mesas seleccionadas`
                : mesaActual
                ? `Mesa actual: ${mesaActual.numero}`
                : 'Selecciona una mesa'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón modo unir */}
          {permitirMultiseleccion && !modoUnir && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModoUnir(true)}
              className="text-blue-400 border-blue-500 hover:bg-blue-500/20"
            >
              <Merge className="w-4 h-4 mr-1" />
              Unir Mesas
            </Button>
          )}

          {modoUnir && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setModoUnir(false);
                  setMesasSeleccionadasUnir(new Set());
                }}
                className="text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmarUnion}
                disabled={mesasSeleccionadasUnir.size < 2}
              >
                <Check className="w-4 h-4 mr-1" />
                Unir ({mesasSeleccionadasUnir.size})
              </Button>
            </>
          )}

          {/* Toggle de vista */}
          {!modoUnir && (
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setModoVista('grafico')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors ${
                  modoVista === 'grafico'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Plano
              </button>
              <button
                onClick={() => setModoVista('lista')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors ${
                  modoVista === 'lista'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                Lista
              </button>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refrescarMesas()}
            disabled={cargando}
            className="text-gray-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </Button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tabs de salones */}
      <div className="flex gap-2 p-3 bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {salones.map((salon) => {
          const mesasSalon = mesas.filter((m) => getMesaSalonId(m) === salon._id && m.activa !== false);
          const mesasLibres = mesasSalon.filter((m) => getEstadoEfectivo(m) === 'libre').length;
          const mesasOcupadas = mesasSalon.filter((m) => getEstadoEfectivo(m) === 'ocupada').length;

          return (
            <button
              type="button"
              key={salon._id}
              onClick={() => setSalonSeleccionado(salon._id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                salonEfectivo === salon._id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              style={
                salon.color && salonEfectivo !== salon._id
                  ? { borderLeft: `4px solid ${salon.color}` }
                  : undefined
              }
            >
              <span className="font-medium">{salon.nombre}</span>
              <div className="flex gap-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-600/30 text-green-400">
                  {mesasLibres}
                </span>
                {mesasOcupadas > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-600/30 text-red-400">
                    {mesasOcupadas}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-hidden relative">
        {cargando ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-12 h-12 text-primary-500 animate-spin" />
          </div>
        ) : modoVista === 'grafico' || modoUnir ? (
          /* Vista Gráfica del Plano */
          <>
            {/* Controles de zoom */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-gray-800/90 rounded-lg p-2">
              <button onClick={handleZoomIn} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white" title="Acercar">
                <ZoomIn className="w-5 h-5" />
              </button>
              <button onClick={handleZoomOut} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white" title="Alejar">
                <ZoomOut className="w-5 h-5" />
              </button>
              <div className="border-t border-gray-600 my-1" />
              <button onClick={handleAutoFit} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white" title="Ajustar">
                <Maximize2 className="w-5 h-5" />
              </button>
              <button onClick={handleResetView} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white" title="Reset">
                <Move className="w-5 h-5" />
              </button>
              <div className="text-xs text-gray-500 text-center mt-1">{Math.round(zoom * 100)}%</div>
            </div>

            {/* Leyenda */}
            <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2 bg-gray-800/90 rounded-lg px-3 py-2 max-w-md">
              <span className="flex items-center gap-1.5 text-xs text-gray-300">
                <span className="w-3 h-3 rounded bg-green-500" /> Libre
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-300">
                <span className="w-3 h-3 rounded bg-red-500" /> Ocupada
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-300">
                <span className="w-3 h-3 rounded bg-amber-500" /> Reservada
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-300">
                <span className="w-3 h-3 rounded bg-purple-500" /> Cuenta
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-300">
                <span className="w-3 h-3 rounded bg-cyan-500" /> Limpiar
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-300">
                <span className="w-3 h-3 rounded bg-gray-500" /> Bloqueada
              </span>
            </div>

            {/* Canvas del plano */}
            <div
              ref={canvasRef}
              className={`w-full h-full overflow-hidden ${modoUnir ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <div
                className="relative bg-gray-800"
                style={{
                  width: plano.ancho,
                  height: plano.alto,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'top left',
                  margin: '20px',
                  backgroundImage: plano.imagenFondo ? `url(${plano.imagenFondo})` : undefined,
                  backgroundSize: 'cover',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
                }}
              >
                {/* Grid de fondo */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px',
                  }}
                />

                {/* Líneas de conexión para mesas agrupadas */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                  {todasLasMesasSalon.map((mesa, index) => {
                    const mesasGrupo = getMesasGrupo(mesa);
                    if (mesasGrupo.length === 0 || !mesa.grupo?.esPrincipal) return null;

                    const pos1 = getMesaPosicion(mesa, index);
                    const size1 = mesa.tamano || { ancho: 80, alto: 80 };

                    return mesasGrupo.map((mesaGrupo) => {
                      const idx2 = todasLasMesasSalon.findIndex((m) => m._id === mesaGrupo._id);
                      const pos2 = getMesaPosicion(mesaGrupo, idx2);
                      const size2 = mesaGrupo.tamano || { ancho: 80, alto: 80 };

                      return (
                        <line
                          key={`${mesa._id}-${mesaGrupo._id}`}
                          x1={pos1.x + size1.ancho / 2}
                          y1={pos1.y + size1.alto / 2}
                          x2={pos2.x + size2.ancho / 2}
                          y2={pos2.y + size2.alto / 2}
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeDasharray="8,4"
                          opacity="0.7"
                        />
                      );
                    });
                  })}
                </svg>

                {/* Mensaje si no hay mesas */}
                {todasLasMesasSalon.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No hay mesas en este salón</p>
                      <p className="text-sm">Configura las mesas en el editor de salones</p>
                    </div>
                  </div>
                )}

                {/* Mesas */}
                {todasLasMesasSalon.map((mesa, index) => {
                  const estadoEfectivo = getEstadoEfectivo(mesa);
                  const colors = getEstadoColor(estadoEfectivo);
                  const esSeleccionada = mesaActual?._id === mesa._id;
                  const esSeleccionadaUnir = mesasSeleccionadasUnir.has(mesa._id);
                  const puedeSeleccionar = modoUnir
                    ? (ventasPorMesa[mesa._id] || estadoEfectivo === 'ocupada')
                    : (!soloLibres || estadoEfectivo === 'libre');
                  const pos = getMesaPosicion(mesa, index);
                  const rawSize = mesa.tamano || { ancho: 80, alto: 80 };
                  const size = {
                    ancho: Math.min(Math.max(rawSize.ancho, 60), 200),
                    alto: Math.min(Math.max(rawSize.alto, 60), 200),
                  };
                  const rotation = mesa.rotacion || 0;
                  const tiempoOcupacion = calcularTiempoOcupacion(mesa, estadoEfectivo);
                  const ventaInfo = getVentaInfo(mesa._id);
                  const tieneGrupo = mesa.grupo?.grupoId;

                  return (
                    <div
                      key={mesa._id}
                      onClick={(e) => handleClickMesa(mesa, e)}
                      className={`absolute flex flex-col items-center justify-center transition-all ${
                        puedeSeleccionar
                          ? 'cursor-pointer hover:scale-105 hover:z-10'
                          : modoUnir
                          ? 'cursor-not-allowed opacity-40'
                          : 'cursor-not-allowed opacity-70'
                      } ${esSeleccionada ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-900 z-20' : ''}
                      ${esSeleccionadaUnir ? 'ring-4 ring-blue-400 ring-offset-2 ring-offset-gray-900 z-20 scale-105' : ''}`}
                      style={{
                        left: pos.x,
                        top: pos.y,
                        width: size.ancho,
                        height: size.alto,
                        backgroundColor: colors.bg,
                        border: `3px solid ${colors.border}`,
                        borderRadius: mesa.forma === 'redonda' ? '50%' : '8px',
                        transform: `rotate(${rotation}deg)`,
                        boxShadow: puedeSeleccionar
                          ? '0 4px 12px rgba(0,0,0,0.4)'
                          : '0 2px 6px rgba(0,0,0,0.3)',
                      }}
                    >
                      {/* Número de mesa */}
                      <span
                        className="text-xl font-bold leading-none"
                        style={{ color: colors.text, transform: `rotate(-${rotation}deg)` }}
                      >
                        {mesa.numero}
                      </span>

                      {/* Info de capacidad o estado */}
                      {estadoEfectivo === 'libre' ? (
                        <span
                          className="flex items-center gap-0.5 text-xs opacity-90"
                          style={{ color: colors.text, transform: `rotate(-${rotation}deg)` }}
                        >
                          <Users className="w-3 h-3" />
                          {mesa.capacidad}
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-medium opacity-90 uppercase"
                          style={{ color: colors.text, transform: `rotate(-${rotation}deg)` }}
                        >
                          {colors.label}
                        </span>
                      )}

                      {/* Badge de tiempo de ocupación */}
                      {tiempoOcupacion && (
                        <div
                          className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gray-900 text-white text-[10px] font-medium shadow-lg"
                          style={{ transform: `rotate(-${rotation}deg)` }}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {tiempoOcupacion}
                        </div>
                      )}

                      {/* Badge de importe */}
                      {ventaInfo && ventaInfo.total > 0 && (
                        <div
                          className="absolute -bottom-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-bold shadow-lg"
                          style={{ transform: `rotate(-${rotation}deg)` }}
                        >
                          {ventaInfo.total.toFixed(0)}€
                        </div>
                      )}

                      {/* Badge de productos */}
                      {ventaInfo && ventaInfo.productos > 0 && (
                        <div
                          className="absolute -bottom-2 -left-2 flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-lg"
                          style={{ transform: `rotate(-${rotation}deg)` }}
                        >
                          {ventaInfo.productos}
                        </div>
                      )}

                      {/* Indicador de grupo */}
                      {tieneGrupo && (
                        <div
                          className="absolute -top-2 -left-2 flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white shadow-lg"
                          style={{ transform: `rotate(-${rotation}deg)` }}
                          title="Mesa agrupada"
                        >
                          <Merge className="w-3 h-3" />
                        </div>
                      )}

                      {/* Check para modo unir */}
                      {modoUnir && esSeleccionadaUnir && (
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-blue-500/30 rounded-lg"
                          style={{ borderRadius: mesa.forma === 'redonda' ? '50%' : '8px' }}
                        >
                          <Check className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Vista Lista */
          <div className="p-4 overflow-y-auto h-full">
            {mesasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Grid3X3 className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No hay mesas disponibles</p>
                <p className="text-sm">en este salón</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                {mesasFiltradas.map((mesa) => {
                  const estadoEfectivo = getEstadoEfectivo(mesa);
                  const colors = getEstadoColor(estadoEfectivo);
                  const esSeleccionada = mesaActual?._id === mesa._id;
                  const puedeSeleccionar = !soloLibres || estadoEfectivo === 'libre';
                  const tiempoOcupacion = calcularTiempoOcupacion(mesa, estadoEfectivo);
                  const ventaInfo = getVentaInfo(mesa._id);

                  return (
                    <button
                      key={mesa._id}
                      onClick={() => puedeSeleccionar && onSelect(mesa) && onClose()}
                      disabled={!puedeSeleccionar}
                      className={`
                        relative p-4 rounded-xl transition-all
                        ${puedeSeleccionar ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-60'}
                        ${esSeleccionada ? 'ring-4 ring-primary-500 ring-offset-2 ring-offset-gray-900' : ''}
                      `}
                      style={{
                        backgroundColor: colors.bg,
                        border: `3px solid ${colors.border}`,
                      }}
                    >
                      <div className="text-3xl font-bold text-white mb-1">{mesa.numero}</div>
                      <div className="flex items-center justify-center gap-1 text-sm text-white/90">
                        <Users className="w-4 h-4" />
                        <span>{mesa.capacidad}</span>
                      </div>
                      {estadoEfectivo !== 'libre' && (
                        <div className="text-xs mt-1 text-white/80 font-medium">{colors.label}</div>
                      )}
                      {tiempoOcupacion && (
                        <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/40 text-white text-[10px]">
                          <Clock className="w-2.5 h-2.5" />
                          {tiempoOcupacion}
                        </div>
                      )}
                      {ventaInfo && (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/40 text-white text-[10px] font-bold">
                          {ventaInfo.total.toFixed(0)}€
                        </div>
                      )}
                      {esSeleccionada && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-primary-600 text-sm font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          {modoUnir ? (
            <span className="text-blue-400">
              Selecciona las mesas que deseas unir (mínimo 2)
            </span>
          ) : (
            <>
              {mesasFiltradas.length} mesa{mesasFiltradas.length !== 1 ? 's' : ''}{' '}
              {soloLibres ? 'disponible' : ''}
              {mesasFiltradas.length !== 1 && soloLibres ? 's' : ''}
              {salonActual && ` en ${salonActual.nombre}`}
            </>
          )}
        </div>
        <div className="flex gap-2">
          {mesaActual && !modoUnir && (
            <Button
              variant="ghost"
              onClick={() => {
                onSelect(null as any);
                onClose();
              }}
              className="text-gray-300"
            >
              Sin mesa
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              if (modoUnir) {
                setModoUnir(false);
                setMesasSeleccionadasUnir(new Set());
              } else {
                onClose();
              }
            }}
          >
            {modoUnir ? 'Cancelar' : 'Cerrar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
