/**
 * Tipos para FacturaE según especificación 3.2.2
 * @see http://www.facturae.gob.es/formato/Paginas/version-3-2-2.aspx
 */

// ============================================
// ENUMS
// ============================================

/**
 * Modalidad del fichero
 * I: Individual (una factura)
 * L: Lote (varias facturas)
 */
export enum ModalidadFactura {
  INDIVIDUAL = 'I',
  LOTE = 'L',
}

/**
 * Tipo de emisor de la factura
 * EM: Emisor y expedidor (el que vende)
 * RE: Receptor (autofactura)
 * TE: Tercero (factura emitida por tercero)
 */
export enum TipoEmisor {
  EMISOR = 'EM',
  RECEPTOR = 'RE',
  TERCERO = 'TE',
}

/**
 * Tipo de documento de factura
 * FC: Factura completa
 * FA: Factura simplificada (anterior ticket)
 * AF: Autofactura
 */
export enum TipoDocumentoFactura {
  FACTURA_COMPLETA = 'FC',
  FACTURA_SIMPLIFICADA = 'FA',
  AUTOFACTURA = 'AF',
}

/**
 * Clase de factura
 * OO: Original
 * OR: Original rectificativa
 * OC: Original recapitulativa
 * CO: Copia original
 * CR: Copia rectificativa
 * CC: Copia recapitulativa
 */
export enum ClaseFactura {
  ORIGINAL = 'OO',
  ORIGINAL_RECTIFICATIVA = 'OR',
  ORIGINAL_RECAPITULATIVA = 'OC',
  COPIA_ORIGINAL = 'CO',
  COPIA_RECTIFICATIVA = 'CR',
  COPIA_RECAPITULATIVA = 'CC',
}

/**
 * Método de corrección para facturas rectificativas
 * 01: Rectificación íntegra
 * 02: Rectificación por diferencias
 * 03: Rectificación por descuento por volumen
 * 04: Autorizadas por AEAT
 */
export enum MetodoCorreccion {
  RECTIFICACION_INTEGRA = '01',
  RECTIFICACION_DIFERENCIAS = '02',
  RECTIFICACION_DESCUENTO_VOLUMEN = '03',
  AUTORIZADA_AEAT = '04',
}

/**
 * Tipo de persona (física o jurídica)
 */
export enum TipoPersona {
  FISICA = 'F',
  JURIDICA = 'J',
}

/**
 * Tipo de residencia
 * R: Residente en España
 * U: Residente en la UE
 * E: Extranjero (no UE)
 */
export enum TipoResidencia {
  RESIDENTE = 'R',
  UNION_EUROPEA = 'U',
  EXTRANJERO = 'E',
}

/**
 * Códigos de tipo de impuesto según FacturaE
 */
export enum CodigoImpuesto {
  IVA = '01',
  IPSI = '02',  // Impuesto sobre la Producción, los Servicios y la Importación (Ceuta y Melilla)
  IGIC = '03',  // Impuesto General Indirecto Canario
}

/**
 * Tipos de método de pago según FacturaE
 */
export enum MetodoPagoFacturaE {
  EFECTIVO = '01',
  CHEQUE = '02',
  RECIBO_DOMICILIADO = '03',  // Domiciliación bancaria
  RECIBO_NO_DOMICILIADO = '04',
  TRANSFERENCIA = '04',
  LETRA_ACEPTADA = '05',
  CREDITO_DOCUMENTARIO = '06',
  CONTRATO_ADJUDICACION = '07',
  LETRA_DE_CAMBIO = '08',
  PAGARE_A_LA_ORDEN = '09',
  PAGARE_NO_A_LA_ORDEN = '10',
  TARJETA_CREDITO = '11',
  TARJETA_DEBITO = '12',
  COMPENSACION = '13',
  APLAZAMIENTO = '14',
  RETENCION = '15',
  OTRO = '19',
}

/**
 * Causas de exención de IVA
 */
export enum CausaExencion {
  // Artículo 20
  E1 = 'E1',  // Exento por artículo 20
  E2 = 'E2',  // Exento por artículo 21
  E3 = 'E3',  // Exento por artículo 22
  E4 = 'E4',  // Exento por artículo 23 y 24
  E5 = 'E5',  // Exento por artículo 25
  E6 = 'E6',  // Exento por otros
}

