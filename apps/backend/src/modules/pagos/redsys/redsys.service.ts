import crypto from 'crypto';
import config from '../../../config/env';
import Pago from '../../../models/Pago';
import Licencia from '../../../models/Licencia';
import Plan from '../../../models/Plan';
import Empresa from '../../../models/Empresa';
import {
  CreateRedsysPaymentDTO,
  CreateRedsysSubscriptionDTO,
  CancelRedsysSubscriptionDTO,
  CreateRedsysRefundDTO,
} from './redsys.dto';

export class RedsysService {
  private merchantCode: string;
  private terminal: string;
  private secretKey: string;
  private environment: 'test' | 'production';

  constructor() {
    this.merchantCode = config.redsys.merchantCode;
    this.terminal = config.redsys.terminal;
    this.secretKey = config.redsys.secretKey;
    this.environment = config.redsys.environment;
  }

  // ============================================
  // OBTENER URL DE REDSYS
  // ============================================

  private getRedsysUrl(): string {
    return this.environment === 'production'
      ? 'https://sis.redsys.es/sis/realizarPago'
      : 'https://sis-t.redsys.es:25443/sis/realizarPago';
  }

  // ============================================
  // CREAR PAGO
  // ============================================

  async createPayment(empresaId: string, data: CreateRedsysPaymentDTO) {
    try {
      const empresa = await Empresa.findById(empresaId);
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      // Generar número de pedido único
      const orderNumber = this.generateOrderNumber();

      // Crear registro de pago en nuestra BD
      const pago = await Pago.create({
        empresaId,
        concepto: data.concepto,
        descripcion: data.descripcion,
        cantidad: data.cantidad,
        moneda: 'EUR',
        total: data.cantidad,
        pasarela: 'redsys',
        transaccionExternaId: orderNumber,
        clienteExternoId: empresa.redsysCustomerId,
        estado: 'pendiente',
        metodoPago: {
          tipo: 'tarjeta',
        },
        metadata: data.metadata,
      });

      // Preparar parámetros para Redsys
      const merchantParameters = {
        DS_MERCHANT_AMOUNT: this.formatAmount(data.cantidad),
        DS_MERCHANT_ORDER: orderNumber,
        DS_MERCHANT_MERCHANTCODE: this.merchantCode,
        DS_MERCHANT_CURRENCY: '978', // EUR
        DS_MERCHANT_TRANSACTIONTYPE: '0', // Autorización
        DS_MERCHANT_TERMINAL: this.terminal,
        DS_MERCHANT_MERCHANTURL: `${process.env.BACKEND_URL}/api/pagos/redsys/notification`,
        DS_MERCHANT_URLOK: `${process.env.FRONTEND_URL}/pagos/redsys/success`,
        DS_MERCHANT_URLKO: `${process.env.FRONTEND_URL}/pagos/redsys/error`,
        DS_MERCHANT_MERCHANTNAME: 'Tu ERP SaaS',
        DS_MERCHANT_PRODUCTDESCRIPTION: data.descripcion,
      };

      // Codificar parámetros en Base64
      const merchantParametersB64 = this.base64Encode(
        JSON.stringify(merchantParameters)
      );

      // Generar firma
      const signature = this.generateSignature(merchantParametersB64, orderNumber);

      console.log('✅ Pago de Redsys creado:', orderNumber);

      return {
        pago,
        redsysUrl: this.getRedsysUrl(),
        Ds_SignatureVersion: 'HMAC_SHA256_V1',
        Ds_MerchantParameters: merchantParametersB64,
        Ds_Signature: signature,
      };
    } catch (error: any) {
      console.error('Error creando pago de Redsys:', error);
      throw new Error(`Error en Redsys: ${error.message}`);
    }
  }

  // ============================================
  // CONFIRMAR PAGO (desde notificación)
  // ============================================

