// ===========================================
// STORE DE CAJA TPV
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos
type EstadoCaja = 'abierta' | 'cerrada';
type TipoMovimiento = 'apertura' | 'cierre' | 'venta' | 'devolucion' | 'entrada' | 'salida' | 'cobro_factura';
type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'bizum';

interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  importe: number;
  metodoPago?: MetodoPago;
  descripcion?: string;
  ventaId?: string;
  fecha: Date;
  usuarioId: string;
  usuarioNombre: string;
}

interface Arqueo {
  efectivo: number;
  tarjeta: number;
  otros: number;
  total: number;
}

interface CajaState {
  // Estado
  id: string;
  codigo: string;
  nombre: string;
  estado: EstadoCaja;
  almacenId: string;
  almacenNombre: string;

  // Apertura
  apertura: {
    fecha: Date | null;
    usuarioId: string;
    usuarioNombre: string;
    importeInicial: number;
  } | null;

  // Movimientos
  movimientos: Movimiento[];

  // Totales actuales
  totalEfectivo: number;
  totalTarjeta: number;
  totalOtros: number;
  totalVentas: number;
  numeroVentas: number;

  // Acciones
  abrirCaja: (params: {
    usuarioId: string;
    usuarioNombre: string;
    importeInicial: number;
  }) => void;
  cerrarCaja: (params: {
    usuarioId: string;
    usuarioNombre: string;
    arqueoReal: Arqueo;
    observaciones?: string;
  }) => { arqueoTeorico: Arqueo; diferencia: number };
  registrarVenta: (params: {
    ventaId: string;
    importe: number;
    metodoPago: MetodoPago;
    usuarioId: string;
    usuarioNombre: string;
  }) => void;
  registrarMovimiento: (params: {
    tipo: 'entrada' | 'salida';
    importe: number;
    descripcion: string;
    usuarioId: string;
    usuarioNombre: string;
  }) => void;
  getArqueoTeorico: () => Arqueo;
}

export const useCajaStore = create<CajaState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      id: '',
      codigo: 'CAJA-001',
      nombre: 'Caja Principal',
      estado: 'cerrada',
      almacenId: '',
      almacenNombre: '',
      apertura: null,
      movimientos: [],
      totalEfectivo: 0,
      totalTarjeta: 0,
      totalOtros: 0,
      totalVentas: 0,
      numeroVentas: 0,

      // Abrir caja
      abrirCaja: ({ usuarioId, usuarioNombre, importeInicial }) => {
        const movimiento: Movimiento = {
          id: Date.now().toString(),
          tipo: 'apertura',
          importe: importeInicial,
          metodoPago: 'efectivo',
          fecha: new Date(),
          usuarioId,
          usuarioNombre,
        };

        set({
          estado: 'abierta',
          apertura: {
            fecha: new Date(),
            usuarioId,
            usuarioNombre,
            importeInicial,
          },
          movimientos: [movimiento],
          totalEfectivo: importeInicial,
          totalTarjeta: 0,
          totalOtros: 0,
          totalVentas: 0,
          numeroVentas: 0,
        });
      },

      // Cerrar caja
      cerrarCaja: ({ usuarioId, usuarioNombre, arqueoReal, observaciones }) => {
        const arqueoTeorico = get().getArqueoTeorico();
        const diferencia = arqueoReal.total - arqueoTeorico.total;

        const movimiento: Movimiento = {
          id: Date.now().toString(),
          tipo: 'cierre',
          importe: arqueoTeorico.total,
          descripcion: observaciones,
          fecha: new Date(),
          usuarioId,
          usuarioNombre,
        };

        set((state) => ({
          estado: 'cerrada',
          movimientos: [...state.movimientos, movimiento],
        }));

        return { arqueoTeorico, diferencia };
      },

      // Registrar venta
      registrarVenta: ({ ventaId, importe, metodoPago, usuarioId, usuarioNombre }) => {
        const movimiento: Movimiento = {
          id: Date.now().toString(),
          tipo: 'venta',
          importe,
          metodoPago,
          ventaId,
          fecha: new Date(),
          usuarioId,
          usuarioNombre,
        };

        set((state) => {
          const updates: Partial<CajaState> = {
            movimientos: [...state.movimientos, movimiento],
            totalVentas: state.totalVentas + importe,
            numeroVentas: state.numeroVentas + 1,
          };

          switch (metodoPago) {
            case 'efectivo':
              updates.totalEfectivo = state.totalEfectivo + importe;
              break;
            case 'tarjeta':
              updates.totalTarjeta = state.totalTarjeta + importe;
              break;
            default:
              updates.totalOtros = state.totalOtros + importe;
          }

          return updates as CajaState;
        });
      },

      // Registrar movimiento manual
      registrarMovimiento: ({ tipo, importe, descripcion, usuarioId, usuarioNombre }) => {
        const importeReal = tipo === 'salida' ? -importe : importe;

        const movimiento: Movimiento = {
          id: Date.now().toString(),
          tipo,
          importe: importeReal,
          metodoPago: 'efectivo',
          descripcion,
          fecha: new Date(),
          usuarioId,
          usuarioNombre,
        };

        set((state) => ({
          movimientos: [...state.movimientos, movimiento],
          totalEfectivo: state.totalEfectivo + importeReal,
        }));
      },

      // Obtener arqueo teórico
      getArqueoTeorico: () => {
        const state = get();
        return {
          efectivo: state.totalEfectivo,
          tarjeta: state.totalTarjeta,
          otros: state.totalOtros,
          total: state.totalEfectivo + state.totalTarjeta + state.totalOtros,
        };
      },
    }),
    {
      name: 'tpv-caja-storage',
      // Solo persistir datos esenciales
      partialize: (state) => ({
        id: state.id,
        codigo: state.codigo,
        nombre: state.nombre,
        estado: state.estado,
        almacenId: state.almacenId,
        almacenNombre: state.almacenNombre,
        apertura: state.apertura,
        movimientos: state.movimientos,
        totalEfectivo: state.totalEfectivo,
        totalTarjeta: state.totalTarjeta,
        totalOtros: state.totalOtros,
        totalVentas: state.totalVentas,
        numeroVentas: state.numeroVentas,
      }),
    }
  )
);
