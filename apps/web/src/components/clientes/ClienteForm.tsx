'use client';

import React, { useState, useEffect } from 'react';
import { Cliente } from '@/services/clientes.service';

interface ClienteFormProps {
  cliente?: Cliente;
  onSubmit: (data: Partial<Cliente>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ClienteForm({
  cliente,
  onSubmit,
  onCancel,
  isLoading = false,
}: ClienteFormProps) {
  const [formData, setFormData] = useState<Partial<Cliente>>({
    tipoCliente: 'particular',
    nombre: '',
    nif: '',
    formaPago: 'contado',
    diasPago: 0,
    direccion: {
      calle: '',
      codigoPostal: '',
      ciudad: '',
      provincia: '',
      pais: 'España',
    },
    activo: true,
    ...cliente,
  });

  const [usarDireccionEnvio, setUsarDireccionEnvio] = useState(!!cliente?.direccionEnvio);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleDireccionChange = (
    campo: string,
    value: string,
    esDireccionEnvio: boolean = false
  ) => {
    if (esDireccionEnvio) {
      setFormData(prev => ({
        ...prev,
        direccionEnvio: {
          ...prev.direccionEnvio!,
          [campo]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        direccion: {
          ...prev.direccion!,
          [campo]: value,
        },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = { ...formData };
    
    if (!usarDireccionEnvio) {
      delete dataToSubmit.direccionEnvio;
    }
    
    await onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ============================================ */}
      {/* TIPO DE CLIENTE */}
      {/* ============================================ */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Tipo de Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo *</label>
            <select
              name="tipoCliente"
              value={formData.tipoCliente}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="particular">Particular</option>
              <option value="empresa">Empresa</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium">Cliente Activo</span>
            </label>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* DATOS BÁSICOS */}
      {/* ============================================ */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Datos Básicos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Código</label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo || ''}
              onChange={handleChange}
              placeholder="Se generará automáticamente"
              disabled
              className="w-full border rounded-md px-3 py-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">NIF/CIF *</label>
            <input
              type="text"
              name="nif"
              value={formData.nif}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Nombre / Razón Social *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Nombre Comercial</label>
            <input
              type="text"
              name="nombreComercial"
              value={formData.nombreComercial || ''}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* DATOS DE CONTACTO */}
      {/* ============================================ */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Datos de Contacto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono || ''}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Móvil</label>
            <input
              type="tel"
              name="movil"
              value={formData.movil || ''}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sitio Web</label>
            <input
              type="url"
              name="web"
              value={formData.web || ''}
              onChange={handleChange}
              placeholder="https://"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* DIRECCIÓN PRINCIPAL */}
      {/* ============================================ */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Dirección Principal *</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Calle *</label>
            <input
              type="text"
              value={formData.direccion?.calle || ''}
              onChange={e => handleDireccionChange('calle', e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Número</label>
            <input
              type="text"
              value={formData.direccion?.numero || ''}
              onChange={e => handleDireccionChange('numero', e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Piso/Puerta</label>
            <input
              type="text"
              value={formData.direccion?.piso || ''}
              onChange={e => handleDireccionChange('piso', e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Código Postal *</label>
            <input
              type="text"
              value={formData.direccion?.codigoPostal || ''}
              onChange={e => handleDireccionChange('codigoPostal', e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ciudad *</label>
            <input
              type="text"
              value={formData.direccion?.ciudad || ''}
              onChange={e => handleDireccionChange('ciudad', e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Provincia *</label>
            <input
              type="text"
              value={formData.direccion?.provincia || ''}
              onChange={e => handleDireccionChange('provincia', e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">País *</label>
            <input
              type="text"
              value={formData.direccion?.pais || 'España'}
              onChange={e => handleDireccionChange('pais', e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* DIRECCIÓN DE ENVÍO */}
      {/* ============================================ */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Dirección de Envío</h2>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={usarDireccionEnvio}
              onChange={e => setUsarDireccionEnvio(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Usar dirección diferente</span>
          </label>
        </div>

        {usarDireccionEnvio && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Calle</label>
              <input
                type="text"
                value={formData.direccionEnvio?.calle || ''}
                onChange={e => handleDireccionChange('calle', e.target.value, true)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Número</label>
              <input
                type="text"
                value={formData.direccionEnvio?.numero || ''}
                onChange={e => handleDireccionChange('numero', e.target.value, true)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Piso/Puerta</label>
              <input
                type="text"
                value={formData.direccionEnvio?.piso || ''}
                onChange={e => handleDireccionChange('piso', e.target.value, true)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Código Postal</label>
              <input
                type="text"
                value={formData.direccionEnvio?.codigoPostal || ''}
                onChange={e => handleDireccionChange('codigoPostal', e.target.value, true)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ciudad</label>
              <input
                type="text"
                value={formData.direccionEnvio?.ciudad || ''}
                onChange={e => handleDireccionChange('ciudad', e.target.value, true)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Provincia</label>
              <input
                type="text"
                value={formData.direccionEnvio?.provincia || ''}
                onChange={e => handleDireccionChange('provincia', e.target.value, true)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">País</label>
              <input
                type="text"
                value={formData.direccionEnvio?.pais || 'España'}
                onChange={e => handleDireccionChange('pais', e.target.value, true)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* DATOS COMERCIALES */}
      {/* ============================================ */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Datos Comerciales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Forma de Pago *</label>
            <select
              name="formaPago"
              value={formData.formaPago}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="contado">Contado</option>
              <option value="transferencia">Transferencia</option>
              <option value="domiciliacion">Domiciliación</option>
              <option value="confirming">Confirming</option>
              <option value="pagare">Pagaré</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Días de Pago *</label>
            <input
              type="number"
              name="diasPago"
              value={formData.diasPago}
              onChange={handleChange}
              min="0"
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descuento General (%)</label>
            <input
              type="number"
              name="descuentoGeneral"
              value={formData.descuentoGeneral || ''}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Límite de Crédito (€)</label>
            <input
              type="number"
              name="limiteCredito"
              value={formData.limiteCredito || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* DATOS BANCARIOS */}
      {/* ============================================ */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Datos Bancarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">IBAN</label>
            <input
              type="text"
              name="iban"
              value={formData.iban || ''}
              onChange={handleChange}
              placeholder="ES00 0000 0000 0000 0000 0000"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">SWIFT/BIC</label>
            <input
              type="text"
              name="swift"
              value={formData.swift || ''}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* OBSERVACIONES */}
      {/* ============================================ */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Observaciones</h2>
        <textarea
          name="observaciones"
          value={formData.observaciones || ''}
          onChange={handleChange}
          rows={4}
          className="w-full border rounded-md px-3 py-2"
        />
      </div>

      {/* ============================================ */}
      {/* BOTONES */}
      {/* ============================================ */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : cliente ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}