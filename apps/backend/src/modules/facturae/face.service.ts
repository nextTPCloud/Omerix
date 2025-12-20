import { IDatabaseConfig } from '../../services/database-manager.service';
import { getFacturaModel, getClienteModel, getEmpresaModel, getCertificadoModel } from '../../utils/dynamic-models.helper';
import { facturaEService } from './facturae.service';
import { xadesSignerService } from './xades-signer.service';
import { EstadoFACE, FACEResponse, FACEEstadoFactura } from './facturae.types';

/**
 * Configuración de FACE
 */
export interface FACEConfig {
  entorno: 'produccion' | 'pruebas';
  certificadoId: string;  // ID del certificado para autenticación SOAP
  timeout?: number;
}

/**
 * Resultado del envío a FACE
 */
export interface EnvioFACEResult {
  exito: boolean;
  numeroRegistro?: string;
  codigoResultado?: string;
  descripcionResultado?: string;
  fechaRecepcion?: Date;
  errores?: string[];
}

/**
 * Estado de una factura en FACE
 */
export interface ConsultaEstadoResult {
  exito: boolean;
  estado?: {
    codigo: EstadoFACE;
    descripcion: string;
    motivo?: string;
  };
  anulacion?: {
    codigo: string;
    descripcion: string;
    motivo?: string;
  };
  errores?: string[];
}

/**
 * Resultado de anulación
 */
export interface AnulacionResult {
  exito: boolean;
  codigoResultado?: string;
  descripcionResultado?: string;
  errores?: string[];
}

/**
 * Historial de estado en FACE
 */
export interface HistorialEstadoFACE {
  fecha: Date;
  estado: EstadoFACE;
  descripcion: string;
  motivo?: string;
}

/**
 * Servicio de integración con FACE (Punto General de Entrada de Facturas Electrónicas)
 *
 * FACE es el sistema de la Administración General del Estado para la recepción
 * de facturas electrónicas de proveedores.
 *
 * Endpoints:
 * - Producción: https://webservice.face.gob.es/facturasspp2
 * - Pruebas: https://se-face-pruebas.redsara.es/facturasspp2
 *
 * @see https://face.gob.es/
 */
class FACEService {
  // Endpoints de FACE
  private readonly ENDPOINTS = {
    produccion: {
      url: 'https://webservice.face.gob.es/facturasspp2',
      wsdl: 'https://webservice.face.gob.es/facturasspp2?wsdl',
    },
    pruebas: {
      url: 'https://se-face-pruebas.redsara.es/facturasspp2',
      wsdl: 'https://se-face-pruebas.redsara.es/facturasspp2?wsdl',
    },
  };

  // Descripciones de estados FACE
  private readonly ESTADOS_DESCRIPCION: Record<EstadoFACE, string> = {
    [EstadoFACE.REGISTRADA_REC]: 'Registrada en Registro Electrónico Común',
    [EstadoFACE.REGISTRADA_RCF]: 'Registrada en Registro Contable de Facturas',
    [EstadoFACE.CONTABILIZADA]: 'Contabilizada',
    [EstadoFACE.OBLIGACION_PAGO]: 'Reconocida obligación de pago',
    [EstadoFACE.PAGADA]: 'Pagada',
    [EstadoFACE.RECHAZADA]: 'Rechazada',
    [EstadoFACE.ANULADA]: 'Anulada',
    [EstadoFACE.PROPUESTA_PAGO]: 'Propuesta de pago',
    [EstadoFACE.PAGO_REALIZADO]: 'Pago realizado',
  };

