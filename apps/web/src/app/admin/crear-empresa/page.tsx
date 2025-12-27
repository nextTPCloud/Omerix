"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, MapPin, Phone, Mail, FileText, Loader2 } from 'lucide-react'

const crearEmpresaSchema = z.object({
  nombre: z.string().min(2, 'Nombre de empresa requerido'),
  nif: z.string().min(9, 'NIF invalido'),
  email: z.string().email('Email invalido'),
  telefono: z.string().min(9, 'Telefono requerido'),
  tipoNegocio: z.string().min(1, 'Selecciona un tipo de negocio'),
  calle: z.string().min(5, 'Direccion requerida'),
  codigoPostal: z.string().min(4, 'Codigo postal requerido'),
  ciudad: z.string().min(2, 'Ciudad requerida'),
  provincia: z.string().min(2, 'Provincia requerida'),
  pais: z.string().min(2, 'Pais requerido'),
})

type CrearEmpresaFormData = z.infer<typeof crearEmpresaSchema>

const tiposNegocio = [
  { value: 'retail', label: 'Comercio / Retail' },
  { value: 'restauracion', label: 'Restauracion / Hosteleria' },
  { value: 'taller', label: 'Taller / Reparaciones' },
  { value: 'informatica', label: 'Informatica / Tecnologia' },
  { value: 'servicios', label: 'Servicios Profesionales' },
  { value: 'otro', label: 'Otro' },
]

