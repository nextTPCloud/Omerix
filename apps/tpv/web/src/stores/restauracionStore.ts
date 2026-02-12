// ===========================================
// STORE DE RESTAURACIÓN TPV
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  restauracionService,
  Salon,
  Mesa,
  Camarero,
  Sugerencia,
} from '../services/restauracion.service';

interface RestauracionState {
  // Datos cargados
  salones: Salon[];
  mesas: Mesa[];
  camareros: Camarero[];
  sugerenciasActuales: Sugerencia[];

  // Selección actual (para la venta en curso)
  mesaSeleccionada: Mesa | null;
  camareroSeleccionado: Camarero | null;
  salonActivo: string | null;

  // Estado de carga
  cargando: boolean;
  ultimaCarga: Date | null;

  // Acción para inicializar datos desde sync
  inicializarDesdeSync: (datos: {
    salones?: any[];
    mesas?: any[];
    camareros?: any[];
    sugerencias?: any[];
  }) => void;

  // Acciones de carga
  cargarDatosRestauracion: () => Promise<void>;
  cargarMesasSalon: (salonId: string) => Promise<void>;
  refrescarMesas: () => Promise<void>;

  // Acciones de selección
  seleccionarMesa: (mesa: Mesa | null) => void;
  seleccionarCamarero: (camarero: Camarero | null) => void;
  setSalonActivo: (salonId: string | null) => void;

  // Acciones de mesa
  ocuparMesa: (mesaId: string, ventaId: string, camareroId?: string) => Promise<boolean>;
  liberarMesa: (mesaId: string) => Promise<boolean>;

  // Acciones de sugerencias
  cargarSugerencias: (productoId: string) => Promise<void>;
  limpiarSugerencias: () => void;

  // Limpiar selección (al finalizar venta)
  limpiarSeleccion: () => void;
}

