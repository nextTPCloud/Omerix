import { Types } from 'mongoose';
import { IDatabaseConfig } from '../empresa/Empresa';
import { getReciboModel, getVencimientoModel, getEmpresaModel } from '../../utils/dynamic-models.helper';
import { AppError } from '../../middleware/errorHandler.middleware';
import { IRecibo, TipoAdeudoSEPA } from './Recibo';
import { IVencimiento } from '../../models/Vencimiento';

// ============================================
// TIPOS
// ============================================

export interface DatosCabeceraSEPA {
  messageId?: string;              // Identificador único del mensaje
  fechaCobro: Date | string;       // Fecha de cobro solicitada
  fechaCreacion?: Date | string;   // Fecha de creación del fichero
  cuentaBancariaEmpresa: string;   // IBAN de la empresa
  nombreEmpresa: string;
  nifEmpresa: string;
  sufijoPresentador?: string;      // Sufijo de presentador (3 dígitos)
}

export interface DatosCabeceraN19 {
  cuentaBancariaEmpresa: string;
  nombreEmpresa: string;
  fechaCobro: Date | string;
  codigoOrdenante: string;         // Código de ordenante del banco
}

export interface ResultadoGeneracion {
  contenido: string;
  nombreArchivo: string;
  formato: 'SEPA_DD' | 'SEPA_CT' | 'N19' | 'N34';
  totalRegistros: number;
  totalImporte: number;
}

// ============================================
// SERVICIO
// ============================================

export class FicherosBancariosService {
  /**
   * Validar IBAN
   */
  validarIBAN(iban: string): boolean {
    if (!iban) return false;

    // Limpiar IBAN
    const ibanLimpio = iban.replace(/\s/g, '').toUpperCase();

    // Verificar longitud mínima y caracteres
    if (ibanLimpio.length < 15 || ibanLimpio.length > 34) return false;
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(ibanLimpio)) return false;

    // Mover los 4 primeros caracteres al final y reemplazar letras por números
    const reorganizado = ibanLimpio.slice(4) + ibanLimpio.slice(0, 4);
    const numerico = reorganizado.replace(/[A-Z]/g, (char) => {
      return (char.charCodeAt(0) - 55).toString();
    });

    // Calcular módulo 97
    let resto = '';
    for (let i = 0; i < numerico.length; i++) {
      resto += numerico[i];
      const num = parseInt(resto, 10);
      resto = (num % 97).toString();
    }

