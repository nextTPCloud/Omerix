// web/src/services/certificados.service.ts

import { api } from './api'

// ============================================
// TIPOS
// ============================================

export enum TipoCertificado {
  PERSONA_FISICA = 'persona_fisica',
  PERSONA_JURIDICA = 'persona_juridica',
  REPRESENTANTE = 'representante',
  SELLO_EMPRESA = 'sello_empresa',
}

export enum EstadoCertificado {
  ACTIVO = 'activo',
  CADUCADO = 'caducado',
  REVOCADO = 'revocado',
  PENDIENTE = 'pendiente',
}

export enum UsosCertificado {
  VERIFACTU = 'verifactu',
  TICKETBAI = 'ticketbai',
  SII = 'sii',
  FIRMA_DOCUMENTOS = 'firma_documentos',
  TODOS = 'todos',
}

export enum OrigenCertificado {
  ARCHIVO = 'archivo',
  WINDOWS_STORE = 'windows_store',
}

export interface CertificadoElectronico {
  _id: string
  empresaId: string
  nombre: string
  descripcion?: string
  tipo: TipoCertificado
  estado: EstadoCertificado
  origen: OrigenCertificado
  titular: {
    nombre: string
    nif: string
    organizacion?: string
  }
  emisor: {
    nombre: string
    organizacion?: string
  }
  fechaEmision: string
  fechaExpiracion: string
  numeroSerie: string
  // Solo para origen ARCHIVO
  archivo?: {
    nombre: string
    tipo: 'p12' | 'pfx'
    tamaño: number
  }
  // Solo para origen WINDOWS_STORE
  windowsStore?: {
    storeName: string
    thumbprint: string
    friendlyName?: string
  }
  huella: {
    sha1: string
    sha256: string
  }
  usos: UsosCertificado[]
  predeterminado: boolean
  activo: boolean
  ultimoUso?: string
  contadorUsos: number
  creadoPor: {
    _id: string
    nombre: string
    apellidos: string
    email: string
  }
  fechaCreacion: string
  fechaModificacion?: string
  // Virtuals
  diasParaCaducar?: number
  estaCaducado?: boolean
  proximoACaducar?: boolean
}

// Certificado del almacén de Windows
export interface WindowsCertificateInfo {
  thumbprint: string
  thumbprintSha256?: string
  subject: string
  issuer: string
  notBefore: string
  notAfter: string
  serialNumber: string
  friendlyName?: string
  hasPrivateKey: boolean
  storeLocation: string  // CurrentUser o LocalMachine
  titular: {
    nombre: string
    nif: string
    organizacion?: string
  }
  emisor: {
    nombre: string
    organizacion?: string
  }
}

export interface RegistrarCertificadoWindowsDTO {
  nombre: string
  descripcion?: string
  tipo?: TipoCertificado
  usos?: UsosCertificado[]
  predeterminado?: boolean
  thumbprint: string
  storeLocation?: string  // CurrentUser o LocalMachine
  storeName?: string
}

export interface SubirCertificadoDTO {
  nombre: string
  descripcion?: string
  tipo?: TipoCertificado
  usos?: UsosCertificado[]
  predeterminado?: boolean
  archivoBase64: string
  nombreArchivo: string
  password: string
}

export interface ActualizarCertificadoDTO {
  nombre?: string
  descripcion?: string
  tipo?: TipoCertificado
  usos?: UsosCertificado[]
  predeterminado?: boolean
  activo?: boolean
}

export interface InfoCertificadoValidacion {
  valido: boolean
  info?: {
    titular: {
      nombre: string
      nif: string
      organizacion?: string
    }
    emisor: {
      nombre: string
      organizacion?: string
    }
    fechaEmision: string
    fechaExpiracion: string
    numeroSerie: string
  }
}

export interface ResultadoValidacion {
  valido: boolean
  mensaje: string
}

// ============================================
// SERVICIO
// ============================================