/**
 * Unidades de medida estándar
 */
export enum UnidadMedida {
  UNIDADES = '01',
  HORAS = '02',
  KILOGRAMOS = '03',
  LITROS = '04',
  OTROS = '05',
}

// ============================================
// INTERFACES AUXILIARES
// ============================================

/**
 * Dirección estructurada
 */
export interface DireccionFacturaE {
  Address: string;           // Dirección (calle, número, etc.)
  PostCode: string;          // Código postal
  Town: string;              // Población
  Province: string;          // Provincia
  CountryCode: string;       // Código país ISO 3166-1 alpha-3 (ESP, FRA, etc.)
}

/**
 * Datos de contacto
 */
export interface ContactoFacturaE {
  Telephone?: string;
  TeleFax?: string;
  WebAddress?: string;
  ElectronicMail?: string;
  ContactPersons?: string;
  CnoCnae?: string;           // Código CNAE
  INETownCode?: string;       // Código INE del municipio
  AdditionalContactDetails?: string;
}

/**
 * Identificación fiscal de una entidad
 */
export interface TaxIdentificationType {
  PersonTypeCode: TipoPersona;
  ResidenceTypeCode: TipoResidencia;
  TaxIdentificationNumber: string;  // NIF/CIF/NIE
}

/**
 * Persona física
 */
export interface IndividualType {
  Name: string;               // Nombre
  FirstSurname: string;       // Primer apellido
  SecondSurname?: string;     // Segundo apellido
}

/**
 * Persona jurídica (empresa)
 */
export interface LegalEntityType {
  CorporateName: string;      // Razón social
  TradeName?: string;         // Nombre comercial
  RegistrationData?: {
    Book?: string;
    RegisterOfCompaniesLocation?: string;
    Sheet?: string;
    Folio?: string;
    Section?: string;
    Volume?: string;
    AdditionalRegistrationData?: string;
  };
  AddressInSpain?: DireccionFacturaE;
  OverseasAddress?: DireccionFacturaE & { PostCodeAndTown?: string };
  ContactDetails?: ContactoFacturaE;
}

/**
 * Parte del negocio (vendedor o comprador)
 */
export interface BusinessType {
  TaxIdentification: TaxIdentificationType;
  PartyIdentification?: string;  // Código identificador adicional
  AdministrativeCentres?: AdministrativeCentreType[];
  LegalEntity?: LegalEntityType;
  Individual?: IndividualType;
}

/**
 * Centro administrativo (para facturación a administraciones públicas)
 */
export interface AdministrativeCentreType {
  CentreCode: string;         // Código DIR3
  RoleTypeCode: '01' | '02' | '03' | '04';  // 01=Órgano Gestor, 02=Unidad Tramitadora, 03=Oficina Contable, 04=Punto de entrega
  Name?: string;
  FirstSurname?: string;
  SecondSurname?: string;
  AddressInSpain?: DireccionFacturaE;
  OverseasAddress?: DireccionFacturaE & { PostCodeAndTown?: string };
  ContactDetails?: ContactoFacturaE;
  PhysicalGLN?: string;
  LogicalOperationalPoint?: string;
  CentreDescription?: string;
}

/**
 * Impuesto repercutido (IVA cobrado)
 */
export interface TaxOutputType {
  TaxTypeCode: CodigoImpuesto;
  TaxRate: number;            // Tipo impositivo (21, 10, 4, 0)
  TaxableBase: {
    TotalAmount: number;
    EquivalentInEuros?: number;
  };
  TaxAmount?: {
    TotalAmount: number;
    EquivalentInEuros?: number;
  };
  SpecialTaxableBase?: {
    TotalAmount: number;
    EquivalentInEuros?: number;
  };
  SpecialTaxAmount?: {
    TotalAmount: number;
    EquivalentInEuros?: number;
  };
  EquivalenceSurcharge?: number;        // Recargo de equivalencia
  EquivalenceSurchargeAmount?: {
    TotalAmount: number;
    EquivalentInEuros?: number;
  };
}

/**
 * Impuesto retenido (IRPF)
 */
