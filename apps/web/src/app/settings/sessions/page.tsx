"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Monitor, Smartphone, Tablet, LogOut, Trash2 } from 'lucide-react'

interface Session {
  id: string
  deviceInfo: string
  ipAddress: string
  createdAt: string
  expiresAt: string
}

export default function SessionsPage() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLogoutAllLoading, setIsLogoutAllLoading] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const response = await authService.getActiveSessions()
      setSessions(response.data)
    } catch (error: any) {
      toast.error('Error al cargar sesiones')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoutAll = async () => {
    setIsLogoutAllLoading(true)
    try {
      const response = await authService.logoutAllSessions()
      toast.success(response.message)
      // Redirigir al login
      router.push('/login')
    } catch (error: any) {
      toast.error('Error al cerrar todas las sesiones')
      console.error(error)
    } finally {
      setIsLogoutAllLoading(false)
    }
  }

  const getDeviceIcon = (deviceInfo: string) => {
    const lower = deviceInfo.toLowerCase()
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />
    }
    if (lower.includes('tablet') || lower.includes('ipad')) {
      return <Tablet className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Sesiones activas</h1>
          <p className="text-muted-foreground">Cargando sesiones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sesiones activas</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona los dispositivos que tienen acceso a tu cuenta
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isLogoutAllLoading || sessions.length === 0}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar todas las sesiones
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cerrar todas las sesiones?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esto cerrará la sesión en todos los dispositivos, incluyendo este.
                  Tendrás que volver a iniciar sesión.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogoutAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Cerrar todas
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No hay sesiones activas
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.deviceInfo)}
                      <div>
                        <CardTitle className="text-lg">
                          {session.deviceInfo}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          IP: {session.ipAddress}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Iniciada el</p>
                      <p className="font-medium">{formatDate(session.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expira el</p>
                      <p className="font-medium">{formatDate(session.expiresAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base">Consejo de seguridad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Si ves alguna sesión que no reconoces, cierra todas las sesiones inmediatamente
              y cambia tu contraseña. Esto revocará el acceso de todos los dispositivos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}