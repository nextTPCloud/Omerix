'use client';

import { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useDataStore, type Producto } from '@/stores/dataStore';
import { useCartStore } from '@/stores/cartStore';
import { ModificadoresModal } from './ModificadoresModal';

interface Props {
  familiaId: string | null;
  showPrices: boolean;
  showAlergenos: boolean;
  allowComments: boolean;
  isMenuOnly?: boolean;
}

/**
 * Grid de productos
 * Muestra los productos de la familia seleccionada
 */
export function ProductGrid({
  familiaId,
  showPrices,
  showAlergenos,
  allowComments,
  isMenuOnly,
}: Props) {
  const { getProductosByFamilia, getModificadoresParaProducto } = useDataStore();
  const { addItem } = useCartStore();

  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [showModificadores, setShowModificadores] = useState(false);

  const productos = familiaId ? getProductosByFamilia(familiaId) : [];

  const handleProductoClick = (producto: Producto) => {
    if (isMenuOnly) return;

    const modificadores = getModificadoresParaProducto(producto);

    if (modificadores.length > 0) {
      setSelectedProducto(producto);
      setShowModificadores(true);
    } else {
      // Agregar directamente sin modificadores
      addItem(producto, 1, []);
    }
  };

  const handleConfirmModificadores = (
    modificadores: Array<{ modificador: any; cantidad: number }>,
    comentario?: string
  ) => {
    if (selectedProducto) {
      addItem(selectedProducto, 1, modificadores, comentario);
    }
    setShowModificadores(false);
    setSelectedProducto(null);
  };

  if (productos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 text-lg">No hay productos en esta categoria</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {productos.map((producto) => (
          <ProductCard
            key={producto._id}
            producto={producto}
            showPrices={showPrices}
            showAlergenos={showAlergenos}
            isMenuOnly={isMenuOnly}
            onClick={() => handleProductoClick(producto)}
          />
        ))}
      </div>

      {/* Modal de modificadores */}
      {showModificadores && selectedProducto && (
        <ModificadoresModal
          isOpen={showModificadores}
          onClose={() => {
            setShowModificadores(false);
            setSelectedProducto(null);
          }}
          onConfirm={handleConfirmModificadores}
          producto={selectedProducto}
          modificadores={getModificadoresParaProducto(selectedProducto)}
          allowComments={allowComments}
        />
      )}
    </>
  );
}

// Componente de tarjeta de producto
function ProductCard({
  producto,
  showPrices,
  showAlergenos,
  isMenuOnly,
  onClick,
}: {
  producto: Producto;
  showPrices: boolean;
  showAlergenos: boolean;
  isMenuOnly?: boolean;
  onClick: () => void;
}) {
  const hasAlergenos = producto.alergenos && producto.alergenos.length > 0;

  return (
    <button
      onClick={onClick}
      disabled={isMenuOnly}
      className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all ${
        isMenuOnly
          ? 'cursor-default'
          : 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
      }`}
      style={producto.color ? { borderTop: `4px solid ${producto.color}` } : {}}
    >
      {/* Imagen */}
      {producto.imagen ? (
        <div className="aspect-square bg-gray-100">
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="aspect-square flex items-center justify-center"
          style={{ backgroundColor: producto.color || '#E5E7EB' }}
        >
          <span className="text-4xl font-bold text-white/50">
            {producto.nombre.charAt(0)}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">
          {producto.nombre}
        </h3>

        {/* Alergenos */}
        {showAlergenos && hasAlergenos && (
          <div className="flex items-center gap-1 mb-2">
            <AlertTriangle className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-orange-600">
              {producto.alergenos?.map((a) => a.nombre).join(', ')}
            </span>
          </div>
        )}

        {/* Precio y boton */}
        <div className="flex items-center justify-between">
          {showPrices && (
            <span className="text-lg font-bold text-primary">
              {(producto.precios?.venta ?? 0).toFixed(2)} €
            </span>
          )}
          {!isMenuOnly && (
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
              <Plus className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
