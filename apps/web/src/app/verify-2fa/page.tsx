"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { PublicHeader } from '@/components/layout/PublicHeader'
import { Shield, Smartphone, Key } from 'lucide-react'

const verify2FASchema = z.object({
  code: z.string().length(6, 'El código debe tener 6 dígitos').regex(/^\d+$/, 'Solo números'),
})

type Verify2FAFormData = z.infer<typeof verify2FASchema>

export default function Verify2FAPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [twoFactorMethod, setTwoFactorMethod] = useState<'app' | 'sms' | null>(null)
  const [resendingCode, setResendingCode] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Verify2FAFormData>({
    resolver: zodResolver(verify2FASchema),
  })

  useEffect(() => {
    // Obtener userId y método 2FA de la URL
    const userIdParam = searchParams.get('userId')
    const methodParam = searchParams.get('method') as 'app' | 'sms' | null

    if (!userIdParam) {
      toast.error('Sesión inválida')
      router.push('/')
      return
    }

    setUserId(userIdParam)
    setTwoFactorMethod(methodParam || 'app')
  }, [searchParams, router])

  const onSubmit = async (data: Verify2FAFormData) => {
    if (!userId) {
      toast.error('Sesión inválida')
      return
    }

    setIsLoading(true)
    try {
      // Capturar información del dispositivo
      const deviceInfo = navigator.userAgent

      const response = await authService.verify2FA({
        userId,
        code: data.code,
        deviceInfo,
      })

      setAuth(response.data!.usuario, response.data!.accessToken, response.data!.refreshToken)
      toast.success('Verificación exitosa')

      // Redirigir según el rol del usuario
      if (response.data!.usuario.rol === 'superadmin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Código inválido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendSMS = async () => {
    if (!userId || twoFactorMethod !== 'sms') return

    setResendingCode(true)
    try {
      await authService.resendSMS(userId)
      toast.success('Código reenviado correctamente')
    } catch (error: any) {
      toast.error('Error al reenviar código')
    } finally {
      setResendingCode(false)
    }
  }

  const handleCancel = () => {
    router.push('/')
  }

  return (
    <div className="public-light-theme">
      <PublicHeader />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Verificación en dos pasos</CardTitle>
            <CardDescription className="text-center">
              {twoFactorMethod === 'app' ? (
                <span className="flex items-center justify-center gap-2">
                  <Key className="h-4 w-4" />
                  Introduce el código de tu aplicación de autenticación
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Introduce el código enviado por SMS
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de verificación</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  {...register('code')}
                  disabled={isLoading}
                  className="text-center text-2xl tracking-widest font-mono"
                  autoComplete="off"
                  autoFocus
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code.message}</p>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Introduce el código de 6 dígitos
                </p>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Verificando...' : 'Verificar'}
              </Button>

              {twoFactorMethod === 'sms' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendSMS}
                  disabled={resendingCode || isLoading}
                  className="w-full"
                >
                  {resendingCode ? 'Reenviando...' : 'Reenviar código por SMS'}
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full"
              >
                Volver al inicio de sesión
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Consejo de seguridad:</strong> No compartas este código con nadie.
                Tralok nunca te pedirá este código por teléfono, email o mensaje.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}