import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkRelaciones() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix');
    console.log('Conectado a MongoDB\n');

    const db = mongoose.connection.db!;

    console.log('=== RELACIONES USUARIO-EMPRESA ===');
    const relaciones = await db.collection('usuarioempresa').find({}).toArray();
    console.log('Total relaciones:', relaciones.length);

    for (const rel of relaciones) {
      const usuario = await db.collection('usuarios').findOne({ _id: rel.usuarioId });
      const empresa = await db.collection('empresas').findOne({ _id: rel.empresaId });
      console.log('');
      console.log('  Usuario:', usuario?.email || 'NO ENCONTRADO');
      console.log('  Empresa:', empresa?.nombre || 'NO ENCONTRADA', `(${rel.empresaId})`);
      console.log('  Rol:', rel.rol);
      console.log('  Principal:', rel.esPrincipal);
      console.log('  Activo:', rel.activo);
    }

    // Verificar empresas del usuario paco.tugores
    console.log('\n=== EMPRESAS DE paco.tugores@gmail.com ===');
    const paco = await db.collection('usuarios').findOne({ email: 'paco.tugores@gmail.com' });
    if (paco) {
      const empresasPaco = await db.collection('usuarioempresa')
        .find({ usuarioId: paco._id, activo: true })
        .toArray();

      console.log('Total empresas:', empresasPaco.length);
      for (const ue of empresasPaco) {
        const emp = await db.collection('empresas').findOne({ _id: ue.empresaId });
        console.log(`  - ${emp?.nombre || 'NO ENCONTRADA'} (${ue.empresaId}) - ${emp?.esPlatforma ? 'PLATAFORMA' : 'NEGOCIO'}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkRelaciones();
