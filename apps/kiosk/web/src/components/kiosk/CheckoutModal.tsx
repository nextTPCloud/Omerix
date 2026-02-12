'use client';

import { useState } from 'react';
import { X, MapPin, PackageCheck, User, Phone, CreditCard, CheckCircle } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';

interface Props {
  onClose: () => void;
  kioskConfig: any;
}

type Step = 'servicio' | 'cliente' | 'resumen' | 'confirmacion';

/**
 * Modal de checkout
 * Guia al cliente a traves del proceso de pedido
 */
export function CheckoutModal({ onClose, kioskConfig }: Props) {
  const { items, total, tipoServicio, cliente, setTipoServicio, setCliente, clear } = useCartStore();
  const { empresaId, kioskId, kioskSecret } = useAuthStore();

  const [step, setStep] = useState<Step>('servicio');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedidoInfo, setPedidoInfo] = useState<{ numeroPedido: string; codigoRecogida?: string } | null>(null);

  // Datos del cliente
  const [nombre, setNombre] = useState(cliente.nombre || '');
  const [telefono, setTelefono] = useState(cliente.telefono || '');

  const requiereNombre = kioskConfig?.config?.requiereNombreCliente;
  const requiereTelefono = kioskConfig?.config?.requiereTelefono;
  const permitirParaLlevar = kioskConfig?.config?.permitirParaLlevar ?? true;
  const permitePago = kioskConfig?.pagos?.permitePago;

  // Siguiente paso
  const handleNext = () => {
    switch (step) {
      case 'servicio':
        if (requiereNombre || requiereTelefono) {
          setStep('cliente');
        } else {
          setStep('resumen');
        }
        break;
      case 'cliente':
        setCliente({ nombre, telefono });
        setStep('resumen');
        break;
      case 'resumen':
        handleSubmit();
        break;
    }
  };

  // Enviar pedido
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const lineas = items.map((item) => ({
        productoId: item.producto._id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        modificadores: item.modificadores.map((m) => ({
          modificadorId: m.modificador._id,
          nombre: m.modificador.nombre,
          precioExtra: m.modificador.precioExtra,
          cantidad: m.cantidad,
        })),
        comentario: item.comentario,
      }));

      const response = await api.post('/kiosk/pedido/crear', {
        empresaId,
        kioskId,
        kioskSecret,
        lineas,
        tipoServicio,
        cliente: { nombre, telefono },
        pagado: false, // Por ahora no procesamos pagos
      });

      if (response.data.success) {
        setPedidoInfo(response.data.pedido);
        setStep('confirmacion');
        clear(); // Limpiar carrito
      } else {
        throw new Error(response.data.error || 'Error al crear pedido');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Terminar y volver al inicio
  const handleFinish = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-xl">
            {step === 'servicio' && 'Tipo de servicio'}
            {step === 'cliente' && 'Tus datos'}
            {step === 'resumen' && 'Confirmar pedido'}
            {step === 'confirmacion' && 'Pedido confirmado'}
          </h2>
          {step !== 'confirmacion' && (
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* PASO 1: Tipo de servicio */}
          {step === 'servicio' && (
            <div className="space-y-4">
              <button
                onClick={() => setTipoServicio('en_local')}
                className={`w-full p-6 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                  tipoServicio === 'en_local'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  tipoServicio === 'en_local' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <MapPin className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg text-gray-800">Comer aqui</p>
                  <p className="text-gray-500">Disfruta tu pedido en el local</p>
                </div>
              </button>

              {permitirParaLlevar && (
                <button
                  onClick={() => setTipoServicio('para_llevar')}
                  className={`w-full p-6 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    tipoServicio === 'para_llevar'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    tipoServicio === 'para_llevar' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <PackageCheck className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg text-gray-800">Para llevar</p>
                    <p className="text-gray-500">Recoge tu pedido y llevalo contigo</p>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* PASO 2: Datos del cliente */}
          {step === 'cliente' && (
            <div className="space-y-6">
              {requiereNombre && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre {requiereNombre && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {requiereTelefono && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefono {requiereTelefono && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Tu telefono"
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: Resumen */}
          {step === 'resumen' && (
            <div className="space-y-4">
              {/* Items */}
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="font-medium">{item.cantidad}x</span>{' '}
                      <span>{item.producto.nombre}</span>
                    </div>
                    <span className="font-semibold">{item.precioTotal.toFixed(2)} €</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between pt-4 border-t-2 border-gray-200">
                <span className="text-xl font-bold">Total</span>
                <span className="text-xl font-bold text-primary">{total.toFixed(2)} €</span>
              </div>

              {/* Info adicional */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Servicio:</span>
                  <span className="font-medium">
                    {tipoServicio === 'en_local' ? 'Comer aqui' : 'Para llevar'}
                  </span>
                </div>
                {nombre && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-medium">{nombre}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* PASO 4: Confirmacion */}
          {step === 'confirmacion' && pedidoInfo && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-14 h-14 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                ¡Gracias por tu pedido!
              </h3>
              <p className="text-gray-600 mb-6">
                Tu pedido ha sido enviado correctamente
              </p>

              {/* Codigo de recogida */}
              {pedidoInfo.codigoRecogida && (
                <div className="bg-primary/5 rounded-2xl p-6 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Tu codigo de recogida:</p>
                  <p className="text-5xl font-bold text-primary tracking-wider">
                    {pedidoInfo.codigoRecogida}
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Pedido #{pedidoInfo.numeroPedido}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          {step !== 'confirmacion' ? (
            <div className="flex gap-3">
              {step !== 'servicio' && (
                <button
                  onClick={() => {
                    if (step === 'cliente') setStep('servicio');
                    if (step === 'resumen') setStep(requiereNombre || requiereTelefono ? 'cliente' : 'servicio');
                  }}
                  className="flex-1 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Atras
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={isSubmitting || (step === 'cliente' && requiereNombre && !nombre)}
                className="flex-1 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </>
                ) : step === 'resumen' ? (
                  'Confirmar Pedido'
                ) : (
                  'Continuar'
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Hacer otro pedido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
