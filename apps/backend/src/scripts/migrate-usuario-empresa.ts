/**
 * Script de migración para crear relaciones UsuarioEmpresa
 * para empresas existentes que no las tienen
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function migrateUsuarioEmpresa() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB\n');

    const db = mongoose.connection.db!;

    // 1. Obtener todos los usuarios
    const usuarios = await db.collection('usuarios').find({}).toArray();
    console.log(`📋 Total usuarios: ${usuarios.length}`);

    // 2. Obtener todas las empresas
    const empresas = await db.collection('empresas').find({}).toArray();
    console.log(`🏢 Total empresas: ${empresas.length}`);

    // 3. Obtener relaciones existentes
    const relacionesExistentes = await db.collection('usuarioempresa').find({}).toArray();
    console.log(`🔗 Relaciones existentes: ${relacionesExistentes.length}\n`);

    let creadas = 0;

    for (const usuario of usuarios) {
      console.log(`\n👤 Procesando usuario: ${usuario.email}`);

      // Verificar si es superadmin (tienen acceso a todas las empresas de negocio)
      if (usuario.rol === 'superadmin') {
        // Para superadmin, crear relación con la empresa plataforma si tiene empresaId
        if (usuario.empresaId) {
          const existeRelacion = relacionesExistentes.find(
            (r) => r.usuarioId?.toString() === usuario._id?.toString() &&
                   r.empresaId?.toString() === usuario.empresaId?.toString()
          );

          if (!existeRelacion) {
            await db.collection('usuarioempresa').insertOne({
              usuarioId: usuario._id,
              empresaId: usuario.empresaId,
              rol: 'admin',
              esPrincipal: true,
              activo: true,
              fechaAsignacion: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            console.log(`  ✅ Relación creada con empresa plataforma: ${usuario.empresaId}`);
            creadas++;
          } else {
            console.log(`  ⏭️  Ya tiene relación con empresa plataforma`);
          }
        }

        // También dar acceso a todas las empresas de negocio (no plataforma)
        for (const empresa of empresas) {
          if (empresa.esPlatforma) continue;

          const existeRelacion = relacionesExistentes.find(
            (r) => r.usuarioId?.toString() === usuario._id?.toString() &&
                   r.empresaId?.toString() === empresa._id?.toString()
          );

          if (!existeRelacion) {
            await db.collection('usuarioempresa').insertOne({
              usuarioId: usuario._id,
              empresaId: empresa._id,
              rol: 'admin',
              esPrincipal: false,
              activo: true,
              fechaAsignacion: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            console.log(`  ✅ Relación creada con empresa: ${empresa.nombre}`);
            creadas++;
          }
        }
      } else {
        // Para usuarios normales, crear relación solo con su empresaId
        if (usuario.empresaId) {
          const existeRelacion = relacionesExistentes.find(
            (r) => r.usuarioId?.toString() === usuario._id?.toString() &&
                   r.empresaId?.toString() === usuario.empresaId?.toString()
          );

          if (!existeRelacion) {
            const empresa = empresas.find(
              (e) => e._id?.toString() === usuario.empresaId?.toString()
            );

            await db.collection('usuarioempresa').insertOne({
              usuarioId: usuario._id,
              empresaId: usuario.empresaId,
              rol: usuario.rol || 'empleado',
              esPrincipal: true,
              activo: true,
              fechaAsignacion: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            console.log(`  ✅ Relación creada con empresa: ${empresa?.nombre || usuario.empresaId}`);
            creadas++;
          } else {
            console.log(`  ⏭️  Ya tiene relación`);
          }
        }
      }
    }

    console.log(`\n\n========================================`);
    console.log(`✅ Migración completada`);
    console.log(`   Relaciones creadas: ${creadas}`);
    console.log(`========================================\n`);

    // Verificar resultado final
    const relacionesFinales = await db.collection('usuarioempresa').find({}).toArray();
    console.log(`📊 Total relaciones ahora: ${relacionesFinales.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateUsuarioEmpresa();