export interface TaxWithheldType {
  TaxTypeCode: '04' | '05' | '06';  // 04=IRPF, 05=Otra, 06=Retención sobre alquileres
  TaxRate: number;
  TaxableBase: {
    TotalAmount: number;
    EquivalentInEuros?: number;
  };
  TaxAmount: {
    TotalAmount: number;
    EquivalentInEuros?: number;
  };
}

/**
 * Descuento general
 */
export interface DiscountType {
  DiscountReason: string;
  DiscountRate?: number;
  DiscountAmount: number;
}

/**
 * Cargo general
 */
export interface ChargeType {
  ChargeReason: string;
  ChargeRate?: number;
  ChargeAmount: number;
}

/**
 * Línea de factura
 */
export interface InvoiceLineType {
  IssuerContractReference?: string;
  IssuerContractDate?: string;
  IssuerTransactionReference?: string;
  IssuerTransactionDate?: string;
  ReceiverContractReference?: string;
  ReceiverContractDate?: string;
  ReceiverTransactionReference?: string;
  ReceiverTransactionDate?: string;
  FileReference?: string;
  FileDate?: string;
  SequenceNumber?: string;
  DeliveryNotesReferences?: Array<{
    DeliveryNoteNumber: string;
    DeliveryNoteDate?: string;
  }>;
  ItemDescription: string;
  Quantity: number;
  UnitOfMeasure?: UnidadMedida | string;
  UnitPriceWithoutTax: number;
  TotalCost: number;
  DiscountsAndRebates?: Array<{
    DiscountReason: string;
    DiscountRate?: number;
    DiscountAmount: number;
  }>;
  Charges?: Array<{
    ChargeReason: string;
    ChargeRate?: number;
    ChargeAmount: number;
  }>;
  GrossAmount: number;
  TaxesWithheld?: TaxWithheldType[];
  TaxesOutputs: TaxOutputType[];
  LineItemPeriod?: {
    StartDate: string;
    EndDate: string;
  };
  TransactionDate?: string;
  AdditionalLineItemInformation?: string;
  SpecialTaxableEvent?: {
    SpecialTaxableEventCode: '01' | '02' | '03';  // 01=Operación no sujeta, 02=Operación no sujeta por reglas localización, 03=Operación sujeta y exenta
    SpecialTaxableEventReason?: string;
  };
  ArticleCode?: string;
}

/**
 * Datos de pago
 */
export interface PaymentDetailsType {
  Installment: Array<{
    InstallmentDueDate: string;     // Fecha vencimiento YYYY-MM-DD
    InstallmentAmount: number;
    PaymentMeans: MetodoPagoFacturaE;
    AccountToBeCredited?: {
      IBAN?: string;
      BankCode?: string;
      BranchCode?: string;
      AccountNumber?: string;
      BIC?: string;
    };
    AccountToBeDebited?: {
      IBAN?: string;
      BankCode?: string;
      BranchCode?: string;
      AccountNumber?: string;
      BIC?: string;
    };
    PaymentReconciliationReference?: string;
    DebitReconciliationReference?: string;
    CollectionAdditionalInformation?: string;
    RegulatoryReportingData?: string;
  }>;
}

/**
 * Literales legales
 */
export interface LegalLiteralsType {
  LegalReference: string[];
}

/**
 * Datos adicionales
 */
export interface AdditionalDataType {
  RelatedInvoice?: string;
  RelatedDocuments?: Array<{
    DocumentNumber: string;
    DocumentType?: string;
    DocumentDate?: string;
  }>;
  InvoiceAdditionalInformation?: string;
  Extensions?: any;
}

/**
 * Datos de factura rectificativa
 */
export interface CorrectiveType {
  InvoiceNumber: string;
  InvoiceSeriesCode?: string;
  ReasonCode: '01' | '02' | '03' | '04' | '80' | '81' | '82' | '83' | '84' | '85';
  ReasonDescription: string;
  TaxPeriod: {
    StartDate: string;
    EndDate: string;
  };
  CorrectionMethod: MetodoCorreccion;
  CorrectionMethodDescription?: string;
  AdditionalReasonDescription?: string;
}

// ============================================
// INTERFACES PRINCIPALES
// ============================================

/**
 * Cabecera del fichero FacturaE
 */