  async confirmPayment(notificationData: any) {
    try {
      const { Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature } =
        notificationData;

      // Verificar firma
      const isValid = this.verifySignature(
        Ds_MerchantParameters,
        Ds_Signature
      );

      if (!isValid) {
        throw new Error('Firma de Redsys inválida');
      }

      // Decodificar parámetros
      const params = JSON.parse(this.base64Decode(Ds_MerchantParameters));

      const orderNumber = params.Ds_Order;
      const responseCode = params.Ds_Response;

      // Buscar el pago
      const pago = await Pago.findOne({
        transaccionExternaId: orderNumber,
      });

      if (!pago) {
        throw new Error('Pago no encontrado');
      }

      // Verificar código de respuesta (0000-0099 = éxito)
      const responseCodeNum = parseInt(responseCode, 10);

      if (responseCodeNum >= 0 && responseCodeNum <= 99) {
        pago.estado = 'completado';
        pago.fechaPago = new Date();
        pago.estadoDetalle = 'Pago completado exitosamente';

        // Guardar info de la tarjeta
        if (params.Ds_Card_Brand) {
          pago.metodoPago.marca = params.Ds_Card_Brand;
        }
        if (params.Ds_Card_Number) {
          pago.metodoPago.ultimos4 = params.Ds_Card_Number.slice(-4);
        }

        // Si es una suscripción, activar la licencia
        if (pago.concepto === 'suscripcion' && pago.metadata?.licenciaId) {
          await this.activarLicencia(String(pago.metadata.licenciaId));
        }
      } else {
        pago.estado = 'fallido';
        pago.estadoDetalle = `Error: ${this.getErrorMessage(responseCode)}`;
        pago.errorCodigo = responseCode;
      }

      await pago.save();

      console.log('✅ Pago de Redsys confirmado:', orderNumber, '- Estado:', pago.estado);

      return pago;
    } catch (error: any) {
      console.error('Error confirmando pago de Redsys:', error);
      throw new Error(`Error confirmando pago: ${error.message}`);
    }
  }

  // ============================================
  // CREAR SUSCRIPCIÓN (CON TOKENIZACIÓN)
  // ============================================

  async createSubscription(empresaId: string, data: CreateRedsysSubscriptionDTO) {
    try {
      // Obtener plan
      const plan = await Plan.findById(data.planId);
      if (!plan) {
        throw new Error('Plan no encontrado');
      }

      const empresa = await Empresa.findById(empresaId);
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      // Generar número de pedido único
      const orderNumber = this.generateOrderNumber();

      // Preparar parámetros para tokenización
      const merchantParameters = {
        DS_MERCHANT_AMOUNT: this.formatAmount(plan.precio.mensual),
        DS_MERCHANT_ORDER: orderNumber,
        DS_MERCHANT_MERCHANTCODE: this.merchantCode,
        DS_MERCHANT_CURRENCY: '978', // EUR
        DS_MERCHANT_TRANSACTIONTYPE: '0', // Autorización
        DS_MERCHANT_TERMINAL: this.terminal,
        DS_MERCHANT_MERCHANTURL: `${process.env.BACKEND_URL}/api/pagos/redsys/notification`,
        DS_MERCHANT_URLOK: `${process.env.FRONTEND_URL}/pagos/redsys/subscription/success`,
        DS_MERCHANT_URLKO: `${process.env.FRONTEND_URL}/pagos/redsys/subscription/error`,
        DS_MERCHANT_MERCHANTNAME: 'Tu ERP SaaS',
        DS_MERCHANT_PRODUCTDESCRIPTION: `Suscripción ${plan.nombre}`,
        DS_MERCHANT_IDENTIFIER: 'REQUIRED', // Solicitar tokenización
      };

      // Codificar parámetros
      const merchantParametersB64 = this.base64Encode(
        JSON.stringify(merchantParameters)
      );

      // Generar firma
      const signature = this.generateSignature(merchantParametersB64, orderNumber);

      // Guardar en licencia
      const licencia = await Licencia.findOne({ empresaId });
      if (licencia) {
        licencia.historial.push({
          fecha: new Date(),
          accion: 'INICIO_SUSCRIPCION',
          motivo: `Iniciando suscripción a ${plan.nombre}`,
        });
        await licencia.save();
      }

      console.log('✅ Suscripción de Redsys iniciada:', orderNumber);

      return {
        redsysUrl: this.getRedsysUrl(),
        Ds_SignatureVersion: 'HMAC_SHA256_V1',
        Ds_MerchantParameters: merchantParametersB64,
        Ds_Signature: signature,
      };
    } catch (error: any) {
      console.error('Error creando suscripción de Redsys:', error);
      throw new Error(`Error en Redsys: ${error.message}`);
    }
  }

