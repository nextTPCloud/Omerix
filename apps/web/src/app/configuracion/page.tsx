'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { empresaService, EmpresaInfo, EmailConfig, CuentaBancariaEmpresa, TextosLegales, DatosRegistro, OAuth2ProvidersStatus } from '@/services/empresa.service'
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
  CreditCard,
  FileText,
  Plus,
  Trash2,
  Edit,
  Upload,
  Image as ImageIcon,
  Landmark,
  ScrollText,
  Settings,
  Hash,
  Link2,
  Unlink,
  ExternalLink,
  FileKey,
  FileCheck,
} from 'lucide-react'
import { CertificadoConfig } from '@/components/configuracion/CertificadoConfig'
import { VerifactuConfig } from '@/components/configuracion/VerifactuConfig'

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
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // Estado de la empresa
  const [empresa, setEmpresa] = useState<Partial<EmpresaInfo>>({
    nombre: '',
    nombreComercial: '',
    nif: '',
    email: '',
    telefono: '',
    movil: '',
    fax: '',
    web: '',
    logo: '',
    direccion: {
      calle: '',
      numero: '',
      piso: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
      pais: 'España',
    },
    datosRegistro: {},
    cuentasBancarias: [],
    textosLegales: {},
    seriesDocumentos: {
      presupuestos: 'P',
      pedidos: 'PED',
      albaranes: 'ALB',
      facturas: 'F',
      facturasRectificativas: 'FR',
    },
  })

  // Estado de la configuración de email
  const [emailConfig, setEmailConfig] = useState<Partial<EmailConfig>>({
    authType: 'smtp',
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
  const [emailAuthMethod, setEmailAuthMethod] = useState<'oauth2' | 'smtp'>('oauth2')
  const [oauth2Providers, setOauth2Providers] = useState<OAuth2ProvidersStatus | null>(null)
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false)

  // Estado para diálogos
  const [showCuentaDialog, setShowCuentaDialog] = useState(false)
  const [editingCuenta, setEditingCuenta] = useState<CuentaBancariaEmpresa | null>(null)
  const [cuentaForm, setCuentaForm] = useState<Partial<CuentaBancariaEmpresa>>({
    titular: '',
    iban: '',
    swift: '',
    banco: '',
    alias: '',
    predeterminada: false,
    activa: true,
  })

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

      // Cargar estado de proveedores OAuth2
      try {
        const providersRes = await empresaService.getOAuth2Providers()
        if (providersRes.success && providersRes.data) {
          setOauth2Providers(providersRes.data)
        }
      } catch (error) {
        console.log('No se pudieron cargar los proveedores OAuth2')
      }

      // Cargar configuración de email
      try {
        const emailRes = await empresaService.getEmailConfig()
        if (emailRes.success && emailRes.data) {
          setEmailConfig(emailRes.data)
          setEmailConfigExists(!!(emailRes.data.authType === 'oauth2' ? emailRes.data.isConnected : emailRes.data.hasPassword))
          setEmailAuthMethod(emailRes.data.authType || 'smtp')
        }
      } catch (error) {
        // Si falla, es que no hay configuración o no tiene permisos
        console.log('No hay configuración de email o sin permisos')
      }

      // Verificar parámetros de la URL para OAuth callbacks
      const urlParams = new URLSearchParams(window.location.search)
      const oauthSuccess = urlParams.get('oauth_success')
      const oauthError = urlParams.get('oauth_error')

      if (oauthSuccess) {
        toast.success(`Cuenta de ${oauthSuccess === 'google' ? 'Google' : 'Microsoft'} conectada correctamente`)
        // Limpiar parámetros de la URL
        window.history.replaceState({}, '', '/configuracion?tab=email')
        // Recargar configuración de email
        const emailRes = await empresaService.getEmailConfig()
        if (emailRes.success && emailRes.data) {
          setEmailConfig(emailRes.data)
          setEmailConfigExists(true)
          setEmailAuthMethod('oauth2')
        }
      }

      if (oauthError) {
        toast.error(`Error al conectar: ${decodeURIComponent(oauthError)}`)
        window.history.replaceState({}, '', '/configuracion?tab=email')
      }

      // Verificar si hay tab en la URL
      const tab = urlParams.get('tab')
      if (tab) {
        setActiveTab(tab)
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

  // Conectar con Google OAuth2
  const handleConnectGoogle = async () => {
    try {
      setIsConnectingOAuth(true)
      const response = await empresaService.getGoogleAuthUrl()
      if (response.success && response.data?.authUrl) {
        // Abrir ventana de autorización
        window.location.href = response.data.authUrl
      } else {
        toast.error('No se pudo obtener la URL de autorización')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al conectar con Google')
    } finally {
      setIsConnectingOAuth(false)
    }
  }

  // Conectar con Microsoft OAuth2
  const handleConnectMicrosoft = async () => {
    try {
      setIsConnectingOAuth(true)
      const response = await empresaService.getMicrosoftAuthUrl()
      if (response.success && response.data?.authUrl) {
        window.location.href = response.data.authUrl
      } else {
        toast.error('No se pudo obtener la URL de autorización')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al conectar con Microsoft')
    } finally {
      setIsConnectingOAuth(false)
    }
  }

  // Desconectar cuenta de email
  const handleDisconnectEmail = async () => {
    try {
      setIsSaving(true)
      const response = await empresaService.disconnectEmail()
      if (response.success) {
        toast.success('Cuenta desconectada correctamente')
        setEmailConfig({
          authType: 'smtp',
          host: '',
          port: 587,
          secure: false,
          user: '',
          password: '',
          fromName: '',
          fromEmail: '',
          replyTo: '',
        })
        setEmailConfigExists(false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al desconectar')
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

  // ============================================
  // CUENTAS BANCARIAS
  // ============================================

  const handleAddCuenta = () => {
    setCuentaForm({
      titular: empresa.nombre || '',
      iban: '',
      swift: '',
      banco: '',
      alias: '',
      predeterminada: (empresa.cuentasBancarias?.length || 0) === 0,
      activa: true,
    })
    setEditingCuenta(null)
    setShowCuentaDialog(true)
  }

  const handleEditCuenta = (cuenta: CuentaBancariaEmpresa) => {
    setCuentaForm(cuenta)
    setEditingCuenta(cuenta)
    setShowCuentaDialog(true)
  }

  const handleSaveCuenta = async () => {
    if (!cuentaForm.titular || !cuentaForm.iban) {
      toast.error('El titular y el IBAN son obligatorios')
      return
    }

    const cuentas = [...(empresa.cuentasBancarias || [])]

    // Si es predeterminada, quitar el flag de las demás
    if (cuentaForm.predeterminada) {
      cuentas.forEach(c => c.predeterminada = false)
    }

    if (editingCuenta && editingCuenta._id) {
      // Editar existente
      const index = cuentas.findIndex(c => c._id === editingCuenta._id)
      if (index >= 0) {
        cuentas[index] = { ...cuentas[index], ...cuentaForm }
      }
    } else {
      // Nueva cuenta
      cuentas.push(cuentaForm as CuentaBancariaEmpresa)
    }

    setEmpresa({ ...empresa, cuentasBancarias: cuentas })
    setShowCuentaDialog(false)
    toast.success(editingCuenta ? 'Cuenta actualizada' : 'Cuenta añadida')
  }

  const handleDeleteCuenta = (cuenta: CuentaBancariaEmpresa) => {
    const cuentas = empresa.cuentasBancarias?.filter(c => c._id !== cuenta._id) || []
    setEmpresa({ ...empresa, cuentasBancarias: cuentas })
    toast.success('Cuenta eliminada')
  }

  // ============================================
  // TEXTOS LEGALES
  // ============================================

  const handleSaveTextosLegales = async () => {
    try {
      setIsSaving(true)
      const response = await empresaService.updateInfo({
        textosLegales: empresa.textosLegales,
      })
      if (response.success) {
        toast.success('Textos legales guardados')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // SERIES Y NUMERACIÓN
  // ============================================

  const handleSaveSeries = async () => {
    try {
      setIsSaving(true)
      const response = await empresaService.updateInfo({
        seriesDocumentos: empresa.seriesDocumentos,
      })
      if (response.success) {
        toast.success('Series guardadas')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // LOGO
  // ============================================

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo no puede superar 2MB')
      return
    }

    try {
      setIsUploadingLogo(true)
      const response = await empresaService.updateLogo(file)
      if (response.success && response.data) {
        setEmpresa({ ...empresa, logo: response.data.logoUrl })
        toast.success('Logo actualizado')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al subir el logo')
    } finally {
      setIsUploadingLogo(false)
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
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="empresa" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="bancaria" className="flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Cuentas Bancarias
            </TabsTrigger>
            <TabsTrigger value="textos" className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Textos Legales
            </TabsTrigger>
            <TabsTrigger value="series" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Series y Numeración
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email SMTP
            </TabsTrigger>
            <TabsTrigger value="certificados" className="flex items-center gap-2">
              <FileKey className="h-4 w-4" />
              Certificados
            </TabsTrigger>
            <TabsTrigger value="verifactu" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              VeriFactu
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label htmlFor="movil">Móvil</Label>
                    <Input
                      id="movil"
                      value={empresa.movil || ''}
                      onChange={(e) => setEmpresa({ ...empresa, movil: e.target.value })}
                      placeholder="600123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fax">Fax</Label>
                    <Input
                      id="fax"
                      value={empresa.fax || ''}
                      onChange={(e) => setEmpresa({ ...empresa, fax: e.target.value })}
                      placeholder="912345679"
                    />
                  </div>
                </div>

                <Separator />

                {/* Logo */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Logo de la Empresa</h3>
                  <div className="flex items-start gap-6">
                    {/* Vista previa del logo */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                        {empresa.logo ? (
                          <img
                            src={empresa.logo}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="logo">URL del Logo</Label>
                        <Input
                          id="logo"
                          value={empresa.logo || ''}
                          onChange={(e) => setEmpresa({ ...empresa, logo: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">o</span>
                        <input
                          type="file"
                          ref={logoInputRef}
                          onChange={handleLogoUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isUploadingLogo}
                        >
                          {isUploadingLogo ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Subir imagen
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Formatos: JPG, PNG, SVG. Máximo 2MB. Recomendado: 200x200px
                      </p>
                    </div>
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

                <Separator />

                {/* Datos de Registro Mercantil */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Datos de Registro Mercantil</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="registroMercantil">Registro Mercantil</Label>
                      <Input
                        id="registroMercantil"
                        value={empresa.datosRegistro?.registroMercantil || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          datosRegistro: { ...empresa.datosRegistro, registroMercantil: e.target.value }
                        })}
                        placeholder="Registro Mercantil de Madrid"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tomo">Tomo</Label>
                      <Input
                        id="tomo"
                        value={empresa.datosRegistro?.tomo || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          datosRegistro: { ...empresa.datosRegistro, tomo: e.target.value }
                        })}
                        placeholder="12345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="libro">Libro</Label>
                      <Input
                        id="libro"
                        value={empresa.datosRegistro?.libro || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          datosRegistro: { ...empresa.datosRegistro, libro: e.target.value }
                        })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="folio">Folio</Label>
                      <Input
                        id="folio"
                        value={empresa.datosRegistro?.folio || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          datosRegistro: { ...empresa.datosRegistro, folio: e.target.value }
                        })}
                        placeholder="123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seccion">Sección</Label>
                      <Input
                        id="seccion"
                        value={empresa.datosRegistro?.seccion || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          datosRegistro: { ...empresa.datosRegistro, seccion: e.target.value }
                        })}
                        placeholder="8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hoja">Hoja</Label>
                      <Input
                        id="hoja"
                        value={empresa.datosRegistro?.hoja || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          datosRegistro: { ...empresa.datosRegistro, hoja: e.target.value }
                        })}
                        placeholder="M-123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inscripcion">Inscripción</Label>
                      <Input
                        id="inscripcion"
                        value={empresa.datosRegistro?.inscripcion || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          datosRegistro: { ...empresa.datosRegistro, inscripcion: e.target.value }
                        })}
                        placeholder="1ª"
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
          {/* TAB: CUENTAS BANCARIAS */}
          {/* ============================================ */}
          <TabsContent value="bancaria" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="h-5 w-5" />
                      Cuentas Bancarias
                    </CardTitle>
                    <CardDescription>
                      Gestiona las cuentas bancarias de tu empresa para cobros y pagos
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddCuenta}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Cuenta
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(empresa.cuentasBancarias?.length || 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Landmark className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No hay cuentas bancarias configuradas</p>
                    <p className="text-sm">Añade una cuenta para poder incluirla en tus facturas y presupuestos</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alias / Banco</TableHead>
                        <TableHead>IBAN</TableHead>
                        <TableHead>Titular</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empresa.cuentasBancarias?.map((cuenta, index) => (
                        <TableRow key={cuenta._id || index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{cuenta.alias || cuenta.banco || 'Sin nombre'}</p>
                              {cuenta.banco && cuenta.alias && (
                                <p className="text-sm text-muted-foreground">{cuenta.banco}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{cuenta.iban}</TableCell>
                          <TableCell>{cuenta.titular}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {cuenta.predeterminada && (
                                <Badge variant="default">Principal</Badge>
                              )}
                              <Badge variant={cuenta.activa ? 'secondary' : 'outline'}>
                                {cuenta.activa ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCuenta(cuenta)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCuenta(cuenta)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              {(empresa.cuentasBancarias?.length || 0) > 0 && (
                <CardFooter className="justify-end border-t pt-4">
                  <Button onClick={handleSaveEmpresa} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Cambios
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* ============================================ */}
          {/* TAB: TEXTOS LEGALES */}
          {/* ============================================ */}
          <TabsContent value="textos" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5" />
                  Textos Legales y Plantillas
                </CardTitle>
                <CardDescription>
                  Configura los textos que aparecerán automáticamente en presupuestos, facturas y emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Textos para Presupuestos */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Presupuestos
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="presupuestoIntroduccion">Texto de Introducción</Label>
                      <Textarea
                        id="presupuestoIntroduccion"
                        value={empresa.textosLegales?.presupuestoIntroduccion || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          textosLegales: { ...empresa.textosLegales, presupuestoIntroduccion: e.target.value }
                        })}
                        placeholder="Texto que aparecerá al inicio del presupuesto..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="presupuestoCondiciones">Condiciones Comerciales</Label>
                      <Textarea
                        id="presupuestoCondiciones"
                        value={empresa.textosLegales?.presupuestoCondiciones || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          textosLegales: { ...empresa.textosLegales, presupuestoCondiciones: e.target.value }
                        })}
                        placeholder="Condiciones de pago, plazos de entrega, garantías..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="presupuestoPiePagina">Pie de Página</Label>
                      <Textarea
                        id="presupuestoPiePagina"
                        value={empresa.textosLegales?.presupuestoPiePagina || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          textosLegales: { ...empresa.textosLegales, presupuestoPiePagina: e.target.value }
                        })}
                        placeholder="Texto que aparecerá al final del presupuesto..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Textos para Facturas */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Facturas
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="facturaCondiciones">Condiciones de Pago</Label>
                      <Textarea
                        id="facturaCondiciones"
                        value={empresa.textosLegales?.facturaCondiciones || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          textosLegales: { ...empresa.textosLegales, facturaCondiciones: e.target.value }
                        })}
                        placeholder="Condiciones de pago para facturas..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facturaPiePagina">Pie de Página</Label>
                      <Textarea
                        id="facturaPiePagina"
                        value={empresa.textosLegales?.facturaPiePagina || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          textosLegales: { ...empresa.textosLegales, facturaPiePagina: e.target.value }
                        })}
                        placeholder="Texto que aparecerá al final de la factura..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Textos para Emails */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Emails
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailFirma">Firma de Email</Label>
                      <Textarea
                        id="emailFirma"
                        value={empresa.textosLegales?.emailFirma || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          textosLegales: { ...empresa.textosLegales, emailFirma: e.target.value }
                        })}
                        placeholder="Firma que aparecerá en los emails enviados..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailDisclaimer">Disclaimer / Aviso Legal</Label>
                      <Textarea
                        id="emailDisclaimer"
                        value={empresa.textosLegales?.emailDisclaimer || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          textosLegales: { ...empresa.textosLegales, emailDisclaimer: e.target.value }
                        })}
                        placeholder="Texto legal al pie del email (confidencialidad, etc.)..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* LOPD / RGPD */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    LOPD / RGPD
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="textoLOPD">Texto LOPD para Documentos</Label>
                      <Textarea
                        id="textoLOPD"
                        value={empresa.textosLegales?.textoLOPD || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          textosLegales: { ...empresa.textosLegales, textoLOPD: e.target.value }
                        })}
                        placeholder="En cumplimiento de la Ley Orgánica de Protección de Datos..."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Este texto aparecerá en presupuestos, facturas y comunicaciones
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condicionesVenta">Condiciones Generales de Venta</Label>
                      <Textarea
                        id="condicionesVenta"
                        value={empresa.textosLegales?.condicionesVenta || ''}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          textosLegales: { ...empresa.textosLegales, condicionesVenta: e.target.value }
                        })}
                        placeholder="Condiciones generales de venta..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveTextosLegales} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Textos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================ */}
          {/* TAB: SERIES Y NUMERACIÓN */}
          {/* ============================================ */}
          <TabsContent value="series" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Series de Documentos
                </CardTitle>
                <CardDescription>
                  Configura las series (prefijos) para la numeración de documentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seriePresupuestos">Serie Presupuestos</Label>
                    <Input
                      id="seriePresupuestos"
                      value={empresa.seriesDocumentos?.presupuestos || ''}
                      onChange={(e) => setEmpresa({
                        ...empresa,
                        seriesDocumentos: { ...empresa.seriesDocumentos, presupuestos: e.target.value.toUpperCase() }
                      })}
                      placeholder="P"
                      maxLength={5}
                    />
                    <p className="text-xs text-muted-foreground">Ejemplo: P-2024-00001</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seriePedidos">Serie Pedidos</Label>
                    <Input
                      id="seriePedidos"
                      value={empresa.seriesDocumentos?.pedidos || ''}
                      onChange={(e) => setEmpresa({
                        ...empresa,
                        seriesDocumentos: { ...empresa.seriesDocumentos, pedidos: e.target.value.toUpperCase() }
                      })}
                      placeholder="PED"
                      maxLength={5}
                    />
                    <p className="text-xs text-muted-foreground">Ejemplo: PED-2024-00001</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serieAlbaranes">Serie Albaranes</Label>
                    <Input
                      id="serieAlbaranes"
                      value={empresa.seriesDocumentos?.albaranes || ''}
                      onChange={(e) => setEmpresa({
                        ...empresa,
                        seriesDocumentos: { ...empresa.seriesDocumentos, albaranes: e.target.value.toUpperCase() }
                      })}
                      placeholder="ALB"
                      maxLength={5}
                    />
                    <p className="text-xs text-muted-foreground">Ejemplo: ALB-2024-00001</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serieFacturas">Serie Facturas</Label>
                    <Input
                      id="serieFacturas"
                      value={empresa.seriesDocumentos?.facturas || ''}
                      onChange={(e) => setEmpresa({
                        ...empresa,
                        seriesDocumentos: { ...empresa.seriesDocumentos, facturas: e.target.value.toUpperCase() }
                      })}
                      placeholder="F"
                      maxLength={5}
                    />
                    <p className="text-xs text-muted-foreground">Ejemplo: F-2024-00001</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serieFacturasRectificativas">Serie Facturas Rectificativas</Label>
                    <Input
                      id="serieFacturasRectificativas"
                      value={empresa.seriesDocumentos?.facturasRectificativas || ''}
                      onChange={(e) => setEmpresa({
                        ...empresa,
                        seriesDocumentos: { ...empresa.seriesDocumentos, facturasRectificativas: e.target.value.toUpperCase() }
                      })}
                      placeholder="FR"
                      maxLength={5}
                    />
                    <p className="text-xs text-muted-foreground">Ejemplo: FR-2024-00001</p>
                  </div>
                </div>

                <Separator />

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">Información sobre Numeración</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• La numeración es automática y correlativa dentro de cada serie</li>
                    <li>• Por defecto, la numeración se reinicia cada año fiscal</li>
                    <li>• Los números asignados no pueden ser modificados para cumplir con la normativa fiscal</li>
                    <li>• Los cambios en las series solo afectan a documentos nuevos</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveSeries} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Series
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================ */}
          {/* TAB: CONFIGURACIÓN DE EMAIL */}
          {/* ============================================ */}
          <TabsContent value="email" className="space-y-6 mt-6">
            {/* Estado de la configuración */}
            <div className={`flex items-center justify-between p-4 rounded-lg ${emailConfigExists ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center gap-3">
                {emailConfigExists ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Configuración de email activa</p>
                      <p className="text-sm text-green-600">
                        {emailConfig.authType === 'oauth2'
                          ? `Conectado con ${emailConfig.provider === 'google' ? 'Google' : 'Microsoft'} (${emailConfig.user})`
                          : `SMTP: ${emailConfig.host}:${emailConfig.port} (${emailConfig.user})`
                        }
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">No hay configuración de email</p>
                      <p className="text-sm text-amber-600">Conecta tu cuenta o configura SMTP para enviar emails.</p>
                    </div>
                  </>
                )}
              </div>
              {emailConfigExists && (
                <Button variant="outline" size="sm" onClick={handleDisconnectEmail} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Unlink className="mr-2 h-4 w-4" />
                  Desconectar
                </Button>
              )}
            </div>

            {/* Selector de método */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Método de Autenticación
                </CardTitle>
                <CardDescription>
                  Elige cómo conectar tu email para enviar desde Omerix
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Button
                    variant={emailAuthMethod === 'oauth2' ? 'default' : 'outline'}
                    onClick={() => setEmailAuthMethod('oauth2')}
                    className="flex-1"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Conectar con Google/Microsoft
                  </Button>
                  <Button
                    variant={emailAuthMethod === 'smtp' ? 'default' : 'outline'}
                    onClick={() => setEmailAuthMethod('smtp')}
                    className="flex-1"
                  >
                    <Server className="mr-2 h-4 w-4" />
                    Configuración SMTP Manual
                  </Button>
                </div>

                {/* OAuth2 */}
                {emailAuthMethod === 'oauth2' && (
                  <div className="space-y-6">
                    {/* Aviso si OAuth2 no está configurado en el servidor */}
                    {oauth2Providers && !oauth2Providers.google.configured && !oauth2Providers.microsoft.configured && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-amber-800 mb-2">
                          <AlertCircle className="h-5 w-5" />
                          <h4 className="font-medium">OAuth2 no está configurado en el servidor</h4>
                        </div>
                        <p className="text-sm text-amber-700 mb-2">
                          Para habilitar la conexión con Google o Microsoft, el administrador del sistema debe configurar las credenciales OAuth2 en el servidor.
                        </p>
                        <p className="text-sm text-amber-600">
                          Mientras tanto, puedes usar la <strong>Configuración SMTP Manual</strong> para enviar emails.
                        </p>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Conectar con tu cuenta de correo</h4>
                      <p className="text-sm text-blue-600 mb-4">
                        La forma más fácil y segura. No necesitas configurar servidores ni crear contraseñas de aplicación.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Google */}
                        <div className="p-4 border rounded-lg bg-white">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-100">
                              <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                              </svg>
                            </div>
                            <div>
                              <h5 className="font-medium">Google / Gmail</h5>
                              <p className="text-xs text-muted-foreground">Gmail o Google Workspace</p>
                            </div>
                          </div>
                          {emailConfig.authType === 'oauth2' && emailConfig.provider === 'google' && emailConfig.isConnected ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              Conectado
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={handleConnectGoogle}
                              disabled={isConnectingOAuth || !oauth2Providers?.google.configured}
                            >
                              {isConnectingOAuth ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ExternalLink className="mr-2 h-4 w-4" />
                              )}
                              {oauth2Providers?.google.configured ? 'Conectar con Google' : 'No configurado en servidor'}
                            </Button>
                          )}
                        </div>

                        {/* Microsoft */}
                        <div className="p-4 border rounded-lg bg-white">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100">
                              <svg className="w-6 h-6" viewBox="0 0 23 23">
                                <path fill="#f25022" d="M1 1h10v10H1z"/>
                                <path fill="#00a4ef" d="M1 12h10v10H1z"/>
                                <path fill="#7fba00" d="M12 1h10v10H12z"/>
                                <path fill="#ffb900" d="M12 12h10v10H12z"/>
                              </svg>
                            </div>
                            <div>
                              <h5 className="font-medium">Microsoft</h5>
                              <p className="text-xs text-muted-foreground">Outlook, Office 365, Hotmail</p>
                            </div>
                          </div>
                          {emailConfig.authType === 'oauth2' && emailConfig.provider === 'microsoft' && emailConfig.isConnected ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              Conectado
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={handleConnectMicrosoft}
                              disabled={isConnectingOAuth || !oauth2Providers?.microsoft.configured}
                            >
                              {isConnectingOAuth ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ExternalLink className="mr-2 h-4 w-4" />
                              )}
                              {oauth2Providers?.microsoft.configured ? 'Conectar con Microsoft' : 'No configurado en servidor'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SMTP Manual */}
                {emailAuthMethod === 'smtp' && (
                  <div className="space-y-6">
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
                          <Label htmlFor="smtpPassword">Contraseña {emailConfig.hasPassword ? '' : '*'}</Label>
                          <div className="relative">
                            <Input
                              id="smtpPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={emailConfig.password || ''}
                              onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                              placeholder={emailConfig.hasPassword ? 'Dejar vacío para mantener la actual' : 'Contraseña del email'}
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
                            Para Gmail: usa una "Contraseña de aplicación" (Configuración de cuenta Google &gt; Seguridad)
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

                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={handleSaveEmailConfig} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Guardar Configuración SMTP
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Probar configuración */}
            {emailConfigExists && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Probar Envío de Email</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Email para prueba"
                      className="max-w-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={handleTestEmail}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Enviar Email de Prueba
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ayuda */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ayuda de Configuración</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-blue-800 mb-2">Recomendado: Conectar con Google/Microsoft</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>• No requiere configuración técnica</li>
                      <li>• Más seguro (sin contraseñas)</li>
                      <li>• Se renueva automáticamente</li>
                      <li>• Mejor entregabilidad de emails</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">SMTP Manual</h4>
                    <p className="text-muted-foreground mb-2">Úsalo si:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Tienes tu propio servidor de correo</li>
                      <li>• Usas un servicio como SendGrid, Mailgun...</li>
                      <li>• Tu proveedor no soporta OAuth2</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================ */}
          {/* TAB: CERTIFICADOS ELECTRÓNICOS */}
          {/* ============================================ */}
          <TabsContent value="certificados" className="space-y-6 mt-6">
            <CertificadoConfig />
          </TabsContent>

          {/* ============================================ */}
          {/* TAB: VERIFACTU / FACTURACIÓN ELECTRÓNICA */}
          {/* ============================================ */}
          <TabsContent value="verifactu" className="space-y-6 mt-6">
            <VerifactuConfig />
          </TabsContent>
        </Tabs>

        {/* ============================================ */}
        {/* DIALOG: CUENTA BANCARIA */}
        {/* ============================================ */}
        <Dialog open={showCuentaDialog} onOpenChange={setShowCuentaDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCuenta ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
              </DialogTitle>
              <DialogDescription>
                {editingCuenta
                  ? 'Modifica los datos de la cuenta bancaria'
                  : 'Añade una nueva cuenta bancaria a tu empresa'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="cuentaTitular">Titular *</Label>
                  <Input
                    id="cuentaTitular"
                    value={cuentaForm.titular || ''}
                    onChange={(e) => setCuentaForm({ ...cuentaForm, titular: e.target.value })}
                    placeholder="Nombre del titular de la cuenta"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="cuentaIban">IBAN *</Label>
                  <Input
                    id="cuentaIban"
                    value={cuentaForm.iban || ''}
                    onChange={(e) => setCuentaForm({ ...cuentaForm, iban: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    placeholder="ES00 0000 0000 0000 0000 0000"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuentaSwift">SWIFT/BIC</Label>
                  <Input
                    id="cuentaSwift"
                    value={cuentaForm.swift || ''}
                    onChange={(e) => setCuentaForm({ ...cuentaForm, swift: e.target.value.toUpperCase() })}
                    placeholder="XXXXXXXX"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuentaBanco">Banco</Label>
                  <Input
                    id="cuentaBanco"
                    value={cuentaForm.banco || ''}
                    onChange={(e) => setCuentaForm({ ...cuentaForm, banco: e.target.value })}
                    placeholder="Nombre del banco"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="cuentaAlias">Alias (nombre descriptivo)</Label>
                  <Input
                    id="cuentaAlias"
                    value={cuentaForm.alias || ''}
                    onChange={(e) => setCuentaForm({ ...cuentaForm, alias: e.target.value })}
                    placeholder="Ej: Cuenta Principal, Cuenta Pagos..."
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cuentaPredeterminada" className="cursor-pointer">
                    Cuenta predeterminada
                  </Label>
                  <Switch
                    id="cuentaPredeterminada"
                    checked={cuentaForm.predeterminada || false}
                    onCheckedChange={(checked) => setCuentaForm({ ...cuentaForm, predeterminada: checked })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  La cuenta predeterminada aparecerá automáticamente en facturas y presupuestos
                </p>

                <div className="flex items-center justify-between">
                  <Label htmlFor="cuentaActiva" className="cursor-pointer">
                    Cuenta activa
                  </Label>
                  <Switch
                    id="cuentaActiva"
                    checked={cuentaForm.activa !== false}
                    onCheckedChange={(checked) => setCuentaForm({ ...cuentaForm, activa: checked })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCuentaDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCuenta}>
                {editingCuenta ? 'Guardar Cambios' : 'Añadir Cuenta'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
