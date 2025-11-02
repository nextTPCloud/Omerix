"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { clientesService } from '@/services/clientes.service'
import {
  Cliente,
  CreateClienteDTO,
  TipoCliente,
  FormaPago,
} from '@/types/cliente.types'

// Schema de validación
const clienteFormSchema = z.object({
  tipoCliente: z.nativeEnum(TipoCliente),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  nombreComercial: z.string().optional(),
  nif: z.string().min(1, 'El NIF es obligatorio'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  movil: z.string().optional(),
  web: z.string().url('URL inválida').optional().or(z.literal('')),
  direccion: z.object({
    calle: z.string().min(1, 'La calle es obligatoria'),
    numero: z.string().optional(),
    piso: z.string().optional(),
    codigoPostal: z.string().min(4, 'Código postal inválido'),
    ciudad: z.string().min(1, 'La ciudad es obligatoria'),
    provincia: z.string().min(1, 'La provincia es obligatoria'),
    pais: z.string().default('España'),
  }),
  formaPago: z.nativeEnum(FormaPago).default(FormaPago.TRANSFERENCIA),
  diasPago: z.coerce.number().min(0).default(30),
  descuentoGeneral: z.coerce.number().min(0).max(100).optional(),
  iban: z.string().optional(),
  swift: z.string().optional(),
  limiteCredito: z.coerce.number().min(0).optional(),
  activo: z.boolean().default(true),
  observaciones: z.string().optional(),
})

type ClienteFormValues = z.infer<typeof clienteFormSchema>

interface ClienteFormProps {
  cliente?: Cliente
  onSuccess?: () => void
}

export function ClienteForm({ cliente, onSuccess }: ClienteFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const isEditing = !!cliente

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: cliente
      ? {
          tipoCliente: cliente.tipoCliente,
          nombre: cliente.nombre,
          nombreComercial: cliente.nombreComercial || '',
          nif: cliente.nif,
          email: cliente.email || '',
          telefono: cliente.telefono || '',
          movil: cliente.movil || '',
          web: cliente.web || '',
          direccion: cliente.direccion,
          formaPago: cliente.formaPago,
          diasPago: cliente.diasPago,
          descuentoGeneral: cliente.descuentoGeneral || 0,
          iban: cliente.iban || '',
          swift: cliente.swift || '',
          limiteCredito: cliente.limiteCredito || 0,
          activo: cliente.activo,
          observaciones: cliente.observaciones || '',
        }
      : {
          tipoCliente: TipoCliente.PARTICULAR,
          nombre: '',
          nombreComercial: '',
          nif: '',
          email: '',
          telefono: '',
          movil: '',
          web: '',
          direccion: {
            calle: '',
            numero: '',
            piso: '',
            codigoPostal: '',
            ciudad: '',
            provincia: '',
            pais: 'España',
          },
          formaPago: FormaPago.TRANSFERENCIA,
          diasPago: 30,
          descuentoGeneral: 0,
          iban: '',
          swift: '',
          limiteCredito: 0,
          activo: true,
          observaciones: '',
        },
  })

  const onSubmit = async (values: ClienteFormValues) => {
    try {
      setLoading(true)

      const data: CreateClienteDTO = {
        ...values,
        email: values.email || undefined,
        telefono: values.telefono || undefined,
        movil: values.movil || undefined,
        web: values.web || undefined,
        nombreComercial: values.nombreComercial || undefined,
        iban: values.iban || undefined,
        swift: values.swift || undefined,
        observaciones: values.observaciones || undefined,
      }

      if (isEditing) {
        await clientesService.update(cliente._id, data)
        toast({
          title: 'Cliente actualizado',
          description: 'El cliente se ha actualizado correctamente',
        })
      } else {
        await clientesService.create(data)
        toast({
          title: 'Cliente creado',
          description: 'El cliente se ha creado correctamente',
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/clientes')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          `Error al ${isEditing ? 'actualizar' : 'crear'} el cliente`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Datos Generales</TabsTrigger>
            <TabsTrigger value="direccion">Dirección</TabsTrigger>
            <TabsTrigger value="comercial">Datos Comerciales</TabsTrigger>
          </TabsList>

          {/* TAB: Datos Generales */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="tipoCliente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Cliente *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={TipoCliente.PARTICULAR}>
                              Particular
                            </SelectItem>
                            <SelectItem value={TipoCliente.EMPRESA}>
                              Empresa
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nif"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIF/CIF *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="B12345678"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value.toUpperCase())
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre/Razón Social *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nombreComercial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Comercial</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre comercial" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@ejemplo.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="912345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="movil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Móvil</FormLabel>
                        <FormControl>
                          <Input placeholder="612345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="web"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sitio Web</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://www.ejemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Cliente Activo</FormLabel>
                        <FormDescription>
                          El cliente aparecerá en los listados y podrás realizar
                          operaciones con él
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Dirección */}
          <TabsContent value="direccion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dirección Principal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="direccion.calle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calle *</FormLabel>
                          <FormControl>
                            <Input placeholder="Calle Principal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="direccion.numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="direccion.piso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Piso/Puerta</FormLabel>
                        <FormControl>
                          <Input placeholder="2ºA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="direccion.codigoPostal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>C.P. *</FormLabel>
                        <FormControl>
                          <Input placeholder="28001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="direccion.ciudad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad *</FormLabel>
                        <FormControl>
                          <Input placeholder="Madrid" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="direccion.provincia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provincia *</FormLabel>
                        <FormControl>
                          <Input placeholder="Madrid" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="direccion.pais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País *</FormLabel>
                      <FormControl>
                        <Input placeholder="España" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Datos Comerciales */}
          <TabsContent value="comercial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Condiciones Comerciales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="formaPago"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pago</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona forma de pago" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={FormaPago.CONTADO}>
                              Contado
                            </SelectItem>
                            <SelectItem value={FormaPago.TRANSFERENCIA}>
                              Transferencia
                            </SelectItem>
                            <SelectItem value={FormaPago.DOMICILIACION}>
                              Domiciliación
                            </SelectItem>
                            <SelectItem value={FormaPago.CONFIRMING}>
                              Confirming
                            </SelectItem>
                            <SelectItem value={FormaPago.PAGARE}>Pagaré</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diasPago"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Días de Pago</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Días para el vencimiento de facturas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="descuentoGeneral"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descuento General (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="limiteCredito"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Límite de Crédito (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ES00 0000 0000 0000 0000 0000"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value.toUpperCase())
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="swift"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SWIFT/BIC</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="AAAAAABBCCC"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value.toUpperCase())
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notas adicionales sobre el cliente..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/clientes')}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Actualizar' : 'Crear'} Cliente
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}