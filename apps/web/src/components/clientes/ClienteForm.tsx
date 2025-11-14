'use client'

import React, { useState, useEffect } from 'react'
import { Cliente, CreateClienteDTO, UpdateClienteDTO } from '@/types/cliente.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete'

interface ClienteFormProps {
  initialData?: Cliente
  onSubmit: (data: CreateClienteDTO | UpdateClienteDTO) => Promise<void>  // ✅ Acepta ambos tipos
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export function ClienteForm({
  initialData,
  onSubmit,
  isLoading = false,
  mode = 'create',
}: ClienteFormProps) {
  const [formData, setFormData] = useState<CreateClienteDTO>({
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
  })

  const [usarDireccionEnvio, setUsarDireccionEnvio] = useState(false)

  // Cargar datos iniciales si existen
  useEffect(() => {
    if (initialData) {
      setFormData({
        tipoCliente: initialData.tipoCliente,
        codigo: initialData.codigo,
        nombre: initialData.nombre,
        nombreComercial: initialData.nombreComercial,
        nif: initialData.nif,
        email: initialData.email,
        telefono: initialData.telefono,
        movil: initialData.movil,
        web: initialData.web,
        direccion: initialData.direccion,
        direccionEnvio: initialData.direccionEnvio,
        formaPago: initialData.formaPago,
        diasPago: initialData.diasPago,
        descuentoGeneral: initialData.descuentoGeneral,
        tarifaId: initialData.tarifaId,
        iban: initialData.iban,
        swift: initialData.swift,
        personaContacto: initialData.personaContacto,
        categoriaId: initialData.categoriaId,
        zona: initialData.zona,
        vendedorId: initialData.vendedorId,
        limiteCredito: initialData.limiteCredito,
        activo: initialData.activo,
        observaciones: initialData.observaciones,
        tags: initialData.tags,
      })
      setUsarDireccionEnvio(!!initialData.direccionEnvio)
    }
  }, [initialData])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }))
  }

  const handleDireccionChange = (
    campo: string,
    value: string,
    esDireccionEnvio: boolean = false
  ) => {
    if (esDireccionEnvio) {
      setFormData((prev) => ({
        ...prev,
        direccionEnvio: {
          ...(prev.direccionEnvio || {
            calle: '',
            codigoPostal: '',
            ciudad: '',
            provincia: '',
            pais: 'España',
          }),
          [campo]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        direccion: {
          ...prev.direccion!,
          [campo]: value,
        },
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const dataToSubmit = { ...formData }

    if (!usarDireccionEnvio) {
      delete dataToSubmit.direccionEnvio
    }

    await onSubmit(dataToSubmit)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ============================================ */}
      {/* TIPO DE CLIENTE */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipoCliente">Tipo *</Label>
            <select
              id="tipoCliente"
              name="tipoCliente"
              value={formData.tipoCliente}
              onChange={handleChange}
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="particular">Particular</option>
              <option value="empresa">Empresa</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="h-4 w-4 rounded border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <Label htmlFor="activo" className="cursor-pointer">
              Cliente Activo
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* DATOS BÁSICOS */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Básicos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código {mode === 'create' && '(opcional)'}</Label>
            <div className="relative">
              <Input
                id="codigo"
                name="codigo"
                value={formData.codigo || ''}
                onChange={handleChange}
                onKeyDown={async (e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    try {
                      // Extraer prefijo del código actual
                      const codigoActual = e.currentTarget.value
                      const match = codigoActual.match(/^([A-Za-z]+-?)/)
                      const prefijo = match ? match[1] : undefined

                      // Llamar al servicio para sugerir código
                      const { clientesService } = await import('@/services/clientes.service')
                      const response = await clientesService.sugerirSiguienteCodigo(prefijo)

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
                placeholder={mode === 'create' ? 'Ej: CLI-001 (vacío para autogenerar)' : 'Código del cliente'}
                disabled={mode === 'edit'}
                className={mode === 'edit' ? 'bg-muted' : ''}
              />
              {mode === 'create' && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Presiona ↓ para sugerir el siguiente código disponible
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nif">NIF/CIF *</Label>
            <Input
              id="nif"
              name="nif"
              value={formData.nif}
              onChange={handleChange}
              required
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="nombre">Nombre / Razón Social *</Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="nombreComercial">Nombre Comercial</Label>
            <Input
              id="nombreComercial"
              name="nombreComercial"
              value={formData.nombreComercial || ''}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* DATOS DE CONTACTO */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              value={formData.telefono || ''}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="movil">Móvil</Label>
            <Input
              id="movil"
              name="movil"
              type="tel"
              value={formData.movil || ''}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="web">Sitio Web</Label>
            <Input
              id="web"
              name="web"
              type="url"
              value={formData.web || ''}
              onChange={handleChange}
              placeholder="https://"
            />
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* DIRECCIÓN PRINCIPAL */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Dirección Principal *</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Buscador de direcciones con Google Maps */}
          <div className="md:col-span-2">
            <AddressAutocomplete
              label="Buscar dirección con Google Maps"
              placeholder="Empieza a escribir una dirección..."
              onAddressSelect={(address) => {
                setFormData((prev) => ({
                  ...prev,
                  direccion: {
                    calle: address.calle,
                    numero: address.numero,
                    codigoPostal: address.codigoPostal,
                    ciudad: address.ciudad,
                    provincia: address.provincia,
                    pais: address.pais,
                    latitud: address.latitud,
                    longitud: address.longitud,
                  },
                }))
              }}
            />
          </div>

          {/* Separador */}
          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O rellenar manualmente
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="direccion-calle">Calle *</Label>
            <Input
              id="direccion-calle"
              value={formData.direccion?.calle || ''}
              onChange={(e) => handleDireccionChange('calle', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion-numero">Número</Label>
            <Input
              id="direccion-numero"
              value={formData.direccion?.numero || ''}
              onChange={(e) => handleDireccionChange('numero', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion-piso">Piso/Puerta</Label>
            <Input
              id="direccion-piso"
              value={formData.direccion?.piso || ''}
              onChange={(e) => handleDireccionChange('piso', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion-cp">Código Postal *</Label>
            <Input
              id="direccion-cp"
              value={formData.direccion?.codigoPostal || ''}
              onChange={(e) => handleDireccionChange('codigoPostal', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion-ciudad">Ciudad *</Label>
            <Input
              id="direccion-ciudad"
              value={formData.direccion?.ciudad || ''}
              onChange={(e) => handleDireccionChange('ciudad', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion-provincia">Provincia *</Label>
            <Input
              id="direccion-provincia"
              value={formData.direccion?.provincia || ''}
              onChange={(e) => handleDireccionChange('provincia', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion-pais">País *</Label>
            <Input
              id="direccion-pais"
              value={formData.direccion?.pais || 'España'}
              onChange={(e) => handleDireccionChange('pais', e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* DIRECCIÓN DE ENVÍO */}
      {/* ============================================ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Dirección de Envío</CardTitle>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="usar-direccion-envio"
              checked={usarDireccionEnvio}
              onChange={(e) => setUsarDireccionEnvio(e.target.checked)}
              className="h-4 w-4 rounded border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <Label htmlFor="usar-direccion-envio" className="cursor-pointer">
              Usar dirección diferente
            </Label>
          </div>
        </CardHeader>

        {usarDireccionEnvio && (
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buscador de direcciones con Google Maps */}
            <div className="md:col-span-2">
              <AddressAutocomplete
                label="Buscar dirección de envío con Google Maps"
                placeholder="Empieza a escribir una dirección..."
                onAddressSelect={(address) => {
                  setFormData((prev) => ({
                    ...prev,
                    direccionEnvio: {
                      calle: address.calle,
                      numero: address.numero,
                      codigoPostal: address.codigoPostal,
                      ciudad: address.ciudad,
                      provincia: address.provincia,
                      pais: address.pais,
                      latitud: address.latitud,
                      longitud: address.longitud,
                    },
                  }))
                }}
              />
            </div>

            {/* Separador */}
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O rellenar manualmente
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="envio-calle">Calle</Label>
              <Input
                id="envio-calle"
                value={formData.direccionEnvio?.calle || ''}
                onChange={(e) => handleDireccionChange('calle', e.target.value, true)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="envio-numero">Número</Label>
              <Input
                id="envio-numero"
                value={formData.direccionEnvio?.numero || ''}
                onChange={(e) => handleDireccionChange('numero', e.target.value, true)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="envio-piso">Piso/Puerta</Label>
              <Input
                id="envio-piso"
                value={formData.direccionEnvio?.piso || ''}
                onChange={(e) => handleDireccionChange('piso', e.target.value, true)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="envio-cp">Código Postal</Label>
              <Input
                id="envio-cp"
                value={formData.direccionEnvio?.codigoPostal || ''}
                onChange={(e) => handleDireccionChange('codigoPostal', e.target.value, true)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="envio-ciudad">Ciudad</Label>
              <Input
                id="envio-ciudad"
                value={formData.direccionEnvio?.ciudad || ''}
                onChange={(e) => handleDireccionChange('ciudad', e.target.value, true)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="envio-provincia">Provincia</Label>
              <Input
                id="envio-provincia"
                value={formData.direccionEnvio?.provincia || ''}
                onChange={(e) => handleDireccionChange('provincia', e.target.value, true)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="envio-pais">País</Label>
              <Input
                id="envio-pais"
                value={formData.direccionEnvio?.pais || 'España'}
                onChange={(e) => handleDireccionChange('pais', e.target.value, true)}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* ============================================ */}
      {/* DATOS COMERCIALES */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Comerciales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="formaPago">Forma de Pago *</Label>
            <select
              id="formaPago"
              name="formaPago"
              value={formData.formaPago}
              onChange={handleChange}
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="contado">Contado</option>
              <option value="transferencia">Transferencia</option>
              <option value="domiciliacion">Domiciliación</option>
              <option value="confirming">Confirming</option>
              <option value="pagare">Pagaré</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diasPago">Días de Pago *</Label>
            <Input
              id="diasPago"
              name="diasPago"
              type="number"
              value={formData.diasPago}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descuentoGeneral">Descuento General (%)</Label>
            <Input
              id="descuentoGeneral"
              name="descuentoGeneral"
              type="number"
              value={formData.descuentoGeneral || ''}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limiteCredito">Límite de Crédito (€)</Label>
            <Input
              id="limiteCredito"
              name="limiteCredito"
              type="number"
              value={formData.limiteCredito || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* DATOS BANCARIOS */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Bancarios</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              name="iban"
              value={formData.iban || ''}
              onChange={handleChange}
              placeholder="ES00 0000 0000 0000 0000 0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="swift">SWIFT/BIC</Label>
            <Input
              id="swift"
              name="swift"
              value={formData.swift || ''}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* OBSERVACIONES */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="observaciones"
            value={formData.observaciones || ''}
            onChange={handleChange}
            rows={4}
            placeholder="Observaciones adicionales sobre el cliente..."
          />
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* BOTONES */}
      {/* ============================================ */}
      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  )
}

// También exportar como default para compatibilidad
export default ClienteForm