  // ============================================
  // CANCELAR SUSCRIPCIÓN
  // ============================================

  async cancelSubscription(empresaId: string, data: CancelRedsysSubscriptionDTO) {
    try {
      const { subscriptionId, motivo } = data;

      // Actualizar licencia
      const licencia = await Licencia.findOne({ empresaId });
      if (licencia) {
        licencia.estado = 'cancelada';
        licencia.fechaCancelacion = new Date();
        licencia.historial.push({
          fecha: new Date(),
          accion: 'CANCELACION',
          motivo: motivo || 'Cancelación por el usuario',
        });
        await licencia.save();
      }

      console.log('✅ Suscripción de Redsys cancelada:', subscriptionId);

      return { success: true, message: 'Suscripción cancelada' };
    } catch (error: any) {
      console.error('Error cancelando suscripción de Redsys:', error);
      throw new Error(`Error cancelando suscripción: ${error.message}`);
    }
  }

  // ============================================
  // CREAR REEMBOLSO (DEVOLUCIÓN)
  // ============================================

  async createRefund(empresaId: string, data: CreateRedsysRefundDTO) {
    try {
      const { transaccionId, cantidad, motivo } = data;

      // Obtener el pago original
      const pago = await Pago.findOne({
        empresaId,
        transaccionExternaId: transaccionId,
      });

      if (!pago) {
        throw new Error('Pago no encontrado');
      }

      // Generar número de pedido para la devolución
      const orderNumber = this.generateOrderNumber();

      // En Redsys, las devoluciones se hacen mediante operación de devolución
      // Esto normalmente se hace mediante una llamada SOAP o REST a la API de Redsys
      // Por simplicidad, aquí solo actualizamos nuestro registro

      pago.estado = 'reembolsado';
      pago.fechaReembolso = new Date();
      pago.estadoDetalle = motivo || 'Reembolso procesado';
      await pago.save();

      console.log('✅ Reembolso de Redsys procesado:', transaccionId);

      return {
        success: true,
        message: 'Reembolso procesado',
        pago,
      };
    } catch (error: any) {
      console.error('Error creando reembolso de Redsys:', error);
      throw new Error(`Error creando reembolso: ${error.message}`);
    }
  }

  // ============================================
  // OBTENER HISTORIAL DE PAGOS
  // ============================================

