'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { productosService } from '@/services/productos.service';
import { familiasService } from '@/services/familias.service';
import { Familia } from '@/types/familia.types';
import { CreateProductoDTO } from '@/types/producto.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function NuevoProductoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateProductoDTO>({
    nombre: '',
    sku: '',
    descripcion: '',
    familiaId: '',
    codigoBarras: '',
    precio: {
      base: 0,
      venta: 0,
      moneda: 'EUR',
    },
    stock: {
      cantidad: 0,
      minimo: 0,
      maximo: 0,
    },
    activo: true,
    visible: true,
  });

  useEffect(() => {
    fetchFamilias();
  }, []);

  const fetchFamilias = async () => {
    try {
      const response = await familiasService.getAll({ limit: 1000, activo: true });
      setFamilias(response.data);
    } catch (err) {
      console.error('Error al cargar familias:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es obligatorio');
      }
      if (!formData.sku.trim()) {
        throw new Error('El SKU es obligatorio');
      }
      if (formData.precio.base < 0 || formData.precio.venta < 0) {
        throw new Error('Los precios no pueden ser negativos');
      }

      await productosService.create(formData);
      toast.success('Producto creado correctamente');
      router.push('/productos');
    } catch (err: any) {
      console.error('Error al crear producto:', err);
      toast.error(err.response?.data?.message || err.message || 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Package className="h-8 w-8 text-primary" />
          Nuevo Producto
        </h1>
        <p className="text-muted-foreground mt-1">
          Completa los datos del nuevo producto
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Información Básica
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <Input
                type="text"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ej: Portátil Dell XPS 15"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <Input
                type="text"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                placeholder="Ej: DELL-XPS-15-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Barras
              </label>
              <Input
                type="text"
                value={formData.codigoBarras || ''}
                onChange={(e) =>
                  setFormData({ ...formData, codigoBarras: e.target.value })
                }
                placeholder="Ej: 1234567890123"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.descripcion || ''}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Descripción del producto..."
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Familia
              </label>
              <select
                value={formData.familiaId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, familiaId: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin familia</option>
                {familias.map((familia) => (
                  <option key={familia._id} value={familia._id}>
                    {familia.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Precios */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Precios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Base *
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio.base}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precio: { ...formData.precio, base: parseFloat(e.target.value) || 0 },
                    })
                  }
                  placeholder="0.00"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  €
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Venta *
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio.venta}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precio: { ...formData.precio, venta: parseFloat(e.target.value) || 0 },
                    })
                  }
                  placeholder="0.00"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  €
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad Inicial
              </label>
              <Input
                type="number"
                min="0"
                value={formData.stock?.cantidad || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: { ...formData.stock!, cantidad: parseInt(e.target.value) || 0 },
                  })
                }
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Mínimo
              </label>
              <Input
                type="number"
                min="0"
                value={formData.stock?.minimo || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: { ...formData.stock!, minimo: parseInt(e.target.value) || 0 },
                  })
                }
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Máximo
              </label>
              <Input
                type="number"
                min="0"
                value={formData.stock?.maximo || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: { ...formData.stock!, maximo: parseInt(e.target.value) || 0 },
                  })
                }
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Estado */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) =>
                  setFormData({ ...formData, activo: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                Producto activo
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="visible"
                checked={formData.visible}
                onChange={(e) =>
                  setFormData({ ...formData, visible: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="visible" className="ml-2 block text-sm text-gray-900">
                Visible en catálogo
              </label>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Producto
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
    </DashboardLayout>
  );
}
