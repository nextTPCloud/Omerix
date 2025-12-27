"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, Clock, Shield, Zap, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

// Planes disponibles (sincronizado con seed-plans.ts)
const planesDisponibles = [
  {
    slug: 'solo-fichaje',
    nombre: 'Solo Fichaje',
    precio: 15,
    descripcion: 'Control horario para tu equipo',
    features: ['5 sesiones', '10 usuarios', 'RRHH + Calendarios']
  },
  {
    slug: 'starter',
    nombre: 'Starter',
    precio: 19,
    descripcion: 'Para autonomos que empiezan',
    features: ['1 sesion', '2 usuarios', '100 facturas/mes']
  },
  {
    slug: 'basico',
    nombre: 'Basico',
    precio: 35,
    descripcion: 'Para autonomos y microempresas',
    features: ['2 sesiones', '10 usuarios', '200 facturas/mes']
  },
  {
    slug: 'profesional',
    nombre: 'Profesional',
    precio: 99,
    descripcion: 'Para empresas en crecimiento',
    features: ['15 sesiones', '30 usuarios', 'Todos los modulos'],
    destacado: true
  },
  {
    slug: 'enterprise',
    nombre: 'Enterprise',
    precio: 249,
    descripcion: 'Para grandes organizaciones',
    features: ['Usuarios ilimitados', 'Sin limites', 'API y soporte prioritario']
  }
]

