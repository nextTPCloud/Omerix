import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Licencia from '../modules/licencias/Licencia';
import Empresa from '../modules/empresa/Empresa';

async function check() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omerix';
    console.log('Conectando a:', mongoUri.substring(0, 30) + '...');
    await mongoose.connect(mongoUri);

    console.log('\nLicencias:');
    const licencias = await Licencia.find().lean();
    if (licencias.length === 0) {
      console.log('  (ninguna)');
    } else {
      for (const l of licencias) {
        console.log('  - ID:', l._id);
        console.log('    empresaId:', l.empresaId);
      }
    }

    console.log('\nEmpresas:');
    const empresas = await Empresa.find().lean();
    if (empresas.length === 0) {
      console.log('  (ninguna)');
    } else {
      for (const e of empresas) {
        console.log('  - ID:', e._id);
        console.log('    nombre:', e.nombre);
        console.log('    databaseConfig:', e.databaseConfig ? 'existe' : 'no definido');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

check();
