"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clienteSchema, ClienteFormData } from '@/lib/validations/cliente.validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Cliente } from '@/types/cliente.types'

interface ClienteFormProps {
  initialData?: Cliente
  onSubmit: (data: ClienteFormData) => Promise<void>
  isLoading?: boolean
}

export function ClienteForm({ initialData, onSubmit, isLoading = false }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: initialData || {
      tipoCliente: 'particular',
      formaPago: 'transferencia',
      diasPago: 30,
      activo: true,
      direccion: {
        pais: 'España',
      },
    },
  })

  const tipoCliente = watch('tipoCliente')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tipo de Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="particular"
                {...register('tipoCliente')}
                className="h-4 w-4"
              />
              <span>Particular</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="empresa"
                {...register('tipoCliente')}
                className="h-4 w-4"
              />
              <span>Empresa</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Datos Básicos */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Básicos</CardTitle>
          <CardDescription>Información principal del cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre {tipoCliente === 'empresa' ? '/ Razón Social' : ''} *
              </Label>
              <Input
                id="nombre"
                {...register('nombre')}
                placeholder={tipoCliente === 'empresa' ? 'Empresa S.L.' : 'Juan Pérez'}
              />
              {errors.nombre && (
                <p className="text-sm text-red-500">{errors.nombre.message}</p>
              )}
            </div>

            {tipoCliente === 'empresa' && (
              <div className="space-y-2">
                <Label htmlFor="nombreComercial">Nombre Comercial</Label>
                <Input
                  id="nombreComercial"
                  {...register('nombreComercial')}
                  placeholder="Mi Empresa"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nif">NIF/CIF *</Label>
              <Input
                id="nif"
                {...register('nif')}
                placeholder={tipoCliente === 'empresa' ? 'B12345678' : '12345678A'}
              />
              {errors.nif && (
                <p className="text-sm text-red-500">{errors.nif.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacto */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="cliente@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                {...register('telefono')}
                placeholder="+34 912 345 678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movil">Móvil</Label>
              <Input
                id="movil"
                {...register('movil')}
                placeholder="+34 666 777 888"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="web">Web</Label>
              <Input
                id="web"
                {...register('web')}
                placeholder="https://www.ejemplo.com"
              />
              {errors.web && (
                <p className="text-sm text-red-500">{errors.web.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dirección */}
      <Card>
        <CardHeader>
          <CardTitle>Dirección</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion.calle">Calle *</Label>
              <Input
                id="direccion.calle"
                {...register('direccion.calle')}
                placeholder="Calle Mayor"
              />
              {errors.direccion?.calle && (
                <p className="text-sm text-red-500">{errors.direccion.calle.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion.numero">Número</Label>
              <Input
                id="direccion.numero"
                {...register('direccion.numero')}
                placeholder="123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion.piso">Piso</Label>
              <Input
                id="direccion.piso"
                {...register('direccion.piso')}
                placeholder="3º B"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion.codigoPostal">Código Postal *</Label>
              <Input
                id="direccion.codigoPostal"
                {...register('direccion.codigoPostal')}
                placeholder="28013"
              />
              {errors.direccion?.codigoPostal && (
                <p className="text-sm text-red-500">{errors.direccion.codigoPostal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion.ciudad">Ciudad *</Label>
              <Input
                id="direccion.ciudad"
                {...register('direccion.ciudad')}
                placeholder="Madrid"
              />
              {errors.direccion?.ciudad && (
                <p className="text-sm text-red-500">{errors.direccion.ciudad.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion.provincia">Provincia *</Label>
              <Input
                id="direccion.provincia"
                {...register('direccion.provincia')}
                placeholder="Madrid"
              />
              {errors.direccion?.provincia && (
                <p className="text-sm text-red-500">{errors.direccion.provincia.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion.pais">País *</Label>
              <Input
                id="direccion.pais"
                {...register('direccion.pais')}
                placeholder="España"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos Comerciales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Comerciales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="formaPago">Forma de Pago</Label>
              <select
                id="formaPago"
                {...register('formaPago')}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="contado">Contado</option>
                <option value="transferencia">Transferencia</option>
                <option value="domiciliacion">Domiciliación</option>
                <option value="confirming">Confirming</option>
                <option value="pagare">Pagaré</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diasPago">Días de Pago</Label>
              <Input
                id="diasPago"
                type="number"
                {...register('diasPago', { valueAsNumber: true })}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descuentoGeneral">Descuento General (%)</Label>
              <Input
                id="descuentoGeneral"
                type="number"
                step="0.01"
                {...register('descuentoGeneral', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limiteCredito">Límite de Crédito (€)</Label>
              <Input
                id="limiteCredito"
                type="number"
                step="0.01"
                {...register('limiteCredito', { valueAsNumber: true })}
                placeholder="10000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('observaciones')}
            placeholder="Notas adicionales sobre el cliente..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'} Cliente
        </Button>
      </div>
    </form>
  )
}