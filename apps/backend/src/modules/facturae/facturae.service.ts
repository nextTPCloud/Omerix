import mongoose from 'mongoose';
import { IDatabaseConfig } from '../../services/database-manager.service';
import { getFacturaModel, getClienteModel, getEmpresaModel } from '../../utils/dynamic-models.helper';
import {
  FacturaEDocument,
  FileHeaderType,
  PartiesType,
  InvoiceType,
  BusinessType,
  AdministrativeCentreType,
  TaxOutputType,
  TaxWithheldType,
  InvoiceLineType,
  PaymentDetailsType,
  InvoiceTotalsType,
  CorrectiveType,
  ModalidadFactura,
  TipoEmisor,
  TipoDocumentoFactura,
  ClaseFactura,
  TipoPersona,
  TipoResidencia,
  CodigoImpuesto,
  MetodoPagoFacturaE,
  MetodoCorreccion,
  GenerarFacturaEOptions,
  GenerarFacturaEResult,
  ValidarFacturaEOptions,
  ValidarFacturaEResult,
  CODIGOS_PAIS,
} from './facturae.types';
import { IFactura, TipoFactura, MetodoPago, MotivoRectificacion } from '../facturas/Factura';
import { ICliente, TipoCliente, IFacturacionElectronica, TipoEntidadPublica } from '../clientes/Cliente';

/**
 * Servicio para generar facturas en formato FacturaE 3.2.2
 * Compatible con FACE (Punto General de Entrada de Facturas Electrónicas)
 */
class FacturaEService {
  // Namespace para FacturaE
  private readonly NAMESPACE = 'http://www.facturae.gob.es/formato/Versiones/Facturaev3_2_2.xml';
  private readonly SCHEMA_VERSION = '3.2.2';

