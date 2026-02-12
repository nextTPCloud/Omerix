/**
 * Script para limpiar todas las sesiones de una empresa
 * Uso: npx tsx src/scripts/limpiar-sesiones.ts [empresaId]
 *
 * Si no se proporciona empresaId, limpia TODAS las sesiones
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Importar modelos despues de cargar dotenv
import RefreshToken from '../modules/auth/RefreshToken';
import UsuarioEmpresa from '../modules/usuarios/UsuarioEmpresa';

async function limpiarSesiones() {
  const empresaId = process.argv[2];

  console.log('🧹 Script de limpieza de sesiones');
  console.log('================================');

  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tralok';
    console.log(`📡 Conectando a MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    if (empresaId) {
      // Limpiar sesiones de una empresa especifica
      console.log(`\n🏢 Limpiando sesiones de empresa: ${empresaId}`);

      // Obtener usuarios de la empresa
      const usuariosEmpresa = await UsuarioEmpresa.find({
        empresaId: new mongoose.Types.ObjectId(empresaId),
      }).select('usuarioId');

      const userIds = usuariosEmpresa.map(ue => ue.usuarioId);
      console.log(`   Usuarios encontrados: ${userIds.length}`);

      // Contar sesiones antes
      const sesionesBefore = await RefreshToken.countDocuments({
        userId: { $in: userIds },
        isRevoked: false,
      });
      console.log(`   Sesiones activas antes: ${sesionesBefore}`);

      // Revocar todas las sesiones
      const result = await RefreshToken.updateMany(
        {
          userId: { $in: userIds },
          isRevoked: false,
        },
        {
          $set: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'manual_cleanup',
          },
        }
      );

      console.log(`   ✅ Sesiones revocadas: ${result.modifiedCount}`);
    } else {
      // Limpiar TODAS las sesiones
      console.log(`\n⚠️  Limpiando TODAS las sesiones del sistema...`);

      const sesionesBefore = await RefreshToken.countDocuments({ isRevoked: false });
      console.log(`   Sesiones activas antes: ${sesionesBefore}`);

      const result = await RefreshToken.updateMany(
        { isRevoked: false },
        {
          $set: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'manual_cleanup_all',
          },
        }
      );

      console.log(`   ✅ Sesiones revocadas: ${result.modifiedCount}`);
    }

    console.log('\n🎉 Limpieza completada. Ya puedes iniciar sesion.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

limpiarSesiones();
