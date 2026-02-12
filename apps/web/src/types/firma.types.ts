export interface IFirma {
  _id: string;
  documentoId: string;
  tipoDocumento: 'albaran' | 'factura' | 'pedido' | 'parteTrabajo' | 'presupuesto';
  tipo: 'manuscrita' | 'remota_manuscrita' | 'certificado_digital';
  imagenFirma?: string;
  certificadoInfo?: {
    titular: string;
    nif: string;
    emisor: string;
    serial: string;
    validoDesde: string;
    validoHasta: string;
  };
  hashDocumento: string;
  hashFirma: string;
  timestamp: string;
  ip: string;
  firmante: {
    nombre: string;
    email?: string;
    nif?: string;
    tipo: 'interno' | 'cliente' | 'proveedor';
  };
  createdAt: string;
}

export interface ISolicitudFirma {
  _id: string;
  documentoId: string;
  tipoDocumento: string;
  codigoDocumento: string;
  firmantes: Array<{
    nombre: string;
    email?: string;
    token: string;
    estado: 'pendiente' | 'firmado' | 'rechazado' | 'expirado';
    tipoFirmaPermitido: string[];
    firmadoEn?: string;
  }>;
  estado: 'pendiente' | 'parcial' | 'completa' | 'expirada' | 'cancelada';
  fechaExpiracion: string;
  mensajePersonalizado?: string;
  createdAt: string;
}

export interface ISolicitudFirmaLink {
  nombre: string;
  email?: string;
  link: string;
  estado: string;
}
