/**
 * DTOs para el módulo de Impresoras
 */

export interface CreateImpresoraDTO {
  nombre: string;
  codigo?: string;
  tipo: 'ticket' | 'cocina' | 'etiquetas' | 'factura' | 'comanda';
  conexion: {
    tipo: 'usb' | 'red' | 'bluetooth' | 'serial';
    ip?: string;
    puerto?: number;
    mac?: string;
    puertoSerial?: string;
    nombreWindows?: string;
    nombreCups?: string;
  };
  configuracion?: {
    anchoCaracteres?: number;
    cortarPapel?: boolean;
    abrirCajon?: boolean;
    imprimirLogo?: boolean;
    logoUrl?: string;
    tamanoFuente?: 'pequeno' | 'normal' | 'grande';
    copias?: number;
    margenSuperior?: number;
    margenInferior?: number;
  };
  almacenId?: string;
  zonasPreparacionIds?: string[];
  puntoVentaIds?: string[];
  predeterminada?: boolean;
  activo?: boolean;
}

export interface UpdateImpresoraDTO extends Partial<CreateImpresoraDTO> {}

export interface SearchImpresorasDTO {
  q?: string;
  tipo?: string;
  activo?: boolean;
  almacenId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
