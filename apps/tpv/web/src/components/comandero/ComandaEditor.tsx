'use client';

import { useState, useMemo, useCallback } from 'react';
import { useComanderoStore } from '../../stores/comanderoStore';
import { useDataStore } from '../../stores/dataStore';
import type { Modificador } from '../../stores/dataStore';
import { useDragScroll } from '../../hooks/useDragScroll';

export default function ComandaEditor() {
  const { comandaActual, mesaSeleccionada, mesas, notasComanda, agregarProducto, quitarProducto, actualizarCantidad, actualizarNotas, setNotasComanda, enviarComanda, limpiarComanda } = useComanderoStore();
  const [busqueda, setBusqueda] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mostrarComanda, setMostrarComanda] = useState(false);
  const [editandoNotaIndex, setEditandoNotaIndex] = useState<number | null>(null);
  const [notaTemp, setNotaTemp] = useState('');

  // Estado para modal de modificadores
  const [productoModificadores, setProductoModificadores] = useState<any>(null);
  const [modificadoresDisponibles, setModificadoresDisponibles] = useState<Modificador[]>([]);
  const [seleccionMods, setSeleccionMods] = useState<Map<string, number>>(new Map());

  // Obtener productos del dataStore del TPV
  const productos = useDataStore((s: any) => s.productos) || [];
  const familias = useDataStore((s: any) => s.familias) || [];
  const [familiaActiva, setFamiliaActiva] = useState<string | null>(null);
  const [familiaPadreNavegacion, setFamiliaPadreNavegacion] = useState<string | null>(null);

  // Estado de favoritos
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);

  // Drag scroll para familias
  const dragScroll = useDragScroll();

  const mesaActual = mesas.find((m: any) => m._id === mesaSeleccionada);

  // Productos favoritos basados en historial local
  const favoritos = useMemo(() => {
    try {
      const data = localStorage.getItem('tpv-comandero-favoritos');
      if (data) {
        const ids: string[] = JSON.parse(data);
        return ids.map(id => productos.find((p: any) => p._id === id)).filter(Boolean).slice(0, 12);
      }
    } catch { /* ignore */ }
    return [];
  }, [productos]);

  const guardarFavorito = useCallback((productoId: string) => {
    try {
      const data = localStorage.getItem('tpv-comandero-favoritos');
      let ids: string[] = data ? JSON.parse(data) : [];
      ids = [productoId, ...ids.filter(id => id !== productoId)].slice(0, 20);
      localStorage.setItem('tpv-comandero-favoritos', JSON.stringify(ids));
    } catch { /* ignore */ }
  }, []);

  // Helpers de jerarquia de familias
  const getFamiliasHijas = useCallback((padreId: string) => {
    return familias.filter((f: any) => f.familiaPadreId === padreId || f.familiaId === padreId);
  }, [familias]);

  const tieneSubfamilias = useCallback((familiaId: string) => {
    return familias.some((f: any) => f.familiaPadreId === familiaId || f.familiaId === familiaId);
  }, [familias]);

  const getFamiliasDescendientes = useCallback((familiaId: string): string[] => {
    const hijas = getFamiliasHijas(familiaId);
    const ids = [familiaId];
    for (const hija of hijas) {
      ids.push(...getFamiliasDescendientes(hija._id));
    }
    return ids;
  }, [getFamiliasHijas]);

  // Familias a mostrar segun nivel de navegacion
  const familiasVisibles = useMemo(() => {
    if (familiaPadreNavegacion) {
      return familias.filter((f: any) => f.familiaPadreId === familiaPadreNavegacion || f.familiaId === familiaPadreNavegacion);
    }
    // Solo familias raiz (sin padre)
    return familias.filter((f: any) => !f.familiaPadreId && !f.familiaId);
  }, [familias, familiaPadreNavegacion]);

  // Filtrado de productos
  const productosFiltrados = useMemo(() => {
    return productos.filter((p: any) => {
      if (busqueda) {
        return p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.codigo?.toLowerCase().includes(busqueda.toLowerCase());
      }
      // Filtrar por familia activa y todas sus descendientes
      if (familiaActiva) {
        const famIds = getFamiliasDescendientes(familiaActiva);
        const pFamilia = p.familiaId?._id || p.familiaId;
        return pFamilia && famIds.includes(pFamilia);
      }
      // Si navegando dentro de una familia padre, mostrar productos de ella y descendientes
      if (familiaPadreNavegacion) {
        const famIds = getFamiliasDescendientes(familiaPadreNavegacion);
        const pFamilia = p.familiaId?._id || p.familiaId;
        return pFamilia && famIds.includes(pFamilia);
      }
      return true;
    }).slice(0, 50);
  }, [productos, busqueda, familiaActiva, familiaPadreNavegacion, getFamiliasDescendientes]);

  const totalLineas = comandaActual.reduce((acc, l) => acc + l.cantidad, 0);

  // Click en familia: si tiene hijas, navegar; si no, filtrar
  const handleClickFamilia = (familia: any) => {
    setMostrarFavoritos(false);
    if (tieneSubfamilias(familia._id)) {
      setFamiliaPadreNavegacion(familia._id);
      setFamiliaActiva(null);
    } else {
      setFamiliaActiva(familia._id);
    }
  };

  // Volver un nivel en la jerarquia
  const handleVolverFamilia = () => {
    if (!familiaPadreNavegacion) return;
    const padreActual = familias.find((f: any) => f._id === familiaPadreNavegacion);
    const padreDelPadre = padreActual?.familiaPadreId || padreActual?.familiaId || null;
    setFamiliaPadreNavegacion(padreDelPadre);
    setFamiliaActiva(null);
  };

  // Manejar click en producto - verificar si tiene modificadores
  const handleClickProducto = (producto: any) => {
    if (!mesaSeleccionada) {
      setMensaje('Selecciona una mesa primero');
      setTimeout(() => setMensaje(''), 2000);
      return;
    }

    guardarFavorito(producto._id);
    const dataStore = useDataStore.getState();
    const tieneModificadores = dataStore.tieneModificadores(producto);

    if (tieneModificadores) {
      const mods = dataStore.obtenerModificadoresProducto(producto);
      setProductoModificadores(producto);
      setModificadoresDisponibles(mods);
      setSeleccionMods(new Map());
    } else {
      agregarProducto({ productoId: producto._id, nombre: producto.nombre });
    }
  };

  // Confirmar modificadores seleccionados
  const handleConfirmarModificadores = () => {
    if (!productoModificadores) return;

    const modsSeleccionados: { modificadorId: string; nombre: string; precioExtra: number; label: string }[] = [];
    seleccionMods.forEach((cantidad, modId) => {
      const mod = modificadoresDisponibles.find(m => m._id === modId);
      if (mod && cantidad > 0) {
        const nombreMod = mod.nombreCorto || mod.nombre;
        // Agregar tantas veces como cantidad (para multiples)
        for (let i = 0; i < cantidad; i++) {
          modsSeleccionados.push({
            modificadorId: mod._id,
            nombre: mod.nombre,
            precioExtra: mod.precioExtra || 0,
            label: cantidad > 1 && i === 0 ? `${cantidad}x ${nombreMod}` : (cantidad > 1 ? '' : nombreMod),
          });
        }
      }
    });

    // Construir nombre para display
    const labels = modsSeleccionados.filter(m => m.label).map(m => m.label);
    const nombreCompleto = labels.length > 0
      ? `${productoModificadores.nombre} (${labels.join(', ')})`
      : productoModificadores.nombre;

    agregarProducto({
      productoId: productoModificadores._id,
      nombre: nombreCompleto,
      modificadores: modsSeleccionados.length > 0 ? modsSeleccionados.map(m => ({
        modificadorId: m.modificadorId,
        nombre: m.nombre,
        precioExtra: m.precioExtra,
      })) : undefined,
    });

    setProductoModificadores(null);
    setModificadoresDisponibles([]);
    setSeleccionMods(new Map());
  };

  // Sin modificadores
  const handleSinModificadores = () => {
    if (!productoModificadores) return;
    agregarProducto({ productoId: productoModificadores._id, nombre: productoModificadores.nombre });
    setProductoModificadores(null);
    setModificadoresDisponibles([]);
    setSeleccionMods(new Map());
  };

  // Toggle modificador simple
  const toggleMod = (mod: Modificador) => {
    setSeleccionMods(prev => {
      const m = new Map(prev);
      if (m.has(mod._id)) { m.delete(mod._id); } else { m.set(mod._id, 1); }
      return m;
    });
  };

  // Incrementar/decrementar modificador multiple
  const incMod = (mod: Modificador) => {
    setSeleccionMods(prev => {
      const m = new Map(prev);
      const actual = m.get(mod._id) || 0;
      if (actual < (mod.cantidadMaxima || 10)) m.set(mod._id, actual + 1);
      return m;
    });
  };
  const decMod = (mod: Modificador) => {
    setSeleccionMods(prev => {
      const m = new Map(prev);
      const actual = m.get(mod._id) || 0;
      if (actual > 1) { m.set(mod._id, actual - 1); } else { m.delete(mod._id); }
      return m;
    });
  };

  // Agrupar modificadores por grupo
  const modsPorGrupo = useMemo(() => {
    const grupos = new Map<string, { nombre: string; color?: string; mods: Modificador[] }>();
    const sinGrupo: Modificador[] = [];
    modificadoresDisponibles.forEach(mod => {
      if (mod.grupoId && typeof mod.grupoId === 'object') {
        const gId = mod.grupoId._id;
        if (!grupos.has(gId)) {
          grupos.set(gId, { nombre: mod.grupoId.nombre, color: mod.grupoId.color, mods: [] });
        }
        grupos.get(gId)!.mods.push(mod);
      } else {
        sinGrupo.push(mod);
      }
    });
    return { grupos, sinGrupo };
  }, [modificadoresDisponibles]);

  const handleEnviar = async () => {
    if (!mesaSeleccionada) {
      setMensaje('Selecciona una mesa primero');
      return;
    }
    setEnviando(true);
    setMensaje('');
    try {
      const ok = await enviarComanda();
      if (ok) {
        setMensaje('Comanda enviada a cocina');
        setMostrarComanda(false);
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setMensaje('Error al enviar comanda');
      }
    } finally {
      setEnviando(false);
    }
  };

  // Abrir editor de nota para una linea
  const handleEditarNota = (index: number) => {
    setNotaTemp(comandaActual[index]?.notas || '');
    setEditandoNotaIndex(index);
  };

  const handleGuardarNota = () => {
    if (editandoNotaIndex !== null) {
      actualizarNotas(editandoNotaIndex, notaTemp.trim());
      setEditandoNotaIndex(null);
      setNotaTemp('');
    }
  };

  // Componente de linea de comanda reutilizable
  const LineaComanda = ({ linea, index }: { linea: any; index: number }) => {
    const alergenos = useDataStore.getState().getAlergenosProducto(linea.productoId);
    return (
      <div className="p-1.5 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm truncate">{linea.nombre}</div>
            {linea.modificadores?.length > 0 && (
              <div className="text-[9px] text-purple-400 truncate">{linea.modificadores.map((m: any) => m.nombre).join(', ')}</div>
            )}
            {alergenos.length > 0 && (
              <div className="flex gap-0.5 flex-wrap mt-0.5">
                {alergenos.map((a: any) => (
                  <span key={a._id} className="text-[7px] px-0.5 bg-red-900/40 text-red-300 rounded">
                    {a.icono || a.nombre.substring(0, 3).toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => actualizarCantidad(index, linea.cantidad - 1)}
              className="w-6 h-6 rounded bg-gray-700 text-xs flex items-center justify-center"
            >-</button>
            <span className="w-5 text-center text-xs font-medium">{linea.cantidad}</span>
            <button
              onClick={() => actualizarCantidad(index, linea.cantidad + 1)}
              className="w-6 h-6 rounded bg-gray-700 text-xs flex items-center justify-center"
            >+</button>
          </div>
          {/* Boton nota */}
          <button
            onClick={() => handleEditarNota(index)}
            className={`w-6 h-6 rounded text-xs flex items-center justify-center flex-shrink-0 ${
              linea.notas ? 'bg-yellow-700 text-yellow-200' : 'bg-gray-700 text-gray-400'
            }`}
            title="Nota para cocina"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => quitarProducto(index)}
            className="w-6 h-6 rounded bg-red-800 text-xs flex items-center justify-center flex-shrink-0"
          >×</button>
        </div>
        {/* Nota visible bajo la linea */}
        {linea.notas && (
          <div className="mt-1 px-1 text-[9px] text-yellow-400 italic truncate">
            {linea.notas}
          </div>
        )}
      </div>
    );
  };

  // Renderizar un modificador en el modal
  const renderModificador = (mod: Modificador) => {
    const seleccionado = seleccionMods.has(mod._id);
    const cantidad = seleccionMods.get(mod._id) || 0;

    return (
      <div
        key={mod._id}
        className={`flex items-center justify-between p-2.5 rounded-lg border-2 transition-all ${
          seleccionado ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 bg-gray-800'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {mod.color && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: mod.color }} />}
          <div className="min-w-0">
            <span className="text-sm text-white truncate block">{mod.nombre}</span>
            {mod.tipo !== 'gratis' && mod.precioExtra > 0 && (
              <span className={`text-[10px] ${mod.tipo === 'cargo' ? 'text-orange-400' : 'text-green-400'}`}>
                {mod.tipo === 'cargo' ? '+' : '-'}{mod.precioExtra.toFixed(2)}€
              </span>
            )}
          </div>
        </div>

        {mod.esMultiple ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => decMod(mod)} disabled={cantidad === 0}
              className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-white disabled:opacity-30">
              -
            </button>
            <span className="w-5 text-center text-sm font-semibold">{cantidad}</span>
            <button onClick={() => incMod(mod)} disabled={cantidad >= (mod.cantidadMaxima || 10)}
              className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white disabled:opacity-30">
              +
            </button>
          </div>
        ) : (
          <button onClick={() => toggleMod(mod)}
            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              seleccionado ? 'border-purple-500 bg-purple-600 text-white' : 'border-gray-600 bg-gray-700'
            }`}>
            {seleccionado && <span className="text-sm font-bold">✓</span>}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header con mesa seleccionada */}
      <div className="px-2 py-1.5 sm:p-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-xs text-gray-400">Mesa:</span>
            <span className="font-bold text-sm sm:text-lg">
              {mesaActual ? (mesaActual.numero || mesaActual.nombre) : 'Sin seleccionar'}
            </span>
            {mesaActual?.estadoInfo?.numComensales > 0 && (
              <span className="text-[10px] text-gray-400">
                ({mesaActual.estadoInfo.numComensales} pax)
              </span>
            )}
          </div>
          {mensaje && (
            <p className={`text-[10px] sm:text-xs ${mensaje.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {mensaje}
            </p>
          )}
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel izquierdo: Productos */}
        <div className={`flex-1 flex flex-col min-w-0 ${mostrarComanda ? 'hidden sm:flex' : 'flex'}`}>
          {/* Busqueda */}
          <div className="p-1.5 sm:p-2 flex-shrink-0">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setFamiliaActiva(null); }}
              placeholder="Buscar producto..."
              className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-xs sm:text-sm"
            />
          </div>

          {/* Familias - scroll horizontal con drag */}
          {!busqueda && (
            <div
              ref={dragScroll.ref}
              {...dragScroll.handlers}
              className="flex gap-1 px-1.5 pb-1.5 overflow-x-auto flex-shrink-0 scrollbar-hide select-none"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Boton Volver (cuando estamos en subfamilias) */}
              {familiaPadreNavegacion && (
                <button
                  onClick={handleVolverFamilia}
                  className="px-2 py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0 bg-gray-600 text-white flex items-center gap-0.5"
                >
                  ← Volver
                </button>
              )}
              {/* Boton Favoritos */}
              {favoritos.length > 0 && (
                <button
                  onClick={() => { setMostrarFavoritos(true); setFamiliaActiva(null); }}
                  className={`px-2 py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0 ${
                    mostrarFavoritos ? 'bg-amber-600' : 'bg-gray-700'
                  }`}
                >
                  ★ Favoritos
                </button>
              )}
              {/* Boton Todas/nombre padre */}
              <button
                onClick={() => { setFamiliaActiva(null); setMostrarFavoritos(false); }}
                className={`px-2 py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0 ${
                  !familiaActiva && !mostrarFavoritos ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                {familiaPadreNavegacion
                  ? familias.find((f: any) => f._id === familiaPadreNavegacion)?.nombre || 'Todas'
                  : 'Todas'}
              </button>
              {familiasVisibles.map((f: any) => {
                const tieneHijas = tieneSubfamilias(f._id);
                return (
                  <button
                    key={f._id}
                    onClick={() => handleClickFamilia(f)}
                    className={`px-2 py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0 flex items-center gap-0.5 ${
                      familiaActiva === f._id ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                    style={f.color && familiaActiva !== f._id ? { borderLeft: `3px solid ${f.color}` } : undefined}
                  >
                    {f.nombre}
                    {tieneHijas && <span className="opacity-50">›</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Grid productos */}
          <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 relative">
            {!mesaSeleccionada && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/60 rounded-lg">
                <p className="text-sm text-gray-400 font-medium px-4 text-center">Selecciona una mesa para poder añadir productos</p>
              </div>
            )}
            <div className={`grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-1.5 ${!mesaSeleccionada ? 'opacity-40 pointer-events-none' : ''}`}>
              {(mostrarFavoritos ? favoritos : productosFiltrados).map((p: any) => {
                const tieneModsFlag = useDataStore.getState().tieneModificadores(p);
                const precioInfo = useDataStore.getState().calcularPrecioConDetalles(p);
                const tieneOferta = precioInfo.origen === 'oferta';
                return (
                  <button
                    key={p._id}
                    onClick={() => handleClickProducto(p)}
                    className={`p-1.5 sm:p-2 rounded-lg text-left hover:bg-gray-700 active:bg-gray-600 transition-colors relative ${
                      precioInfo.esHappyHour ? 'bg-amber-900/30 ring-1 ring-amber-500/40' : 'bg-gray-800'
                    }`}
                  >
                    <div className="text-[10px] sm:text-xs font-medium line-clamp-2 leading-tight">{p.nombre}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {tieneOferta ? (
                        <>
                          <span className="text-[9px] sm:text-xs text-gray-500 line-through">{precioInfo.precioBase.toFixed(2)}€</span>
                          <span className={`text-[9px] sm:text-xs font-bold ${precioInfo.esHappyHour ? 'text-amber-400' : 'text-green-400'}`}>
                            {precioInfo.precioFinal.toFixed(2)}€
                          </span>
                        </>
                      ) : (
                        <span className="text-[9px] sm:text-xs text-gray-400">{precioInfo.precioFinal.toFixed(2)}€</span>
                      )}
                    </div>
                    {p.restauracion?.alergenosIds?.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap mt-0.5">
                        {useDataStore.getState().getAlergenosProducto(p._id).slice(0, 3).map((a: any) => (
                          <span key={a._id} className="text-[7px] px-0.5 bg-red-900/40 text-red-300 rounded">
                            {a.icono || a.nombre.substring(0, 3).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Badge Happy Hour */}
                    {precioInfo.esHappyHour && (
                      <div className="absolute top-0.5 left-0.5 flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-500 text-[7px] font-bold text-black">
                        <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                        </svg>
                        HH
                      </div>
                    )}
                    {/* Indicador de modificadores */}
                    {tieneModsFlag && (
                      <div className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-purple-500`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel derecho: Comanda actual */}
        <div className={`
          ${mostrarComanda
            ? 'fixed inset-0 z-50 flex flex-col sm:relative sm:inset-auto sm:z-auto'
            : 'hidden sm:flex sm:flex-col'
          }
          w-full sm:w-56 md:w-72 bg-gray-900 sm:border-l sm:border-gray-700
        `}>
          <div className="px-2 py-1.5 border-b border-gray-700 flex items-center justify-between flex-shrink-0 bg-gray-800 sm:bg-transparent">
            <h3 className="font-medium text-sm">
              Comanda
              {comandaActual.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-600 text-[10px]">{totalLineas}</span>
              )}
            </h3>
            <button onClick={() => setMostrarComanda(false)} className="sm:hidden px-2 py-1 rounded bg-gray-700 text-xs">
              Volver
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {comandaActual.length === 0 ? (
              <p className="text-gray-500 text-xs text-center mt-8">Sin productos</p>
            ) : (
              comandaActual.map((linea, i) => (
                <LineaComanda key={i} linea={linea} index={i} />
              ))
            )}
          </div>

          <div className="p-2 space-y-1.5 border-t border-gray-700 flex-shrink-0">
            {/* Notas generales de la comanda */}
            {comandaActual.length > 0 && (
              <textarea
                value={notasComanda}
                onChange={(e) => setNotasComanda(e.target.value)}
                placeholder="Notas para cocina..."
                rows={2}
                className="w-full px-2 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-yellow-300 text-[10px] sm:text-xs placeholder-gray-500 resize-none"
              />
            )}
            {mensaje && (
              <p className={`text-[10px] text-center ${mensaje.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {mensaje}
              </p>
            )}
            <div className="flex gap-1.5">
              <button onClick={limpiarComanda} disabled={comandaActual.length === 0}
                className="flex-1 py-2 rounded-lg bg-gray-700 text-xs font-medium disabled:opacity-50 active:bg-gray-600">
                Limpiar
              </button>
              <button onClick={handleEnviar} disabled={enviando || comandaActual.length === 0 || !mesaSeleccionada}
                className="flex-1 py-2 rounded-lg bg-green-600 text-xs font-bold disabled:opacity-50 active:bg-green-500">
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAB para ver comanda en movil */}
      {!mostrarComanda && (
        <button
          onClick={() => setMostrarComanda(true)}
          className="sm:hidden fixed bottom-16 right-3 z-40 flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-blue-600 text-white shadow-xl active:bg-blue-500"
        >
          <span className="text-sm">Ver comanda</span>
          {totalLineas > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-blue-600 text-xs font-bold flex items-center justify-center">
              {totalLineas}
            </span>
          )}
        </button>
      )}

      {/* Modal de edicion de nota por linea */}
      {editandoNotaIndex !== null && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-end sm:items-center justify-center" onClick={() => setEditandoNotaIndex(null)}>
          <div className="bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border-t sm:border border-gray-700 p-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-white mb-1">
              Nota para: {comandaActual[editandoNotaIndex]?.nombre}
            </h3>
            <p className="text-[10px] text-gray-400 mb-3">Ej: sin sal, poco hecho, sin cebolla...</p>
            <textarea
              autoFocus
              value={notaTemp}
              onChange={(e) => setNotaTemp(e.target.value)}
              placeholder="Escribe la nota para cocina..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-yellow-300 text-sm placeholder-gray-500 resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setEditandoNotaIndex(null); setNotaTemp(''); }}
                className="flex-1 py-2.5 bg-gray-700 text-gray-200 font-medium rounded-xl text-sm active:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Permitir borrar nota pasando string vacio
                  handleGuardarNota();
                }}
                className="flex-1 py-2.5 bg-yellow-600 text-white font-semibold rounded-xl text-sm active:bg-yellow-500"
              >
                Guardar
              </button>
            </div>
            {notaTemp && (
              <button
                onClick={() => {
                  if (editandoNotaIndex !== null) {
                    actualizarNotas(editandoNotaIndex, '');
                    setEditandoNotaIndex(null);
                    setNotaTemp('');
                  }
                }}
                className="w-full mt-2 py-1.5 text-red-400 text-xs active:text-red-300"
              >
                Quitar nota
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de modificadores (dark theme, mobile-friendly) */}
      {productoModificadores && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center">
          <div className="bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col border-t sm:border border-gray-700">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-white truncate">{productoModificadores.nombre}</h3>
                <p className="text-[10px] text-gray-400">Selecciona modificadores</p>
              </div>
              <button onClick={() => { setProductoModificadores(null); setSeleccionMods(new Map()); }}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 flex-shrink-0">
                ×
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {Array.from(modsPorGrupo.grupos.entries()).map(([grupoId, grupo]) => (
                <div key={grupoId}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {grupo.color && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: grupo.color }} />}
                    <label className="text-xs font-medium text-gray-400">{grupo.nombre}</label>
                  </div>
                  <div className="space-y-1.5">
                    {grupo.mods.map(renderModificador)}
                  </div>
                </div>
              ))}

              {modsPorGrupo.sinGrupo.length > 0 && (
                <div>
                  {modsPorGrupo.grupos.size > 0 && (
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Otros</label>
                  )}
                  <div className="space-y-1.5">
                    {modsPorGrupo.sinGrupo.map(renderModificador)}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-700 flex gap-2 flex-shrink-0">
              <button onClick={handleSinModificadores}
                className="flex-1 py-2.5 bg-gray-700 text-gray-200 font-medium rounded-xl text-sm active:bg-gray-600">
                Sin modificadores
              </button>
              <button onClick={handleConfirmarModificadores}
                className="flex-1 py-2.5 bg-purple-600 text-white font-semibold rounded-xl text-sm active:bg-purple-500">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