export interface FileHeaderType {
  SchemaVersion: '3.2.2';
  Modality: ModalidadFactura;
  InvoiceIssuerType: TipoEmisor;
  ThirdParty?: BusinessType;
  Batch?: {
    BatchIdentifier: string;
    InvoicesCount: number;
    TotalInvoicesAmount: {
      TotalAmount: number;
      EquivalentInEuros?: number;
    };
    TotalOutstandingAmount: {
      TotalAmount: number;
      EquivalentInEuros?: number;
    };
    TotalExecutableAmount: {
      TotalAmount: number;
      EquivalentInEuros?: number;
    };
    InvoiceCurrencyCode: string;
  };
  FactoringAssignmentData?: {
    Assignee: BusinessType;
    PaymentDetails: PaymentDetailsType;
    FactoringAssignmentClauses?: string;
  };
}

/**
 * Partes del negocio (vendedor y comprador)
 */
export interface PartiesType {
  SellerParty: BusinessType;
  BuyerParty: BusinessType;
}

/**
 * Datos de emisión de la factura
 */
export interface InvoiceIssueDataType {
  IssueDate: string;                    // YYYY-MM-DD
  OperationDate?: string;               // YYYY-MM-DD
  PlaceOfIssue?: {
    PostCode: string;
    PlaceOfIssueDescription?: string;
  };
  InvoicingPeriod?: {
    StartDate: string;
    EndDate: string;
  };
  InvoiceCurrencyCode: string;          // ISO 4217 (EUR, USD, etc.)
  ExchangeRateDetails?: {
    ExchangeRate: number;
    ExchangeRateDate: string;
  };
  TaxCurrencyCode?: string;
  LanguageName: string;                 // ISO 639 (es, en, etc.)
}

/**
 * Totales de la factura
 */
export interface InvoiceTotalsType {
  TotalGrossAmount: number;
  GeneralDiscounts?: DiscountType[];
  GeneralSurcharges?: ChargeType[];
  TotalGeneralDiscounts?: number;
  TotalGeneralSurcharges?: number;
  TotalGrossAmountBeforeTaxes: number;
  TotalTaxOutputs: number;
  TotalTaxesWithheld: number;
  InvoiceTotal: number;
  Subsidies?: Array<{
    SubsidyDescription: string;
    SubsidyRate?: number;
    SubsidyAmount: number;
  }>;
  PaymentsOnAccount?: Array<{
    PaymentOnAccountDate: string;
    PaymentOnAccountAmount: number;
  }>;
  ReimbursableExpenses?: Array<{
    ReimbursableExpensesSellerParty?: BusinessType;
    ReimbursableExpensesBuyerParty?: BusinessType;
    IssueDate?: string;
    InvoiceNumber?: string;
    InvoiceSeriesCode?: string;
    ReimbursableExpensesAmount: number;
  }>;
  TotalFinancialExpenses?: number;
  TotalOutstandingAmount: number;
  TotalPaymentsOnAccount?: number;
  AmountsWithheld?: {
    WithholdingReason: string;
    WithholdingRate?: number;
    WithholdingAmount: number;
  };
  TotalExecutableAmount: number;
  TotalReimbursableExpenses?: number;
}

/**
 * Cabecera de factura individual
 */
export interface InvoiceHeaderType {
  InvoiceNumber: string;
  InvoiceSeriesCode?: string;
  InvoiceDocumentType: TipoDocumentoFactura;
  InvoiceClass: ClaseFactura;
  Corrective?: CorrectiveType;
}

/**
 * Factura individual dentro del documento
 */
export interface InvoiceType {
  InvoiceHeader: InvoiceHeaderType;
  InvoiceIssueData: InvoiceIssueDataType;
  TaxesOutputs: {
    Tax: TaxOutputType[];
  };
  TaxesWithheld?: {
    Tax: TaxWithheldType[];
  };
  InvoiceTotals: InvoiceTotalsType;
  Items: {
    InvoiceLine: InvoiceLineType[];
  };
  PaymentDetails?: PaymentDetailsType;
  LegalLiterals?: LegalLiteralsType;
  AdditionalData?: AdditionalDataType;
}

/**
 * Documento FacturaE completo
 */
export interface FacturaEDocument {
  FileHeader: FileHeaderType;
  Parties: PartiesType;
  Invoices: {
    Invoice: InvoiceType[];
  };
}