export const useRestauracionStore = create<RestauracionState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      salones: [],
      mesas: [],
      camareros: [],
      sugerenciasActuales: [],
      mesaSeleccionada: null,
      camareroSeleccionado: null,
      salonActivo: null,
      cargando: false,
      ultimaCarga: null,

      // Inicializar datos desde sync (evita llamadas API adicionales)
      inicializarDesdeSync: (datos) => {
        const { salones = [], mesas = [], camareros = [] } = datos;

        // Transformar datos del sync al formato esperado
        const salonesTransformados: Salon[] = salones.map((s: any) => ({
          _id: s._id?.toString() || s._id,
          nombre: s.nombre,
          color: s.color,
          capacidadTotal: s.capacidadTotal || 0,
          activo: s.activo !== false,
          plano: s.plano ? {
            ancho: s.plano.ancho || 800,
            alto: s.plano.alto || 600,
            escala: s.plano.escala || 1,
            imagenFondo: s.plano.imagenFondo,
          } : undefined,
        }));

        const mesasTransformadas: Mesa[] = mesas.map((m: any) => {
          // Calcular tamaño correctamente
          // Si dimensiones viene en unidades pequeñas (1-10), multiplicar por 40
          // Si ya viene en pixeles (> 10), usar directamente
          let tamano = { ancho: 80, alto: 80 };
          if (m.dimensiones) {
            const anchoRaw = m.dimensiones.ancho || 2;
            const altoRaw = m.dimensiones.alto || 2;
            // Si los valores son pequeños (< 20), son unidades y hay que escalar
            // Si son grandes, ya son pixeles
            const esUnidades = anchoRaw <= 20 && altoRaw <= 20;
            if (esUnidades) {
              tamano = { ancho: anchoRaw * 40, alto: altoRaw * 40 };
            } else {
              tamano = { ancho: anchoRaw, alto: altoRaw };
            }
          } else if (m.tamano) {
            tamano = { ancho: m.tamano.ancho || 80, alto: m.tamano.alto || 80 };
          }

          // Limitar tamaño máximo a algo razonable (400px max)
          tamano.ancho = Math.min(tamano.ancho, 400);
          tamano.alto = Math.min(tamano.alto, 400);

          console.log('[RestauracionStore] Mesa transformada:', {
            numero: m.numero,
            dimensionesRaw: m.dimensiones,
            tamanoFinal: tamano,
          });

          return {
            _id: m._id?.toString() || m._id,
            numero: m.numero,
            salonId: typeof m.salonId === 'object' ? m.salonId._id?.toString() : m.salonId?.toString(),
            salonNombre: typeof m.salonId === 'object' ? m.salonId.nombre : undefined,
            capacidad: m.capacidadMaxima || m.capacidad || 4,
            estado: m.estado || 'libre',
            // Mapear posicion (backend incluye rotacion dentro de posicion)
            posicion: m.posicion ? { x: m.posicion.x || 0, y: m.posicion.y || 0 } : undefined,
            forma: m.forma,
            // Rotacion puede venir de posicion.rotacion o directamente
            rotacion: m.posicion?.rotacion || m.rotacion || 0,
            // Tamaño calculado
            tamano,
            // Campo activo en backend, activa en frontend
            activa: m.activo !== false && m.activa !== false,
            // Campos de estadoInfo
            ventaActualId: m.estadoInfo?.pedidoId?.toString() || m.ventaActualId?.toString(),
            camareroId: m.estadoInfo?.camareroId?.toString() || m.camareroId?.toString(),
            reservaId: m.estadoInfo?.reservaId?.toString() || m.reservaId?.toString(),
          };
        });

        const camarerosTransformados: Camarero[] = camareros.map((c: any) => ({
          _id: c._id?.toString() || c._id,
          nombre: c.nombre,
          alias: c.alias,
          color: c.color,
          estado: c.estado || 'activo',
          salonesAsignados: c.salonesAsignados?.map((s: any) => s?.toString()) || [],
        }));

        set({
          salones: salonesTransformados,
          mesas: mesasTransformadas,
          camareros: camarerosTransformados,
          ultimaCarga: new Date(),
        });

        console.log('[RestauracionStore] Datos inicializados desde sync:', {
          salones: salonesTransformados.length,
          mesas: mesasTransformadas.length,
          camareros: camarerosTransformados.length,
          salonesIds: salonesTransformados.map(s => ({ _id: s._id, nombre: s.nombre })),
          mesasDetalle: mesasTransformadas.map(m => ({
            _id: m._id,
            numero: m.numero,
            salonId: m.salonId,
            estado: m.estado,
            activa: m.activa,
            posicion: m.posicion,
          })),
        });
      },

      // Cargar todos los datos de restauración
      cargarDatosRestauracion: async () => {
        set({ cargando: true });

        try {
          // Cargar salones, mesas y camareros en paralelo
          const [salonesRes, mesasRes, camarerosRes] = await Promise.all([
            restauracionService.getSalones(),
            restauracionService.getMesas(),
            restauracionService.getCamareros(),
          ]);

          set({
            salones: salonesRes.ok ? salonesRes.data : [],
            mesas: mesasRes.ok ? mesasRes.data : [],
            camareros: camarerosRes.ok ? camarerosRes.data : [],
            ultimaCarga: new Date(),
            cargando: false,
          });
        } catch (error) {
          console.error('Error cargando datos de restauración:', error);
          set({ cargando: false });
        }
      },

      // Cargar mesas de un salón específico
      cargarMesasSalon: async (salonId: string) => {
        set({ cargando: true, salonActivo: salonId });

        try {
          const response = await restauracionService.getMesas(salonId);
          if (response.ok) {
            // Actualizar solo las mesas del salón
            const { mesas } = get();
            const mesasOtrosSalones = mesas.filter((m) => m.salonId !== salonId);
            set({
              mesas: [...mesasOtrosSalones, ...response.data],
              cargando: false,
            });
          } else {
            set({ cargando: false });
          }
        } catch (error) {
          console.error('Error cargando mesas del salón:', error);
          set({ cargando: false });
        }
      },

      // Refrescar estado de mesas
      refrescarMesas: async () => {
        const { salonActivo } = get();

        try {
          const response = await restauracionService.getMesas(salonActivo || undefined);
          if (response.ok) {
            if (salonActivo) {
              const { mesas } = get();
              const mesasOtrosSalones = mesas.filter((m) => m.salonId !== salonActivo);
              set({ mesas: [...mesasOtrosSalones, ...response.data] });
            } else {
              set({ mesas: response.data });
            }
          }
        } catch (error) {
          console.error('Error refrescando mesas:', error);
        }
      },

      // Seleccionar mesa
      seleccionarMesa: (mesa) => {
        set({ mesaSeleccionada: mesa });
      },

      // Seleccionar camarero
      seleccionarCamarero: (camarero) => {
        set({ camareroSeleccionado: camarero });
      },

      // Establecer salón activo
      setSalonActivo: (salonId) => {
        set({ salonActivo: salonId });
      },

      // Ocupar mesa
      ocuparMesa: async (mesaId, ventaId, camareroId) => {
        try {
          const response = await restauracionService.actualizarEstadoMesa(mesaId, 'ocupada', {
            ventaActualId: ventaId,
            camareroId,
          });

          if (response.ok && response.data) {
            // Actualizar mesa en el store
            const { mesas } = get();
            set({
              mesas: mesas.map((m) => (m._id === mesaId ? response.data! : m)),
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error ocupando mesa:', error);
          return false;
        }
      },

      // Liberar mesa
      liberarMesa: async (mesaId) => {
        try {
          const response = await restauracionService.liberarMesa(mesaId);

          if (response.ok) {
            // Actualizar mesa en el store
            const { mesas, mesaSeleccionada } = get();
            set({
              mesas: mesas.map((m) =>
                m._id === mesaId
                  ? { ...m, estado: 'libre' as const, ventaActualId: undefined, camareroId: undefined }
                  : m
              ),
              // Si es la mesa seleccionada, limpiar selección
              mesaSeleccionada: mesaSeleccionada?._id === mesaId ? null : mesaSeleccionada,
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error liberando mesa:', error);
          return false;
        }
      },

      // Cargar sugerencias para un producto
      cargarSugerencias: async (productoId) => {
        try {
          const response = await restauracionService.getSugerenciasProducto(productoId);
          if (response.ok) {
            set({ sugerenciasActuales: response.data });
          }
        } catch (error) {
          console.error('Error cargando sugerencias:', error);
        }
      },

      // Limpiar sugerencias
      limpiarSugerencias: () => {
        set({ sugerenciasActuales: [] });
      },

      // Limpiar selección al finalizar venta
      limpiarSeleccion: () => {
        set({
          mesaSeleccionada: null,
          camareroSeleccionado: null,
          sugerenciasActuales: [],
        });
      },
    }),
    {
      name: 'tpv-restauracion-storage',
      partialize: (state) => ({
        // Solo persistir datos que no cambian frecuentemente
        salones: state.salones,
        camareros: state.camareros,
        ultimaCarga: state.ultimaCarga,
        // No persistir mesas (cambian frecuentemente) ni selección
      }),
    }
  )
);
