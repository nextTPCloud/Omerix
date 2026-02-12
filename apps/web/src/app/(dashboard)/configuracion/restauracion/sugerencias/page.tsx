'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  Coffee,
  UtensilsCrossed,
  Wine,
  Clock,
  TrendingUp,
  Eye,
  ThumbsUp,
  RefreshCw,
} from 'lucide-react';
import { sugerenciasService, Sugerencia, TipoSugerencia, MomentoSugerencia, CreateSugerenciaDTO } from '@/services/sugerencias.service';

// ============================================
// COMPONENTES
// ============================================

interface SugerenciaFormProps {
  sugerencia?: Sugerencia | null;
  onSave: (data: CreateSugerenciaDTO) => void;
  onCancel: () => void;
}

function SugerenciaForm({ sugerencia, onSave, onCancel }: SugerenciaFormProps) {
  const [formData, setFormData] = useState<CreateSugerenciaDTO>({
    nombre: sugerencia?.nombre || '',
    descripcion: sugerencia?.descripcion || '',
    tipo: sugerencia?.tipo || 'complementario',
    momento: sugerencia?.momento || 'al_agregar',
    productoBaseId: typeof sugerencia?.productoBaseId === 'object'
      ? sugerencia.productoBaseId._id
      : sugerencia?.productoBaseId || '',
    productosSugeridos: sugerencia?.productosSugeridos?.map(ps => ({
      productoId: typeof ps.productoId === 'object' ? ps.productoId._id : ps.productoId,
      orden: ps.orden || 0,
      descuento: ps.descuento,
      textoPersonalizado: ps.textoPersonalizado,
    })) || [{ productoId: '', orden: 0 }],
    prioridad: sugerencia?.prioridad || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtrar productos vacíos
    const data = {
      ...formData,
      productosSugeridos: formData.productosSugeridos.filter(ps => ps.productoId),
    };
    if (data.productosSugeridos.length === 0) {
      alert('Debe agregar al menos un producto a sugerir');
      return;
    }
    onSave(data);
  };

  const addProductoSugerido = () => {
    setFormData({
      ...formData,
      productosSugeridos: [...formData.productosSugeridos, { productoId: '', orden: formData.productosSugeridos.length }],
    });
  };

  const removeProductoSugerido = (index: number) => {
    setFormData({
      ...formData,
      productosSugeridos: formData.productosSugeridos.filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la regla *</label>
          <input
            type="text"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Sugerir vino con carnes"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
          <textarea
            rows={2}
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción opcional de la sugerencia"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de sugerencia</label>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoSugerencia })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="complementario">Complementario</option>
            <option value="upgrade">Mejora (upgrade)</option>
            <option value="alternativa">Alternativa</option>
            <option value="acompanamiento">Acompañamiento</option>
            <option value="postre">Postre</option>
            <option value="bebida">Bebida</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Momento</label>
          <select
            value={formData.momento}
            onChange={(e) => setFormData({ ...formData, momento: e.target.value as MomentoSugerencia })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="al_agregar">Al agregar producto</option>
            <option value="al_finalizar">Al finalizar pedido</option>
            <option value="automatico">Automatico</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
          <input
            type="number"
            min={0}
            max={100}
            value={formData.prioridad}
            onChange={(e) => setFormData({ ...formData, prioridad: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Mayor numero = mayor prioridad</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Producto base (opcional)</label>
          <input
            type="text"
            value={formData.productoBaseId}
            onChange={(e) => setFormData({ ...formData, productoBaseId: e.target.value })}
            placeholder="ID del producto que activa la sugerencia"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Productos sugeridos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Productos a sugerir *</label>
        <div className="space-y-2">
          {formData.productosSugeridos.map((ps, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  required
                  value={ps.productoId}
                  onChange={(e) => {
                    const updated = [...formData.productosSugeridos];
                    updated[index].productoId = e.target.value;
                    setFormData({ ...formData, productosSugeridos: updated });
                  }}
                  placeholder="ID del producto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ps.descuento || ''}
                  onChange={(e) => {
                    const updated = [...formData.productosSugeridos];
                    updated[index].descuento = parseInt(e.target.value) || undefined;
                    setFormData({ ...formData, productosSugeridos: updated });
                  }}
                  placeholder="% desc"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {formData.productosSugeridos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProductoSugerido(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addProductoSugerido}
          className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          <Plus className="w-4 h-4" />
          Añadir producto
        </button>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          {sugerencia ? 'Guardar cambios' : 'Crear sugerencia'}
        </button>
      </div>
    </form>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function SugerenciasPage() {
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoSugerencia | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editingSugerencia, setEditingSugerencia] = useState<Sugerencia | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sugerenciasRes, estadisticasRes] = await Promise.all([
        sugerenciasService.getAll({
          busqueda: searchTerm || undefined,
          tipo: filtroTipo || undefined,
        }),
        sugerenciasService.getEstadisticas(),
      ]);

      setSugerencias(sugerenciasRes.data);
      setEstadisticas(estadisticasRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filtroTipo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data: CreateSugerenciaDTO) => {
    try {
      if (editingSugerencia) {
        await sugerenciasService.update(editingSugerencia._id, data);
      } else {
        await sugerenciasService.create(data);
      }
      setShowForm(false);
      setEditingSugerencia(null);
      loadData();
    } catch (error) {
      console.error('Error guardando sugerencia:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estas seguro de eliminar esta sugerencia?')) return;
    try {
      await sugerenciasService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error eliminando sugerencia:', error);
    }
  };

  const handleToggleActivo = async (sugerencia: Sugerencia) => {
    try {
      await sugerenciasService.update(sugerencia._id, { activo: !sugerencia.activo });
      loadData();
    } catch (error) {
      console.error('Error actualizando sugerencia:', error);
    }
  };

  const getTipoIcon = (tipo: TipoSugerencia) => {
    const icons: Record<TipoSugerencia, any> = {
      complementario: UtensilsCrossed,
      upgrade: TrendingUp,
      alternativa: RefreshCw,
      acompanamiento: UtensilsCrossed,
      postre: Coffee,
      bebida: Wine,
    };
    return icons[tipo] || Lightbulb;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Lightbulb className="w-7 h-7 text-yellow-500" />
            Sugerencias de Productos
          </h1>
          <p className="text-gray-600 mt-1">Configura las sugerencias automaticas para aumentar ventas</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setEditingSugerencia(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Nueva sugerencia
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totales.totalSugerencias}</p>
                <p className="text-sm text-gray-500">Sugerencias activas</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totales.totalVistas}</p>
                <p className="text-sm text-gray-500">Veces mostradas</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totales.totalAceptadas}</p>
                <p className="text-sm text-gray-500">Veces aceptadas</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.tasaAceptacionGlobal}%</p>
                <p className="text-sm text-gray-500">Tasa de aceptacion</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar sugerencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Todos los tipos</option>
          <option value="complementario">Complementario</option>
          <option value="upgrade">Mejora</option>
          <option value="alternativa">Alternativa</option>
          <option value="acompanamiento">Acompañamiento</option>
          <option value="postre">Postre</option>
          <option value="bebida">Bebida</option>
        </select>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingSugerencia ? 'Editar sugerencia' : 'Nueva sugerencia'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingSugerencia(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <SugerenciaForm
                sugerencia={editingSugerencia}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditingSugerencia(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lista de sugerencias */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : sugerencias.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No hay sugerencias configuradas</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Crear primera sugerencia
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sugerencias.map(sugerencia => {
            const TipoIcon = getTipoIcon(sugerencia.tipo);
            return (
              <div
                key={sugerencia._id}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  sugerencia.activo ? 'border-gray-200' : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${sugerenciasService.getTipoColor(sugerencia.tipo)}20` }}
                    >
                      <TipoIcon
                        className="w-6 h-6"
                        style={{ color: sugerenciasService.getTipoColor(sugerencia.tipo) }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{sugerencia.nombre}</h3>
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${sugerenciasService.getTipoColor(sugerencia.tipo)}20`,
                            color: sugerenciasService.getTipoColor(sugerencia.tipo),
                          }}
                        >
                          {sugerenciasService.getTipoLabel(sugerencia.tipo)}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          {sugerenciasService.getMomentoLabel(sugerencia.momento)}
                        </span>
                      </div>
                      {sugerencia.descripcion && (
                        <p className="text-sm text-gray-500 mt-0.5">{sugerencia.descripcion}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {sugerencia.vecesVista} vistas
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {sugerencia.vecesAceptada} aceptadas
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {sugerencia.tasaAceptacion || 0}% conversion
                        </span>
                        <span className="flex items-center gap-1">
                          Prioridad: {sugerencia.prioridad}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActivo(sugerencia)}
                      className={`p-2 rounded-lg transition-colors ${
                        sugerencia.activo
                          ? 'text-green-600 bg-green-50 hover:bg-green-100'
                          : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                      }`}
                      title={sugerencia.activo ? 'Desactivar' : 'Activar'}
                    >
                      {sugerencia.activo ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingSugerencia(sugerencia);
                        setShowForm(true);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sugerencia._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