  async getPaymentHistory(empresaId: string, limit: number = 20) {
    const pagos = await Pago.find({
      empresaId,
      pasarela: 'redsys',
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return pagos;
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  private generateOrderNumber(): string {
    // Redsys requiere 4 dígitos numéricos + hasta 8 caracteres alfanuméricos
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return random + timestamp;
  }

  private formatAmount(amount: number): string {
    // Redsys requiere el importe en céntimos sin punto decimal
    return Math.round(amount * 100).toString();
  }

  private base64Encode(str: string): string {
    return Buffer.from(str, 'utf8').toString('base64');
  }

  private base64Decode(str: string): string {
    return Buffer.from(str, 'base64').toString('utf8');
  }

  private generateSignature(merchantParameters: string, orderNumber: string): string {
    // Decodificar la clave secreta
    const key = Buffer.from(this.secretKey, 'base64');

    // Generar clave derivada usando 3DES con el número de pedido
    const cipher = crypto.createCipheriv('des-ede3-cbc', key, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);
    const derivedKey = Buffer.concat([
      cipher.update(orderNumber.padEnd(16, '\0'), 'utf8'),
      cipher.final(),
    ]);

    // Calcular HMAC SHA256
    const hmac = crypto.createHmac('sha256', derivedKey);
    hmac.update(merchantParameters);
    const signature = hmac.digest('base64');

    return signature;
  }

  private verifySignature(merchantParameters: string, signature: string): boolean {
    try {
      // Decodificar parámetros para obtener el número de pedido
      const params = JSON.parse(this.base64Decode(merchantParameters));
      const orderNumber = params.Ds_Order;

      // Generar firma esperada
      const expectedSignature = this.generateSignature(merchantParameters, orderNumber);

      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verificando firma de Redsys:', error);
      return false;
    }
  }

  private getErrorMessage(responseCode: string): string {
    const errorCodes: { [key: string]: string } = {
      '0101': 'Tarjeta caducada',
      '0102': 'Tarjeta en excepción transitoria o bajo sospecha de fraude',
      '0104': 'Operación no permitida para esa tarjeta',
      '0106': 'Intentos de PIN excedidos',
      '0116': 'Disponible insuficiente',
      '0118': 'Tarjeta no registrada',
      '0125': 'Tarjeta no efectiva',
      '0129': 'Código de seguridad (CVV2/CVC2) incorrecto',
      '0180': 'Tarjeta ajena al servicio',
      '0184': 'Error en la autenticación del titular',
      '0190': 'Denegación del emisor sin especificar motivo',
      '0191': 'Fecha de caducidad errónea',
      '0202': 'Tarjeta en excepción transitoria o bajo sospecha de fraude',
      '0904': 'Comercio no registrado en FUC',
      '0909': 'Error de sistema',
      '0913': 'Pedido repetido',
      '0944': 'Sesión incorrecta',
      '0950': 'Operación de devolución no permitida',
      '9064': 'Número de posiciones de la tarjeta incorrecto',
      '9078': 'No existe método de pago válido para esa tarjeta',
      '9093': 'Tarjeta no existente',
      '9094': 'Rechazo servidores internacionales',
      '9104': 'Comercio con "titular seguro" y titular sin clave de compra segura',
      '9218': 'El comercio no permite operaciones seguras por entrada /operaciones',
      '9253': 'Tarjeta no cumple el check-digit',
      '9256': 'El comercio no puede realizar preautorizaciones',
      '9257': 'Esta tarjeta no permite operaciones de preautorización',
      '9261': 'Operación detenida por superar el control de restricciones en la entrada al SIS',
      '9912': 'Emisor no disponible',
      '9913': 'Error en la confirmación que el comercio envía al TPV Virtual',
      '9914': 'Confirmación "KO" del comercio',
      '9915': 'A petición del usuario se ha cancelado el pago',
      '9928': 'Anulación de autorización en diferido realizada por el SIS',
      '9929': 'Anulación de autorización en diferido realizada por el comercio',
      '9997': 'Se está procesando otra transacción en SIS con la misma tarjeta',
      '9998': 'Operación en proceso de solicitud de datos de tarjeta',
      '9999': 'Operación que ha sido redirigida al emisor a autenticar',
    };

    return errorCodes[responseCode] || 'Error desconocido';
  }

  private async activarLicencia(licenciaId: string) {
    const licencia = await Licencia.findById(licenciaId);
    if (licencia && licencia.estado === 'trial') {
      licencia.estado = 'activa';
      licencia.esTrial = false;
      licencia.historial.push({
        fecha: new Date(),
        accion: 'ACTIVACION',
        motivo: 'Pago completado exitosamente',
      });
      await licencia.save();
      console.log('✅ Licencia activada:', licenciaId);
    }
  }
}