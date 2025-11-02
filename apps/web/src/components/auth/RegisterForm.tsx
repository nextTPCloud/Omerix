"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const registerSchema = z.object({
  nombreEmpresa: z.string().min(2, 'Nombre de empresa requerido'),
  nifEmpresa: z.string().min(9, 'NIF inválido'),
  emailEmpresa: z.string().email('Email de empresa inválido'),
  nombre: z.string().min(2, 'Nombre requerido'),
  apellidos: z.string().min(2, 'Apellidos requeridos'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  telefono: z.string().optional(),
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.register(data)
      
      setAuth(response.data!.usuario, response.data!.accessToken, response.data!.refreshToken)
      toast.success('¡Registro exitoso! Bienvenido a Omerix')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error en el registro')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Crear Cuenta</CardTitle>
        <CardDescription>
          Registra tu empresa y crea tu cuenta de administrador
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Datos de la empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos de la Empresa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreEmpresa">Nombre de la Empresa</Label>
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

              <div className="space-y-2">
                <Label htmlFor="nifEmpresa">NIF/CIF</Label>
                <Input
                  id="nifEmpresa"
                  placeholder="B12345678"
                  {...register('nifEmpresa')}
                  disabled={isLoading}
                />
                {errors.nifEmpresa && (
                  <p className="text-sm text-red-500">{errors.nifEmpresa.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailEmpresa">Email de la Empresa</Label>
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
          </div>

          {/* Datos del usuario */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tus Datos (Administrador)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
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
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  placeholder="Pérez García"
                  {...register('apellidos')}
                  disabled={isLoading}
                />
                {errors.apellidos && (
                  <p className="text-sm text-red-500">{errors.apellidos.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Tu Email</Label>
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
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono (opcional)</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="+34666777888"
                {...register('telefono')}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-primary hover:underline">
            Inicia sesión
          </a>
        </div>
      </CardContent>
    </Card>
  )
}