    return parseInt(resto, 10) === 1;
  }

  /**
   * Calcular dígito de control CCC
   */
  calcularDigitoControlCCC(entidad: string, oficina: string, cuenta: string): string {
    const pesos = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];

    const calcularDC = (cadena: string): string => {
      let suma = 0;
      for (let i = 0; i < cadena.length; i++) {
        suma += parseInt(cadena[i], 10) * pesos[i];
      }
      const resto = suma % 11;
      return (11 - resto === 10 ? 0 : 11 - resto === 11 ? 0 : 11 - resto).toString();
    };

    const dc1 = calcularDC('00' + entidad + oficina);
    const dc2 = calcularDC(cuenta);

    return dc1 + dc2;
  }

  /**
   * Generar SEPA Direct Debit (adeudos - cobros)
   * Formato ISO 20022 pain.008.001.02
   */
  async generarSEPADirectDebit(
    reciboIds: string[],
    cabecera: DatosCabeceraSEPA,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<ResultadoGeneracion> {
    const ReciboModel = await getReciboModel(empresaId, dbConfig);

    // Obtener recibos
    const recibos = await ReciboModel.find({
      _id: { $in: reciboIds.map(id => new Types.ObjectId(id)) },
      empresaId: new Types.ObjectId(empresaId),
    }).lean();

    if (recibos.length === 0) {
      throw new AppError('No se encontraron recibos para generar el fichero', 400);
    }

    // Validar que todos tienen mandato SEPA e IBAN
    for (const recibo of recibos) {
      if (!recibo.mandatoSEPA?.referencia) {
        throw new AppError(`El recibo ${recibo.numero} no tiene mandato SEPA`, 400);
      }
      if (!recibo.ibanCliente) {
        throw new AppError(`El recibo ${recibo.numero} no tiene IBAN del cliente`, 400);
      }
      if (!this.validarIBAN(recibo.ibanCliente)) {
        throw new AppError(`El IBAN del cliente en el recibo ${recibo.numero} no es válido`, 400);
      }
    }

    // Validar IBAN empresa
    if (!this.validarIBAN(cabecera.cuentaBancariaEmpresa)) {
      throw new AppError('El IBAN de la empresa no es válido', 400);
    }

    const fechaCreacion = cabecera.fechaCreacion
      ? new Date(cabecera.fechaCreacion)
      : new Date();
    const fechaCobro = new Date(cabecera.fechaCobro);
    const messageId = cabecera.messageId || `SEPA-DD-${Date.now()}`;
    const totalImporte = recibos.reduce((sum, r) => sum + r.importe, 0);

    // Construir XML SEPA
    const xml = this.construirXMLSepaDD(recibos, cabecera, fechaCreacion, fechaCobro, messageId, totalImporte);

    const nombreArchivo = `SEPA_DD_${fechaCreacion.toISOString().slice(0, 10).replace(/-/g, '')}_${messageId}.xml`;

    return {
      contenido: xml,
      nombreArchivo,
      formato: 'SEPA_DD',
      totalRegistros: recibos.length,
      totalImporte,
    };
  }

  /**
   * Construir XML SEPA Direct Debit
   */
  private construirXMLSepaDD(
    recibos: IRecibo[],
    cabecera: DatosCabeceraSEPA,
    fechaCreacion: Date,
    fechaCobro: Date,
    messageId: string,
    totalImporte: number
  ): string {
    const formatearImporte = (importe: number): string => importe.toFixed(2);
    const formatearFecha = (fecha: Date): string => fecha.toISOString().slice(0, 10);
    const formatearFechaHora = (fecha: Date): string => fecha.toISOString().replace(/\.\d{3}Z$/, 'Z');

    // Agrupar recibos por tipo de adeudo (FRST, RCUR, OOFF, FNAL)
    const gruposPorTipo: Record<string, IRecibo[]> = {};
    for (const recibo of recibos) {
      const tipo = recibo.mandatoSEPA?.tipoAdeudo || TipoAdeudoSEPA.RCUR;
      if (!gruposPorTipo[tipo]) gruposPorTipo[tipo] = [];
      gruposPorTipo[tipo].push(recibo);
    }

    let pmtInfBlocks = '';
    let pmtInfCount = 0;

    for (const [tipoAdeudo, recibosGrupo] of Object.entries(gruposPorTipo)) {
      const sumGrupo = recibosGrupo.reduce((s, r) => s + r.importe, 0);
      pmtInfCount++;

      pmtInfBlocks += `
    <PmtInf>
      <PmtInfId>${messageId}-${pmtInfCount}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${recibosGrupo.length}</NbOfTxs>
      <CtrlSum>${formatearImporte(sumGrupo)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>CORE</Cd>
        </LclInstrm>
        <SeqTp>${tipoAdeudo}</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${formatearFecha(fechaCobro)}</ReqdColltnDt>
      <Cdtr>
        <Nm>${this.escaparXML(cabecera.nombreEmpresa.substring(0, 70))}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${cabecera.cuentaBancariaEmpresa.replace(/\s/g, '').toUpperCase()}</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          <BIC>NOTPROVIDED</BIC>
        </FinInstnId>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${cabecera.nifEmpresa}${cabecera.sufijoPresentador || '000'}</Id>
              <SchmeNm>
                <Prtry>SEPA</Prtry>
              </SchmeNm>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>
      ${recibosGrupo.map((recibo, idx) => this.construirTransaccionSepaDD(recibo, idx + 1)).join('')}
    </PmtInf>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${messageId}</MsgId>
      <CreDtTm>${formatearFechaHora(fechaCreacion)}</CreDtTm>
      <NbOfTxs>${recibos.length}</NbOfTxs>
      <CtrlSum>${formatearImporte(totalImporte)}</CtrlSum>
      <InitgPty>
        <Nm>${this.escaparXML(cabecera.nombreEmpresa.substring(0, 70))}</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>${cabecera.nifEmpresa}</Id>
            </Othr>
          </OrgId>
        </Id>
      </InitgPty>
    </GrpHdr>${pmtInfBlocks}
  </CstmrDrctDbtInitn>
</Document>`;
  }

  /**
   * Construir transacción individual SEPA DD
   */
  private construirTransaccionSepaDD(recibo: IRecibo, index: number): string {
    const formatearImporte = (importe: number): string => importe.toFixed(2);
    const formatearFecha = (fecha: Date): string => new Date(fecha).toISOString().slice(0, 10);

    return `
      <DrctDbtTxInf>
        <PmtId>
          <EndToEndId>${recibo.numero}</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="EUR">${formatearImporte(recibo.importe)}</InstdAmt>
        <DrctDbtTx>
          <MndtRltdInf>
            <MndtId>${recibo.mandatoSEPA?.referencia}</MndtId>
            <DtOfSgntr>${formatearFecha(recibo.mandatoSEPA?.fechaFirma || new Date())}</DtOfSgntr>
          </MndtRltdInf>
        </DrctDbtTx>
        <DbtrAgt>
          <FinInstnId>
            ${recibo.bicCliente ? `<BIC>${recibo.bicCliente}</BIC>` : '<Othr><Id>NOTPROVIDED</Id></Othr>'}
          </FinInstnId>
        </DbtrAgt>
        <Dbtr>
          <Nm>${this.escaparXML((recibo.clienteNombre || '').substring(0, 70))}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>${recibo.ibanCliente?.replace(/\s/g, '').toUpperCase()}</IBAN>
          </Id>
        </DbtrAcct>
        <RmtInf>
          <Ustrd>${this.escaparXML(recibo.concepto.substring(0, 140))}</Ustrd>
        </RmtInf>
      </DrctDbtTxInf>`;
  }

  /**
   * Generar SEPA Credit Transfer (transferencias - pagos)
   * Formato ISO 20022 pain.001.001.03
   */
  async generarSEPACreditTransfer(
    vencimientoIds: string[],
    cabecera: DatosCabeceraSEPA,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<ResultadoGeneracion> {
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);

    const vencimientos = await VencimientoModel.find({
      _id: { $in: vencimientoIds.map(id => new Types.ObjectId(id)) },
      tipo: 'pago',
    }).lean();

    if (vencimientos.length === 0) {
      throw new AppError('No se encontraron vencimientos de pago para generar el fichero', 400);
    }

    // Validar que todos tienen IBAN
    for (const venc of vencimientos) {
      if (!venc.iban) {
        throw new AppError(`El vencimiento ${venc.numero} no tiene IBAN del proveedor`, 400);
      }
      if (!this.validarIBAN(venc.iban)) {
        throw new AppError(`El IBAN del proveedor en el vencimiento ${venc.numero} no es válido`, 400);
      }
    }

    const fechaCreacion = cabecera.fechaCreacion
      ? new Date(cabecera.fechaCreacion)
      : new Date();
    const fechaCobro = new Date(cabecera.fechaCobro);
    const messageId = cabecera.messageId || `SEPA-CT-${Date.now()}`;
    const totalImporte = vencimientos.reduce((sum, v) => sum + v.importePendiente, 0);

    const xml = this.construirXMLSepaCT(vencimientos, cabecera, fechaCreacion, fechaCobro, messageId, totalImporte);

    const nombreArchivo = `SEPA_CT_${fechaCreacion.toISOString().slice(0, 10).replace(/-/g, '')}_${messageId}.xml`;

    return {
      contenido: xml,
      nombreArchivo,
      formato: 'SEPA_CT',
      totalRegistros: vencimientos.length,
      totalImporte,
    };
  }

  /**
   * Construir XML SEPA Credit Transfer
   */
  private construirXMLSepaCT(
    vencimientos: IVencimiento[],
    cabecera: DatosCabeceraSEPA,
    fechaCreacion: Date,
    fechaCobro: Date,
    messageId: string,
    totalImporte: number
  ): string {
    const formatearImporte = (importe: number): string => importe.toFixed(2);
    const formatearFecha = (fecha: Date): string => fecha.toISOString().slice(0, 10);
    const formatearFechaHora = (fecha: Date): string => fecha.toISOString().replace(/\.\d{3}Z$/, 'Z');

    const transacciones = vencimientos.map((venc, idx) => `
        <CdtTrfTxInf>
          <PmtId>
            <EndToEndId>${venc.numero}</EndToEndId>
          </PmtId>
          <Amt>
            <InstdAmt Ccy="EUR">${formatearImporte(venc.importePendiente)}</InstdAmt>
          </Amt>
          <CdtrAgt>
            <FinInstnId>
              <Othr>
                <Id>NOTPROVIDED</Id>
              </Othr>
            </FinInstnId>
          </CdtrAgt>
          <Cdtr>
            <Nm>${this.escaparXML((venc.terceroNombre || '').substring(0, 70))}</Nm>
          </Cdtr>
          <CdtrAcct>
            <Id>
              <IBAN>${venc.iban?.replace(/\s/g, '').toUpperCase()}</IBAN>
            </Id>
          </CdtrAcct>
          <RmtInf>
            <Ustrd>${this.escaparXML((venc.documentoNumero || venc.numero || '').substring(0, 140))}</Ustrd>
          </RmtInf>
        </CdtTrfTxInf>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${messageId}</MsgId>
      <CreDtTm>${formatearFechaHora(fechaCreacion)}</CreDtTm>
      <NbOfTxs>${vencimientos.length}</NbOfTxs>
      <CtrlSum>${formatearImporte(totalImporte)}</CtrlSum>
      <InitgPty>
        <Nm>${this.escaparXML(cabecera.nombreEmpresa.substring(0, 70))}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${messageId}-1</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${vencimientos.length}</NbOfTxs>
      <CtrlSum>${formatearImporte(totalImporte)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${formatearFecha(fechaCobro)}</ReqdExctnDt>
      <Dbtr>
        <Nm>${this.escaparXML(cabecera.nombreEmpresa.substring(0, 70))}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${cabecera.cuentaBancariaEmpresa.replace(/\s/g, '').toUpperCase()}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <Othr>
            <Id>NOTPROVIDED</Id>
          </Othr>
        </FinInstnId>
      </DbtrAgt>
      ${transacciones}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
  }

  /**
   * Generar Norma 19 (legacy, algunos bancos aún lo usan)
   * Formato texto con posiciones fijas
   */
  async generarNorma19(
    reciboIds: string[],
    cabecera: DatosCabeceraN19,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<ResultadoGeneracion> {
    const ReciboModel = await getReciboModel(empresaId, dbConfig);

    const recibos = await ReciboModel.find({
      _id: { $in: reciboIds.map(id => new Types.ObjectId(id)) },
      empresaId: new Types.ObjectId(empresaId),
    }).lean();

    if (recibos.length === 0) {
      throw new AppError('No se encontraron recibos para generar el fichero', 400);
    }

    const fechaCobro = new Date(cabecera.fechaCobro);
    const fechaStr = this.formatearFechaN19(fechaCobro);
    const totalImporte = recibos.reduce((sum, r) => sum + r.importe, 0);

    let contenido = '';

    // Registro cabecera ordenante (80)
    contenido += this.construirRegistroN19_80(cabecera, fechaStr);

    // Registro cabecera de cliente (53)
    contenido += this.construirRegistroN19_53(cabecera);

    // Registros individuales (56) por cada recibo
    for (const recibo of recibos) {
      contenido += this.construirRegistroN19_56(recibo, cabecera);
    }

    // Registro total de cliente (58)
    contenido += this.construirRegistroN19_58(recibos, cabecera);

    // Registro total ordenante (59)
    contenido += this.construirRegistroN19_59(recibos, cabecera);

    // Registro total general (99)
    contenido += this.construirRegistroN19_99(recibos);

    const nombreArchivo = `N19_${fechaStr}_${Date.now()}.txt`;

    return {
      contenido,
      nombreArchivo,
      formato: 'N19',
      totalRegistros: recibos.length,
      totalImporte,
    };
  }

  /**
   * Formatear fecha para Norma 19 (DDMMAA)
   */
  private formatearFechaN19(fecha: Date): string {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear().toString().slice(-2);
    return `${dia}${mes}${año}`;
  }

  /**
   * Formatear importe para Norma 19 (10 dígitos, 2 decimales sin punto)
   */
  private formatearImporteN19(importe: number): string {
    return Math.round(importe * 100).toString().padStart(10, '0');
  }

  /**
   * Registro cabecera ordenante (código 80)
   */
  private construirRegistroN19_80(cabecera: DatosCabeceraN19, fechaStr: string): string {
    const ibanLimpio = cabecera.cuentaBancariaEmpresa.replace(/\s/g, '');
    const ccc = ibanLimpio.length > 4 ? ibanLimpio.slice(4) : ibanLimpio;

    let registro = '80'; // Código de registro
    registro += '19'; // Código de dato
    registro += cabecera.codigoOrdenante.padStart(10, '0').slice(0, 10); // NIF ordenante
    registro += cabecera.codigoOrdenante.padEnd(12, ' ').slice(0, 12); // Sufijo
    registro += fechaStr; // Fecha confección
    registro += '      '; // Libre
    registro += ccc.slice(0, 4); // Entidad
    registro += ccc.slice(4, 8); // Oficina
    registro += ccc.slice(10, 20); // Cuenta
    registro += ' '.repeat(8); // Libre
    registro += '01'; // Procedimiento
    registro += ' '.repeat(10); // Libre
    registro += '\r\n';

    return registro;
  }

  /**
   * Registro cabecera cliente (código 53)
   */
  private construirRegistroN19_53(cabecera: DatosCabeceraN19): string {
    const ibanLimpio = cabecera.cuentaBancariaEmpresa.replace(/\s/g, '');
    const ccc = ibanLimpio.length > 4 ? ibanLimpio.slice(4) : ibanLimpio;

    let registro = '53'; // Código de registro
    registro += '80'; // Código de dato
    registro += cabecera.codigoOrdenante.padStart(10, '0').slice(0, 10); // NIF ordenante
    registro += cabecera.codigoOrdenante.padEnd(12, ' ').slice(0, 12); // Sufijo
    registro += ccc.slice(0, 4); // Entidad cliente
    registro += ccc.slice(4, 8); // Oficina cliente
    registro += ccc.slice(10, 20); // Cuenta cliente
    registro += ' '.repeat(28); // Libre
    registro += '\r\n';

    return registro;
  }

  /**
   * Registro individual (código 56)
   */
  private construirRegistroN19_56(recibo: IRecibo, cabecera: DatosCabeceraN19): string {
    const ibanClienteLimpio = recibo.ibanCliente?.replace(/\s/g, '') || '';
    const cccCliente = ibanClienteLimpio.length > 4 ? ibanClienteLimpio.slice(4) : ibanClienteLimpio.padEnd(20, '0');

    let registro = '56'; // Código de registro
    registro += '80'; // Código de dato
    registro += cabecera.codigoOrdenante.padStart(10, '0').slice(0, 10); // NIF ordenante
    registro += cabecera.codigoOrdenante.padEnd(12, ' ').slice(0, 12); // Sufijo
    registro += (recibo.clienteNIF || '').padEnd(12, ' ').slice(0, 12); // Referencia interna
    registro += recibo.numero.padEnd(40, ' ').slice(0, 40); // Nombre/razón social
    registro += cccCliente.slice(0, 4); // Entidad cliente
    registro += cccCliente.slice(4, 8); // Oficina cliente
    registro += cccCliente.slice(8, 10); // DC
    registro += cccCliente.slice(10, 20); // Cuenta cliente
    registro += this.formatearImporteN19(recibo.importe); // Importe
    registro += ' '.repeat(16); // Libre
    registro += recibo.concepto.padEnd(40, ' ').slice(0, 40); // Concepto
    registro += '\r\n';

    return registro;
  }

  /**
   * Registro total cliente (código 58)
   */
  private construirRegistroN19_58(recibos: IRecibo[], cabecera: DatosCabeceraN19): string {
    const ibanLimpio = cabecera.cuentaBancariaEmpresa.replace(/\s/g, '');
    const ccc = ibanLimpio.length > 4 ? ibanLimpio.slice(4) : ibanLimpio;
    const totalImporte = recibos.reduce((sum, r) => sum + r.importe, 0);

    let registro = '58'; // Código de registro
    registro += '80'; // Código de dato
    registro += cabecera.codigoOrdenante.padStart(10, '0').slice(0, 10); // NIF ordenante
    registro += cabecera.codigoOrdenante.padEnd(12, ' ').slice(0, 12); // Sufijo
    registro += ' '.repeat(12); // Libre
    registro += ' '.repeat(40); // Libre
    registro += ccc.slice(0, 4); // Entidad
    registro += ccc.slice(4, 8); // Oficina
    registro += this.formatearImporteN19(totalImporte); // Suma de importes
    registro += ' '.repeat(6); // Libre
    registro += recibos.length.toString().padStart(10, '0'); // Número de domiciliaciones
    registro += ' '.repeat(20); // Libre
    registro += '\r\n';

    return registro;
  }

  /**
   * Registro total ordenante (código 59)
   */
  private construirRegistroN19_59(recibos: IRecibo[], cabecera: DatosCabeceraN19): string {
    const totalImporte = recibos.reduce((sum, r) => sum + r.importe, 0);

    let registro = '59'; // Código de registro
    registro += '80'; // Código de dato
    registro += cabecera.codigoOrdenante.padStart(10, '0').slice(0, 10); // NIF ordenante
    registro += cabecera.codigoOrdenante.padEnd(12, ' ').slice(0, 12); // Sufijo
    registro += ' '.repeat(20); // Libre
    registro += ' '.repeat(40); // Libre
    registro += this.formatearImporteN19(totalImporte); // Suma total ordenante
    registro += ' '.repeat(6); // Libre
    registro += recibos.length.toString().padStart(10, '0'); // Número de registros individuales
    registro += ' '.repeat(20); // Libre
    registro += '\r\n';

    return registro;
  }

  /**
   * Registro total general (código 99)
   */
  private construirRegistroN19_99(recibos: IRecibo[]): string {
    const totalImporte = recibos.reduce((sum, r) => sum + r.importe, 0);

    let registro = '99'; // Código de registro
    registro += '80'; // Código de dato
    registro += ' '.repeat(10); // Libre
    registro += ' '.repeat(12); // Libre
    registro += ' '.repeat(20); // Libre
    registro += ' '.repeat(40); // Libre
    registro += this.formatearImporteN19(totalImporte); // Suma total
    registro += ' '.repeat(6); // Libre
    registro += '001'; // Número de ordenantes (1)
    registro += '001'; // Número de cuentas de clientes
    registro += recibos.length.toString().padStart(10, '0'); // Número total de domiciliaciones
    registro += ' '.repeat(12); // Libre
    registro += '\r\n';

    return registro;
  }

  /**
   * Escapar caracteres especiales XML
   */
  private escaparXML(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const ficherosBancariosService = new FicherosBancariosService();
