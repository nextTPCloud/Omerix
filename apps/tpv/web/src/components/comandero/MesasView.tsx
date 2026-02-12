'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useComanderoStore } from '../../stores/comanderoStore';
import { useDragScroll } from '../../hooks/useDragScroll';

type ModoVista = 'lista' | 'plano';

// Colores segun estado - mismo esquema que TPV
const ESTADO_CONFIG: Record<string, { bg: string; border: string; label: string }> = {
  libre: { bg: '#22c55e', border: '#16a34a', label: 'Libre' },
  ocupada: { bg: '#ef4444', border: '#dc2626', label: 'Ocupada' },
  reservada: { bg: '#f59e0b', border: '#d97706', label: 'Reservada' },
  cuenta_pedida: { bg: '#8b5cf6', border: '#7c3aed', label: 'Cuenta' },
  pendiente_cobro: { bg: '#f97316', border: '#ea580c', label: 'Por cobrar' },
  por_limpiar: { bg: '#06b6d4', border: '#0891b2', label: 'Limpiar' },
  bloqueada: { bg: '#6b7280', border: '#4b5563', label: 'Bloqueada' },
  fuera_servicio: { bg: '#6b7280', border: '#4b5563', label: 'Fuera serv.' },
};

const getEstadoConfig = (estado: string) =>
  ESTADO_CONFIG[estado] || { bg: '#9ca3af', border: '#6b7280', label: estado };

interface MesasViewProps {
  onMesaSeleccionada?: () => void;
}

