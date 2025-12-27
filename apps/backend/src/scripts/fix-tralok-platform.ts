import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fixTralok() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
  const db = mongoose.connection.db!;

  // 1. Marcar TRALOK como plataforma
  const result = await db.collection('empresas').updateOne(
    { nombre: 'TRALOK S.L.' },
    { $set: { esPlatforma: true } }
  );
  console.log(`✅ TRALOK marcada como plataforma: ${result.modifiedCount} modificada`);

  // 2. Obtener el ID de TRALOK
  const tralok = await db.collection('empresas').findOne({ nombre: 'TRALOK S.L.' });
  if (tralok) {
    // 3. Eliminar relaciones duplicadas con TRALOK (mantener solo la que es esPrincipal: true)
    const relaciones = await db.collection('usuarioempresa')
      .find({ empresaId: tralok._id })
      .toArray();

    console.log(`\n📋 Relaciones con TRALOK: ${relaciones.length}`);

    // Si hay más de 1, eliminar la que no es principal
    if (relaciones.length > 1) {
      const noEsPrincipal = relaciones.filter(r => !r.esPrincipal);
      for (const rel of noEsPrincipal) {
        await db.collection('usuarioempresa').deleteOne({ _id: rel._id });
        console.log(`  🗑️  Eliminada relación duplicada`);
      }
    }
  }

  // 4. Verificar resultado final
  console.log('\n=== RESULTADO FINAL ===');
  const empresas = await db.collection('empresas').find({}).toArray();
  for (const e of empresas) {
    console.log(`${e.nombre} | esPlatforma: ${e.esPlatforma}`);
  }

  const relFinales = await db.collection('usuarioempresa').find({}).toArray();
  console.log(`\nRelaciones totales: ${relFinales.length}`);

  await mongoose.disconnect();
}

fixTralok();
