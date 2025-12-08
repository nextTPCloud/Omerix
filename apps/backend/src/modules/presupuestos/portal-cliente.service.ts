import mongoose from 'mongoose';
import crypto from 'crypto';
import { IPresupuesto, EstadoPresupuesto, IRespuestaCliente } from './Presupuesto';
import Empresa, { IDatabaseConfig } from '@/models/Empresa';
import { getPresupuestoModel, getClienteModel } from '@/utils/dynamic-models.helper';

// ============================================
// SERVICIO PORTAL CLIENTE
// ============================================

export class PortalClienteService {
  /**
   * Generar token único para acceso al portal
   */
  private generarToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generar URL del portal
   */
  private generarUrlPortal(token: string, baseUrl: string): string {
    return `${baseUrl}/portal/presupuesto/${token}`;
  }

  /**
   * Generar enlace de acceso al portal para un presupuesto
   */
  async generarEnlacePortal(
    presupuestoId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    baseUrl: string = process.env.FRONTEND_URL || 'http://localhost:3000'
  ): Promise<{ token: string; url: string }> {
    const PresupuestoModel = await getPresupuestoModel(empresaId, dbConfig);

    const presupuesto = await PresupuestoModel.findById(presupuestoId);
    if (!presupuesto) {
      throw new Error('Presupuesto no encontrado');
    }

    // Generar nuevo token si no existe o si el anterior expiró
    const token = presupuesto.tokenAccesoPortal || this.generarToken();
    const url = this.generarUrlPortal(token, baseUrl);

    // Actualizar presupuesto con el token
    await PresupuestoModel.findByIdAndUpdate(presupuestoId, {
      tokenAccesoPortal: token,
      tokenExpirado: false,
      urlPortal: url,
    });

    return { token, url };
  }

  /**
   * Obtener presupuesto por token de acceso (público)
   */
  async obtenerPorToken(
    token: string
  ): Promise<{
    presupuesto: any;
    empresa: any;
    puedeResponder: boolean;
  } | null> {
    // Buscar en todas las empresas el presupuesto con este token
    const empresas = await Empresa.find({ activa: true }).lean();

    for (const empresa of empresas) {
      try {
        const dbConfig: IDatabaseConfig = empresa.configuracion.baseDatos;
        const PresupuestoModel = await getPresupuestoModel(String(empresa._id), dbConfig);

        const presupuesto = await PresupuestoModel.findOne({
          tokenAccesoPortal: token,
          tokenExpirado: { $ne: true },
        })
          .select('-observaciones -notasSeguimiento -historial -recordatoriosEnviados -costeUnitario -costeTotalLinea -margenUnitario -margenPorcentaje -margenTotalLinea -totales.costeTotalMateriales -totales.costeTotalServicios -totales.costeTotalKits -totales.costeTotal -totales.margenBruto -totales.margenPorcentaje')
          .lean();

        if (presupuesto) {
          // Verificar si puede responder
          const puedeResponder =
            !presupuesto.respuestaCliente?.fecha &&
            presupuesto.estado !== EstadoPresupuesto.ACEPTADO &&
            presupuesto.estado !== EstadoPresupuesto.RECHAZADO &&
            presupuesto.estado !== EstadoPresupuesto.CADUCADO &&
            presupuesto.estado !== EstadoPresupuesto.CONVERTIDO &&
            new Date() <= new Date(presupuesto.fechaValidez);

          // Obtener info de la empresa
          const empresaInfo = {
            nombre: empresa.nombre,
            nif: empresa.nif,
            logo: empresa.configuracion?.personalizacion?.logotipoUrl,
            email: empresa.email,
            telefono: empresa.telefono,
            direccion: empresa.direccionFiscal,
            web: empresa.web,
          };

          // Limpiar datos sensibles de las líneas
          const lineasLimpias = (presupuesto.lineas || []).map((linea: any) => ({
            ...linea,
            costeUnitario: undefined,
            costeTotalLinea: undefined,
            margenUnitario: undefined,
            margenPorcentaje: undefined,
            margenTotalLinea: undefined,
            notasInternas: undefined,
          }));

          return {
            presupuesto: {
              ...presupuesto,
              lineas: lineasLimpias,
            },
            empresa: empresaInfo,
            puedeResponder,
          };
        }
      } catch (error) {
        // Continuar con la siguiente empresa
        continue;
      }
    }

    return null;
  }

