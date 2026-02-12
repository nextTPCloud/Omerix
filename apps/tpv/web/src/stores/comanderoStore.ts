import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { comanderoService } from '../services/comandero.service';
import { useDataStore } from './dataStore';

interface Camarero {
  id: string;
  nombre: string;
  alias?: string;
  salonesAsignados?: string[];
  mesasAsignadas?: string[];
}

interface ModificadorLinea {
  modificadorId: string;
  nombre: string;
  precioExtra: number;
}

interface LineaComanda {
  productoId: string;
  nombre: string;
  cantidad: number;
  notas?: string;
  modificadores?: ModificadorLinea[];
}

export type TipoServicioRapido = 'barra' | 'llevar' | 'recoger';

interface ComanderoState {
  camarero: Camarero | null;
  sesionId: string | null;
  logueado: boolean;

  mesas: any[];
  salones: any[];
  salonActivo: string | null;
  mesaSeleccionada: string | null;

  // Modo rápido (fast food)
  modoRapido: boolean;
  tipoServicioRapido: TipoServicioRapido | null;

  comandaActual: LineaComanda[];
  notasComanda: string;

  login: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;

  cargarMesas: (salonId?: string) => Promise<void>;
  cargarMesasTodosSalones: () => Promise<void>;
  cargarSalones: () => Promise<void>;
  seleccionarMesa: (mesaId: string | null) => void;
  seleccionarSalon: (salonId: string) => void;

  // Modo rápido
  iniciarPedidoRapido: (tipo: TipoServicioRapido) => void;
  salirModoRapido: () => void;

  agregarProducto: (producto: { productoId: string; nombre: string; cantidad?: number; notas?: string; modificadores?: ModificadorLinea[] }) => void;
  quitarProducto: (index: number) => void;
  actualizarCantidad: (index: number, cantidad: number) => void;
  actualizarNotas: (index: number, notas: string) => void;
  setNotasComanda: (notas: string) => void;
  limpiarComanda: () => void;
  enviarComanda: () => Promise<boolean>;
}