export const certificadosService = {
  /**
   * Listar certificados de la empresa
   */
  async listar(): Promise<{ success: boolean; data: CertificadoElectronico[] }> {
    const response = await api.get('/certificados')
    return response.data
  },

  /**
   * Obtener certificado por ID
   */
  async obtenerPorId(id: string): Promise<{ success: boolean; data: CertificadoElectronico }> {
    const response = await api.get(`/certificados/${id}`)
    return response.data
  },

  /**
   * Obtener certificado predeterminado
   */
  async obtenerPredeterminado(): Promise<{ success: boolean; data: CertificadoElectronico | null }> {
    try {
      const response = await api.get('/certificados/predeterminado')
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { success: true, data: null }
      }
      throw error
    }
  },

  /**
   * Verificar contraseña de un certificado (antes de subirlo)
   */
  async verificarPassword(
    archivoBase64: string,
    password: string
  ): Promise<{ success: boolean; data: InfoCertificadoValidacion }> {
    const response = await api.post('/certificados/verificar-password', {
      archivoBase64,
      password,
    })
    return response.data
  },

  /**
   * Subir un nuevo certificado
   */
  async subir(dto: SubirCertificadoDTO): Promise<{ success: boolean; data: CertificadoElectronico; message: string }> {
    const response = await api.post('/certificados', dto)
    return response.data
  },

  /**
   * Actualizar un certificado
   */
  async actualizar(
    id: string,
    dto: ActualizarCertificadoDTO
  ): Promise<{ success: boolean; data: CertificadoElectronico; message: string }> {
    const response = await api.put(`/certificados/${id}`, dto)
    return response.data
  },

  /**
   * Eliminar un certificado
   */
  async eliminar(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/certificados/${id}`)
    return response.data
  },

  /**
   * Validar un certificado para un uso específico
   */
  async validar(
    id: string,
    uso?: UsosCertificado
  ): Promise<{ success: boolean; data: ResultadoValidacion }> {
    const params = uso ? `?uso=${uso}` : ''
    const response = await api.get(`/certificados/${id}/validar${params}`)
    return response.data
  },

  /**
   * Probar firma con un certificado
   */
  async probarFirma(
    id: string,
    datos?: string
  ): Promise<{
    success: boolean
    data: {
      datosOriginales: string
      firma: string
      algoritmo: string
    }
    message: string
  }> {
    const response = await api.post(`/certificados/${id}/probar-firma`, { datos })
    return response.data
  },

  /**
   * Obtener certificados próximos a caducar (admin)
   */
  async proximosACaducar(
    dias: number = 30
  ): Promise<{ success: boolean; data: CertificadoElectronico[]; total: number }> {
    const response = await api.get(`/certificados/proximos-caducar?dias=${dias}`)
    return response.data
  },

  // ============================================
  // WINDOWS STORE
  // ============================================

  /**
   * Verificar si el almacén de Windows está disponible
   */
  async windowsStoreDisponible(): Promise<{
    success: boolean
    data: { disponible: boolean; plataforma: string }
  }> {
    const response = await api.get('/certificados/windows-store/disponible')
    return response.data
  },

  /**
   * Listar certificados del almacén de Windows
   */
  async listarCertificadosWindows(
    storeName: string = 'MY'
  ): Promise<{ success: boolean; data: WindowsCertificateInfo[]; total: number }> {
    const response = await api.get(`/certificados/windows-store/listar?store=${storeName}`)
    return response.data
  },

  /**
   * Registrar un certificado del almacén de Windows
   */
  async registrarCertificadoWindows(
    dto: RegistrarCertificadoWindowsDTO
  ): Promise<{ success: boolean; data: CertificadoElectronico; message: string }> {
    const response = await api.post('/certificados/windows-store/registrar', dto)
    return response.data
  },

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Convertir archivo a Base64
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        // Quitar el prefijo "data:application/x-pkcs12;base64,"
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  },

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  },

  /**
   * Calcular días restantes hasta una fecha
   */
  diasHasta(fecha: string): number {
    const hoy = new Date()
    const objetivo = new Date(fecha)
    const diff = objetivo.getTime() - hoy.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  },

  /**
   * Obtener color de estado del certificado
   */
  getColorEstado(estado: EstadoCertificado): string {
    switch (estado) {
      case EstadoCertificado.ACTIVO:
        return 'bg-green-100 text-green-800'
      case EstadoCertificado.CADUCADO:
        return 'bg-red-100 text-red-800'
      case EstadoCertificado.REVOCADO:
        return 'bg-red-100 text-red-800'
      case EstadoCertificado.PENDIENTE:
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  },

  /**
   * Obtener etiqueta de tipo de certificado
   */
  getTipoLabel(tipo: TipoCertificado): string {
    switch (tipo) {
      case TipoCertificado.PERSONA_FISICA:
        return 'Persona Física'
      case TipoCertificado.PERSONA_JURIDICA:
        return 'Persona Jurídica'
      case TipoCertificado.REPRESENTANTE:
        return 'Representante'
      case TipoCertificado.SELLO_EMPRESA:
        return 'Sello de Empresa'
      default:
        return tipo
    }
  },

  /**
   * Obtener etiqueta de uso
   */
  getUsoLabel(uso: UsosCertificado): string {
    switch (uso) {
      case UsosCertificado.VERIFACTU:
        return 'VeriFactu'
      case UsosCertificado.TICKETBAI:
        return 'TicketBAI'
      case UsosCertificado.SII:
        return 'SII'
      case UsosCertificado.FIRMA_DOCUMENTOS:
        return 'Firma Documentos'
      case UsosCertificado.TODOS:
        return 'Todos'
      default:
        return uso
    }
  },

  /**
   * Obtener etiqueta de origen del certificado
   */
  getOrigenLabel(origen: OrigenCertificado): string {
    switch (origen) {
      case OrigenCertificado.ARCHIVO:
        return 'Archivo .p12/.pfx'
      case OrigenCertificado.WINDOWS_STORE:
        return 'Almacén de Windows'
      default:
        return origen
    }
  },

  /**
   * Obtener icono de origen del certificado
   */
  getOrigenIcon(origen: OrigenCertificado): string {
    switch (origen) {
      case OrigenCertificado.ARCHIVO:
        return 'FileKey'
      case OrigenCertificado.WINDOWS_STORE:
        return 'Monitor'
      default:
        return 'Key'
    }
  },
}

export default certificadosService
