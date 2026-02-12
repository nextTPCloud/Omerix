'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
;
import { familiasService } from '@/services/familias.service';
import { Familia, CreateFamiliaDTO } from '@/types/familia.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

export default function NuevaFamiliaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateFamiliaDTO>({
    nombre: '',
    codigo: '',
    descripcion: '',
    familiaPadreId: '',
    orden: 0,
    activo: true,
  });

  useEffect(() => {
    fetchFamilias();
  }, []);

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
    setLoading(true);
    setError(null);

    try {
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es obligatorio');
      }

      await familiasService.create(formData);
      toast.success('Familia creada correctamente');
      router.push('/familias');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al crear la familia');
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
      <div className="space-y-6 p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderTree className="h-8 w-8 text-primary" />
            Nueva Familia
          </h1>
          <p className="text-muted-foreground mt-1">
            Organiza tus productos en categorías
          </p>
        </div>

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
                {familias.map((f) => (
                  <option key={f._id} value={f._id}>{f.nombre}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Creando...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Familia
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
      </>
  );
}