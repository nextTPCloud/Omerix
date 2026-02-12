'use client';

import { useState, useMemo, useCallback } from 'react';
import { useComanderoStore, TipoServicioRapido } from '../../stores/comanderoStore';
import { useDataStore } from '../../stores/dataStore';
import type { Modificador } from '../../stores/dataStore';
import { useDragScroll } from '../../hooks/useDragScroll';

const TIPOS_SERVICIO: { tipo: TipoServicioRapido; label: string; icono: string }[] = [
  { tipo: 'barra', label: 'Barra', icono: '🍺' },
  { tipo: 'llevar', label: 'Para llevar', icono: '🥡' },
  { tipo: 'recoger', label: 'Recoger', icono: '🛍️' },
];

export default function PedidoRapidoView() {
  const {
    modoRapido, tipoServicioRapido,
    comandaActual, notasComanda,
    iniciarPedidoRapido, salirModoRapido,
    agregarProducto, quitarProducto, actualizarCantidad,
    setNotasComanda, limpiarComanda, enviarComanda,
  } = useComanderoStore();

  const productos = useDataStore((s) => s.productos) || [];
  const familias = useDataStore((s) => s.familias) || [];
  const [busqueda, setBusqueda] = useState('');
  const [familiaActiva, setFamiliaActiva] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const dragScroll = useDragScroll();

  // Favoritos: productos más recientes del localStorage
  const favoritos = useMemo(() => {
    try {
      const data = localStorage.getItem('tpv-favoritos-rapido');
      if (data) {
        const ids: string[] = JSON.parse(data);
        return ids.map(id => productos.find(p => p._id === id)).filter(Boolean).slice(0, 12);
      }
    } catch { /* ignore */ }
    return [];
  }, [productos]);

  // Guardar favorito al añadir producto
  const guardarFavorito = useCallback((productoId: string) => {
    try {
      const data = localStorage.getItem('tpv-favoritos-rapido');
      let ids: string[] = data ? JSON.parse(data) : [];
      ids = [productoId, ...ids.filter(id => id !== productoId)].slice(0, 20);
      localStorage.setItem('tpv-favoritos-rapido', JSON.stringify(ids));
    } catch { /* ignore */ }
  }, []);

  // Familias raiz
  const familiasRaiz = useMemo(() => {
    return familias.filter((f: any) => !f.familiaPadreId && !f.familiaId);
  }, [familias]);

  // Filtrado de productos
  const productosFiltrados = useMemo(() => {
    return productos.filter((p: any) => {
      if (busqueda) {
        return p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.codigo?.toLowerCase().includes(busqueda.toLowerCase());
      }
      if (familiaActiva) {
        const pFamilia = p.familiaId?._id || p.familiaId;
        return pFamilia === familiaActiva;
      }
      return true;
    }).slice(0, 60);
  }, [productos, busqueda, familiaActiva]);

  const totalLineas = comandaActual.reduce((acc, l) => acc + l.cantidad, 0);
  const totalImporte = useMemo(() => {
    return comandaActual.reduce((acc, l) => {
      const prod = productos.find(p => p._id === l.productoId);
      if (!prod) return acc;
      const precio = useDataStore.getState().calcularPrecioConDetalles(prod);
      const modsExtra = (l.modificadores || []).reduce((s, m) => s + m.precioExtra, 0);
      return acc + (precio.precioFinal + modsExtra) * l.cantidad;
    }, 0);
  }, [comandaActual, productos]);

  const handleAgregarProducto = (producto: any) => {
    agregarProducto({ productoId: producto._id, nombre: producto.nombre });
    guardarFavorito(producto._id);
  };

  const handleEnviar = async () => {
    setEnviando(true);
    setMensaje('');
    try {
      const ok = await enviarComanda();
      if (ok) {
        setMensaje('Pedido enviado');
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setMensaje('Error al enviar');
      }
    } finally {
      setEnviando(false);
    }
  };

  // Si no ha seleccionado tipo de servicio, mostrar selector
  if (!modoRapido) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-1">Pedido Rápido</h2>
          <p className="text-sm text-gray-400">Selecciona el tipo de servicio</p>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          {TIPOS_SERVICIO.map(ts => (
            <button
              key={ts.tipo}
              onClick={() => iniciarPedidoRapido(ts.tipo)}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 transition-all border-2 border-gray-700 hover:border-blue-500"
            >
              <span className="text-4xl">{ts.icono}</span>
              <span className="text-sm font-semibold text-white">{ts.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Modo activo: interfaz de pedido rápido
  const tipoLabel = TIPOS_SERVICIO.find(t => t.tipo === tipoServicioRapido)?.label || '';
  const tipoIcono = TIPOS_SERVICIO.find(t => t.tipo === tipoServicioRapido)?.icono || '';

  return (
    <div className="flex flex-col h-full">
      {/* Header tipo servicio */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{tipoIcono}</span>
          <span className="font-bold text-sm text-white">{tipoLabel}</span>
          {mensaje && (
            <span className={`text-[10px] ml-2 ${mensaje.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {mensaje}
            </span>
          )}
        </div>
        <button
          onClick={salirModoRapido}
          className="px-2 py-1 rounded-lg bg-gray-700 text-gray-300 text-xs hover:bg-gray-600"
        >
          ← Volver
        </button>
      </div>

      {/* Layout principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel productos */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Busqueda */}
          <div className="p-1.5 flex-shrink-0">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setFamiliaActiva(null); }}
              placeholder="Buscar producto..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-white text-xs"
            />
          </div>

          {/* Familias */}
          {!busqueda && (
            <div
              ref={dragScroll.ref}
              {...dragScroll.handlers}
              className="flex gap-1 px-1.5 pb-1.5 overflow-x-auto flex-shrink-0 scrollbar-hide select-none"
            >
              <button
                onClick={() => setFamiliaActiva(null)}
                className={`px-2 py-1 rounded-full text-[10px] whitespace-nowrap flex-shrink-0 ${
                  !familiaActiva ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                {favoritos.length > 0 ? '★ Frecuentes' : 'Todos'}
              </button>
              {familiasRaiz.map((f: any) => (
                <button
                  key={f._id}
                  onClick={() => setFamiliaActiva(f._id)}
                  className={`px-2 py-1 rounded-full text-[10px] whitespace-nowrap flex-shrink-0 ${
                    familiaActiva === f._id ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                  style={f.color && familiaActiva !== f._id ? { borderLeft: `3px solid ${f.color}` } : undefined}
                >
                  {f.nombre}
                </button>
              ))}
            </div>
          )}

          {/* Grid productos */}
          <div className="flex-1 overflow-y-auto p-1.5">
            {/* Favoritos si no hay filtro activo */}
            {!busqueda && !familiaActiva && favoritos.length > 0 && (
              <div className="mb-2">
                <div className="text-[9px] text-gray-500 uppercase font-semibold px-1 mb-1">Frecuentes</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                  {favoritos.map((p: any) => {
                    const precioInfo = useDataStore.getState().calcularPrecioConDetalles(p);
                    return (
                      <button
                        key={p._id}
                        onClick={() => handleAgregarProducto(p)}
                        className="p-1.5 rounded-lg bg-blue-900/30 border border-blue-800/40 text-left hover:bg-blue-800/40 active:bg-blue-700/40 transition-colors"
                      >
                        <div className="text-[10px] font-medium line-clamp-2 leading-tight text-white">{p.nombre}</div>
                        <div className="text-[9px] text-blue-400 mt-0.5">{precioInfo.precioFinal.toFixed(2)}€</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Todos los productos */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
              {productosFiltrados.map((p: any) => {
                const precioInfo = useDataStore.getState().calcularPrecioConDetalles(p);
                return (
                  <button
                    key={p._id}
                    onClick={() => handleAgregarProducto(p)}
                    className={`p-1.5 rounded-lg text-left hover:bg-gray-700 active:bg-gray-600 transition-colors ${
                      precioInfo.esHappyHour ? 'bg-amber-900/30 ring-1 ring-amber-500/40' : 'bg-gray-800'
                    }`}
                  >
                    <div className="text-[10px] font-medium line-clamp-2 leading-tight">{p.nombre}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">{precioInfo.precioFinal.toFixed(2)}€</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel resumen pedido */}
        <div className="w-56 md:w-72 bg-gray-900 border-l border-gray-700 flex flex-col">
          <div className="px-2 py-1.5 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <h3 className="font-medium text-sm text-white">
              Pedido
              {totalLineas > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-600 text-[10px]">{totalLineas}</span>
              )}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {comandaActual.length === 0 ? (
              <p className="text-gray-500 text-xs text-center mt-8">Añade productos</p>
            ) : (
              comandaActual.map((linea, i) => {
                const prod = productos.find(p => p._id === linea.productoId);
                const precio = prod ? useDataStore.getState().calcularPrecioConDetalles(prod).precioFinal : 0;
                return (
                  <div key={i} className="p-1.5 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate text-white">{linea.nombre}</div>
                        <div className="text-[9px] text-gray-400">{(precio * linea.cantidad).toFixed(2)}€</div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => actualizarCantidad(i, linea.cantidad - 1)}
                          className="w-6 h-6 rounded bg-gray-700 text-xs flex items-center justify-center">-</button>
                        <span className="w-5 text-center text-xs font-medium">{linea.cantidad}</span>
                        <button onClick={() => actualizarCantidad(i, linea.cantidad + 1)}
                          className="w-6 h-6 rounded bg-gray-700 text-xs flex items-center justify-center">+</button>
                      </div>
                      <button onClick={() => quitarProducto(i)}
                        className="w-6 h-6 rounded bg-red-800 text-xs flex items-center justify-center flex-shrink-0">×</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer con total y enviar */}
          <div className="p-2 space-y-1.5 border-t border-gray-700 flex-shrink-0">
            {comandaActual.length > 0 && (
              <>
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="text-lg font-bold text-green-400">{totalImporte.toFixed(2)}€</span>
                </div>
                <textarea
                  value={notasComanda}
                  onChange={(e) => setNotasComanda(e.target.value)}
                  placeholder="Notas..."
                  rows={1}
                  className="w-full px-2 py-1 rounded-lg bg-gray-800 border border-gray-600 text-yellow-300 text-[10px] placeholder-gray-500 resize-none"
                />
              </>
            )}
            <div className="flex gap-1.5">
              <button onClick={limpiarComanda} disabled={comandaActual.length === 0}
                className="flex-1 py-2.5 rounded-lg bg-gray-700 text-xs font-medium disabled:opacity-50">
                Limpiar
              </button>
              <button onClick={handleEnviar} disabled={enviando || comandaActual.length === 0}
                className="flex-[2] py-2.5 rounded-lg bg-green-600 text-sm font-bold disabled:opacity-50 active:bg-green-500">
                {enviando ? 'Enviando...' : 'Enviar a Cocina'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
