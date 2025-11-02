import { Request, Response } from 'express';
import { RedsysService } from './redsys.service';

const redsysService = new RedsysService();

/**
 * Webhook/Notificación de Redsys
 * Endpoint: POST /api/pagos/redsys/webhook
 * 
 * IMPORTANTE: Este endpoint NO debe tener middleware de autenticación
 * porque Redsys lo llama directamente
 * 
 * Redsys envía los datos mediante POST en formato form-urlencoded
 */
export const handleRedsysWebhook = async (req: Request, res: Response) => {
  try {
    console.log('🔔 Redsys webhook recibido');

    const { Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature } = req.body;

    // Validar que tengamos todos los parámetros necesarios
    if (!Ds_SignatureVersion || !Ds_MerchantParameters || !Ds_Signature) {
      console.error('⚠️ Faltan parámetros en la notificación de Redsys');
      return res.status(400).send('KO');
    }

    // Confirmar el pago
    await redsysService.confirmPayment({
      Ds_SignatureVersion,
      Ds_MerchantParameters,
      Ds_Signature,
    });

    // Redsys espera que devolvamos "OK" si todo fue bien
    console.log('✅ Notificación de Redsys procesada correctamente');
    res.status(200).send('OK');
  } catch (error: any) {
    console.error('❌ Error procesando notificación de Redsys:', error);
    
    // Redsys espera "KO" si hay algún error
    res.status(500).send('KO');
  }
};

/**
 * Respuesta OK - Usuario vuelve después del pago exitoso
 * Endpoint: GET /api/pagos/redsys/ok
 * 
 * Esta es la URL a la que Redsys redirige al usuario después de un pago exitoso
 */
export const handleOkResponse = async (req: Request, res: Response) => {
  try {
    console.log('✅ Usuario redirigido a página OK de Redsys');

    // Aquí puedes extraer parámetros si Redsys los envía
    const { Ds_MerchantParameters } = req.query;

    // En una aplicación real, podrías redirigir al frontend
    // res.redirect(`${process.env.FRONTEND_URL}/pagos/success?params=${Ds_MerchantParameters}`);

    res.json({
      success: true,
      message: 'Pago procesado correctamente. Recibirás un email de confirmación.',
    });
  } catch (error: any) {
    console.error('Error en respuesta OK de Redsys:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error procesando respuesta',
    });
  }
};

/**
 * Respuesta KO - Usuario cancela o falla el pago
 * Endpoint: GET /api/pagos/redsys/ko
 * 
 * Esta es la URL a la que Redsys redirige al usuario si cancela o falla el pago
 */
export const handleKoResponse = async (req: Request, res: Response) => {
  try {
    console.log('⚠️ Usuario redirigido a página KO de Redsys');

    const { Ds_MerchantParameters } = req.query;

    // Podrías decodificar los parámetros para obtener más info del error
    // const params = JSON.parse(Buffer.from(Ds_MerchantParameters as string, 'base64').toString('utf8'));

    // En una aplicación real, podrías redirigir al frontend
    // res.redirect(`${process.env.FRONTEND_URL}/pagos/error?params=${Ds_MerchantParameters}`);

    res.json({
      success: false,
      message: 'Pago cancelado o denegado. Por favor, inténtalo de nuevo.',
    });
  } catch (error: any) {
    console.error('Error en respuesta KO de Redsys:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error procesando respuesta',
    });
  }
};