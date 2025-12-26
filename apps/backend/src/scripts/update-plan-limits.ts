import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Actualizar límites de usuarios en planes existentes
 */
async function updatePlanLimits() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB\n');

    const db = mongoose.connection.db!;

    // Actualizar Demo: 3 simultáneos, 5 totales
    const demoResult = await db.collection('plans').updateOne(
      { slug: 'demo' },
      {
        $set: {
          'limites.usuariosSimultaneos': 3,
          'limites.usuariosTotales': 5,
        }
      }
    );
    console.log(`✅ Demo actualizado: ${demoResult.modifiedCount} modificado`);

    // Actualizar Solo Fichaje: 5 simultáneos, 10 totales
    const fichajeResult = await db.collection('plans').updateOne(
      { slug: 'solo-fichaje' },
      {
        $set: {
          'limites.usuariosSimultaneos': 5,
          'limites.usuariosTotales': 10,
        }
      }
    );
    console.log(`✅ Solo Fichaje actualizado: ${fichajeResult.modifiedCount} modificado`);

    // Crear/Actualizar Starter: 1 simultáneo, 2 totales
    const starterExists = await db.collection('plans').findOne({ slug: 'starter' });
    if (!starterExists) {
      await db.collection('plans').insertOne({
        nombre: 'Starter',
        slug: 'starter',
        descripcion: 'Plan económico para autónomos que empiezan',
        precio: { mensual: 19, anual: 190 },
        limites: {
          usuariosSimultaneos: 1,
          usuariosTotales: 2,
          facturasMes: 100,
          productosCatalogo: 200,
          almacenes: 1,
          clientes: 200,
          tpvsActivos: 0,
          almacenamientoGB: 2,
          llamadasAPIDia: 1000,
          emailsMes: 200,
          smsMes: 20,
          whatsappMes: 20,
        },
        modulosIncluidos: ['clientes', 'productos', 'ventas', 'informes'],
        activo: true,
        visible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Starter creado`);
    } else {
      console.log(`ℹ️ Starter ya existe`);
    }

    // Actualizar Básico: 2 simultáneos, 10 totales
    const basicoResult = await db.collection('plans').updateOne(
      { slug: 'basico' },
      {
        $set: {
          descripcion: 'Plan ideal para autónomos y microempresas',
          'limites.usuariosSimultaneos': 2,
          'limites.usuariosTotales': 10,
          'limites.tpvsActivos': 1,
        }
      }
    );
    console.log(`✅ Básico actualizado: ${basicoResult.modifiedCount} modificado`);

    // Profesional: 15 simultáneos, 30 totales, módulos completos + api
    const profesionalResult = await db.collection('plans').updateOne(
      { slug: 'profesional' },
      {
        $set: {
          'limites.usuariosSimultaneos': 15,
          'limites.usuariosTotales': 30,
          modulosIncluidos: [
            'clientes', 'productos', 'ventas', 'compras', 'inventario',
            'informes', 'contabilidad', 'proyectos', 'crm', 'tpv',
            'rrhh', 'tesoreria', 'calendarios', 'api'
          ],
        }
      }
    );
    console.log(`✅ Profesional actualizado: ${profesionalResult.modifiedCount} modificado`);

    // Enterprise: ilimitados + módulos extra
    const enterpriseResult = await db.collection('plans').updateOne(
      { slug: 'enterprise' },
      {
        $set: {
          modulosIncluidos: [
            'clientes', 'productos', 'ventas', 'compras', 'inventario',
            'informes', 'contabilidad', 'proyectos', 'crm', 'tpv',
            'rrhh', 'restauracion', 'tesoreria', 'calendarios',
            'api', 'integraciones', 'soporte-prioritario'
          ],
        }
      }
    );
    console.log(`✅ Enterprise actualizado: ${enterpriseResult.modifiedCount} modificado`);

    // Mostrar planes actualizados
    console.log('\n📋 PLANES ACTUALIZADOS:\n');
    const planes = await db.collection('plans').find({}).toArray();
    for (const plan of planes) {
      console.log(`${plan.nombre} (${plan.slug}):`);
      console.log(`   Usuarios simultáneos: ${plan.limites.usuariosSimultaneos === -1 ? 'Ilimitados' : plan.limites.usuariosSimultaneos}`);
      console.log(`   Usuarios totales: ${plan.limites.usuariosTotales === -1 ? 'Ilimitados' : plan.limites.usuariosTotales}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updatePlanLimits();
