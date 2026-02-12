'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Coffee,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  User,
  MapPin,
  Key,
  Settings,
  Check,
  X,
} from 'lucide-react';
import { camarerosService, Camarero, EstadoCamarero, Turno, CreateCamareroDTO, UpdateCamareroDTO } from '@/services/camareros.service';
import { salonesService, Salon } from '@/services/salones.service';

// ============================================
// COMPONENTES
// ============================================

interface CamareroFormProps {
  camarero?: Camarero | null;
  salones: Salon[];
  onSave: (data: CreateCamareroDTO | UpdateCamareroDTO) => void;
  onCancel: () => void;
}

function CamareroForm({ camarero, salones, onSave, onCancel }: CamareroFormProps) {
  const [formData, setFormData] = useState<CreateCamareroDTO>({
    usuarioId: '',
    nombre: camarero?.nombre || '',
    apellidos: camarero?.apellidos || '',
    alias: camarero?.alias || '',
    codigo: camarero?.codigo || '',
    pin: '',
    color: camarero?.color || '#3b82f6',
    salonesAsignados: (camarero?.salonesAsignados as any)?.map((s: any) => s._id || s) || [],
    comisionPorcentaje: camarero?.comisionPorcentaje || 0,
    permisos: {
      puedeAnularLineas: camarero?.permisos?.puedeAnularLineas ?? false,
      puedeAplicarDescuentos: camarero?.permisos?.puedeAplicarDescuentos ?? true,
      puedeCobrar: camarero?.permisos?.puedeCobrar ?? true,
      puedeReimprimir: camarero?.permisos?.puedeReimprimir ?? true,
      puedeTraspasar: camarero?.permisos?.puedeTraspasar ?? true,
      limiteDescuento: camarero?.permisos?.limiteDescuento ?? 100,
    },
  });

  const [activeTab, setActiveTab] = useState<'general' | 'salones' | 'permisos' | 'turnos'>('general');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (camarero) {
      const { usuarioId, ...updateData } = formData;
      onSave(updateData);
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'general', label: 'General', icon: User },
          { id: 'salones', label: 'Salones', icon: MapPin },
          { id: 'permisos', label: 'Permisos', icon: Key },
          { id: 'turnos', label: 'Turnos', icon: Clock },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab General */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
            <input
              type="text"
              value={formData.apellidos}
              onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alias (nombre corto)</label>
            <input
              type="text"
              maxLength={10}
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              placeholder="Ej: Juan"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codigo *</label>
            <input
              type="text"
              required
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              placeholder="CAM001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4 digitos)</label>
            <input
              type="password"
              maxLength={4}
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
              placeholder={camarero ? '****' : '1234'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color identificativo</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comision (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={formData.comisionPorcentaje}
              onChange={(e) => setFormData({ ...formData, comisionPorcentaje: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {!camarero && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario asociado *</label>
              <input
                type="text"
                required
                value={formData.usuarioId}
                onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                placeholder="ID del usuario"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Introduce el ID del usuario del sistema</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Salones */}
      {activeTab === 'salones' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Selecciona los salones donde puede trabajar este camarero:</p>
          <div className="grid grid-cols-2 gap-3">
            {salones.map(salon => (
              <label
                key={salon._id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.salonesAsignados?.includes(salon._id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.salonesAsignados?.includes(salon._id)}
                  onChange={(e) => {
                    const current = formData.salonesAsignados || [];
                    if (e.target.checked) {
                      setFormData({ ...formData, salonesAsignados: [...current, salon._id] });
                    } else {
                      setFormData({ ...formData, salonesAsignados: current.filter(id => id !== salon._id) });
                    }
                  }}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: salon.color || '#3b82f6' }}
                />
                <span className="font-medium">{salon.nombre}</span>
              </label>
            ))}
          </div>
          {salones.length === 0 && (
            <p className="text-gray-500 text-center py-8">No hay salones configurados</p>
          )}
        </div>
      )}

      {/* Tab Permisos */}
      {activeTab === 'permisos' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Configura los permisos del camarero:</p>
          <div className="space-y-3">
            {[
              { key: 'puedeCobrar', label: 'Puede cobrar', desc: 'Permite realizar cobros de mesas' },
              { key: 'puedeAplicarDescuentos', label: 'Puede aplicar descuentos', desc: 'Permite aplicar descuentos en productos' },
              { key: 'puedeAnularLineas', label: 'Puede anular lineas', desc: 'Permite anular productos de un pedido' },
              { key: 'puedeReimprimir', label: 'Puede reimprimir', desc: 'Permite reimprimir comandas y tickets' },
              { key: 'puedeTraspasar', label: 'Puede traspasar mesas', desc: 'Permite traspasar mesas a otros camareros' },
            ].map(permiso => (
              <label
                key={permiso.key}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{permiso.label}</p>
                  <p className="text-sm text-gray-500">{permiso.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(formData.permisos as any)?.[permiso.key]}
                  onChange={(e) => setFormData({
                    ...formData,
                    permisos: { ...formData.permisos, [permiso.key]: e.target.checked }
                  })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
              </label>
            ))}
            {formData.permisos?.puedeAplicarDescuentos && (
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite de descuento (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.permisos.limiteDescuento || 100}
                  onChange={(e) => setFormData({
                    ...formData,
                    permisos: { ...formData.permisos, limiteDescuento: parseInt(e.target.value) || 0 }
                  })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Turnos */}
      {activeTab === 'turnos' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Los turnos se configuran desde el módulo de RRHH</p>
          <div className="p-8 bg-gray-50 rounded-lg text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Configura los turnos en Configuracion &gt; Personal &gt; Turnos</p>
          </div>
        </div>
      )}

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
          {camarero ? 'Guardar cambios' : 'Crear camarero'}
        </button>
      </div>
    </form>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function CamarerosPage() {
  const router = useRouter();
  const [camareros, setCamareros] = useState<Camarero[]>([]);
  const [salones, setSalones] = useState<Salon[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoCamarero | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editingCamarero, setEditingCamarero] = useState<Camarero | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [camarerosRes, salonesRes, resumenRes] = await Promise.all([
        camarerosService.getAll({
          busqueda: searchTerm || undefined,
          estado: filtroEstado || undefined,
        }),
        salonesService.getAll(),
        camarerosService.getResumen(),
      ]);

      setCamareros(camarerosRes.data);
      setSalones(salonesRes.data);
      setResumen(resumenRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filtroEstado]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data: CreateCamareroDTO | UpdateCamareroDTO) => {
    try {
      if (editingCamarero) {
        await camarerosService.update(editingCamarero._id, data);
      } else {
        await camarerosService.create(data as CreateCamareroDTO);
      }
      setShowForm(false);
      setEditingCamarero(null);
      loadData();
    } catch (error) {
      console.error('Error guardando camarero:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estas seguro de eliminar este camarero?')) return;
    try {
      await camarerosService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error eliminando camarero:', error);
    }
  };

  const handleCambiarEstado = async (id: string, estado: EstadoCamarero) => {
    try {
      await camarerosService.cambiarEstado(id, estado);
      loadData();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const handleResetPropinas = async (id: string) => {
    if (!confirm('¿Estas seguro de resetear las propinas de este camarero?')) return;
    try {
      const result = await camarerosService.resetearPropinas(id);
      alert(`Propinas reseteadas: ${result.propinasResetadas.toFixed(2)} €`);
      loadData();
    } catch (error) {
      console.error('Error reseteando propinas:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-primary-600" />
            Gestion de Camareros
          </h1>
          <p className="text-gray-600 mt-1">Configura y gestiona el personal de sala</p>
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
              setEditingCamarero(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Nuevo camarero
          </button>
        </div>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumen.totalCamareros}</p>
                <p className="text-sm text-gray-500">Total camareros</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumen.activos}</p>
                <p className="text-sm text-gray-500">Activos ahora</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Coffee className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumen.enDescanso}</p>
                <p className="text-sm text-gray-500">En descanso</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumen.totalPropinas.toFixed(2)} €</p>
                <p className="text-sm text-gray-500">Propinas acumuladas</p>
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
            placeholder="Buscar camarero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="en_descanso">En descanso</option>
          <option value="fuera_turno">Fuera de turno</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingCamarero ? 'Editar camarero' : 'Nuevo camarero'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingCamarero(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <CamareroForm
                camarero={editingCamarero}
                salones={salones}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditingCamarero(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lista de camareros */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : camareros.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No hay camareros configurados</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Crear primer camarero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {camareros.map(camarero => (
            <div
              key={camarero._id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header con color */}
              <div
                className="h-2"
                style={{ backgroundColor: camarero.color || '#3b82f6' }}
              />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: camarero.color || '#3b82f6' }}
                    >
                      {camarero.alias?.[0] || camarero.nombre[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {camarerosService.getNombreCompleto(camarero)}
                      </h3>
                      <p className="text-sm text-gray-500">{camarero.codigo}</p>
                    </div>
                  </div>
                  <span
                    className="px-2 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: `${camarerosService.getEstadoColor(camarero.estado)}20`,
                      color: camarerosService.getEstadoColor(camarero.estado),
                    }}
                  >
                    {camarerosService.getEstadoLabel(camarero.estado)}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {(camarero.salonesAsignados as any)?.length || 0} salones asignados
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      Propinas: {camarero.propinasAcumuladas.toFixed(2)} €
                    </span>
                  </div>
                  {camarero.comisionPorcentaje > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Settings className="w-4 h-4" />
                      <span>Comision: {camarero.comisionPorcentaje}%</span>
                    </div>
                  )}
                </div>

                {/* Acciones estado */}
                <div className="flex gap-2 mb-3">
                  {camarero.estado !== 'activo' && (
                    <button
                      onClick={() => handleCambiarEstado(camarero._id, 'activo')}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                    >
                      Activar
                    </button>
                  )}
                  {camarero.estado === 'activo' && (
                    <button
                      onClick={() => handleCambiarEstado(camarero._id, 'en_descanso')}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100"
                    >
                      Descanso
                    </button>
                  )}
                  {camarero.estado !== 'fuera_turno' && (
                    <button
                      onClick={() => handleCambiarEstado(camarero._id, 'fuera_turno')}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      Fin turno
                    </button>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => {
                      setEditingCamarero(camarero);
                      setShowForm(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  {camarero.propinasAcumuladas > 0 && (
                    <button
                      onClick={() => handleResetPropinas(camarero._id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded-lg"
                    >
                      <DollarSign className="w-4 h-4" />
                      Reset propinas
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(camarero._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
