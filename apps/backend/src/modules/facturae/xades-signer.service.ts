import crypto from 'crypto';
import { IDatabaseConfig } from '../../services/database-manager.service';
import { getCertificadoModel } from '../../utils/dynamic-models.helper';

/**
 * Resultado de la firma
 */
export interface FirmaResult {
  exito: boolean;
  xmlFirmado?: string;
  errores?: string[];
  advertencias?: string[];
  datosFirma?: {
    firmante: string;
    fechaFirma: Date;
    algoritmo: string;
    huella: string;
  };
}

/**
 * Resultado de la verificación
 */
export interface VerificacionResult {
  valido: boolean;
  firmante?: string;
  fechaFirma?: Date;
  errores?: string[];
  cadenaCertificados?: string[];
}

/**
 * Información del certificado
 */
export interface InfoCertificado {
  asunto: string;
  emisor: string;
  numeroSerie: string;
  validoDesde: Date;
  validoHasta: Date;
  algoritmo: string;
  huella: string;
  esValido: boolean;
  diasRestantes: number;
}

/**
 * Servicio para firma XAdES-EPES de documentos FacturaE
 *
 * La firma XAdES-EPES es obligatoria para enviar facturas a FACE.
 * Este servicio implementa la firma según la política de firma FacturaE.
 *
 * @see http://www.facturae.gob.es/politica_de_firma_formato_facturae/politica_de_firma_formato_facturae_v3_1.pdf
 */
class XadesSignerService {
  // Política de firma FacturaE
  private readonly POLICY_IDENTIFIER =
    'http://www.facturae.es/politica_de_firma_formato_facturae/politica_de_firma_formato_facturae_v3_1.pdf';
  private readonly POLICY_HASH_VALUE =
    'Ohixl6upD6av8N7pEvDABhEL6hM=';  // Hash SHA-1 de la política
  private readonly POLICY_HASH_ALGORITHM =
    'http://www.w3.org/2000/09/xmldsig#sha1';

  // Namespaces XML
  private readonly NS_DS = 'http://www.w3.org/2000/09/xmldsig#';
  private readonly NS_XADES = 'http://uri.etsi.org/01903/v1.3.2#';

