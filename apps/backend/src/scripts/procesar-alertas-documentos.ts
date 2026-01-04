import mongoose from 'mongoose';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { recordatoriosUnificadosService } from '../modules/recordatorios/recordatorios.service';
import { Recordatorio, TipoRecordatorio } from '../modules/recordatorios/Recordatorio';
import Empresa from '../modules/empresa/Empresa';
import { getDynamicModel } from '../utils/dynamic-models.helper';

/**
 * Script para procesar alertas automaticas de documentos
 * Ejecutar: npm run alertas:documentos
 *
 * Revisa:
 * - Presupuestos proximos a expirar (3 dias antes)
 * - Presupuestos enviados sin respuesta (7 dias despues)
 * - Facturas proximas a vencer (5 dias antes)
 * - Facturas vencidas
 */
async function procesarAlertasDocumentos() {
  try {
    logger.info('Iniciando procesamiento de alertas de documentos...\n');

    await mongoose.connect(config.database.uri);
    logger.info('Conectado a DB principal\n');

    // Obtener todas las empresas activas
    const empresas = await Empresa.find({ activo: true }).lean();
    logger.info('Empresas a procesar: ' + empresas.length + '\n');

    let totalAlertas = 0;

    for (const empresa of empresas) {
      try {
        if (!empresa.databaseConfig) continue;

        logger.info('Procesando empresa: ' + empresa.nombre);

        // Conectar a la BD de la empresa
        const Presupuesto = await getDynamicModel(
          empresa._id.toString(),
          empresa.databaseConfig as any,
          'Presupuesto',
          {
            numero: String,
            cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
            fechaValidez: Date,
            total: Number,
            estado: String,
            creadoPor: mongoose.Schema.Types.ObjectId,
            fechaEnvio: Date,
          }
        );

        const Factura = await getDynamicModel(
          empresa._id.toString(),
          empresa.databaseConfig as any,
          'Factura',
          {
            numero: String,
            cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
            fechaVencimiento: Date,
            total: Number,
            pendiente: Number,
            estado: String,
            creadoPor: mongoose.Schema.Types.ObjectId,
          }
        );

        const ahora = new Date();

        // ============================================
        // PRESUPUESTOS PROXIMOS A EXPIRAR
        // ============================================
        const fechaLimiteExpiracion = new Date();
        fechaLimiteExpiracion.setDate(fechaLimiteExpiracion.getDate() + 3);

        const presupuestosProximosExpirar = await Presupuesto.find({
          estado: { $in: ['pendiente', 'enviado'] },
          fechaValidez: { $lte: fechaLimiteExpiracion, $gte: ahora },
        }).populate('cliente creadoPor').lean();

        for (const presupuesto of presupuestosProximosExpirar as any[]) {
          // Verificar si ya existe un recordatorio para este presupuesto
          const existeRecordatorio = await Recordatorio.findOne({
            empresaId: empresa._id,
            tipo: TipoRecordatorio.PRESUPUESTO_EXPIRACION,
            entidadId: presupuesto._id,
            estado: { $nin: ['completado', 'descartado'] },
          });

          if (!existeRecordatorio && presupuesto.creadoPor) {
            const diasRestantes = Math.ceil(
              (new Date(presupuesto.fechaValidez).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
            );

            await recordatoriosUnificadosService.crearAlertaPresupuestoExpiracion(
              empresa._id.toString(),
              presupuesto.creadoPor._id?.toString() || presupuesto.creadoPor.toString(),
              {
                id: presupuesto._id.toString(),
                numero: presupuesto.numero,
                clienteNombre: presupuesto.cliente?.nombreComercial || presupuesto.cliente?.nombre || 'Cliente',
                fechaValidez: presupuesto.fechaValidez,
                total: presupuesto.total || 0,
                diasRestantes,
              }
            );
            totalAlertas++;
            logger.info('  Alerta presupuesto expiracion: ' + presupuesto.numero);
          }
        }

        // ============================================
        // PRESUPUESTOS SIN RESPUESTA (7 dias)
        // ============================================
        const fechaLimiteSeguimiento = new Date();
        fechaLimiteSeguimiento.setDate(fechaLimiteSeguimiento.getDate() - 7);

        const presupuestosSinRespuesta = await Presupuesto.find({
          estado: 'enviado',
          fechaEnvio: { $lte: fechaLimiteSeguimiento },
        }).populate('cliente creadoPor').lean();

        for (const presupuesto of presupuestosSinRespuesta as any[]) {
          const existeRecordatorio = await Recordatorio.findOne({
            empresaId: empresa._id,
            tipo: TipoRecordatorio.PRESUPUESTO_SEGUIMIENTO,
            entidadId: presupuesto._id,
            estado: { $nin: ['completado', 'descartado'] },
          });

          if (!existeRecordatorio && presupuesto.creadoPor) {
            const diasDesdeEnvio = Math.ceil(
              (ahora.getTime() - new Date(presupuesto.fechaEnvio).getTime()) / (1000 * 60 * 60 * 24)
            );

            await recordatoriosUnificadosService.crearSeguimientoPresupuesto(
              empresa._id.toString(),
              presupuesto.creadoPor._id?.toString() || presupuesto.creadoPor.toString(),
              {
                id: presupuesto._id.toString(),
                numero: presupuesto.numero,
                clienteNombre: presupuesto.cliente?.nombreComercial || presupuesto.cliente?.nombre || 'Cliente',
                diasDesdeEnvio,
              }
            );
            totalAlertas++;
            logger.info('  Alerta presupuesto seguimiento: ' + presupuesto.numero);
          }
        }

        // ============================================
        // FACTURAS PROXIMAS A VENCER
        // ============================================
        const fechaLimiteVencimiento = new Date();
        fechaLimiteVencimiento.setDate(fechaLimiteVencimiento.getDate() + 5);

        const facturasProximasVencer = await Factura.find({
          estado: { $in: ['emitida', 'parcialmente_cobrada'] },
          pendiente: { $gt: 0 },
          fechaVencimiento: { $lte: fechaLimiteVencimiento },
        }).populate('cliente creadoPor').lean();

        for (const factura of facturasProximasVencer as any[]) {
          const existeRecordatorio = await Recordatorio.findOne({
            empresaId: empresa._id,
            tipo: TipoRecordatorio.FACTURA_VENCIMIENTO,
            entidadId: factura._id,
            estado: { $nin: ['completado', 'descartado'] },
          });

          if (!existeRecordatorio && factura.creadoPor) {
            const diasRestantes = Math.ceil(
              (new Date(factura.fechaVencimiento).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
            );

            await recordatoriosUnificadosService.crearAlertaFacturaVencimiento(
              empresa._id.toString(),
              factura.creadoPor._id?.toString() || factura.creadoPor.toString(),
              {
                id: factura._id.toString(),
                numero: factura.numero,
                clienteNombre: factura.cliente?.nombreComercial || factura.cliente?.nombre || 'Cliente',
                fechaVencimiento: factura.fechaVencimiento,
                pendiente: factura.pendiente || factura.total || 0,
                diasRestantes,
              }
            );
            totalAlertas++;
            logger.info('  Alerta factura vencimiento: ' + factura.numero);
          }
        }

        logger.info('  Empresa procesada correctamente\n');
      } catch (empresaError: any) {
        logger.error('Error procesando empresa ' + empresa.nombre + ': ' + empresaError.message);
      }
    }

    logger.info('\nProcesamiento completado: ' + totalAlertas + ' alertas creadas\n');

  } catch (error: any) {
    logger.error('Error en procesamiento de alertas:', error.message);
    logger.error(error.stack);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('Conexion cerrada');
  }
}

// Ejecutar
if (require.main === module) {
  procesarAlertasDocumentos()
    .then(() => {
      logger.info('\nScript finalizado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\nScript finalizado con errores');
      console.error(error);
      process.exit(1);
    });
}

export default procesarAlertasDocumentos;