// ============================================
// TIPOS PARA INTEGRACIÓN CON FACE
// ============================================

/**
 * Estados posibles en FACE
 */
export enum EstadoFACE {
  REGISTRADA_REC = '1200',          // Registrada en Registro Electrónico Contable
  REGISTRADA_RCF = '1300',          // Registrada en Registro Contable de Facturas
  CONTABILIZADA = '2400',           // Contabilizada
  OBLIGACION_PAGO = '2500',         // Reconocida obligación de pago
  PAGADA = '2600',                  // Pagada
  RECHAZADA = '3100',               // Rechazada
  ANULADA = '4100',                 // Anulada
  PROPUESTA_PAGO = '4200',          // Propuesta de pago
  PAGO_REALIZADO = '4300',          // Pago realizado
}

/**
 * Respuesta del servicio FACE
 */
export interface FACEResponse {
  resultado: {
    codigo: string;
    descripcion: string;
    codigoSeguimiento?: string;
  };
  factura?: {
    numeroRegistro: string;
    organoGestor: string;
    unidadTramitadora: string;
    oficinaContable: string;
    identificadorEmisor: string;
    numeroFactura: string;
    serieFactura?: string;
    fechaRecepcion: string;
  };
}

/**
 * Estado de una factura en FACE
 */
export interface FACEEstadoFactura {
  resultado: {
    codigo: string;
    descripcion: string;
  };
  factura?: {
    numeroRegistro: string;
    tramitacion: {
      codigo: EstadoFACE;
      descripcion: string;
      motivo?: string;
    };
    anulacion?: {
      codigo: string;
      descripcion: string;
      motivo?: string;
    };
  };
}

/**
 * Solicitud de anulación en FACE
 */
export interface FACESolicitudAnulacion {
  numeroRegistro: string;
  motivo: string;
}

// ============================================
// TIPOS AUXILIARES PARA GENERACIÓN
// ============================================

/**
 * Opciones para generar FacturaE
 */
export interface GenerarFacturaEOptions {
  facturaId: string;
  firmar?: boolean;
  certificadoId?: string;
  incluirPDF?: boolean;
}

/**
 * Resultado de la generación de FacturaE
 */
export interface GenerarFacturaEResult {
  exito: boolean;
  xml?: string;
  nombreArchivo?: string;
  firmado?: boolean;
  errores?: string[];
  advertencias?: string[];
}

/**
 * Opciones para validar FacturaE
 */
export interface ValidarFacturaEOptions {
  xml: string;
  validarContraXSD?: boolean;
  validarFirma?: boolean;
}

/**
 * Resultado de la validación
 */
export interface ValidarFacturaEResult {
  valido: boolean;
  erroresEstructura?: string[];
  erroresFirma?: string[];
  advertencias?: string[];
}

/**
 * Mapeo de tipos de IVA internos a códigos FacturaE
 */
export const MAPA_TIPOS_IVA: Record<string, { codigo: CodigoImpuesto; tipo: number }> = {
  'IVA_GENERAL': { codigo: CodigoImpuesto.IVA, tipo: 21 },
  'IVA_REDUCIDO': { codigo: CodigoImpuesto.IVA, tipo: 10 },
  'IVA_SUPERREDUCIDO': { codigo: CodigoImpuesto.IVA, tipo: 4 },
  'IVA_EXENTO': { codigo: CodigoImpuesto.IVA, tipo: 0 },
  'IGIC_GENERAL': { codigo: CodigoImpuesto.IGIC, tipo: 7 },
  'IGIC_REDUCIDO': { codigo: CodigoImpuesto.IGIC, tipo: 3 },
  'IPSI_GENERAL': { codigo: CodigoImpuesto.IPSI, tipo: 4 },
};

/**
 * Códigos de país ISO 3166-1 alpha-3 comunes
 */
export const CODIGOS_PAIS = {
  ESPANA: 'ESP',
  FRANCIA: 'FRA',
  ALEMANIA: 'DEU',
  ITALIA: 'ITA',
  PORTUGAL: 'PRT',
  REINO_UNIDO: 'GBR',
  ESTADOS_UNIDOS: 'USA',
  ANDORRA: 'AND',
  GIBRALTAR: 'GIB',
  MARRUECOS: 'MAR',
} as const;
