'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ClienteForm from '@/components/clientes/ClienteForm';
import { clientesService, Cliente } from '@/services/clientes.service';

export default function NuevoClientePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: Partial<Cliente>) => {
    try {
      setIsLoading(true);
      await clientesService.crear(data);
      alert('Cliente creado exitosamente');
      router.push('/clientes');
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      alert(error.response?.data?.message || 'Error al crear el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/clientes');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
        <p className="text-gray-600 mt-2">
          Completa el formulario para crear un nuevo cliente
        </p>
      </div>

      <ClienteForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}