const registerSchema = z.object({
  // Datos de la empresa
  nombreEmpresa: z.string().min(2, 'Nombre fiscal requerido'),
  nombreComercialEmpresa: z.string().optional(),
  nifEmpresa: z.string().min(9, 'NIF invalido'),
  emailEmpresa: z.string().email('Email de empresa invalido'),
  telefonoEmpresa: z.string().min(9, 'Telefono de empresa requerido'),
  direccion: z.string().min(5, 'Direccion requerida'),
  codigoPostal: z.string().min(4, 'Codigo postal requerido'),
  ciudad: z.string().min(2, 'Ciudad requerida'),
  provincia: z.string().min(2, 'Provincia requerida'),
  pais: z.string().min(2, 'Pais requerido'),
  // Datos del administrador
  nombre: z.string().min(2, 'Nombre requerido'),
  apellidos: z.string().min(2, 'Apellidos requeridos'),
  email: z.string().email('Email invalido'),
  telefono: z.string().min(9, 'Telefono requerido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma tu contrasena'),
  planSeleccionado: z.string().min(1, 'Selecciona un plan'),
  aceptaTerminos: z.boolean().refine(val => val === true, 'Debes aceptar los terminos y condiciones'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

// Tipo de validación de NIF
interface NIFValidation {
  valido: boolean;
  tipo?: string;
  mensaje?: string;
  verificado?: boolean;
}

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [planSeleccionado, setPlanSeleccionado] = useState<string>('')
  const [nifValidation, setNifValidation] = useState<NIFValidation | null>(null)
  const [isValidatingNif, setIsValidatingNif] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      planSeleccionado: '',
      aceptaTerminos: false,
      pais: 'España',
    }
  })

  const planActual = watch('planSeleccionado')
  const nifValue = watch('nifEmpresa')
  const planInfo = planesDisponibles.find(p => p.slug === planActual)

  // Validar NIF cuando cambie
  useEffect(() => {
    const validateNIF = async () => {
      if (!nifValue || nifValue.length < 9) {
        setNifValidation(null)
        return
      }

      setIsValidatingNif(true)
      try {
        const response = await authService.verificarNIF(nifValue)
        if (response.success && response.data) {
          setNifValidation({
            valido: response.data.valido,
            tipo: response.data.tipo,
            mensaje: response.data.mensaje,
            verificado: response.data.verificado,
          })
        }
      } catch (error) {
        console.error('Error validando NIF:', error)
      } finally {
        setIsValidatingNif(false)
      }
    }

    const timer = setTimeout(validateNIF, 500) // Debounce 500ms
    return () => clearTimeout(timer)
  }, [nifValue])

  // Obtener plan de query params
  useEffect(() => {
    const planFromUrl = searchParams.get('plan')
    if (planFromUrl) {
      const planValido = planesDisponibles.find(p => p.slug === planFromUrl)
      if (planValido) {
        setPlanSeleccionado(planFromUrl)
        setValue('planSeleccionado', planFromUrl)
      }
    }
  }, [searchParams, setValue])

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      // Eliminar confirmPassword antes de enviar
      const { confirmPassword, planSeleccionado, aceptaTerminos, nombreComercialEmpresa, ...registerData } = data

      const response = await authService.register({
        ...registerData,
        nombreComercialEmpresa: nombreComercialEmpresa || undefined,
        plan: planSeleccionado
      })

      setAuth(response.data!.usuario, response.data!.accessToken, response.data!.refreshToken)
      toast.success('Registro exitoso! Bienvenido a Tralok')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error en el registro')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-lg font-medium">
          <Zap className="h-5 w-5" />
          <span>Empieza a gestionar tu negocio hoy</span>
        </div>
        <p className="text-blue-100 text-sm mt-1">
          <Link href="/sandbox" className="underline hover:text-white">Prueba el sandbox</Link> antes de registrarte
        </p>
      </div>

      <Card className="rounded-t-none border-t-0">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>
            Registra tu empresa y empieza a usar Tralok hoy mismo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Selector de plan */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">1. Elige tu plan</h3>
                <Link href="/planes" className="text-sm text-blue-600 hover:underline">
                  Ver comparativa completa
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {planesDisponibles.map((plan) => (
                  <div
                    key={plan.slug}
                    onClick={() => {
                      setPlanSeleccionado(plan.slug)
                      setValue('planSeleccionado', plan.slug)
                    }}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      planActual === plan.slug
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    } ${plan.destacado ? 'ring-2 ring-blue-200' : ''}`}
                  >
                    {plan.destacado && (
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs">
                        Recomendado
                      </Badge>
                    )}
                    <div className="text-center">
                      <h4 className="font-semibold text-slate-900">{plan.nombre}</h4>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-slate-900">{plan.precio}€</span>
                        <span className="text-slate-500">/mes</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{plan.descripcion}</p>
                      <ul className="mt-3 space-y-1 text-xs text-slate-600">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-1 justify-center">
                            <Check className="h-3 w-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {planActual === plan.slug && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {errors.planSeleccionado && (
                <p className="text-sm text-red-500">{errors.planSeleccionado.message}</p>
              )}
            </div>

            {/* Datos de la empresa */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">2. Datos Fiscales de la Empresa</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nifEmpresa">NIF/CIF *</Label>
                  <div className="relative">
                    <Input
                      id="nifEmpresa"
                      placeholder="B12345678"
                      {...register('nifEmpresa')}
                      disabled={isLoading}
                      className={nifValidation ? (nifValidation.valido ? 'border-green-500 pr-10' : 'border-red-500 pr-10') : ''}
                    />
                    {isValidatingNif && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      </div>
                    )}
                    {!isValidatingNif && nifValidation && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {nifValidation.valido ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {nifValidation && (
                    <p className={`text-sm ${nifValidation.valido ? 'text-green-600' : 'text-red-500'}`}>
                      {nifValidation.valido ? `${nifValidation.tipo} válido` : nifValidation.mensaje}
                    </p>
                  )}
                  {errors.nifEmpresa && !nifValidation && (
                    <p className="text-sm text-red-500">{errors.nifEmpresa.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombreEmpresa">Razon Social (Nombre Fiscal) *</Label>
                  <Input
                    id="nombreEmpresa"
                    placeholder="Mi Empresa SL"
                    {...register('nombreEmpresa')}
                    disabled={isLoading}
                  />
                  {errors.nombreEmpresa && (
                    <p className="text-sm text-red-500">{errors.nombreEmpresa.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreComercialEmpresa">Nombre Comercial (opcional)</Label>
                <Input
                  id="nombreComercialEmpresa"
                  placeholder="Nombre con el que opera la empresa (si es diferente)"
                  {...register('nombreComercialEmpresa')}
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500">
                  El nombre comercial es el nombre con el que la empresa es conocida públicamente, si es diferente a la razón social.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailEmpresa">Email de la Empresa *</Label>
                  <Input
                    id="emailEmpresa"
                    type="email"
                    placeholder="empresa@email.com"
                    {...register('emailEmpresa')}
                    disabled={isLoading}
                  />
                  {errors.emailEmpresa && (
                    <p className="text-sm text-red-500">{errors.emailEmpresa.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefonoEmpresa">Telefono de la Empresa *</Label>
                  <Input
                    id="telefonoEmpresa"
                    type="tel"
                    placeholder="+34 912 345 678"
                    {...register('telefonoEmpresa')}
                    disabled={isLoading}
                  />
                  {errors.telefonoEmpresa && (
                    <p className="text-sm text-red-500">{errors.telefonoEmpresa.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Direccion Fiscal *</Label>
                <Input
                  id="direccion"
                  placeholder="Calle Principal 123, Piso 4"
                  {...register('direccion')}
                  disabled={isLoading}
                />
                {errors.direccion && (
                  <p className="text-sm text-red-500">{errors.direccion.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoPostal">Codigo Postal *</Label>
                  <Input
                    id="codigoPostal"
                    placeholder="28001"
                    {...register('codigoPostal')}
                    disabled={isLoading}
                  />
                  {errors.codigoPostal && (
                    <p className="text-sm text-red-500">{errors.codigoPostal.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad *</Label>
                  <Input
                    id="ciudad"
                    placeholder="Madrid"
                    {...register('ciudad')}
                    disabled={isLoading}
                  />
                  {errors.ciudad && (
                    <p className="text-sm text-red-500">{errors.ciudad.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia *</Label>
                  <Input
                    id="provincia"
                    placeholder="Madrid"
                    {...register('provincia')}
                    disabled={isLoading}
                  />
                  {errors.provincia && (
                    <p className="text-sm text-red-500">{errors.provincia.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais">Pais *</Label>
                  <Input
                    id="pais"
                    placeholder="España"
                    {...register('pais')}
                    disabled={isLoading}
                  />
                  {errors.pais && (
                    <p className="text-sm text-red-500">{errors.pais.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Datos del usuario */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">3. Tus Datos (Administrador)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Juan"
                    {...register('nombre')}
                    disabled={isLoading}
                  />
                  {errors.nombre && (
                    <p className="text-sm text-red-500">{errors.nombre.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    placeholder="Perez Garcia"
                    {...register('apellidos')}
                    disabled={isLoading}
                  />
                  {errors.apellidos && (
                    <p className="text-sm text-red-500">{errors.apellidos.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Tu Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    {...register('email')}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Tu Telefono *</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="+34 666 777 888"
                    {...register('telefono')}
                    disabled={isLoading}
                  />
                  {errors.telefono && (
                    <p className="text-sm text-red-500">{errors.telefono.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contrasena *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contrasena *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repite tu contrasena"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Terminos y condiciones */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="aceptaTerminos"
                  onCheckedChange={(checked) => setValue('aceptaTerminos', checked as boolean)}
                  disabled={isLoading}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="aceptaTerminos"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Acepto los terminos y condiciones
                  </label>
                  <p className="text-xs text-slate-500">
                    Al registrarte, aceptas nuestros{' '}
                    <Link href="/terminos" className="text-blue-600 hover:underline">
                      Terminos de Servicio
                    </Link>{' '}
                    y{' '}
                    <Link href="/privacidad" className="text-blue-600 hover:underline">
                      Politica de Privacidad
                    </Link>
                    .
                  </p>
                </div>
              </div>
              {errors.aceptaTerminos && (
                <p className="text-sm text-red-500">{errors.aceptaTerminos.message}</p>
              )}
            </div>

            {/* Resumen del plan */}
            {planInfo && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="font-medium text-slate-900 mb-2">Resumen</h4>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-700">Plan {planInfo.nombre}</p>
                    <p className="text-sm text-slate-500">
                      Facturacion mensual (puedes cancelar en cualquier momento)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{planInfo.precio}€</p>
                    <p className="text-xs text-slate-500">/mes</p>
                  </div>
                </div>
              </div>
            )}

            {/* Beneficios */}
            <div className="grid grid-cols-3 gap-4 text-center text-sm text-slate-600">
              <div className="flex flex-col items-center gap-1">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Datos seguros</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Zap className="h-5 w-5 text-amber-500" />
                <span>Activacion inmediata</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Sin compromiso</span>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Inicia sesion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
