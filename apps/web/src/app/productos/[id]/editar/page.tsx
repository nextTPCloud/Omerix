'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { productosService } from '@/services/productos.service';
import { familiasService } from '@/services/familias.service';
import { Familia } from '@/types/familia.types';
import { Producto, UpdateProductoDTO } from '@/types/producto.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { toast } from 'sonner';

interface EditarProductoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarProductoPage({ params }: EditarProductoPageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [producto, setProducto] = useState<Producto | null>(null);

  const [formData, setFormData] = useState<UpdateProductoDTO>({
    nombre: '',
    descripcion: '',
    familiaId: '',
    codigoBarras: '',
    precios: {
      compra: 0,
      venta: 0,
    },
    stock: {
      cantidad: 0,
      minimo: 0,
      maximo: 0,
    },
    activo: true,
  });

  useEffect(() => {
    if (id) {
      fetchProducto();
      fetchFamilias();
    }
  }, [id]);

  const fetchProducto = async () => {
    try {
      setLoading(true);
      const response = await productosService.getById(id);
      const prod = response.data;
      setProducto(prod);

      // Cargar datos en el formulario
      // Nota: familiaId puede venir como string ID o como objeto poblado
      const familiaId = typeof prod.familiaId === 'object' && prod.familiaId
        ? (prod.familiaId as any)._id
        : prod.familiaId;

      setFormData({
        nombre: prod.nombre,
        descripcion: prod.descripcion || '',
        familiaId: familiaId || '',
        codigoBarras: prod.codigoBarras || '',
        precios: {
          compra: prod.precios?.compra || 0,
          venta: prod.precios?.venta || 0,
        },
        stock: {
          cantidad: prod.stock?.cantidad || 0,
          minimo: prod.stock?.minimo || 0,
          maximo: prod.stock?.maximo || 0,
        },
        activo: prod.activo,
      });
    } catch (err: any) {
      console.error('Error al cargar producto:', err);
      setError(err.response?.data?.message || 'Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);
    setError(null);

    try {
      // Validaciones
      if (!formData.nombre?.trim()) {
        throw new Error('El nombre es obligatorio');
      }
      if (formData.precios && (formData.precios.compra < 0 || formData.precios.venta < 0)) {
        throw new Error('Los precios no pueden ser negativos');
      }

      // Limpiar campos ObjectId vacíos (convertir '' a undefined)
      const cleanedData = { ...formData };
      const objectIdFields = ['familiaId', 'estadoId', 'situacionId', 'clasificacionId', 'tipoImpuestoId'];
      objectIdFields.forEach(field => {
        if ((cleanedData as any)[field] === '') {
          delete (cleanedData as any)[field];
        }
      });
      // Limpiar campos de restauración
      if ((cleanedData as any).restauracion) {
        if ((cleanedData as any).restauracion.zonaPreparacionId === '') delete (cleanedData as any).restauracion.zonaPreparacionId;
        if ((cleanedData as any).restauracion.impresoraId === '') delete (cleanedData as any).restauracion.impresoraId;
      }

      await productosService.update(id, cleanedData);
      toast.success('Producto actualizado correctamente');
      router.push(`/productos/${id}`);
    } catch (err: any) {
      console.error('Error al actualizar producto:', err);
      toast.error(err.response?.data?.message || err.message || 'Error al actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando producto...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!producto) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-destructive text-lg">Producto no encontrado</p>
            <Button onClick={() => router.push('/productos')} className="mt-4">
              Volver al listado
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
            Editar Producto
          </h1>
          <p className="text-muted-foreground mt-1">
            SKU: {producto.sku}
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
                SKU
              </label>
              <Input
                type="text"
                value={producto.sku}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">El SKU no se puede modificar</p>
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
                  value={formData.precios?.compra || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precios: { ...formData.precios!, compra: parseFloat(e.target.value) || 0 },
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
                  value={formData.precios?.venta || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precios: { ...formData.precios!, venta: parseFloat(e.target.value) || 0 },
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
                Cantidad Actual
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

            {/* Visible en catálogo - removed as not in DTO */}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
    </DashboardLayout>
  );
}