// Logo SVG de Tralok
function TralokLogo({ className }: { className?: string }) {
  return (
    <svg
      width="200"
      height="48"
      viewBox="0 0 200 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <style>{`
        @font-face {
          font-family: 'GameOfSquids';
          src: url('/fonts/GameOfSquids.woff2') format('woff2'),
              url('/fonts/GameOfSquids.woff') format('woff');
          font-weight: 700;
          font-style: bold;
        }
      `}</style>
      {/* Anillo exterior - O estilizada */}
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.15"/>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>

      {/* Barras de datos ascendentes */}
      <rect x="14" y="28" width="4" height="10" rx="1.5" fill="currentColor"/>
      <rect x="20" y="23" width="4" height="15" rx="1.5" fill="currentColor"/>
      <rect x="26" y="18" width="4" height="20" rx="1.5" fill="currentColor"/>

      {/* Punto destacado (metrica/KPI) */}
      <circle cx="34" cy="15" r="3" fill="currentColor"/>

      {/* Texto Tralok */}
      <text x="54" y="38" fontFamily="GameOfSquids, sans-serif" fontSize="36" fontWeight="700" fill="currentColor" letterSpacing="1">Tralok</text>
    </svg>
  )
}

export default function CrearEmpresaPage() {
  const router = useRouter()
  const { user, setUser, setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCP, setIsLoadingCP] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CrearEmpresaFormData>({
    resolver: zodResolver(crearEmpresaSchema),
    defaultValues: {
      pais: 'Espana',
      tipoNegocio: 'servicios',
    }
  })

  const codigoPostal = watch('codigoPostal')

  // Auto-rellenar ciudad y provincia basado en codigo postal
  useEffect(() => {
    const buscarDireccion = async () => {
      if (!codigoPostal || codigoPostal.length < 5) return

      // Solo buscar si tiene 5 digitos (codigo postal espanol)
      if (codigoPostal.length !== 5 || !/^\d{5}$/.test(codigoPostal)) return

      setIsLoadingCP(true)
      try {
        // Usar API de GeoNames o similar para obtener datos del CP
        const response = await fetch(
          `https://api.zippopotam.us/es/${codigoPostal}`
        )

        if (response.ok) {
          const data = await response.json()
          if (data.places && data.places.length > 0) {
            const place = data.places[0]
            setValue('ciudad', place['place name'] || '')
            setValue('provincia', place['state'] || '')
            toast.success('Direccion autocompletada')
          }
        }
      } catch (error) {
        // Silenciar error - el usuario puede rellenar manualmente
        console.log('No se pudo autocompletar la direccion')
      } finally {
        setIsLoadingCP(false)
      }
    }

    const timeoutId = setTimeout(buscarDireccion, 500)
    return () => clearTimeout(timeoutId)
  }, [codigoPostal, setValue])

  const onSubmit = async (data: CrearEmpresaFormData) => {
    setIsLoading(true)
    try {
      const payload = {
        nombre: data.nombre,
        nif: data.nif,
        email: data.email,
        telefono: data.telefono,
        tipoNegocio: data.tipoNegocio,
        direccion: {
          calle: data.calle,
          codigoPostal: data.codigoPostal,
          ciudad: data.ciudad,
          provincia: data.provincia,
          pais: data.pais,
        },
      }

      const response = await api.post('/admin/empresas', payload)

      if (response.data.success) {
        toast.success('Empresa creada exitosamente')

        const data = response.data.data

        // Actualizar tokens y usuario con la nueva empresaId
        try {
          if (user && data?.accessToken && data?.refreshToken) {
            // Usar setAuth para actualizar tokens completos
            setAuth(
              { ...user, empresaId: data.empresa?.id },
              data.accessToken,
              data.refreshToken
            )
            console.log('Tokens actualizados con nueva empresaId:', data.empresa?.id)
          } else if (user && data?.empresa?.id) {
            // Fallback: solo actualizar usuario
            setUser({
              ...user,
              empresaId: data.empresa.id,
            })
          }
        } catch (e) {
          console.error('Error actualizando sesion:', e)
        }

        // Redirigir al panel de administracion si es superadmin, sino al dashboard
        setTimeout(() => {
          if (user?.rol === 'superadmin') {
            router.push('/admin')
          } else {
            router.push('/dashboard')
          }
        }, 500)
      } else {
        toast.error(response.data.message || 'Error al crear la empresa')
      }
    } catch (error: any) {
      console.error('Error completo:', error)
      toast.error(error.response?.data?.message || 'Error al crear la empresa')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header con logo */}
      <header className="w-full py-6 px-4 flex justify-center border-b bg-white shadow-sm">
        <TralokLogo className="h-12 w-auto text-slate-800" />
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-2xl shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-7 w-7 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-slate-800">Crear Empresa de Negocio</CardTitle>
            <CardDescription className="text-base">
              Para continuar usando Tralok, necesitas crear una empresa de negocio
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Datos basicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Datos Fiscales
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Razon Social / Nombre *</Label>
                    <Input
                      id="nombre"
                      placeholder="Mi Empresa SL"
                      {...register('nombre')}
                      disabled={isLoading}
                      className="h-11"
                    />
                    {errors.nombre && (
                      <p className="text-sm text-red-500">{errors.nombre.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nif">NIF/CIF *</Label>
                    <Input
                      id="nif"
                      placeholder="B12345678"
                      {...register('nif')}
                      disabled={isLoading}
                      className="h-11"
                    />
                    {errors.nif && (
                      <p className="text-sm text-red-500">{errors.nif.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de la Empresa *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10 h-11"
                        placeholder="empresa@email.com"
                        {...register('email')}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Telefono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="telefono"
                        type="tel"
                        className="pl-10 h-11"
                        placeholder="+34 912 345 678"
                        {...register('telefono')}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.telefono && (
                      <p className="text-sm text-red-500">{errors.telefono.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoNegocio">Tipo de Negocio *</Label>
                  <Select
                    defaultValue="servicios"
                    onValueChange={(value) => setValue('tipoNegocio', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecciona el tipo de negocio" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposNegocio.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tipoNegocio && (
                    <p className="text-sm text-red-500">{errors.tipoNegocio.message}</p>
                  )}
                </div>
              </div>

              {/* Direccion */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  Direccion Fiscal
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="calle">Direccion *</Label>
                  <Input
                    id="calle"
                    placeholder="Calle Principal 123, Piso 4"
                    {...register('calle')}
                    disabled={isLoading}
                    className="h-11"
                  />
                  {errors.calle && (
                    <p className="text-sm text-red-500">{errors.calle.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigoPostal">Codigo Postal *</Label>
                    <div className="relative">
                      <Input
                        id="codigoPostal"
                        placeholder="28001"
                        {...register('codigoPostal')}
                        disabled={isLoading}
                        className="h-11"
                      />
                      {isLoadingCP && (
                        <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-blue-500" />
                      )}
                    </div>
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
                      disabled={isLoading || isLoadingCP}
                      className="h-11"
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
                      disabled={isLoading || isLoadingCP}
                      className="h-11"
                    />
                    {errors.provincia && (
                      <p className="text-sm text-red-500">{errors.provincia.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pais">Pais *</Label>
                    <Input
                      id="pais"
                      placeholder="Espana"
                      {...register('pais')}
                      disabled={isLoading}
                      className="h-11"
                    />
                    {errors.pais && (
                      <p className="text-sm text-red-500">{errors.pais.message}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Introduce el codigo postal y autocompletaremos la ciudad y provincia
                </p>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> Se creara una licencia de prueba de 30 dias
                  con acceso completo a todos los modulos. Podras cambiar de plan en cualquier momento.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creando empresa...
                  </>
                ) : (
                  'Crear Empresa y Continuar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-slate-500 border-t bg-white">
        <p>&copy; {new Date().getFullYear()} Tralok Software SL. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
