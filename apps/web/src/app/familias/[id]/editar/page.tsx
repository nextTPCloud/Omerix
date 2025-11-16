'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { familiasService } from '@/services/familias.service';
import { Familia, UpdateFamiliaDTO } from '@/types/familia.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

interface EditarFamiliaPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarFamiliaPage({ params }: EditarFamiliaPageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [familia, setFamilia] = useState<Familia | null>(null);

  const [formData, setFormData] = useState<UpdateFamiliaDTO>({
    nombre: '',
    codigo: '',
    descripcion: '',
    familiaPadreId: '',
    orden: 0,
    activo: true,
  });

  useEffect(() => {
    if (id) {
      fetchFamilia();
      fetchFamilias();
    }
  }, [id]);

  const fetchFamilia = async () => {
    try {
      setLoading(true);
      const response = await familiasService.getById(id);
      const fam = response.data;
      setFamilia(fam);

      // Cargar datos en el formulario
      setFormData({
        nombre: fam.nombre,
        codigo: fam.codigo || '',
        descripcion: fam.descripcion || '',
        familiaPadreId: fam.familiaPadreId || '',
        orden: fam.orden,
        activo: fam.activo,
      });
    } catch (err: any) {
      console.error('Error al cargar familia:', err);
      setError(err.response?.data?.message || 'Error al cargar la familia');
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilias = async () => {
    try {
      const response = await familiasService.getAll({ limit: 1000 });
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

      // Validar que no se seleccione a sí misma como padre
      if (formData.familiaPadreId === id) {
        throw new Error('Una familia no puede ser su propia familia padre');
      }

      await familiasService.update(id, formData);
      toast.success('Familia actualizada correctamente');
      router.push(`/familias/${id}`);
    } catch (err: any) {
      console.error('Error al actualizar familia:', err);
      toast.error(err.response?.data?.message || err.message || 'Error al actualizar la familia');
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
            <p className="text-muted-foreground">Cargando familia...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!familia) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-destructive text-lg">Familia no encontrada</p>
            <Button onClick={() => router.push('/familias')} className="mt-4">
              Volver al listado
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Filtrar familias para evitar selección circular
  const familiasDisponibles = familias.filter(f => f._id !== id);

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
            <FolderTree className="h-8 w-8 text-primary" />
            Editar Familia
          </h1>
          <p className="text-muted-foreground mt-1">
            {familia.nombre}
          </p>
        </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
              <Input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  onKeyDown={async (e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      try {
                        // Extraer prefijo del código actual
                        const codigoActual = e.currentTarget.value
                        const match = codigoActual.match(/^([A-Za-z]+-?)/)
                        const prefijo = match ? match[1] : undefined

                        // Llamar al servicio para sugerir código
                        const response = await familiasService.sugerirSiguienteCodigo(prefijo)

                        if (response.success) {
                          setFormData((prev) => ({
                            ...prev,
                            codigo: response.data.codigo,
                          }))
                        }
                      } catch (error) {
                        console.error('Error al sugerir código:', error)
                      }
                    }
                  }}
                  placeholder="Ej: FAM-001"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Presiona ↓ para sugerir el siguiente código disponible
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Familia Padre</label>
              <select
                value={formData.familiaPadreId}
                onChange={(e) => setFormData({ ...formData, familiaPadreId: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin familia padre</option>
                {familiasDisponibles.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.nombre}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selecciona una familia padre para crear una jerarquía
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción de la familia..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Orden</label>
              <Input
                type="number"
                min="0"
                value={formData.orden}
                onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Orden de visualización (menor número aparece primero)
              </p>
            </div>

            <div className="flex items-center pt-8">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                Familia activa
              </label>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        {familia.createdAt && (
          <div className="bg-gray-50 rounded-lg border p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Información del Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Creado:</span>{' '}
                {new Date(familia.createdAt).toLocaleString('es-ES')}
              </div>
              {familia.updatedAt && (
                <div>
                  <span className="font-medium">Última modificación:</span>{' '}
                  {new Date(familia.updatedAt).toLocaleString('es-ES')}
                </div>
              )}
            </div>
          </div>
        )}

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