  /**
   * Registrar respuesta del cliente
   */
  async registrarRespuesta(
    token: string,
    respuesta: {
      aceptado: boolean;
      comentarios?: string;
      nombreFirmante?: string;
    },
    infoCliente: {
      ip?: string;
      userAgent?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    // Buscar el presupuesto por token
    const empresas = await Empresa.find({ activa: true }).lean();

    for (const empresa of empresas) {
      try {
        const dbConfig: IDatabaseConfig = empresa.configuracion.baseDatos;
        const PresupuestoModel = await getPresupuestoModel(String(empresa._id), dbConfig);

        const presupuesto = await PresupuestoModel.findOne({
          tokenAccesoPortal: token,
          tokenExpirado: { $ne: true },
        });

        if (presupuesto) {
          // Verificar que puede responder
          if (presupuesto.respuestaCliente?.fecha) {
            return {
              success: false,
              message: 'Este presupuesto ya ha sido respondido',
            };
          }

          if (new Date() > new Date(presupuesto.fechaValidez)) {
            return {
              success: false,
              message: 'Este presupuesto ha caducado',
            };
          }

          // Registrar la respuesta
          const respuestaCliente: IRespuestaCliente = {
            fecha: new Date(),
            aceptado: respuesta.aceptado,
            comentarios: respuesta.comentarios,
            nombreFirmante: respuesta.nombreFirmante,
            ipCliente: infoCliente.ip,
            userAgent: infoCliente.userAgent,
          };

          // Actualizar estado según respuesta
          const nuevoEstado = respuesta.aceptado
            ? EstadoPresupuesto.ACEPTADO
            : EstadoPresupuesto.RECHAZADO;

          await PresupuestoModel.findByIdAndUpdate(presupuesto._id, {
            respuestaCliente,
            estado: nuevoEstado,
            fechaRespuesta: new Date(),
            tokenExpirado: true, // Invalidar token después de responder
            $push: {
              historial: {
                fecha: new Date(),
                usuarioId: presupuesto.creadoPor, // Sistema
                accion: respuesta.aceptado ? 'Aceptado por cliente' : 'Rechazado por cliente',
                descripcion: `El cliente ${respuesta.nombreFirmante || 'desconocido'} ha ${respuesta.aceptado ? 'aceptado' : 'rechazado'} el presupuesto a través del portal.${respuesta.comentarios ? ` Comentarios: ${respuesta.comentarios}` : ''}`,
              },
            },
          });

          // Enviar notificación por email
          try {
            await this.enviarNotificacionRespuesta(presupuesto, respuesta.aceptado, empresa);
          } catch (emailError) {
            console.error('Error al enviar notificación de respuesta:', emailError);
          }

          return {
            success: true,
            message: respuesta.aceptado
              ? 'Presupuesto aceptado correctamente. Gracias por su confianza.'
              : 'Hemos registrado su respuesta. Gracias por su tiempo.',
          };
        }
      } catch (error) {
        continue;
      }
    }

    return {
      success: false,
      message: 'Token inválido o presupuesto no encontrado',
    };
  }

  /**
   * Enviar notificación de respuesta
   */
  private async enviarNotificacionRespuesta(
    presupuesto: IPresupuesto,
    aceptado: boolean,
    empresa: any
  ): Promise<void> {
    // Notificar al creador del presupuesto
    // TODO: Implementar cuando se tenga el sistema de notificaciones/emails completo
    console.log(`[Portal] Respuesta registrada para presupuesto ${presupuesto.codigo}: ${aceptado ? 'ACEPTADO' : 'RECHAZADO'}`);
  }

  /**
   * Invalidar token de acceso
   */
  async invalidarToken(
    presupuestoId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig
  ): Promise<void> {
    const PresupuestoModel = await getPresupuestoModel(empresaId, dbConfig);
    await PresupuestoModel.findByIdAndUpdate(presupuestoId, {
      tokenExpirado: true,
    });
  }

  /**
   * Regenerar token de acceso
   */
  async regenerarToken(
    presupuestoId: string,
    empresaId: string,
    dbConfig: IDatabaseConfig,
    baseUrl: string = process.env.FRONTEND_URL || 'http://localhost:3000'
  ): Promise<{ token: string; url: string }> {
    const PresupuestoModel = await getPresupuestoModel(empresaId, dbConfig);

    const token = this.generarToken();
    const url = this.generarUrlPortal(token, baseUrl);

    await PresupuestoModel.findByIdAndUpdate(presupuestoId, {
      tokenAccesoPortal: token,
      tokenExpirado: false,
      urlPortal: url,
    });

    return { token, url };
  }
}

export const portalClienteService = new PortalClienteService();
