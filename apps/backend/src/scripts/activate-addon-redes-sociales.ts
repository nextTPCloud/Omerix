import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function activateAddon() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB\n');

    const db = mongoose.connection.db!;

    // Buscar la licencia de Empresa 2 que tiene el add-on pendiente
    const licencia = await db.collection('licencias').findOne({
      addOnsPendientes: 'redes-sociales'
    });

    if (!licencia) {
      console.log('No se encontro licencia con redes-sociales pendiente');
      return;
    }

    // Obtener datos del add-on
    const addon = await db.collection('addons').findOne({ slug: 'redes-sociales' });

    if (!addon) {
      console.log('No se encontro el add-on redes-sociales');
      return;
    }

    console.log('Licencia encontrada:', licencia._id);
    console.log('Add-on a activar:', addon.nombre);

    // Verificar si ya existe el add-on activo
    const existeActivo = licencia.addOns?.some(
      (a: any) => a.slug === 'redes-sociales' && a.activo
    );

    if (existeActivo) {
      console.log('El add-on ya esta activo');
      return;
    }

    // Activar el add-on
    const nuevoAddOn = {
      addOnId: addon._id,
      nombre: addon.nombre,
      slug: addon.slug,
      cantidad: 1,
      precioMensual: addon.precio?.mensual || 0,
      activo: true,
      fechaActivacion: new Date(),
    };

    await db.collection('licencias').updateOne(
      { _id: licencia._id },
      {
        $push: {
          addOns: nuevoAddOn,
          historial: {
            fecha: new Date(),
            accion: 'ACTIVACION_ADDON',
            motivo: 'Add-on Redes Sociales activado manualmente',
          }
        },
        $pull: { addOnsPendientes: 'redes-sociales' },
        $unset: { paypalOrderId: '' }
      }
    );

    // Actualizar el pago a completado
    await db.collection('pagos').updateOne(
      { transaccionExternaId: licencia.paypalOrderId },
      {
        $set: {
          estado: 'completado',
          fechaPago: new Date(),
          estadoDetalle: 'Pago activado manualmente'
        }
      }
    );

    console.log('\n✅ Add-on de Redes Sociales activado correctamente!');
    console.log('El modulo ahora deberia aparecer en el menu.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

activateAddon();