export default function MesasView({ onMesaSeleccionada }: MesasViewProps) {
  const { mesas, salones, salonActivo, mesaSeleccionada, seleccionarMesa, seleccionarSalon, cargarMesas, cargarMesasTodosSalones, cargarSalones } = useComanderoStore();
  const [modoVista, setModoVista] = useState<ModoVista>('lista');
  const [horaActual, setHoraActual] = useState(new Date());

  // Plano: zoom y pan
  const [zoom, setZoom] = useState(0.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [autoFitDone, setAutoFitDone] = useState(false);

  // Drag scroll para salones
  const dragScrollSalones = useDragScroll();

  // Cargar salones al montar si no hay
  useEffect(() => {
    if (salones.length === 0) {
      cargarSalones();
    }
  }, []);

  // Refrescar mesas cada 15 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (salonActivo === '__todos__') {
        cargarMesasTodosSalones();
      } else if (salonActivo) {
        cargarMesas(salonActivo);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [salonActivo, cargarMesas, cargarMesasTodosSalones]);

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Salon actual para obtener plano
  const salonActual = useMemo(() => {
    if (salonActivo === '__todos__') return null;
    return salones.find((s: any) => s._id === salonActivo);
  }, [salones, salonActivo]);

  // Popup resumen de cuenta
  const [mesaResumen, setMesaResumen] = useState<any>(null);

  // Calcular tiempo de ocupacion y color
  const calcularTiempo = useCallback((mesa: any): { texto: string; color: string } | null => {
    if (mesa.estado !== 'ocupada') return null;
    const horaOcupacion = mesa.estadoInfo?.horaOcupacion;
    if (!horaOcupacion) return null;
    const diffMs = horaActual.getTime() - new Date(horaOcupacion).getTime();
    const mins = Math.floor(diffMs / 60000);
    let texto = '';
    if (mins < 1) texto = '<1m';
    else if (mins < 60) texto = `${mins}m`;
    else texto = `${Math.floor(mins / 60)}h${mins % 60}m`;

    // Color: verde (<30min), amarillo (30-60min), rojo (>60min)
    let color = '#22c55e'; // verde
    if (mins >= 60) color = '#ef4444'; // rojo
    else if (mins >= 30) color = '#f59e0b'; // amarillo

    return { texto, color };
  }, [horaActual]);

  // Manejar seleccion de mesa
  const handleSeleccionarMesa = (mesaId: string) => {
    seleccionarMesa(mesaId);
    onMesaSeleccionada?.();
  };

  // Tamano de mesa para plano - misma logica que TPV restauracionStore
  const getMesaSize = useCallback((mesa: any) => {
    const dim = mesa.dimensiones;
    if (dim && dim.ancho && dim.alto) {
      const anchoRaw = dim.ancho || 2;
      const altoRaw = dim.alto || 2;
      // Si valores pequeños (<=20), son unidades → escalar a pixeles
      // Si son grandes, ya son pixeles
      const esUnidades = anchoRaw <= 20 && altoRaw <= 20;
      const ancho = esUnidades ? anchoRaw * 40 : anchoRaw;
      const alto = esUnidades ? altoRaw * 40 : altoRaw;
      return {
        ancho: Math.min(Math.max(ancho, 60), 400),
        alto: Math.min(Math.max(alto, 60), 400),
      };
    }
    return { ancho: 80, alto: 80 };
  }, []);

  // Posicion para plano - auto-layout si no hay posicion definida
  const getMesaPosicion = useCallback((mesa: any, index: number) => {
    if (mesa.posicion && (mesa.posicion.x > 0 || mesa.posicion.y > 0)) {
      return { x: mesa.posicion.x, y: mesa.posicion.y, rotacion: mesa.posicion.rotacion || 0 };
    }
    // Auto-layout en grid si no hay posiciones
    const size = getMesaSize(mesa);
    const spacing = Math.max(size.ancho, size.alto) + 30;
    const cols = Math.max(Math.ceil(Math.sqrt(mesas.length)), 3);
    const col = index % cols;
    const row = Math.floor(index / cols);
    return { x: 40 + col * spacing, y: 40 + row * spacing, rotacion: 0 };
  }, [mesas.length, getMesaSize]);

  // Auto-fit: calcular zoom para que quepa todo en pantalla
  const handleAutoFit = useCallback(() => {
    if (!canvasRef.current || mesas.length === 0) return;
    const container = canvasRef.current;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    if (containerW === 0 || containerH === 0) return;

    // Calcular bounding box de todas las mesas
    let maxX = 0;
    let maxY = 0;
    mesas.forEach((mesa: any, index: number) => {
      const pos = getMesaPosicion(mesa, index);
      const size = getMesaSize(mesa);
      maxX = Math.max(maxX, pos.x + size.ancho + 20);
      maxY = Math.max(maxY, pos.y + size.alto + 20);
    });

    // Usar plano dimensions si son mas grandes
    const plano = salonActual?.plano;
    if (plano) {
      maxX = Math.max(maxX, plano.ancho);
      maxY = Math.max(maxY, plano.alto);
    }

    // Margenes
    const margin = 40;
    const scaleX = (containerW - margin) / maxX;
    const scaleY = (containerH - margin) / maxY;
    const newZoom = Math.min(scaleX, scaleY, 1.5);

    setZoom(Math.max(0.2, newZoom));
    setPan({ x: 10, y: 10 });
  }, [mesas, getMesaPosicion, getMesaSize, salonActual]);

  // Auto-fit al cambiar de salon o al cargar mesas
  useEffect(() => {
    setAutoFitDone(false);
  }, [salonActivo]);

  useEffect(() => {
    if (modoVista === 'plano' && mesas.length > 0 && !autoFitDone) {
      // Pequeño delay para que el container tenga dimensiones
      const timer = setTimeout(() => {
        handleAutoFit();
        setAutoFitDone(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [modoVista, mesas.length, autoFitDone, handleAutoFit]);

  // Pan/zoom handlers para plano (touch-friendly)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.15, Math.min(2, z + delta)));
  };

  // Touch handlers para plano
  const [lastTouchDist, setLastTouchDist] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setLastTouchDist(Math.sqrt(dx * dx + dy * dy));
    } else if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / lastTouchDist;
      setZoom((z) => Math.max(0.15, Math.min(2, z * scale)));
      setLastTouchDist(dist);
    } else if (e.touches.length === 1 && touchStart) {
      setPan({ x: e.touches[0].clientX - touchStart.x, y: e.touches[0].clientY - touchStart.y });
    }
  };
  const handleTouchEnd = () => {
    setLastTouchDist(null);
    setTouchStart(null);
  };

  const plano = salonActual?.plano || { ancho: 800, alto: 600, escala: 1, imagenFondo: undefined as string | undefined };

  // Calcular tamano real del canvas basado en posiciones de mesas
  const planoSize = useMemo(() => {
    let maxX = plano.ancho || 800;
    let maxY = plano.alto || 600;
    mesas.forEach((mesa: any, index: number) => {
      const pos = getMesaPosicion(mesa, index);
      const size = getMesaSize(mesa);
      maxX = Math.max(maxX, pos.x + size.ancho + 40);
      maxY = Math.max(maxY, pos.y + size.alto + 40);
    });
    return { ancho: maxX, alto: maxY };
  }, [mesas, plano.ancho, plano.alto, getMesaPosicion, getMesaSize]);

  return (
    <div className="flex flex-col h-full">
      {/* Header: Selector de salon + toggle vista */}
      <div className="flex items-center gap-2 p-2 bg-gray-800/50 border-b border-gray-700 flex-shrink-0">
        {/* Salones - scroll horizontal con drag */}
        <div ref={dragScrollSalones.ref} {...dragScrollSalones.handlers} className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide select-none">
          {salones.length > 1 && (
            <button
              onClick={() => seleccionarSalon('__todos__')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                salonActivo === '__todos__'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              Todos
            </button>
          )}
          {salones.map((salon: any) => {
            const mesasSalon = mesas.filter((m: any) => m.salonId === salon._id || m._salonId === salon._id);
            const libres = mesasSalon.filter((m: any) => m.estado === 'libre').length;
            return (
              <button
                key={salon._id}
                onClick={() => seleccionarSalon(salon._id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  salonActivo === salon._id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                <span>{salon.nombre}</span>
                {salonActivo === salon._id && (
                  <span className="px-1 py-0.5 rounded bg-green-600/40 text-green-300 text-[10px]">{libres}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Toggle vista - solo si no es "todos" */}
        {salonActivo !== '__todos__' && (
          <div className="flex bg-gray-700 rounded-lg p-0.5 flex-shrink-0">
            <button
              onClick={() => setModoVista('lista')}
              className={`px-2 py-1 rounded-md text-[10px] sm:text-xs transition-colors ${
                modoVista === 'lista' ? 'bg-blue-600 text-white' : 'text-gray-400'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setModoVista('plano')}
              className={`px-2 py-1 rounded-md text-[10px] sm:text-xs transition-colors ${
                modoVista === 'plano' ? 'bg-blue-600 text-white' : 'text-gray-400'
              }`}
            >
              Plano
            </button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-hidden">
        {mesas.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <p className="text-lg">No hay mesas disponibles</p>
            <p className="text-sm mt-1">Comprueba la configuracion de salones</p>
          </div>
        ) : modoVista === 'lista' || salonActivo === '__todos__' ? (
          /* === VISTA LISTA (Grid de tarjetas) === */
          <div className="p-2 sm:p-3 overflow-y-auto h-full">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              {mesas.map((mesa: any) => {
                const config = getEstadoConfig(mesa.estado);
                const tiempo = calcularTiempo(mesa);
                const esSeleccionada = mesaSeleccionada === mesa._id;

                return (
                  <button
                    key={mesa._id}
                    onClick={() => handleSeleccionarMesa(mesa._id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (mesa.estado === 'ocupada') setMesaResumen(mesa);
                    }}
                    className={`relative rounded-xl transition-all active:scale-95 ${
                      esSeleccionada ? 'ring-2 ring-white scale-105 z-10' : ''
                    }`}
                    style={{
                      backgroundColor: config.bg,
                      border: `2px solid ${config.border}`,
                      borderRadius: mesa.forma === 'redonda' ? '50%' : undefined,
                    }}
                  >
                    <div className="p-2 sm:p-3 text-center text-white">
                      {/* Numero mesa */}
                      <div className="text-lg sm:text-2xl font-bold leading-none">
                        {mesa.numero || mesa.nombre}
                      </div>

                      {/* Capacidad o estado */}
                      {mesa.estado === 'libre' ? (
                        <div className="flex items-center justify-center gap-0.5 mt-1 text-[10px] sm:text-xs opacity-90">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <span>{mesa.capacidad}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] sm:text-[10px] mt-0.5 opacity-80 font-medium uppercase">
                          {config.label}
                        </div>
                      )}

                      {/* Comensales */}
                      {mesa.estadoInfo?.numComensales > 0 && mesa.estado !== 'libre' && (
                        <div className="flex items-center justify-center gap-0.5 mt-0.5 text-[10px] opacity-75">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                          {mesa.estadoInfo.numComensales}
                        </div>
                      )}

                      {/* Nombre salon (solo en vista "todos") */}
                      {mesa._salonNombre && (
                        <div className="text-[9px] mt-0.5 opacity-50 truncate">{mesa._salonNombre}</div>
                      )}
                    </div>

                    {/* Badge tiempo ocupacion con color */}
                    {tiempo && (
                      <div
                        className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1 py-0.5 rounded-full text-white text-[9px] font-medium shadow-lg"
                        style={{ backgroundColor: tiempo.color }}
                      >
                        <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                        </svg>
                        {tiempo.texto}
                      </div>
                    )}

                    {/* Badge importe pendiente */}
                    {mesa.estadoInfo?.importePendiente > 0 && (
                      <div className="absolute -bottom-1.5 -right-1.5 px-1 py-0.5 rounded-full bg-green-600 text-white text-[9px] font-bold shadow-lg">
                        {mesa.estadoInfo.importePendiente.toFixed(0)}€
                      </div>
                    )}

                    {/* Indicador grupo */}
                    {mesa.grupo?.grupoId && (
                      <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M8 6l4-4 4 4M4 10h16M12 14v6" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* === VISTA PLANO (igual que TPV SelectorMesaModal) === */
          <div className="relative w-full h-full">
            {/* Controles zoom */}
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 bg-gray-800/90 rounded-lg p-1">
              <button onClick={() => setZoom(z => Math.min(z + 0.15, 2))} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 text-sm font-bold">+</button>
              <button onClick={() => setZoom(z => Math.max(z - 0.15, 0.15))} className="p-1.5 hover:bg-gray-700 rounded text-gray-300 text-sm font-bold">-</button>
              <div className="border-t border-gray-600 my-0.5" />
              <button onClick={handleAutoFit} className="p-1.5 hover:bg-gray-700 rounded text-gray-300" title="Ajustar a pantalla">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </button>
              <div className="text-[9px] text-gray-500 text-center">{Math.round(zoom * 100)}%</div>
            </div>

            {/* Leyenda */}
            <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1.5 bg-gray-800/90 rounded-lg px-2 py-1.5">
              {['libre', 'ocupada', 'reservada', 'cuenta_pedida'].map(estado => {
                const c = getEstadoConfig(estado);
                return (
                  <span key={estado} className="flex items-center gap-1 text-[9px] text-gray-300">
                    <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: c.bg }} />
                    {c.label}
                  </span>
                );
              })}
            </div>

            {/* Canvas del plano */}
            <div
              ref={canvasRef}
              className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="relative"
                style={{
                  width: planoSize.ancho,
                  height: planoSize.alto,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'top left',
                  backgroundImage: plano.imagenFondo ? `url(${plano.imagenFondo})` : undefined,
                  backgroundSize: 'cover',
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
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

                {/* Mesas en plano */}
                {mesas.map((mesa: any, index: number) => {
                  const config = getEstadoConfig(mesa.estado);
                  const pos = getMesaPosicion(mesa, index);
                  const size = getMesaSize(mesa);
                  const rotation = pos.rotacion || 0;
                  const tiempo = calcularTiempo(mesa);
                  const esSeleccionada = mesaSeleccionada === mesa._id;

                  return (
                    <div
                      key={mesa._id}
                      onClick={(e) => { e.stopPropagation(); handleSeleccionarMesa(mesa._id); }}
                      className={`absolute flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:z-10 ${
                        esSeleccionada ? 'ring-3 ring-white ring-offset-2 ring-offset-gray-900 z-20 scale-105' : ''
                      }`}
                      style={{
                        left: pos.x,
                        top: pos.y,
                        width: size.ancho,
                        height: size.alto,
                        backgroundColor: config.bg,
                        border: `3px solid ${config.border}`,
                        borderRadius: mesa.forma === 'redonda' || mesa.forma === 'ovalada' ? '50%' : '8px',
                        transform: `rotate(${rotation}deg)`,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      }}
                    >
                      {/* Numero */}
                      <span
                        className="text-lg font-bold leading-none text-white"
                        style={{ transform: `rotate(-${rotation}deg)` }}
                      >
                        {mesa.numero}
                      </span>

                      {/* Capacidad o estado */}
                      {mesa.estado === 'libre' ? (
                        <span
                          className="flex items-center gap-0.5 text-[10px] text-white opacity-90"
                          style={{ transform: `rotate(-${rotation}deg)` }}
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                          </svg>
                          {mesa.capacidad}
                        </span>
                      ) : (
                        <span
                          className="text-[9px] font-medium text-white opacity-80 uppercase"
                          style={{ transform: `rotate(-${rotation}deg)` }}
                        >
                          {config.label}
                        </span>
                      )}

                      {/* Badge tiempo con color */}
                      {tiempo && (
                        <div
                          className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1 py-0.5 rounded-full text-white text-[9px] font-medium shadow-lg"
                          style={{ transform: `rotate(-${rotation}deg)`, backgroundColor: tiempo.color }}
                        >
                          <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                          </svg>
                          {tiempo.texto}
                        </div>
                      )}

                      {/* Badge importe */}
                      {mesa.estadoInfo?.importePendiente > 0 && (
                        <div
                          className="absolute -bottom-2 -right-2 px-1 py-0.5 rounded-full bg-green-600 text-white text-[9px] font-bold shadow-lg"
                          style={{ transform: `rotate(-${rotation}deg)` }}
                        >
                          {mesa.estadoInfo.importePendiente.toFixed(0)}€
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Popup resumen cuenta de mesa */}
      {mesaResumen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setMesaResumen(null)}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-4 w-72 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-lg">
                Mesa {mesaResumen.numero || mesaResumen.nombre}
              </h3>
              <button onClick={() => setMesaResumen(null)} className="text-gray-400 hover:text-white text-lg">×</button>
            </div>
            <div className="space-y-2 text-sm">
              {mesaResumen.estadoInfo?.camareroId && (
                <div className="flex justify-between text-gray-400">
                  <span>Camarero</span>
                  <span className="text-white">{mesaResumen.estadoInfo.camareroNombre || '-'}</span>
                </div>
              )}
              {mesaResumen.estadoInfo?.numComensales > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Comensales</span>
                  <span className="text-white">{mesaResumen.estadoInfo.numComensales}</span>
                </div>
              )}
              {calcularTiempo(mesaResumen) && (
                <div className="flex justify-between text-gray-400">
                  <span>Tiempo</span>
                  <span className="font-medium" style={{ color: calcularTiempo(mesaResumen)!.color }}>
                    {calcularTiempo(mesaResumen)!.texto}
                  </span>
                </div>
              )}
              {mesaResumen.estadoInfo?.importePendiente > 0 && (
                <div className="flex justify-between text-gray-400 pt-1 border-t border-gray-700">
                  <span className="font-semibold">Total</span>
                  <span className="text-green-400 font-bold text-lg">{mesaResumen.estadoInfo.importePendiente.toFixed(2)}€</span>
                </div>
              )}
              {mesaResumen.estadoInfo?.notasServicio && (
                <div className="pt-1 border-t border-gray-700">
                  <span className="text-gray-500 text-xs">Notas:</span>
                  <p className="text-yellow-400 text-xs italic">{mesaResumen.estadoInfo.notasServicio}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => { handleSeleccionarMesa(mesaResumen._id); setMesaResumen(null); }}
              className="w-full mt-3 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm active:bg-blue-500"
            >
              Ir a mesa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
