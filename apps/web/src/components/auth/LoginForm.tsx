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
import { EmpresaSelector } from './EmpresaSelector'
import { EmpresaResumen } from '@/types/auth.types'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [requiresEmpresaSelection, setRequiresEmpresaSelection] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [empresas, setEmpresas] = useState<EmpresaResumen[]>([])
  const [twoFactorMethod, setTwoFactorMethod] = useState<'app' | 'sms' | null>(null)
  const [code2FA, setCode2FA] = useState('')

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(loginSchema),
})

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Capturar información del dispositivo
      const deviceInfo = navigator.userAgent

      const response = await authService.login({
        ...data,
        deviceInfo,
      })

      if (response.requiresCompanyCreation) {
        // Superadmin sin empresa de negocio - redirigir a crear empresa
        setAuth(response.usuario!, response.accessToken!, response.refreshToken!)
        toast.info('Debes crear una empresa para continuar')
        router.push('/admin/crear-empresa')
      } else if (response.requiresEmpresaSelection) {
        // Usuario tiene acceso a múltiples empresas
        setUserId(response.userId!)
        setEmpresas(response.empresas || [])
        setRequiresEmpresaSelection(true)
        toast.info('Selecciona la empresa a la que deseas acceder')
      } else if (response.requires2FA) {
        // Redirigir a la página de verificación 2FA
        toast.info('Introduce el código de verificación')
        router.push(`/verify-2fa?userId=${response.userId}&method=${response.twoFactorMethod}`)
      } else {
        // Login exitoso sin 2FA
        setAuth(response.data!.usuario, response.data!.accessToken, response.data!.refreshToken)
        toast.success('¡Bienvenido!')

        // Redirigir según el rol del usuario
        if (response.data!.usuario.rol === 'superadmin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!code2FA || code2FA.length !== 6) {
      toast.error('Introduce un código válido de 6 dígitos')
      return
    }

    setIsLoading(true)
    try {
      const response = await authService.verify2FA({
        userId,
        code: code2FA,
      })

      setAuth(response.data!.usuario, response.data!.accessToken, response.data!.refreshToken)
      toast.success('¡Verificación exitosa!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Código inválido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendSMS = async () => {
    try {
      await authService.resendSMS(userId)
      toast.success('Código reenviado')
    } catch (error: any) {
      toast.error('Error al reenviar código')
    }
  }

  const handleSelectEmpresa = async (empresaId: string) => {
    setIsLoading(true)
    try {
      const deviceInfo = navigator.userAgent
      const response = await authService.selectEmpresa({
        userId,
        empresaId,
        deviceInfo,
      })

      if (response.requires2FA) {
        // Después de seleccionar empresa, puede requerir 2FA
        toast.info('Introduce el código de verificación')
        router.push(`/verify-2fa?userId=${response.userId}&method=${response.twoFactorMethod}`)
      } else if (response.data) {
        // Login exitoso
        setAuth(response.data.usuario, response.data.accessToken, response.data.refreshToken)
        toast.success('¡Bienvenido!')
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al seleccionar empresa')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEmpresaSelection = () => {
    setRequiresEmpresaSelection(false)
    setEmpresas([])
    setUserId('')
  }

  // Vista de selección de empresa
  if (requiresEmpresaSelection) {
    return (
      <EmpresaSelector
        empresas={empresas}
        isLoading={isLoading}
        onSelect={handleSelectEmpresa}
        onCancel={handleCancelEmpresaSelection}
      />
    )
  }

  if (requires2FA) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verificación en dos pasos</CardTitle>
          <CardDescription>
            {twoFactorMethod === 'app'
              ? 'Introduce el código de Google Authenticator'
              : 'Introduce el código enviado por SMS'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código de verificación</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={code2FA}
              onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, ''))}
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleVerify2FA}
            disabled={isLoading || code2FA.length !== 6}
            className="w-full"
          >
            {isLoading ? 'Verificando...' : 'Verificar'}
          </Button>

          {twoFactorMethod === 'sms' && (
            <Button
              variant="outline"
              onClick={handleResendSMS}
              disabled={isLoading}
              className="w-full"
            >
              Reenviar código
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => {
              setRequires2FA(false)
              setCode2FA('')
            }}
            className="w-full"
          >
            Volver
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>Accede a tu cuenta de Tralok ERP</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        {/* AÑADIR ESTO */}
        <div className="text-center">
          <a 
            href="/forgot-password" 
            className="text-sm text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <div className="mt-4 text-center text-sm">
          ¿No tienes cuenta?{' '}
          <a href="/register" className="text-primary hover:underline">
            Regístrate
          </a>
        </div>

      </CardContent>
    </Card>
  )
}