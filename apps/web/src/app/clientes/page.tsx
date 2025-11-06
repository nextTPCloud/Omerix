'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientesService, Cliente, GetClientesParams, Estadisticas } from '@/services/clientes.service';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

// Columnas disponibles para mostrar
const COLUMNAS_DISPONIBLES = [
  { key: 'codigo', label: 'Código', sortable: true },
  { key: 'nombre', label: 'Nombre', sortable: true },
  { key: 'nif', label: 'NIF/CIF', sortable: true },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'telefono', label: 'Teléfono', sortable: false },
  { key: 'ciudad', label: 'Ciudad', sortable: true },
  { key: 'formaPago', label: 'Forma Pago', sortable: true },
  { key: 'riesgoActual', label: 'Riesgo', sortable: true },
  { key: 'activo', label: 'Estado', sortable: true },
];

export default function ClientesPage() {
  const router = useRouter();
  
  // Estado
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Filtros y paginación
  const [params, setParams] = useState<GetClientesParams>({
    page: 1,
    limit: 10,
    sortBy: 'fechaCreacion',
    sortOrder: 'desc',
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  
  // UI
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarSelectorColumnas, setMostrarSelectorColumnas] = useState(false);
  const [columnasVisibles, setColumnasVisibles] = useState<string[]>([
    'codigo',
    'nombre',
    'nif',
    'ciudad',
    'telefono',
    'activo',
  ]);

  // ============================================
  // CARGAR DATOS
  // ============================================
  
  useEffect(() => {
    cargarDatos();
    cargarEstadisticas();
  }, [params]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await clientesService.obtenerTodos(params);
      setClientes(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      alert('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const stats = await clientesService.obtenerEstadisticas();
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  // ============================================
  // ORDENAMIENTO
  // ============================================
  
  const handleSort = (column: string) => {
    setParams(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  // ============================================
  // SELECCIÓN MÚLTIPLE
  // ============================================
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(clientes.map(c => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  // ============================================
  // ELIMINACIÓN
  // ============================================
  
  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      return;
    }

    try {
      await clientesService.eliminar(id);
      alert('Cliente eliminado exitosamente');
      cargarDatos();
      cargarEstadisticas();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      alert('Error al eliminar el cliente');
    }
  };

  const handleEliminarMultiples = async () => {
    if (selectedIds.length === 0) {
      alert('Selecciona al menos un cliente');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.length} cliente(s)?`)) {
      return;
    }

    try {
      await clientesService.eliminarMultiples(selectedIds);
      alert(`${selectedIds.length} cliente(s) eliminado(s) exitosamente`);
      setSelectedIds([]);
      cargarDatos();
      cargarEstadisticas();
    } catch (error) {
      console.error('Error al eliminar clientes:', error);
      alert('Error al eliminar los clientes');
    }
  };

  // ============================================
  // CAMBIAR ESTADO
  // ============================================
  
  const handleCambiarEstado = async (id: string, activo: boolean) => {
    try {
      await clientesService.cambiarEstado(id, !activo);
      alert(`Cliente ${!activo ? 'activado' : 'desactivado'} exitosamente`);
      cargarDatos();
      cargarEstadisticas();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado del cliente');
    }
  };

  // ============================================
  // EXPORTAR
  // ============================================
  
  const handleExportar = async () => {
    try {
      const blob = await clientesService.exportarCSV(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  };

  // ============================================
  // PAGINACIÓN
  // ============================================
  
  const handlePageChange = (newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setParams(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // ============================================
  // BÚSQUEDA
  // ============================================
  
  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, page: 1 }));
  };

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* ============================================ */}
      {/* ENCABEZADO */}
      {/* ============================================ */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <button
          onClick={() => router.push('/clientes/nuevo')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* ============================================ */}
      {/* ESTADÍSTICAS */}
      {/* ============================================ */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Clientes</div>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-sm text-green-600">Activos</div>
            <div className="text-2xl font-bold text-green-700">{estadisticas.activos}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <div className="text-sm text-red-600">Inactivos</div>
            <div className="text-2xl font-bold text-red-700">{estadisticas.inactivos}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <div className="text-sm text-yellow-600">Exceden Crédito</div>
            <div className="text-2xl font-bold text-yellow-700">{estadisticas.excedenCredito}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-sm text-blue-600">Riesgo Total</div>
            <div className="text-2xl font-bold text-blue-700">
              {estadisticas.riesgoTotal.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* BARRA DE HERRAMIENTAS */}
      {/* ============================================ */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar clientes..."
            className="flex-1 min-w-[200px] border rounded-md px-3 py-2"
            onChange={e => {
              const value = e.target.value;
              const timeoutId = setTimeout(() => handleSearch(value), 500);
              return () => clearTimeout(timeoutId);
            }}
          />

          {/* Botones */}
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center space-x-2 border rounded-md px-3 py-2 hover:bg-gray-50"
          >
            <FunnelIcon className="w-5 h-5" />
            <span>Filtros</span>
          </button>

          <button
            onClick={() => setMostrarSelectorColumnas(!mostrarSelectorColumnas)}
            className="flex items-center space-x-2 border rounded-md px-3 py-2 hover:bg-gray-50"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            <span>Columnas</span>
          </button>

          <button
            onClick={handleExportar}
            className="flex items-center space-x-2 border rounded-md px-3 py-2 hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>Exportar</span>
          </button>

          {selectedIds.length > 0 && (
            <button
              onClick={handleEliminarMultiples}
              className="flex items-center space-x-2 bg-red-600 text-white rounded-md px-3 py-2 hover:bg-red-700"
            >
              <TrashIcon className="w-5 h-5" />
              <span>Eliminar ({selectedIds.length})</span>
            </button>
          )}
        </div>

        {/* Selector de columnas */}
        {mostrarSelectorColumnas && (
          <div className="mt-4 p-4 border rounded-md bg-gray-50">
            <h3 className="font-semibold mb-2">Columnas visibles:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COLUMNAS_DISPONIBLES.map(col => (
                <label key={col.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={columnasVisibles.includes(col.key)}
                    onChange={e => {
                      if (e.target.checked) {
                        setColumnasVisibles([...columnasVisibles, col.key]);
                      } else {
                        setColumnasVisibles(columnasVisibles.filter(k => k !== col.key));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* TABLA */}
      {/* ============================================ */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === clientes.length && clientes.length > 0}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
                {COLUMNAS_DISPONIBLES.filter(col => columnasVisibles.includes(col.key)).map(col => (
                  <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold">
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center space-x-1 hover:text-blue-600"
                      >
                        <span>{col.label}</span>
                        {params.sortBy === col.key && (
                          params.sortOrder === 'asc' ? 
                            <ArrowUpIcon className="w-4 h-4" /> : 
                            <ArrowDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={columnasVisibles.length + 2} className="px-4 py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={columnasVisibles.length + 2} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                clientes.map(cliente => (
                  <tr key={cliente._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(cliente._id)}
                        onChange={e => handleSelectOne(cliente._id, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    {columnasVisibles.includes('codigo') && (
                      <td className="px-4 py-3 text-sm">{cliente.codigo}</td>
                    )}
                    {columnasVisibles.includes('nombre') && (
                      <td className="px-4 py-3 text-sm font-medium">{cliente.nombre}</td>
                    )}
                    {columnasVisibles.includes('nif') && (
                      <td className="px-4 py-3 text-sm">{cliente.nif}</td>
                    )}
                    {columnasVisibles.includes('email') && (
                      <td className="px-4 py-3 text-sm">{cliente.email || '-'}</td>
                    )}
                    {columnasVisibles.includes('telefono') && (
                      <td className="px-4 py-3 text-sm">{cliente.telefono || '-'}</td>
                    )}
                    {columnasVisibles.includes('ciudad') && (
                      <td className="px-4 py-3 text-sm">{cliente.direccion.ciudad}</td>
                    )}
                    {columnasVisibles.includes('formaPago') && (
                      <td className="px-4 py-3 text-sm capitalize">{cliente.formaPago}</td>
                    )}
                    {columnasVisibles.includes('riesgoActual') && (
                      <td className="px-4 py-3 text-sm">
                        {cliente.riesgoActual.toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </td>
                    )}
                    {columnasVisibles.includes('activo') && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleCambiarEstado(cliente._id, cliente.activo)}
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            cliente.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => router.push(`/clientes/${cliente._id}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => router.push(`/clientes/${cliente._id}/editar`)}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEliminar(cliente._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================ */}
        {/* PAGINACIÓN */}
        {/* ============================================ */}
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Mostrar:</span>
            <select
              value={params.limit}
              onChange={e => handleLimitChange(Number(e.target.value))}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-gray-700">
              de {pagination.total} registros
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}