export const useComanderoStore = create<ComanderoState>()(
  persist(
    (set, get) => ({
      camarero: null,
      sesionId: null,
      logueado: false,
      mesas: [],
      salones: [],
      salonActivo: null,
      mesaSeleccionada: null,
      modoRapido: false,
      tipoServicioRapido: null,
      comandaActual: [],
      notasComanda: '',

      login: async (pin: string) => {
        try {
          const res = await comanderoService.login(pin);
          if (res.ok) {
            set({
              camarero: res.camarero,
              sesionId: res.sesionId,
              logueado: true,
            });
            // Cargar salones tras login
            get().cargarSalones();
            return { ok: true };
          }
          return { ok: false, error: res.error || 'PIN incorrecto' };
        } catch (error: any) {
          console.error('Error login comandero:', error);
          return { ok: false, error: error.message || 'Error de conexion' };
        }
      },

      logout: async () => {
        const { sesionId } = get();
        if (sesionId) {
          try {
            await comanderoService.logout(sesionId);
          } catch (e) {
            console.error('Error logout comandero:', e);
          }
        }
        set({
          camarero: null,
          sesionId: null,
          logueado: false,
          mesas: [],
          salones: [],
          salonActivo: null,
          mesaSeleccionada: null,
          comandaActual: [],
        });
      },

      cargarSalones: async () => {
        try {
          const res = await comanderoService.getSalones();
          if (res.ok) {
            let salones = res.data || [];
            // Filtrar por salonesAsignados del camarero (si tiene asignaciones)
            const camarero = get().camarero;
            if (camarero?.salonesAsignados?.length) {
              salones = salones.filter((s: any) =>
                camarero.salonesAsignados!.includes(s._id)
              );
            }
            set({ salones });
            // Auto-seleccionar primer salon
            if (salones.length > 0 && !get().salonActivo) {
              const salonId = salones[0]._id;
              set({ salonActivo: salonId });
              get().cargarMesas(salonId);
            }
          }
        } catch (error) {
          console.error('Error cargando salones:', error);
        }
      },

      cargarMesas: async (salonId?: string) => {
        try {
          const res = await comanderoService.getMesas(salonId);
          if (res.ok) {
            // Filtrar mesas asignadas al camarero si tiene asignaciones
            const camarero = get().camarero;
            let mesas = res.data || [];
            if (camarero?.mesasAsignadas?.length) {
              mesas = mesas.filter((m: any) => camarero.mesasAsignadas!.includes(m._id));
            }
            set({ mesas });
          }
        } catch (error) {
          console.error('Error cargando mesas:', error);
        }
      },

      seleccionarMesa: (mesaId) => {
        const { mesaSeleccionada } = get();
        // Si cambiamos de mesa, limpiar la comanda actual
        if (mesaId !== mesaSeleccionada) {
          set({ mesaSeleccionada: mesaId, comandaActual: [], notasComanda: '' });
        } else {
          set({ mesaSeleccionada: mesaId });
        }
      },

      seleccionarSalon: (salonId) => {
        set({ salonActivo: salonId, mesaSeleccionada: null });
        if (salonId === '__todos__') {
          // Cargar mesas de todos los salones asignados
          get().cargarMesasTodosSalones();
        } else {
          get().cargarMesas(salonId);
        }
      },

      cargarMesasTodosSalones: async () => {
        try {
          const { salones, camarero } = get();
          const todasMesas: any[] = [];
          for (const salon of salones) {
            const res = await comanderoService.getMesas(salon._id);
            if (res.ok) {
              const mesasConSalon = (res.data || []).map((m: any) => ({
                ...m,
                _salonNombre: salon.nombre,
              }));
              todasMesas.push(...mesasConSalon);
            }
          }
          // Filtrar por mesasAsignadas si aplica
          let mesas = todasMesas;
          if (camarero?.mesasAsignadas?.length) {
            mesas = mesas.filter((m: any) => camarero.mesasAsignadas!.includes(m._id));
          }
          set({ mesas });
        } catch (error) {
          console.error('Error cargando mesas de todos los salones:', error);
        }
      },

      iniciarPedidoRapido: (tipo: TipoServicioRapido) => {
        set({
          modoRapido: true,
          tipoServicioRapido: tipo,
          mesaSeleccionada: `__rapido_${tipo}__`,
          comandaActual: [],
          notasComanda: '',
        });
      },

      salirModoRapido: () => {
        set({
          modoRapido: false,
          tipoServicioRapido: null,
          mesaSeleccionada: null,
          comandaActual: [],
          notasComanda: '',
        });
      },

      agregarProducto: (producto) => {
        const { comandaActual } = get();
        // No merge si tiene notas o modificadores (son lineas unicas)
        const tieneExtra = !!producto.notas || !!(producto.modificadores?.length);
        const existente = tieneExtra ? -1 : comandaActual.findIndex(l =>
          l.productoId === producto.productoId && !l.notas && !l.modificadores?.length
        );
        if (existente >= 0) {
          const nuevas = [...comandaActual];
          nuevas[existente].cantidad += producto.cantidad || 1;
          set({ comandaActual: nuevas });
        } else {
          set({
            comandaActual: [...comandaActual, {
              productoId: producto.productoId,
              nombre: producto.nombre,
              cantidad: producto.cantidad || 1,
              notas: producto.notas,
              modificadores: producto.modificadores,
            }],
          });
        }
      },

      quitarProducto: (index) => {
        const nuevas = [...get().comandaActual];
        nuevas.splice(index, 1);
        set({ comandaActual: nuevas });
      },

      actualizarCantidad: (index, cantidad) => {
        const nuevas = [...get().comandaActual];
        if (cantidad <= 0) {
          nuevas.splice(index, 1);
        } else {
          nuevas[index].cantidad = cantidad;
        }
        set({ comandaActual: nuevas });
      },

      actualizarNotas: (index, notas) => {
        const nuevas = [...get().comandaActual];
        if (nuevas[index]) {
          nuevas[index] = { ...nuevas[index], notas: notas || undefined };
          set({ comandaActual: nuevas });
        }
      },

      setNotasComanda: (notas) => set({ notasComanda: notas }),

      limpiarComanda: () => set({ comandaActual: [], notasComanda: '' }),

      enviarComanda: async () => {
        const { mesaSeleccionada, comandaActual, camarero, notasComanda, modoRapido, tipoServicioRapido } = get();
        if (!mesaSeleccionada || comandaActual.length === 0) return false;

        try {
          // Resolver alérgenos de cada producto
          const { alergenos, productos } = useDataStore.getState();

          const mesaObj = modoRapido ? null : get().mesas.find((m: any) => m._id === mesaSeleccionada);
          const tipoServicioLabel = tipoServicioRapido === 'barra' ? 'BARRA' : tipoServicioRapido === 'llevar' ? 'LLEVAR' : tipoServicioRapido === 'recoger' ? 'RECOGER' : '';
          const res = await comanderoService.enviarComanda({
            mesaId: modoRapido ? undefined : mesaSeleccionada,
            mesaNumero: modoRapido ? tipoServicioLabel : (mesaObj?.numero || mesaObj?.nombre || ''),
            tipoServicio: modoRapido ? tipoServicioRapido : 'mesa',
            camareroId: camarero?.id,
            camareroNombre: camarero?.nombre,
            notas: notasComanda || undefined,
            lineas: comandaActual.map(l => {
              const prod = productos.find(p => p._id === l.productoId);
              const alergenosNombres = (prod?.restauracion?.alergenosIds || [])
                .map(id => alergenos.find(a => a._id === id)?.nombre)
                .filter(Boolean) as string[];
              return {
                productoId: l.productoId,
                nombre: l.nombre,
                cantidad: l.cantidad,
                notas: l.notas,
                modificadores: l.modificadores?.length ? l.modificadores.map(m => ({
                  modificadorId: m.modificadorId,
                  nombre: m.nombre,
                  precioExtra: m.precioExtra || 0,
                })) : undefined,
                alergenosNombres: alergenosNombres.length > 0 ? alergenosNombres : undefined,
              };
            }),
          });

          if (res.ok) {
            // Abrir PDF de cocina si viene en la respuesta
            if (res.pdfBase64) {
              try {
                const byteChars = atob(res.pdfBase64);
                const byteNumbers = new Array(byteChars.length);
                for (let i = 0; i < byteChars.length; i++) {
                  byteNumbers[i] = byteChars.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              } catch (pdfErr) {
                console.error('Error abriendo PDF comanda:', pdfErr);
              }
            }
            set({ comandaActual: [], notasComanda: '' });
            // En modo rápido, mantener el modo activo para seguir creando pedidos
            if (!get().modoRapido) {
              // Refrescar mesas para ver el nuevo estado (ocupada)
              const { salonActivo } = get();
              if (salonActivo === '__todos__') {
                get().cargarMesasTodosSalones();
              } else if (salonActivo) {
                get().cargarMesas(salonActivo);
              }
            }
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error enviando comanda:', error);
          return false;
        }
      },
    }),
    {
      name: 'comandero-storage',
      partialize: (state) => ({
        camarero: state.camarero,
        sesionId: state.sesionId,
        logueado: state.logueado,
      }),
    }
  )
);
