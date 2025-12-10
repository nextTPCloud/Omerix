// backend/src/modules/verifactu/verifactu.service.ts

import axios from 'axios';
import forge from 'node-forge';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import crypto from 'crypto';
import certificadosService from '@/modules/certificados/certificados.service';
import { IFactura, SistemaFiscal } from '@/modules/facturas/Factura';
import { logError, logInfo, logWarn } from '@/utils/logger/winston.config';

// ============================================
// CONSTANTES
// ============================================

// URLs de los servicios de la AEAT
const AEAT_URLS = {
  // Entorno de pruebas
  test: {
    alta: 'https://www7.aeat.es/wlpl/TIKE-CONT/ws/SuministroFactEmitidas/PresentacionEmitidasPruebas',
    baja: 'https://www7.aeat.es/wlpl/TIKE-CONT/ws/SuministroFactEmitidas/BajaEmitidasPruebas',
    consulta: 'https://www7.aeat.es/wlpl/TIKE-CONT/ws/SuministroFactEmitidas/ConsultaEmitidasPruebas',
  },
  // Entorno de producción
  production: {
    alta: 'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SuministroFactEmitidas/PresentacionEmitidas',
    baja: 'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SuministroFactEmitidas/BajaEmitidas',
    consulta: 'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SuministroFactEmitidas/ConsultaEmitidas',
  },
};

// Namespace del servicio
const NAMESPACES = {
  soapenv: 'http://schemas.xmlsoap.org/soap/envelope/',
  vf: 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/RegistroFacturacion.xsd',
  ds: 'http://www.w3.org/2000/09/xmldsig#',
};

// ============================================
// TIPOS
// ============================================

export interface VeriFactuConfig {
  empresaNif: string;
  empresaNombre: string;
  certificadoId?: string;
  entorno?: 'test' | 'production';
}

export interface ResultadoEnvio {
  exito: boolean;
  codigo: string;
  mensaje: string;
  csv?: string; // Código Seguro de Verificación
  fechaEnvio: Date;
  xmlEnviado?: string;
  xmlRespuesta?: string;
  errores?: Array<{
    codigo: string;
    descripcion: string;
  }>;
}

export interface DatosFacturaVeriFactu {
  factura: IFactura;
  empresaNif: string;
  empresaNombre: string;
  hashAnterior?: string;
}

// ============================================
// SERVICIO VERIFACTU
// ============================================

