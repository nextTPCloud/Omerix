'use client';

import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

interface Props {
  onCheckout: () => void;
}

/**
 * Panel de carrito
 * Muestra los items y permite modificar cantidades
 */
export function Cart({ onCheckout }: Props) {
  const { items, total, removeItem, updateQuantity, clear } = useCartStore();

  const isEmpty = items.length === 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">Tu Pedido</h2>
          {!isEmpty && (
            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
              {items.reduce((sum, item) => sum + item.cantidad, 0)}
            </span>
          )}
        </div>
        {!isEmpty && (
          <button
            onClick={clear}
            className="text-red-500 hover:text-red-600 text-sm font-medium"
          >
            Vaciar
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-auto p-4">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Tu carrito esta vacio</p>
            <p className="text-sm">Agrega productos para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer con total */}
      {!isEmpty && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {/* Total */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Total</span>
            <span className="text-2xl font-bold text-gray-800">
              {total.toFixed(2)} €
            </span>
          </div>

          {/* Boton de pagar */}
          <button
            onClick={onCheckout}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <span>Continuar</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Item del carrito
function CartItem({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: any;
  onRemove: () => void;
  onUpdateQuantity: (qty: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="flex gap-3">
        {/* Imagen */}
        <div
          className="w-16 h-16 rounded-lg flex-shrink-0"
          style={{
            backgroundColor: item.producto.color || '#E5E7EB',
            backgroundImage: item.producto.imagen ? `url(${item.producto.imagen})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
            {item.producto.nombre}
          </h4>

          {/* Modificadores */}
          {item.modificadores.length > 0 && (
            <p className="text-xs text-gray-500 line-clamp-1">
              {item.modificadores.map((m: any) => m.modificador.nombre).join(', ')}
            </p>
          )}

          {/* Comentario */}
          {item.comentario && (
            <p className="text-xs text-gray-400 italic line-clamp-1">
              {item.comentario}
            </p>
          )}

          {/* Precio unitario */}
          <p className="text-sm font-semibold text-primary mt-1">
            {item.precioUnitario.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Controles de cantidad */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={onRemove}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpdateQuantity(item.cantidad - 1)}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-semibold">{item.cantidad}</span>
          <button
            onClick={() => onUpdateQuantity(item.cantidad + 1)}
            className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <span className="font-bold text-gray-800">
          {item.precioTotal.toFixed(2)} €
        </span>
      </div>
    </div>
  );
}
