'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  Shield,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  FileKey,
  Star,
  Key,
  RefreshCw,
  Fingerprint,
  Building2,
  User,
  Calendar,
  Monitor,
  FolderKey,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import certificadosService, {
  CertificadoElectronico,
  SubirCertificadoDTO,
  TipoCertificado,
  EstadoCertificado,
  UsosCertificado,
  OrigenCertificado,
  WindowsCertificateInfo,
  RegistrarCertificadoWindowsDTO,
} from '@/services/certificados.service'

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CertificadoConfig() {
  const [certificados, setCertificados] = useState<CertificadoElectronico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCertificado, setSelectedCertificado] = useState<CertificadoElectronico | null>(null)

  // Estados para Windows Store
  const [windowsStoreDisponible, setWindowsStoreDisponible] = useState(false)
  const [windowsCertificados, setWindowsCertificados] = useState<WindowsCertificateInfo[]>([])
  const [isLoadingWindowsCerts, setIsLoadingWindowsCerts] = useState(false)
  const [selectedWindowsCert, setSelectedWindowsCert] = useState<WindowsCertificateInfo | null>(null)
  const [windowsFormNombre, setWindowsFormNombre] = useState('')
  const [windowsFormDescripcion, setWindowsFormDescripcion] = useState('')
  const [windowsFormTipo, setWindowsFormTipo] = useState<TipoCertificado>(TipoCertificado.PERSONA_JURIDICA)
  const [windowsFormUsos, setWindowsFormUsos] = useState<UsosCertificado[]>([UsosCertificado.TODOS])
  const [windowsFormPredeterminado, setWindowsFormPredeterminado] = useState(false)
  const [isRegisteringWindows, setIsRegisteringWindows] = useState(false)
  const [uploadTab, setUploadTab] = useState<'archivo' | 'windows'>('archivo')

  // Estados del formulario de subida
  const [isUploading, setIsUploading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [uploadForm, setUploadForm] = useState<{
    nombre: string
    descripcion: string
    tipo: TipoCertificado
    usos: UsosCertificado[]
    predeterminado: boolean
    archivo: File | null
    archivoBase64: string
    nombreArchivo: string
    password: string
    infoValidacion: any | null
  }>({
    nombre: '',
    descripcion: '',
    tipo: TipoCertificado.PERSONA_JURIDICA,
    usos: [UsosCertificado.TODOS],
    predeterminado: false,
    archivo: null,
    archivoBase64: '',
    nombreArchivo: '',
    password: '',
    infoValidacion: null,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar certificados y verificar Windows Store
  useEffect(() => {
    loadCertificados()
    checkWindowsStore()
  }, [])

  // Verificar si Windows Store está disponible
  const checkWindowsStore = async () => {
    try {
      const response = await certificadosService.windowsStoreDisponible()
      if (response.success && response.data.disponible) {
        setWindowsStoreDisponible(true)
      }
    } catch (error) {
      // Si falla, simplemente no mostrar la opción de Windows Store
      setWindowsStoreDisponible(false)
    }
  }

  // Cargar certificados del almacén de Windows
  const loadWindowsCertificados = async () => {
    if (!windowsStoreDisponible) return

    try {
      setIsLoadingWindowsCerts(true)
      const response = await certificadosService.listarCertificadosWindows()
      if (response.success) {
        setWindowsCertificados(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cargar certificados de Windows')
    } finally {
      setIsLoadingWindowsCerts(false)
    }
  }

  const loadCertificados = async () => {
    try {
      setIsLoading(true)
      const response = await certificadosService.listar()
      if (response.success) {
        setCertificados(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cargar certificados')
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar selección de archivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar extensión
    const ext = file.name.toLowerCase()
    if (!ext.endsWith('.p12') && !ext.endsWith('.pfx')) {
      toast.error('Solo se permiten archivos .p12 o .pfx')
      return
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar 10MB')
      return
    }

    try {
      const base64 = await certificadosService.fileToBase64(file)
      setUploadForm({
        ...uploadForm,
        archivo: file,
        archivoBase64: base64,
        nombreArchivo: file.name,
        nombre: file.name.replace(/\.(p12|pfx)$/i, ''),
        infoValidacion: null,
      })
    } catch (error) {
      toast.error('Error al leer el archivo')
    }
  }

  // Validar contraseña del certificado
  const handleValidatePassword = async () => {
    if (!uploadForm.archivoBase64 || !uploadForm.password) {
      toast.error('Selecciona un archivo e introduce la contraseña')
      return
    }

    try {
      setIsValidating(true)
      const response = await certificadosService.verificarPassword(
        uploadForm.archivoBase64,
        uploadForm.password
      )

      if (response.success && response.data.valido) {
        setUploadForm({
          ...uploadForm,
          infoValidacion: response.data.info,
        })
        toast.success('Certificado y contraseña válidos')
      }
    } catch (error: any) {
      setUploadForm({
        ...uploadForm,
        infoValidacion: null,
      })
      toast.error(error.response?.data?.error || 'Contraseña incorrecta')
    } finally {
      setIsValidating(false)
    }
  }

  // Subir certificado
  const handleUpload = async () => {
    if (!uploadForm.archivoBase64 || !uploadForm.password || !uploadForm.nombre) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    if (!uploadForm.infoValidacion) {
      toast.error('Valida la contraseña primero')
      return
    }

    try {
      setIsUploading(true)
      const dto: SubirCertificadoDTO = {
        nombre: uploadForm.nombre,
        descripcion: uploadForm.descripcion,
        tipo: uploadForm.tipo,
        usos: uploadForm.usos,
        predeterminado: uploadForm.predeterminado,
        archivoBase64: uploadForm.archivoBase64,
        nombreArchivo: uploadForm.nombreArchivo,
        password: uploadForm.password,
      }

      const response = await certificadosService.subir(dto)
      if (response.success) {
        toast.success(response.message)
        setShowUploadDialog(false)
        resetUploadForm()
        loadCertificados()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al subir certificado')
    } finally {
      setIsUploading(false)
    }
  }

  // Resetear formulario
  const resetUploadForm = () => {
    setUploadForm({
      nombre: '',
      descripcion: '',
      tipo: TipoCertificado.PERSONA_JURIDICA,
      usos: [UsosCertificado.TODOS],
      predeterminado: false,
      archivo: null,
      archivoBase64: '',
      nombreArchivo: '',
      password: '',
      infoValidacion: null,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Establecer como predeterminado
  const handleSetDefault = async (cert: CertificadoElectronico) => {
    try {
      const response = await certificadosService.actualizar(cert._id, {
        predeterminado: true,
      })
      if (response.success) {
        toast.success('Certificado marcado como predeterminado')
        loadCertificados()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar')
    }
  }

  // Eliminar certificado
  const handleDelete = async () => {
    if (!selectedCertificado) return

    try {
      const response = await certificadosService.eliminar(selectedCertificado._id)
      if (response.success) {
        toast.success('Certificado eliminado')
        setShowDeleteDialog(false)
        setSelectedCertificado(null)
        loadCertificados()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    }
  }

  // Probar firma
  const handleTestSign = async (cert: CertificadoElectronico) => {
    try {
      const response = await certificadosService.probarFirma(cert._id)
      if (response.success) {
        toast.success('Firma generada correctamente')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al probar firma')
    }
  }

  // Registrar certificado de Windows Store
  const handleRegisterWindowsCert = async () => {
    if (!selectedWindowsCert || !windowsFormNombre) {
      toast.error('Selecciona un certificado e introduce un nombre')
      return
    }

    try {
      setIsRegisteringWindows(true)
      const dto: RegistrarCertificadoWindowsDTO = {
        nombre: windowsFormNombre,
        descripcion: windowsFormDescripcion,
        tipo: windowsFormTipo,
        usos: windowsFormUsos,
        predeterminado: windowsFormPredeterminado,
        thumbprint: selectedWindowsCert.thumbprint,
        storeLocation: selectedWindowsCert.storeLocation,
        storeName: 'MY',
      }

      const response = await certificadosService.registrarCertificadoWindows(dto)
      if (response.success) {
        toast.success(response.message)
        setShowUploadDialog(false)
        resetWindowsForm()
        loadCertificados()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar certificado')
    } finally {
      setIsRegisteringWindows(false)
    }
  }

  // Resetear formulario de Windows
  const resetWindowsForm = () => {
    setSelectedWindowsCert(null)
    setWindowsFormNombre('')
    setWindowsFormDescripcion('')
    setWindowsFormTipo(TipoCertificado.PERSONA_JURIDICA)
    setWindowsFormUsos([UsosCertificado.TODOS])
    setWindowsFormPredeterminado(false)
  }

  // Al seleccionar certificado de Windows, pre-rellenar nombre
  const handleSelectWindowsCert = (cert: WindowsCertificateInfo) => {
    setSelectedWindowsCert(cert)
    setWindowsFormNombre(cert.friendlyName || cert.titular.nombre || 'Certificado Windows')
  }

  // Obtener estado visual del certificado
  const getCertificadoStatus = (cert: CertificadoElectronico) => {
    const dias = certificadosService.diasHasta(cert.fechaExpiracion)

    if (cert.estado === EstadoCertificado.CADUCADO || dias <= 0) {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Caducado',
      }
    }
    if (cert.estado === EstadoCertificado.REVOCADO) {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Revocado',
      }
    }
    if (dias <= 30) {
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <AlertTriangle className="h-4 w-4" />,
        text: `Caduca en ${dias} días`,
      }
    }
    return {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="h-4 w-4" />,
      text: 'Activo',
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Certificados Electrónicos
              </CardTitle>
              <CardDescription>
                Gestiona los certificados digitales para firma electrónica y comunicación con Hacienda
              </CardDescription>
            </div>
            <Button onClick={() => {
              setShowUploadDialog(true)
              if (windowsStoreDisponible) {
                loadWindowsCertificados()
              }
            }}>
              <Upload className="mr-2 h-4 w-4" />
              Añadir Certificado
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {certificados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileKey className="mx-auto h-16 w-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No hay certificados configurados</h3>
              <p className="text-sm mb-4">
                Añade un certificado digital para poder firmar facturas y comunicarte con la AEAT
              </p>
              <Button onClick={() => {
                setShowUploadDialog(true)
                if (windowsStoreDisponible) {
                  loadWindowsCertificados()
                }
              }}>
                <Upload className="mr-2 h-4 w-4" />
                Añadir Certificado
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificado</TableHead>
                  <TableHead>Titular</TableHead>
                  <TableHead>Válido hasta</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificados.map((cert) => {
                  const status = getCertificadoStatus(cert)
                  return (
                    <TableRow key={cert._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {cert.origen === OrigenCertificado.WINDOWS_STORE ? (
                              <Monitor className="h-8 w-8 text-blue-500" />
                            ) : (
                              <FileKey className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{cert.nombre}</p>
                              {cert.predeterminado && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Predeterminado
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {cert.origen === OrigenCertificado.WINDOWS_STORE ? (
                                <>Almacén de Windows</>
                              ) : cert.archivo ? (
                                <>{cert.archivo.nombre} ({certificadosService.formatFileSize(cert.archivo.tamaño)})</>
                              ) : (
                                <>Archivo .p12/.pfx</>
                              )}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{cert.titular.nombre}</p>
                        <p className="text-sm text-muted-foreground">{cert.titular.nif}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(cert.fechaExpiracion).toLocaleDateString('es-ES')}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`${status.color} flex items-center gap-1 justify-center w-fit mx-auto`}
                        >
                          {status.icon}
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!cert.predeterminado && cert.estado === EstadoCertificado.ACTIVO && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(cert)}
                              title="Establecer como predeterminado"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestSign(cert)}
                            title="Probar firma"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCertificado(cert)
                              setShowDetailDialog(true)
                            }}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCertificado(cert)
                              setShowDeleteDialog(true)
                            }}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Información de ayuda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información sobre Certificados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2">¿Qué certificado necesito?</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• <strong>VeriFactu:</strong> Certificado de persona jurídica o representante</li>
                <li>• <strong>TicketBAI:</strong> Certificado reconocido por la Diputación</li>
                <li>• <strong>SII:</strong> Certificado de la FNMT o similar</li>
              </ul>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <h4 className="font-medium text-amber-800 mb-2">Seguridad</h4>
              <ul className="space-y-1 text-amber-700">
                <li>• El certificado se almacena encriptado</li>
                <li>• La contraseña nunca se muestra ni se almacena en texto plano</li>
                <li>• Solo usuarios autorizados pueden gestionar certificados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* DIALOG: AÑADIR CERTIFICADO */}
      {/* ============================================ */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        if (!open) {
          resetUploadForm()
          resetWindowsForm()
        }
        setShowUploadDialog(open)
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Añadir Certificado Electrónico</DialogTitle>
            <DialogDescription>
              Sube un archivo .p12/.pfx o selecciona uno del almacén de Windows
            </DialogDescription>
          </DialogHeader>

          <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as 'archivo' | 'windows')} className="w-full flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="archivo" className="flex items-center gap-2">
                <FileKey className="h-4 w-4" />
                Archivo .p12/.pfx
              </TabsTrigger>
              <TabsTrigger value="windows" disabled={!windowsStoreDisponible} className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Almacén Windows
              </TabsTrigger>
            </TabsList>

            {/* TAB: SUBIR ARCHIVO */}
            <TabsContent value="archivo" className="space-y-4 mt-4 flex-1 overflow-y-auto">
              {/* Paso 1: Seleccionar archivo */}
              <div className="space-y-2">
                <Label>Archivo del certificado *</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".p12,.pfx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadForm.nombreArchivo || 'Seleccionar archivo'}
                  </Button>
                </div>
                {uploadForm.archivo && (
                  <p className="text-sm text-muted-foreground">
                    {certificadosService.formatFileSize(uploadForm.archivo.size)}
                  </p>
                )}
              </div>

              {/* Paso 2: Contraseña */}
              {uploadForm.archivoBase64 && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña del certificado *</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={uploadForm.password}
                        onChange={(e) => setUploadForm({
                          ...uploadForm,
                          password: e.target.value,
                          infoValidacion: null,
                        })}
                        placeholder="Introduce la contraseña"
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidatePassword}
                      disabled={!uploadForm.password || isValidating}
                    >
                      {isValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Información del certificado validado */}
              {uploadForm.infoValidacion && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Certificado válido</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Titular</p>
                      <p className="font-medium">{uploadForm.infoValidacion.titular.nombre}</p>
                      <p className="text-muted-foreground">{uploadForm.infoValidacion.titular.nif}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Validez</p>
                    <p className="text-xs">
                      Desde: {new Date(uploadForm.infoValidacion.fechaEmision).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-xs">
                      Hasta: {new Date(uploadForm.infoValidacion.fechaExpiracion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3: Datos adicionales */}
            {uploadForm.infoValidacion && (
              <>
                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre descriptivo *</Label>
                  <Input
                    id="nombre"
                    value={uploadForm.nombre}
                    onChange={(e) => setUploadForm({ ...uploadForm, nombre: e.target.value })}
                    placeholder="Ej: Certificado FNMT 2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={uploadForm.descripcion}
                    onChange={(e) => setUploadForm({ ...uploadForm, descripcion: e.target.value })}
                    placeholder="Descripción opcional..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de certificado</Label>
                    <Select
                      value={uploadForm.tipo}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, tipo: value as TipoCertificado })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TipoCertificado.PERSONA_JURIDICA}>Persona Jurídica</SelectItem>
                        <SelectItem value={TipoCertificado.PERSONA_FISICA}>Persona Física</SelectItem>
                        <SelectItem value={TipoCertificado.REPRESENTANTE}>Representante</SelectItem>
                        <SelectItem value={TipoCertificado.SELLO_EMPRESA}>Sello de Empresa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Uso principal</Label>
                    <Select
                      value={uploadForm.usos[0]}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, usos: [value as UsosCertificado] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UsosCertificado.TODOS}>Todos los usos</SelectItem>
                        <SelectItem value={UsosCertificado.VERIFACTU}>VeriFactu</SelectItem>
                        <SelectItem value={UsosCertificado.TICKETBAI}>TicketBAI</SelectItem>
                        <SelectItem value={UsosCertificado.SII}>SII</SelectItem>
                        <SelectItem value={UsosCertificado.FIRMA_DOCUMENTOS}>Firma Documentos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="predeterminado" className="cursor-pointer">
                    Establecer como predeterminado
                  </Label>
                  <Switch
                    id="predeterminado"
                    checked={uploadForm.predeterminado}
                    onCheckedChange={(checked) => setUploadForm({ ...uploadForm, predeterminado: checked })}
                  />
                </div>
              </>
            )}

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => {
                  setShowUploadDialog(false)
                  resetUploadForm()
                }}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadForm.infoValidacion || !uploadForm.nombre || isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Subir Certificado
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* TAB: WINDOWS STORE */}
            <TabsContent value="windows" className="space-y-4 mt-4 flex-1 overflow-y-auto">
              {isLoadingWindowsCerts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : windowsCertificados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No se encontraron certificados</h3>
                  <p className="text-sm">
                    No hay certificados con clave privada en el almacén de Windows
                  </p>
                  <Button variant="outline" className="mt-4" onClick={loadWindowsCertificados}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recargar
                  </Button>
                </div>
              ) : (
                <>
                  {/* Lista de certificados de Windows */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Selecciona un certificado del almacén de Windows</Label>
                      <Button variant="ghost" size="sm" onClick={loadWindowsCertificados}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto overflow-x-hidden space-y-2 border rounded-lg p-2">
                      {windowsCertificados.map((cert) => {
                        const isSelected = selectedWindowsCert?.thumbprint === cert.thumbprint
                        const dias = certificadosService.diasHasta(cert.notAfter)
                        const caducado = dias <= 0

                        return (
                          <div
                            key={cert.thumbprint}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors overflow-hidden ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : caducado
                                  ? 'border-red-200 bg-red-50 opacity-60'
                                  : 'border-border hover:bg-accent'
                            }`}
                            onClick={() => !caducado && handleSelectWindowsCert(cert)}
                          >
                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="font-medium truncate text-sm">
                                  {cert.friendlyName || cert.titular.nombre}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {cert.titular.nif} - {cert.emisor.nombre}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  Válido hasta: {new Date(cert.notAfter).toLocaleDateString('es-ES')}
                                  {caducado && <span className="text-red-600 ml-2">(Caducado)</span>}
                                  {!caducado && dias <= 30 && <span className="text-yellow-600 ml-2">({dias} días)</span>}
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Formulario de datos adicionales */}
                  {selectedWindowsCert && (
                    <>
                      <Separator />

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                        <div className="flex items-center gap-2 text-blue-700">
                          <Monitor className="h-5 w-5" />
                          <span className="font-medium">Certificado seleccionado</span>
                        </div>
                        <div className="text-sm">
                          <p><strong>Titular:</strong> {selectedWindowsCert.titular.nombre}</p>
                          <p><strong>NIF:</strong> {selectedWindowsCert.titular.nif}</p>
                          <p><strong>Válido hasta:</strong> {new Date(selectedWindowsCert.notAfter).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="winNombre">Nombre descriptivo *</Label>
                        <Input
                          id="winNombre"
                          value={windowsFormNombre}
                          onChange={(e) => setWindowsFormNombre(e.target.value)}
                          placeholder="Ej: Certificado FNMT Windows"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="winDescripcion">Descripción</Label>
                        <Textarea
                          id="winDescripcion"
                          value={windowsFormDescripcion}
                          onChange={(e) => setWindowsFormDescripcion(e.target.value)}
                          placeholder="Descripción opcional..."
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de certificado</Label>
                          <Select
                            value={windowsFormTipo}
                            onValueChange={(value) => setWindowsFormTipo(value as TipoCertificado)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={TipoCertificado.PERSONA_JURIDICA}>Persona Jurídica</SelectItem>
                              <SelectItem value={TipoCertificado.PERSONA_FISICA}>Persona Física</SelectItem>
                              <SelectItem value={TipoCertificado.REPRESENTANTE}>Representante</SelectItem>
                              <SelectItem value={TipoCertificado.SELLO_EMPRESA}>Sello de Empresa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Uso principal</Label>
                          <Select
                            value={windowsFormUsos[0]}
                            onValueChange={(value) => setWindowsFormUsos([value as UsosCertificado])}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UsosCertificado.TODOS}>Todos los usos</SelectItem>
                              <SelectItem value={UsosCertificado.VERIFACTU}>VeriFactu</SelectItem>
                              <SelectItem value={UsosCertificado.TICKETBAI}>TicketBAI</SelectItem>
                              <SelectItem value={UsosCertificado.SII}>SII</SelectItem>
                              <SelectItem value={UsosCertificado.FIRMA_DOCUMENTOS}>Firma Documentos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="winPredeterminado" className="cursor-pointer">
                          Establecer como predeterminado
                        </Label>
                        <Switch
                          id="winPredeterminado"
                          checked={windowsFormPredeterminado}
                          onCheckedChange={setWindowsFormPredeterminado}
                        />
                      </div>
                    </>
                  )}

                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => {
                      setShowUploadDialog(false)
                      resetWindowsForm()
                    }}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleRegisterWindowsCert}
                      disabled={!selectedWindowsCert || !windowsFormNombre || isRegisteringWindows}
                    >
                      {isRegisteringWindows ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Monitor className="mr-2 h-4 w-4" />
                      )}
                      Registrar Certificado
                    </Button>
                  </DialogFooter>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DIALOG: DETALLES DEL CERTIFICADO */}
      {/* ============================================ */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del Certificado</DialogTitle>
          </DialogHeader>

          {selectedCertificado && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{selectedCertificado.nombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge
                    variant="outline"
                    className={certificadosService.getColorEstado(selectedCertificado.estado)}
                  >
                    {selectedCertificado.estado}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Titular
                </Label>
                <p className="font-medium">{selectedCertificado.titular.nombre}</p>
                <p className="text-sm text-muted-foreground">NIF: {selectedCertificado.titular.nif}</p>
                {selectedCertificado.titular.organizacion && (
                  <p className="text-sm text-muted-foreground">{selectedCertificado.titular.organizacion}</p>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Emisor
                </Label>
                <p className="font-medium">{selectedCertificado.emisor.nombre}</p>
                {selectedCertificado.emisor.organizacion && (
                  <p className="text-sm text-muted-foreground">{selectedCertificado.emisor.organizacion}</p>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fecha emisión</Label>
                  <p>{new Date(selectedCertificado.fechaEmision).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha expiración</Label>
                  <p>{new Date(selectedCertificado.fechaExpiracion).toLocaleDateString('es-ES')}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Fingerprint className="h-4 w-4" />
                  Huella Digital (SHA-256)
                </Label>
                <p className="text-xs font-mono break-all bg-muted p-2 rounded">
                  {selectedCertificado.huella.sha256}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p>{certificadosService.getTipoLabel(selectedCertificado.tipo)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Usos</Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedCertificado.usos.map((uso) => (
                      <Badge key={uso} variant="secondary" className="text-xs">
                        {certificadosService.getUsoLabel(uso)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {selectedCertificado.ultimoUso && (
                <div>
                  <Label className="text-muted-foreground">Último uso</Label>
                  <p>
                    {new Date(selectedCertificado.ultimoUso).toLocaleString('es-ES')}
                    ({selectedCertificado.contadorUsos} usos totales)
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DIALOG: CONFIRMAR ELIMINACIÓN */}
      {/* ============================================ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar certificado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El certificado &quot;{selectedCertificado?.nombre}&quot;
              será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CertificadoConfig