class VerifactuService {
  private parser: XMLParser;
  private builder: XMLBuilder;
  private entorno: 'test' | 'production' = 'test'; // Por defecto, entorno de pruebas

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true,
    });

    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
    });
  }

  /**
   * Configurar entorno (test/production)
   */
  setEntorno(entorno: 'test' | 'production'): void {
    this.entorno = entorno;
    logInfo(`VeriFactu: Entorno configurado a ${entorno}`);
  }

  /**
   * Generar el hash encadenado de una factura según especificación VeriFactu
   */
  generarHashFactura(datos: {
    nifEmitente: string;
    numSerieFactura: string;
    fechaExpedicion: Date;
    tipoFactura: string;
    cuotaTotal: number;
    importeTotal: number;
    huellaTBAI?: string;
    hashAnterior?: string;
  }): string {
    // Formato: NIF + NumSerie + FechaExp + TipoFactura + CuotaTotal + ImporteTotal + HuellaTBAI + HashAnterior
    const fechaStr = datos.fechaExpedicion.toISOString().split('T')[0].replace(/-/g, '');

    const cadena = [
      datos.nifEmitente,
      datos.numSerieFactura,
      fechaStr,
      datos.tipoFactura,
      datos.cuotaTotal.toFixed(2),
      datos.importeTotal.toFixed(2),
      datos.huellaTBAI || '',
      datos.hashAnterior || 'GENESIS',
    ].join('');

    return crypto
      .createHash('sha256')
      .update(cadena)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Construir XML de alta de factura según especificación VeriFactu
   */
  construirXMLAlta(datos: DatosFacturaVeriFactu): string {
    const { factura, empresaNif, empresaNombre, hashAnterior } = datos;
    const fechaExpedicion = factura.fecha || new Date();

    // Determinar tipo de factura VeriFactu
    let tipoFactura = 'F1'; // Factura normal
    if (factura.esRectificativa) {
      tipoFactura = 'R1'; // Rectificativa por error fundado
    }

    // Generar hash encadenado
    const hash = this.generarHashFactura({
      nifEmitente: empresaNif,
      numSerieFactura: factura.codigo,
      fechaExpedicion,
      tipoFactura,
      cuotaTotal: factura.totales.totalIva,
      importeTotal: factura.totales.totalFactura,
      hashAnterior,
    });

    // Construir desglose de IVA
    const desgloseIVA = factura.totales.desgloseIva.map(iva => ({
      TipoImpositivo: iva.tipo.toFixed(2),
      BaseImponible: iva.base.toFixed(2),
      CuotaRepercutida: iva.cuota.toFixed(2),
      TipoRecargoEquivalencia: iva.recargo?.toFixed(2) || '0.00',
      CuotaRecargoEquivalencia: iva.cuotaRecargo?.toFixed(2) || '0.00',
    }));

    // Construir datos del destinatario
    const destinatario = factura.clienteNif ? {
      NIF: factura.clienteNif,
      NombreRazon: factura.clienteNombre,
    } : undefined;

    // Construir XML según especificación AEAT
    const xmlObj = {
      'soapenv:Envelope': {
        '@_xmlns:soapenv': NAMESPACES.soapenv,
        '@_xmlns:vf': NAMESPACES.vf,
        'soapenv:Header': {},
        'soapenv:Body': {
          'vf:SuministroLRFacturasEmitidas': {
            'vf:Cabecera': {
              'vf:IDVersionSii': '1.1',
              'vf:Titular': {
                'vf:NombreRazon': empresaNombre,
                'vf:NIF': empresaNif,
              },
              'vf:TipoComunicacion': 'A0', // Alta de facturas
            },
            'vf:RegistroLRFacturasEmitidas': {
              'vf:PeriodoLiquidacion': {
                'vf:Ejercicio': fechaExpedicion.getFullYear().toString(),
                'vf:Periodo': (fechaExpedicion.getMonth() + 1).toString().padStart(2, '0'),
              },
              'vf:IDFactura': {
                'vf:IDEmisorFactura': {
                  'vf:NIF': empresaNif,
                },
                'vf:NumSerieFacturaEmisor': factura.codigo,
                'vf:FechaExpedicionFacturaEmisor': this.formatearFecha(fechaExpedicion),
              },
              'vf:FacturaExpedida': {
                'vf:TipoFactura': tipoFactura,
                'vf:ClaveRegimenEspecialOTrascendencia': factura.claveOperacion || '01', // Régimen general
                'vf:DescripcionOperacion': factura.titulo || 'Venta de productos/servicios',
                ...(destinatario && {
                  'vf:Contraparte': {
                    'vf:NombreRazon': destinatario.NombreRazon,
                    'vf:NIF': destinatario.NIF,
                  },
                }),
                'vf:TipoDesglose': {
                  'vf:DesgloseFactura': {
                    'vf:Sujeta': {
                      'vf:NoExenta': {
                        'vf:TipoNoExenta': 'S1', // Sin inversión del sujeto pasivo
                        'vf:DesgloseIVA': {
                          'vf:DetalleIVA': desgloseIVA.map(d => ({
                            'vf:TipoImpositivo': d.TipoImpositivo,
                            'vf:BaseImponible': d.BaseImponible,
                            'vf:CuotaRepercutida': d.CuotaRepercutida,
                            ...(parseFloat(d.TipoRecargoEquivalencia) > 0 && {
                              'vf:TipoRecargoEquivalencia': d.TipoRecargoEquivalencia,
                              'vf:CuotaRecargoEquivalencia': d.CuotaRecargoEquivalencia,
                            }),
                          })),
                        },
                      },
                    },
                  },
                },
                // Datos VeriFactu específicos
                'vf:DatosVerifactu': {
                  'vf:Huella': hash,
                  'vf:HuellaAnterior': hashAnterior || '',
                  'vf:FechaHoraHusoGenRegistro': new Date().toISOString(),
                  'vf:NumRegistroSistemaInformatico': 'OMERIX-ERP-001',
                  'vf:NombreRazonSistemaInformatico': 'Omerix ERP',
                  'vf:IdSistemaInformatico': 'OMERIX',
                  'vf:VersionSistemaInformatico': '1.0.0',
                  'vf:TipoSistemaInformatico': 'COMPLETO',
                },
              },
              // Referencia a factura rectificada si aplica
              ...(factura.esRectificativa && factura.facturaRectificadaCodigo && {
                'vf:FacturasRectificadas': {
                  'vf:IDFacturaRectificada': {
                    'vf:NumSerieFacturaEmisor': factura.facturaRectificadaCodigo,
                  },
                },
              }),
            },
          },
        },
      },
    };

    return this.builder.build(xmlObj);
  }

  /**
   * Firmar XML con certificado digital
   */
  async firmarXML(
    xml: string,
    certificadoId: string,
    empresaId: string
  ): Promise<string> {
    try {
      // Obtener certificado
      const cert = await certificadosService.obtenerParaFirmar(certificadoId, empresaId);
      if (!cert) {
        throw new Error('Certificado no encontrado');
      }

      // Desencriptar contenido
      const contenidoBase64 = cert.obtenerContenidoDesencriptado();
      const password = cert.obtenerPasswordDesencriptado();

      // Parsear certificado PKCS#12
      const p12Der = forge.util.decode64(contenidoBase64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Obtener certificado y clave privada
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

      const certBag = certBags[forge.pki.oids.certBag];
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

      if (!certBag || !keyBag || !certBag[0].cert || !keyBag[0].key) {
        throw new Error('No se pudo extraer el certificado o la clave privada');
      }

      const certificate = certBag[0].cert;
      const privateKey = keyBag[0].key as forge.pki.rsa.PrivateKey;

      // Calcular digest del contenido a firmar
      const canonicalXml = this.canonicalizar(xml);
      const md = forge.md.sha256.create();
      md.update(canonicalXml, 'utf8');
      const digest = forge.util.encode64(md.digest().bytes());

      // Crear firma
      const signatureMd = forge.md.sha256.create();
      signatureMd.update(canonicalXml, 'utf8');
      const signature = privateKey.sign(signatureMd);
      const signatureBase64 = forge.util.encode64(signature);

      // Obtener certificado en Base64
      const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
      const certBase64 = forge.util.encode64(certDer);

      // Insertar firma en el XML
      const xmlFirmado = this.insertarFirma(xml, signatureBase64, digest, certBase64);

      return xmlFirmado;
    } catch (error: any) {
      logError('Error firmando XML', error);
      throw new Error(`Error al firmar XML: ${error.message}`);
    }
  }

  /**
   * Canonicalizar XML para firma
   */
  private canonicalizar(xml: string): string {
    // Implementación simplificada - en producción usar librería específica
    return xml
      .replace(/>\s+</g, '><')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Insertar firma digital en el XML
   */
  private insertarFirma(
    xml: string,
    signature: string,
    digest: string,
    certificate: string
  ): string {
    const signatureBlock = `
      <ds:Signature xmlns:ds="${NAMESPACES.ds}">
        <ds:SignedInfo>
          <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
          <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
          <ds:Reference URI="">
            <ds:Transforms>
              <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
              <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
            </ds:Transforms>
            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
            <ds:DigestValue>${digest}</ds:DigestValue>
          </ds:Reference>
        </ds:SignedInfo>
        <ds:SignatureValue>${signature}</ds:SignatureValue>
        <ds:KeyInfo>
          <ds:X509Data>
            <ds:X509Certificate>${certificate}</ds:X509Certificate>
          </ds:X509Data>
        </ds:KeyInfo>
      </ds:Signature>
    `;

    // Insertar antes del cierre del Body
    return xml.replace('</soapenv:Body>', `${signatureBlock}</soapenv:Body>`);
  }

  /**
   * Enviar factura a la AEAT
   */
  async enviarFactura(
    factura: IFactura,
    config: VeriFactuConfig,
    empresaId: string
  ): Promise<ResultadoEnvio> {
    const inicio = Date.now();

    try {
      logInfo('Iniciando envío VeriFactu', {
        facturaId: factura._id,
        codigo: factura.codigo,
        entorno: this.entorno,
      });

      // 1. Construir XML
      const xml = this.construirXMLAlta({
        factura,
        empresaNif: config.empresaNif,
        empresaNombre: config.empresaNombre,
        hashAnterior: factura.verifactu?.hashAnterior,
      });

      // 2. Firmar XML si hay certificado
      let xmlFirmado = xml;
      if (config.certificadoId) {
        xmlFirmado = await this.firmarXML(xml, config.certificadoId, empresaId);
      } else {
        logWarn('Enviando sin firma digital - Solo válido en entorno de pruebas');
      }

      // 3. Obtener URL según entorno
      const url = AEAT_URLS[this.entorno].alta;

      // 4. Enviar petición
      const response = await axios.post(url, xmlFirmado, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '"SuministroLRFacturasEmitidas"',
        },
        timeout: 30000,
        // En producción, necesitaríamos configurar el certificado SSL del cliente
        httpsAgent: this.entorno === 'production' ? this.crearAgenteCertificado(config.certificadoId!, empresaId) : undefined,
      });

      // 5. Parsear respuesta
      const respuesta = this.parser.parse(response.data);

      // 6. Extraer resultado
      const resultado = this.extraerResultado(respuesta);
      resultado.xmlEnviado = xmlFirmado;
      resultado.xmlRespuesta = response.data;

      const duracion = Date.now() - inicio;
      logInfo('Envío VeriFactu completado', {
        facturaId: factura._id,
        exito: resultado.exito,
        duracion: `${duracion}ms`,
        csv: resultado.csv,
      });

      return resultado;
    } catch (error: any) {
      const duracion = Date.now() - inicio;
      logError('Error en envío VeriFactu', {
        facturaId: factura._id,
        error: error.message,
        duracion: `${duracion}ms`,
      });

      return {
        exito: false,
        codigo: 'ERROR_CONEXION',
        mensaje: error.message,
        fechaEnvio: new Date(),
        errores: [{
          codigo: 'ERROR',
          descripcion: error.message,
        }],
      };
    }
  }

  /**
   * Crear agente HTTPS con certificado cliente
   */
  private async crearAgenteCertificado(
    certificadoId: string,
    empresaId: string
  ): Promise<any> {
    // En una implementación real, aquí crearíamos un https.Agent con el certificado
    // Por ahora retornamos undefined para pruebas
    logWarn('Agente HTTPS con certificado no implementado completamente');
    return undefined;
  }

  /**
   * Extraer resultado de la respuesta SOAP
   */
  private extraerResultado(respuesta: any): ResultadoEnvio {
    try {
      const body = respuesta?.Envelope?.Body;
      const respuestaLR = body?.SuministroLRFacturasEmitidasResponse ||
                          body?.RespuestaLRFacturasEmitidas;

      if (!respuestaLR) {
        return {
          exito: false,
          codigo: 'ERROR_PARSEO',
          mensaje: 'No se pudo parsear la respuesta de la AEAT',
          fechaEnvio: new Date(),
        };
      }

      const estado = respuestaLR.EstadoEnvio || respuestaLR.CSV;
      const esExito = estado === 'Correcto' || estado === 'AceptadoConErrores' || !!respuestaLR.CSV;

      // Extraer errores si los hay
      const errores: Array<{ codigo: string; descripcion: string }> = [];
      const respuestaLineas = respuestaLR.RespuestaLinea;
      if (respuestaLineas) {
        const lineas = Array.isArray(respuestaLineas) ? respuestaLineas : [respuestaLineas];
        lineas.forEach((linea: any) => {
          if (linea.CodigoErrorRegistro) {
            errores.push({
              codigo: linea.CodigoErrorRegistro,
              descripcion: linea.DescripcionErrorRegistro || 'Error sin descripción',
            });
          }
        });
      }

      return {
        exito: esExito,
        codigo: estado || 'OK',
        mensaje: esExito ? 'Factura registrada correctamente' : 'Error en el registro',
        csv: respuestaLR.CSV,
        fechaEnvio: new Date(),
        errores: errores.length > 0 ? errores : undefined,
      };
    } catch (error: any) {
      return {
        exito: false,
        codigo: 'ERROR_PARSEO',
        mensaje: `Error parseando respuesta: ${error.message}`,
        fechaEnvio: new Date(),
      };
    }
  }

  /**
   * Formatear fecha para VeriFactu (DD-MM-YYYY)
   */
  private formatearFecha(fecha: Date): string {
    const d = new Date(fecha);
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  }

  /**
   * Consultar estado de una factura en AEAT
   */
  async consultarFactura(
    factura: IFactura,
    config: VeriFactuConfig,
    empresaId: string
  ): Promise<ResultadoEnvio> {
    try {
      const fechaExpedicion = factura.fecha || new Date();

      const xmlObj = {
        'soapenv:Envelope': {
          '@_xmlns:soapenv': NAMESPACES.soapenv,
          '@_xmlns:vf': NAMESPACES.vf,
          'soapenv:Header': {},
          'soapenv:Body': {
            'vf:ConsultaLRFacturasEmitidas': {
              'vf:Cabecera': {
                'vf:IDVersionSii': '1.1',
                'vf:Titular': {
                  'vf:NombreRazon': config.empresaNombre,
                  'vf:NIF': config.empresaNif,
                },
              },
              'vf:FiltroConsulta': {
                'vf:PeriodoLiquidacion': {
                  'vf:Ejercicio': fechaExpedicion.getFullYear().toString(),
                  'vf:Periodo': (fechaExpedicion.getMonth() + 1).toString().padStart(2, '0'),
                },
                'vf:IDFactura': {
                  'vf:NumSerieFacturaEmisor': factura.codigo,
                  'vf:FechaExpedicionFacturaEmisor': this.formatearFecha(fechaExpedicion),
                },
              },
            },
          },
        },
      };

      const xml = this.builder.build(xmlObj);
      const url = AEAT_URLS[this.entorno].consulta;

      const response = await axios.post(url, xml, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '"ConsultaLRFacturasEmitidas"',
        },
        timeout: 30000,
      });

      const respuesta = this.parser.parse(response.data);
      return this.extraerResultado(respuesta);
    } catch (error: any) {
      logError('Error consultando factura VeriFactu', error);
      return {
        exito: false,
        codigo: 'ERROR_CONSULTA',
        mensaje: error.message,
        fechaEnvio: new Date(),
      };
    }
  }

  /**
   * Dar de baja una factura (anulación)
   */
  async bajaFactura(
    factura: IFactura,
    config: VeriFactuConfig,
    empresaId: string,
    motivo: string
  ): Promise<ResultadoEnvio> {
    try {
      const fechaExpedicion = factura.fecha || new Date();

      const xmlObj = {
        'soapenv:Envelope': {
          '@_xmlns:soapenv': NAMESPACES.soapenv,
          '@_xmlns:vf': NAMESPACES.vf,
          'soapenv:Header': {},
          'soapenv:Body': {
            'vf:BajaLRFacturasEmitidas': {
              'vf:Cabecera': {
                'vf:IDVersionSii': '1.1',
                'vf:Titular': {
                  'vf:NombreRazon': config.empresaNombre,
                  'vf:NIF': config.empresaNif,
                },
                'vf:TipoComunicacion': 'A1', // Baja
              },
              'vf:RegistroLRBajaExpedidas': {
                'vf:PeriodoLiquidacion': {
                  'vf:Ejercicio': fechaExpedicion.getFullYear().toString(),
                  'vf:Periodo': (fechaExpedicion.getMonth() + 1).toString().padStart(2, '0'),
                },
                'vf:IDFactura': {
                  'vf:IDEmisorFactura': {
                    'vf:NIF': config.empresaNif,
                  },
                  'vf:NumSerieFacturaEmisor': factura.codigo,
                  'vf:FechaExpedicionFacturaEmisor': this.formatearFecha(fechaExpedicion),
                },
              },
            },
          },
        },
      };

      let xml = this.builder.build(xmlObj);

      // Firmar si hay certificado
      if (config.certificadoId) {
        xml = await this.firmarXML(xml, config.certificadoId, empresaId);
      }

      const url = AEAT_URLS[this.entorno].baja;

      const response = await axios.post(url, xml, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '"BajaLRFacturasEmitidas"',
        },
        timeout: 30000,
      });

      const respuesta = this.parser.parse(response.data);
      const resultado = this.extraerResultado(respuesta);
      resultado.xmlEnviado = xml;
      resultado.xmlRespuesta = response.data;

      logInfo('Baja VeriFactu completada', {
        facturaId: factura._id,
        codigo: factura.codigo,
        exito: resultado.exito,
      });

      return resultado;
    } catch (error: any) {
      logError('Error en baja VeriFactu', error);
      return {
        exito: false,
        codigo: 'ERROR_BAJA',
        mensaje: error.message,
        fechaEnvio: new Date(),
      };
    }
  }

  /**
   * Verificar conexión con AEAT
   */
  async verificarConexion(): Promise<boolean> {
    try {
      // Intentar una consulta simple para verificar conectividad
      const url = AEAT_URLS[this.entorno].consulta;
      const response = await axios.head(url, { timeout: 10000 });
      return response.status === 200 || response.status === 405; // 405 es esperado para HEAD
    } catch (error) {
      logWarn('No se pudo verificar conexión con AEAT');
      return false;
    }
  }

  /**
   * Generar URL de verificación para QR
   */
  generarURLVerificacion(factura: IFactura, empresaNif: string): string {
    const baseUrl = this.entorno === 'production'
      ? 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR'
      : 'https://www7.aeat.es/wlpl/TIKE-CONT/ValidarQR';

    const params = new URLSearchParams({
      nif: empresaNif,
      numserie: factura.codigo,
      fecha: this.formatearFecha(factura.fecha),
      importe: factura.totales.totalFactura.toFixed(2),
    });

    return `${baseUrl}?${params.toString()}`;
  }
}

export const verifactuService = new VerifactuService();
export default verifactuService;