  /**
   * Envía una factura a FACE
   */
  async enviarFactura(
    facturaId: string,
    config: FACEConfig,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<EnvioFACEResult> {
    try {
      // 1. Generar FacturaE
      const resultadoGeneracion = await facturaEService.generarFacturaE(
        { facturaId },
        empresaId,
        dbConfig
      );

      if (!resultadoGeneracion.exito || !resultadoGeneracion.xml) {
        return {
          exito: false,
          errores: resultadoGeneracion.errores || ['Error generando FacturaE'],
        };
      }

      // 2. Firmar con XAdES-EPES
      const resultadoFirma = await xadesSignerService.firmar(
        resultadoGeneracion.xml,
        config.certificadoId,
        empresaId,
        dbConfig
      );

      if (!resultadoFirma.exito || !resultadoFirma.xmlFirmado) {
        return {
          exito: false,
          errores: resultadoFirma.errores || ['Error firmando documento'],
        };
      }

      // 3. Preparar el mensaje SOAP para envío
      const soapRequest = this.construirSoapEnvio(resultadoFirma.xmlFirmado);

      // 4. Enviar a FACE
      // Nota: La implementación real requiere un cliente SOAP con autenticación
      // mediante certificado de cliente (mutual TLS)
      const endpoint = this.ENDPOINTS[config.entorno];

      // Simulación de respuesta para desarrollo
      // En producción, aquí se haría la llamada SOAP real
      const respuesta = await this.simularEnvioFACE(facturaId, dbConfig);

      // 5. Guardar resultado en la factura
      await this.actualizarFacturaConResultado(facturaId, respuesta, usuarioId, dbConfig);

      return respuesta;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { exito: false, errores: [`Error enviando a FACE: ${message}`] };
    }
  }

  /**
   * Consulta el estado de una factura en FACE
   */
  async consultarEstado(
    facturaId: string,
    config: FACEConfig,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<ConsultaEstadoResult> {
    try {
      const Factura = getFacturaModel(dbConfig);
      const factura = await Factura.findById(facturaId).lean();

      if (!factura) {
        return { exito: false, errores: ['Factura no encontrada'] };
      }

      // Verificar que la factura fue enviada a FACE
      const facturaElec = (factura as any).facturaElectronica;
      if (!facturaElec?.enviadaFACE || !facturaElec?.numeroRegistroFACE) {
        return { exito: false, errores: ['La factura no ha sido enviada a FACE'] };
      }

      // Construir mensaje SOAP para consulta
      const soapRequest = this.construirSoapConsultaEstado(facturaElec.numeroRegistroFACE);

      // Simulación de respuesta para desarrollo
      const respuesta = await this.simularConsultaEstado(facturaElec.numeroRegistroFACE);

      // Actualizar estado en la factura
      if (respuesta.exito && respuesta.estado) {
        await Factura.findByIdAndUpdate(facturaId, {
          'facturaElectronica.estadoFACE': respuesta.estado.codigo,
          'facturaElectronica.ultimaConsulta': new Date(),
        });
      }

      return respuesta;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { exito: false, errores: [`Error consultando estado: ${message}`] };
    }
  }

  /**
   * Solicita la anulación de una factura en FACE
   */
  async anularFactura(
    facturaId: string,
    motivo: string,
    config: FACEConfig,
    empresaId: string,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<AnulacionResult> {
    try {
      const Factura = getFacturaModel(dbConfig);
      const factura = await Factura.findById(facturaId).lean();

      if (!factura) {
        return { exito: false, errores: ['Factura no encontrada'] };
      }

      const facturaElec = (factura as any).facturaElectronica;
      if (!facturaElec?.enviadaFACE || !facturaElec?.numeroRegistroFACE) {
        return { exito: false, errores: ['La factura no ha sido enviada a FACE'] };
      }

      // Verificar que el estado permite anulación
      const estadosNoAnulables = [EstadoFACE.PAGADA, EstadoFACE.ANULADA, EstadoFACE.PAGO_REALIZADO];
      if (estadosNoAnulables.includes(facturaElec.estadoFACE as EstadoFACE)) {
        return {
          exito: false,
          errores: [`No se puede anular una factura en estado: ${this.ESTADOS_DESCRIPCION[facturaElec.estadoFACE as EstadoFACE]}`],
        };
      }

      // Construir mensaje SOAP para anulación
      const soapRequest = this.construirSoapAnulacion(facturaElec.numeroRegistroFACE, motivo);

      // Simulación de respuesta para desarrollo
      const respuesta = await this.simularAnulacion(facturaElec.numeroRegistroFACE);

      // Actualizar estado en la factura
      if (respuesta.exito) {
        await Factura.findByIdAndUpdate(facturaId, {
          $set: {
            'facturaElectronica.estadoFACE': EstadoFACE.ANULADA,
          },
          $push: {
            'facturaElectronica.historial': {
              fecha: new Date(),
              accion: 'anulada',
              detalle: motivo,
              usuarioId,
            },
          },
        });
      }

      return respuesta;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { exito: false, errores: [`Error anulando factura: ${message}`] };
    }
  }

  /**
   * Obtiene el historial de estados de una factura en FACE
   */
  async obtenerHistorialEstados(
    facturaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<HistorialEstadoFACE[]> {
    try {
      const Factura = getFacturaModel(dbConfig);
      const factura = await Factura.findById(facturaId)
        .select('facturaElectronica.historial')
        .lean();

      if (!factura) {
        return [];
      }

      const facturaElec = (factura as any).facturaElectronica;
      if (!facturaElec?.historial) {
        return [];
      }

      // Transformar historial al formato de retorno
      return facturaElec.historial
        .filter((h: any) => h.accion === 'consultada' || h.accion === 'enviada')
        .map((h: any) => ({
          fecha: h.fecha,
          estado: h.detalle?.split(':')[0] || EstadoFACE.REGISTRADA_REC,
          descripcion: this.ESTADOS_DESCRIPCION[h.detalle?.split(':')[0] as EstadoFACE] || h.detalle || '',
          motivo: h.detalle?.split(':')[1],
        }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Verifica los requisitos para enviar a FACE
   */
  async verificarRequisitosEnvio(
    facturaId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<{ cumple: boolean; faltantes: string[] }> {
    const faltantes: string[] = [];

    try {
      const Factura = getFacturaModel(dbConfig);
      const Cliente = getClienteModel(dbConfig);
      const Empresa = getEmpresaModel(dbConfig);
      const Certificado = getCertificadoModel(dbConfig);

      // Verificar factura
      const factura = await Factura.findById(facturaId).lean();
      if (!factura) {
        return { cumple: false, faltantes: ['Factura no encontrada'] };
      }

      // Verificar cliente
      const cliente = await Cliente.findById(factura.clienteId).lean();
      if (!cliente) {
        faltantes.push('Cliente no encontrado');
      } else {
        const facElec = (cliente as any).facturacionElectronica;
        if (!facElec?.activa) {
          faltantes.push('El cliente no tiene habilitada la facturación electrónica');
        }
        if (!facElec?.codigoOrganoGestor) {
          faltantes.push('Falta código DIR3 de Órgano Gestor');
        }
        if (!facElec?.codigoUnidadTramitadora) {
          faltantes.push('Falta código DIR3 de Unidad Tramitadora');
        }
        if (!facElec?.codigoOficinaContable) {
          faltantes.push('Falta código DIR3 de Oficina Contable');
        }
      }

      // Verificar empresa
      const empresa = await Empresa.findOne().lean();
      if (!empresa) {
        faltantes.push('Datos de empresa no configurados');
      }

      // Verificar certificado disponible
      const certificados = await Certificado.find({
        activo: true,
        fechaCaducidad: { $gt: new Date() },
      }).lean();

      if (certificados.length === 0) {
        faltantes.push('No hay certificados válidos para firmar');
      }

      // Verificar que la factura no haya sido enviada ya
      const facturaElec = (factura as any).facturaElectronica;
      if (facturaElec?.enviadaFACE) {
        faltantes.push('La factura ya fue enviada a FACE');
      }

      return { cumple: faltantes.length === 0, faltantes };
    } catch (error) {
      return { cumple: false, faltantes: ['Error verificando requisitos'] };
    }
  }

  /**
   * Obtiene la descripción de un estado FACE
   */
  getDescripcionEstado(estado: EstadoFACE): string {
    return this.ESTADOS_DESCRIPCION[estado] || 'Estado desconocido';
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Construye el mensaje SOAP para envío de factura
   */
  private construirSoapEnvio(facturaXmlFirmada: string): string {
    const facturaBase64 = Buffer.from(facturaXmlFirmada).toString('base64');

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:sspp="https://webservice.face.gob.es/facturasspp2">
  <soapenv:Header/>
  <soapenv:Body>
    <sspp:enviarFactura>
      <sspp:correo></sspp:correo>
      <sspp:factura>${facturaBase64}</sspp:factura>
      <sspp:anexos></sspp:anexos>
    </sspp:enviarFactura>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Construye el mensaje SOAP para consulta de estado
   */
  private construirSoapConsultaEstado(numeroRegistro: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:sspp="https://webservice.face.gob.es/facturasspp2">
  <soapenv:Header/>
  <soapenv:Body>
    <sspp:consultarEstadoFactura>
      <sspp:numeroRegistro>${numeroRegistro}</sspp:numeroRegistro>
    </sspp:consultarEstadoFactura>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Construye el mensaje SOAP para anulación
   */
  private construirSoapAnulacion(numeroRegistro: string, motivo: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:sspp="https://webservice.face.gob.es/facturasspp2">
  <soapenv:Header/>
  <soapenv:Body>
    <sspp:anularFactura>
      <sspp:numeroRegistro>${numeroRegistro}</sspp:numeroRegistro>
      <sspp:motivo>${this.escapeXml(motivo)}</sspp:motivo>
    </sspp:anularFactura>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Actualiza la factura con el resultado del envío a FACE
   */
  private async actualizarFacturaConResultado(
    facturaId: string,
    resultado: EnvioFACEResult,
    usuarioId: string,
    dbConfig: IDatabaseConfig
  ): Promise<void> {
    const Factura = getFacturaModel(dbConfig);

    if (resultado.exito) {
      await Factura.findByIdAndUpdate(facturaId, {
        $set: {
          'facturaElectronica.generada': true,
          'facturaElectronica.fechaGeneracion': new Date(),
          'facturaElectronica.firmada': true,
          'facturaElectronica.fechaFirma': new Date(),
          'facturaElectronica.enviadaFACE': true,
          'facturaElectronica.fechaEnvio': resultado.fechaRecepcion || new Date(),
          'facturaElectronica.numeroRegistroFACE': resultado.numeroRegistro,
          'facturaElectronica.estadoFACE': EstadoFACE.REGISTRADA_REC,
        },
        $push: {
          'facturaElectronica.historial': {
            fecha: new Date(),
            accion: 'enviada',
            detalle: `Número de registro: ${resultado.numeroRegistro}`,
            usuarioId,
          },
        },
      });
    }
  }

  /**
   * Simula el envío a FACE (para desarrollo)
   */
  private async simularEnvioFACE(facturaId: string, dbConfig: IDatabaseConfig): Promise<EnvioFACEResult> {
    // Generar número de registro simulado
    const numeroRegistro = `FACE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Simulación de respuesta exitosa
    return {
      exito: true,
      numeroRegistro,
      codigoResultado: '0',
      descripcionResultado: 'Factura registrada correctamente',
      fechaRecepcion: new Date(),
    };
  }

  /**
   * Simula la consulta de estado (para desarrollo)
   */
  private async simularConsultaEstado(numeroRegistro: string): Promise<ConsultaEstadoResult> {
    // Simular un estado basado en el tiempo transcurrido
    const estados: EstadoFACE[] = [
      EstadoFACE.REGISTRADA_REC,
      EstadoFACE.REGISTRADA_RCF,
      EstadoFACE.CONTABILIZADA,
      EstadoFACE.OBLIGACION_PAGO,
    ];

    const indice = Math.min(
      Math.floor(Math.random() * estados.length),
      estados.length - 1
    );

    return {
      exito: true,
      estado: {
        codigo: estados[indice],
        descripcion: this.ESTADOS_DESCRIPCION[estados[indice]],
      },
    };
  }

  /**
   * Simula la anulación (para desarrollo)
   */
  private async simularAnulacion(numeroRegistro: string): Promise<AnulacionResult> {
    return {
      exito: true,
      codigoResultado: '0',
      descripcionResultado: 'Solicitud de anulación registrada correctamente',
    };
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

export const faceService = new FACEService();
