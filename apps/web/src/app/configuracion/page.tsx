'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { empresaService, EmpresaInfo, EmailConfig } from '@/services/empresa.service'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import {
  Building2,
  Mail,
  Server,
  Save,
  Loader2,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react'

// Roles permitidos para acceder a esta página
const ROLES_PERMITIDOS = ['superadmin', 'admin', 'gerente']

export default function ConfiguracionEmpresaPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('empresa')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  // Estado de la empresa
  const [empresa, setEmpresa] = useState<Partial<EmpresaInfo>>({
    nombre: '',
    nombreComercial: '',
    nif: '',
    email: '',
    telefono: '',
    web: '',
    logo: '',
    direccion: {
      calle: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
      pais: 'España',
    },
  })

  // Estado de la configuración de email
  const [emailConfig, setEmailConfig] = useState<Partial<EmailConfig>>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
  })
  const [emailConfigExists, setEmailConfigExists] = useState(false)

  // Verificar permisos al cargar
  useEffect(() => {
    // Si no hay usuario, esperar (aún se está hidratando)
    if (!user) return

    // Verificar rol
    if (!ROLES_PERMITIDOS.includes(user.rol)) {
      toast.error('No tienes permisos para acceder a esta página')
      router.push('/dashboard')
      return
    }

    // Setear email para pruebas
    setTestEmail(user.email || '')

    loadData()
  }, [user, router])

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Cargar información de empresa
      const empresaRes = await empresaService.getMiEmpresa()
      if (empresaRes.success && empresaRes.data) {
        setEmpresa(empresaRes.data)
      }

      // Cargar configuración de email
      try {
        const emailRes = await empresaService.getEmailConfig()
        if (emailRes.success && emailRes.data) {
          setEmailConfig(emailRes.data)
          setEmailConfigExists(!!emailRes.data.host)
        }
      } catch (error) {
        // Si falla, es que no hay configuración o no tiene permisos
        console.log('No hay configuración de email o sin permisos')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveEmpresa = async () => {
    try {
      setIsSaving(true)
      const response = await empresaService.updateInfo(empresa)
      if (response.success) {
        toast.success('Información de empresa guardada')
        if (response.data) {
          setEmpresa(response.data)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEmailConfig = async () => {
    if (!emailConfig.host || !emailConfig.user) {
      toast.error('El host y usuario son obligatorios')
      return
    }

    // Si no hay password y no existe configuración previa, es obligatorio
    if (!emailConfig.password && !emailConfigExists) {
      toast.error('La contraseña es obligatoria para nueva configuración')
      return
    }

    try {
      setIsSaving(true)

      const dataToSend: Partial<EmailConfig> = {
        host: emailConfig.host,
        port: emailConfig.port || 587,
        secure: emailConfig.secure || false,
        user: emailConfig.user,
        fromName: emailConfig.fromName || undefined,
        fromEmail: emailConfig.fromEmail || undefined,
        replyTo: emailConfig.replyTo || undefined,
      }

      // Solo enviar password si se ha introducido uno nuevo
      if (emailConfig.password && emailConfig.password !== '••••••••') {
        dataToSend.password = emailConfig.password
      }

      const response = await empresaService.updateEmailConfig(dataToSend)
      if (response.success) {
        toast.success('Configuración de email guardada')
        setEmailConfigExists(true)
        // Limpiar password del estado para mostrar placeholder
        setEmailConfig(prev => ({ ...prev, password: '••••••••' }))
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar configuración de email')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Introduce un email para la prueba')
      return
    }

    try {
      setIsTesting(true)
      const response = await empresaService.testEmailConfig(testEmail)
      if (response.success) {
        toast.success('Email de prueba enviado correctamente')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar email de prueba')
    } finally {
      setIsTesting(false)
    }
  }

  // Mostrar loading mientras carga datos
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando configuración...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
            <p className="text-muted-foreground">
              Gestiona la configuración de tu empresa
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
            <Shield className="h-4 w-4" />
            Acceso restringido: {ROLES_PERMITIDOS.join(', ')}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="empresa" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email SMTP
            </TabsTrigger>
          </TabsList>

          {/* ============================================ */}
          {/* TAB: INFORMACIÓN DE EMPRESA */}
          {/* ============================================ */}
          <TabsContent value="empresa" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Empresa</CardTitle>
                <CardDescription>
                  Datos básicos de tu empresa que aparecerán en documentos y comunicaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Datos básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Legal *</Label>
                    <Input
                      id="nombre"
                      value={empresa.nombre || ''}
                      onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })}
                      placeholder="Nombre legal de la empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombreComercial">Nombre Comercial</Label>
                    <Input
                      id="nombreComercial"
                      value={empresa.nombreComercial || ''}
                      onChange={(e) => setEmpresa({ ...empresa, nombreComercial: e.target.value })}
                      placeholder="Nombre comercial (si es diferente)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nif">NIF/CIF</Label>
                    <Input
                      id="nif"
                      value={empresa.nif || ''}
                      onChange={(e) => setEmpresa({ ...empresa, nif: e.target.value })}
                      placeholder="B12345678"
                      disabled // El NIF no se puede cambiar
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={empresa.email || ''}
                      onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={empresa.telefono || ''}
                      onChange={(e) => setEmpresa({ ...empresa, telefono: e.target.value })}
                      placeholder="912345678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="web">Página Web</Label>
                    <Input
                      id="web"
                      value={empresa.web || ''}
                      onChange={(e) => setEmpresa({ ...empresa, web: e.target.value })}
                      placeholder="https://www.miempresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo">URL del Logo</Label>
                    <Input
                      id="logo"
                      value={empresa.logo || ''}
                      onChange={(e) => setEmpresa({ ...empresa, logo: e.target.value })}
                      placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Próximamente: subida de archivos
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Dirección */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Dirección</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="calle">Calle y número</Label>
                      <Input
                        id="calle"
                        value={empresa.direccion?.calle || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          direccion: { ...empresa.direccion!, calle: e.target.value }
                        })}
                        placeholder="Calle Principal, 123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigoPostal">Código Postal</Label>
                      <Input
                        id="codigoPostal"
                        value={empresa.direccion?.codigoPostal || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          direccion: { ...empresa.direccion!, codigoPostal: e.target.value }
                        })}
                        placeholder="28001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <Input
                        id="ciudad"
                        value={empresa.direccion?.ciudad || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          direccion: { ...empresa.direccion!, ciudad: e.target.value }
                        })}
                        placeholder="Madrid"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provincia">Provincia</Label>
                      <Input
                        id="provincia"
                        value={empresa.direccion?.provincia || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          direccion: { ...empresa.direccion!, provincia: e.target.value }
                        })}
                        placeholder="Madrid"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pais">País</Label>
                      <Input
                        id="pais"
                        value={empresa.direccion?.pais || 'España'}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          direccion: { ...empresa.direccion!, pais: e.target.value }
                        })}
                        placeholder="España"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveEmpresa} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================ */}
          {/* TAB: CONFIGURACIÓN DE EMAIL SMTP */}
          {/* ============================================ */}
          <TabsContent value="email" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Configuración del Servidor de Email (SMTP)
                </CardTitle>
                <CardDescription>
                  Configura el servidor de correo para enviar emails desde Omerix (presupuestos, facturas, notificaciones...)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Estado de la configuración */}
                <div className={`flex items-center gap-2 p-3 rounded-lg ${emailConfigExists ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  {emailConfigExists ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Configuración de email activa</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      <span>No hay configuración de email. Configura tu servidor SMTP para enviar emails.</span>
                    </>
                  )}
                </div>

                {/* Servidor SMTP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="smtpHost">Servidor SMTP *</Label>
                    <Input
                      id="smtpHost"
                      value={emailConfig.host || ''}
                      onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                      placeholder="smtp.gmail.com, smtp.office365.com, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Puerto *</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={emailConfig.port || 587}
                      onChange={(e) => setEmailConfig({ ...emailConfig, port: parseInt(e.target.value) || 587 })}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="smtpSecure"
                      checked={emailConfig.secure || false}
                      onCheckedChange={(checked) => setEmailConfig({ ...emailConfig, secure: checked })}
                    />
                    <Label htmlFor="smtpSecure">Conexión segura (SSL/TLS)</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Activa para puerto 465, desactiva para 587 con STARTTLS
                  </p>
                </div>

                <Separator />

                {/* Credenciales */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Credenciales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">Usuario / Email *</Label>
                      <Input
                        id="smtpUser"
                        value={emailConfig.user || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, user: e.target.value })}
                        placeholder="usuario@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">Contraseña {emailConfigExists ? '' : '*'}</Label>
                      <div className="relative">
                        <Input
                          id="smtpPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={emailConfig.password || ''}
                          onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                          placeholder={emailConfigExists ? 'Dejar vacío para mantener la actual' : 'Contraseña del email'}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Para Gmail/Google Workspace: usa una "Contraseña de aplicación"
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuración del remitente */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Configuración del Remitente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromName">Nombre del Remitente</Label>
                      <Input
                        id="fromName"
                        value={emailConfig.fromName || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                        placeholder={empresa.nombre || 'Mi Empresa'}
                      />
                      <p className="text-xs text-muted-foreground">
                        Si está vacío, se usará el nombre de la empresa
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">Email del Remitente</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={emailConfig.fromEmail || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                        placeholder={emailConfig.user || 'noreply@empresa.com'}
                      />
                      <p className="text-xs text-muted-foreground">
                        Si está vacío, se usará el usuario SMTP
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replyTo">Responder a</Label>
                      <Input
                        id="replyTo"
                        type="email"
                        value={emailConfig.replyTo || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, replyTo: e.target.value })}
                        placeholder="contacto@empresa.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email donde recibirás las respuestas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  {/* Probar configuración */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Email para prueba"
                      className="w-64"
                    />
                    <Button
                      variant="outline"
                      onClick={handleTestEmail}
                      disabled={isTesting || !emailConfigExists}
                    >
                      {isTesting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Enviar Prueba
                    </Button>
                  </div>

                  <Button onClick={handleSaveEmailConfig} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Configuración
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ayuda */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuraciones comunes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Gmail / Google Workspace</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>Host: smtp.gmail.com</li>
                      <li>Puerto: 587</li>
                      <li>Seguro: No (usa STARTTLS)</li>
                      <li>Requiere: Contraseña de aplicación</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Microsoft 365 / Outlook</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>Host: smtp.office365.com</li>
                      <li>Puerto: 587</li>
                      <li>Seguro: No (usa STARTTLS)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Servidor propio / OVH</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>Host: ssl0.ovh.net (o tu servidor)</li>
                      <li>Puerto: 465 o 587</li>
                      <li>Seguro: Sí para 465</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