  /**
   * Genera un documento FacturaE a partir de una factura
   */
  async generarFacturaE(
    options: GenerarFacturaEOptions,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<GenerarFacturaEResult> {
    try {
      const Factura = getFacturaModel(dbConfig);
      const Cliente = getClienteModel(dbConfig);
      const Empresa = getEmpresaModel(dbConfig);

      // Obtener factura con datos completos
      const factura = await Factura.findById(options.facturaId).lean();
      if (!factura) {
        return { exito: false, errores: ['Factura no encontrada'] };
      }

      // Obtener cliente
      const cliente = await Cliente.findById(factura.clienteId).lean();
      if (!cliente) {
        return { exito: false, errores: ['Cliente no encontrado'] };
      }

      // Obtener empresa
      const empresa = await Empresa.findOne().lean();
      if (!empresa) {
        return { exito: false, errores: ['Datos de empresa no encontrados'] };
      }

      // Validaciones previas
      const erroresValidacion = this.validarDatosFactura(factura, cliente, empresa);
      if (erroresValidacion.length > 0) {
        return { exito: false, errores: erroresValidacion };
      }

      // Construir documento FacturaE
      const facturaE = this.construirDocumentoFacturaE(factura, cliente, empresa);

      // Convertir a XML
      const xml = this.facturaEToXml(facturaE);

      // Generar nombre de archivo
      const nombreArchivo = this.generarNombreArchivo(factura);

      return {
        exito: true,
        xml,
        nombreArchivo,
        firmado: false,
        advertencias: [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { exito: false, errores: [`Error generando FacturaE: ${message}`] };
    }
  }

  /**
   * Genera un lote de facturas FacturaE
   */
  async generarLoteFacturaE(
    facturaIds: string[],
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<GenerarFacturaEResult> {
    try {
      const Factura = getFacturaModel(dbConfig);
      const Cliente = getClienteModel(dbConfig);
      const Empresa = getEmpresaModel(dbConfig);

      // Obtener empresa
      const empresa = await Empresa.findOne().lean();
      if (!empresa) {
        return { exito: false, errores: ['Datos de empresa no encontrados'] };
      }

      const facturas: IFactura[] = [];
      const clientesMap = new Map<string, ICliente>();
      const advertencias: string[] = [];

      // Obtener todas las facturas y sus clientes
      for (const facturaId of facturaIds) {
        const factura = await Factura.findById(facturaId).lean();
        if (!factura) {
          advertencias.push(`Factura ${facturaId} no encontrada, se omite del lote`);
          continue;
        }

        if (!clientesMap.has(factura.clienteId.toString())) {
          const cliente = await Cliente.findById(factura.clienteId).lean();
          if (!cliente) {
            advertencias.push(`Cliente de factura ${factura.codigo} no encontrado, se omite del lote`);
            continue;
          }
          clientesMap.set(factura.clienteId.toString(), cliente);
        }

        facturas.push(factura);
      }

      if (facturas.length === 0) {
        return { exito: false, errores: ['No hay facturas válidas para generar el lote'] };
      }

      // Calcular totales del lote
      const totalImporte = facturas.reduce((sum, f) => sum + (f.totales?.totalFactura || 0), 0);
      const totalPendiente = facturas.reduce((sum, f) => sum + (f.importePendiente || 0), 0);

      // Construir documento de lote
      const batchId = `LOTE-${Date.now()}`;
      const invoices: InvoiceType[] = [];

      for (const factura of facturas) {
        const cliente = clientesMap.get(factura.clienteId.toString())!;
        const invoice = this.construirInvoice(factura, cliente, empresa);
        invoices.push(invoice);
      }

      const facturaELote: FacturaEDocument = {
        FileHeader: {
          SchemaVersion: this.SCHEMA_VERSION,
          Modality: ModalidadFactura.LOTE,
          InvoiceIssuerType: TipoEmisor.EMISOR,
          Batch: {
            BatchIdentifier: batchId,
            InvoicesCount: facturas.length,
            TotalInvoicesAmount: { TotalAmount: totalImporte },
            TotalOutstandingAmount: { TotalAmount: totalPendiente },
            TotalExecutableAmount: { TotalAmount: totalPendiente },
            InvoiceCurrencyCode: 'EUR',
          },
        },
        Parties: this.construirParties(facturas[0], clientesMap.get(facturas[0].clienteId.toString())!, empresa),
        Invoices: { Invoice: invoices },
      };

      const xml = this.facturaEToXml(facturaELote);
      const nombreArchivo = `FacturaE_Lote_${batchId}.xsig`;

      return {
        exito: true,
        xml,
        nombreArchivo,
        firmado: false,
        advertencias,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { exito: false, errores: [`Error generando lote FacturaE: ${message}`] };
    }
  }

  /**
   * Valida un documento FacturaE
   */
  async validarFacturaE(options: ValidarFacturaEOptions): Promise<ValidarFacturaEResult> {
    const erroresEstructura: string[] = [];
    const advertencias: string[] = [];

    try {
      // Validación básica de estructura XML
      if (!options.xml || options.xml.trim() === '') {
        erroresEstructura.push('El XML está vacío');
        return { valido: false, erroresEstructura };
      }

      // Verificar elementos obligatorios
      if (!options.xml.includes('FileHeader')) {
        erroresEstructura.push('Falta elemento FileHeader');
      }
      if (!options.xml.includes('Parties')) {
        erroresEstructura.push('Falta elemento Parties');
      }
      if (!options.xml.includes('Invoices')) {
        erroresEstructura.push('Falta elemento Invoices');
      }
      if (!options.xml.includes('SchemaVersion')) {
        erroresEstructura.push('Falta SchemaVersion');
      }

      // Verificar versión del esquema
      if (!options.xml.includes('3.2.2')) {
        advertencias.push('La versión del esquema no es 3.2.2');
      }

      return {
        valido: erroresEstructura.length === 0,
        erroresEstructura,
        advertencias,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      erroresEstructura.push(`Error validando XML: ${message}`);
      return { valido: false, erroresEstructura };
    }
  }

  // ============================================
  // MÉTODOS PRIVADOS - CONSTRUCCIÓN
  // ============================================

  /**
   * Construye el documento FacturaE completo
   */
  private construirDocumentoFacturaE(factura: IFactura, cliente: ICliente, empresa: any): FacturaEDocument {
    return {
      FileHeader: this.construirFileHeader(factura),
      Parties: this.construirParties(factura, cliente, empresa),
      Invoices: {
        Invoice: [this.construirInvoice(factura, cliente, empresa)],
      },
    };
  }

  /**
   * Construye la cabecera del fichero
   */
  private construirFileHeader(factura: IFactura): FileHeaderType {
    return {
      SchemaVersion: this.SCHEMA_VERSION,
      Modality: ModalidadFactura.INDIVIDUAL,
      InvoiceIssuerType: TipoEmisor.EMISOR,
    };
  }

  /**
   * Construye las partes (vendedor y comprador)
   */
  private construirParties(factura: IFactura, cliente: ICliente, empresa: any): PartiesType {
    return {
      SellerParty: this.construirBusinessType(empresa, true),
      BuyerParty: this.construirBusinessType(cliente, false, cliente.facturacionElectronica),
    };
  }

  /**
   * Construye el tipo de negocio (persona física o jurídica)
   */
  private construirBusinessType(
    entidad: any,
    esEmpresa: boolean,
    facturacionElectronica?: IFacturacionElectronica
  ): BusinessType {
    const esPersonaFisica = !esEmpresa && entidad.tipoCliente === TipoCliente.PARTICULAR;
    const nif = esEmpresa ? entidad.nif : entidad.nif;
    const tipoResidencia = this.determinarTipoResidencia(nif);

    const business: BusinessType = {
      TaxIdentification: {
        PersonTypeCode: esPersonaFisica ? TipoPersona.FISICA : TipoPersona.JURIDICA,
        ResidenceTypeCode: tipoResidencia,
        TaxIdentificationNumber: nif,
      },
    };

    // Añadir centros administrativos si hay datos DIR3
    if (facturacionElectronica?.activa) {
      business.AdministrativeCentres = this.construirCentrosAdministrativos(facturacionElectronica);
    }

    if (esPersonaFisica) {
      // Dividir nombre en partes para persona física
      const partes = (entidad.nombre || '').split(' ');
      business.Individual = {
        Name: partes[0] || '',
        FirstSurname: partes[1] || '',
        SecondSurname: partes.slice(2).join(' ') || undefined,
      };
    } else {
      const direccion = esEmpresa
        ? entidad.direccion
        : (entidad.direcciones?.find((d: any) => d.tipo === 'fiscal') || entidad.direccion);

      business.LegalEntity = {
        CorporateName: entidad.nombre || entidad.razonSocial || '',
        TradeName: entidad.nombreComercial,
        AddressInSpain: direccion ? {
          Address: this.construirDireccionCompleta(direccion),
          PostCode: direccion.codigoPostal || '',
          Town: direccion.ciudad || direccion.localidad || '',
          Province: direccion.provincia || '',
          CountryCode: CODIGOS_PAIS.ESPANA,
        } : undefined,
        ContactDetails: {
          Telephone: entidad.telefono,
          ElectronicMail: entidad.email,
          WebAddress: entidad.web,
        },
      };
    }

    return business;
  }

  /**
   * Construye los centros administrativos DIR3
   */
  private construirCentrosAdministrativos(facElec: IFacturacionElectronica): AdministrativeCentreType[] {
    const centros: AdministrativeCentreType[] = [];

    // Órgano Gestor (01)
    centros.push({
      CentreCode: facElec.codigoOrganoGestor,
      RoleTypeCode: '01',
      Name: facElec.nombreOrganoGestor,
    });

    // Unidad Tramitadora (02)
    centros.push({
      CentreCode: facElec.codigoUnidadTramitadora,
      RoleTypeCode: '02',
      Name: facElec.nombreUnidadTramitadora,
    });

    // Oficina Contable (03)
    centros.push({
      CentreCode: facElec.codigoOficinaContable,
      RoleTypeCode: '03',
      Name: facElec.nombreOficinaContable,
    });

    // Punto de entrega (04) - Opcional
    if (facElec.codigoPuntoEntrega) {
      centros.push({
        CentreCode: facElec.codigoPuntoEntrega,
        RoleTypeCode: '04',
      });
    }

    return centros;
  }

  /**
   * Construye una factura individual
   */
  private construirInvoice(factura: IFactura, cliente: ICliente, empresa: any): InvoiceType {
    const invoice: InvoiceType = {
      InvoiceHeader: this.construirInvoiceHeader(factura),
      InvoiceIssueData: {
        IssueDate: this.formatDate(factura.fecha),
        OperationDate: factura.fechaOperacion ? this.formatDate(factura.fechaOperacion) : undefined,
        InvoicingPeriod: factura.periodoFacturacion ? {
          StartDate: this.formatDate(factura.periodoFacturacion.desde),
          EndDate: this.formatDate(factura.periodoFacturacion.hasta),
        } : undefined,
        InvoiceCurrencyCode: 'EUR',
        LanguageName: 'es',
      },
      TaxesOutputs: {
        Tax: this.construirTaxesOutputs(factura),
      },
      InvoiceTotals: this.construirInvoiceTotals(factura),
      Items: {
        InvoiceLine: this.construirInvoiceLines(factura),
      },
    };

    // Añadir retenciones si las hay
    if (factura.retencionIRPF && factura.retencionIRPF > 0) {
      invoice.TaxesWithheld = {
        Tax: this.construirTaxesWithheld(factura),
      };
    }

    // Añadir detalles de pago si hay vencimientos
    if (factura.vencimientos && factura.vencimientos.length > 0) {
      invoice.PaymentDetails = this.construirPaymentDetails(factura);
    }

    // Añadir literales legales
    if (factura.observaciones || factura.pieFactura) {
      invoice.LegalLiterals = {
        LegalReference: [factura.observaciones, factura.pieFactura].filter(Boolean) as string[],
      };
    }

    return invoice;
  }

  /**
   * Construye la cabecera de la factura
   */
  private construirInvoiceHeader(factura: IFactura): InvoiceType['InvoiceHeader'] {
    const header: InvoiceType['InvoiceHeader'] = {
      InvoiceNumber: factura.numero.toString(),
      InvoiceSeriesCode: factura.serie,
      InvoiceDocumentType: this.mapTipoDocumento(factura.tipo),
      InvoiceClass: this.mapClaseFactura(factura),
    };

    // Añadir datos de rectificativa si aplica
    if (factura.esRectificativa && factura.facturaRectificadaCodigo) {
      header.Corrective = this.construirCorrective(factura);
    }

    return header;
  }

  /**
   * Construye datos de factura rectificativa
   */
  private construirCorrective(factura: IFactura): CorrectiveType {
    const [serie, numero] = (factura.facturaRectificadaCodigo || '').split('-');

    return {
      InvoiceNumber: numero || factura.facturaRectificadaCodigo || '',
      InvoiceSeriesCode: serie,
      ReasonCode: this.mapMotivoRectificacion(factura.motivoRectificacion),
      ReasonDescription: factura.descripcionRectificacion || 'Rectificación de factura',
      TaxPeriod: {
        StartDate: this.formatDate(factura.fecha),
        EndDate: this.formatDate(factura.fecha),
      },
      CorrectionMethod: MetodoCorreccion.RECTIFICACION_DIFERENCIAS,
    };
  }

  /**
   * Construye los impuestos repercutidos (IVA)
   */
  private construirTaxesOutputs(factura: IFactura): TaxOutputType[] {
    const taxes: TaxOutputType[] = [];

    if (factura.totales?.desgloseIva) {
      for (const desglose of factura.totales.desgloseIva) {
        const tax: TaxOutputType = {
          TaxTypeCode: CodigoImpuesto.IVA,
          TaxRate: desglose.tipo,
          TaxableBase: { TotalAmount: this.redondear(desglose.base) },
          TaxAmount: { TotalAmount: this.redondear(desglose.cuota) },
        };

        // Añadir recargo de equivalencia si existe
        if (desglose.recargo && desglose.cuotaRecargo) {
          tax.EquivalenceSurcharge = desglose.recargo;
          tax.EquivalenceSurchargeAmount = { TotalAmount: this.redondear(desglose.cuotaRecargo) };
        }

        taxes.push(tax);
      }
    }

    return taxes;
  }

  /**
   * Construye las retenciones (IRPF)
   */
  private construirTaxesWithheld(factura: IFactura): TaxWithheldType[] {
    if (!factura.retencionIRPF || factura.retencionIRPF <= 0) return [];

    const baseRetencion = factura.totales?.subtotalNeto || 0;
    const cuotaRetencion = factura.importeRetencion || (baseRetencion * factura.retencionIRPF / 100);

    return [{
      TaxTypeCode: '04',  // IRPF
      TaxRate: factura.retencionIRPF,
      TaxableBase: { TotalAmount: this.redondear(baseRetencion) },
      TaxAmount: { TotalAmount: this.redondear(cuotaRetencion) },
    }];
  }

  /**
   * Construye los totales de la factura
   */
  private construirInvoiceTotals(factura: IFactura): InvoiceTotalsType {
    const totales = factura.totales;

    return {
      TotalGrossAmount: this.redondear(totales?.subtotalBruto || 0),
      GeneralDiscounts: factura.descuentoGlobalImporte > 0 ? [{
        DiscountReason: 'Descuento general',
        DiscountRate: factura.descuentoGlobalPorcentaje,
        DiscountAmount: this.redondear(factura.descuentoGlobalImporte),
      }] : undefined,
      TotalGeneralDiscounts: this.redondear(totales?.totalDescuentos || 0),
      TotalGrossAmountBeforeTaxes: this.redondear(totales?.subtotalNeto || 0),
      TotalTaxOutputs: this.redondear(totales?.totalIva || 0),
      TotalTaxesWithheld: this.redondear(factura.importeRetencion || 0),
      InvoiceTotal: this.redondear(totales?.totalFactura || 0),
      TotalOutstandingAmount: this.redondear(factura.importePendiente || totales?.totalFactura || 0),
      TotalExecutableAmount: this.redondear(factura.importePendiente || totales?.totalFactura || 0),
    };
  }

  /**
   * Construye las líneas de la factura
   */
  private construirInvoiceLines(factura: IFactura): InvoiceLineType[] {
    const lines: InvoiceLineType[] = [];
    let sequenceNumber = 1;

    for (const linea of factura.lineas) {
      // Omitir líneas que no son de producto/servicio
      if (linea.tipo === 'texto' || linea.tipo === 'subtotal' || !linea.incluidoEnTotal) {
        continue;
      }

      const line: InvoiceLineType = {
        SequenceNumber: String(sequenceNumber++),
        ItemDescription: linea.nombre,
        Quantity: linea.cantidad,
        UnitOfMeasure: linea.unidad || '01',
        UnitPriceWithoutTax: this.redondear(linea.precioUnitario),
        TotalCost: this.redondear(linea.cantidad * linea.precioUnitario),
        GrossAmount: this.redondear(linea.subtotal),
        TaxesOutputs: [{
          TaxTypeCode: CodigoImpuesto.IVA,
          TaxRate: linea.iva,
          TaxableBase: { TotalAmount: this.redondear(linea.subtotal) },
          TaxAmount: { TotalAmount: this.redondear(linea.ivaImporte) },
        }],
        AdditionalLineItemInformation: linea.descripcion || undefined,
        ArticleCode: linea.codigo || linea.sku || undefined,
      };

      // Añadir descuentos de línea si los hay
      if (linea.descuento > 0) {
        line.DiscountsAndRebates = [{
          DiscountReason: 'Descuento',
          DiscountRate: linea.descuento,
          DiscountAmount: this.redondear(linea.descuentoImporte),
        }];
      }

      // Añadir recargo de equivalencia si existe
      if (linea.recargoEquivalencia && linea.recargoImporte) {
        line.TaxesOutputs[0].EquivalenceSurcharge = linea.recargoEquivalencia;
        line.TaxesOutputs[0].EquivalenceSurchargeAmount = { TotalAmount: this.redondear(linea.recargoImporte) };
      }

      lines.push(line);
    }

    return lines;
  }

  /**
   * Construye los detalles de pago
   */
  private construirPaymentDetails(factura: IFactura): PaymentDetailsType {
    return {
      Installment: factura.vencimientos.map(v => ({
        InstallmentDueDate: this.formatDate(v.fecha),
        InstallmentAmount: this.redondear(v.importe),
        PaymentMeans: this.mapMetodoPago(v.metodoPago),
      })),
    };
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Valida los datos necesarios para generar FacturaE
   */
  private validarDatosFactura(factura: IFactura, cliente: ICliente, empresa: any): string[] {
    const errores: string[] = [];

    // Validar factura
    if (!factura.codigo) errores.push('La factura no tiene código');
    if (!factura.fecha) errores.push('La factura no tiene fecha');
    if (!factura.lineas || factura.lineas.length === 0) errores.push('La factura no tiene líneas');
    if (!factura.totales?.totalFactura) errores.push('La factura no tiene total');

    // Validar cliente
    if (!cliente.nif) errores.push('El cliente no tiene NIF');
    if (!cliente.nombre) errores.push('El cliente no tiene nombre');

    // Validar empresa
    if (!empresa.nif) errores.push('La empresa no tiene NIF');
    if (!empresa.nombre && !empresa.razonSocial) errores.push('La empresa no tiene nombre');

    // Validar datos DIR3 si el cliente requiere factura electrónica
    if (cliente.facturacionElectronica?.activa) {
      if (!cliente.facturacionElectronica.codigoOrganoGestor) {
        errores.push('Falta código DIR3 de Órgano Gestor');
      }
      if (!cliente.facturacionElectronica.codigoUnidadTramitadora) {
        errores.push('Falta código DIR3 de Unidad Tramitadora');
      }
      if (!cliente.facturacionElectronica.codigoOficinaContable) {
        errores.push('Falta código DIR3 de Oficina Contable');
      }
    }

    return errores;
  }

  /**
   * Determina el tipo de residencia según el NIF
   */
  private determinarTipoResidencia(nif: string): TipoResidencia {
    if (!nif) return TipoResidencia.RESIDENTE;

    // NIE comienza con X, Y, Z
    if (/^[XYZ]/.test(nif)) {
      return TipoResidencia.UNION_EUROPEA;
    }

    // NIF español normal
    return TipoResidencia.RESIDENTE;
  }

  /**
   * Construye la dirección completa como string
   */
  private construirDireccionCompleta(direccion: any): string {
    const partes = [];
    if (direccion.calle) partes.push(direccion.calle);
    if (direccion.numero) partes.push(direccion.numero);
    if (direccion.piso) partes.push(direccion.piso);
    return partes.join(', ') || '';
  }

  /**
   * Mapea el tipo de factura interno a FacturaE
   */
  private mapTipoDocumento(tipo: TipoFactura): TipoDocumentoFactura {
    switch (tipo) {
      case TipoFactura.SIMPLIFICADA:
        return TipoDocumentoFactura.FACTURA_SIMPLIFICADA;
      default:
        return TipoDocumentoFactura.FACTURA_COMPLETA;
    }
  }

  /**
   * Mapea la clase de factura
   */
  private mapClaseFactura(factura: IFactura): ClaseFactura {
    if (factura.esRectificativa) {
      return ClaseFactura.ORIGINAL_RECTIFICATIVA;
    }
    if (factura.tipo === TipoFactura.RECAPITULATIVA) {
      return ClaseFactura.ORIGINAL_RECAPITULATIVA;
    }
    return ClaseFactura.ORIGINAL;
  }

  /**
   * Mapea el motivo de rectificación
   */
  private mapMotivoRectificacion(motivo?: MotivoRectificacion): CorrectiveType['ReasonCode'] {
    switch (motivo) {
      case MotivoRectificacion.ERROR_EXPEDICION:
        return '01';
      case MotivoRectificacion.DEVOLUCION:
        return '02';
      case MotivoRectificacion.DESCUENTO_POST_VENTA:
        return '03';
      case MotivoRectificacion.BONIFICACION:
        return '04';
      case MotivoRectificacion.IMPAGO_CONCURSAL:
        return '85';
      default:
        return '80';  // Otras causas
    }
  }

  /**
   * Mapea el método de pago interno a FacturaE
   */
  private mapMetodoPago(metodo: MetodoPago): MetodoPagoFacturaE {
    switch (metodo) {
      case MetodoPago.EFECTIVO:
        return MetodoPagoFacturaE.EFECTIVO;
      case MetodoPago.TRANSFERENCIA:
        return MetodoPagoFacturaE.TRANSFERENCIA;
      case MetodoPago.DOMICILIACION:
        return MetodoPagoFacturaE.RECIBO_DOMICILIADO;
      case MetodoPago.CHEQUE:
        return MetodoPagoFacturaE.CHEQUE;
      case MetodoPago.PAGARE:
        return MetodoPagoFacturaE.PAGARE_A_LA_ORDEN;
      case MetodoPago.TARJETA:
        return MetodoPagoFacturaE.TARJETA_CREDITO;
      case MetodoPago.COMPENSACION:
        return MetodoPagoFacturaE.COMPENSACION;
      default:
        return MetodoPagoFacturaE.OTRO;
    }
  }

  /**
   * Formatea una fecha al formato FacturaE (YYYY-MM-DD)
   */
  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Redondea un número a 2 decimales
   */
  private redondear(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  /**
   * Genera el nombre del archivo
   */
  private generarNombreArchivo(factura: IFactura): string {
    return `FacturaE_${factura.codigo.replace(/[^a-zA-Z0-9]/g, '_')}.xsig`;
  }

  /**
   * Escapa caracteres especiales XML
   */
  private escapeXml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Convierte el documento FacturaE a XML
   */
  private facturaEToXml(doc: FacturaEDocument): string {
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(`<fe:Facturae xmlns:fe="${this.NAMESPACE}">`);

    // FileHeader
    lines.push('  <FileHeader>');
    lines.push(`    <SchemaVersion>${doc.FileHeader.SchemaVersion}</SchemaVersion>`);
    lines.push(`    <Modality>${doc.FileHeader.Modality}</Modality>`);
    lines.push(`    <InvoiceIssuerType>${doc.FileHeader.InvoiceIssuerType}</InvoiceIssuerType>`);

    if (doc.FileHeader.Batch) {
      lines.push('    <Batch>');
      lines.push(`      <BatchIdentifier>${this.escapeXml(doc.FileHeader.Batch.BatchIdentifier)}</BatchIdentifier>`);
      lines.push(`      <InvoicesCount>${doc.FileHeader.Batch.InvoicesCount}</InvoicesCount>`);
      lines.push('      <TotalInvoicesAmount>');
      lines.push(`        <TotalAmount>${doc.FileHeader.Batch.TotalInvoicesAmount.TotalAmount}</TotalAmount>`);
      lines.push('      </TotalInvoicesAmount>');
      lines.push('      <TotalOutstandingAmount>');
      lines.push(`        <TotalAmount>${doc.FileHeader.Batch.TotalOutstandingAmount.TotalAmount}</TotalAmount>`);
      lines.push('      </TotalOutstandingAmount>');
      lines.push('      <TotalExecutableAmount>');
      lines.push(`        <TotalAmount>${doc.FileHeader.Batch.TotalExecutableAmount.TotalAmount}</TotalAmount>`);
      lines.push('      </TotalExecutableAmount>');
      lines.push(`      <InvoiceCurrencyCode>${doc.FileHeader.Batch.InvoiceCurrencyCode}</InvoiceCurrencyCode>`);
      lines.push('    </Batch>');
    }

    lines.push('  </FileHeader>');

    // Parties
    lines.push('  <Parties>');
    lines.push(this.businessTypeToXml(doc.Parties.SellerParty, 'SellerParty', 4));
    lines.push(this.businessTypeToXml(doc.Parties.BuyerParty, 'BuyerParty', 4));
    lines.push('  </Parties>');

    // Invoices
    lines.push('  <Invoices>');
    for (const invoice of doc.Invoices.Invoice) {
      lines.push(this.invoiceToXml(invoice, 4));
    }
    lines.push('  </Invoices>');

    lines.push('</fe:Facturae>');

    return lines.join('\n');
  }

  /**
   * Convierte BusinessType a XML
   */
  private businessTypeToXml(business: BusinessType, tagName: string, indent: number): string {
    const pad = ' '.repeat(indent);
    const lines: string[] = [];

    lines.push(`${pad}<${tagName}>`);

    // TaxIdentification
    lines.push(`${pad}  <TaxIdentification>`);
    lines.push(`${pad}    <PersonTypeCode>${business.TaxIdentification.PersonTypeCode}</PersonTypeCode>`);
    lines.push(`${pad}    <ResidenceTypeCode>${business.TaxIdentification.ResidenceTypeCode}</ResidenceTypeCode>`);
    lines.push(`${pad}    <TaxIdentificationNumber>${this.escapeXml(business.TaxIdentification.TaxIdentificationNumber)}</TaxIdentificationNumber>`);
    lines.push(`${pad}  </TaxIdentification>`);

    // AdministrativeCentres (para FACE)
    if (business.AdministrativeCentres && business.AdministrativeCentres.length > 0) {
      lines.push(`${pad}  <AdministrativeCentres>`);
      for (const centre of business.AdministrativeCentres) {
        lines.push(`${pad}    <AdministrativeCentre>`);
        lines.push(`${pad}      <CentreCode>${this.escapeXml(centre.CentreCode)}</CentreCode>`);
        lines.push(`${pad}      <RoleTypeCode>${centre.RoleTypeCode}</RoleTypeCode>`);
        if (centre.Name) {
          lines.push(`${pad}      <Name>${this.escapeXml(centre.Name)}</Name>`);
        }
        lines.push(`${pad}    </AdministrativeCentre>`);
      }
      lines.push(`${pad}  </AdministrativeCentres>`);
    }

    // LegalEntity o Individual
    if (business.LegalEntity) {
      lines.push(`${pad}  <LegalEntity>`);
      lines.push(`${pad}    <CorporateName>${this.escapeXml(business.LegalEntity.CorporateName)}</CorporateName>`);
      if (business.LegalEntity.TradeName) {
        lines.push(`${pad}    <TradeName>${this.escapeXml(business.LegalEntity.TradeName)}</TradeName>`);
      }
      if (business.LegalEntity.AddressInSpain) {
        lines.push(`${pad}    <AddressInSpain>`);
        lines.push(`${pad}      <Address>${this.escapeXml(business.LegalEntity.AddressInSpain.Address)}</Address>`);
        lines.push(`${pad}      <PostCode>${this.escapeXml(business.LegalEntity.AddressInSpain.PostCode)}</PostCode>`);
        lines.push(`${pad}      <Town>${this.escapeXml(business.LegalEntity.AddressInSpain.Town)}</Town>`);
        lines.push(`${pad}      <Province>${this.escapeXml(business.LegalEntity.AddressInSpain.Province)}</Province>`);
        lines.push(`${pad}      <CountryCode>${business.LegalEntity.AddressInSpain.CountryCode}</CountryCode>`);
        lines.push(`${pad}    </AddressInSpain>`);
      }
      if (business.LegalEntity.ContactDetails) {
        const contact = business.LegalEntity.ContactDetails;
        if (contact.Telephone || contact.ElectronicMail || contact.WebAddress) {
          lines.push(`${pad}    <ContactDetails>`);
          if (contact.Telephone) lines.push(`${pad}      <Telephone>${this.escapeXml(contact.Telephone)}</Telephone>`);
          if (contact.ElectronicMail) lines.push(`${pad}      <ElectronicMail>${this.escapeXml(contact.ElectronicMail)}</ElectronicMail>`);
          if (contact.WebAddress) lines.push(`${pad}      <WebAddress>${this.escapeXml(contact.WebAddress)}</WebAddress>`);
          lines.push(`${pad}    </ContactDetails>`);
        }
      }
      lines.push(`${pad}  </LegalEntity>`);
    } else if (business.Individual) {
      lines.push(`${pad}  <Individual>`);
      lines.push(`${pad}    <Name>${this.escapeXml(business.Individual.Name)}</Name>`);
      lines.push(`${pad}    <FirstSurname>${this.escapeXml(business.Individual.FirstSurname)}</FirstSurname>`);
      if (business.Individual.SecondSurname) {
        lines.push(`${pad}    <SecondSurname>${this.escapeXml(business.Individual.SecondSurname)}</SecondSurname>`);
      }
      lines.push(`${pad}  </Individual>`);
    }

    lines.push(`${pad}</${tagName}>`);

    return lines.join('\n');
  }

  /**
   * Convierte Invoice a XML
   */
  private invoiceToXml(invoice: InvoiceType, indent: number): string {
    const pad = ' '.repeat(indent);
    const lines: string[] = [];

    lines.push(`${pad}<Invoice>`);

    // InvoiceHeader
    lines.push(`${pad}  <InvoiceHeader>`);
    lines.push(`${pad}    <InvoiceNumber>${this.escapeXml(invoice.InvoiceHeader.InvoiceNumber)}</InvoiceNumber>`);
    if (invoice.InvoiceHeader.InvoiceSeriesCode) {
      lines.push(`${pad}    <InvoiceSeriesCode>${this.escapeXml(invoice.InvoiceHeader.InvoiceSeriesCode)}</InvoiceSeriesCode>`);
    }
    lines.push(`${pad}    <InvoiceDocumentType>${invoice.InvoiceHeader.InvoiceDocumentType}</InvoiceDocumentType>`);
    lines.push(`${pad}    <InvoiceClass>${invoice.InvoiceHeader.InvoiceClass}</InvoiceClass>`);

    if (invoice.InvoiceHeader.Corrective) {
      const corr = invoice.InvoiceHeader.Corrective;
      lines.push(`${pad}    <Corrective>`);
      lines.push(`${pad}      <InvoiceNumber>${this.escapeXml(corr.InvoiceNumber)}</InvoiceNumber>`);
      if (corr.InvoiceSeriesCode) {
        lines.push(`${pad}      <InvoiceSeriesCode>${this.escapeXml(corr.InvoiceSeriesCode)}</InvoiceSeriesCode>`);
      }
      lines.push(`${pad}      <ReasonCode>${corr.ReasonCode}</ReasonCode>`);
      lines.push(`${pad}      <ReasonDescription>${this.escapeXml(corr.ReasonDescription)}</ReasonDescription>`);
      lines.push(`${pad}      <TaxPeriod>`);
      lines.push(`${pad}        <StartDate>${corr.TaxPeriod.StartDate}</StartDate>`);
      lines.push(`${pad}        <EndDate>${corr.TaxPeriod.EndDate}</EndDate>`);
      lines.push(`${pad}      </TaxPeriod>`);
      lines.push(`${pad}      <CorrectionMethod>${corr.CorrectionMethod}</CorrectionMethod>`);
      lines.push(`${pad}    </Corrective>`);
    }

    lines.push(`${pad}  </InvoiceHeader>`);

    // InvoiceIssueData
    lines.push(`${pad}  <InvoiceIssueData>`);
    lines.push(`${pad}    <IssueDate>${invoice.InvoiceIssueData.IssueDate}</IssueDate>`);
    if (invoice.InvoiceIssueData.OperationDate) {
      lines.push(`${pad}    <OperationDate>${invoice.InvoiceIssueData.OperationDate}</OperationDate>`);
    }
    if (invoice.InvoiceIssueData.InvoicingPeriod) {
      lines.push(`${pad}    <InvoicingPeriod>`);
      lines.push(`${pad}      <StartDate>${invoice.InvoiceIssueData.InvoicingPeriod.StartDate}</StartDate>`);
      lines.push(`${pad}      <EndDate>${invoice.InvoiceIssueData.InvoicingPeriod.EndDate}</EndDate>`);
      lines.push(`${pad}    </InvoicingPeriod>`);
    }
    lines.push(`${pad}    <InvoiceCurrencyCode>${invoice.InvoiceIssueData.InvoiceCurrencyCode}</InvoiceCurrencyCode>`);
    lines.push(`${pad}    <LanguageName>${invoice.InvoiceIssueData.LanguageName}</LanguageName>`);
    lines.push(`${pad}  </InvoiceIssueData>`);

    // TaxesOutputs
    lines.push(`${pad}  <TaxesOutputs>`);
    for (const tax of invoice.TaxesOutputs.Tax) {
      lines.push(this.taxOutputToXml(tax, indent + 4));
    }
    lines.push(`${pad}  </TaxesOutputs>`);

    // TaxesWithheld
    if (invoice.TaxesWithheld && invoice.TaxesWithheld.Tax.length > 0) {
      lines.push(`${pad}  <TaxesWithheld>`);
      for (const tax of invoice.TaxesWithheld.Tax) {
        lines.push(`${pad}    <Tax>`);
        lines.push(`${pad}      <TaxTypeCode>${tax.TaxTypeCode}</TaxTypeCode>`);
        lines.push(`${pad}      <TaxRate>${tax.TaxRate}</TaxRate>`);
        lines.push(`${pad}      <TaxableBase><TotalAmount>${tax.TaxableBase.TotalAmount}</TotalAmount></TaxableBase>`);
        lines.push(`${pad}      <TaxAmount><TotalAmount>${tax.TaxAmount.TotalAmount}</TotalAmount></TaxAmount>`);
        lines.push(`${pad}    </Tax>`);
      }
      lines.push(`${pad}  </TaxesWithheld>`);
    }

    // InvoiceTotals
    lines.push(this.invoiceTotalsToXml(invoice.InvoiceTotals, indent + 2));

    // Items
    lines.push(`${pad}  <Items>`);
    for (const line of invoice.Items.InvoiceLine) {
      lines.push(this.invoiceLineToXml(line, indent + 4));
    }
    lines.push(`${pad}  </Items>`);

    // PaymentDetails
    if (invoice.PaymentDetails && invoice.PaymentDetails.Installment.length > 0) {
      lines.push(`${pad}  <PaymentDetails>`);
      for (const inst of invoice.PaymentDetails.Installment) {
        lines.push(`${pad}    <Installment>`);
        lines.push(`${pad}      <InstallmentDueDate>${inst.InstallmentDueDate}</InstallmentDueDate>`);
        lines.push(`${pad}      <InstallmentAmount>${inst.InstallmentAmount}</InstallmentAmount>`);
        lines.push(`${pad}      <PaymentMeans>${inst.PaymentMeans}</PaymentMeans>`);
        lines.push(`${pad}    </Installment>`);
      }
      lines.push(`${pad}  </PaymentDetails>`);
    }

    // LegalLiterals
    if (invoice.LegalLiterals && invoice.LegalLiterals.LegalReference.length > 0) {
      lines.push(`${pad}  <LegalLiterals>`);
      for (const ref of invoice.LegalLiterals.LegalReference) {
        lines.push(`${pad}    <LegalReference>${this.escapeXml(ref)}</LegalReference>`);
      }
      lines.push(`${pad}  </LegalLiterals>`);
    }

    lines.push(`${pad}</Invoice>`);

    return lines.join('\n');
  }

  /**
   * Convierte TaxOutput a XML
   */
  private taxOutputToXml(tax: TaxOutputType, indent: number): string {
    const pad = ' '.repeat(indent);
    const lines: string[] = [];

    lines.push(`${pad}<Tax>`);
    lines.push(`${pad}  <TaxTypeCode>${tax.TaxTypeCode}</TaxTypeCode>`);
    lines.push(`${pad}  <TaxRate>${tax.TaxRate}</TaxRate>`);
    lines.push(`${pad}  <TaxableBase>`);
    lines.push(`${pad}    <TotalAmount>${tax.TaxableBase.TotalAmount}</TotalAmount>`);
    lines.push(`${pad}  </TaxableBase>`);
    if (tax.TaxAmount) {
      lines.push(`${pad}  <TaxAmount>`);
      lines.push(`${pad}    <TotalAmount>${tax.TaxAmount.TotalAmount}</TotalAmount>`);
      lines.push(`${pad}  </TaxAmount>`);
    }
    if (tax.EquivalenceSurcharge) {
      lines.push(`${pad}  <EquivalenceSurcharge>${tax.EquivalenceSurcharge}</EquivalenceSurcharge>`);
      if (tax.EquivalenceSurchargeAmount) {
        lines.push(`${pad}  <EquivalenceSurchargeAmount>`);
        lines.push(`${pad}    <TotalAmount>${tax.EquivalenceSurchargeAmount.TotalAmount}</TotalAmount>`);
        lines.push(`${pad}  </EquivalenceSurchargeAmount>`);
      }
    }
    lines.push(`${pad}</Tax>`);

    return lines.join('\n');
  }

  /**
   * Convierte InvoiceTotals a XML
   */
  private invoiceTotalsToXml(totals: InvoiceTotalsType, indent: number): string {
    const pad = ' '.repeat(indent);
    const lines: string[] = [];

    lines.push(`${pad}<InvoiceTotals>`);
    lines.push(`${pad}  <TotalGrossAmount>${totals.TotalGrossAmount}</TotalGrossAmount>`);

    if (totals.GeneralDiscounts && totals.GeneralDiscounts.length > 0) {
      lines.push(`${pad}  <GeneralDiscounts>`);
      for (const disc of totals.GeneralDiscounts) {
        lines.push(`${pad}    <Discount>`);
        lines.push(`${pad}      <DiscountReason>${this.escapeXml(disc.DiscountReason)}</DiscountReason>`);
        if (disc.DiscountRate) {
          lines.push(`${pad}      <DiscountRate>${disc.DiscountRate}</DiscountRate>`);
        }
        lines.push(`${pad}      <DiscountAmount>${disc.DiscountAmount}</DiscountAmount>`);
        lines.push(`${pad}    </Discount>`);
      }
      lines.push(`${pad}  </GeneralDiscounts>`);
    }

    if (totals.TotalGeneralDiscounts) {
      lines.push(`${pad}  <TotalGeneralDiscounts>${totals.TotalGeneralDiscounts}</TotalGeneralDiscounts>`);
    }
    lines.push(`${pad}  <TotalGrossAmountBeforeTaxes>${totals.TotalGrossAmountBeforeTaxes}</TotalGrossAmountBeforeTaxes>`);
    lines.push(`${pad}  <TotalTaxOutputs>${totals.TotalTaxOutputs}</TotalTaxOutputs>`);
    lines.push(`${pad}  <TotalTaxesWithheld>${totals.TotalTaxesWithheld}</TotalTaxesWithheld>`);
    lines.push(`${pad}  <InvoiceTotal>${totals.InvoiceTotal}</InvoiceTotal>`);
    lines.push(`${pad}  <TotalOutstandingAmount>${totals.TotalOutstandingAmount}</TotalOutstandingAmount>`);
    lines.push(`${pad}  <TotalExecutableAmount>${totals.TotalExecutableAmount}</TotalExecutableAmount>`);
    lines.push(`${pad}</InvoiceTotals>`);

    return lines.join('\n');
  }

  /**
   * Convierte InvoiceLine a XML
   */
  private invoiceLineToXml(line: InvoiceLineType, indent: number): string {
    const pad = ' '.repeat(indent);
    const lines: string[] = [];

    lines.push(`${pad}<InvoiceLine>`);
    if (line.SequenceNumber) {
      lines.push(`${pad}  <SequenceNumber>${line.SequenceNumber}</SequenceNumber>`);
    }
    lines.push(`${pad}  <ItemDescription>${this.escapeXml(line.ItemDescription)}</ItemDescription>`);
    lines.push(`${pad}  <Quantity>${line.Quantity}</Quantity>`);
    if (line.UnitOfMeasure) {
      lines.push(`${pad}  <UnitOfMeasure>${line.UnitOfMeasure}</UnitOfMeasure>`);
    }
    lines.push(`${pad}  <UnitPriceWithoutTax>${line.UnitPriceWithoutTax}</UnitPriceWithoutTax>`);
    lines.push(`${pad}  <TotalCost>${line.TotalCost}</TotalCost>`);

    if (line.DiscountsAndRebates && line.DiscountsAndRebates.length > 0) {
      lines.push(`${pad}  <DiscountsAndRebates>`);
      for (const disc of line.DiscountsAndRebates) {
        lines.push(`${pad}    <Discount>`);
        lines.push(`${pad}      <DiscountReason>${this.escapeXml(disc.DiscountReason)}</DiscountReason>`);
        if (disc.DiscountRate) {
          lines.push(`${pad}      <DiscountRate>${disc.DiscountRate}</DiscountRate>`);
        }
        lines.push(`${pad}      <DiscountAmount>${disc.DiscountAmount}</DiscountAmount>`);
        lines.push(`${pad}    </Discount>`);
      }
      lines.push(`${pad}  </DiscountsAndRebates>`);
    }

    lines.push(`${pad}  <GrossAmount>${line.GrossAmount}</GrossAmount>`);

    // Taxes
    lines.push(`${pad}  <TaxesOutputs>`);
    for (const tax of line.TaxesOutputs) {
      lines.push(this.taxOutputToXml(tax, indent + 4));
    }
    lines.push(`${pad}  </TaxesOutputs>`);

    if (line.AdditionalLineItemInformation) {
      lines.push(`${pad}  <AdditionalLineItemInformation>${this.escapeXml(line.AdditionalLineItemInformation)}</AdditionalLineItemInformation>`);
    }
    if (line.ArticleCode) {
      lines.push(`${pad}  <ArticleCode>${this.escapeXml(line.ArticleCode)}</ArticleCode>`);
    }

    lines.push(`${pad}</InvoiceLine>`);

    return lines.join('\n');
  }
}

export const facturaEService = new FacturaEService();