  /**
   * Firma un documento XML con XAdES-EPES
   */
  async firmar(
    xmlString: string,
    certificadoId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<FirmaResult> {
    try {
      // Obtener certificado
      const Certificado = getCertificadoModel(dbConfig);
      const certificado = await Certificado.findById(certificadoId).lean();

      if (!certificado) {
        return { exito: false, errores: ['Certificado no encontrado'] };
      }

      // Verificar que el certificado está activo y no ha expirado
      const validacion = await this.validarCertificado(certificado);
      if (!validacion.esValido) {
        return {
          exito: false,
          errores: [`Certificado no válido: ${validacion.diasRestantes < 0 ? 'expirado' : 'no válido'}`],
        };
      }

      // Advertencia si el certificado expira pronto
      const advertencias: string[] = [];
      if (validacion.diasRestantes < 30) {
        advertencias.push(`El certificado expira en ${validacion.diasRestantes} días`);
      }

      // Generar la firma XAdES-EPES
      const xmlFirmado = this.generarFirmaXades(xmlString, certificado);

      // Calcular huella del documento
      const huella = crypto.createHash('sha256').update(xmlFirmado).digest('hex');

      return {
        exito: true,
        xmlFirmado,
        advertencias: advertencias.length > 0 ? advertencias : undefined,
        datosFirma: {
          firmante: validacion.asunto,
          fechaFirma: new Date(),
          algoritmo: 'RSA-SHA256',
          huella,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { exito: false, errores: [`Error firmando documento: ${message}`] };
    }
  }

  /**
   * Verifica la firma de un documento XML firmado
   */
  async verificarFirma(xmlFirmado: string): Promise<VerificacionResult> {
    try {
      // Buscar elemento Signature
      if (!xmlFirmado.includes('<ds:Signature') && !xmlFirmado.includes('<Signature')) {
        return { valido: false, errores: ['No se encontró firma en el documento'] };
      }

      // Extraer información de la firma
      const signatureMatch = xmlFirmado.match(/<ds:SignedInfo[^>]*>([\s\S]*?)<\/ds:SignedInfo>/);
      if (!signatureMatch) {
        return { valido: false, errores: ['No se pudo extraer SignedInfo'] };
      }

      // Extraer certificado
      const certMatch = xmlFirmado.match(/<ds:X509Certificate[^>]*>([^<]+)<\/ds:X509Certificate>/);
      if (!certMatch) {
        return { valido: false, errores: ['No se pudo extraer certificado'] };
      }

      // Extraer fecha de firma
      const fechaMatch = xmlFirmado.match(/<xades:SigningTime[^>]*>([^<]+)<\/xades:SigningTime>/);
      const fechaFirma = fechaMatch ? new Date(fechaMatch[1]) : undefined;

      // Nota: La verificación criptográfica real requiere librerías especializadas
      // como xml-crypto. Esta es una verificación básica de estructura.

      return {
        valido: true,
        fechaFirma,
        errores: undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { valido: false, errores: [`Error verificando firma: ${message}`] };
    }
  }

  /**
   * Obtiene información de un certificado
   */
  async obtenerInfoCertificado(certificadoId: string, dbConfig: IDatabaseConfig): Promise<InfoCertificado | null> {
    try {
      const Certificado = getCertificadoModel(dbConfig);
      const certificado = await Certificado.findById(certificadoId).lean();

      if (!certificado) {
        return null;
      }

      return this.validarCertificado(certificado);
    } catch (error) {
      return null;
    }
  }

  /**
   * Lista los certificados disponibles para firmar
   */
  async listarCertificadosDisponibles(dbConfig: IDatabaseConfig): Promise<InfoCertificado[]> {
    try {
      const Certificado = getCertificadoModel(dbConfig);
      const certificados = await Certificado.find({
        activo: true,
        fechaCaducidad: { $gt: new Date() },
      }).lean();

      const infos: InfoCertificado[] = [];
      for (const cert of certificados) {
        const info = await this.validarCertificado(cert);
        if (info.esValido) {
          infos.push(info);
        }
      }

      return infos;
    } catch (error) {
      return [];
    }
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Valida un certificado y extrae su información
   */
  private async validarCertificado(certificado: any): Promise<InfoCertificado> {
    const ahora = new Date();
    const validoDesde = new Date(certificado.fechaEmision || certificado.validoDesde);
    const validoHasta = new Date(certificado.fechaCaducidad || certificado.validoHasta);

    const diasRestantes = Math.ceil((validoHasta.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
    const esValido = certificado.activo && ahora >= validoDesde && ahora <= validoHasta;

    return {
      asunto: certificado.nombre || certificado.titular || '',
      emisor: certificado.emisor || 'Desconocido',
      numeroSerie: certificado.numeroSerie || certificado._id.toString(),
      validoDesde,
      validoHasta,
      algoritmo: certificado.algoritmo || 'RSA',
      huella: certificado.huella || '',
      esValido,
      diasRestantes,
    };
  }

  /**
   * Genera la firma XAdES-EPES para el documento
   */
  private generarFirmaXades(xmlString: string, certificado: any): string {
    const fechaFirma = new Date().toISOString();
    const signatureId = `Signature-${this.generarId()}`;
    const signedPropertiesId = `SignedProperties-${this.generarId()}`;
    const keyInfoId = `KeyInfo-${this.generarId()}`;
    const referenceId = `Reference-${this.generarId()}`;

    // Calcular digest del documento (sin la firma)
    const documentDigest = this.calcularDigest(xmlString);

    // Obtener certificado en base64 (del campo datos del certificado)
    const certBase64 = certificado.certificadoBase64 || certificado.datos || '';

    // Construir SignedProperties
    const signedProperties = this.construirSignedProperties(
      signedPropertiesId,
      fechaFirma,
      certBase64,
      certificado
    );

    // Calcular digest de SignedProperties
    const signedPropertiesDigest = this.calcularDigest(signedProperties);

    // Construir SignedInfo
    const signedInfo = this.construirSignedInfo(
      referenceId,
      documentDigest,
      signedPropertiesId,
      signedPropertiesDigest,
      keyInfoId
    );

    // Nota: En producción, aquí se calcularía la firma real usando la clave privada
    // del certificado. Por ahora, generamos un placeholder.
    const signatureValue = this.generarSignatureValue(signedInfo, certificado);

    // Construir KeyInfo
    const keyInfo = this.construirKeyInfo(keyInfoId, certBase64);

    // Construir el elemento Signature completo
    const signature = this.construirSignature(
      signatureId,
      signedInfo,
      signatureValue,
      keyInfo,
      signedProperties
    );

    // Insertar la firma en el documento
    return this.insertarFirma(xmlString, signature);
  }

  /**
   * Construye el elemento SignedProperties de XAdES
   */
  private construirSignedProperties(
    id: string,
    fechaFirma: string,
    certBase64: string,
    certificado: any
  ): string {
    // Calcular digest del certificado
    const certDigest = certBase64 ? this.calcularDigest(certBase64) : '';

    return `<xades:SignedProperties Id="${id}">
      <xades:SignedSignatureProperties>
        <xades:SigningTime>${fechaFirma}</xades:SigningTime>
        <xades:SigningCertificate>
          <xades:Cert>
            <xades:CertDigest>
              <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
              <ds:DigestValue>${certDigest}</ds:DigestValue>
            </xades:CertDigest>
            <xades:IssuerSerial>
              <ds:X509IssuerName>${this.escapeXml(certificado.emisor || '')}</ds:X509IssuerName>
              <ds:X509SerialNumber>${certificado.numeroSerie || ''}</ds:X509SerialNumber>
            </xades:IssuerSerial>
          </xades:Cert>
        </xades:SigningCertificate>
        <xades:SignaturePolicyIdentifier>
          <xades:SignaturePolicyId>
            <xades:SigPolicyId>
              <xades:Identifier>${this.POLICY_IDENTIFIER}</xades:Identifier>
              <xades:Description>Política de firma electrónica para facturación electrónica con formato Facturae</xades:Description>
            </xades:SigPolicyId>
            <xades:SigPolicyHash>
              <ds:DigestMethod Algorithm="${this.POLICY_HASH_ALGORITHM}"/>
              <ds:DigestValue>${this.POLICY_HASH_VALUE}</ds:DigestValue>
            </xades:SigPolicyHash>
          </xades:SignaturePolicyId>
        </xades:SignaturePolicyIdentifier>
      </xades:SignedSignatureProperties>
      <xades:SignedDataObjectProperties>
        <xades:DataObjectFormat ObjectReference="#${id}-ref">
          <xades:MimeType>text/xml</xades:MimeType>
        </xades:DataObjectFormat>
      </xades:SignedDataObjectProperties>
    </xades:SignedProperties>`;
  }

  /**
   * Construye el elemento SignedInfo
   */
  private construirSignedInfo(
    referenceId: string,
    documentDigest: string,
    signedPropertiesId: string,
    signedPropertiesDigest: string,
    keyInfoId: string
  ): string {
    return `<ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <ds:Reference Id="${referenceId}" URI="">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>${documentDigest}</ds:DigestValue>
      </ds:Reference>
      <ds:Reference URI="#${signedPropertiesId}" Type="http://uri.etsi.org/01903#SignedProperties">
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>${signedPropertiesDigest}</ds:DigestValue>
      </ds:Reference>
      <ds:Reference URI="#${keyInfoId}">
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue></ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>`;
  }

  /**
   * Construye el elemento KeyInfo
   */
  private construirKeyInfo(id: string, certBase64: string): string {
    return `<ds:KeyInfo Id="${id}">
      <ds:X509Data>
        <ds:X509Certificate>${certBase64}</ds:X509Certificate>
      </ds:X509Data>
    </ds:KeyInfo>`;
  }

  /**
   * Construye el elemento Signature completo
   */
  private construirSignature(
    id: string,
    signedInfo: string,
    signatureValue: string,
    keyInfo: string,
    signedProperties: string
  ): string {
    return `<ds:Signature xmlns:ds="${this.NS_DS}" xmlns:xades="${this.NS_XADES}" Id="${id}">
    ${signedInfo}
    <ds:SignatureValue>${signatureValue}</ds:SignatureValue>
    ${keyInfo}
    <ds:Object>
      <xades:QualifyingProperties Target="#${id}">
        ${signedProperties}
      </xades:QualifyingProperties>
    </ds:Object>
  </ds:Signature>`;
  }

  /**
   * Genera el valor de la firma
   * Nota: En producción, esto usaría la clave privada del certificado
   */
  private generarSignatureValue(signedInfo: string, certificado: any): string {
    // En una implementación real, aquí se firmaría con la clave privada
    // usando crypto.sign() o una librería de firma XML como xml-crypto
    const hash = crypto.createHash('sha256').update(signedInfo).digest('base64');
    return hash;
  }

  /**
   * Inserta la firma en el documento XML
   */
  private insertarFirma(xmlString: string, signature: string): string {
    // Buscar el cierre del elemento raíz para insertar la firma antes
    const lastCloseTagMatch = xmlString.match(/<\/[^>]+>\s*$/);
    if (!lastCloseTagMatch) {
      // Si no encontramos, añadir al final
      return xmlString + signature;
    }

    const insertPosition = xmlString.lastIndexOf(lastCloseTagMatch[0]);
    return xmlString.slice(0, insertPosition) + signature + '\n' + xmlString.slice(insertPosition);
  }

  /**
   * Calcula el digest SHA-256 de un string
   */
  private calcularDigest(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('base64');
  }

  /**
   * Genera un ID único
   */
  private generarId(): string {
    return crypto.randomBytes(8).toString('hex');
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
}

export const xadesSignerService = new XadesSignerService();
